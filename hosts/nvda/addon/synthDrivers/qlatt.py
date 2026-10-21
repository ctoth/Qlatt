# Qlatt synthesizer driver for NVDA.
#
# Drives scripts/speak-server.ts in the Qlatt checkout over stdin/stdout. The
# server renders text to 16-bit PCM and returns word/index markers. The driver
# keeps indexes within one render until a rate/pitch boundary, then raises
# index notifications from nvwave playback callbacks at their sample positions.
#
# Configuration is a JSON file next to this driver, qlatt.json:
#   {"repo": "C:\\path\\to\\Qlatt", "node": "node", "frontend": "qlatt-english"}
# NVDA rewrites nvda.ini from memory on exit and drops sections no loaded
# module has declared, so a sidecar file is the reliable place for these paths.
# Values in nvda.ini under [qlatt] override the sidecar when present.
#
# Status: written against the NVDA 2025.3 synthDriverHandler and nvwave APIs
# (source read at release-2025.3) and verified against the server with
# hosts/nvda/test_protocol.py. Live-NVDA status is in hosts/nvda/README.md.

import base64
import json
import os
import subprocess
import threading
from collections import OrderedDict

import config
import nvwave
from logHandler import log
from speech.commands import (
    BreakCommand,
    CharacterModeCommand,
    IndexCommand,
    PitchCommand,
    RateCommand,
)
from synthDriverHandler import SynthDriver, VoiceInfo, synthDoneSpeaking, synthIndexReached

CONFIG_SPEC = {
    "repo": "string(default='')",
    "node": "string(default='node')",
    "frontend": "string(default='qlatt-english')",
}

SAMPLE_RATE = 22050

# Register the section at import so check() can read it before any instance exists.
config.conf.spec["qlatt"] = CONFIG_SPEC

SIDECAR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "qlatt.json")


def load_settings():
    """Sidecar JSON first, then non-empty nvda.ini [qlatt] values on top."""
    settings = {"repo": "", "node": "node", "frontend": "qlatt-english"}
    try:
        with open(SIDECAR, "r", encoding="utf-8") as handle:
            settings.update({k: v for k, v in json.load(handle).items() if isinstance(v, str)})
    except FileNotFoundError:
        pass
    except Exception:
        log.error("qlatt: could not read %s", SIDECAR, exc_info=True)
    try:
        section = config.conf["qlatt"]
        for key in settings:
            value = section.get(key, "")
            if isinstance(value, str) and value:
                settings[key] = value
    except Exception:
        pass
    return settings


class QlattServer:
    """One speak-server process; requests are serialized by the caller."""

    def __init__(self, node, repo):
        script = os.path.join(repo, "scripts", "speak-server.ts")
        if not os.path.isfile(script):
            raise FileNotFoundError(script)
        self.process = subprocess.Popen(
            [
                node,
                "--loader",
                "ts-node/esm/transpile-only",
                "--experimental-specifier-resolution=node",
                script,
            ],
            cwd=repo,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            encoding="utf-8",
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        self._next_id = 0

    def request(self, op, **fields):
        self._next_id += 1
        message = dict(fields, id=self._next_id, op=op)
        self.process.stdin.write(json.dumps(message) + "\n")
        self.process.stdin.flush()
        events = []
        while True:
            line = self.process.stdout.readline()
            if not line:
                raise RuntimeError("qlatt speak-server exited")
            event = json.loads(line)
            if event.get("id") != self._next_id:
                continue
            events.append(event)
            if event.get("event") in ("done", "error", "hello"):
                return events

    def speak(self, text, frontend, rate, pitch_scale, lead_time=None, tail_time=None, indexes=None):
        padding = {}
        if lead_time is not None:
            padding["leadTime"] = lead_time
        if tail_time is not None:
            padding["tailTime"] = tail_time
        if indexes:
            padding["indexes"] = indexes
        events = self.request(
            "speak", text=text, frontendId=frontend, rate=rate, pitchScale=pitch_scale,
            **padding,
        )
        for event in events:
            if event.get("event") == "error":
                raise RuntimeError(event.get("message", "render failed"))
        audio = next(event for event in events if event.get("event") == "audio")
        pcm = base64.b64decode(audio["pcm"])
        return pcm, audio.get("markers", []), int(audio.get("sampleRate", SAMPLE_RATE))

    def close(self):
        try:
            self.process.stdin.write(json.dumps({"op": "quit"}) + "\n")
            self.process.stdin.flush()
        except OSError:
            pass
        try:
            self.process.wait(timeout=2)
        except subprocess.TimeoutExpired:
            self.process.kill()


class SynthDriver(SynthDriver):
    name = "qlatt"
    description = "Qlatt (explainable Klatt formant synthesizer)"

    supportedSettings = (
        SynthDriver.VoiceSetting(),
        SynthDriver.RateSetting(),
        SynthDriver.PitchSetting(),
    )
    supportedCommands = {IndexCommand, RateCommand, PitchCommand, BreakCommand, CharacterModeCommand}
    supportedNotifications = {synthIndexReached, synthDoneSpeaking}

    @classmethod
    def check(cls):
        # getSynthList only logs a failed check at debugWarning, so say why at info.
        settings = load_settings()
        script = os.path.join(settings["repo"], "scripts", "speak-server.ts")
        if not os.path.isfile(script):
            log.info("qlatt: speak server not found at %s (configure %s)", script, SIDECAR)
            return False
        return True

    def __init__(self):
        super().__init__()
        settings = load_settings()
        self._voice = settings["frontend"]
        self._rate = 50
        self._pitch = 50
        self._server = QlattServer(settings["node"], settings["repo"])
        hello = self._server.request("hello")[-1]
        self._voices = OrderedDict(
            (frontend, VoiceInfo(frontend, frontend)) for frontend in hello.get("frontends", [self._voice])
        )
        # NVDA 2025.3 nvwave.WavePlayer(channels, samplesPerSec, bitsPerSample,
        # outputDevice=DEFAULT_DEVICE_KEY, wantDucking=True, purpose=SPEECH).
        self._player = nvwave.WavePlayer(channels=1, samplesPerSec=SAMPLE_RATE, bitsPerSample=16)
        self._lock = threading.Lock()
        self._cancelled = threading.Event()
        self._thread = None

    def terminate(self):
        self.cancel()
        self._player.close()
        self._server.close()

    # --- settings -------------------------------------------------------

    def _get_availableVoices(self):
        return self._voices

    def _get_voice(self):
        return self._voice

    def _set_voice(self, value):
        if value in self._voices:
            self._voice = value

    def _get_rate(self):
        return self._rate

    def _set_rate(self, value):
        self._rate = max(0, min(100, int(value)))

    def _get_pitch(self):
        return self._pitch

    def _set_pitch(self, value):
        self._pitch = max(0, min(100, int(value)))

    def _rate_scale(self, rate_setting):
        # 0..100 slider -> 0.5x .. 2.0x, neutral at 50 (matches the frontend's
        # rate clamp, see params.policy.rate in the qlatt-english rulepack).
        return 2.0 ** ((rate_setting - 50) / 50.0)

    def _pitch_scale(self, pitch_setting):
        # 0..100 slider -> one octave down to one octave up around the
        # selected frontend's own voice, neutral at 50: a ratio of that voice's
        # base pitch, not a pitch in Hz (speak-server's "pitchScale"). The
        # octave each way is an engineering estimate, the same mapping as rate.
        return 2.0 ** ((pitch_setting - 50) / 50.0)

    # --- speaking -------------------------------------------------------

    def speak(self, speechSequence):
        chunks = []  # (text, UTF-16 index requests, rate_setting, pitch_setting)
        text_parts = []
        indexes = []
        rate_setting = self._rate
        pitch_setting = self._pitch

        def flush():
            text = "".join(text_parts)
            text_parts.clear()
            if text or indexes:
                chunks.append((text, list(indexes), rate_setting, pitch_setting))
            indexes.clear()

        for item in speechSequence:
            if isinstance(item, str):
                text_parts.append(item)
            elif isinstance(item, IndexCommand):
                # Python counts code points; the server's raw Source offsets are UTF-16.
                offset = len("".join(text_parts).encode("utf-16-le", "surrogatepass")) // 2
                indexes.append({"index": item.index, "offset": offset})
            elif isinstance(item, RateCommand):
                flush()
                rate_setting = max(0, min(100, self._rate + item.offset))
            elif isinstance(item, PitchCommand):
                flush()
                pitch_setting = max(0, min(100, self._pitch + item.offset))
            elif isinstance(item, BreakCommand):
                text_parts.append(", ")
            elif isinstance(item, CharacterModeCommand):
                pass
        flush()
        self.cancel()
        # Each worker keeps its own event: replacing speech must not revive an
        # older worker that is still waiting for its render or playback.
        cancelled = threading.Event()
        self._cancelled = cancelled
        self._thread = threading.Thread(target=self._speak_chunks, args=(chunks, cancelled), daemon=True)
        self._thread.start()

    def _speak_chunks(self, chunks, cancelled):
        with self._lock:
            # Index-only chunks do not render, so they cannot own padding.
            spoken_chunks = [position for position, chunk in enumerate(chunks) if chunk[0]]
            for position, (text, indexes, rate_setting, pitch_setting) in enumerate(chunks):
                if cancelled.is_set():
                    break
                if text:
                    try:
                        pcm, markers, sample_rate = self._server.speak(
                            text, self._voice, self._rate_scale(rate_setting), self._pitch_scale(pitch_setting),
                            None if position == spoken_chunks[0] else 0,
                            None if position == spoken_chunks[-1] else 0,
                            indexes,
                        )
                    except Exception:
                        log.exception("qlatt render failed for %r", text)
                        pcm = b""
                    if pcm and not cancelled.is_set():
                        cursor = 0
                        index_markers = [marker for marker in markers if marker["kind"] == "index"]
                        marker_position = 0
                        while marker_position < len(index_markers) and not cancelled.is_set():
                            sample = index_markers[marker_position]["sample"]
                            reached = []
                            while (marker_position < len(index_markers)
                                   and index_markers[marker_position]["sample"] == sample):
                                reached.append(index_markers[marker_position]["index"])
                                marker_position += 1
                            end = sample * 2  # The server returns mono s16le PCM.
                            self._player.feed(
                                pcm[cursor:end],
                                onDone=lambda reached=tuple(reached): self._notify_indexes(reached, cancelled),
                            )
                            cursor = end
                        if cursor < len(pcm) and not cancelled.is_set():
                            self._player.feed(pcm[cursor:])
                        continue
                if indexes and not cancelled.is_set():
                    # Index-only input (or a failed render) retains its after-queued-audio behavior.
                    self._player.sync()
                    self._notify_indexes([entry["index"] for entry in indexes], cancelled)
            if not cancelled.is_set():
                self._player.idle()
                if not cancelled.is_set():
                    synthDoneSpeaking.notify(synth=self)

    def _notify_indexes(self, indexes, cancelled):
        for index in indexes:
            if cancelled.is_set():
                break
            synthIndexReached.notify(synth=self, index=index)

    def cancel(self):
        self._cancelled.set()
        self._player.stop()

    def pause(self, switch):
        self._player.pause(switch)

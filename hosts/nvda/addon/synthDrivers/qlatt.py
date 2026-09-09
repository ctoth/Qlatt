# Qlatt synthesizer driver for NVDA.
#
# Drives scripts/speak-server.ts in the Qlatt checkout over stdin/stdout. The
# server renders each text chunk to 16-bit PCM and returns word-boundary
# markers; this driver plays the PCM through nvwave and raises NVDA's index
# notifications as playback passes each IndexCommand.
#
# Configuration lives in the NVDA config under [qlatt]:
#   repo   = C:\path\to\Qlatt        (checkout containing scripts/speak-server.ts)
#   node   = node                    (node executable; must be on PATH if bare)
#   frontend = qlatt-english         (default voice)
#
# Status: written against the NVDA 2024 synthDriverHandler API and verified
# against the server with hosts/nvda/test_protocol.py. It has not yet been
# loaded inside a running NVDA; see hosts/nvda/README.md.

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

BASE_F0_HZ = 110.0
SAMPLE_RATE = 22050


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

    def speak(self, text, frontend, rate, base_f0):
        events = self.request("speak", text=text, frontendId=frontend, rate=rate, baseF0=base_f0)
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
        section = config.conf.get("qlatt") or {}
        repo = section.get("repo", "")
        return bool(repo) and os.path.isfile(os.path.join(repo, "scripts", "speak-server.ts"))

    def __init__(self):
        super().__init__()
        config.conf.spec["qlatt"] = CONFIG_SPEC
        section = config.conf["qlatt"]
        self._voice = section["frontend"]
        self._rate = 50
        self._pitch = 50
        self._server = QlattServer(section["node"], section["repo"])
        hello = self._server.request("hello")[-1]
        self._voices = OrderedDict(
            (frontend, VoiceInfo(frontend, frontend)) for frontend in hello.get("frontends", [self._voice])
        )
        self._player = nvwave.WavePlayer(
            channels=1,
            samplesPerSec=SAMPLE_RATE,
            bitsPerSample=16,
            outputDevice=config.conf["audio"]["outputDevice"],
        )
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

    def _base_f0(self, pitch_setting):
        # 0..100 slider -> one octave down to one octave up around 110 Hz.
        return BASE_F0_HZ * (2.0 ** ((pitch_setting - 50) / 50.0))

    # --- speaking -------------------------------------------------------

    def speak(self, speechSequence):
        chunks = []  # (text, index_after_chunk, rate_setting, pitch_setting)
        text_parts = []
        rate_setting = self._rate
        pitch_setting = self._pitch
        pending_index = None

        def flush(index=None):
            text = "".join(text_parts).strip()
            text_parts.clear()
            if text or index is not None:
                chunks.append((text, index, rate_setting, pitch_setting))

        for item in speechSequence:
            if isinstance(item, str):
                text_parts.append(item)
            elif isinstance(item, IndexCommand):
                flush(item.index)
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
        self._cancelled.clear()
        self._thread = threading.Thread(target=self._speak_chunks, args=(chunks,), daemon=True)
        self._thread.start()

    def _speak_chunks(self, chunks):
        with self._lock:
            for text, index, rate_setting, pitch_setting in chunks:
                if self._cancelled.is_set():
                    break
                if text:
                    try:
                        pcm, markers, sample_rate = self._server.speak(
                            text, self._voice, self._rate_scale(rate_setting), self._base_f0(pitch_setting)
                        )
                    except Exception:
                        log.exception("qlatt render failed for %r", text)
                        pcm = b""
                    if pcm and not self._cancelled.is_set():
                        self._player.feed(pcm)
                if index is not None and not self._cancelled.is_set():
                    # Raise the index once everything queued so far has played.
                    self._player.sync()
                    synthIndexReached.notify(synth=self, index=index)
            if not self._cancelled.is_set():
                self._player.idle()
                synthDoneSpeaking.notify(synth=self)

    def cancel(self):
        self._cancelled.set()
        self._player.stop()

    def pause(self, switch):
        self._player.pause(switch)

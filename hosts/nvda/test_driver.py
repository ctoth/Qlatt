"""Exercise padding and cancellation in the actual driver without NVDA or audio hardware."""

import importlib.util
import pathlib
import sys
import threading
import types
import unittest
from unittest.mock import Mock, patch


class BaseDriver:
    VoiceSetting = RateSetting = PitchSetting = staticmethod(lambda: None)


class Command:
    def __init__(self, index):
        self.index = index
        self.offset = index


commands = types.SimpleNamespace(**{
    name: type(name, (Command,), {})
    for name in ("IndexCommand", "RateCommand", "PitchCommand", "BreakCommand", "CharacterModeCommand")
})
notifications = types.SimpleNamespace(
    SynthDriver=BaseDriver, VoiceInfo=Mock(),
    synthDoneSpeaking=Mock(), synthIndexReached=Mock(),
)
modules = {
    "config": types.SimpleNamespace(conf=types.SimpleNamespace(spec={})),
    "nvwave": types.SimpleNamespace(),
    "logHandler": types.SimpleNamespace(log=Mock()),
    "speech": types.SimpleNamespace(commands=commands),
    "speech.commands": commands,
    "synthDriverHandler": notifications,
}
spec = importlib.util.spec_from_file_location(
    "qlatt_driver_under_test", pathlib.Path(__file__).parent / "addon/synthDrivers/qlatt.py",
)
driver_module = importlib.util.module_from_spec(spec)
with patch.dict(sys.modules, modules):
    spec.loader.exec_module(driver_module)


class CancellationTests(unittest.TestCase):
    def setUp(self):
        self.driver = driver_module.SynthDriver.__new__(driver_module.SynthDriver)
        self.driver._rate = self.driver._pitch = 50
        self.driver._voice = "qlatt-english"
        self.driver._cancelled = threading.Event()
        self.driver._lock = threading.Lock()
        self.driver._player = Mock()
        self.driver._server = Mock()
        def render(text, frontend, rate, pitch, lead, tail, indexes):
            return b"pcm!", [dict(kind="index", index=entry["index"], sample=2) for entry in indexes], 22050

        self.render = render
        self.driver._server.speak.side_effect = render
        self.driver._player.feed.side_effect = lambda data, onDone=None: onDone() if onDone else None
        notifications.synthIndexReached.reset_mock()
        notifications.synthDoneSpeaking.reset_mock()
        self.workers = []

        def thread(*, target, args, daemon):
            self.workers.append(lambda: target(*args))
            return types.SimpleNamespace(start=lambda: None)

        self.threads = patch.object(driver_module.threading, "Thread", side_effect=thread)
        self.threads.start()
        self.addCleanup(self.threads.stop)

    def speak(self, text, index):
        self.driver.speak([text, commands.IndexCommand(index)])

    def test_three_indexes_share_one_render_and_keep_equal_sample_order(self):
        self.driver.speak([
            commands.IndexCommand(0), "one ", commands.IndexCommand(1),
            "two ", commands.IndexCommand(2), "three", commands.IndexCommand(3),
            commands.IndexCommand(4),
        ])
        self.workers[0]()
        self.driver._server.speak.assert_called_once_with(
            "one two three", "qlatt-english", 1.0, 1.0, None, None,
            [{"index": index, "offset": offset} for index, offset in enumerate([0, 4, 8, 13, 13])],
        )
        self.driver._player.feed.assert_called_once()
        self.assertEqual(
            [call.kwargs["index"] for call in notifications.synthIndexReached.notify.call_args_list],
            [0, 1, 2, 3, 4],
        )

    def test_single_spoken_chunk_keeps_both_padding_values(self):
        self.speak("only", 1)
        self.workers[0]()
        self.driver._server.speak.assert_called_once_with(
            "only", "qlatt-english", 1.0, 1.0, None, None, [{"index": 1, "offset": 4}],
        )

    def test_utf16_offsets_preserve_astral_text_and_whitespace(self):
        self.driver.speak([" 😀 ", commands.IndexCommand(7), "hello", commands.IndexCommand(8)])
        self.workers[0]()
        self.driver._server.speak.assert_called_once_with(
            " 😀 hello", "qlatt-english", 1.0, 1.0, None, None,
            [{"index": 7, "offset": 4}, {"index": 8, "offset": 9}],
        )

    def test_rate_pitch_boundaries_keep_settings_and_exterior_padding(self):
        self.driver.speak([
            "one", commands.IndexCommand(1), commands.RateCommand(50),
            "two", commands.IndexCommand(2), commands.PitchCommand(-50),
            "three", commands.IndexCommand(3),
        ])
        self.workers[0]()
        self.assertEqual(self.driver._server.speak.call_args_list, [
            unittest.mock.call("one", "qlatt-english", 1.0, 1.0, None, 0, [{"index": 1, "offset": 3}]),
            unittest.mock.call("two", "qlatt-english", 2.0, 1.0, 0, 0, [{"index": 2, "offset": 3}]),
            unittest.mock.call("three", "qlatt-english", 2.0, 0.5, 0, None, [{"index": 3, "offset": 5}]),
        ])

    def test_index_only_sequence_does_not_render(self):
        self.driver.speak([commands.IndexCommand(1), commands.IndexCommand(2)])
        self.workers[0]()
        self.driver._server.speak.assert_not_called()
        self.assertEqual(
            [call.kwargs["index"] for call in notifications.synthIndexReached.notify.call_args_list],
            [1, 2],
        )

    def test_server_adapter_forwards_padding_and_indexes(self):
        server = driver_module.QlattServer.__new__(driver_module.QlattServer)
        server.request = Mock(return_value=[{"event": "audio", "pcm": "", "sampleRate": 22050}])
        indexes = [{"index": 9, "offset": 4}]
        server.speak("text", "qlatt-english", 1, 1, 0, None, indexes)
        server.request.assert_called_once_with(
            "speak", text="text", frontendId="qlatt-english", rate=1, pitchScale=1,
            leadTime=0, indexes=indexes,
        )
        server.request.reset_mock()
        server.speak("text", "qlatt-english", 1, 1)
        server.request.assert_called_once_with(
            "speak", text="text", frontendId="qlatt-english", rate=1, pitchScale=1,
        )

    def test_replacement_while_rendering_discards_old_pcm_and_notifications(self):
        self.speak("old", 1)
        old_cancelled = self.driver._cancelled

        def render(*args):
            self.speak("new", 2)
            return b"old", [], 22050

        self.driver._server.speak.side_effect = render
        self.workers[0]()
        self.assertTrue(old_cancelled.is_set())
        self.assertIsNot(old_cancelled, self.driver._cancelled)
        self.driver._player.feed.assert_not_called()
        notifications.synthIndexReached.notify.assert_not_called()
        notifications.synthDoneSpeaking.notify.assert_not_called()
        self.driver._server.speak.side_effect = self.render
        self.workers[1]()
        self.assertEqual(self.driver._player.feed.call_args.args, (b"pcm!",))
        notifications.synthIndexReached.notify.assert_called_once_with(synth=self.driver, index=2)
        notifications.synthDoneSpeaking.notify.assert_called_once_with(synth=self.driver)

    def test_queued_old_worker_does_not_render_after_replacement(self):
        self.speak("old", 1)
        self.speak("new", 2)
        self.workers[0]()
        self.driver._server.speak.assert_not_called()
        notifications.synthDoneSpeaking.notify.assert_not_called()

    def test_cancel_during_sync_suppresses_index_and_done(self):
        self.driver.speak([commands.IndexCommand(1)])
        self.driver._player.sync.side_effect = self.driver.cancel
        self.workers[0]()
        self.driver._player.feed.assert_not_called()
        notifications.synthIndexReached.notify.assert_not_called()
        notifications.synthDoneSpeaking.notify.assert_not_called()

    def test_cancel_during_idle_suppresses_done(self):
        self.speak("old", 1)
        self.driver._player.idle.side_effect = self.driver.cancel
        self.workers[0]()
        notifications.synthIndexReached.notify.assert_called_once_with(synth=self.driver, index=1)
        notifications.synthDoneSpeaking.notify.assert_not_called()

    def test_pcm_is_split_at_markers_and_replaced_callbacks_are_suppressed(self):
        self.driver._server.speak.side_effect = None
        self.driver._server.speak.return_value = (
            b"01234567", [
                {"kind": "word", "word": "one", "sample": 0},
                {"kind": "index", "index": 1, "sample": 0},
                {"kind": "index", "index": 2, "sample": 2},
                {"kind": "index", "index": 3, "sample": 2},
            ], 22050,
        )
        callbacks = []
        self.driver._player.feed.side_effect = lambda data, onDone=None: callbacks.append(onDone) if onDone else None
        self.driver._player.idle.side_effect = lambda: None
        self.driver.speak(["one", commands.IndexCommand(1), commands.IndexCommand(2), commands.IndexCommand(3)])
        self.workers[0]()
        self.assertEqual([call.args[0] for call in self.driver._player.feed.call_args_list], [b"", b"0123", b"4567"])
        notifications.synthIndexReached.notify.assert_not_called()
        callbacks[0]()
        notifications.synthIndexReached.notify.assert_called_once_with(synth=self.driver, index=1)
        self.speak("replacement", 4)
        callbacks[1]()
        notifications.synthIndexReached.notify.assert_called_once_with(synth=self.driver, index=1)


if __name__ == "__main__":
    unittest.main()

"""Exercise scripts/speak-server.ts the way the NVDA driver does, without NVDA.

    python hosts/nvda/test_protocol.py --repo . --out hello.wav [--text "..."] [--frontend qlatt-english]

Spawns the server, sends hello and one speak request, checks the response
shape, and writes the PCM to a WAV so the result can be listened to.
"""

import argparse
import base64
import json
import os
import subprocess
import sys
import wave


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=".")
    parser.add_argument("--out", default="qlatt-protocol-test.wav")
    parser.add_argument("--text", default="Hello world. This is Qlatt speaking through NVDA.")
    parser.add_argument("--frontend", default="qlatt-english")
    parser.add_argument("--node", default="node")
    args = parser.parse_args()

    repo = os.path.abspath(args.repo)
    script = os.path.join(repo, "scripts", "speak-server.ts")
    if not os.path.isfile(script):
        print(f"missing {script}", file=sys.stderr)
        return 2
    process = subprocess.Popen(
        [args.node, "--loader", "ts-node/esm/transpile-only", "--experimental-specifier-resolution=node", script],
        cwd=repo,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
        encoding="utf-8",
    )
    assert process.stdin is not None and process.stdout is not None

    def request(message):
        process.stdin.write(json.dumps(message) + "\n")
        process.stdin.flush()
        events = []
        while True:
            line = process.stdout.readline()
            if not line:
                raise RuntimeError("server exited")
            event = json.loads(line)
            events.append(event)
            if event.get("event") in ("done", "error", "hello"):
                return events

    hello = request({"id": 1, "op": "hello"})[-1]
    assert hello["event"] == "hello", hello
    assert args.frontend in hello["frontends"], hello["frontends"]

    events = request({"id": 2, "op": "speak", "text": args.text, "frontendId": args.frontend})
    kinds = [event["event"] for event in events]
    assert kinds == ["audio", "done"], kinds
    audio = events[0]
    pcm = base64.b64decode(audio["pcm"])
    assert len(pcm) == audio["samples"] * 2, (len(pcm), audio["samples"])
    markers = audio["markers"]
    assert markers and all(markers[i]["sample"] < markers[i + 1]["sample"] for i in range(len(markers) - 1))
    assert markers[-1]["sample"] < audio["samples"]

    request({"op": "quit"}) if False else None
    process.stdin.write(json.dumps({"op": "quit"}) + "\n")
    process.stdin.flush()
    process.wait(timeout=10)

    with wave.open(args.out, "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(audio["sampleRate"])
        out.writeframes(pcm)
    seconds = audio["samples"] / audio["sampleRate"]
    print(f"ok: {audio['samples']} samples ({seconds:.2f} s), {len(markers)} word markers -> {args.out}")
    for marker in markers:
        print(f"  {marker['sample'] / audio['sampleRate']:.3f}s {marker['word']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

import { spawn } from "node:child_process";
import { once } from "node:events";
import readline from "node:readline";
import { describe, expect, it } from "vitest";
import { wordMarkers } from "../scripts/speak-server";

// Protocol pin for scripts/speak-server.ts, the stdio surface that
// hosts/nvda and other external hosts drive.

type Event = Record<string, unknown> & { id?: number; event: string };

async function withServer<T>(body: (send: (message: object) => Promise<Event[]>) => Promise<T>) {
  const child = spawn(
    process.execPath,
    [
      "--loader",
      "ts-node/esm/transpile-only",
      "--experimental-specifier-resolution=node",
      "scripts/speak-server.ts",
    ],
    { stdio: ["pipe", "pipe", "ignore"] },
  );
  const lines = readline.createInterface({ input: child.stdout });
  const queue: Event[] = [];
  const waiters: Array<() => void> = [];
  lines.on("line", (line) => {
    queue.push(JSON.parse(line) as Event);
    waiters.shift()?.();
  });
  const next = () =>
    new Promise<Event>((resolve) => {
      const shifted = queue.shift();
      if (shifted) resolve(shifted);
      else waiters.push(() => resolve(queue.shift() as Event));
    });
  const send = async (message: object) => {
    child.stdin.write(`${JSON.stringify(message)}\n`);
    const events: Event[] = [];
    for (;;) {
      const event = await next();
      events.push(event);
      if (["done", "error", "hello"].includes(event.event)) return events;
    }
  };
  try {
    return await body(send);
  } finally {
    child.stdin.write(`${JSON.stringify({ op: "quit" })}\n`);
    await once(child, "exit");
  }
}

describe("speak-server protocol", () => {
  it("derives one marker per word at the first frame of the word", () => {
    const track = [
      { time: 0, word: "hello", params: {} },
      { time: 0.1, word: "hello", params: {} },
      { time: 0.2, word: "world", params: {} },
      { time: 0.3, word: ".", params: {} },
      { time: 0.4, params: {} },
    ];
    expect(wordMarkers(track, 0.02, 1000)).toEqual([
      { kind: "word", word: "hello", sample: 20 },
      { kind: "word", word: "world", sample: 220 },
    ]);
  });

  it("answers hello and renders a phrase to s16le PCM with monotone word markers", async () => {
    await withServer(async (send) => {
      const [hello] = await send({ id: 1, op: "hello" });
      expect(hello.event).toBe("hello");
      expect(hello.frontends).toEqual(expect.arrayContaining(["qlatt-english", "dectalk-english"]));

      const events = await send({ id: 2, op: "speak", text: "Hello world." });
      expect(events.map((event) => event.event)).toEqual(["audio", "done"]);
      const audio = events[0];
      expect(audio.id).toBe(2);
      expect(audio.format).toBe("s16le");
      expect(audio.sampleRate).toBe(22050);
      const pcm = Buffer.from(String(audio.pcm), "base64");
      expect(pcm.length).toBe(Number(audio.samples) * 2);
      expect(Number(audio.samples)).toBeGreaterThan(22050 * 0.4);
      const markers = audio.markers as Array<{ word: string; sample: number }>;
      // The frontend lowercases words; punctuation tokens are not markers.
      expect(markers.map((marker) => marker.word)).toEqual(["hello", "world"]);
      expect(markers[0].sample).toBeLessThan(markers[1].sample);
      expect(markers[1].sample).toBeLessThan(Number(audio.samples));
      let peak = 0;
      for (let i = 0; i < pcm.length; i += 2) peak = Math.max(peak, Math.abs(pcm.readInt16LE(i)));
      expect(peak).toBeGreaterThan(1000);

      const [other] = await send({
        id: 4,
        op: "speak",
        text: "Fish.",
        sampleRate: 16000,
        baseF0: 160,
        rate: 1.2,
      });
      expect(other.event).toBe("audio");
      expect(other.sampleRate).toBe(16000);
      expect(other.pcm).not.toBe(audio.pcm);

      const [error] = await send({ id: 3, op: "speak", text: "x", frontendId: "no-such-frontend" });
      expect(error.event).toBe("error");
      const [replay] = await send({ id: 5, op: "speak", text: "Hello world." });
      expect(replay.event).toBe("audio");
      expect(replay.pcm).toBe(audio.pcm);
      expect(replay.markers).toEqual(audio.markers);
      expect(replay.sampleRate).toBe(audio.sampleRate);
    });
  }, 120_000);
});

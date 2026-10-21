import { spawn } from "node:child_process";
import { once } from "node:events";
import readline from "node:readline";
import { describe, expect, it } from "vitest";
import { indexMarkers, speakRenderRequest, wordMarkers } from "../scripts/speak-server";

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

describe("speak-server request mapping", () => {
  it("preserves padding defaults and forwards explicit zero padding", () => {
    expect(speakRenderRequest({ op: "speak", text: "Hello." })).toMatchObject({
      leadTime: 0.02,
      tailTime: 0.05,
    });
    expect(
      speakRenderRequest({ op: "speak", text: "Hello.", leadTime: 0, tailTime: 0 }),
    ).toMatchObject({ leadTime: 0, tailTime: 0 });
    expect(
      speakRenderRequest({ op: "speak", text: "Hello.", leadTime: 0.01, tailTime: 0.03 }),
    ).toMatchObject({ leadTime: 0.01, tailTime: 0.03 });
  });

  it("requests no pitch when the request names none", () => {
    const render = speakRenderRequest({ op: "speak", text: "Hello." });
    expect(render.baseF0).toBeUndefined();
    expect(render).not.toHaveProperty("transitionMs");
    expect(render).not.toHaveProperty("pitchScale");
    expect(render.rate).toBeUndefined();
    expect(render).toMatchObject({ phrase: "Hello.", frontendId: "qlatt-english" });
  });

  it("passes pitchScale as the relative pitch request, with no base pitch", () => {
    const render = speakRenderRequest({
      op: "speak",
      text: "Hello.",
      frontendId: "qlatt-beauty",
      pitchScale: 2,
    });
    expect(render.pitchScale).toBe(2);
    expect(render.baseF0).toBeUndefined();
    expect(render.frontendId).toBe("qlatt-beauty");
  });

  it("still accepts baseF0, alone or with pitchScale", () => {
    expect(speakRenderRequest({ op: "speak", text: "Hello.", baseF0: 160 })).toMatchObject({
      baseF0: 160,
    });
    expect(
      speakRenderRequest({ op: "speak", text: "Hello.", baseF0: 160, pitchScale: 0.5 }),
    ).toMatchObject({ baseF0: 160, pitchScale: 0.5 });
  });
});

describe("speak-server protocol", () => {
  it("maps UTF-16 offsets to the next owned frame and trailing indexes to PCM end", () => {
    // The parser fixture preserves Hello's raw3–8 span after an astral character.
    const spans = [
      { segmentId: "first", time: 0.1, start: 3, end: 8 },
      { segmentId: "second", time: 0.2, start: 3, end: 8 },
      { segmentId: "next", time: 0.4, start: 9, end: 14 },
    ];
    const indexes = [
      { index: 4, offset: 0 },
      { index: 7, offset: 3 },
      { index: 8, offset: 8 },
      { index: 9, offset: 9 },
      { index: 10, offset: 15 },
    ];
    expect(indexMarkers(indexes, spans, 0.02, 1000, 600)).toEqual([
      { kind: "index", index: 4, sample: 120 },
      { kind: "index", index: 7, sample: 120 },
      { kind: "index", index: 8, sample: 420 },
      { kind: "index", index: 9, sample: 420 },
      { kind: "index", index: 10, sample: 600 },
    ]);
    expect(
      indexMarkers(indexes, [], 0.02, 1000, 600).every((marker) => marker.sample === 600),
    ).toBe(true);
  });

  it("maps each occurrence to samples without deduplicating its spelling", () => {
    const occurrences = [
      { time: 0, wordId: "first", word: "hello" },
      { time: 0.2, wordId: "second", word: "hello" },
      { time: 0.2, wordId: "third", word: "world" },
    ];
    expect(wordMarkers(occurrences, 0.02, 1000)).toEqual([
      { kind: "word", word: "hello", sample: 20 },
      { kind: "word", word: "hello", sample: 220 },
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
      const [repeated] = await send({ id: 8, op: "speak", text: "Very very." });
      const repeatedMarkers = repeated.markers as Array<{ word: string; sample: number }>;
      expect(repeatedMarkers.map((marker) => marker.word)).toEqual(["very", "very"]);
      expect(repeatedMarkers[0].sample).toBeLessThan(repeatedMarkers[1].sample);
      expect(repeatedMarkers[1].sample).toBeLessThan(Number(repeated.samples));
      const [indexed] = await send({
        id: 9,
        op: "speak",
        frontendId: "dectalk-english",
        text: "Dr. Smith Smith.",
        indexes: [
          { index: 1, offset: 0 },
          { index: 2, offset: 4 },
          { index: 3, offset: 4 },
          { index: 4, offset: 10 },
          { index: 5, offset: 16 },
        ],
      });
      const indexedMarkers = indexed.markers as Array<{
        kind: string;
        index?: number;
        word?: string;
        sample: number;
      }>;
      const reached = indexedMarkers.filter((marker) => marker.kind === "index");
      expect(reached.map((marker) => marker.index)).toEqual([1, 2, 3, 4, 5]);
      expect(reached[1].sample).toBe(reached[2].sample);
      expect(reached[4].sample).toBe(indexed.samples);
      expect(reached.map((marker) => marker.sample)).toEqual(
        reached.map((marker) => marker.sample).sort((left, right) => left - right),
      );
      const smiths = indexedMarkers.filter(
        (marker) => marker.kind === "word" && marker.word === "smith",
      );
      expect(smiths).toHaveLength(2);
      expect(reached[1].sample).toBe(smiths[0].sample);
      expect(reached[3].sample).toBe(smiths[1].sample);
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

      // A relative pitch is a different render; unity is the render with none.
      const [higher] = await send({ id: 6, op: "speak", text: "Hello world.", pitchScale: 2 });
      expect(higher.event).toBe("audio");
      expect(higher.pcm).not.toBe(audio.pcm);
      const [unity] = await send({ id: 7, op: "speak", text: "Hello world.", pitchScale: 1 });
      expect(unity.pcm).toBe(audio.pcm);

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

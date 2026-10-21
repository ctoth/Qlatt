// test/harness/tap.js — A diagnostic tap on the graph's output.
//
// With `?tap=1` in the page URL, the samples that leave the graph's output
// node can be recorded and read back, so that what the live page plays (a
// real AudioContext in real time, one runtime kept from utterance to
// utterance) can be compared with a reference sample for sample
// (scripts/oracle/browser-sweep.ts --live). Without the flag nothing here
// runs: no node is created and no module is loaded.
//
// The tap does not change the audio. It is one more connection from the
// output node into a recorder worklet; the recorder's own output is silence
// and is connected to the destination only so that the context processes it.
//
// The recorder posts every 128-sample block with the context frame it starts
// at. Blocks are consecutive frames, so a missing or repeated block shows as
// a step that is not 128 (`gaps` in what take() returns).
//
// window.__qlattTap:
//   begin()   forget what was recorded and record from now on
//   status()  { recording, blocks, events } without the samples
//   take()    stop recording and return
//             { sampleRate, firstFrame, frames, gaps, samplesBase64, events }
//             samplesBase64: the bytes of a Float32Array, frames long, whose
//             first sample is context frame firstFrame.
//             events: what the graph's nodes reported while recording (the
//             dectalk-vtm node's run_started and run_ended among them), each
//             with the context time at which the page received it.

import { state } from "./state.js";

export const tapEnabled = new URLSearchParams(location.search).get("tap") === "1";

const RECORDER = `
class OutputTapProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.recording = false;
    this.port.onmessage = (event) => {
      this.recording = event.data && event.data.record === true;
    };
  }
  process(inputs) {
    if (this.recording) {
      const channel = inputs[0] && inputs[0][0];
      const block = channel ? channel.slice() : new Float32Array(128);
      this.port.postMessage({ frame: currentFrame, samples: block }, [block.buffer]);
    }
    return true;
  }
}
registerProcessor("qlatt-output-tap", OutputTapProcessor);
`;

let modulePromise = null;
let recorder = null;
let tappedRuntime = null;
let unsubscribe = null;
let recording = false;
let blocks = [];
let events = [];

function outputNodeOf(runtime) {
  // As the spectrogram finds it (harness/runtime.js): the named output of the
  // formant graphs, or the first output the graph declares.
  const firstOutput = state.newRuntimeGraph?.outputs?.[0];
  const firstOutputId = typeof firstOutput === "string" ? firstOutput : firstOutput?.node;
  return (
    runtime.getNode("masterGain") ??
    runtime.getNode("outputGain") ??
    (firstOutputId ? runtime.getNode(firstOutputId) : undefined)
  );
}

/** Tap a runtime's output. Called when the page has created the runtime. */
export async function installTap(runtime) {
  if (!tapEnabled || tappedRuntime === runtime) return;
  modulePromise ??= state.ctx.audioWorklet.addModule(
    URL.createObjectURL(new Blob([RECORDER], { type: "application/javascript" })),
  );
  await modulePromise;
  if (!recorder) {
    recorder = new AudioWorkletNode(state.ctx, "qlatt-output-tap", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 1,
      channelCountMode: "explicit",
    });
    recorder.port.onmessage = (event) => {
      if (recording) blocks.push(event.data);
    };
    recorder.connect(state.ctx.destination);
    // begin() may have come before there was a runtime to tap.
    if (recording) recorder.port.postMessage({ record: true });
  }
  const output = outputNodeOf(runtime);
  if (!output) throw new Error("tap: the graph has no output node to record");
  output.connect(recorder);
  unsubscribe?.();
  unsubscribe = runtime.getDiagnostics().subscribe((entry) => {
    if (!recording || !entry) return;
    events.push({
      level: entry.level,
      code: entry.code,
      message: entry.message,
      data: entry.data,
      contextTime: state.ctx.currentTime,
    });
  });
  tappedRuntime = runtime;
}

function begin() {
  blocks = [];
  events = [];
  recording = true;
  recorder?.port.postMessage({ record: true });
}

function take() {
  recording = false;
  recorder?.port.postMessage({ record: false });
  const taken = blocks;
  blocks = [];
  // Each block goes where its frame says; frames no block covers are NaN.
  const firstFrame = taken[0]?.frame ?? 0;
  const lastFrame = taken[taken.length - 1]?.frame ?? firstFrame - 128;
  const samples = new Float32Array(Math.max(0, lastFrame + 128 - firstFrame)).fill(Number.NaN);
  const gaps = [];
  taken.forEach((block, index) => {
    if (block.frame >= firstFrame) samples.set(block.samples, block.frame - firstFrame);
    const previous = taken[index - 1];
    if (previous && block.frame !== previous.frame + 128) {
      gaps.push({ block: index, after: previous.frame, frame: block.frame });
    }
  });
  const bytes = new Uint8Array(samples.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 32768) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  }
  return {
    sampleRate: state.ctx.sampleRate,
    firstFrame: taken[0]?.frame ?? null,
    frames: samples.length,
    gaps,
    samplesBase64: btoa(binary),
    events,
  };
}

if (tapEnabled) {
  window.__qlattTap = {
    begin,
    take,
    status: () => ({ recording, installed: tappedRuntime != null, blocks: blocks.length, events }),
  };
}

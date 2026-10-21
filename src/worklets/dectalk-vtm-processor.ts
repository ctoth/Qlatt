// DECtalk 4.63's synthesizer as one node: PH packet words and a speaker
// definition in (as AudioParams), audio out. The DSP and the frame clock are
// crates/dectalk-vtm (src/backend.rs is the node's definition); this file only
// reads the parameters at the instants the crate asks for and packs them into
// DECtalk's packets.
//
// Parameters are DECtalk's packet words under DECtalk's names; index, meaning
// and scale of each are in scripts/oracle/dectalk-debug/ph-contract.md. Every
// value must be an integer that fits a 16-bit word.
//
// All parameters are a-rate, so a change scheduled with setValueAtTime is seen
// at its own sample. The packet for a frame is the parameter values at the
// output sample where the crate reports the frame due.
import {
  type BaseProcessorOptions,
  initWasmModule,
  resolveWasmUrl,
  WasmBuffer,
} from "./wasm-utils.js";

interface DectalkVtmExports {
  memory: WebAssembly.Memory;
  alloc_f32(len: number): number;
  dealloc_f32(ptr: number, len: number): void;
  dectalk_vtm_alloc_i16(len: number): number;
  dectalk_vtm_dealloc_i16(ptr: number, len: number): void;
  dectalk_backend_new(sampleRate: number): number;
  dectalk_backend_free(state: number): void;
  dectalk_backend_delay(state: number): number;
  dectalk_backend_start(state: number): void;
  dectalk_backend_stop(state: number): void;
  dectalk_backend_samples_until_frame(state: number): number;
  dectalk_backend_speaker(
    state: number,
    words: number,
    len: number,
    lastVoice: number,
    nomOpenQuo: number,
    tiltm: number,
  ): number;
  dectalk_backend_frame(
    state: number,
    packet: number,
    len: number,
    langCurr: number,
    volAtt: number,
  ): number;
  dectalk_backend_silent_frame(state: number): number;
  dectalk_backend_fault_detail(state: number): number;
  dectalk_backend_render(state: number, out: number, len: number): number;
}

// DECtalk 4.63 PH/ph_defs.h:382, 388.
const VOICE_PARS = 45;
const SPDEF_PARS = 51;
// DECtalk 4.63 VTM/vtm3.c:2400-2411.
const FRAME_SAMPLES = 71;
const DECTALK_SAMPLE_RATE = 11025;

// Packet words that reach the synthesizer and their index (OUT_*,
// PH/ph_defs.h:559-604). Kept equal to src/dectalk-vtm-track.ts by
// test/dectalk-vtm-worklet.test.ts.
const PACKET_WORDS: ReadonlyArray<readonly [string, number]> = [
  ["OUT_F1", 1],
  ["OUT_A2", 2],
  ["OUT_T0", 9],
  ["OUT_F2", 11],
  ["OUT_F3", 12],
  ["OUT_B2", 15],
  ["OUT_B3", 16],
  ["OUT_PH", 17],
  ["OUT_F4", 22],
  ["OUT_AG", 25],
  ["OUT_AL", 26],
  ["OUT_AN", 27],
  ["OUT_ABLADE", 28],
  ["OUT_PS", 29],
  ["OUT_CNK", 30],
  ["OUT_DC", 31],
  ["OUT_UE", 32],
  ["OUT_BRST", 35],
  ["OUT_ATB", 36],
  ["OUT_PLACE", 37],
];

// Speaker definition words the synthesizer reads and their index (struct
// SPD_CHIP, PH/ph_defs.h:693-720).
const SPEAKER_WORDS: ReadonlyArray<readonly [string, number]> = [
  ["SPD_R4CB", 0],
  ["SPD_R4CC", 1],
  ["SPD_R5CB", 2],
  ["SPD_R5CC", 3],
  ["SPD_R4PB", 4],
  ["SPD_R5PB", 5],
  ["SPD_T0JIT", 6],
  ["SPD_R5CA", 7],
  ["SPD_R4CA", 8],
  ["SPD_R3CA", 9],
  ["SPD_R2CA", 10],
  ["SPD_R1CA", 11],
  ["SPD_NOPEN1", 12],
  ["SPD_NOPEN2", 13],
  ["SPD_ATURB", 14],
  ["SPD_AFGAIN", 16],
  ["SPD_AZGAIN", 18],
  ["SPD_APGAIN", 19],
  ["SPD_SEX", 23],
];

const PARAM_NAMES: readonly string[] = [
  "run",
  "speaker_epoch",
  "lang_curr",
  "vol_att",
  ...PACKET_WORDS.map(([name]) => name),
  "last_voice",
  "NOM_Open_Quo",
  "Tiltm",
  ...SPEAKER_WORDS.map(([name]) => name),
];

// pKsd_t->vol_att of 100 is unity gain (int_volume_table, VTM/vtm3.c:264-427).
const DEFAULT_VOL_ATT = 100;

// crates/dectalk-vtm: DECTALK_VTM_BAD_ARGUMENT, VtmError::code, HlError::code,
// BackendError::code.
const FAULTS: Record<number, readonly [code: string, text: string]> = {
  [-1]: ["bad_argument", "the crate refused the call's arguments"],
  [-2]: ["amptable_index", "amptable index out of bounds"],
  [-3]: ["cosine_table_index", "cosine_table index out of bounds"],
  [-4]: ["radius_table_index", "radius_table index out of bounds"],
  [-5]: ["open_phase_index", "B0 index out of bounds (open phase under 40 samples)"],
  [-6]: ["nasal_zero_divide", "setzeroabc divides by zero"],
  [-7]: ["sqrttable_index", "hlsyn sqrttable index out of bounds"],
  [-8]: ["log10table_index", "hlsyn log10table index out of bounds"],
  [-9]: ["no_speaker", "voice packet before a speaker definition"],
  [-10]: ["not_running", "packet outside a run"],
};

const RESAMPLING_CITATIONS = [
  "Smith & Gossett 1984, A flexible sampling-rate conversion method (ICASSP)",
  "Kaiser 1974, Nonrecursive digital filter design using the I0-sinh window function (ISCAS)",
];

const wasmUrl = resolveWasmUrl("./dectalk-vtm.wasm");

class DectalkVtmProcessor extends AudioWorkletProcessor {
  private wasm: DectalkVtmExports | null = null;
  private state = 0;
  private output: WasmBuffer | null = null;
  private spdefPtr = 0;
  private packetPtr = 0;
  private disposed = false;
  private nodeId: string;

  private running = false;
  // Samples produced by earlier process() calls.
  private processedFrames = 0;
  private awaitLow = false;
  private speakerAttempted = false;
  private epoch = 0;
  private frameIndex = 0;
  // Per run: how often each diagnostic code occurred after its first report.
  private repeats = new Map<string, number>();

  static get parameterDescriptors(): AudioParamDescriptor[] {
    return PARAM_NAMES.map((name) => ({
      name,
      defaultValue: name === "vol_att" ? DEFAULT_VOL_ATT : 0,
      automationRate: "a-rate",
    }));
  }

  constructor(options?: unknown) {
    super(options);
    const settings = (options as BaseProcessorOptions | undefined)?.processorOptions;
    this.nodeId = settings?.nodeId ?? "dectalk-vtm";
    this.port.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === "dispose") {
        this.disposed = true;
        this.release();
        this.port.close();
      } else if (event.data?.type === "ping" && this.wasm) {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      }
    };
    initWasmModule(wasmUrl, {}, settings?.wasmBytes)
      .then((loaded) => {
        if (this.disposed) return;
        const instance = loaded instanceof WebAssembly.Instance ? loaded : loaded.instance;
        this.wasm = instance.exports as unknown as DectalkVtmExports;
        this.state = this.wasm.dectalk_backend_new(sampleRate);
        this.output = new WasmBuffer(this.wasm);
        this.spdefPtr = this.wasm.dectalk_vtm_alloc_i16(SPDEF_PARS);
        this.packetPtr = this.wasm.dectalk_vtm_alloc_i16(VOICE_PARS);
        if (!this.state) {
          this.diagnose(
            "error",
            "unsupported_sample_rate",
            `Sample rate ${sampleRate} Hz is not supported (a whole number of Hz, at least ${DECTALK_SAMPLE_RATE}); the node is silent`,
            { sampleRate, fallback: "silence" },
          );
        }
        this.port.postMessage({ type: "ready", node: this.nodeId });
      })
      .catch((error: unknown) => {
        if (!this.disposed)
          this.port.postMessage({ type: "error", node: this.nodeId, message: String(error) });
      });
  }

  private release() {
    if (!this.wasm) return;
    if (this.output?.ptr) this.wasm.dealloc_f32(this.output.ptr, this.output.len);
    if (this.spdefPtr) this.wasm.dectalk_vtm_dealloc_i16(this.spdefPtr, SPDEF_PARS);
    if (this.packetPtr) this.wasm.dectalk_vtm_dealloc_i16(this.packetPtr, VOICE_PARS);
    if (this.state) this.wasm.dectalk_backend_free(this.state);
    this.state = 0;
    this.spdefPtr = 0;
    this.packetPtr = 0;
    this.wasm = null;
    this.output = null;
  }

  private diagnose(
    level: "info" | "warn" | "error",
    code: string,
    message: string,
    data: Record<string, unknown>,
  ) {
    this.port.postMessage({
      type: "diagnostic",
      level,
      code: `dectalk-vtm.${code}`,
      node: this.nodeId,
      message,
      data,
    });
  }

  // Reports the first occurrence of a code in a run and counts the rest, so a
  // fault on every frame cannot flood the host.
  private diagnoseOnce(
    level: "warn" | "error",
    code: string,
    message: string,
    data: Record<string, unknown>,
  ) {
    const seen = this.repeats.get(code);
    if (seen !== undefined) {
      this.repeats.set(code, seen + 1);
      return;
    }
    this.repeats.set(code, 0);
    this.diagnose(level, code, message, { ...data, frame: this.frameIndex });
  }

  private endRun(reason: string) {
    this.wasm?.dectalk_backend_stop(this.state);
    this.running = false;
    const repeated = [...this.repeats].filter(([, count]) => count > 0);
    if (repeated.length > 0) {
      this.diagnose(
        "warn",
        "run_fault_summary",
        "Faults repeated after their first report in this run",
        { repeats: Object.fromEntries(repeated), frames: this.frameIndex },
      );
    }
    this.diagnose("info", "run_ended", `Run ended after ${this.frameIndex} frames: ${reason}`, {
      frames: this.frameIndex,
      reason,
    });
  }

  // A parameter value as a packet word: an integer in the range of a 16-bit
  // word, signed or unsigned (the C reads the packet as unsigned short and
  // casts the signed words to short). NaN if it is not.
  private word(
    params: Record<string, Float32Array>,
    name: string,
    index: number,
    minimum = -32768,
    maximum = 65535,
  ): number {
    const values = params[name];
    const value = values ? (values.length > 1 ? values[index] : values[0]) : Number.NaN;
    if (!Number.isFinite(value)) return Number.NaN;
    const rounded = Math.round(value);
    if (rounded !== value) {
      this.diagnoseOnce(
        "warn",
        `noninteger_word.${name}`,
        `${name} is not an integer; rounded to the nearest`,
        {
          param: name,
          value,
          fallback: rounded,
        },
      );
    }
    return rounded >= minimum && rounded <= maximum ? rounded : Number.NaN;
  }

  private loadSpeaker(wasm: DectalkVtmExports, params: Record<string, Float32Array>, at: number) {
    const spdef = new Int16Array(wasm.memory.buffer, this.spdefPtr, SPDEF_PARS);
    spdef.fill(0);
    let invalid: string | null = null;
    for (const [name, index] of SPEAKER_WORDS) {
      const value = this.word(params, name, at);
      if (Number.isNaN(value)) invalid ??= name;
      else spdef[index] = value;
    }
    const lastVoice = this.word(params, "last_voice", at, -2147483648, 2147483647);
    const nomOpenQuo = this.word(params, "NOM_Open_Quo", at, -32768, 32767);
    const tiltm = this.word(params, "Tiltm", at, -32768, 32767);
    if (Number.isNaN(lastVoice)) invalid ??= "last_voice";
    if (Number.isNaN(nomOpenQuo)) invalid ??= "NOM_Open_Quo";
    if (Number.isNaN(tiltm)) invalid ??= "Tiltm";
    if (invalid !== null) {
      this.diagnoseOnce(
        "error",
        "invalid_speaker_word",
        `${invalid} is not a speaker definition word; the speaker definition was not loaded`,
        { param: invalid, epoch: this.epoch, fallback: "previous speaker definition kept" },
      );
      return;
    }
    const code = wasm.dectalk_backend_speaker(
      this.state,
      this.spdefPtr,
      SPDEF_PARS,
      lastVoice,
      nomOpenQuo,
      tiltm,
    );
    if (code !== 0) {
      const [fault, text] = FAULTS[code] ?? ["unknown", `code ${code}`];
      this.diagnoseOnce(
        "error",
        `speaker_fault.${fault}`,
        `Speaker definition fault: ${text}; the speaker definition was not loaded`,
        {
          code,
          detail: wasm.dectalk_backend_fault_detail(this.state),
          epoch: this.epoch,
          fallback: "previous speaker definition kept",
        },
      );
      return;
    }
    this.diagnose(
      "info",
      "speaker_loaded",
      `Speaker definition loaded at frame ${this.frameIndex}`,
      {
        frame: this.frameIndex,
        epoch: this.epoch,
        lastVoice,
      },
    );
  }

  // The frame that is due, from the parameter values at output sample `at`.
  private latch(wasm: DectalkVtmExports, params: Record<string, Float32Array>, at: number) {
    const run = params.run;
    const runValue = run ? (run.length > 1 ? run[at] : run[0]) : 0;
    if (!(runValue >= 0.5)) {
      this.endRun("run parameter low");
      return;
    }

    const epochValues = params.speaker_epoch;
    const epoch = epochValues ? (epochValues.length > 1 ? epochValues[at] : epochValues[0]) : 0;
    if (!this.speakerAttempted || epoch !== this.epoch) {
      this.speakerAttempted = true;
      this.epoch = epoch;
      this.loadSpeaker(wasm, params, at);
    }

    const packet = new Int16Array(wasm.memory.buffer, this.packetPtr, VOICE_PARS);
    packet.fill(0);
    let invalid: string | null = null;
    for (const [name, index] of PACKET_WORDS) {
      const value = this.word(params, name, at);
      if (Number.isNaN(value)) invalid ??= name;
      else packet[index] = value;
    }
    const langCurr = this.word(params, "lang_curr", at, -2147483648, 2147483647);
    const volAtt = this.word(params, "vol_att", at, -2147483648, 2147483647);
    if (Number.isNaN(langCurr)) invalid ??= "lang_curr";
    if (Number.isNaN(volAtt)) invalid ??= "vol_att";

    let code: number;
    if (invalid !== null) {
      this.diagnoseOnce(
        "error",
        "invalid_packet_word",
        `${invalid} is not a packet word; the frame is silent`,
        { param: invalid, fallback: "silent frame" },
      );
      code = wasm.dectalk_backend_silent_frame(this.state);
    } else {
      code = wasm.dectalk_backend_frame(this.state, this.packetPtr, VOICE_PARS, langCurr, volAtt);
      if (code !== FRAME_SAMPLES) {
        const [fault, text] = FAULTS[code] ?? ["unknown", `code ${code}`];
        this.diagnoseOnce(
          "error",
          `frame_fault.${fault}`,
          `Frame fault: ${text}; the frame is silent`,
          {
            code,
            detail: wasm.dectalk_backend_fault_detail(this.state),
            fallback: "silent frame",
          },
        );
        // The crate takes a faulted frame itself (as silence) except when it
        // refused the call outright.
        code = code === -1 || code === -10 ? wasm.dectalk_backend_silent_frame(this.state) : 0;
      } else {
        code = 0;
      }
    }
    if (code !== 0) {
      // The frame could not be taken at all; without this the clock would
      // stay on the same frame forever.
      this.awaitLow = true;
      this.endRun(`frame could not be taken (code ${code})`);
      return;
    }
    this.frameIndex += 1;
  }

  process(
    _inputs: Float32Array[][],
    outputs: Float32Array[][],
    params: Record<string, Float32Array>,
  ): boolean {
    if (this.disposed) return false;
    const channel = outputs[0]?.[0];
    if (!channel) return true;
    channel.fill(0);
    const wasm = this.wasm;
    if (!wasm || !this.output || !this.state) return true;
    const length = channel.length;
    this.output.ensure(length);

    const run = params.run;
    let late = 0;
    let at = 0;
    while (at < length) {
      if (!this.running) {
        // Between runs: keep rendering (the tail of the last run, then
        // zeros) up to the sample where `run` goes high.
        let start = at;
        for (; start < length; start += 1) {
          const high = run ? (run.length > 1 ? run[start] : run[0]) >= 0.5 : false;
          // After a run the node ended itself, `run` must go low first.
          if (this.awaitLow && !high) this.awaitLow = false;
          if (high && !this.awaitLow) break;
        }
        if (start > at) {
          late += wasm.dectalk_backend_render(this.state, this.output.ptr + 4 * at, start - at);
          at = start;
        }
        if (at < length) {
          wasm.dectalk_backend_start(this.state);
          this.running = true;
          this.speakerAttempted = false;
          this.frameIndex = 0;
          this.repeats.clear();
          const resampled = sampleRate !== DECTALK_SAMPLE_RATE;
          this.diagnose(
            "info",
            "run_started",
            resampled
              ? `Run started; ${DECTALK_SAMPLE_RATE} Hz output converted to ${sampleRate} Hz by Kaiser-windowed sinc interpolation`
              : `Run started; output is DECtalk's ${DECTALK_SAMPLE_RATE} Hz samples, not resampled`,
            {
              sampleRate,
              // Samples this node had produced when the run started; the
              // run's first DECtalk sample is delaySamples later. For a node
              // that has run since its context started this is the context's
              // sample index. (Counted here because the Node host's
              // currentFrame global stays 0.)
              startFrame: this.processedFrames + at,
              delaySamples: wasm.dectalk_backend_delay(this.state),
              resampling: resampled ? "kaiser-windowed-sinc" : "none",
              citations: resampled ? RESAMPLING_CITATIONS : [],
            },
          );
        }
        continue;
      }
      const wait = wasm.dectalk_backend_samples_until_frame(this.state);
      if (wait === 0) {
        this.latch(wasm, params, at);
        continue;
      }
      const count = Math.min(wait, length - at);
      late += wasm.dectalk_backend_render(this.state, this.output.ptr + 4 * at, count);
      at += count;
    }
    if (late > 0) {
      this.diagnoseOnce(
        "error",
        "late_frame",
        "Output was rendered past a frame that was due; the run's audio is shifted",
        { samples: late },
      );
    }
    this.output.refresh();
    if (this.output.view) channel.set(this.output.view.subarray(0, length));
    this.processedFrames += length;
    return true;
  }
}

registerProcessor("dectalk-vtm-processor", DectalkVtmProcessor);

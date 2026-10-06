# Instrumented DECtalk build for the vocal tract model fixtures

`scripts/oracle/export-dectalk-vtm-fixture.ts` records what DECtalk 4.63's
vocal tract model is given (speaker definition packets and voice frames) and
what it produces. It needs a `say.exe` whose `vtmiont.c` writes those events to
a file. This file says how to produce that build. No DECtalk source is kept in
this repository; the instrumentation is one helper function and three calls
that you add to a copy.

## Why a trace is needed

`say.exe -lt` logs the frame PH computes. That is not what the vocal tract
model receives: with `HLSYN` defined (`dectalkf.h:114`), `VTM/vtmiont.c:658-1319`
runs the high-level synthesizer on each frame and overwrites T0, F1-F3, B1, the
amplitudes, FZ, FNP, GF, TLT and DP (lines 1292-1319) before calling
`speech_waveform_generator` at line 1351. The trace is taken at that call.

## Rules

- Work in a **copy** of the DECtalk tree (`dapi/`, `samples/SAY/` and
  `dectalkf.h` from the tree root). Never modify the tree that holds the oracle
  `say.exe`.
- Start the copy from the unmodified tree, not from the duration-debug copy of
  `README.md`: the exporter requires the instrumented build's WAV to be
  byte-identical to the stock build's.

## The added lines

All go in the copy's `dapi/src/VTM/vtmiont.c`. Line numbers are those of the
unmodified 4.63 file.

Immediately before `int vtm_loop(LPTTS_HANDLE_T phTTS,unsigned short *input)`
(line 523):

```c
/* QVTM trace: Qlatt instrumentation, not part of DECtalk. Appends one line per
   VTM event to the file named by the QVTM_TRACE environment variable. */
static void qvtm_words(const char *tag, const short *p, int n, int a, int b)
{
	const char *path = getenv("QVTM_TRACE");
	FILE *fp;
	int i;
	if (path == NULL || path[0] == 0)
		return;
	fp = fopen(path, "a");
	if (fp == NULL)
		return;
	fprintf(fp, "%s %d %d", tag, a, b);
	for (i = 0; i < n; i++)
		fprintf(fp, " %d", (int)p[i]);
	fprintf(fp, "\n");
	fclose(fp);
}

/* QVTM trace: n 32-bit words at p, printed as unsigned decimals (float bits). */
static void qvtm_bits(const char *tag, const void *p, int n, int a, int b)
{
	const char *path = getenv("QVTM_TRACE");
	const unsigned int *w = (const unsigned int *)p;
	FILE *fp;
	int i;
	if (path == NULL || path[0] == 0)
		return;
	fp = fopen(path, "a");
	if (fp == NULL)
		return;
	fprintf(fp, "%s %d %d", tag, a, b);
	for (i = 0; i < n; i++)
		fprintf(fp, " %u", w[i]);
	fprintf(fp, "\n");
	fclose(fp);
}

/* QVTM trace: HLState as 17 words; loc is a short followed by padding, so it
   is widened instead of dumped raw. */
static void qvtm_state(const char *tag, const HLState *s)
{
	unsigned int w[17];
	memcpy(&w[0], &s->acl, 4);
	memcpy(&w[1], &s->acd, 4);
	w[2] = (unsigned int)(int)s->loc;
	memcpy(&w[3], &s->acx, 4);
	memcpy(&w[4], &s->agx, 4);
	memcpy(&w[5], &s->Pm, 4);
	memcpy(&w[6], &s->Pcw, 4);
	memcpy(&w[7], &s->Ug, 4);
	memcpy(&w[8], &s->Uacx, 4);
	memcpy(&w[9], &s->Un, 4);
	memcpy(&w[10], &s->Uw, 4);
	memcpy(&w[11], &s->f1c, 4);
	memcpy(&w[12], &s->f1x, 4);
	memcpy(&w[13], &s->b1x, 4);
	memcpy(&w[14], &s->Cw, 4);
	memcpy(&w[15], &s->Cg, 4);
	memcpy(&w[16], &s->agf, 4);
	qvtm_bits(tag, w, 17, 0, 0);
}
```

As the first statement of the `#ifdef HLSYN` block that fills `pVtm_t->frame`
(before `pVtm_t->frame.ag = ...`, line 660):

```c
		  qvtm_words("P", (const short *)&(pVtm_t->parambuff[1]), VOICE_PARS, (int)pKsd_t->lang_curr, 0);
```

Around the `HLSynthesizeLLFrame(...)` call (lines 715-716), a block before and
two lines after, ahead of `pVtm_t->oldstate = pVtm_t->state;`:

```c
		  {
			  static HLSpeaker qvtm_last_speaker;
			  static int qvtm_have_speaker = 0;
			  if (!qvtm_have_speaker || memcmp(&qvtm_last_speaker, &pVtm_t->speakerDef.speaker, sizeof(HLSpeaker)) != 0)
			  {
				  qvtm_last_speaker = pVtm_t->speakerDef.speaker;
				  qvtm_have_speaker = 1;
				  qvtm_bits("H", &pVtm_t->speakerDef.speaker, (int)(sizeof(HLSpeaker) / 4), (int)sizeof(HLSpeaker), 0);
			  }
			  qvtm_bits("X", &pVtm_t->frame, (int)(sizeof(HLFrame) / 4), (int)sizeof(HLFrame), 0);
			  qvtm_bits("O", &pVtm_t->oldframe, (int)(sizeof(HLFrame) / 4), 0, 0);
			  qvtm_state("Q", &pVtm_t->oldstate);
		  }
		  HLSynthesizeLLFrame(&pVtm_t->frame, &pVtm_t->oldframe, &pVtm_t->speakerDef.speaker,
			&pVtm_t->state, &pVtm_t->oldstate, &pVtm_t->llframe);
		  qvtm_words("L", (const short *)&pVtm_t->llframe, (int)(sizeof(LLFrame) / 2), 0, 0);
		  qvtm_state("T", &pVtm_t->state);
```

Around `     speech_waveform_generator(phTTS);` (line 1351, the call inside
`#ifdef HLSYN` / `#else` of `USING_LLSYN`), one line before and one after:

```c
     qvtm_words("F", (const short *)&(pVtm_t->parambuff[1]), VOICE_PARS, (int)pKsd_t->vol_att, (int)pKsd_t->uiSampleRate);
     speech_waveform_generator(phTTS);
     qvtm_words("W", pVtm_t->iwave, (int)pVtm_t->uiNumberOfSamplesPerFrame, (int)pVtm_t->bDoTuning, 0);
```

Before `	  read_speaker_definition(phTTS);` (line 1638, in
`case SPC_type_speaker:`):

```c
	  qvtm_words("S", (const short *)&(pVtm_t->parambuff[1]), SPDEF_PARS, (int)pKsd_t->uiSampleRate, (int)pVtm_t->uiSampleRateChange);
```

## Trace lines

| Line | Meaning |
|---|---|
| `S <uiSampleRate> <uiSampleRateChange> <51 words>` | A speaker definition packet, as `read_speaker_definition` reads it (`SPD_CHIP`, `PH/ph_defs.h:693-720`). `InitializeVTM` has just run (line 1619). |
| `F <vol_att> <uiSampleRate> <45 words>` | A voice frame as `speech_waveform_generator` reads it; word order is `OUT_*` in `PH/ph_defs.h:559-604`. |
| `W <bDoTuning> 0 <samples>` | The frame's samples in `iwave` after the call. |
| `P <lang_curr> 0 <45 words>` | The PH packet as the VTM receives it, before hlsyn. |
| `H <sizeof> 0 <174 words>` | `HLSpeaker` (`PH/hlsynapi.h:147-281`) as float bits, printed before a frame whenever it differs from the last one printed. It includes the per-voice values `changeSpeakerValues` writes. |
| `X <sizeof> 0 <15 words>` | The `HLFrame` built from the packet (float bits; word 1 is the integer `place`). |
| `O 0 0 <15 words>` | The previous `HLFrame`. |
| `Q 0 0 <17 words>` | The previous `HLState` (float bits; word 2 is `loc`). |
| `L 0 0 <48 words>` | The `LLFrame` right after `HLSynthesizeLLFrame`, before `vtmiont.c:796-1219` edits it. |
| `T 0 0 <17 words>` | The `HLState` after the call. |

Per frame the order is `P`, [`H`], `X`, `O`, `Q`, `L`, `T`, `F`, `W`.

Some words of `S`, `P` and `F` are uninitialised memory that changes from run
to run and that nothing after the trace point reads. The exporter writes them
as 0 so that fixtures are reproducible; the list and its justification are at
`UNREAD_FRAME_WORDS` in `export-dectalk-vtm-fixture.ts`.

## How the compiled float code differs from the C text

The hlsyn objects are SSE single-precision code, but a `float` function result
comes back in the x87 register, and in about 35 places the compiler keeps
computing there (at the x87's 53-bit precision) before storing a `float`.
`DT_f_sqrt`'s `sqrttable[pos/100]*10.0f` and `DT_f_log10`'s `log10table[pos]+1`
are returned without being rounded to `float`. The port reproduces each of
these sequences; they were read from

```bat
dumpbin /disasm <stock>\dapi\build\dtstatic\us\release\link\<name>.obj
```

for `acxf1c`, `brent`, `circuit`, `hlframe`, `nasalf1x`, `log10table` and
`sqrttable`. The `T` records are what showed the difference: the port's state
matched bit for bit until the first frame that took the unrounded path.

## Build

`vtmiont.c` compiles to `dapi/build/dtstatic/us/release/link/vtmiont.obj`. A
plain recursive copy gives every object a newer timestamp than its source, so
delete that object, and `samples/SAY/build/us/static/say.exe`, before building:

```bat
call "<VsDevCmd.bat>" -arch=x86 -host_arch=x64
cd /d <copy>\dapi\src
nmake /f dtstatic.mak "CFG=dtstatic - Win32 Release" NO_EXTERNAL_DEPS=1
cd /d <copy>\samples\SAY
nmake /f say.mak "CFG=say - Win32 Release Static" NO_EXTERNAL_DEPS=1
```

## Exporting

```bash
DECTALK_VTM_SAY_EXE=<copy>/samples/SAY/build/us/static/say.exe \
DECTALK_VTM_WORKDIR=<copy>/dapi/src/dic \
DECTALK_SAY_EXE=<stock>/samples/SAY/build/us/static/say.exe \
DECTALK_WORKDIR=<stock>/dapi/src/dic \
node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
  scripts/oracle/export-dectalk-vtm-fixture.ts
```

That regenerates `crates/dectalk-vtm/tests/fixtures`. Add
`--corpus test/oracle-corpora/dectalk-us-v1.json --out-dir <dir>` to export a
whole corpus somewhere else, then replay it with:

```bash
DECTALK_VTM_FIXTURE_DIR=<dir> cargo test -p dectalk-vtm --test oracle -- --nocapture
```

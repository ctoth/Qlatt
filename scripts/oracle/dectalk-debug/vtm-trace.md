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

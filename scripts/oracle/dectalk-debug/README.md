# Instrumented DECtalk build for duration supervision

`scripts/oracle/export-duration-fixture.ts` records DECtalk 4.63's duration
computation rule by rule. It needs a `say.exe` whose `p_us_tim.c` prints its
state. This file says how to produce that build. No DECtalk source is kept in
this repository; the instrumentation is twelve `printf` lines you add to a
copy.

## Rules

- Work in a **copy** of the DECtalk tree. Never build this into the tree that
  holds the oracle `say.exe`: the prints go to stdout, and the phoneme-log
  capture (`say.exe -lp`) reads stdout.
- The copy needs `dapi/`, `samples/SAY/` and `dectalkf.h` from the tree root.

## Build gotchas

- `p_us_tim.c` is compiled through `ph_timng.c` (`ph_timng.c` includes
  `ph_time1.c`, which includes `p_us_tim.c`). The object to delete to force a
  recompile is `dapi/build/dtstatic/us/release/link/ph_timng.obj`.
- A plain recursive copy gives every object a newer timestamp than its source,
  so `nmake` recompiles nothing until that object is deleted.
- `say.mak` with `NO_EXTERNAL_DEPS=1` does not relink when the library changes.
  Delete `samples/SAY/build/us/static/say.exe` in the copy first.
- Set the define in the same `cmd` line as `nmake`; an environment variable set
  in a parent PowerShell did not reach `cl`:

  ```bat
  call "<VsDevCmd.bat>" -arch=x86 -host_arch=x64
  set CL=/DMSDBG5
  cd /d <copy>\dapi\src
  nmake /f dtstatic.mak "CFG=dtstatic - Win32 Release" NO_EXTERNAL_DEPS=1
  cd /d <copy>\samples\SAY
  nmake /f say.mak "CFG=say - Win32 Release Static" NO_EXTERNAL_DEPS=1
  ```

`/DMSDBG5` switches on DECtalk's own prints of the final duration terms
(`p_us_tim.c:897-930`).

## The twelve added lines

All go in the copy's `dapi/src/PH/p_us_tim.c`, inside the per-phone loop of the
duration routine, each on its own line immediately **before** the comment or
statement named. Line numbers are those of the unmodified 4.63 file.

Before `/* Rule 2: Lengthening of segments in clause-final rime */` (line 281):

```c
printf("QD phone n=%d ph=%d struc=%d bou=%d stress=%d fea=%d nallotot=%d durinh=%d durmin=%d\n", nphon, phocur & 0xff, struccur, strucboucur, strucstresscur, feacur, pDph_t->nallotot, durinh, durmin);
```

Then one state line, with `N` replaced as listed:

```c
printf("QD after=N prcnt=%d deldur=%d durmin=%d\n", prcnt, deldur, durmin);
```

| `N` | Insert before | Line |
|---|---|---|
| 2 | `/* Rule 3: Shortening of non-phrase-final syllabics` | 316 |
| 3 | `/* Rule 4: Shorten syll segs in syll-init and medial positions, */` | 349 |
| 5 | `/* Rule 6: Shortening of non-word-initial consonants */` | 408 |
| 6 | `/* Rule 7: Shortening of unstressed segs */` | 429 |
| 7 | `/* Rule 8: Lengthen each seg of an emphasized syllable, including rime */` | 510 |
| 8 | `/* Rule 9: Influence of final conson on vowels and postvoc sonor */` | 527 |
| 9 | `/* Rule 10: Lengthen first vowel of a two vowel sequence */` | 647 |
| 13 | `/* Rule 14: Increase sonor dur if preceding plosive is aspirated */` | 757 |
| 16 | `/* Rule 17: More lengthening of segments if in a short phrase */` | 788 |
| 24 | `pDphsettar->strucstressprev = strucstresscur;` | 891 |

And one line after `pDph_t->allodurs[nphon] = pDphsettar->durxx;` (line 943, just
below the `break3:` label), which every allophone reaches, silences and early
exits included:

```c
printf("QD final n=%d code=%d struc=%d durxx=%d\n", nphon, pDph_t->allophons[nphon], pDph_t->allofeats[nphon], pDphsettar->durxx);
```

Use this line, not DECtalk's own `durxx = durxx + deldur` print, for the final
duration: the cap on /h/ (lines 936-940) comes after DECtalk's print. `n`
restarts at 0 for each clause, because the routine runs once per clause.

`after=N` is the state once rule `N` and every rule before it has run. Rules 4
and 5 share `after=5`; rules 10 to 13 share `after=13`; rules 14 to 16 share
`after=16`; rules 17 to 24 share `after=24`. Split a group further by adding a
line if a port disagrees inside it.

## Running

From `<copy>/dapi/src/dic` (the dictionary lives there):

```bat
<copy>\samples\SAY\build\us\static\say.exe -w out.wav "[:np] [:ra 180] cake."
```

Then, to regenerate the fixtures:

```bash
DECTALK_DEBUG_SAY_EXE=<copy>/samples/SAY/build/us/static/say.exe \
DECTALK_DEBUG_WORKDIR=<copy>/dapi/src/dic \
node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
  scripts/oracle/export-duration-fixture.ts --corpus test/oracle-corpora/dectalk-us-v1.json
```

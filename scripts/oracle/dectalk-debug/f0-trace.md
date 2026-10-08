# Tracing DECtalk's F0 commands and F0 frames

For the question "which F0 commands does DECtalk issue for this sentence, and
what does its F0 routine hold in each frame". The port's side of the same
question is `scripts/oracle/show-f0-commands.ts --text "..." [--speaker v]`.

Work in a private **copy** of a built DECtalk tree, as `README.md` in this
directory says; the prints below go to stderr, so the copy must never be the
one the fixtures are exported from. Build it as that file describes. To force
a recompile delete the object of the file you changed in
`dapi/build/dtstatic/us/release/link/` (`ph_inton.obj`, `ph_drwt0.obj`,
`Ph_inton2.obj`, `ph_claus.obj`) and `samples/SAY/build/us/static/say.exe`.

## Which file is live

- `phinton()` is `PH/Ph_inton2.c:216`. `ph_claus.c:332-343` calls it for US
  English unless MODE_READING is set (then `phinton_classic`, `ph_inton1.c`).
- `make_f0_command()` is `PH/ph_inton1.c:1857-1902`, compiled through
  `ph_inton.c`. The copy of it at `Ph_inton2.c:1753-1791` is under `#if 0`: a
  print added there is never compiled.
- `pht0draw()` is `PH/Ph_drwt02.c` (through `ph_drwt0.c`): the male routine
  from line 771, the female one from 2445.

## The prints

In `ph_inton1.c`, in `make_f0_command`, before `pDph_t->f0tim[pDph_t->nf0tot] =`:

```c
fprintf(stderr, "F0CMD type=%d rule=%d tar=%d delay=%d len=%d nphon=%d phone=%d since_last=%d words=%d\n", type, rulenumber, tar, delay, length, nphon, pDph_t->allophons[nphon] & 0xff, *psCumdur, pDph_t->number_words);
```

`type` is 1 impulse, 2 step, 3 reset, 4 end drop, 5 glide (the switch at
`Ph_drwt02.c:1848`). `delay` is printed after its clamp, `since_last` is the
frames since the command before; the command's time after that one is their
sum.

In `Ph_drwt02.c`, male routine, after `f0in = (pDphsettar->tarbas + ...)` (line 2186):

```c
fprintf(stderr, "F0FRM bas=%d hat=%d imp=%d delimp=%d nimp=%d tcumdur=%d basecntr=%d nf0ev=%d words=%d base0=%d\n", pDphsettar->tarbas, pDphsettar->tarhat, pDphsettar->tarimp, pDphsettar->delimp, pDphsettar->nimp, pDph_t->tcumdur, pDphsettar->basecntr, pDph_t->nf0ev, pDph_t->number_words, pDph_t->f0baseline[0]);
```

and before the scaling line `pDph_t->f0prime = pDph_t->f0minimum + frac4mul(...)` (2312):

```c
fprintf(stderr, "F0OUT prime=%d f0=%d f0s=%d min=%d scale=%d mode=%d las1=%d\n", pDph_t->f0prime, pDph_t->f0, pDph_t->f0s, pDph_t->f0minimum, pDph_t->f0scalefac, pDph_t->f0mode, pDphsettar->f0las1);
```

`base0` tells the baseline row (1157 long declarative or comma, 1160 short
declarative, 1107 short exclamation, 1187 question) and `words` is
`number_words`, which is not the number of words.

## Running

```bash
cd <copy>/dapi/src/dic
<copy>/samples/SAY/build/us/static/say.exe -w out.wav "[:np] [:ra 180] about." 2>&1 | grep F0CMD
```

`[:np]` Paul, `[:nh]` Harry, `[:nb]` Betty, `[:nu]` Ursula. The frame prints
are in the male routine only.

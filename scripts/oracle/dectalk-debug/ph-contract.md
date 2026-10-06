# What DECtalk 4.63's PH stage hands to the VTM thread

This is the input contract of `crates/dectalk-vtm`: everything the stock
Windows `say.exe` passes from PH (the phonetic stage) to the VTM thread, read
from the source. File and line numbers are in the DECtalk 4.63 tree under
`dapi/src`. "The generator" is `speech_waveform_generator`
(`VTM/vtm3.c:479-1848`, ported as `Vtm`); "hlsyn" is `HLSynthesizeLLFrame`
(`hlsyn/hlframe.c:140-176`, ported as `hlsyn`); "vtmiont" is the code around it
in `VTM/vtmiont.c:656-1319` (ported as `vtmio`).

The trace record `P` (`vtm-trace.md`) is one voice packet exactly as described
here; `S` is one speaker definition packet.

## Per frame: the voice packet (45 words)

`VOICE_PARS` is 45 (`PH/ph_defs.h:382`); word order is `OUT_*`
(`PH/ph_defs.h:559-604`). One packet makes one frame of 71 samples at
11025 Hz (`VTM/vtm3.c:2400-2411`), i.e. 6.44 ms.

The packet buffer is `unsigned short` on the VTM side (`INCLUDE/port.h:73`,
`VTM/vtminst.h:134`); "signed" below means the C casts to `short` before use.

### Words the VTM thread reads

| Index | Name | Meaning and scale | Read at | Written by PH at |
|---|---|---|---|---|
| 1 | `OUT_F1` | First formant, Hz. Input to hlsyn (`frame.f1`); the generator gets hlsyn's `NF1` instead. | `vtmiont.c:681` | `PH/phinit.c:124` (interpolator), `PH/ph_draw.c:734`, 2944-3108 |
| 2 | `OUT_A2` | Not a level: a control code selecting hard-coded frication gains. 1000 dental, 1100 voiced dental, 1200 weak burst, 1300 labial, 2000 palatal, 2100 "tr" blend, 3000 alveolar, 3100 German TS, 3200 affricate, 3300 voiced fricative, 4000 liquid; anything else leaves hlsyn's gains. | `vtmiont.c:797-1178` | `PH/ph_draw.c:2069-2394`, 4321-4390 |
| 9 | `OUT_T0` | Despite the name, F0 in Hz x 10 (`frame.f0`, "deciHz"). vtmiont replaces it with the period `400000 / NF0` before the generator runs. | `vtmiont.c:680`, 1292-1295 | `PH/Ph_drwt02.c:2337-2339`, 3837-3841 (compiled through `PH/ph_drwt0.c:44`) |
| 11 | `OUT_F2` | Second formant, Hz. Used by hlsyn and, unchanged, by the generator. | `vtmiont.c:682` | `PH/phinit.c:125`, `PH/ph_draw.c:735`, 4461, 4566 |
| 12 | `OUT_F3` | Third formant, Hz. As F2. | `vtmiont.c:683` | `PH/phinit.c:126`, `PH/ph_draw.c:736` |
| 15 | `OUT_B2` | Second formant bandwidth, Hz. Goes to the generator unchanged (`vtm3.c:695`); hlsyn's own `NB2` is not written back (`vtmiont.c:1321`). | `vtmiont.c:1198`, `vtm3.c:695` | `PH/phinit.c:129` |
| 16 | `OUT_B3` | Third formant bandwidth, Hz. Goes to the generator unchanged. | `vtmiont.c:1199`, `vtm3.c:696` | `PH/phinit.c:130` |
| 17 | `OUT_PH` | Current phoneme code, `(font << 8) | code`. Low byte 0 (silence) lets the generator ramp its output down (`vtm3.c:1673`); specific codes trigger overrides (`vtmiont.c:1116-1175`). | `vtmiont.c:1116-1149`, `vtm3.c:1673` | `PH/ph_claus.c:453` |
| 18 | `OUT_DU` | Duration of the phoneme in frames. Only passed to the audio output for notifications. | `vtmiont.c:1376` | `PH/ph_claus.c:454` |
| 19 | `OUT_PH2` | Next phoneme code. Only passed to the audio output. | `vtmiont.c:1377` | `PH/ph_claus.c:457-460` |
| 22 | `OUT_F4` | Fourth formant, Hz (`frame.f4`); hlsyn uses it for the spectral tilt correction. | `vtmiont.c:670` | `PH/ph_draw.c:4189` |
| 25 | `OUT_AG` | Glottal area, mm^2 x 100. | `vtmiont.c:660` | `PH/phinit.c:143`, `PH/ph_draw.c:4104`, 4319 |
| 26 | `OUT_AL` | Lip area, mm^2 x 10. | `vtmiont.c:662` | `PH/phinit.c:142`, `PH/ph_draw.c:4106` |
| 27 | `OUT_AN` | Nasal (velopharyngeal) area, mm^2 x 10. | `vtmiont.c:665` | `PH/phinit.c:144`, `PH/ph_draw.c:4193` |
| 28 | `OUT_ABLADE` | Tongue blade area, mm^2 x 10. | `vtmiont.c:663` | `PH/phinit.c:141`, `PH/ph_draw.c:4111`, 4115 |
| 29 | `OUT_PS` | Subglottal pressure, cm H2O x 100. | `vtmiont.c:671` | `PH/phinit.c:145`, `PH/ph_draw.c:4191` |
| 30 | `OUT_CNK` | Posterior glottal chink area (`frame.ap`), mm^2 x 100. | `vtmiont.c:664` | `PH/phinit.c:147`, `PH/ph_draw.c:4100` |
| 31 | `OUT_DC` | Change of vocal fold compliance, percent, signed. | `vtmiont.c:672` | `PH/phinit.c:149`, `PH/ph_draw.c:1427-1470`, 4047 |
| 32 | `OUT_UE` | Volume flow from active expansion of the vocal tract, cm^3/s, signed. | `vtmiont.c:666` | `PH/phinit.c:148`, `PH/ph_draw.c:1428-1470`, 4048 |
| 35 | `OUT_BRST` | Burst: 1 or 2 injects an impulse into the parallel branch on the frame's first sample, with two strengths (`vtm3.c:864-868`, 1661-1664). | `vtm3.c:864`, 1661 | `PH/phinit.c:150`, `PH/ph_draw.c:4088-4096` |
| 36 | `OUT_ATB` | Tongue body area, mm^2 x 10, truncated to a whole mm^2 by the conversion `(float)(short)(word * .1f)`. | `vtmiont.c:674` | `PH/phinit.c:146`, `PH/ph_draw.c:4117-4317` |
| 37 | `OUT_PLACE` | Place code for dorsal frication, signed: 40, 42, 45 or 80 select gain sets in `hlsyn/hlframe.c:282-321`. | `vtmiont.c:678` | `PH/ph_draw.c:4122-4149` |

### Words PH writes that the VTM thread ignores

vtmiont overwrites these from hlsyn's low-level frame before anything reads
them (`vtmiont.c:1300-1319`), so their PH values have no effect on the audio:

| Index | Name | Replaced by |
|---|---|---|
| 0 | `OUT_AP` | `NAH`, aspiration in dB |
| 3-6 | `OUT_A3`..`OUT_A6` | `NA3F`..`NA6F`, parallel gains in dB |
| 7 | `OUT_AB` | `NAB`, bypass gain in dB |
| 8 | `OUT_TLT` | `NTL`, spectral tilt in dB |
| 10 | `OUT_AV` | `NAV`, voicing in dB |
| 13 | `OUT_FZ` | `NFNZ`, nasal zero in Hz |
| 14 | `OUT_B1` | `NB1`, first formant bandwidth in Hz |
| 20 | `OUT_FNP` | `NFNP`, nasal pole in Hz |
| 21 | `OUT_GF` | `NAF`, frication in dB. PH never writes this word. |
| 24 | `OUT_DP` | `NDI`, diplophonia |
| 34 | `OUT_BNP` | `NBNP`; the generator does not read it either |

`OUT_F1`, `OUT_A2` and `OUT_T0` are read first and then also overwritten.

### Words nobody writes

Words 23 (`OUT_SEX`; its copy at `PH/ph_claus.c:869` is commented out), 33,
34 and 38-44 are uninitialised memory in the packet and are not read per
frame. The fixture exporter writes them as 0.

### Timing inside PH

`send_pars` (`PH/ph_claus.c:745-890`) sends a buffer in which `OUT_AV`,
`OUT_TLT` and `OUT_T0` are the current frame's values (lines 770-792, copied
before the send) and every other word is the previous frame's (lines 832-883,
copied after the send). Of the three undelayed words the VTM thread uses only
`OUT_T0`, so in a packet F0 runs one frame ahead of the articulatory words.
The `P` record already contains that offset.

## Per speaker: the speaker definition packet (51 words)

`SPDEF_PARS` is `SPDEF + 1` = 51 (`PH/ph_defs.h:388`, `INCLUDE/cmd.h:209`), of
which the first 24 are struct `SPD_CHIP` (`PH/ph_defs.h:693-720`). PH builds it
in `setspdef` (`PH/ph_vset.c:522-880`) from the voice's `curspdef[SPD_*]`
values; for voice 3 (Frank) in English outside reading mode a hard-coded block
is used instead (`ph_vset.c:580-659`). On arrival the VTM thread resets the
model (`InitializeVTM`), reads the packet (`read_speaker_definition`,
`VTM/vtm3.c:1864-2232`) and forces the next frame to silence
(`vtm3.c:625-638`). Words 20 and 24-50 are never set.

| Index | Name | Meaning and scale | Read at (`vtm3.c`) |
|---|---|---|---|
| 0 | `r4cb` | Cascade F4, Hz. Above `rate/2 - 100` the resonator is bypassed. | 2054-2061 |
| 1 | `r4cc` | Cascade B4, Hz. | 2055 |
| 2 | `r5cb` | Cascade F5, Hz; bypassed as F4 is (6000 is sent to switch it off). | 2067-2075 |
| 3 | `r5cc` | Cascade B5, Hz. | 2068 |
| 4 | `r4pb` | Parallel F4, Hz (bandwidth fixed at 400 Hz). | 2081-2084 |
| 5 | `r5pb` | Parallel F5, Hz (bandwidth fixed at 500 Hz); at `rate/2` or above the resonator is off. | 2090-2098 |
| 6 | `t0jit` | Alternating period jitter, as a Q12 fraction of the period (`frac4mul`), sign flipped every period. | 2125-2142, 1071-1075 |
| 7 | `r5ca` | Cascade F5 gain, dB index into `amptable` (0..87). | 2149 |
| 8 | `r4ca` | Cascade F4 gain, dB. | 2151 |
| 9 | `r3ca` | Cascade F3 gain, dB. | 2153 |
| 10 | `r2ca` | Cascade F2 gain, dB. | 2155 |
| 11 | `r1ca` | Cascade F1 gain, dB. | 2157 |
| 12 | `nopen1` | Open phase as a Q15 fraction of the period (`k1`). | 2165, 1150 |
| 13 | `nopen2` | Open phase offset in quarter samples (`k2`). | 2166, 1150 |
| 14 | `aturb` | Breathiness, dB; 0 is off. | 2172-2176 |
| 15 | `fnscale` | Formant scale. Stored, not used by the generator. | 2188 |
| 16 | `afgain` | Frication gain, dB; 8 is added, and a frame's `OUT_GF` is offset by `afgain + 8 - 55`. | 2194, 819 |
| 17 | `rnpgain` | Nasal pole gain. Stored, not used (`HLSYN`). | 2200-2206 |
| 18 | `azgain` | Voicing gain, dB. | 2211 |
| 19 | `apgain` | Aspiration gain, dB. | 2218 |
| 20 | `notused` | Never set. | - |
| 21 | `osgain` | Not read. | - |
| 22 | `speaker` | Speaker number, bookkeeping only. | 2225 |
| 23 | `sex` | Nonzero is male. Passed to `InitializeHLSynthesizer` (`vtmiont.c:1643-1644`), which picks the male or female hlsyn constants. | 2226 |

## Per speaker: hlsyn's speaker values

`InitializeHLSynthesizer` (`hlsyn/inithl.c:68-427`) sets all 174 words of
`HLSpeaker` from constants chosen by `sex`. DECtalk then overwrites 18 of
them per voice in `changeSpeakerValues` (`VTM/vtmiont.c:2899-3430`), which is
called from the VTM thread for each speaker packet (`vtmiont.c:1645`) and from
PH when a voice is selected (`PH/ph_vset.c:432`):

`B1m`, `B2m`, `B3m`, `B4m`, `B5m`, `B2F`, `B3F`, `B4F`, `B5F`, `B6F`, `F5`,
`F6`, `OQm`, `TLm`, `acd_f1Break`, `f1HiShift`, `agm`, `f1Max`.

Two of these come from PH's voice definition: `OQm` is `NOM_Open_Quo`
(`curspdef[SPD_OQ]`, `ph_vset.c:591`, 672) and `TLm` is `Tiltm`
(`curspdef[SPD_SM] * 20 / 100`, `ph_vset.c:689`; `curspdef[SPD_SM] - 40` in
the Frank block, line 605). The rest are constants per
voice in `changeSpeakerValues`. That function is not ported: the crate's
tests take the whole `HLSpeaker` from the `H` trace record, and a caller of the
crate has to supply these 18 values itself.

## Other state the VTM thread reads

| Value | Meaning | Where |
|---|---|---|
| `pKsd_t->vol_att` | Output volume, 0..140, 100 is unity (`int_volume_table`, `vtm3.c:264-427`). Set by `[:volume att N]` (`CMD/cm_copt.c:1652-1654`). In the `F` record's first number. | `vtm3.c:614-620`, 1753 |
| `pKsd_t->lang_curr` | Language (`INCLUDE/kernel.h:423-425`); selects German and French variants of the `OUT_A2` overrides. In the `P` record's first number. | `vtmiont.c:858`, 942, 965 |
| `pKsd_t->uiSampleRate` | 11025 for the stock binary (`vtmiont.c:515`). | `vtm3.c:2378-2442` |

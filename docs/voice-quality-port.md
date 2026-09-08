# Klatt 1990 voice-quality controls

`klatt80-baseline` and `qlatt-beauty` accept FTP/FTZ (300–3000 Hz),
BTP (40–1000 Hz), BTZ (40–2000 Hz), DF1 (0–100 Hz), and DB1 (0–400 Hz).
These ranges and neutral defaults follow Klatt & Klatt (1990), Table XII.
The tracheal zero and pole sit between the nasal section and cascade F1.
Equal frequencies **and** bandwidths bypass both filters exactly. Defaults
are FTP=FTZ=2150 Hz and BTP=BTZ=180 Hz; DF1=DB1=0 selects the original
resonator. NFC=0 also disables the alternate F1 route.

The `breathy` voice-quality preset now uses FTP=1650 and FTZ=1800 Hz
(Table VII female second-resonance medians), with BTP=BTZ=180 Hz (Table XII).
DF1=50 and DB1=200 Hz are engineering estimates within the Table XII ranges,
not measured medians. TL=24 dB follows the paper's breathy speaker LK example.
The existing Rd=2 and AH offset of +20 dB remain part of this preset.
This intentionally changes breathy output, including beauty's breathy preset;
the default modal output is unchanged. The male Table VII second-resonance
medians are FTP=1550 and FTZ=1800 Hz and can be selected explicitly.

LF continues to own TL (0–41 dB at 3 kHz, zero derives tilt from Rd).
The impulse source now passes through the existing klsyn88 `tilt-filter`;
zero is transparent. That legacy primitive uses its original table and
saturates at 34 dB. It does not add a second tilt stage to LF or filter AH.
The pitch-synchronous primitive likewise retains klsyn88's period tracking,
integer frequency rounding, and LF-as-natural-source convention; it is not
a new phase-locking model for flutter or jitter.

`meta.formantBanks.*.formants[].cascadeOutput` names an authored return node
for onward cascade wiring. The author supplies connections from the generated
resonator through any extra processing to that node. Here, mutually exclusive
step gains select the original or pitch-synchronous F1. Parallel F1 and the
bank's PFE amplitude computation are unchanged.

Validation in `test/voice-quality-port.test.ts` captures pre-port seeded default
PCM hashes from commit `66b4c375`, tests coincidence transparency and NFC=0,
and renders each enabled cue separately. Preset values flow through the
existing provenance-stamped speaker projection and final HRG lowering.

Source: `papers/Klatt_1990_VoiceQualityVariations/notes.md`, Tables VII/XII and
the speaker LK example; existing klsyn88 graph, semantics, and DSP primitives.

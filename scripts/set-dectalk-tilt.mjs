// Inject per-phoneme TL (spectral tilt, dB) targets into the dectalk-english
// inventory, per the DECtalk us_gettar PTILT class map (p_us_st1.c:250-294).
// See notes/chunk-tilt-b-coder.md for the class->TL derivation and the
// FDUMMY_VOWEL (dynamic, not static) subtlety. Text-edit (line insertion after
// each phoneme key) to preserve existing formatting/comments. Idempotent: skips
// a block that already has a TL: line.
import { readFileSync, writeFileSync } from 'node:fs';

const PATH = 'public/rules/frontends/dectalk-english/inventory.yaml';

// Port phoneme -> TL. Keys are the inventory phoneme_targets keys (stress
// variants share the base class). Citations all p_us_st1.c:250-294.
const TL = {
  SIL: 0,
  // vowels (+3)
  IY1: 3, IY0: 3, IH1: 3, IH0: 3, EY1: 3, EY0: 3, EH1: 3, EH0: 3,
  AE1: 3, AE0: 3, AA1: 3, AA0: 3, AY1: 3, AY0: 3, AW1: 3, AW0: 3,
  AH1: 3, AH0: 3, AO1: 3, AO0: 3, OW1: 3, OW0: 3, OY1: 3, OY0: 3,
  UH1: 3, UH0: 3, UW1: 3, UW0: 3, ER1: 3, ER0: 3, IR1: 3, IR0: 3,
  AR1: 3, AR0: 3, OR1: 3, OR0: 3, UR1: 3, UR0: 3, RR: 3,
  // glides/liquids (else branch, +3)
  W: 7, // DECtalk featb 1850 has FOBST set -> 7 (see notes)
  Y: 3, R: 3, L: 3, EL: 3,
  // nasals (+6)
  M: 6, N: 6, NG: 6, EN: 6,
  // /h/ explicit (USP_HX) -> 20
  HH: 20,
  // voiceless + voiced fricatives, voiceless stops, flaps, CH affricate (FOBST, 7)
  F: 7, V: 7, TH: 7, DH: 7, S: 7, Z: 7, SH: 7, ZH: 7,
  P: 7, T: 7, K: 7, CH: 7, DX: 7, DF: 7, TX: 40,
  // voiced plosives + voiced stop allophones + JH affricate (FOBST&FVOICD&(FPLOSV|JH), 40)
  B: 40, D: 40, G: 40, DZ: 40, JH: 40,
  // glottal stop: DECtalk /q/ is [-obst] -> else branch -> 3
  GS: 3,
  // stop release / aspiration sub-segments: classify by the underlying phone's
  // FOBST class. Voiceless releases/aspiration -> 7; voiced releases of b/d/g -> 40.
  P_REL: 7, T_REL: 7, K_REL: 7, P_ASP: 7, T_ASP: 7, K_ASP: 7,
  B_REL: 40, D_REL: 40, G_REL: 40,
};

const lines = readFileSync(PATH, 'utf8').split('\n');
const out = [];
const assigned = new Set();
const missing = new Set(Object.keys(TL));
// match a 2-space-indented phoneme key line under phoneme_targets, e.g. "  IY1:"
const keyRe = /^  ([A-Z][A-Z0-9_]*):\s*$/;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  out.push(line);
  const m = keyRe.exec(line);
  if (!m) continue;
  const name = m[1];
  if (!(name in TL)) continue; // not a phoneme we set (none expected)
  missing.delete(name);
  // peek next line: if already has TL:, skip (idempotent)
  const next = lines[i + 1] ?? '';
  if (/^    TL:\s/.test(next)) { assigned.add(name); continue; }
  out.push(`    TL: ${TL[name]}`);
  assigned.add(name);
}

writeFileSync(PATH, out.join('\n'));
console.log('Assigned TL to', assigned.size, 'phoneme blocks.');
if (missing.size) {
  console.log('WARNING: map keys NOT found in inventory:', [...missing].join(', '));
}

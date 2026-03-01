# Phoneme Alphabet Normalization Investigation

## Current State: How Symbol Canonicalization Works Today

The normalization chain is scattered across 5 locations:

### 1. phoneme-map.ts (code) — LTS alias mapping
- `AX → AH` (schwa)
- `NX → NG` (velar nasal)
- `WH → W` (wh-merger)
- Prosodic markers (`< >`, `<,>`, etc.) stripped

### 2. stress.ts (code) — vowel stress digits
- Hunnicutt cyclic assignment: `AA → AA1/AA0`
- Uses syllabify.ts VOWELS set (15 bases)

### 3. materializePhonemeTarget() in inventory.ts (code) — stress-aware lookup
- Probes `AH1`, `AH0`, `AH` in order
- Falls back to SIL if nothing matches

### 4. structural.yaml (YAML rules) — stop/affricate/diphthong expansion
- `remap_stops_to_closures`: P/T/K/B/D/G → P_CL/T_CL/K_CL/B_CL/D_CL/G_CL
- Later rules expand closures → closure + release [+ aspiration]
- `expand_affricates_with_closure`: CH/JH → CH_CL+CH / JH_CL+JH
- `expand_diphthongs`: AW1/AY1/OW1/EY1/OY1 → nucleus+offglide

### 5. postlexical.yaml (YAML rules) — context-dependent allophony
- T → DX (flapping) between vowels

## Alphabet Inventories

### LTS output (post phoneme-map): 34 symbols
AA AE AH AO AW AY B CH D DH EH ER EY F G HH IH IY JH K L M NG OW P R S SH T TH UH UW V W Z ZH

### Morphology affix pronunciations: 25 symbols
AH0 AW1 B CH D ER0 EY1 F IH0 IY0 K L M N NG OW1 P R S SH T TH V Z ZH
(Note: uses BOTH stressed vowels AND bare stops)

### Inventory keys: 63 entries
Vowels (30): AA0 AA1 AE0 AE1 AH0 AH1 AO0 AO1 AW1 AY1 EH0 EH1 ER0 ER1 EY0 EY1 IH0 IH1 IY0 IY1 OW0 OW1 OY1 UH0 UH1 UW0 UW1
Consonants/special (33): B_CL B_REL CH CH_CL D_CL D_REL DH DX F G_CL G_REL GS HH JH JH_CL K_ASP K_CL K_REL L M N NG P_ASP P_CL P_REL R S SH SIL T_ASP T_CL T_REL TH V W Z ZH

## Gaps / Hidden Coupling

1. **Morphology bare stops (T, D, P, B, K)** rely on structural.yaml's `remap_stops_to_closures` to fire after morphology output merges into the token stream. This dependency is implicit.

2. **Morphology stressed vowels (AH0, ER0, IY0)** bypass the stress assignment step — they arrive pre-stressed. materializePhonemeTarget handles this because it probes with+without stress digits. But the assumption that morphology outputs are already stressed is undocumented.

3. **N vs NG**: Morphology uses bare `N`. Inventory has `N` as a key (nasal). LTS maps NX→NG. The two nasal symbols (`N` and `NG`) are different phonemes, not aliases, so this is correct — but the inconsistency in how they arrive is confusing.

4. **No inventory entry for bare stops**: If structural.yaml fails to fire on a bare P/T/K/B/D/G, materializePhonemeTarget falls back to SIL silently. No diagnostic warning.

5. **Diphthong stress**: Inventory only has AW1, AY1, OW1, EY1, OY1 (no stress-0 variants). Unstressed diphthongs (AW0, AY0) would fall through to SIL.

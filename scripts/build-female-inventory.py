#!/usr/bin/env python3
"""
TRACK INV — transform qlatt-beauty/inventory.yaml from the MALE skeleton (copied
from qlatt-english, Hillenbrand male formants) into a genuinely FEMALE inventory.

Approach (cited):
  * Vowel F1/F2/F3: Peterson & Barney 1952 WOMEN averages (nonuniform female scaling,
    Nordstrom_1975: F1 raised MORE than F2/F3, per-vowel front/back correction). These
    measured female values ARE the nonuniform up-scaling — F1 of /i/ stays low (310),
    F1 of /ae/ goes very high (860), exactly the size+shape effect Nordstrom describes.
  * Vowel bandwidths: female (Hanson 1999/2002 — female B1 ~+40 Hz vs male; B1 by height,
    open-vowel B1 wide from glottal coupling; B1 floor 165). Narrow-ish clear-speech.
  * Per-phoneme static Rd: voice-quality-synthesis Table 2.1 (female base 1.4; close +0.15,
    mid +0.05, voiced stops +0.5, nasals +0.3, voiced fric +0.2, approx +0.1, HH +1.2).
  * Consonants: keep place identity, female-scale formant loci up (shorter female tract).
  * base_params: female speaker constants (F0 190; Rd/RdRef 1.4; OQ 65 / TL 10 Hanson_2002
    Table VI; B1 165 floor; modest AH 35 posterior-chink floor; flutter 25; jitter 0.25;
    DI 0; female-raised F4-F6; HF A7-A10 air floor +2-4 dB vs male).

Edits ONLY public/rules/frontends/qlatt-beauty/inventory.yaml. Comment-preserving (ruamel).
"""
import sys
from pathlib import Path
from ruamel.yaml import YAML

INV = Path("public/rules/frontends/qlatt-beauty/inventory.yaml")

yaml = YAML()
yaml.preserve_quotes = True
yaml.width = 4096
yaml.indent(mapping=2, sequence=2, offset=0)

doc = yaml.load(INV.read_text())

# ---------------------------------------------------------------------------
# 1. base_params — female speaker defaults
# ---------------------------------------------------------------------------
bp = doc["base_params"]
female_base = {
    # Neutral schwa fallbacks (overridden per phoneme)
    "F1": 500, "F2": 1500, "F3": 2500,
    # Female-raised upper formants (speaker-profile constants; Nordstrom_1975 VTL up-scale)
    "F4": 3850, "B4": 250,
    "F5": 4800, "B5": 300,
    "F6": 5500, "B6": 1000,
    # Female bandwidths (Hanson 1999: female B1 ~165 floor; wider than male)
    "B1": 165, "B2": 110, "B3": 180,
    "AV": 0, "AF": 0,
    # Modest standing aspiration floor — posterior glottal chink (Hanson 1997; ~80% of
    # females show a posterior aperture, Klatt 1990 §15). Floor only (below breathy 35-50).
    "AH": 35,
    "AVS": -70,
    # Female speaking F0 (Titze 1989/1992; mean ~190 Hz female)
    "F0": 190,
    "sourceMode": 1, "lfMode": 1,
    # Female glottal source: breathier (Rd base 1.4 vs male 0.7; voice-quality-synthesis 2.1)
    "Rd": 1.4, "RdRef": 1.4,
    # Hanson 2002 Table VI female speaker constants: modal OQ 65%, modal tilt 10 dB
    "OQ": 65, "TL": 10,
    "flutter": 25, "jitter": 0.25, "DI": 0,
    "EePhraseDb": 0, "RdPhraseOffset": 0,
    "AN": 0, "nasalCoupling": 0, "nasalPlaceIndex": 0, "nasalMurmurStrength": 0,
    "nasalPoleBaseHz": 250, "nasalPoleBwHz": 100, "nasalZeroBwHz": 100,
    "nasalPlaceBwHz": 100, "nasalPlaceMFnzHz": 1000, "nasalPlaceNFnzHz": 1700,
    "nasalPlaceNgFnzHz": 6000, "nasalB1AdditionHz": 107,
    # HF "air" floor — female surplus concentrated high (Monson 2014: 16-kHz octave gender
    # cue; +2-4 dB vs male baseline of 0). NOTE: param vocab is A1-A10 (no A11). On the
    # klatt80-baseline verification backend these flow only through the PARALLEL branch
    # (gated for voiced vowels), so they do not colour vowel renders here — final HF/air
    # tuning happens at integration with the qlatt-beauty backend.
    "A1": 0, "A2": 0, "A3": 0, "A4": 0, "A5": 0, "A6": 0,
    "A7": 2, "A8": 3, "A9": 4, "A10": 4,
    "AB": 0, "SW": 0,
    "FGP": 0, "BGP": 100, "FGZ": 1500, "BGZ": 6000, "BGS": 200,
    "NFC": 5, "GO": 47,
}
# Rewrite base_params in place (preserve key set; add DI which the male skeleton lacked).
for k in list(bp.keys()):
    if k not in female_base:
        del bp[k]
for k, v in female_base.items():
    bp[k] = v

# ---------------------------------------------------------------------------
# 2. Vowel monophthongs — Peterson & Barney 1952 WOMEN (F1/F2/F3), female B, Rd
#    height class -> (B1,B2,B3) ; Rd from voice-quality-synthesis Table 2.1 (female)
# ---------------------------------------------------------------------------
# (F1,F2,F3, B1,B2,B3, Rd)
VOWELS = {
    "IY": (310, 2790, 3310, 50,  90,  170, 1.55),  # /i/ close front
    "IH": (430, 2480, 3070, 60,  90,  170, 1.55),  # /ɪ/ close-ish front
    "EH": (610, 2330, 2990, 80,  100, 180, 1.45),  # /ɛ/ mid front
    "AE": (860, 2050, 2850, 130, 110, 190, 1.40),  # /æ/ open front
    "AA": (850, 1220, 2810, 130, 110, 190, 1.40),  # /ɑ/ open back
    "AO": (590, 920,  2710, 80,  90,  180, 1.40),  # /ɔ/ mid-open back round
    "UH": (470, 1160, 2680, 60,  90,  170, 1.55),  # /ʊ/ close-ish back round
    "UW": (370, 950,  2670, 50,  90,  170, 1.55),  # /u/ close back round
    "AH": (760, 1400, 2780, 110, 100, 180, 1.40),  # /ʌ/ open-mid central
    "ER": (500, 1640, 1960, 80,  90,  150, 1.45),  # /ɝ/ rhotic central (low F3)
}
# Diphthong nuclei (interpolated to female space) — Rd 1.45 (diphthong class)
DIPHS = {
    "EY": (480, 2350, 2980, 80,  100, 180, 1.45),  # /eɪ/ nucleus ~/e/
    "OW": (510, 1000, 2710, 80,  90,  180, 1.45),  # /oʊ/ nucleus ~/o/
    "AY": (850, 1400, 2750, 130, 100, 190, 1.45),  # /aɪ/ nucleus ~/a/
    "AW": (820, 1400, 2750, 130, 100, 190, 1.45),  # /aʊ/ nucleus ~/a/
    "OY": (590, 920,  2710, 80,  90,  180, 1.45),  # /ɔɪ/ nucleus ~/ɔ/
}

def set_vowel(key, spec):
    t = doc["phoneme_targets"].get(key)
    if t is None:
        return
    F1, F2, F3, B1, B2, B3, Rd = spec
    t["F1"], t["F2"], t["F3"] = F1, F2, F3
    t["B1"], t["B2"], t["B3"] = B1, B2, B3
    t["Rd"] = Rd

# Apply to both stressed (1) and unstressed (0) lexical variants.
for base, spec in {**VOWELS, **DIPHS}.items():
    set_vowel(base + "1", spec)
    set_vowel(base + "0", spec)

# ---------------------------------------------------------------------------
# 3. Consonants — keep place identity, female-scale formant loci up; set static Rd
#    Female vocal tract ~15% shorter -> resonances up (Nordstrom_1975).
# ---------------------------------------------------------------------------
F1_SCALE, F2_SCALE, F3_SCALE = 1.10, 1.15, 1.13
CONS_RD = {
    # nasals +0.3 -> 1.7
    "M": 1.7, "N": 1.7, "NG": 1.7,
    # voiced fricatives +0.2 -> 1.6
    "V": 1.6, "DH": 1.6, "Z": 1.6, "ZH": 1.6,
    # approximants/liquids/glides +0.1 -> 1.5
    "L": 1.5, "R": 1.5, "W": 1.5, "Y": 1.5, "DX": 1.5,
    # voiced stop closures/releases +0.5 -> 1.9
    "B_CL": 1.9, "D_CL": 1.9, "G_CL": 1.9,
    "B_REL": 1.9, "D_REL": 1.9, "G_REL": 1.9,
    # voiced affricate + its closure (treat like voiced obstruent)
    "JH": 1.6, "JH_CL": 1.9,
    # breathy [h] +1.2 -> 2.6
    "HH": 2.6,
}
# All consonant-ish keys whose formant loci get female-scaled.
SCALE_KEYS = [
    "M", "N", "NG", "L", "R", "W", "Y",
    "S", "Z", "SH", "ZH", "F", "V", "TH", "DH", "HH",
    "P_CL", "T_CL", "K_CL", "B_CL", "D_CL", "G_CL", "CH_CL", "JH_CL", "GS",
    "P_REL", "T_REL", "K_REL", "B_REL", "D_REL", "G_REL",
    "P_ASP", "T_ASP", "K_ASP",
    "CH", "JH", "DX",
]

def iround(x):
    return int(round(x))

for key in SCALE_KEYS:
    t = doc["phoneme_targets"].get(key)
    if t is None:
        continue
    if "F1" in t and isinstance(t["F1"], (int, float)):
        t["F1"] = iround(t["F1"] * F1_SCALE)
    if "F2" in t and isinstance(t["F2"], (int, float)):
        t["F2"] = iround(t["F2"] * F2_SCALE)
    if "F3" in t and isinstance(t["F3"], (int, float)):
        t["F3"] = iround(t["F3"] * F3_SCALE)
    if key in CONS_RD:
        t["Rd"] = CONS_RD[key]

# Keep voiceless stop closures + silence + glottal-stop clean (no chink breath in the gap):
for key in ["P_CL", "T_CL", "K_CL", "CH_CL", "GS"]:
    t = doc["phoneme_targets"].get(key)
    if t is not None:
        t["AH"] = 0

yaml.dump(doc, INV.open("w"))
print("wrote", INV)

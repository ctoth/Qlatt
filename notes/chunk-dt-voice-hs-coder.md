# dt-voice-hs — HS head-size F4/F5 scaling (gap-4 #2)

2026-05-30. After dt-vtm1/1b/f5/br. "finish it". gap-4 #2: F4/F5 should be HS-scaled per voice;
port stamps raw. 8 voices have HS!=100.

## SOURCE (verified)
- P_us_vdf1.h struct comment: "F4 = F4*100/HS", "F5 = F5*100/HS" (effective cascade formant).
- ph_vset.c:712: fnscale = (200 - HS)*41; applied >>12 (/4096). So F4_eff = F4 * (200-HS)*41/4096.
  (Linear approx of 100/HS: HS=110 -> 0.901 vs 0.909; HS=100 -> 1.0009.)
- ph_vset.c:713: `if (curspdef[SPD_F4]==ZAPF)` special -> ZAPF(6000) F4/F5 NOT scaled (stay disabled).
- Harry: struct F4=3300 HS=110 -> eff ~2973. harry.yaml F4=3300 (RAW, unscaled) -> confirms gap.
- NOTE: DECtalk applies fnscale to ALL voices incl Paul (HS=100 -> *1.0009): real Paul F4=3500*4100/
  4096=3503, not 3500. So baking fnscale makes Paul MORE correct (+3Hz, inaudible).

## PLAN
- Bake HS-scaled F4/F5 into voice YAMLs (pure data, no TS): F4_eff = (F4>=6000? 6000 :
  round(F4*(200-HS)*41/4096)); same F5. ZAPF(6000) exempt. Script does targeted F4:/F5: line edits
  (preserve comments). HS field stays for provenance.
- VERIFY: per-voice F4 now HS-scaled (harry ~2973, chris HS=125 smaller); Paul ~3503; render health;
  qlatt byte-identical; explain clean. Commit dt-voice-hs.

## REMAINING after HS: F7/F8 cascade nodes (graph surgery); B1-widening (BR^2/2 unit-verify);
   gap-2 smoothing coverage (#1 lever, big/baseline-shifting); F0 fidelity (gap-3).

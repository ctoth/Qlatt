# Verdict 06: Stop Consonants & VOT

## Scope

This verdict adjudicates VOT values, burst spectral properties, and closure duration data across 19 papers, and audits Qlatt's current stop consonant implementation in `inventory.yaml` and `duration.yaml`.

---

## 1. Are Lisker & Abramson 1964's VOT Categories Still Valid?

**Verdict: VALID, with refinements from Abramson & Whalen 2017.**

Lisker & Abramson 1964 defined three universal VOT modes:
- Voicing lead: median ~-100 ms
- Short lag: median ~+10 ms
- Long lag: median ~+75 ms

Abramson & Whalen 2017 (the 50-year retrospective, highest evidence tier per rubric) confirms these three categories remain the standard framework. They note:

1. The original definition and three-category system is robust and widely replicated.
2. Extensions are needed for intervocalic (MVOT), final (VOFT), fricatives, and affricates.
3. VOT alone is insufficient for some contrasts (Hindi voiced aspirates, Korean three-way voiceless, preaspirates, ejectives).
4. The place-of-articulation ordering (labial < alveolar < velar) is universal.

Cho & Ladefoged 1999 (18 languages) refines the long-lag region into four sub-categories:
- Unaspirated: ~10-30 ms
- Slightly aspirated: ~30-50 ms
- Aspirated: ~60-90 ms
- Highly aspirated: ~90-160 ms

For English, voiceless stops fall in the "aspirated" range (~58-80 ms in citation forms). This is consistent with Lisker & Abramson's long-lag category.

Keating 1984 provides the phonological framework: three phonetic categories ({voiced}, {vl.unasp.}, {vl.asp.}) mediate between binary phonological features and continuous physical VOT. English maps [+voice] to {vl.unasp.} or {voiced} (speaker-dependent), and [-voice] to {vl.asp.}.

**For Qlatt**: The three-category framework is correct. No revision needed at the category level.

---

## 2. How Do Klatt 1975's VOT Values Compare to Modern Data?

**Verdict: LIMITED -- Klatt 1975 values are on the low side but within range. Zue 1976 provides more comprehensive data.**

| Stop | Klatt 1975 (Table 1) | Zue 1976 | Lisker & Abramson 1964 (isolated) | Crystal & House 1988 (release dur, connected) |
|------|---------------------|----------|-----------------------------------|----------------------------------------------|
| /p/  | 47 ms | 58 ms | 58 ms | release ~20 ms (labial) |
| /t/  | 65 ms | 71 ms | 70 ms | release ~30 ms (alveolar) |
| /k/  | 70 ms | 73 ms | 80 ms | release ~44 ms (velar) |
| /b/  | 11 ms | 13-17 ms | 1-5 ms (short lag) | release ~18 ms (voiced) |
| /d/  | 17 ms | 19-23 ms | 5 ms | |
| /g/  | 27 ms | 30-38 ms | 21 ms | |

Klatt 1975 values for voiceless stops are ~10-15 ms shorter than Zue 1976 and Lisker & Abramson 1964 (isolated words). This is because Klatt 1975 used 3 speakers and sentence-level reading, while Zue used controlled citation forms. Klatt 1975 himself notes that prestressed position in sentences yields shorter VOT than isolated words.

Klatt 1975's key decomposition (VOT = burst + aspiration) is confirmed by all subsequent work. The aspiration component is approximately constant across places; the burst component increases labial < alveolar < velar.

**For Qlatt**: Klatt 1975 Table 1 values are usable for connected speech contexts. For citation-form quality, Zue 1976 values (58/71/73 ms for /p t k/) are more appropriate. The current inventory values are discussed in the Qlatt audit below.

---

## 3. Is Blumstein & Stevens 1979's "Acoustic Invariance" for Place Correct?

**Verdict: LIMITED -- the three spectral templates are approximately correct but not sufficient as sole cues.**

Blumstein & Stevens 1979 demonstrated ~85% correct classification using three spectral templates:
- **Diffuse-rising** (alveolar): energy rising with frequency
- **Diffuse-falling** (labial): energy falling with frequency
- **Compact** (velar): prominent midfrequency peak (F2-F3 proximity)

Stevens & Blumstein 1978 (perceptual companion) showed:
- Full-cue (burst+transition): 90% correct identification
- Transition-only: 81% correct
- Burst-only: **18% correct** -- burst alone is very poor

Haskins (Dorman et al. 1977) established that bursts and transitions are **functionally equivalent, context-dependent cues** with a trading relationship. Where one is strong, the other is weak.

Hanson & Stevens 2003 further refined the picture: the "aspiration" phase after release contains place-dependent frication noise, not just glottal aspiration:
- /t/: F4-F5 frication prominence persists through aspiration (all 4 subjects)
- /k/: F2-F3 frication prominence persists (some subjects)
- /p/: follows classical aspiration model (all subjects)

**For Qlatt**: The three spectral templates are a reasonable starting point for burst spectrum design, but the burst-transition continuity is critical. Qlatt already implements this through the structural phase (closure -> release -> aspiration -> vowel transition). The `aspiration_frication_carryover` rule in duration.yaml correctly extends place-dependent AF into the aspiration phase, citing Hanson & Stevens 2003.

---

## 4. Are Closure Durations from Port 1979 Still the Best Available?

**Verdict: SUPERSEDED by Crystal & House 1988 for connected speech, complemented by Klatt 1973 for clusters.**

Port 1979 provides closure duration data for post-stress medial stops at three tempos:
- /b/: 45-75 ms, /p/: 65-110 ms (across tempos)
- /d/: 40-65 ms, /t/: 55-95 ms
- Voiced/voiceless closure ratio: ~0.65-0.75

Crystal & House 1988 (larger corpus, connected speech, 6 talkers):
- Hold duration: ~53 ms for ALL stops regardless of voicing (voiced 54 ms, voiceless 53 ms)
- **Key finding**: Hold portions do NOT reliably distinguish voicing in connected speech
- Release duration DOES distinguish voicing: voiced ~18 ms, voiceless ~39 ms
- Place effects on release: labial ~20 ms, alveolar ~30 ms, velar ~44 ms

Crystal & House 1988 directly contradicts Port 1979 on closure duration as voicing cue. Port found significant voiced-voiceless closure differences in controlled materials; Crystal & House found none in connected speech. Per the evidence hierarchy (larger sample > smaller, connected speech > citation forms for TTS), Crystal & House 1988 is preferred for connected-speech synthesis.

Klatt 1973 provides cluster duration rules (5 additive-percentage rules) that remain the standard reference for cluster shortening. No subsequent work has superseded these rules for English cluster durations.

**For Qlatt**: Closure durations should be approximately equal for voiced and voiceless stops (~50-55 ms). The voicing distinction should be carried by release/aspiration duration, not closure duration. This is partially reflected in the current inventory (see audit below).

---

## 5. Qlatt Synthesizer Audit

### inventory.yaml Stop Targets

#### Closure Durations

| Stop | Qlatt Closure (ms) | Crystal & House 1988 Hold | Assessment |
|------|--------------------|-----------------------------|------------|
| P_CL | 50 | ~60 (word-initial) | Slightly low |
| T_CL | 40 | ~50 (word-initial) | Low by ~10 ms |
| K_CL | 60 | ~59 (word-initial) | Good |
| B_CL | 45 | ~55 (word-initial) | Low by ~10 ms |
| D_CL | 35 | ~59 (word-initial) | Low by ~24 ms |
| G_CL | 55 | ~57 (word-initial) | Good |

**Finding**: Qlatt closures show a pronounced voiceless > voiced pattern that Crystal & House 1988 says does not reliably occur in connected speech. T_CL and D_CL are notably short.

However, Zue 1976 observes that total duration (closure + VOT) is constant ~150 ms for voiceless stops, with closure inversely related to VOT. This means shorter closures for /t/ and /k/ (which have longer VOT) are phonetically motivated -- but only for the voiceless series. The voiced series should have approximately equal closures to voiceless per Crystal & House.

**Recommendation**: Consider equalizing voiced/voiceless closure durations (~50 ms) per Crystal & House 1988, or at minimum raising D_CL from 35 to ~45-50 ms.

#### Release Durations

| Stop | Qlatt Release (ms) | Zue 1976 Burst (ms) | Klatt 1975 Burst (ms) | Assessment |
|------|--------------------|-----------------------|-----------------------|------------|
| P_REL | 5 | not measurable | ~11 (est. from /b/) | Low, but labial burst is genuinely brief |
| T_REL | 15 | ~24 (singleton /t/) | 24 | Reasonable but on low side |
| K_REL | 15 | ~37 (singleton /k/) | 37 | Significantly low |
| B_REL | 5 | 11 ms VOT | 11 | Reasonable |
| D_REL | 10 | 17 ms VOT | 17 | Reasonable |
| G_REL | 20 | 27 ms VOT | 27 | Reasonable |

**Finding**: K_REL at 15 ms is notably short compared to Zue's 37 ms and Klatt's 37 ms burst duration measurements. Velars should have the longest burst duration due to the slower constriction opening rate (Stevens 1993: velar release 4x slower than labial/alveolar). The Dorman et al. 1977 (Haskins) data confirms velar bursts average ~11.7 ms -- but that is for voiced velars; voiceless velar bursts are longer.

**Recommendation**: Increase K_REL to ~25-30 ms.

#### Aspiration Durations (VOT = Release + Aspiration)

| Stop | Qlatt (REL + ASP) | Zue 1976 VOT | Klatt 1975 VOT | Lisker & Abramson 1964 | Assessment |
|------|-------------------|--------------|----------------|------------------------|------------|
| /p/  | 5 + 53 = 58 ms | 58 ms | 47 ms | 58 ms | Matches Zue and L&A |
| /t/  | 15 + 56 = 71 ms | 71 ms | 65 ms | 70 ms | Matches Zue and L&A |
| /k/  | 15 + 48 = 63 ms | 73 ms | 70 ms | 80 ms | **10-17 ms too short** |

**Finding**: /p/ and /t/ total VOT values are well calibrated to Zue 1976. /k/ is ~10 ms short -- 63 ms vs Zue's 73 ms or L&A's 80 ms. All three sources (Zue, Klatt, L&A) agree that /k/ should have the longest VOT, but Qlatt's /k/ is shorter than /t/.

**Recommendation**: Increase K_ASP from 48 to ~58-65 ms to bring total /k/ VOT to 73-80 ms, maintaining the universal labial < alveolar < velar ordering.

#### Burst Spectral Properties

**Labial (/p, b/)**: Qlatt uses AB (bypass) as primary energy path (AB=63 for P_REL, AB=63 for B_REL). Zue 1976 confirms labial bursts have no clear spectral peak and are ~12 dB weaker than dental/velar. Blumstein & Stevens 1979 classifies labials as "diffuse-falling." The bypass-dominant routing is correct.

**Alveolar (/t, d/)**: Qlatt routes energy to A3-A6 with rising amplitude (A3=30, A4=45, A5=57, A6=63 for T_REL). This matches the "diffuse-rising" template from Blumstein & Stevens 1979 and Zue 1976's observation that /t/ bursts peak at 3500-4000 Hz. Correct.

**Velar (/k, g/)**: Qlatt uses A3=53 as the dominant parallel amplitude for K_REL, with F2=1990 Hz. Zue 1976 shows velar burst frequency is highly vowel-dependent (1250-2720 Hz). Blumstein & Stevens 1979 classifies velars as "compact" (midfrequency peak). The fixed F2=1990 Hz is a reasonable default for a neutral vowel context but does not capture the vowel-dependent variation that all papers identify as critical for velar identification. Currently, formant rules may handle this in the formant phase.

**Finding**: The burst spectral shapes are well-matched to the Blumstein & Stevens templates. The main gap is vowel-dependent velar burst frequency, which should be addressed by formant context rules.

#### Duration Rules (duration.yaml)

**s_cluster_aspiration_reduction**: Correctly reduces aspiration after /s/ clusters, citing Lisker & Abramson 1964 and Zue 1976. Zue's data shows /s/-cluster stops have VOT of ~23 ms (similar to voiced stops), confirming the rule's intent.

**aspiration_frication_carryover**: Correctly implements place-dependent frication extension into aspiration, citing Hanson & Stevens 2003 and Stevens 1998. This addresses the finding that /t/ and /k/ aspiration phases contain supraglottal frication noise.

**lock_stop_release_duration**: Preserves inherent release/aspiration durations against multiplicative rules. This is appropriate since VOT is primarily an articulatory timing property, not a prosodic one.

**stop_unreleasing**: Sets AF=0 and reduces duration when a stop release precedes another stop closure. Cites Miller 1998 and Crystal & House 1988. Crystal & House show only 33% of word-final stops are complete (have release), so this rule is well-motivated.

**Missing**: No rule implements Klatt 1975's VOT prediction rules for connected speech:
- Voiceless stops not prestressed, word-initial: multiply VOT by 0.7-0.9
- Word-medial/final: multiply by 0.4-0.7
- After homorganic nasal: VOT = 0
- Cluster VOT increases (stop-sonorant: +27%, from Zue 1976)

**Missing**: No rule implements vowel-height effect on VOT. Klatt 1975 Table 2 shows VOT is ~15% longer before high vowels (/i, u/) than mid/low vowels. Zue 1976 confirms this pattern.

---

## 6. Summary Table

| Claim | Verdict | Notes |
|-------|---------|-------|
| Lisker & Abramson 1964 three VOT categories | **VALID** | Confirmed by Abramson & Whalen 2017 (50-year retrospective) |
| Klatt 1975 VOT values | **LIMITED** | Usable for connected speech; lower than citation-form data (Zue 1976, L&A 1964) |
| Blumstein & Stevens 1979 acoustic invariance | **LIMITED** | Templates correct but burst alone is insufficient (18% ID); burst-transition continuity required |
| Port 1979 closure durations | **SUPERSEDED** by Crystal & House 1988 for connected speech | C&H: voiced/voiceless closures are equal (~53 ms) |
| Zue 1976 VOT values | **VALID** | Most comprehensive controlled study; matches well with L&A 1964 |
| Cho & Ladefoged 1999 cross-linguistic VOT | **VALID** | Confirms universal place ordering; refines long-lag into 4 subcategories |
| Stevens 1993 four-source model | **VALID** | Provides aerodynamic foundation for VOT patterns |
| Hanson & Stevens 2003 extended frication | **VALID** | Place-dependent frication persists into aspiration phase |
| Keating 1984 three-level model | **VALID** | Provides correct phonological architecture for stop voicing |
| Hombert 1979 F0 perturbation | **VALID** | ~10 Hz difference at vowel onset after voiced vs voiceless; no place effect |
| Cooper 1952 / Haskins burst-transition cues | **VALID** | Burst and transitions are complementary context-dependent cues |
| Koenig 2000 laryngeal factors | **VALID** | VOT means similar across gender; children show 2x variance |
| Stevens 1998 Acoustic Phonetics | **VALID** | Comprehensive reference; theoretical foundation for all stop parameters |

---

## 7. Specific Recommendations for Qlatt

### High Priority (incorrect values)

1. **Increase K_ASP from 48 to ~58 ms** to bring total /k/ VOT to ~73 ms, matching Zue 1976 and maintaining labial < alveolar < velar ordering.

2. **Increase D_CL from 35 to ~45-50 ms** per Crystal & House 1988 finding that voiced/voiceless closures are approximately equal in connected speech.

### Medium Priority (missing rules)

3. **Add connected-speech VOT reduction rule** per Klatt 1975 Appendix: non-prestressed voiceless stops should have VOT multiplied by 0.7-0.9 (word-initial) or 0.4-0.7 (word-medial/final).

4. **Add cluster VOT modification rule**: stop-sonorant clusters increase VOT by ~27% (Zue 1976, Klatt 1975).

5. **Add vowel-height VOT conditioning**: VOT ~15% longer before high vowels (Klatt 1975 Table 2).

### Low Priority (refinements)

6. **Consider raising K_REL from 15 to ~25 ms** per Zue 1976 and Stevens 1993 (velar release 4x slower than labial/alveolar).

7. **Add vowel-dependent velar burst frequency** in formant rules: F2 of burst should track F2 of following vowel (Zue 1976: 1250 Hz before back rounded, 2720 Hz before front vowels).

8. **Consider equalizing T_CL to ~50 ms** (currently 40 ms) per Crystal & House 1988.

---

## Papers Read

All 19 assigned papers were read in full (notes.md):

1. Zue 1976 -- comprehensive VOT, burst frequency, burst amplitude data
2. Abramson & Whalen 2017 -- 50-year VOT retrospective
3. Lisker & Abramson 1964 -- foundational cross-language VOT
4. Lisker 1964 (duplicate entry of above, same paper)
5. Blumstein & Stevens 1979 -- acoustic invariance templates
6. Stevens & Blumstein 1978 -- perceptual validation of invariant cues
7. Stevens 1993 -- aerodynamic stop production model
8. Cho & Ladefoged 1999 -- cross-linguistic VOT, 18 languages
9. Klatt 1975 -- VOT decomposition into burst + aspiration
10. Klatt 1973 -- cluster duration rules
11. Crystal & House 1988 -- connected-speech stop durations
12. Port 1979 -- closure duration and voicing
13. Cooper 1952 -- burst and transition perception
14. Dorman et al. 1977 (Haskins_StopRecognition) -- burst-transition trading
15. Keating 1984 -- three-level stop voicing model
16. Hanson & Stevens 2003 -- aspiration frication models
17. Koenig 2000 -- laryngeal factors, gender differences
18. Stevens 1998 -- Acoustic Phonetics (comprehensive reference)
19. Hombert 1979 -- F0 perturbation after stops

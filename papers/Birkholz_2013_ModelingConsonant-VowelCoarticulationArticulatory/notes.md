---
title: "Modeling Consonant-Vowel Coarticulation for Articulatory Speech Synthesis"
authors: "Peter Birkholz"
year: 2013
venue: "PLoS ONE 8(4): e60603"
doi_url: "https://doi.org/10.1371/journal.pone.0060603"
pages: "1-17"
affiliation: "Department of Phoniatrics, Pedaudiology, and Communication Disorders, University Hospital Aachen and RWTH Aachen University, Aachen, Germany"
---

# Modeling Consonant-Vowel Coarticulation for Articulatory Speech Synthesis

## One-Sentence Summary
A context-sensitive consonant target model for articulatory synthesis: the vocal tract target shape of a consonant before any vowel is computed as a bilinear-weighted average of three measured, acoustically optimized reference shapes for that consonant in /a/, /i/, and /u/ context, with weights obtained by projecting the context vowel's articulatory target into the subspace spanned by the corner vowels. *(p.1)*

## Problem Addressed
Articulatory speech synthesis needs numerical coarticulation models, because it is impractical to record articulatory data for every phoneme in every phonetic context (articulatory recordings are far more intricate than acoustic recordings). *(p.1)* Speech sounds are coarticulated: the articulatory and acoustic realization of a phoneme depends on context (e.g. /g/ in /gu/ has a more retracted tongue body and rounder lips than in /gi/). *(p.1)* Unit-selection synthesis solves this by concatenating recorded natural units; articulatory synthesis cannot. *(p.1)*

## Key Contributions
- A method to compute the context-sensitive vocal tract target of a consonant in a CV syllable as a **weighted average of three reference targets** (in /a/, /i/, /u/ context), i.e. by bilinear interpolation. *(p.2)*
- Weights derived by **mapping the context-vowel target into the articulatory subspace spanned by the corner vowels**, not by an ad-hoc rule. *(p.2)*
- A 3D geometric vocal tract model with 23 control parameters, including a **two-DOF velum** (shape `VS` + velic opening `VO`) rather than the traditional one-DOF velum. *(p.7)*
- A greedy **acoustic optimization** of MRI-fitted vocal tract shapes that reduces mean formant error from 9.9% to 1.2% for vowels. *(p.10)*
- A perception test of 56 synthesized CV syllables (7 consonants x 8 long German vowels) with 82.4% mean consonant recognition. *(p.1)*
- The complete measured formant/VOT dataset for one reference speaker of Standard German (Table 1). *(p.5)*

## Study Design
- **Type:** Model development plus a listening (perception) experiment.
- **Reference speaker:** one adult native speaker of Standard German; all articulatory and acoustic data from this single speaker. *(p.2)*
- **Three data corpora:** volumetric MRI of sustained phonemes; midsagittal real-time MRI of CV syllables; high-quality audio in a sound-proofed room. *(p.2)*
- **Synthesizer:** VocalTractLab (www.vocaltractlab.de). *(p.2)*
- **Perception test:** listeners identify the consonant in isolated synthesized CV syllables; primary endpoint is consonant recognition rate. *(p.1)*

## Phoneme Inventory and Notation
SAMPA is used throughout because of journal font regulations. *(p.2, Fig 1)*

| Class | SAMPA symbols | IPA |
|-------|---------------|-----|
| Long vowels | a:, e:, i:, o:, u:, E:, 2:, y: | aː eː iː oː uː ɛː øː yː |
| Short vowels | a, E, I, O, U, Y, 9, @, 6 | a ɛ ɪ ɔ ʊ ʏ œ ə ɐ |
| Consonants | b, d, g, l, x, r, m, n, s | b d ɡ l x χ/ʁ m n s |

*(p.2)*

## Data Analysis

### Volumetric MRI + CT data *(p.2)*
- Scanner: Philips Gyroscan NT, Institute for Radiology, Virchow Clinical Center Berlin.
- 18 sagittal slices per phoneme, 3.5 mm slice thickness, 512x512 px, pixel size 0.59 x 0.59 mm², acquisition 21 s per phoneme.
- Analyzed: long vowels /a:, e:, i:, o:, u:, E:, 2:, y:/ and short vowels /I, E, a, O, U, Y, 9, @, 6/.
- Vocal tract contours in the **midsagittal slice** manually traced with **Catmull-Rom splines**; Sobel operator applied to highlight edges before tracing.
- Tongue outline traced both in the midsagittal slice and in the slice **about 10 mm to the left** of the middle; the two outlines reproduce the cross-sectional tongue shape.
- Mandible bone traced in each midsagittal image as an indicator of jaw opening.
- Lateral width of larynx and pharynx measured at multiple positions for fronted-tongue phonemes, as estimates of lateral dimensions.
- Consonants /s/ and /m/ additionally analyzed for **velum shape** (used to define maximally raised and lowered velum reference shapes). /s/ is not part of the coarticulation study itself.
- Plaster models of hard palate and mandible (with all teeth) CT-scanned at voxel size 0.226 x 1 x 0.226 mm², used to model the rigid 3D structures.

### Midsagittal real-time MRI data *(p.2-4)*
- Pseudowords /baCa/, /biCi/, /buCu/ with different consonants C.
- Used to reproduce context-sensitive reference shapes for /b, d, g, l, r, m, n/. MRI sequences actually analyzed contained /b, d, g, l, x/.
- **/x/ substitutes for /r/** because the corpus had no /r/ recordings; /x/ and /r/ share place of articulation and differ mainly in manner. The dorsal German /r/ may be realized as a velar or uvular fricative in voiceless contexts such as "trat". *(p.3, p.10)*
- **/m/ and /n/ were modeled from /b/ and /d/ data with a lowered velum.** *(p.3)*
- Frame rate **8 Hz**, Philips Gyroscan NT at TU Munich Department of Radiology; slice thickness 10 mm, 256x256 px, pixel size 1.18 x 1.18 mm². *(p.3-4)*
- Pseudowords spoken consecutively at normal rate, ~10 repetitions each.
- Because of the low frame rate, consonants were sampled in only some repetitions during the constriction interval. Procedure: visually identify the set of frames representing the context-sensitive consonantal target, then select the **most representative frame** = the one with the smallest "distance" to all other images in the set, measured as **signal energy in the difference image** (the most central member of the set). *(p.4)*
- Example: in 10 repetitions of /bada/, three frames had satisfactory alveolar closure for /d/; one of those three was chosen as the /d/-in-/a/-context template. *(p.4)*
- Tongue-side contours are absent in this midsagittal-only corpus. They were complemented from an unpublished pilot study using a new real-time MRI technique with **two parallel sagittal slices (middle and 1 cm left) simultaneously at 25 Hz**. The pilot speaker differed from the modeled speaker, so tongue-side contours are approximations. *(p.4)*

### Normalization of head posture *(p.4)*
- The angle of the rear pharyngeal wall relative to the hard palate differed between corpora and varied within each corpus.
- Assumption: oral and pharyngeal parts of the vocal tract are connected as if by a **hinge joint**; different postures = different hinge angles.
- Fulcrum = intersection point of straight-line approximations of the rear pharyngeal wall across the tracings; since lines do not exactly intersect, the common fulcrum was found in a **least-squares** sense.
- Each tracing was then **warped** so the rear pharyngeal outline assumed a predefined constant angle.
- Warping used the **Beier and Neely method [35] with three corresponding pairs of vectors** (Fig 3): a horizontal vector on top of the palate and a vertical vector at the chin are identical in source and warped image (preserving those regions); the third vector is aligned to the rear pharyngeal wall in the original and rotated around the fulcrum to the predefined angle. *(p.4, Fig 3 p.3)*

### Acoustic recordings *(p.4)*
- Purpose: a complete set of speaker-specific formant frequency targets for German vowels, and formant frequencies at vowel onset after /b, d, g, l, r/.
- **/m/ and /n/ excluded** from the audio corpus because their antiresonances prevent reliable formant measurement. *(p.4)*
- Recorded in a separate sound-proofed session (MRI noise too high), with the speaker **in supine position** to match the postural influence of the scanner.
- 44 kHz sampling, 16 bit, digital tape recorder, high-quality headset microphone.
- Carrier sentence: "Ich habe ... gesagt."  at comfortable speed, pitch and loudness.
- Prompt list (78 items total), recorded six times (three times in each of two separate sessions) => six instances per target word:
  - /CVd@/ for all combinations of /b, d, g, l, r/ with long vowels /a:, e:, i:, o:, u:, E:, 2:, y:/
  - /CVt@/ for the same consonants with short vowels /I, E, a, O, U, Y, 9/
  - /hOp6/, /hOk6/, /mUt6/ with the low Schwa as final vowel
- Measured in /CVd@/ and /CVt@/: F1, F2, F3 at **onset of voicing of the target vowel**, in the **middle of the target vowel**, and for the **final Schwa**. **VOT** measured in words with initial plosives, from closure release to the middle of the first fully established glottal period of the vowel. In /hOp6/, /hOk6/, /mUt6/ only the final low Schwa /6/ formants were measured. *(p.4)*
- Formants determined manually in **Praat 5.1.18** with the built-in LPC formant tracker; the number of LPC poles was adjusted per word for the best visual match between wideband spectrogram peaks and the LPC estimate. *(p.4-6)*
- For initial consonants, onset formants were taken at the **first discernible glottal pulse after the release burst or frication phase**. For fully voiced /l/, "onset formants" were measured in the **stationary phase of the lateral**. *(p.6)*
- Vowel formants = mean values in the visually determined steady-state portion. If a formant trajectory was diagonally rising/falling, the target was taken at the **midpoint of the vowel**; for a U-shaped (or inverse) trajectory in the vowel portion, the **minimum (or maximum)** was taken as target. *(p.6)*
- About **1% of formant values** could not be uniquely identified and were excluded. *(p.6)*
- Formant onset values in Table 1 are **medians** of the six instances (small sample size); vowel formant targets are **means of 30 instances** (each vowel after five consonants x six repetitions). *(p.6)*
- **Exception:** for /a:/ and /2:/, the measured means did not give a perceptually high-quality vowel target in informal listening tests with a formant synthesizer. Table 1 instead reports formants of **additional sustained recordings** of those vowels. General observation: the mean formant values of a vowel measured across contexts do not necessarily represent an ideal target for the vowel. *(p.6)*

## Parameters

### Table 1a: Vowel formant targets (Hz), reference speaker *(p.5)*

| Vowel | F1 | F2 | F3 |
|-------|----|----|----|
| a: | 716 | 1184 | 2814 |
| e: | 346 | 2222 | 2822 |
| i: | 265 | 2179 | 3127 |
| o: | 337 | 605 | 2730 |
| u: | 288 | 628 | 2249 |
| E: | 526 | 1918 | 2582 |
| 2: | 316 | 1311 | 1943 |
| y: | 274 | 1704 | 2032 |
| I | 406 | 1864 | 2551 |
| E | 532 | 1859 | 2609 |
| a | 694 | 1294 | 2395 |
| O | 534 | 929 | 2514 |
| U | 405 | 951 | 2540 |
| Y | 396 | 1302 | 2334 |
| 9 | 501 | 1334 | 2338 |
| @ | 435 | 1614 | 2573 |
| 6 | 639 | 1388 | 2302 |

Vowel targets are means of 30 samples, except /a:/ and /2:/ (sustained recordings). *(p.5, p.6)*

### Table 1b: Onset after /b/ — VOT (ms) and onset formants (Hz) *(p.5)*

| Vowel | VOT | F1 | F2 | F3 |
|-------|-----|----|----|----|
| a: | 14.5 | 599 | 992 | 2591 |
| e: | 14 | 318 | 2096 | 2463 |
| i: | 16 | 244 | 2100 | 2795 |
| o: | 18 | 337 | 648 | 2673 |
| u: | 34 | 265 | 589 | (n/a) |
| E: | 15 | 453 | 1664 | 2555 |
| 2: | 22 | 332 | 1171 | 2210 |
| y: | 28 | 302 | 1827 | 2222 |
| I | 12.5 | 355 | 1938 | 2518 |
| E | 13.5 | 473 | 1695 | 2474 |
| a | 13 | 604 | 1092 | 2315 |
| O | 14.5 | 472 | 744 | 2598 |
| U | 17 | 377 | 728 | 2692 |
| Y | 25 | 345 | 1226 | 2384 |
| 9 | 15 | 411 | 1257 | 2523 |

### Table 1c: Onset after /d/ — VOT (ms) and onset formants (Hz) *(p.5)*

| Vowel | VOT | F1 | F2 | F3 |
|-------|-----|----|----|----|
| a: | 17.5 | 479 | 1492 | 2663 |
| e: | 24 | 323 | 2033 | 2653 |
| i: | 27 | 232 | 2112 | 2798 |
| o: | 16 | 332 | 1339 | 2403 |
| u: | 21 | 274 | 1285 | 2241 |
| E: | 21 | 405 | 1829 | 2612 |
| 2: | 26 | 330 | 1734 | 2393 |
| y: | 29 | 247 | 1863 | 2302 |
| I | 24 | 352 | 1940 | 2569 |
| E | 19.5 | 409 | 1895 | 2574 |
| a | 18 | 507 | 1574 | 2631 |
| O | 19 | 436 | 1323 | 2591 |
| U | 18 | 351 | 1398 | 2588 |
| Y | 24.5 | 372 | 1603 | 2409 |
| 9 | 19 | 434 | 1680 | 2478 |

### Table 1d: Onset after /g/ — VOT (ms) and onset formants (Hz) *(p.5)*

| Vowel | VOT | F1 | F2 | F3 |
|-------|-----|----|----|----|
| a: | 30.5 | 461 | 1790 | 2290 |
| e: | 28 | 278 | 2313 | 2893 |
| i: | 25 | 232 | 2337 | 3050 |
| o: | 53.5 | 326 | 786 | 2269 |
| u: | 38.5 | 247 | 820 | 2180 |
| E: | 37 | 324 | 2194 | 2779 |
| 2: | 33 | 312 | 1254 | 2225 |
| y: | 38.5 | 247 | 1786 | 2082 |
| I | 35.5 | 324 | 2143 | 2780 |
| E | 39 | 375 | 2121 | 2752 |
| a | 29.5 | 490 | 1760 | 2216 |
| O | 49 | 425 | 863 | 2272 |
| U | 57.5 | 353 | 880 | 2459 |
| Y | 36 | 320 | 1203 | 2115 |
| 9 | 31.5 | 372 | 1605 | 2195 |

### Table 1e: Target of /l/ — formants in the stationary lateral (Hz) *(p.5)*

| Vowel context | F1 | F2 | F3 |
|---------------|----|----|----|
| a: | 407 | 1442 | 2738 |
| e: | 335 | 1641 | 2990 |
| i: | 296 | 1738 | 2733 |
| o: | 309 | 1431 | 2628 |
| u: | 292 | 1402 | 2421 |
| E: | 375 | 1563 | 3108 |
| 2: | 311 | 1409 | 2613 |
| y: | 293 | 1467 | 2435 |
| I | 311 | 1615 | 3000 |
| E | 376 | 1586 | 2742 |
| a | 402 | 1467 | 2833 |
| O | 366 | 1458 | 2637 |
| U | 340 | 1479 | 2595 |
| Y | 308 | 1442 | 2420 |
| 9 | 355 | 1418 | 2694 |

### Table 1f: Onset after /r/ — onset formants (Hz) *(p.5)*

| Vowel | F1 | F2 | F3 |
|-------|----|----|----|
| a: | 577 | 1185 | 2570 |
| e: | 431 | 1798 | 2769 |
| i: | 348 | 1694 | 2738 |
| o: | 372 | 616 | 2950 |
| u: | 278 | 577 | 2948 |
| E: | 472 | 1445 | 2809 |
| 2: | 351 | 814 | 2742 |
| y: | 309 | 747 | 2820 |
| I | 424 | 1416 | 2845 |
| E | 481 | 1639 | 2767 |
| a | 537 | 1287 | 2730 |
| O | 442 | 790 | 2707 |
| U | 367 | 689 | 2755 |
| Y | 354 | 742 | 2665 |
| 9 | 413 | 840 | 2598 |

No VOT column for /l/ and /r/ (not plosives). /m/ and /n/ omitted from Table 1 (antiresonances prevent reliable formant measurement). *(p.5)*

### Table 2: Control parameters of the vocal tract model (23 DOF) *(p.7)*

| Name | Symbol | Description | Units | Min | Max |
|------|--------|-------------|-------|-----|-----|
| Horiz. hyoid position | HX | relative | — | 0.0 | 1.0 |
| Vert. hyoid position | HY | absolute vertical position of hyoid and larynx | cm | −6.0 | −3.5 |
| Horiz. jaw displacement | JX | translation along the angle-bracket lever | cm | −0.5 | 0.0 |
| Jaw angle | JA | rotation of angle bracket around transverse axis | deg | −7.0 | 0.0 |
| Lip protrusion | LP | protrusion of the lip corners | — | −1.0 | 1.0 |
| Vert. lip distance | LD | distance between upper and lower lip | cm | −2.0 | 4.0 |
| Velum shape | VS | shape of velum with closed velo-pharyngeal port | — | 0.0 | 1.0 |
| Velic opening | VO | interpolates toward maximally lowered velum | — | −0.1 | 1.0 |
| Tongue body center X | TCX | — | cm | −3.0 | 4.0 |
| Tongue body center Y | TCY | — | cm | −3.0 | 1.0 |
| Tongue tip X | TTX | — | cm | 1.5 | 5.5 |
| Tongue tip Y | TTY | — | cm | −3.0 | 2.5 |
| Tongue blade X | TBX | Bezier control point | cm | −3.0 | 4.0 |
| Tongue blade Y | TBY | Bezier control point | cm | −3.0 | 5.0 |
| Tongue root X | TRX | Bezier control point | cm | −4.0 | 2.0 |
| Tongue root Y | TRY | Bezier control point | cm | −6.0 | 0.0 |
| Tongue side elevation 1 | TS1 | height of tongue side vs midsagittal contour | cm | −1.4 | 1.4 |
| Tongue side elevation 2 | TS2 | — | cm | −1.4 | 1.4 |
| Tongue side elevation 3 | TS3 | — | cm | −1.4 | 1.4 |
| Tongue side elevation 4 | TS4 | — | cm | −1.4 | 1.4 |
| Min. area tongue back region | MA1 | minimal area upstream from tongue tip | cm² | 0.0 | 0.3 |
| Min. area tongue tip region | MA2 | minimal area near tongue tip | cm² | 0.0 | 0.3 |
| Min. area lip region | MA3 | minimal area at incisors and lips | cm² | 0.0 | 0.3 |

Parameters without a unit specify relative values. *(p.7, Table 2)*

### Table 3: Mean acoustic errors (%) of consonants at voice onset, after optimization *(p.10)*

| Context vowels | /b/ | /d/ | /g/ | /l/ | /r/ |
|----------------|-----|-----|-----|-----|-----|
| /a/, /i/, /u/ (directly optimized) | 8.9 | 3.7 | 9.8 | 0.4 | 9.0 |
| All other vowels (model-derived targets) | 9.7 | 9.1 | 8.6 | 7.7 | 15.7 |

The upper row is the error for the corner-vowel contexts, where the consonant targets were directly optimized. The lower row is the error for all other long and short vowels, where the consonant target came from the proposed coarticulation model. *(p.10)*

### Acoustic optimization settings *(p.10)*
| Setting | Value | Notes |
|---------|-------|-------|
| Max contour displacement (most vowels) | 2 | mm, constraint (1) of the greedy optimizer |
| Max contour displacement for /a:, u:, 2:, y:/ | 4 | mm, needed to reach comparably low error |
| Min cross-sectional area (most vowels) | 25 | mm², constraint (2) |
| Min cross-sectional area for /u:, y:/ | 20 | mm² |
| Parameter increment per greedy step | max 0.5 mm outline displacement | e.g. TTX increments were +0.5 and −0.5 mm |
| Mean vowel formant error before optimization | 9.9 | % |
| Mean vowel formant error after optimization | 1.2 | % |
| Just-discriminable formant change (target threshold) | 5 | %, for F1 and F2, per [46] |
| Velic area | 2.0 * VO | cm², negative areas set to zero |

## Key Equations

### Acoustic error measure (RMS relative formant error)

$$
E = 100\% \cdot \sqrt{\frac{1}{3}\left(\left(1 - \frac{F1}{F1'}\right)^2 + \left(1 - \frac{F2}{F2'}\right)^2 + \left(1 - \frac{F3}{F3'}\right)^2\right)}
$$

Where: $F1, F2, F3$ are the model-derived formant frequencies (Hz) computed from the area function; $F1', F2', F3'$ are the reference speaker's measured formants (Hz) from Table 1. $E$ is dimensionless, expressed in percent. Equation (1). *(p.9)*

## Modeling: Vocal Tract Model *(p.6-8)*
- Geometrical 3D model representing the time-varying shape of the supraglottal airways; used to compute area functions for acoustic simulation. Extension of the author's previous model [12,17,36]. *(p.6)*
- Vocal tract defined by geometric surfaces of the articulators and walls (Fig 6). Each of the 23 control parameters is one DOF. Parameters were defined to permit the flexibility needed for a large sound inventory while, as far as possible, **prohibiting anatomically impossible shapes**, supported by geometrical constraints that e.g. prevent interpenetration of articulators. *(p.6)*
- **Posterior-superior cover** surface: hard palate, velum, posterior wall of pharynx and larynx. **Anterior-inferior cover**: anterior parts of larynx and pharynx and the jaw. Remaining surfaces: tongue, lips, upper and lower teeth, uvula, epiglottis. *(p.6)*
- Rigid parts (hard palate, jaw, teeth) adapted to the reference speaker's geometry from the CT plaster-model data. *(p.6)*

### Jaw *(p.7)*
- Hard palate has a fixed position in the 3D coordinate system; the jaw executes rotational and translational movements controlled by `JA` and `JX`.
- `JA` = rotation angle of an **angle bracket** around a transverse axis. The jaw slides along the long lever of the bracket; `JX` is the displacement of that translational movement.
- The fulcrum location was estimated to model the observed dependency between jaw opening and rotation in the static MRI data. It is **more posterior than the actual anatomical mandibular joint**; rotation around it corresponds to a combined rotation and vertical translation of the jaw with respect to the real temporomandibular joint [37].

### Velum (two DOF) *(p.7)*
- Traditional models use one DOF (linear interpolation between highest closed-port position and lowest open-port position, e.g. [4,12,38]). Birkholz rejects this: with only one DOF the relation between velum height and the acoustically important velar opening area is hard to determine, and the data showed considerable velum-height variation across vowels all produced with an essentially closed port. A recent study [39] found **two independent DOF of the velum**, both affecting velum shape and velar opening area.
- `VS` defines the velum shape for a **closed** velo-pharyngeal port (`VO = 0`) by linear interpolation between a maximally raised position as in /s/ and a lowered position as in /a/.
- `VO` interpolates the final velum shape between the closed-port shape specified by `VS` and a maximally lowered shape as in /m/.
- Three reference shapes modeled from the volumetric MR images: /s/ (`VS=0`, `VO=0`), /a/ (`VS=1`, `VO=0`), /m/ (`VO=1`). Shown in Fig 7 as black, gray, light gray contours.
- **Velic area = 2.0 · VO cm²**, with negative areas set to zero. *(p.7)*

### Hyoid, larynx, lips *(p.7)*
- `HX` and `HY` define hyoid position and also determine larynx shape, similar to Mermelstein's model [4]. `HY` is the absolute vertical position of hyoid and larynx.
- Larynx shape is **linearly interpolated between the narrowest (`HX = 0`) and widest (`HX = 1`) larynx shapes** observed in the volumetric MRI data.
- `LP` (protrusion of lip corners) and `LD` (vertical distance between upper and lower lip) determine all other lip dimensions per [40], from which the lip surfaces are constructed.

### Tongue *(p.7-8)*
- 3D tongue shape = midsagittal shape + tongue-side heights.
- **Tongue body:** circle of **fixed radius** with moving center at absolute coordinates (`TCX`, `TCY`).
- **Tongue tip:** a smaller second circle with variable center (`TTX`, `TTY`).
- **Tongue root:** quadratic Bezier curve with three control points. First point = the hyoid position; second point = (`TRX`, `TRY`); third point = the contact point of the tangent line to the tongue body circle that runs through (`TRX`, `TRY`).
- **Tongue blade:** quadratic Bezier curve; second control point = (`TBX`, `TBY`); first and third points are the contact points of the tangent lines to the tongue body circle and the tongue tip circle that run through (`TBX`, `TBY`).
- `TS1`..`TS4` define the height of the tongue sides relative to the midsagittal contour at **four equally spaced positions between the hyoid and the tongue tip**; `h(t)` is interpolated between these positions. This allows varying degrees of **convex and concave cross-sections** along the midsagittal contour. *(p.7-8, Fig 7)*

### Area function and acoustics *(p.8-9)*
- The area function is obtained by **intersecting the vocal tract surfaces with planes perpendicular to the center line of the airway**, per [36].
- The center line course is based on the position of the tongue body circle, so it dynamically adapts to major shape variations. *(p.8)*
- Because the surfaces are triangle meshes, precise cross-sectional areas in constricted regions are hard to control with the geometric parameters. For fricatives, the constriction area is a sensitive aerodynamic parameter for flow resistance and noise-source properties, so `MA1`, `MA2`, `MA3` were introduced to directly enforce minimal areas in the tongue-back, tongue-tip, and incisor/lip regions respectively; they directly affect the area function. *(p.8)*
- Model formants are determined from the **volume-velocity transfer function of the vocal tract computed in the frequency domain from the area function** per [14,36], including acoustic energy losses due to **sound radiation, soft walls, and viscous friction**, plus **inner-length corrections of the vocal tract tube sections** [44]. *(p.9)*
- Example area function (Fig 6C): glottis at 0 cm, mouth opening at 15.5 cm; cross-sectional area range roughly 0.5-4.8 cm². *(p.6, Fig 6C)*

### Greedy acoustic optimization algorithm *(p.9-10)*
1. Start from the vocal tract shape manually fitted to the MRI contours (visual registration).
2. In each optimization step, identify the vocal tract parameter for which a small positive or negative incremental change gives the **biggest reduction of the acoustic error `E`** (Eq 1).
3. Apply that incremental change to the parameter.
4. Repeat on the resulting shape until no reduction of `E` is possible.
- Increments are defined so the vocal tract **outline is displaced by no more than 0.5 mm per step**. Example: `TTX` increments were +0.5 mm and −0.5 mm. *(p.9)*
- Constraint (1): the model contour may not deviate more than a preset threshold from the initial MRI-fitted contour, keeping the shape geometrically similar to the tracings. *(p.9)*
- Constraint (2): the cross-sectional area may not fall below a preset threshold, to prevent unrealistically narrow constrictions that would cause excessive pressure drops or turbulence noise during vowel synthesis [45]. *(p.10)*

## Modeling: Consonant-Vowel Coarticulation *(p.9-10)*
- A CV syllable is modeled as a **smooth unidirectional movement** from an initial vocal tract shape appropriate for the consonant to a target shape for the vowel. *(p.9)*
- The **vowel target is invariant**, i.e. independent of the preceding consonant, following Lindblom's **undershoot model [42]**. All potential variations of a vowel are assumed to be caused by **vowel target undershoot**; all other coarticulatory influences of consonants on vowels are treated as truly allophonic variations that would need different target shapes for different allophones. *(p.9)*
- In contrast, the **consonant target is context-sensitive** [30], varying with the context vowel, derived as the weighted average of three reference shapes in /a/, /i/, /u/ context. *(p.9)*

### Reference vocal tract shapes for vowels *(p.9)*
- For each vowel in the volumetric MRI corpus, the vocal tract parameters were manually adjusted for the best visual match between the traced contours (including tongue sides) and the model contours (Fig 8, red vs gray).
- Visual match does not guarantee acoustic match because: the vocal tract model is a non-perfect approximation of the real tract; traced contour accuracy is limited by image resolution; artificially sustained vowels in the MRI machine do not necessarily represent ideal vowel targets; and in some regions even small deviations from the "correct" articulation cause substantial acoustic changes [43]. Hence the acoustic optimization above. *(p.9)*

### Reference vocal tract shapes for consonants *(p.10)*
- The normalized dynamic-MRI tracings were used to model context-sensitive targets for /b, d, g, l, r, m, n/ in /a/, /i/, /u/ context, with parameters manually adjusted for a visual match analogously to the vowels.
- /b, d, g, l/: articulatory data directly available from the corpus.
- /r/: modeled from the /x/ tracings. The /r/-in-/i/-context shape, absent from the corpus, was **manually modeled based on the /g/-in-/i/-context contours with a more retracted tongue**. *(p.10)*
- /m/ and /n/: modeled on /b/ and /d/ with a lowered velum. *(p.10)*
- **Virtual targets:** for each /b/, /d/, /g/ target shape, the vocal tract parameter(s) of the **primary articulator** were set to a **position that cannot actually be reached** by the articulator. This simulates the high velocities of the primary articulators at the time of closure release within the framework of the **target approximation model [47]**. Examples: the tongue tip target for /d/ was set **above the hard palate**; the lip distance for /b/ was set to a **negative value**. *(p.10)*
- The virtual positions were adjusted such that the **release of the closure happens about in the middle of the transition** from the context-sensitive consonant target to the corresponding context vowel target. *(p.10)*

## Figures of Interest
- **Fig 1 (p.2):** SAMPA/IPA symbol table for all sounds used.
- **Fig 2 (p.3):** Example MRI images and traced contours. A: volumetric midsagittal /y:/ (original, Sobel-enhanced, traced). B: real-time MRI /d/ in /a/-context. Thick dashed lines = tongue side outline; thin dashed lines = angle of rear pharyngeal wall relative to hard palate (varies between corpora).
- **Fig 3 (p.3):** Beier-Neely warping for head-posture normalization, showing fulcrum plus source/target vector pairs.
- **Fig 4 (p.3):** Convex hulls of vowel samples in the F1-F2 plane; gray = long vowels, white = short vowels; white squares mark the rejected mean values for /2:/ and /a:/, white circles the substituted sustained-vowel targets.
- **Fig 5 (p.4):** Stylized formant transitions from /b, d, g/ (panel A) and /l, r/ (panel B) to the eight long German vowels, from the onset and target values in Table 1. Frequency axis 0-3.5 kHz.
- **Fig 6 (p.6):** The 3D vocal tract model. A: surface rendering for /E:/. B: wireframe of the model surfaces (uvula, posterior-superior cover, anterior-inferior cover, lips, epiglottis, upper teeth, tongue). C: area function for the shape in A, glottis at 0 cm, mouth opening at 15.5 cm.
- **Fig 7 (p.7):** Areas of influence of the vocal tract parameters, in cm coordinates (x from −3 to 7, y from −7 to 2), plus the tongue-side cross-section h(t) over z from −2 (left) to +2 (right).
- **Fig 8 (p.8):** Midsagittal tracings for /a:/, /i:/, /u:/: MRI tracing (gray), visually matched model contour (red), acoustically optimized shape (black).
- **Fig 9 (p.8):** Acoustic errors before (full bars) and after (dark bars) optimization. A: vowels. B: consonants /b, d, g, l, r/ in the three corner-vowel contexts.
- **Fig 10 (p.9):** Vocal tract shapes and parameter time functions for synthesizing /ga/, including the transition function, glottal rest displacement, F0 in semitones, subglottal pressure, and the spectrogram; marks t0 (movement onset), t1 (closure release), t2 (movement offset).
- **Fig 11 (p.10):** Modeled (post-optimization) vocal tract shapes for /b/, /d/, /g/ in /a/, /i/, /u/ context (A-C, reference shapes) and in /y/ context (D, calculated by the coarticulation model). Dashed lines = tongue side contour.

### Fig 9A: per-vowel acoustic error, before -> after optimization (%) *(p.8)*
| Vowel | Before | After |
|-------|--------|-------|
| a: | 18.0 | 5.3 |
| e: | 13.1 | 0.1 |
| i: | 10.6 | 3.2 |
| o: | 19.0 | 1.9 |
| u: | 12.0 | 1.2 |
| E: | 10.4 | 0.2 |
| 2: | 10.6 | 1.2 |
| y: | 12.6 | 1.8 |
| a | 6.4 | 0.1 |
| I | 11.5 | 0.0 |
| E | 11.3 | 2.0 |
| O | 5.6 | 0.1 |
| U | 3.8 | 1.0 |
| 9 | 2.1 | 0.0 |
| Y | 4.5 | 0.1 |
| @ | 11.2 | 1.2 |
| @6 | 5.6 | 0.2 |

### Fig 9B: per-CV acoustic error, before -> after optimization (%) *(p.8)*
| Syllable | Before | After |
|----------|--------|-------|
| ba: | 16.5 | 13.1 |
| bi: | 9.1 | 5.6 |
| bu: | 9.4 | 8.1 |
| da: | 14.6 | 9.1 |
| di: | 4.5 | 2.1 |
| du: | 2.8 | 0.0 |
| ga: | 14.0 | 6.6 |
| gi: | 6.2 | 5.6 |
| gu: | 17.3 | 17.1 |
| la: | 11.4 | 1.0 |
| li: | 19.8 | 0.2 |
| lu: | 6.8 | 0.0 |
| ra: | 17.6 | 10.9 |
| ri: | 11.5 | 8.9 |
| ru: | 24.3 | 7.3 |

## Consonant-Specific Target Modeling Details *(p.10-11)*

- **/d/ virtual target example:** in /a/-context, the virtual target for the tongue tip was placed **10 mm above the hard palate**, which coincides with the distance between tongue tip and palate in /a/. *(p.11)*
- **/g/ in /a/-context:** the closure is released about half-way between the /g/-target and the /a/-target (Fig 10, dashed tongue contour). *(p.11)*
- **/l/:** for the three context-sensitive targets, the tongue tip was set to positions where it **just touched the palate**, i.e. to **non-virtual targets**. The tongue sides were lowered to create lateral channels with a **total cross-sectional area of 30 mm²**, which falls well within the 0.26-0.41 cm² range measured by Narayanan et al. [48]. *(p.11)*
- **/r/:** modeled as a **voiced uvular fricative**. For the three context-sensitive targets, the tongue body was set to a position where it just touched the velum. `MA1` was used to adjust the constriction area to **0.15 cm²**, a typical minimal constriction area for voiced fricative consonants [49]. *(p.11)*
- **/m/ and /n/:** modeled with the same optimized shapes as /b/ and /d/ with the **velic opening parameter `VO` set to 0.5** (velic opening area 1 cm²). In some cases the cross-sectional area between tongue back and lowered velum became unrealistically small; if it fell below **0.3 cm²**, the tongue body position was adjusted as little as possible to establish a minimal area of 0.3 cm². *(p.11)*
- **Consonant acoustic optimization target:** minimize the difference between measured and synthesized formants **at vowel onset** (Table 1), because these are important (although not the only) perceptual cues for place of articulation [24,50]. *(p.11)*
- **Vowel-onset definition in simulation:** for /b/, /d/, /g/, /r/, vowel onset was assumed to happen at the point along the linear transition from the context-sensitive consonant shape to the vowel shape where the **constriction area increased to 0.2 cm²**. There are no precise data on plosive/fricative constriction area at voice onset with current measurement technology; 0.2 cm² was estimated from data on voice onset times and rates of constriction area increase after plosives [45,50]. For /l/, formants were computed directly from the consonant target. *(p.11)*
- **Consonant optimization constraint:** maximal allowed contour displacement was set to **4 mm** (instead of 2 mm as for vowels), because of the greater uncertainties in the traced contours due to the low spatial and temporal resolution of the dynamic MRI data. The vocal tract parameters defining the position of the **primary articulator were not modified** during the optimization. *(p.11)*

## The Coarticulation Model (core algorithm) *(p.11-12)*

### Basic assumption *(p.11)*
The vowels /a/, /i/, /u/ effectively represent the **corners of the lingual vowel space**, and the measured consonant targets in the context of these vowels represent the corresponding **extreme points of the consonants' lingual coarticulatory variation**. An arbitrary context vowel is treated as a weighted average of /a/, /i/, /u/, and the context-sensitive consonant target is the correspondingly weighted average of the measured consonants in those contexts.

### Lingual/labial split *(p.11)*
Vowels are distinguished not only by lingual articulation but also by lip rounding. For example, /i/ and /y/ have roughly the same tongue position but the lips are unrounded for /i/ and rounded for /y/. Therefore the **lip shape of a context-sensitive consonant is derived independently from the tongue shape**, based on the lip shape in the context vowel. The lip shapes of /a/, /i/, /u/ are also roughly extreme labial articulations: **maximal aperture for /a/, maximal protrusion for /u/, minimal protrusion for /i/**.

The Table-2 parameters are split into two sets:

$$
\mathbf{x} = (HX, HY, JX, JA, VS, VO, \ldots, MA3)^{\mathrm{T}}
$$

$$
\mathbf{y} = (LP, LD)^{\mathrm{T}}
$$

Where: $\mathbf{x}$ is the **lingual** articulation vector (all vocal tract parameters except the two lip parameters, 21 components), and $\mathbf{y}$ is the **labial** articulation vector (2 components). *(p.11)*

### Step 1: express the context vowel in the corner-vowel subspace (lingual)

$$
\mathbf{x}_v = \mathbf{x}_a + \alpha_1 \cdot (\mathbf{x}_i - \mathbf{x}_a) + \alpha_2 \cdot (\mathbf{x}_u - \mathbf{x}_a)
$$

Where: $\mathbf{x}_a, \mathbf{x}_i, \mathbf{x}_u$ are the lingual parameter vectors of the reference shapes for /a/, /i/, /u/; $\mathbf{x}_v$ is the lingual parameter vector of the arbitrary context vowel; $\alpha_1, \alpha_2$ are dimensionless weights. Equation (2). *(p.11)*

Re-arranged into a linear system:

$$
\mathbf{x}_v - \mathbf{x}_a = \begin{pmatrix} \mathbf{x}_i - \mathbf{x}_a & \mathbf{x}_u - \mathbf{x}_a \end{pmatrix} \cdot \begin{pmatrix} \alpha_1 \\ \alpha_2 \end{pmatrix} = A \cdot \begin{pmatrix} \alpha_1 \\ \alpha_2 \end{pmatrix}
$$

Where: $A$ is the matrix whose two columns are the difference vectors $(\mathbf{x}_i - \mathbf{x}_a)$ and $(\mathbf{x}_u - \mathbf{x}_a)$. Equation (3). *(p.11)*

### Step 2: solve for the weights via pseudo-inverse

$$
\begin{pmatrix} \alpha_1 \\ \alpha_2 \end{pmatrix} = A^{-1} \cdot (\mathbf{x}_v - \mathbf{x}_a)
$$

Where: $A^{-1}$ is the **pseudo-inverse of $A$ found by singular value decomposition**, used because $A$ is likely to be singular (the system is overdetermined: 21 equations, 2 unknowns). Equation (4). *(p.12)*

### Step 3: constrain the weights to the corner-vowel triangle
Before $\mathbf{x}_c$ is calculated, the position $(\alpha_1, \alpha_2)$ in the subspace is limited to the **triangular region spanned by the reference vowels** by enforcing:

$$
0 \le \alpha_1 \le 1, \quad 0 \le \alpha_2 \le 1, \quad 0 \le \alpha_1 + \alpha_2 \le 1
$$

*(p.12)*

### Step 4: apply the same weights to the consonant reference shapes (lingual)

$$
\mathbf{x}_c = \mathbf{x}_{c(a)} + \alpha_1 \cdot (\mathbf{x}_{c(i)} - \mathbf{x}_{c(a)}) + \alpha_2 \cdot (\mathbf{x}_{c(u)} - \mathbf{x}_{c(a)})
$$

Where: $\mathbf{x}_{c(a)}, \mathbf{x}_{c(i)}, \mathbf{x}_{c(u)}$ are the known lingual parameter vectors for the consonant articulation in /a/-, /i/-, and /u/-context; $\mathbf{x}_c$ is the resulting context-sensitive lingual consonant target. Equation (5). *(p.12)*

### Step 5: same procedure for the labial articulation

$$
\mathbf{y}_v = \mathbf{y}_a + \beta_1 \cdot (\mathbf{y}_i - \mathbf{y}_a) + \beta_2 \cdot (\mathbf{y}_u - \mathbf{y}_a)
$$

Where: $\mathbf{y}_a, \mathbf{y}_i, \mathbf{y}_u$ are the lip parameter vectors $(LP, LD)^{\mathrm{T}}$ of the corner vowels; $\mathbf{y}_v$ is the lip vector of the context vowel. The system is solved for $\beta_1, \beta_2$, which are then **limited analogously to $\alpha_1, \alpha_2$**. Equation (6). *(p.12)*

$$
\mathbf{y}_c = \mathbf{y}_{c(a)} + \beta_1 \cdot (\mathbf{y}_c(i) - \mathbf{y}_{c(a)}) + \beta_2 \cdot (\mathbf{y}_c(u) - \mathbf{y}_{c(a)})
$$

Where: $\mathbf{y}_c$ is the context-sensitive labial consonant target. Equation (7). *(p.12)*

### Worked example: /y/-context *(p.12, Fig 11D)*
Mapping /y/ into the /a, i, u/-subspace gives:

| Coefficient | Raw value | After constraint |
|-------------|-----------|------------------|
| alpha_1 (lingual, /i/) | 0.69 | 0.69 |
| alpha_2 (lingual, /u/) | 0.06 | 0.06 |
| beta_1 (labial, /i/) | 0.13 | 0.08 |
| beta_2 (labial, /u/) | 0.97 | 0.92 |

The lip shape lies slightly outside the triangle of reference lip shapes because $\beta_1 + \beta_2 > 1$; therefore $\beta_1$ and $\beta_2$ are **reduced by equal amounts** to 0.08 and 0.92 to satisfy the condition. The resulting combinations:

$$
\mathbf{x}_y \approx 0.25 \cdot \mathbf{x}_a + 0.69 \cdot \mathbf{x}_i + 0.06 \cdot \mathbf{x}_u
$$

$$
\mathbf{y}_y \approx 0.08 \cdot \mathbf{y}_i + 0.92 \cdot \mathbf{y}_u
$$

In other words, the lingual articulation of /y/ is most similar to /i/, and the labial articulation most similar to /u/. Putting these into Eqs 5 and 7 gives the consonant targets in Fig 11D. *(p.12)*

Note the /a/ coefficient is the residual: $1 - \alpha_1 - \alpha_2 = 0.25$ for the lingual case, and $1 - \beta_1 - \beta_2 = 0.00$ for the labial case.

### Acoustic validation of the model *(p.12)*
Target shapes for /b, d, g, l, r/ were calculated in the context of all long and short German vowels **except** the corner vowels. For each CV combination, the vocal tract shape at the release of the constriction was calculated to obtain the formant frequencies at vowel onset; errors per Eq 1 are in the second row of Table 3. For /b/ and /d/ the error is roughly the same as in the optimized reference contexts. For /d/, /l/, /r/ the error increased by only 5.4, 7.3 and 6.7% respectively. Conclusion: the vocal tract shape interpolation allows a good simulation of context-sensitive consonant acoustics across context vowels.

## Experiment: Stimuli Creation *(p.12-13)*

- **Stimuli:** CV syllables for all combinations of /b, d, g, l, r, m, n/ with the eight long vowels /a:, e:, i:, o:, u:, E:, 2:, y:/, i.e. **56 items total**. *(p.12)*
- **Synthesizer:** VocalTractLab, with the coarticulation model implemented. *(p.12)*
- **Acoustic model:** the vocal apparatus is a **branched acoustic tube system** comprising trachea, glottis, and pharyngeal, oral and nasal cavities [36]. *(p.12)*
  - Pharyngeal + oral area function from the vocal tract model above.
  - **Trachea:** uniform tube of **14 cm length**.
  - **Nasal cavity:** area function per Dang et al. [51].
  - **Glottis:** two tube sections, geometry from the glottal shape model of Titze [52] extended by Birkholz [36].
  - A detailed **aero-acoustic simulation method** generates the speech signal on the tube system [14,15,36].
- **Control:** time-functions for the vocal tract and glottis parameters (Fig 10). Vocal tract parameters initialized at the context-sensitive consonant target, then simultaneously start approaching their vowel target values at time $t_0$. *(p.12-13)*
- **Transition function:** the **step response of a critically damped sixth-order linear system [53]**, which closely resembles the sigmoidal trajectory of natural goal-directed movements. The velocity of the vowel target approach is controlled by the **time constant** of the system. *(p.13)*
- **Time constants**, individually estimated per consonant by matching formant transition durations of the synthetic syllables to naturally spoken syllables: *(p.13)*

| Consonant class | Time constant |
|-----------------|---------------|
| /l/ | 7 ms |
| /b/, /d/, /g/, /r/ | 15 ms |
| /m/, /n/ | 25 ms |

  A higher time constant gives a longer transition time and slower articulator velocity. Consequently the simulated closure release of the nasals is generally slower than that of the plosives, in agreement with measured data [45].
- **Timing landmarks (Fig 10, /ga/):** $t_0$ = movement onset, $t_1$ = closure release, $t_2$ = movement offset / vowel target reached. The release occurs about half-way between the (virtual) consonant target and the vowel target. *(p.13)*
- **Glottis control:** degree of glottal abduction $d_\mathrm{rest}$ (pre-phonatory rest displacement of the inferior and superior edges of the vocal folds from the glottal midline at the level of the vocal processes), fundamental frequency $F_0$, and subglottal pressure $P_\mathrm{sub}$. *(p.13)*
  - $P_\mathrm{sub}$ and $F_0$ time functions identical for all stimuli. $P_\mathrm{sub}$ quickly raised from 0 to **1000 Pa** at syllable onset and smoothly lowered back to 0 Pa at the end. $F_0$ reproduced from a spoken CV syllable for natural intonation.
  - $d_\mathrm{rest}$ initialized with a consonant-appropriate value and starts approaching the vowel value at about $t_1$.
- **Glottal abduction values** *(p.13-14)*:

| Context | d_rest (mm) | Phonation type | Resulting VOT |
|---------|-------------|----------------|---------------|
| Vowel target (modal phonation) | 0.15 | modal | — |
| /b/, /d/ initial | 0.05 or 0.15 | slightly-pressed or modal | short (mean VOT 18 ms for /b/, 22 ms for /d/) |
| /g/ initial | 0.25 | slightly breathy | longer (mean VOT 38 ms) |
| /l/, /m/, /n/ | adjusted as for the vowel | — | — |
| /r/ | slightly more abducted than modal | generates frication noise at the supraglottal constriction | — |

  Measured mean VOTs used for tuning: **18 ms for /b/, 22 ms for /d/, 38 ms for /g/**. *(p.14)*
- After synthesis, the amplitude of the stimuli was **normalized**. All stimuli are in supplemental Audio S1-S7. *(p.14)*

## Experiment: Subjects and Method *(p.14)*
- **N = 20** German listeners (9 men, 11 women), aged 21-57, native speakers of German except one native English speaker resident in Germany for 30+ years. **16 of 20** had a background in speech therapy or phonetics. None reported hearing impairment.
- Each participant first listened to the eight isolated synthetic vowels to get used to the synthetic voice.
- Stimuli presented in a **different random order per participant**, in a quiet room, over **closed earphones**. Each stimulus could be **repeated once on request**.
- Task: check one of the consonants "b", "d", "g", "l", "r", "m", "n" and one of the long German vowels "a", "e", "i", "o", "u", "ä", "ö", "ü" from a list after each stimulus. Decisions made spontaneously (no actual time limit); the most similar phoneme was to be checked in case of uncertainty.
- N = 140 items per vowel; N = 20 responses per syllable.

## Results

### Table 4: Recognition rates of the synthesized phonemes (%), N = 20 subjects *(p.11)*

Vowels:

| Statistic | a: | e: | i: | o: | u: | E: | 2: | y: | all |
|-----------|----|----|----|----|----|----|----|----|-----|
| Mean | 100 | 100 | 84.3 | 100 | 87.1 | 100 | 97.1 | 94.3 | 95.4 |
| S.D. | 0.0 | 0.0 | 32.7 | 0.0 | 19.1 | 0.0 | 7.5 | 17.0 | 7.8 |
| S.E. | 0.0 | 0.0 | 7.3 | 0.0 | 4.3 | 0.0 | 1.7 | 3.8 | 1.7 |

Consonants:

| Statistic | b | d | g | l | r | m | n | all |
|-----------|---|---|---|---|---|---|---|-----|
| Mean | 73.1 | 71.9 | 83.1 | 100 | 81.3 | 67.5 | 100 | 82.4 |
| S.D. | 21.2 | 18.1 | 19.1 | 0.0 | 23.1 | 14.8 | 0.0 | 6.2 |
| S.E. | 4.7 | 4.0 | 4.3 | 0.0 | 5.2 | 3.3 | 0.0 | 1.4 |

### Table 5: Confusion matrix for vowels (%, N = 140 per vowel) *(p.12)*

| Stimulus \ Perceived | a: | e: | i: | o: | u: | E: | 2: | y: |
|----------------------|----|----|----|----|----|----|----|----|
| a: | **100** | . | . | . | . | . | . | . |
| e: | . | **100** | . | . | . | . | . | . |
| i: | . | 15.0 | **84.3** | . | . | . | 0.7 | . |
| o: | . | . | . | **100** | . | . | . | . |
| u: | . | . | . | 12.1 | **87.1** | . | . | 0.7 |
| E: | . | . | . | . | . | **100** | . | . |
| 2: | . | . | . | . | . | . | **97.1** | 2.9 |
| y: | . | . | . | . | . | . | 5.7 | **94.3** |

### Table 6: Confusion matrix for consonants (absolute counts, N = 20 per syllable) *(p.13)*

| Syllable | b | d | g | l | r | m | n |
|----------|---|---|---|---|---|---|---|
| ba: | **20** | . | . | . | . | . | . |
| be: | **16** | . | 3 | 1 | . | . | . |
| bi: | **13** | 3 | 3 | . | 1 | . | . |
| bo: | **12** | . | 1 | . | 7 | . | . |
| bu: | **14** | . | 3 | 3 | . | . | . |
| bE: | **20** | . | . | . | . | . | . |
| b2: | **10** | 1 | 8 | . | 1 | . | . |
| by: | **12** | 1 | 1 | 2 | 3 | . | 1 |
| da: | 1 | **8** | 10 | 1 | . | . | . |
| de: | . | **13** | 7 | . | . | . | . |
| di: | . | **15** | 5 | . | . | . | . |
| do: | . | **20** | . | . | . | . | . |
| du: | . | **17** | 3 | . | . | . | . |
| dE: | 1 | **14** | 4 | . | 1 | . | . |
| d2: | . | **17** | 3 | . | . | . | . |
| dy: | 4 | **11** | . | 4 | . | . | 1 |
| ga: | . | 4 | **16** | . | . | . | . |
| ge: | . | 5 | **15** | . | . | . | . |
| gi: | . | 6 | **14** | . | . | . | . |
| go: | . | . | **20** | . | . | . | . |
| gu: | . | 1 | **19** | . | . | . | . |
| gE: | . | 10 | **10** | . | . | . | . |
| g2: | . | . | **20** | . | . | . | . |
| gy: | . | 1 | **19** | . | . | . | . |
| la: - ly: (all 8) | . | . | . | **20** | . | . | . |
| ra: | . | 1 | . | . | **19** | . | . |
| re: | . | 7 | 1 | 1 | **11** | . | . |
| ri: | . | 5 | 1 | 1 | **13** | . | . |
| ro: | 1 | . | . | . | **19** | . | . |
| ru: | 4 | 1 | . | . | **15** | . | . |
| rE: | . | 5 | 1 | . | **14** | . | . |
| r2: | . | . | . | . | **20** | . | . |
| ry: | 1 | . | . | . | **19** | . | . |
| ma: | . | . | . | . | . | **19** | 1 |
| me: | . | . | . | . | . | **1** | 19 |
| mi: | . | . | . | . | . | **7** | 13 |
| mo: | . | . | . | . | . | **20** | . |
| mu: | . | . | . | . | . | **20** | . |
| mE: | . | . | . | . | . | **8** | 12 |
| m2: | . | . | . | . | . | **20** | . |
| my: | . | . | . | . | . | **13** | 7 |
| na: - ny: (all 8) | . | . | . | . | . | . | **20** |

## Results and Discussion *(p.14)*

- **Vowels:** recognition rates 84.3-100%. Statistically significant differences only between /i:/ and each of /a:/, /e:/, /o:/, /E:/ by pairwise Bonferroni-corrected t-tests (p < 0.05). Overall 95.4%, close to natural vowels: Hillenbrand and Nearey [54] report 96% average for 12 English vowels in /hVd/ syllables. *(p.14)*
- **/i:/ had the lowest vowel recognition rate.** 15.7% of /i:/ were heard as /e:/, and 12.1% of /u:/ as /o:/. This indicates the articulations of the corner vowels /i:/ and /u:/ **were not extreme enough** to differ sufficiently from their neighbors. Root cause: the vowels were acoustically optimized toward **mean formant frequencies of 30 realizations in different contexts**, and these means apparently do not represent the asymptotic underlying targets for all vowels. Future work: consider the formant transitions toward the individual vowel samples to obtain more representative vowel targets. *(p.14)*
- **Consonants:** recognition rates 67.5-100%. Only /n/ and /l/ (both 100%) were significantly higher than all other consonants (/b/, /d/, /g/, /r/, /m/) with p < 0.05 (Bonferroni-corrected t-tests). Overall **82.4%**. *(p.14)*
- **Human baseline:** for pseudowords produced by humans, consonant recognition is 99% for CV syllables (Klatt [55]) or 98% for the same seven consonants in VCV syllables (Broersma and Scharenborg [56]). This should be the goal or upper bound for all speech synthesis programs. *(p.14)*
- **Novelty claim:** to the author's knowledge this is the first study where consonant recognition generated with articulatory speech synthesis was systematically evaluated for a range of different context vowels, so there is no directly comparable synthetic-speech baseline. *(p.14)*
- **Comparison with formant synthesis:** formant synthesis raised consonantal recognition in nonsense CV syllables from about 75% in the first systems to about 95% in the best systems [55]. But achieving 95% required **very detailed rules describing the fine spectral details of the different consonants**. In contrast, the articulatory method here achieves 82.4% with **only a few simple control rules**. *(p.14)*
- **/l/ and /n/ at 100%:** indicates the coarticulation model can generally simulate the essential articulatory-acoustic variability of consonants. *(p.14)*
- **/m/ lowest (67.5%):** all falsely identified /m/ were heard as /n/. The feature "nasality" was well simulated, but /m/ was not distinct enough from /n/. Apparently the articulation of /m/ differs somewhat more from /b/ with a lowered velum than assumed. Using **actual articulatory measurements of the nasals** to create their reference shapes could improve perceptual discrimination. *(p.14)*
- **/g/ ~10% (absolute) higher than /b/ and /d/**, even though the acoustic errors in formant onset frequencies were roughly equal (Table 3). This shows the importance of **perceptual cues other than formant transitions** for plosive discrimination. One is VOT, roughly reproduced from the measurements (Table 1); /g/'s clearly higher VOT could account for its better recognition, since VOT was previously demonstrated to be highly effective in classifying place of articulation for plosives [50]. Another important cue is the **spectrum of the release burst** [57]; the burst was automatically generated by the preliminary noise source model [15], but noise-source simulation in the time-varying vocal tract is an extensive research subject of its own with no realistic, complete model yet. A more realistic noise source model could substantially improve plosive discrimination. *(p.14)*
- **/r/ at 81.3%**, synthesized as a uvular voiced fricative; major confusions occurred in the context of the front vowels /i:/, /e:/, /E:/. The reason could be that the context-sensitive vocal tract shape for /r/ in /i/-context had to be **estimated** (not recorded in the real-time MRI corpus). Some participants reported hearing a **/z/ instead of /r/** in front-vowel contexts, which indicates the tongue position was too far anterior for the estimated reference shape, and/or that the noise source model generated noise sources too far downstream in the vocal tract or with inappropriate spectral properties. *(p.14-15)*

## General Discussion *(p.15)*
- Text-to-speech is currently dominated by concatenative and statistical parametric techniques, but the increasing demands for highly expressive and flexible synthesis are hard to satisfy with these. Articulatory synthesis is becoming a serious alternative again, in particular because increased availability of MR imaging makes detailed quantitative vocal tract and articulation models possible. *(p.15)*
- This study combined **static MRI, dynamic MRI, and acoustic recordings of the same speaker**. *(p.15)*
- **Key advantage of the phenomenological approach:** relatively little data is needed to model the coarticulatory variability of a consonant, and that data can be measured directly. Application to other phonemes, speakers, and languages is straightforward, for example using the analogously available MRI corpus of a British English speaker [58]. *(p.15)*
- **Asymmetry of the model:** consonants get context-sensitive targets; vowels are modeled as **invariant asymptotic targets** per the undershoot model [42]. *(p.15)*
- **Main current limitation: the noise source model**, which generates turbulence noise for fricatives and bursts for plosives. The challenge is to accurately predict the position, strength and spectral shape of noise sources from vocal tract geometry and aerodynamic conditions. No such model is currently realistic and complete under all conditions. The plosives /b/, /d/, /g/ and the approximant /r/ involved noise sources for bursts and frication respectively, all known to be relevant perceptual cues [55,57]. Future advances in noise source models will likely raise recognition for these consonants. *(p.15)*
- Despite limitations, the performance seems already high enough for many TTS applications where higher-level context contributes to word recognition and sentence comprehension. Demonstrated by Video S1/S2: the German sentence "Lea und Doreen mögen Bananen." ([le:aUndo:re:nm2:gN-bana:n@n]) synthesized with the model; F0 contour and phone durations reproduced from the same sentence spoken by the author. Image S1 shows natural vs synthesized oscillograms and spectrograms side by side, illustrating good agreement between natural and synthetic formant transitions. *(p.15)*

## Limitations *(p.14-15)*
- Only **CV syllables** were modeled. Neither CVC syllables nor syllables with **consonant clusters** were addressed, both necessary for unlimited speech synthesis. Time-structure models of the syllable [59] and models of CC coarticulation (e.g. [60]) offer initial guidance for future work. *(p.15)*
- The **noise source model** is preliminary [15] and is the most important limitation of the synthesizer. *(p.15)*
- Much of the data analysis and model construction was **hand crafted**: tracing contours in the MR images, manually adjusting the vocal tract parameters to match model and MRI contours, and manually determining formants in the acoustic recordings. Future work should partly automate these to save time when adapting to new speakers and to increase reproducibility. A good candidate for automation is contour tracing in MR images, e.g. via Bresch and Narayanan [61]. *(p.15)*
- **/r/ reference shape in /i/-context was estimated**, not measured, because /r/ was absent from the real-time MRI corpus (/x/ was substituted for the other contexts). *(p.10, p.14)*
- **/m/ and /n/ reference shapes were derived from /b/ and /d/ with a lowered velum**, not measured; this appears to be why /m/ was confused with /n/. *(p.3, p.14)*
- **Tongue-side contours** for the dynamic MRI corpus came from a pilot study with a **different speaker**, so they are approximations. *(p.4)*
- The **mean formant values** used as vowel targets do not represent the asymptotic underlying targets for all vowels; /i:/ and /u:/ came out not extreme enough. *(p.14)*
- Real-time MRI frame rate was only **8 Hz**, so consonantal targets were captured in only some repetitions, and contour uncertainty forced a looser 4 mm displacement constraint for consonants. *(p.3-4, p.11)*
- **Vowel coarticulation on consonants only in one direction:** consonant-on-vowel influence beyond undershoot is dismissed as "truly allophonic variation" requiring separate targets, and is not modeled. *(p.9)*
- There are **no precise data** on the constriction area of plosives or fricatives at voice onset with current measurement technology; the 0.2 cm² value was estimated. *(p.11)*
- The single-speaker basis limits generalization; all data came from one adult native speaker of Standard German. *(p.2)*

## Arguments Against Prior Work
- **Ohman's superposition model [16] and its successors [20-22]:** used a context-independent *coarticulation function* specifying how much an assumed ideal consonant shape may be distorted by the vowel shape as a function of position along the center line. Birkholz's alternative uses directly measured, context-sensitive consonant targets instead of a single ideal shape plus a distortion function. *(p.1-2)*
- **Dominance models [12,17,23]:** each vocal tract parameter of a consonant carries a context-independent dominance value; the less involved a parameter, the more it is determined by the underlying vowel. Same objection: a single context-independent consonant specification. *(p.1)*
- **One-DOF velum models [4,12,38]:** rejected because the relation between velum height and the acoustically important velar opening area cannot be determined with one DOF, and the data showed considerable velum-height variation across vowels all produced with an essentially closed port. A recent study [39] found two independent DOF. *(p.7)*
- **Formant synthesis rules [55]:** achieving 95% consonant recognition required very detailed rules for the fine spectral details of consonants; the articulatory approach here reaches 82.4% with only a few simple control rules. *(p.14)*
- **Most past articulatory models** aimed at simulating basic articulatory phenomena without focusing on perception or high-quality synthesis. *(p.2)*
- **Mean formant values across contexts** are argued not to represent an ideal vowel target: for /a:/ and /2:/ the means failed informal listening tests and sustained-vowel recordings were substituted. *(p.6)*

## Design Rationale
- **Corner vowels as the interpolation basis:** /a/, /i/, /u/ are the most extreme lingual articulations (tongue low and back; high and forward; high and back), and they mark the corners of the acoustic vowel space. Their consonant realizations therefore bracket the extremes of a consonant's coarticulatory and acoustic variation. *(p.2, p.11)*
- **Separate lingual and labial interpolation:** because vowels differ in lip rounding independently of tongue position (/i/ vs /y/ have nearly identical tongue positions but opposite rounding), a single set of weights over the whole parameter vector would give wrong lip shapes. *(p.11)*
- **Pseudo-inverse via SVD:** the system in Eq 3 is overdetermined (21 lingual equations, 2 unknowns) and $A$ is likely singular, so a least-squares pseudo-inverse is used rather than a direct solve. *(p.11-12)*
- **Constraining $(\alpha_1, \alpha_2)$ to the triangle:** keeps the derived consonant target inside the convex hull of the three measured reference shapes, preventing extrapolation into unmeasured articulatory territory. When the raw solution is outside, the coefficients are reduced by **equal amounts** until the constraint is satisfied. *(p.12)*
- **Virtual targets for primary articulators:** setting the target beyond the reachable position (tongue tip above the hard palate for /d/; negative lip distance for /b/) reproduces the high articulator velocities at closure release under the target approximation model [47], and lets the release occur about half-way through the transition. *(p.10)*
- **Non-virtual targets for /l/:** the tongue tip target is set exactly at palate contact, since /l/ has a sustained lateral rather than a ballistic release. *(p.11)*
- **Explicit minimum-area parameters `MA1`-`MA3`:** the triangle-mesh surfaces make precise constriction areas hard to control geometrically, but constriction area is the key aerodynamic parameter for flow resistance and noise-source properties in fricatives, so it gets direct control parameters that act on the area function. *(p.8)*
- **Critically damped sixth-order step response** for the transition: closely resembles the sigmoidal trajectory of natural goal-directed movements. *(p.13)*
- **Consonant-specific time constants** rather than one global value: matched to natural formant transition durations; the resulting slower nasal releases agree with measured data [45]. *(p.13)*
- **Consonant optimization targets vowel-onset formants**, not steady-state, since onset formants carry the place-of-articulation cues [24,50]. *(p.11)*
- **Freezing the primary articulator during consonant optimization:** prevents the optimizer from destroying the defining constriction while chasing formant error. *(p.11)*
- **Supine recording position** for the audio corpus, to match the postural influence on articulation in the MRI scanner. *(p.4)*
- **Hinge-joint head-posture normalization** with a least-squares fulcrum: lets tracings from two corpora with different head postures be merged into one model. *(p.4)*

## Testable Properties
- Weights must satisfy $0 \le \alpha_1 \le 1$, $0 \le \alpha_2 \le 1$, $0 \le \alpha_1 + \alpha_2 \le 1$; likewise for $\beta_1, \beta_2$. Out-of-range solutions are corrected by reducing the coefficients by equal amounts. *(p.12)*
- For a corner vowel itself, the weights must recover the corresponding reference shape exactly: /a/ gives $(\alpha_1, \alpha_2) = (0,0)$, /i/ gives $(1,0)$, /u/ gives $(0,1)$. *(p.11-12)*
- Mapping /y/ into the corner-vowel subspace must yield approximately $\alpha_1 = 0.69$, $\alpha_2 = 0.06$, $\beta_1 = 0.13 \to 0.08$, $\beta_2 = 0.97 \to 0.92$. *(p.12)*
- Acoustic error $E$ (Eq 1) must be non-negative and equals 0 when model formants match the reference exactly. *(p.9)*
- Vowel acoustic error after greedy optimization must fall below 5% (the just-discriminable formant change for F1 and F2 [46]); achieved mean 1.2%, max 5.3% for /a:/. *(p.8, p.10)*
- Increasing `VO` must increase the velic area linearly: velic area = 2.0 · VO cm², clamped at zero. *(p.7)*
- `VO` = 0.5 must produce a velic opening area of 1 cm². *(p.11)*
- The tongue-back-to-velum cross-sectional area for nasals must not fall below 0.3 cm². *(p.11)*
- Greedy optimization must be monotonically non-increasing in $E$ and terminate when no single-parameter increment reduces $E$. *(p.9)*
- Each greedy increment must displace the vocal tract outline by no more than 0.5 mm. *(p.9)*
- Model contour deviation from the initial MRI-fitted contour must not exceed 2 mm (vowels, most cases), 4 mm (/a:, u:, 2:, y:/ and all consonants). *(p.10, p.11)*
- Cross-sectional area during vowel optimization must not fall below 25 mm² (20 mm² for /u:, y:/). *(p.10)*
- A higher transition time constant must produce a longer transition time and lower articulator velocity; therefore nasal closure release must be slower than plosive release. *(p.13)*
- VOT ordering for the reference speaker: /b/ < /d/ < /g/ (means 18, 22, 38 ms), and $d_\mathrm{rest}$ must be ordered correspondingly (0.05/0.15, 0.15, 0.25 mm). *(p.13-14)*
- Consonant acoustic error in model-derived (non-corner) contexts must not greatly exceed that in the optimized corner contexts; measured increases were at most 7.3 percentage points (/l/), with /r/ the worst absolute at 15.7%. *(p.10, p.12)*
- Model-derived vocal tract parameter values must remain within the Table 2 min/max bounds, except deliberately virtual targets for primary articulators. *(p.7, p.10)*

## Relevance to Project
This is a full recipe for context-sensitive consonant targets in a source-filter or articulatory synthesizer, and several parts transfer directly to a formant-based pipeline:

- **The interpolation scheme is frontend-agnostic.** Equations 2-7 operate on an arbitrary parameter vector. If a Klatt-style formant synthesizer keeps per-phoneme target vectors (formant frequencies/bandwidths, amplitudes), the same SVD pseudo-inverse plus triangle constraint can derive context-sensitive consonant targets from three measured corner-vowel realizations, with no articulatory model required. The lingual/labial split generalizes to any grouping of parameters that vary independently.
- **Table 1 is a directly usable dataset**: German vowel formant targets, per-consonant onset formants, and VOTs for one speaker. Useful as ground truth for a locus-equation or transition-rule implementation, and as a validation target for a coarticulation module.
- **The acoustic error metric (Eq 1)** is a clean, cheap objective for automatically tuning synthesizer targets against reference recordings. The greedy coordinate-descent optimizer with a displacement cap and an area floor is simple to reimplement.
- **The 5% just-discriminable formant change threshold [46]** gives a principled stopping criterion for any formant-fitting work.
- **VOT and glottal abduction coupling** (0.05/0.15/0.25 mm rest displacement mapping to 18/22/38 ms VOT for /b/, /d/, /g/) is a concrete parameterization for voicing onset in a glottal source model.
- **Critically damped sixth-order step response** with per-consonant time constants (7 ms for /l/, 15 ms for plosives and /r/, 25 ms for nasals) is a drop-in transition model for parameter trajectories, an alternative to linear or raised-cosine interpolation.
- **The virtual-target trick** is directly portable: overshooting the target so that the perceptually relevant event (release) lands mid-transition is a general technique for getting fast transitions out of a smooth trajectory generator.
- **Cautionary result:** mean formant values averaged across contexts are not good synthesis targets. This matters for anyone building vowel target tables from corpus statistics.
- **Ceiling estimate:** natural CV consonant recognition is 98-99%; the best rule-based formant synthesis reached ~95% but needed very detailed spectral rules.

## Open Questions
- [ ] How does the interpolation behave for vowels whose lingual articulation falls outside the /a, i, u/ triangle, beyond clamping the coefficients? The paper only reduces coefficients by equal amounts and does not analyze the resulting error.
- [ ] Would a fourth reference context (e.g. a central vowel) reduce the error for /r/ and the front vowels?
- [ ] The paper does not report whether the same $\alpha$ weights work for all consonants or whether per-consonant weight recalibration would help.
- [ ] What is the acoustic effect of the estimated (not measured) /r/-in-/i/ reference shape versus a real measurement?
- [ ] Is the equal-reduction rule for out-of-triangle $\beta$ coefficients the best projection, versus e.g. nearest-point projection onto the triangle?
- [ ] The intermediate degrees of coarticulation (between "full coarticulation" and context-independent consonant targets) are proposed as future work but not tested. *(p.15)*
- [ ] How would the model extend to CVC and consonant clusters, where CC coarticulation applies?

## Related Work Worth Reading
- **Ohman SEG (1967)** Numerical model of coarticulation. JASA 41: 310-320. The foundational superposition/coarticulation-function model this paper positions against. *(ref 16)*
- **Lindblom B (1963)** Spectrographic study of vowel reduction. JASA 35: 1773-1781. The undershoot model that justifies invariant vowel targets. *(ref 42)*
- **Birkholz P, Kröger BJ, Neuschaefer-Rube C (2011)** Model-based reproduction of articulatory trajectories for consonant-vowel sequences. IEEE TASLP 19: 1422-1433. Source of the critically damped sixth-order transition model. *(ref 53)*
- **Birkholz P (2005)** 3D-Artikulatorische Sprachsynthese. Logos Verlag Berlin. The full vocal tract and area function model. *(ref 36)*
- **Birkholz P, Jackèl D, Kröger BJ (2007)** Simulation of losses due to turbulence in the time-varying vocal tract. IEEE TASLP 15: 1218-1226. The noise source model identified as the main limitation. *(ref 15)*
- **Titze IR (1989)** A four-parameter model of the glottis and vocal fold contact area. Speech Communication 8: 191-201. The glottal geometry model used. *(ref 52)*
- **Birkholz P, Kröger BJ, Neuschaefer-Rube C (2010)** Articulatory synthesis and perception of plosive-vowel syllables with virtual consonant targets. Interspeech 2010: 1017-1020. The virtual-target concept. *(ref 47)*
- **Narayanan SS, Alwan AA, Haker K (1997)** Toward articulatory-acoustic models for liquid approximants based on MRI and EPG data. Part I: The laterals. JASA 101: 1064-1077. Source of the lateral channel area range. *(ref 48)*
- **Klatt DH (1987)** Review of text-to-speech conversion for English. JASA 82: 737-793. The 95%/75% formant-synthesis recognition benchmarks. *(ref 55)*
- **Dang J, Honda K, Suzuki H (1994)** Morphological and acoustical analysis of the nasal and paranasal cavities. JASA 96: 2088-2100. The nasal area function used. *(ref 51)*
- **Beier T, Neely S (1992)** Feature-based image metamorphosis. SIGGRAPH '92: 35-42. The warping method for head-posture normalization. *(ref 35)*
- **Serrurier A, Badin P (2008)** A three-dimensional articulatory model of the velum and nasopharyngeal wall based on MRI and CT data. JASA 123: 2335-2355. The two-DOF velum evidence. *(ref 39)*

## Collection Cross-References

### Conceptual Links (not citation-based)
- [Coker (1976) — A Model of Articulatory Dynamics and Control](../Coker_1976_ArticulatoryDynamicsControl/notes.md) - both solve coarticulation for articulatory synthesis but with opposite strategies: Coker keeps fixed per-phoneme targets and varies *when* each articulator moves toward them (a per-phoneme, per-articulator lead/lag "priority" timing mechanism), while this paper keeps timing simple and varies the *target itself* via context-weighted interpolation between corner-vowel reference shapes.

## Provenance
Read from page images `pngs/page-000.png` through `pngs/page-016.png` (17 pages, PLoS ONE pagination 1-17), rendered at 150 dpi from `paper.pdf` via the paper-reader skill. All 17 pages inspected directly.



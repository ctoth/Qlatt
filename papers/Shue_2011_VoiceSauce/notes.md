---
title: "VoiceSauce: A program for voice analysis"
authors: "Yen-Liang Shue, Patricia Keating, Chad Vicenik, Kristine Yu"
year: 2011
venue: "Proceedings of the 17th International Congress of Phonetic Sciences (ICPhS XVII), Hong Kong, 17-21 August 2011, pp. 1846-1849"
doi_url: "https://www.internationalphoneticassociation.org/icphs-proceedings/ICPhS2011/OnlineProceedings/RegularSession/Shue/Shue.pdf"
pages: "1846-1849"
affiliation: "Dept. of Electrical Engineering (a) and Dept. of Linguistics (b), UCLA, Los Angeles, CA, USA"
funding: "NSF grant BCS-0720304 to P. Keating, A. Alwan, and J. Kreiman"
---

# VoiceSauce: A program for voice analysis

## One-Sentence Summary
VoiceSauce (VS) is a free Matlab-based tool that computes a standard battery of automated voice-quality measures over whole directories of .wav files, including pitch-synchronous harmonic amplitudes (H1, H2, H4, A1-A3), formant- and bandwidth-corrected spectral-tilt measures (H1*-H2*, H1*-A1..A3*, H2*-H4*), CPP, three-band HNR, SHR, and pitch-normalized RMS energy, with F0 and formants supplied by STRAIGHT, Snack, or Praat. *(p.1846)*

## Problem Addressed
Voice-quality measures (especially spectral-tilt measures such as H1-H2) were, at the time, typically made by hand from FFT spectra or by ad-hoc Praat scripts. Those approaches are unreliable, are not pitch-synchronous, are not corrected for the influence of formants on harmonic amplitudes, discard files whose F0 or formants cannot be tracked, and produce a single value per analysis window rather than a running track. VS automates the whole battery over running speech and applies per-frame formant corrections. *(p.1846, p.1848, p.1849)*

## Key Contributions
- A single automated pipeline computing the full common battery of voice measures over directories of audio, with optional restriction to Praat TextGrid-labeled intervals for speed. *(p.1846)*
- Pitch-synchronous harmonic magnitude estimation using a maximum-search around F0-predicted harmonic locations, equivalent to a very long FFT window without the FFT cost. *(p.1846)*
- Per-frame formant/bandwidth correction of harmonic amplitudes for every spectral-magnitude measure, not just for a single hand-picked window (extending Hanson 1997 and Iseli et al. 2007). *(p.1847)*
- Both corrected (`*`, output tag "c") and uncorrected (output tag "u") versions of every harmonic measure. *(p.1847)*
- Text and Emu/SSFF output, plus incorporation of EGG measures from the companion EggWorks program. *(p.1848)*
- Empirical comparison against by-hand FFT measurement and a Praat script showing VS gives the lowest within-category variability and discards no files. *(p.1848-1849)*

## Study Design (empirical comparison, Section 4)
- **Type:** Method-comparison study of a single measure (H1-H2) across three measurement methods. *(p.1848)*
- **Material:** Token onsets of the low vowel [a] following voiced, voiceless aspirated, and ejective stops, from five speakers of Georgian (data from Vicenik 2010 [16]). The stop categories audibly affect voice quality at vowel onset. *(p.1848)*
- **Methods compared:**
  1. **By hand** — Scicon R&D PCQuirer, FFT spectra at 21 Hz bandwidth, 40 ms window positioned immediately after vowel onset (covering roughly the first third of the vowel); H1 and H2 amplitudes manually marked with a cursor. *(p.1848)*
  2. **Praat script** — new script based on one by Remijsen [12]; not pitch-synchronous, not formant-corrected; computes H1-H2 over the first third of each vowel. *(p.1848)*
  3. **VoiceSauce** — H1-H2 over the first third of each vowel, deliberately *uncorrected* for formants for comparability. *(p.1849)*
- **Primary endpoint:** Mean H1-H2 per stop category and within-category standard deviation, plus proportion of files analyzable. *(p.1848-1849)*
- **Caveat stated by the authors:** the by-hand method "is relatively unreliable and is not taken as a benchmark, but rather simply as one standard practice." *(p.1848)*

## Methodology

### Program structure
Home screen exposes six functions: Parameter Estimation, Parameter Display, Output to Text, Output to EMU, Manual Data, Settings. Workflow is: Parameter Estimation (select which parameters to compute; defaults changed in Settings) -> optional Parameter Display for visual sanity checks -> Output to Text or Output to Emu. *(p.1846)*

VS runs over directories of .wav files, automatically producing measurements for every audio file. If Praat TextGrids are available, analysis for many measures can be restricted to labeled intervals on any tier, which greatly speeds up computation. *(p.1846)*

### 2.1 F0 and harmonic spectra magnitudes *(p.1846)*
- F0 is the critical measurement; VS uses it to estimate the location of harmonics.
- Three interchangeable F0 trackers: **STRAIGHT** [9], **Snack Sound Toolkit** [13], **Praat** [1] (Praat offers a choice of autocorrelation and cross-correlation algorithms).
- **Default: STRAIGHT, F0 estimated at 1 ms intervals.**
- All F0 algorithms rely on user-specified **Max F0** and **Min F0** to constrain estimation.
- **Harmonic spectra magnitudes are computed pitch-synchronously, by default over a 3-cycle window.** Larger windows are recommended in some cases. Pitch-synchronous windowing eliminates much of the variability seen in spectra computed over a fixed time window.
- Harmonic magnitudes are found by a **maximum search algorithm** around the spectral locations predicted from the estimated F0. **Total search range = 10% of the estimated F0 value.**
- The authors state this optimization approach is "equivalent to using a very long FFT window" and gives a much more accurate measure without large FFT calculations. *(p.1846, restated p.1849)*

### 2.2 Formants and corrections *(p.1846-1847)*
- **Default formant tracker: Snack Sound Toolkit**, finding frequencies and bandwidths of the **first four formants (F1-F4, B1-B4)**.
- Snack defaults used by VS: **covariance method, pre-emphasis 0.96, window length 25 ms, frame shift 1 ms** (frame shift chosen to match STRAIGHT).
- **Praat's Burg algorithm** can alternatively be used for formant estimation, but Praat formant analysis is **always over whole files, never over labeled TextGrid intervals**. When Praat is used for formant (or F0) estimation the user can set any of its parameters.
- Prior work: Hanson [4] and Iseli and colleagues (e.g. [8]) developed the algorithm estimating **H1*-H2*** and **H1*-A3***, where the asterisk denotes that the corresponding spectral magnitudes (H1, H2, A3) are corrected for the effect of formant frequencies and bandwidths.
- **In VS, the harmonic amplitudes for all measures of spectral magnitude are corrected for every frame**, using the measured formant frequencies plus **bandwidths estimated by formula from those frequencies** (Hawks & Miller 1995 [6]).
- Output naming convention: corrected measures indicated by **"c"**, uncorrected by **"u"**.
- **Which formants enter which correction:** for **H1*-H2*, only F1 and F2** are used in the correction; for **H1*-A3*, F1 through F3** are used.
- Corrected measures are then **smoothed with a moving average filter, default length 20 samples**.
- **Important gap:** this paper does *not* print the correction equations themselves. It cites Hanson 1997 [4] and Iseli/Shue/Alwan 2007 [8] for the correction algorithm and Hawks & Miller 1995 [6] for the bandwidth-from-frequency formula. Implementers must go to those sources for the actual formulas.

### 2.3 SHR *(p.1847)*
- Subharmonic-to-Harmonic Ratio, proposed by Sun [15], quantifies the amplitude ratio between subharmonics and harmonics.
- Implemented using **Sun's algorithm and code [14]** (Matlab File Exchange entry 1230).
- Derived from the **summed subharmonic and harmonic amplitudes calculated in the log domain using spectrum shifting**.
- Motivated as especially relevant for characterizing speech with **alternating pulse cycles** (period doubling / diplophonia), citing Gerratt & Kreiman [3].

### 2.4 Energy *(p.1847)*
- **RMS energy calculated at every frame** over a **variable window equal to five pitch periods**.
- Rationale: the variable (pitch-synchronous) window effectively **normalizes the energy measure with respect to F0**, reducing the correlation between energy and F0.

### 2.5 Cepstral measures *(p.1847)*

**2.5.1 CPP (Cepstral Peak Prominence)**
- Based on the algorithm of Hillenbrand, Cleveland & Erickson [7].
- **Variable window length equal to five pitch periods.**
- Data multiplied by a **Hamming window**, then transformed into the **real cepstral domain**.
- CPP found by performing a **maximum search around the frequency (quefrency) of the pitch period**.
- The peak is **normalized to a linear regression line calculated between 1 ms and the maximum frequency** (i.e. regression over the cepstrum from quefrency 1 ms upward).

**2.5.2 HNR (Harmonic-to-Noise Ratio)**
- Derived by **de Krom's algorithm [10]** (cepstrum-based).
- **Variable window length equal to five pitch periods.**
- Method: **liftering the pitch component of the cepstrum and comparing the energy of the harmonics with the noise floor**.
- Three band-limited variants:
  - **HNR05** = HNR over **0-500 Hz**
  - **HNR15** = HNR over **0-1500 Hz**
  - **HNR25** = HNR over **0-2500 Hz**
- Explicit contrast: **CPP covers the entire frequency range**, unlike the band-limited HNRs.

### 2.6 Summary of measures — full computable set *(p.1847)*
- F0 from STRAIGHT
- F0 from Snack
- F0 from Praat
- F1-F4 and B1-B4 from Snack
- F1-F4 and B1-B4 from Praat
- H1, H2, H4
- A1, A2, A3
- Cepstral Peak Prominence
- Harmonic-to-Noise Ratios (3 frequency bands)
- Subharmonic-to-Harmonic Ratio
- Energy
- H1-H2(*)
- H1-A1(*)
- H1-A2(*)
- H1-A3(*)
- H2-H4(*)

"All harmonic measures come both corrected (*) and uncorrected." *(p.1847)*

### 2.7 Manual correction of measures *(p.1847-1848)*
- Reliability of every measure depends on successful estimation of its component parameters.
- **If F0 is not well-tracked, all measures that include H1 are problematic.**
- **If a formant is mistracked, the corresponding measures are problematic**: a wrong F1 makes A1 and H1-A1 wrong *even for the uncorrected measures* (because A1 is defined as the amplitude of the harmonic nearest F1).
- **All amplitude corrections crucially depend on accurate formant estimation.**
- **Errors in F1 estimation are especially likely for breathy, nasal, or high-pitched vowels.**
- Recommendation: **check the F0 and formant estimates to verify the integrity of derived voice measures.**
- VS allows **manual overriding** of problematic measures. Especially useful for phonations with **pitch doubling or creakiness**, which commonly break the F0 estimator. Practice: hand-correct measures in a new data file, load it into VS, and use the new values to recalculate other measures.

## Outputs *(p.1848)*
- Initial output of Parameter Estimation is **binary Matlab MAT-files, one per input file**.
- **Parameter Display** shows multiple parameters against the waveform of a single audio file. Explicitly **not intended as a measurement facility**, only for quick visual sanity checks.

**3.1 Output to text**
- From Praat TextGrids, VS identifies all labeled intervals on a tier ("segments") and writes results for them. With no TextGrids, results are given over the entire file.
- Two output modes:
  1. **All values at the frame shift rate (default 1 ms)**, each value of a given measure on a separate row. Produces very *long* text files.
  2. **Averages over N sub-segments** (N specified by the user) within a labeled segment, each segment on a separate row and each sub-segment a new column. Produces very *wide* text files.
- Each measured parameter is one or more columns. User chooses which parameters to output and whether to write one large file or separate smaller files with parameter subsets.

**3.2 Output to Emu**
- SSFF format for Emu speech databases [5]. User directs VS to the measured data and selects which measured parameters to write.
- **No options controlling TextGrid labels or dividing data into sub-segments.**
- Output form: **one track file per parameter per audio file**. Viewable/queryable in Emu or in R via the Emu library.

**3.3 Including EGG measurements**
- VS can merge outputs from analysis of corresponding electroglottographic (EGG) signals into its output file, if they are in the appropriate format and at the appropriate frame rate.
- **EggWorks** (Henry Tehrani, distributed with VS) produces text files with such outputs **at 1 ms intervals**.

## Key Equations / Statistical Models
The paper states no equations in closed form. The computational relations it does specify verbally:

$$
\text{search range for harmonic } H_k = \pm 0.05 \cdot F_0 \quad (\text{total } 10\% \text{ of } F_0)
$$
Where: $F_0$ is the estimated fundamental in Hz at that frame; the harmonic magnitude is the spectral maximum within that range around the predicted harmonic location $k \cdot F_0$. The paper says "total search range is set to 10% of the estimated F0 value", which is read here as a window of width $0.1 F_0$ centered on the predicted location. *(p.1846)*

$$
w_{\text{harmonic}} = 3 / F_0, \qquad w_{\text{energy}} = w_{\text{CPP}} = w_{\text{HNR}} = 5 / F_0
$$
Where: $w$ is the analysis window duration in seconds and $F_0$ the frame's fundamental in Hz. Harmonic spectral magnitudes use a 3-cycle pitch-synchronous window by default; RMS energy, CPP, and HNR use a 5-pitch-period variable window. *(p.1846-1847)*

$$
\text{CPP} = C_{\text{peak}} - L(q_{\text{peak}})
$$
Where: $C_{\text{peak}}$ is the real-cepstrum maximum located by searching around the quefrency of the pitch period, and $L(q)$ is the linear regression line fitted to the cepstrum between quefrency 1 ms and the maximum quefrency/frequency. Form inferred from the paper's prose description of Hillenbrand et al. [7]; the paper itself gives no formula. *(p.1847)*

**Correction formulas (NOT given in this paper).** The formant/bandwidth correction of harmonic amplitudes that produces H1*, H2*, H4*, A1*, A2*, A3* is attributed to Hanson 1997 [4] and Iseli, Shue, Alwan & colleagues 2007 [8]; the bandwidth-from-formant-frequency formula is attributed to Hawks & Miller 1995 [6]. Retrieve those three papers to implement the corrections. *(p.1847)*

## Parameters

### Global / F0 estimation

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| F0 estimation algorithm | — | — | STRAIGHT | STRAIGHT / Snack / Praat (autocorr or cross-corr) | 1846 | Praat offers autocorrelation and cross-correlation variants |
| F0 frame interval | — | ms | 1 | — | 1846 | STRAIGHT default; also the frame shift rate for text output |
| Maximum F0 | Max F0 | Hz | user-specified | — | 1846 | Required by all three trackers to constrain estimation |
| Minimum F0 | Min F0 | Hz | user-specified | — | 1846 | Required by all three trackers to constrain estimation |

### Harmonic magnitude estimation

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Harmonic analysis window | — | pitch cycles | 3 | larger recommended in some cases | 1846 | Pitch-synchronous, not fixed-time |
| Harmonic peak search range | — | % of F0 | 10 | — | 1846 | Total search range around the F0-predicted harmonic location; maximum search |

### Formant estimation (Snack defaults as used by VS)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Formant tracker | — | — | Snack | Snack / Praat Burg | 1846 | Praat formants are always whole-file, never TextGrid-interval-limited |
| Number of formants tracked | — | count | 4 | F1-F4 with B1-B4 | 1846-1847 | Bandwidths B1-B4 also output |
| LPC method | — | — | covariance | — | 1846 | Snack setting |
| Pre-emphasis coefficient | — | — | 0.96 | — | 1846 | Snack setting |
| Formant window length | — | ms | 25 | — | 1846 | Snack setting |
| Formant frame shift | — | ms | 1 | — | 1846 | Chosen to match STRAIGHT's 1 ms F0 rate |

### Correction and smoothing

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Formants used for H1*-H2* correction | — | — | F1, F2 | — | 1847 | Only the first two formants enter this correction |
| Formants used for H1*-A3* correction | — | — | F1, F2, F3 | — | 1847 | F1 through F3 |
| Bandwidth source for correction | — | — | formula from formant frequencies | — | 1847 | Hawks & Miller 1995 [6] |
| Moving-average smoothing length | — | samples (frames) | 20 | — | 1847 | Applied to the corrected measures; at 1 ms frames this is ~20 ms |

### Energy, cepstral, and HNR windows

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| RMS energy window | — | pitch periods | 5 | — | 1847 | Variable window; normalizes energy against F0 |
| CPP window | — | pitch periods | 5 | — | 1847 | Hamming-windowed before real cepstrum |
| CPP regression lower bound | — | ms (quefrency) | 1 | 1 ms to max frequency | 1847 | Linear regression line the peak is normalized against |
| HNR window | — | pitch periods | 5 | — | 1847 | de Krom cepstral liftering method |
| HNR05 band | HNR05 | Hz | 0-500 | — | 1847 | Low band |
| HNR15 band | HNR15 | Hz | 0-1500 | — | 1847 | Mid band |
| HNR25 band | HNR25 | Hz | 0-2500 | — | 1847 | Upper band |
| CPP frequency coverage | CPP | Hz | entire range | — | 1847 | Explicitly contrasted with band-limited HNRs |

### Comparison-study measurement settings (Section 4)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| By-hand FFT bandwidth | — | Hz | 21 | — | 1848 | Scicon R&D PCQuirer |
| By-hand FFT window | — | ms | 40 | — | 1848 | Positioned immediately after vowel onset, ~first third of the vowel |
| Measurement region (all 3 methods) | — | — | first third of vowel | — | 1848-1849 | VS H1-H2 taken uncorrected for comparability |
| Speakers | N | count | 5 | — | 1848 | Georgian, data from Vicenik 2010 [16] |
| Stop categories | — | count | 3 | voiced / voiceless aspirated / ejective | 1848 | Vowel [a] following each |

### EGG / output

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| EggWorks output frame interval | — | ms | 1 | — | 1848 | Must match VS frame rate to be merged |
| Text output frame shift rate | — | ms | 1 | — | 1848 | "All values" output mode |
| Sub-segments per labeled segment | N | count | user-specified | — | 1848 | "Averages" output mode; one column per sub-segment |

## Effect Sizes / Key Quantitative Results

Figure 2 (p.1849) reports mean H1-H2 with standard-deviation error bars for three stop categories under three methods. Exact numbers are not tabulated in the text; the values below are read from the bar chart and should be treated as approximate.

| Outcome | Measure | Value | CI | p | Population/Context | Page |
|---------|---------|-------|----|---|--------------------|------|
| H1-H2, aspirated | mean (dB) | ~5 | SD bar ~±4 | — | By hand, Georgian [a] after aspirated stop | 1849 |
| H1-H2, ejective | mean (dB) | ~0 | SD bar ~±3.5 | — | By hand | 1849 |
| H1-H2, voiced | mean (dB) | ~3.5 | SD bar ~±4 | — | By hand | 1849 |
| H1-H2, aspirated | mean (dB) | ~6.5 | SD bar ~±6 | — | VoiceSauce (uncorrected) | 1849 |
| H1-H2, ejective | mean (dB) | ~0.5 | SD bar ~±4 | — | VoiceSauce (uncorrected) | 1849 |
| H1-H2, voiced | mean (dB) | ~4.5 | SD bar ~±4 | — | VoiceSauce (uncorrected) | 1849 |
| H1-H2, aspirated | mean (dB) | ~6.5 | SD bar ~±7.5 | — | Praat script | 1849 |
| H1-H2, ejective | mean (dB) | ~-2 | SD bar ~±7 | — | Praat script | 1849 |
| H1-H2, voiced | mean (dB) | ~3.5 | SD bar ~±5 | — | Praat script | 1849 |
| Files analyzable | proportion | many files unanalyzable | — | — | By hand; FFT often showed no clear harmonic structure | 1848 |
| Files analyzable | proportion | all (none discarded) | — | — | Modified Praat script (H1-H2 only) and VoiceSauce | 1848-1849 |

Qualitative summary stated by the authors *(p.1849)*:
- Overall results from the three methods are **similar**.
- **By-hand** shows the **smallest mean differences across categories**.
- **Praat** shows the **largest mean differences** but also **the greatest within-category variability**, "much greater than either of the other two methods, with about twice as much variability for the less modal phonations."
- The greater Praat variability is due to greater variability of **both H1 and H2 separately**.
- VS "appears to maximize the number of files that can be analyzed, enhance the distinctions between categories, and minimize the within-category variability."

## Methods & Implementation Details
- Implemented in and runs in **Matlab**; also available as a **freestanding program for PCs**. *(p.1846)*
- Runs over **directories** of .wav files, batch-producing measurements for every file. *(p.1846)*
- **TextGrid-limited analysis**: analysis for many measures can be limited to labeled intervals on any tier, greatly speeding computation. Exception: **Praat formant analysis is always whole-file**. *(p.1846, p.1847)*
- **Frame-rate alignment is a design constraint**: Snack formants use a 1 ms frame shift explicitly "to match STRAIGHT"; EggWorks emits at 1 ms; text output defaults to the 1 ms frame shift. Everything is on a common 1 ms grid. *(p.1846, p.1848)*
- **Order of operations for corrected measures**: F0 track -> pitch-synchronous harmonic magnitude search -> formant/bandwidth track -> per-frame correction of harmonic amplitudes -> 20-sample moving-average smoothing. *(p.1846-1847)*
- **Intermediate representation**: binary Matlab MAT-files, one per input file, then a separate export step to text or SSFF. *(p.1848)*
- **Manual override path**: hand-corrected values are placed in a new data file, loaded into VS, and used to recalculate dependent measures. *(p.1848)*
- **Version described: March 2011.** *(p.1849)*
- Distribution: free download from http://www.ee.ucla.edu/~spapl/voicesauce/ [17]. *(p.1849)*
- Code contributors acknowledged: H. Tehrani (EggWorks) and M. Iseli (corrections). *(p.1849)*

## Figures of Interest
- **Fig 1 (p.1846):** VoiceSauce home screen. Six buttons in a 2x3 grid: Parameter Estimation, Parameter Display, Output to Text, Output to EMU, Manual Data, Settings, plus About and Exit. Documents the top-level workflow.
- **Fig 2 (p.1849):** H1-H2 by three methods (By Hand, VoiceSauce, Praat) for vowels after three categories of stops (Aspirated, Ejective, Voiced). Grouped bar chart, y-axis H1-H2 from -10 to 15 dB, error bars = standard deviations. This is the paper's only quantitative result; it shows Praat with the widest error bars and VS intermediate/narrow.

## Results Summary
The three H1-H2 measurement methods agree in broad pattern: aspirated > voiced > ejective in H1-H2 for Georgian [a]. VoiceSauce separates the stop categories more than the by-hand method while keeping within-category variability well below the Praat script's, and, unlike the by-hand method, it can measure every file. The Praat script produces both the largest category separations and roughly double the within-category variability for less modal phonations. The authors attribute VS's lower variability to three causes: the STRAIGHT pitch tracker is very good when there is little creaking or pitch doubling; F0 values every 1 ms avoid discontinuities and produce a smooth pitch track, which makes the harmonic-amplitude estimation likewise smoother; and the optimization method for finding harmonic amplitudes is equivalent to a very long FFT window, whereas the by-hand and Praat methods each give one F0 value and one harmonic amplitude for the entire analysis window. *(p.1849)*

## Limitations
- **F0 tracking is the single point of failure.** If F0 is not well-tracked, every measure involving H1 is problematic. *(p.1847)*
- **Formant tracking failures propagate even to uncorrected measures.** A wrong F1 makes A1 and H1-A1 wrong regardless of correction. *(p.1847)*
- **F1 estimation errors are especially likely for breathy, nasal, or high-pitched vowels** — exactly the voice qualities the measures are meant to characterize. *(p.1847)*
- **Pitch doubling and creakiness routinely break the F0 estimator**, requiring manual override. *(p.1848)*
- **STRAIGHT's advantage is conditional**: it is "very good when there is little creaking or pitch doubling." *(p.1849)*
- **Praat formant analysis cannot be restricted to labeled intervals** — always whole-file. *(p.1847)*
- **Emu output has no options controlling TextGrid labels or sub-segment division.** *(p.1848)*
- **Parameter Display is explicitly not a measurement facility**, only a visual sanity check. *(p.1848)*
- **Text output is unwieldy in both modes**: per-frame output produces very long files, sub-segment averaging produces very wide files. *(p.1848)*
- **The comparison study is narrow**: one measure (H1-H2), one vowel ([a]), one language (Georgian), five speakers, onset region only, and VS deliberately run uncorrected. Nothing in the paper validates the corrected measures, CPP, HNR, SHR, or energy. *(p.1848-1849)*
- **The by-hand method is not a ground truth**; the authors decline to treat it as a benchmark. There is no reference standard in the comparison at all. *(p.1848)*

## Arguments Against Prior Work
- **By-hand FFT measurement of harmonic amplitudes** (as in Esposito 2010 [2], Lee 2009 [11]) is "relatively unreliable"; many files could not be analyzed at all because the FFT did not show a clear harmonic structure. *(p.1848)*
- **The Praat-script approach** (based on Remijsen [12]) is **neither pitch-synchronous nor corrected for formants**, and in its original form **discards a file entirely, with no measurements, if Praat cannot detect an F0 and all three formants**. *(p.1848)*
- Fixed-time-window spectral analysis introduces variability that pitch-synchronous windowing eliminates. *(p.1846)*
- Methods that produce **one F0 value and one harmonic amplitude for the entire analysis window** (both by-hand and Praat) are inherently more variable than a 1 ms running track. *(p.1849)*
- Praat's measurements "show the greatest within-category variability, much greater than either of the other two methods, with about twice as much variability for the less modal phonations," and the excess variability traces to H1 and H2 individually. *(p.1849)*
- Praat lacks formant corrections and "some measures not currently implemented in Praat." *(p.1849)*
- Prior correction work (Hanson [4], Iseli et al. [8]) corrected only H1*-H2* and H1*-A3*; VS extends per-frame correction to **all** spectral-magnitude measures. *(p.1847)*

## Design Rationale
- **Pitch-synchronous 3-cycle windowing for harmonic magnitudes** chosen because it "eliminates much of the variability in spectra computed over a fixed time window." *(p.1846)*
- **Maximum search over ±10%-of-F0 rather than a long FFT** chosen because it is "equivalent to using a very long FFT window and enables a much more accurate measure without relying on large FFT calculations" — i.e. accuracy without the FFT cost. *(p.1846)*
- **1 ms frame shift everywhere** chosen so Snack formants align with STRAIGHT F0, and because dense F0 sampling "avoids discontinuities, producing a smooth pitchtrack which makes the harmonic amplitude estimation likewise smoother." *(p.1846, p.1849)*
- **STRAIGHT as the default F0 tracker** because it is "very good when there is little creaking or pitch doubling." *(p.1849)*
- **Bandwidths estimated by formula from formant frequencies** rather than measured, citing Hawks & Miller [6] — measured bandwidths from LPC are unreliable. *(p.1847)*
- **Both corrected and uncorrected variants emitted for every harmonic measure** so users can choose and so results remain comparable with the uncorrected literature. *(p.1847)*
- **Five-pitch-period variable window for RMS energy** chosen specifically to normalize energy against F0 and "reduce the correlation between them" — an alternative to a fixed window, which would leave energy confounded with F0. *(p.1847)*
- **Moving-average smoothing (20 samples)** applied to corrected measures to suppress frame-to-frame correction noise. *(p.1847)*
- **Manual override facility** included because automated F0 estimation is known to fail on creak and pitch doubling; the design accepts hand correction rather than pretending automation suffices. *(p.1848)*
- **TextGrid-limited analysis** included purely for computational speed on large corpora. *(p.1846)*

## Testable Properties
- Harmonic search range must equal 10% of the estimated F0; a harmonic magnitude must be the spectral maximum inside that range. *(p.1846)*
- Default harmonic analysis window must be exactly 3 pitch cycles; energy, CPP, and HNR windows exactly 5 pitch periods. *(p.1847)*
- Window duration must vary inversely with F0 (pitch-synchronous), so doubling F0 halves the analysis window. *(p.1846-1847)*
- RMS energy computed over a 5-pitch-period window must show lower correlation with F0 than energy computed over a fixed window. *(p.1847)*
- H1*-H2* must depend on F1 and F2 only; changing F3 or F4 must leave H1*-H2* unchanged. *(p.1847)*
- H1*-A3* must depend on F1, F2, and F3. *(p.1847)*
- HNR05 ≤ HNR15 ≤ HNR25 bands are nested (0-500, 0-1500, 0-2500 Hz); each is band-limited while CPP is full-band. *(p.1847)*
- Every harmonic measure must be emitted in both corrected ("c") and uncorrected ("u") form. *(p.1847)*
- Corrected measures must be moving-average smoothed over 20 frames; uncorrected raw tracks should be rougher. *(p.1847)*
- Perturbing F1 must change A1 and H1-A1 even in the uncorrected measures. *(p.1847)*
- Snack formant analysis must use covariance LPC, pre-emphasis 0.96, 25 ms window, 1 ms shift. *(p.1846)*
- All parameter tracks must land on a common 1 ms grid so that F0, formant, and EGG measures are frame-aligned. *(p.1846, p.1848)*
- Within-category standard deviation of H1-H2 from a VS-style pitch-synchronous tracked estimator should be lower than from a single-window Praat-style estimator, roughly by a factor of two for non-modal phonation. *(p.1849)*
- No file should be discarded for lack of a formant estimate; the by-hand method's failure rate on unclear harmonic structure should exceed the automated methods' (zero). *(p.1848-1849)*

## Relevance to Project
This is the de facto reference specification for the analysis side of a formant/source-filter synthesizer project. Three concrete uses:

1. **Validation harness for synthesized output.** The measure list in Section 2.6 is exactly the battery needed to check whether a synthesized breathy/creaky/modal voice actually lands where it should in voice-quality space. Synthesize with a known source spectral tilt, measure H1*-H2*, and confirm the analysis recovers the tilt you put in. Because the synthesizer knows the true F0, true formant frequencies, and true bandwidths, it can bypass the tracking stage entirely and feed ground-truth values to the correction — which turns VS's dominant failure mode (mistracked F0/F1 on breathy, nasal, high-pitched vowels) into a non-issue for validation. That makes a synthesizer an unusually clean testbed for these measures.

2. **Analysis-by-synthesis parameter fitting.** The corrected spectral-tilt measures (H1*-H2*, H1*-A1*, H1*-A2*, H1*-A3*, H2*-H4*) are the standard bridge between a recorded voice and glottal source parameters (open quotient, spectral tilt, return phase). Computing them on a target recording gives targets for the synthesizer's voice-source controls.

3. **Direct implementation guidance.** The window conventions are the actionable part: 3 pitch cycles for harmonic magnitudes, 5 pitch periods for energy/CPP/HNR, ±10%-of-F0 maximum search rather than a long FFT, 1 ms frame grid throughout, 20-frame moving average on corrected tracks, bandwidths from formula not from LPC. These are cheap to implement and are the settings the phonetics literature's published numbers were produced with, so matching them is what makes project measurements comparable to published values.

**Critical gap for implementation:** the actual correction equations are not in this paper. Retrieve Iseli et al. 2007 [8] (the correction algorithm, and the most complete published statement of it), Hanson 1997 [4] (the original H1*-H2*/H1*-A3* formulation), and Hawks & Miller 1995 [6] (bandwidth-from-frequency formula) before implementing corrected measures. Also retrieve Hillenbrand et al. 1994 [7] for CPP and de Krom 1993 [10] for the cepstral HNR, since this paper gives only prose sketches of both.

## Open Questions
- [ ] Is the 10% harmonic search range a total width of 0.1·F0 centered on k·F0, or ±10% (0.2·F0 total)? The phrase "total search range is set to 10%" suggests the former, but this should be confirmed against the VS source.
- [ ] Does the search range scale with harmonic number k (i.e. ±10% of k·F0, which grows with k) or stay fixed at 10% of F0 for all harmonics? Fixed width would become proportionally tighter for A3.
- [ ] What exactly is "the maximum frequency" bounding the CPP regression? The paper says the regression runs "between 1 ms and the maximum frequency," mixing quefrency and frequency units. Likely quefrency 1 ms to the end of the analyzed cepstrum.
- [ ] Are A1, A2, A3 the amplitudes of the harmonics nearest F1, F2, F3, or the local spectral maxima at the formant peaks? The paper never defines them, though the H1-A1/F1 dependency discussion implies the former.
- [ ] Is the 3-cycle harmonic window centered on the frame, and what window function is applied? Only CPP's Hamming window is stated.
- [ ] Is the 20-sample moving average applied to the corrected measures only, or to the corrected component amplitudes before differencing?
- [ ] Are the HNR bands computed on separately liftered cepstra per band, or one cepstrum with band-limited energy accumulation?
- [ ] How is the "variable window equal to five pitch periods" handled in unvoiced or F0-undefined frames?
- [ ] Exact numeric values behind Figure 2 are not tabulated; the effect-size table above is read off the chart and is approximate.

## Related Work Worth Reading
- **Iseli, Shue, Alwan 2007 [8]** — "Age, sex, and vowel dependencies of acoustic measures related to the voice source," JASA 121, 2283-2295. The formant/bandwidth correction algorithm VS implements. Highest priority.
- **Hanson 1997 [4]** — "Glottal characteristics of female speakers: Acoustic correlates," JASA 101, 466-481. Origin of H1*-H2* and H1*-A3*.
- **Hawks & Miller 1995 [6]** — "A formant bandwidth estimation procedure for vowel synthesis," JASA 97, 1343-1344. The bandwidth-from-formant-frequency formula; directly relevant to a synthesizer, which needs the same mapping in the forward direction.
- **Hillenbrand, Cleveland & Erickson 1994 [7]** — "Acoustic correlates of breathy vocal quality," JSHR 37, 769-778. The CPP algorithm.
- **de Krom 1993 [10]** — "A cepstrum-based technique for determining a harmonic-to-noise ratio in speech signals," JSHR 36, 254-266. The HNR algorithm.
- **Kawahara, Masuda-Katsuse & de Cheveigne 1999 [9]** — STRAIGHT. The default F0 tracker and a source-filter representation in its own right.
- **Sun 2002 [15]** — "Pitch determination and voice quality analysis using subharmonic-to-harmonic ratio," ICASSP '02, 333-336. SHR, relevant to period doubling / diplophonia synthesis.
- **Gerratt & Kreiman 2001 [3]** — "Toward a taxonomy of nonmodal phonation," J. Phon. 29, 365-381. The phonation-type space a synthesizer would be trying to cover.
- **Sjölander 2004 [13]** — Snack Sound Toolkit. Default formant tracker and its covariance-LPC settings.

---
title: "Method for the subjective assessment of intermediate quality level of audio systems (Recommendation ITU-R BS.1534-3)"
authors: "International Telecommunication Union, Radiocommunication Sector (ITU-R), Study Group 6"
year: 2015
venue: "ITU-R Recommendation BS.1534-3 (10/2015), BS Series: Broadcasting service (sound), Geneva"
doi_url: "https://www.itu.int/dms_pubrec/itu-r/rec/bs/R-REC-BS.1534-3-201510-I!!PDF-E.pdf"
pages: "36 (PDF), 32 numbered"
publisher: "International Telecommunication Union, Geneva"
note: "Editions 2001-2003-2014-2015; editorial amendments made by Radiocommunication Study Group 6 in March 2023 under Resolution ITU-R 1."
---

# Method for the subjective assessment of intermediate quality level of audio systems (ITU-R BS.1534-3)

## One-Sentence Summary
The normative specification of the MUSHRA listening test (MUlti Stimulus test with Hidden Reference and Anchor): a double-blind, multi-stimulus, 0-100 continuous-quality-scale protocol with a hidden full-bandwidth reference plus mandatory 3.5 kHz and 7 kHz low-pass anchors, complete with assessor screening thresholds, signal-preparation requirements, listening-level calibration, and both non-parametric (bootstrap) and parametric (ANOVA) statistical treatments. *(pp.1-32)*

## Problem Addressed
Existing subjective-quality methods were unusable for systems in the *intermediate* quality band. ITU-R BS.1116 targets small impairments and "is poor at discriminating between small differences in quality at the bottom of the scale"; ITU-R BS.1284 "gives only methods which are dedicated either to the high quality audio range or gives no absolute scoring of audio quality"; and ITU-T P.800 / P.810 / P.830 are speech-and-telephony focused and fail to provide an absolute scale, a reference comparison, and small confidence intervals simultaneously with a reasonable assessor count. *(pp.1, 3)*

Additionally, "the name MUSHRA is often misused for tests not using reference and anchors" — a test without the hidden reference and the mandatory anchors is not MUSHRA. *(p.1, considering i))*

## Key Contributions
- Defines the MUSHRA method: double-blind multi-stimulus presentation with hidden reference and hidden anchors, allowing near-instantaneous switching among all stimuli in a trial. *(pp.6, 8)*
- Fixes the continuous quality scale (CQS) 0-100 with five equal labelled intervals (Bad / Poor / Fair / Good / Excellent). *(p.9, Fig. 1)*
- Specifies mandatory anchors: 3.5 kHz low-pass ("low anchor") and 7 kHz low-pass ("mid-range anchor"), with a normative filter mask for the 3.5 kHz anchor. *(p.7)*
- Gives quantitative post-screening exclusion rules based on hidden-reference and mid-anchor gradings. *(p.5)*
- Gives an outlier definition via the 1.5 x IQR rule and a multimodality coefficient b. *(pp.5-6, 14)*
- Prescribes non-parametric bootstrap / Monte-Carlo confidence intervals as the normative statistical comparison (Attachment 3) with parametric ANOVA guidance as informative (Attachment 4). *(pp.2, 14 ff.)*
- Specifies presentation mechanics: <= 10 s (preferably <= 12 s) excerpts, >= 500 ms minimum loop, 5 ms raised-cosine fades, and a prohibition on cross-fades between systems. *(pp.7-9)*

## Study Design (standards document)
Not an empirical study. This is a normative Recommendation. The empirical basis is cited to references [2; 4; 3] (EBU / AES validation work on MUSHRA). *(p.2)*

## Document Structure
Annex 1 sections:
| Section | Title |
|---------|-------|
| 1 | Introduction |
| 2 | Scope, test motivation and purpose of new method |
| 3 | Experimental design |
| 4 | Selection of assessors |
| 5 | Test method |
| 6 | Attributes |
| 7 | Test material |
| 8 | Listening conditions |
| 9 | Statistical analysis |
| 10 | Test report and presentation of results |

Attachments:
| # | Status | Title |
|---|--------|-------|
| 1 | Normative | Instructions to be given to assessors |
| 2 | Informative | Guidance notes on user interface design |
| 3 | Normative | Non-parametric statistical comparison between two samples using re-sampling techniques and Monte-Carlo simulation methods |
| 4 | Informative | Guidance notes for parametric statistical analysis |
| 5 | Informative | Requirements for optimum anchor behaviours |
*(pp.2-3)*

## Section 2 - Scope, test motivation, purpose

- Subjective listening tests are "still being the most reliable way of measuring the quality of audio systems." *(p.3)*
- Intermediate-quality application domains named: streaming audio on the Internet, solid state players, digital satellite services, digital short and medium wave (DRM), mobile multimedia, digital AM, commentary circuits in radio and TV, audio on-demand, audio on dial-up lines. *(pp.1, 3)*
- **Validity heuristic (important):** "If MUSHRA is used with appropriate content, it is ideal that listener scores should range between 20-80 MUSHRA points. If scores for the majority of test conditions fall in the range of 80-100 it may be true that the results of the test are invalid." *(p.3)*
- Likely causes of compressed scoring: naive assessors, non-critical content, inappropriate test choice for the encoding algorithms at test. *(p.3)*

## Section 3 - Experimental design

- The most formal experimental methods shall be used; subjective experiments are characterized by (a) actual control and manipulation of the experimental conditions and (b) collection and analysis of statistical data from listeners. *(p.3)*
- Uncontrolled factors must be minimized. If the sequence of audio items were identical for all assessors, judgements could not be attributed to the impairments rather than the sequence. *(p.3)*
- **Randomization:** where impairments are expected to be distributed homogeneously, true randomization can be applied to presentation of test conditions. Where non-homogeneity is expected, this must be taken into account. Where material varies in difficulty, "the order of presentation of stimuli must be distributed randomly, both within and between sessions." *(p.4)*
- Assessors must not be overloaded to the point of lessened accuracy of judgement. *(p.4)*
- Assessment should be carried out **without accompanying pictures** except where the sound/vision relationship matters. *(p.4)*
- Control conditions (unimpaired audio material introduced unpredictably) are a major consideration; it is the difference between judgements of control stimuli and potentially impaired ones that licenses the conclusion that grades are actual assessments of impairment. *(p.4)*
- Professionals with expertise in experimental design and statistics should be consulted at the beginning of planning. *(p.4)*
- The experimental design **shall be reported**; both dependent and independent variables should be defined in detail; the number of independent variables shall be defined with their associated levels. *(p.4)*

## Section 4 - Selection of assessors

### 4.1 Criteria
- Experienced listeners are recommended even though MUSHRA is not for small impairments; they give more reliable results more quickly. Non-experienced listeners tend to become more sensitive to artefact types after frequent exposure. *(p.4)*
- Two qualifying dimensions, defined verbatim: *(p.4)*
  - **Discrimination**: "A measure of the ability to perceive differences between test items."
  - **Reliability**: "A measure of the closeness of repeated ratings of the same test item."
- **Only assessors categorized as *experienced assessors* for any given test should be included in final data analysis.** *(p.4)*
- Analysis techniques are based upon at least one replicated rating by each assessor. See Report ITU-R BS.2300 (expertise gauge, "eGauge" method, at http://www.itu.int/oth/R0A07000036). *(pp.4-5)*
- Methods applied as pre-screening within a pilot experiment, or preferably as both pre-screening and part of the main test. A pilot experiment comprises a representative subset of the test stimuli, representative of the full range of stimuli and artefacts of the main experiment. *(p.5)*
- The graphical representation of the analysis should convey reliability versus discrimination. *(p.5)*

### 4.1.1 Pre-screening
Listeners should: *(p.5)*
- have experience in listening to sound in a critical way;
- have normal hearing (ISO Standard 389 as a guideline).

The training procedure should be used as a tool for pre-screening. Inclusion of replications of stimuli provides the method for assessing listener reliability. The argument for pre-screening is efficiency, balanced against the risk of limiting relevance of the result too much. *(p.5)*

### 4.1.2 Post-screening (EXCLUSION CRITERIA - normative numbers)
"The post-screening method excludes assessors who assign a very high grade to a significantly impaired anchor signal, and those who frequently grade the hidden reference as though it were significantly impaired, as defined by the following metrics:" *(p.5)*

1. **Exclude** an assessor from the aggregated responses if he or she rates the **hidden reference** condition for **> 15% of the test items lower than a score of 90**. *(p.5)*
2. **Exclude** an assessor if he or she rates the **mid-range anchor** for **more than 15% of the test items higher than a score of 90**. *(p.5)*
   - **Caveat:** if **more than 25% of the assessors** rate the mid-range anchor higher than 90, this might indicate the test item was not degraded significantly by the anchor processing. "In this case assessors should not be excluded on the basis of scores for that item." *(p.5)*

This initial stage can be performed before all assessors have completed their tests, letting the lab check it has enough reliable assessors before finishing. *(p.5)*

### Outlier identification (per test condition j, audio sequence k)
Median: *(p.5)*

$$
\hat{x} := Q_2(x_{jk}) = \mathrm{median}(x) := \begin{cases} x_{jk\frac{n+1}{2}}, & n \text{ odd} \\ \frac{1}{2}\left(x_{jk\frac{n}{2}} + x_{jk\frac{n}{2}+1}\right), & n \text{ even} \end{cases}
$$
Where: $x$ is ordered by increasing size; $n$ is the number of grades; $j$ indexes test condition; $k$ indexes audio sequence. *(p.5)*

$$
Q_1(x_{jk}) = \begin{cases} \mathrm{median}\left(x_{jk1}, \ldots, x_{jk\frac{n+1}{2}}\right), & n \text{ odd} \\ \mathrm{median}\left(x_{jk1}, \ldots, x_{jk\frac{n}{2}}\right), & n \text{ even} \end{cases}
$$
Where: $Q_1$ is the lower quartile. *(p.6)*

$$
Q_3(x_{jk}) = \begin{cases} \mathrm{median}\left(x_{jk\frac{n+1}{2}}, \ldots, x_{jkn}\right), & n \text{ odd} \\ \mathrm{median}\left(x_{jk\frac{n}{2}+1}, \ldots, x_{jkn}\right), & n \text{ even} \end{cases}
$$
Where: $Q_3$ is the upper quartile. *(p.6)*

$$
IQR(x) := Q_3(x) - Q_1(x)
$$
*(p.6)*

$$
O(x_{jk}) := \left\{x_{jk} \mid x_{jk} > Q_3(x_{jk}) + 1.5 \cdot IQR(x_{jk})\right\} \cup \left\{x_{jk} \mid x_{jk} < Q_1(x_{jk}) - 1.5 \cdot IQR(x_{jk})\right\}
$$
Where: $O(x_{jk})$ is the outlier set for condition $j$, sequence $k$. *(p.6)*

**Handling of outliers (procedural):** if a grade is in $O(x)$, the reason for that grading *should be examined*. Examining a recording of the test session might reveal technical problems or human error; questioning the assessor might reveal whether the grade was truly representative of their subjective opinion. **Only if the reason is shown to be an error may the point be removed, and the reason for removal must be noted in the test report.** *(p.6)*

Caution: assessors' sensitivities to different artefacts vary. Increasing the panel size reduces the effect of any individual assessor's grades. *(p.6)*

### 4.2 Size of listening panel
- Adequate size is determined if the variance of grades across assessors can be estimated and the required resolution is known. *(p.6)*
- **"Where the conditions of a listening test are tightly controlled on both the technical and behavioural side, experience has shown that data from no more than 20 assessors are often sufficient."** If analysis is carried out as the test proceeds, no further assessors need processing once adequate statistical significance is reached. *(p.6)*
- If tight experimental control cannot be achieved, larger numbers might be needed. *(p.6)*
- The result is in principle only valid for precisely the group of experienced listeners involved; a larger panel lets the result be claimed to hold for a more general group. Panel size may also need increasing to allow for varying sensitivity to different artefacts. *(p.6)*

## Section 5 - Test method

The method uses the original unprocessed programme material with **full bandwidth** as the reference signal (also used as hidden reference) plus a number of **mandatory hidden anchors**. Additional hidden anchors may be used, preferably those that are the subject of other relevant ITU-R Recommendations. Because anchor properties significantly affect results, non-standard anchor design should follow Attachment 5, and the nature of any non-standard anchor must be described in detail in the test report. *(pp.6-7)*

### 5.1 Description of test signals
- **Maximum sequence length approximately 10 s, preferably not exceeding 12 s.** Rationale: avoid listener fatigue, increase robustness and stability of listener responses, reduce total test duration, enable consistency of content across the signal duration, and allow listeners to compare a larger continuous proportion of the test signals. *(p.7)*
- If signals are too long, responses are driven by primacy and recency effects, or by isolated looped regions varying greatly in spectral and temporal features. *(p.7)*
- Exception: a long slow-moving sound trajectory may require longer stimuli. Any increase in duration **must be justified and documented in the final test report**. *(p.7)*
- The processed-signal set consists of all signals under test plus **at least two additional "anchor" signals**. *(p.7)*
  - **Low anchor (standard anchor):** low-pass filtered version of the original, cut-off **3.5 kHz**. *(p.7)*
  - **Mid-quality anchor:** cut-off **7 kHz**. *(p.7)*
- Anchor bandwidths correspond to ITU-T Recommendations for: control circuits 3.5 kHz (supervision/coordination in broadcasting), commentary circuits 7 kHz, occasional circuits 10 kHz — per ITU-T G.711, G.712, G.722 and J.21 respectively. *(p.7)*

**Normative 3.5 kHz low-pass filter mask:** *(p.7)*
| Property | Value |
|----------|-------|
| Cut-off frequency $f_c$ | 3.5 kHz |
| Maximum pass band ripple | ±0.1 dB |
| Minimum attenuation at 4 kHz | 25 dB |
| Minimum attenuation at 4.5 kHz | 50 dB |

- Additional anchors indicate how systems under test compare to well-known audio quality levels and **should not be used for rescaling results between different tests**. *(p.7)*

### 5.2 Training phase
- **"It is mandatory to train the assessors in special training sessions in advance of the test."** *(p.7)*
- Training should at least expose the subject to the full range and nature of impairments and all test signals that will be experienced during the test. *(p.7)*
- Achievable via a simple tape playback system or an interactive computer-controlled system. Instructions in Attachment 1. *(p.7)*
- Training should also ensure assessors are familiar with the subjective test setup (e.g. the testing software). *(p.7)*

### 5.3 Presentation of stimuli
- MUSHRA is a **double-blind multi-stimulus** test with hidden reference and hidden anchors, whereas BS.1116 uses a "double-blind triple-stimulus with hidden reference" method. MUSHRA is more appropriate for medium and large impairments. *(p.8)*
- Rationale for multi-stimulus: with medium/large impairments the subject has no difficulty detecting artefacts; the difficulty is grading the *relative annoyances* of the various artefacts. The perceptual difference reference-to-test-item is large while differences between test items from different systems may be small; a multi-trial method (as in BS.1116) makes discrimination between impaired signals hard. "For example, in a direct paired comparison test assessors might agree that System A is better than System B. However, in a situation where each system is only compared with the reference signal ... the differences between the two systems may be lost." *(p.8)*
- **The subject can switch at will between the reference signal and any of the systems under test**, typically via a computer-controlled replay system. *(p.8)*
- Each trial presents: the reference version, the low and mid anchor, and all versions of the test signal processed by the systems under test. Worked example: with 8 audio systems the subject can switch near-instantaneously between **11 test signals and the open reference** (1 reference + 8 test systems + 1 hidden reference + 1 hidden low anchor + 1 hidden mid anchor). *(p.8)*
- Benefits: full paired-comparison behaviour; high resolution in grades. Note assessors derive a grade for a system by comparing it to the reference **as well as to the other signals** in each trial. *(p.8)*
- **"It is recommended that no more than 12 signals (e.g. 9 systems under test, 1 hidden low anchor, 1 hidden mid anchor and 1 hidden reference) should be included in any trial."** *(p.8)*
- In the rare case where a large number of signals must be compared, a **blocked design** may be required, which **shall be reported in detail**. *(p.8)*
- Observed assessor strategy in MUSHRA: rough estimation of quality, then sorting/ranking, then grading. Because ranking is done directly, results for intermediate audio quality are likely more consistent and reliable than with BS.1116. *(p.8)*
- **Looping / switching mechanics (normative numbers):** *(pp.8-9)*
  - Minimum loop duration **500 ms**.
  - A **5 ms raised-cosine-envelope fade in and fade out** should be applied to all looped content.
  - All content switching between test systems should include a **5 ms fade in and 5 ms fade out with a raised-cosine envelope**.
  - **"At no time during any test should a cross-fade be used when transitioning between test systems."**
  - Purpose: reduce the use of changes in spectral coloration during abrupt transient comparisons to identify and rate the signals at test.

### 5.4 Grading process - the Continuous Quality Scale (CQS)
- Assessors score stimuli on the **continuous quality scale (CQS)**: identical graphical scales, **typically 10 cm long or more**, divided into **five equal intervals** with adjectives. *(p.9)*
- Same scale used for picture quality in ITU-R BT.500. *(p.9)*

**Figure 1 - CQS (p.9):**
| Numeric range | Label |
|---------------|-------|
| 80-100 | Excellent |
| 60-80 | Good |
| 40-60 | Fair |
| 20-40 | Poor |
| 0-20 | Bad |

- The listener records the assessment on sliders on an electronic display (Fig. 2) or a pen-and-paper scale. **The subject should be constrained to be able to adjust only the score assigned to the item he or she is currently listening to.** *(p.9)*
- The assessor is asked to rate the quality of **all** stimuli, according to the five-interval CQS. *(p.9)*
- **Fig. 2 (p.10):** example computer display — one "Ref" playback button plus buttons 1-8 for the hidden stimuli, a vertical slider per stimulus with a numeric readout (example values 53, 20, 76, 96, 40, 100, 87, 61), scale labels Excellent/Good/Fair/Poor/Bad, a waveform display with loop A / loop B markers, stop and pause transport, and "next Test" / "comment" buttons.
- Advantage over BS.1116: many stimuli displayed at once so any comparison can be made directly; test time can be significantly reduced. *(p.10)*

### 5.5 Recording of test sessions
Making video and audio recordings of the whole test allows an anomalous grade to be traced to human error or equipment malfunction. *(p.10)*

## Section 6 - Attributes

- "It is preferred that the attribute *basic audio quality* be evaluated in each case." Experimenters may define and evaluate other attributes. *(p.10)*
- **"Only one attribute should be graded during a trial."** Assessing more than one attribute per trial overburdens or confuses assessors and may produce unreliable grading for all questions. If multiple properties are judged independently, **basic audio quality should be evaluated first**. *(p.10)*

| System class | Attribute | Definition | Page |
|--------------|-----------|------------|------|
| Monophonic | Basic audio quality | "This single, global attribute is used to judge any and all detected differences between the reference and the object." | 11 |
| Stereophonic | Basic audio quality | as above | 11 |
| Stereophonic | Stereophonic image quality | Differences between reference and object in terms of sound image locations and sensations of depth and reality of the audio event. | 11 |
| Multichannel | Basic audio quality | as above | 11 |
| Multichannel | Front image quality | Localization of the frontal sound sources; includes stereophonic image quality and losses of definition. | 11 |
| Multichannel | Impression of surround quality | Spatial impression, ambience, or special directional surround effects. | 11 |
| Advanced sound system | Basic audio quality | as above; attributes should be inclusive of those for multichannel | 11 |
| Advanced sound system | Timbral quality | Two property sets: *sound colour* (brightness, tone colour, coloration, clarity, hardness, equalization, richness) and *sound homogeneity* (stability, sharpness, realism, fidelity, dynamics). | 11 |
| Advanced sound system | Localization quality | Localization of all directional sound sources; includes stereophonic image quality and losses of definition. Separable into horizontal / vertical / distant localization quality; with accompanying picture, into localization quality on the display and around the listener. | 11 |
| Advanced sound system | Environment quality | Extends surround quality: spatial impression, envelopment, ambience, diffusivity, or spatial directional surround effects. Separable into horizontal / vertical / distant environment quality. | 12 |

NOTE 1 (p.11): up to 1993 most small-impairment studies of stereophonic systems used basic audio quality exclusively, so stereophonic image quality was implicitly or explicitly included within it.

## Section 7 - Test material

### 7.1 Test item
- **Critical material** representing typical broadcast programme for the desired application **shall** be used. "Material is critical if it stresses the systems under test." *(p.12)*
- There is no universally suitable programme material; critical material **must be sought explicitly for each system to be tested in each experiment**. The search is time-consuming, but "unless truly critical material is found for each system, experiments will fail to reveal differences among systems and will be inconclusive." *(p.12)*
- A small group of expert listeners should select test items from a larger candidate set. **The selection process must include all test systems and be documented and reported in the test summary.** *(p.12)*
- **Null-result validity requirement:** "It must be empirically and statistically shown that any failure to find differences among systems is not due to experimental insensitivity which may be caused by poor choices of audio material, or any other weak aspects of the experiment. Otherwise this 'null' finding cannot be accepted as valid." *(p.12)*
- Any stimulus considerable as potential broadcast material shall be allowed. **Synthetic signals deliberately designed to break a specific system should not be included.** *(p.12)*
- Artistic/intellectual content should be neither so attractive nor so disagreeable or wearisome that the subject is distracted from detecting impairments. Expected frequency of occurrence of each programme type in actual broadcasts should be taken into account. *(p.12)*
- Attributes to be assessed must be precisely defined when selecting programme material. Selection is delegated to a group of skilled assessors with basic knowledge of the expected impairments, starting from a very broad range of material, extensible by dedicated recordings. *(p.12)*
- **Loudness:** the loudness of each excerpt needs to be adjusted subjectively by the group of skilled assessors before recording onto the test media, allowing use of the test media at a **fixed gain setting for all programme items within a test trial**. The skilled assessors shall reach consensus on relative sound levels of individual excerpts, and on the absolute reproduced sound pressure level for the sequence as a whole relative to the alignment level. *(p.12)*
- **Alignment tone:** a tone burst (for example **1 kHz, 300 ms, -18 dBFS**) at alignment signal level may be included at the head of each recording to allow output alignment level adjustment to the input alignment level required by the reproduction channel, per EBU Recommendation R.68 (see ITU-R BS.1116 §8.4.1). **The tone burst is only for alignment; it should not be replayed during the test.** *(p.12)*
- The sound-programme signal should be controlled so that peak amplitudes only rarely exceed the permitted maximum signal defined in ITU-R BS.645 (a sine wave **9 dB above the alignment level**). *(p.13)*
- **Number of excerpts:** "it shall be equal for each system under test. A reasonable estimate is **1.5 times the number of systems under test, subject to a minimum value of 5 excerpts**." *(p.13)*
- Due to the complexity of the task the systems under test should be available to the experimenter; a successful selection needs an appropriate time schedule. *(p.13)*
- **Due to time-variable bitrate use in audio codecs it is recommended to encode longer sequences and use a portion of each sequence in the listening test.** *(p.13)*

### Reference two-channel down-mix (for multichannel under two-channel playback) *(p.13)*
$$
L_0 = 1.00 L + 0.71 C + 0.71 L_s
$$
$$
R_0 = 1.00 R + 0.71 C + 0.71 R_s
$$
Where: $L, R$ are the front left/right channels; $C$ the centre channel; $L_s, R_s$ the surround left/right channels; $L_0, R_0$ the down-mixed two-channel output. Per ITU-R BS.775. Pre-selection of suitable excerpts for critical evaluation of the reference down-mix should be based on reproduction of two-channel down-mixed programme material. *(p.13)*

### 7.2 Loudspeaker configuration
If a loudspeaker configuration other than ITU-R BS.775 is used, **all loudspeaker positions (distances and angles) and their relative placement to the listening position must be described in detail in the test report**, following the form and content of BS.775 layouts and listening positions. Vertical-dimension positions must also be identified and described for advanced sound systems. See ITU-R BS.2051. *(p.13)*

## Section 8 - Listening conditions

- For intermediate quality, use the listening conditions of **§§ 7 and 8 of ITU-R BS.1116**. *(p.13)*
- **Either headphones or loudspeakers may be used. "The use of both within one test session is not permitted: all assessors must use the same type of transducer."** *(p.13)*
- **Calibration:** for a measuring signal with r.m.s. voltage equal to the alignment signal level (0 dBu0s per ITU-R BS.645; -18 dB below the clipping level of a digital tape recording per EBU R.68) fed in turn to the input of each reproduction channel (power amplifier and associated loudspeaker), the amplifier gain shall be adjusted to give the reference sound pressure level (IEC/A-weighted, slow): *(p.13)*

$$
L_{ref} = 78 \pm 0.25\ \mathrm{dBA}
$$
Where: $L_{ref}$ is the reference sound pressure level per reproduction channel, A-weighted, slow time constant. *(p.13)*

- **Individual level adjustment** by a subject is allowed within a session but should be limited to **±4 dB** relative to the BS.1116 reference level. Test-item balance should be provided by the selection panel so that assessors would normally not need per-item adjustment. *(pp.13-14)*
- **"Level adjustments within one item should not be allowed."** *(p.14)*

## Section 9 - Statistical analysis

- Assessments for each test condition are converted **linearly** from measurements of length on the score sheet to normalized scores in the range **0 to 100**, where 0 corresponds to the bottom of the scale (bad quality). *(p.14)*
- Either parametric or non-parametric analysis may be performed, on the basis of statistical assumptions being fulfilled (see §9.3.3). Parametric guidance is in Attachment 4. *(p.14)*

### 9.1 Data visualization and exploratory data analysis
- **Statistical analysis should always start with a visualization of the raw data:** histograms with a fitting curve for a normal distribution, boxplots, or quantile-quantile (Q-Q) plots. *(p.14)*
- Box plots indicate existence and effect of outliers, and the spread/deviation of individual scores from the median grade of all assessors. Histograms identify an underlying multi-modal distribution; if multi-modality is clearly visible, the experimenter is advised to analyse the distributions separately. *(p.14)*

**Multimodality coefficient:** *(p.14)*
$$
b = \frac{g^2 + 1}{k + \frac{3(n-1)^2}{(n-2)(n-3)}}
$$
Where: $n$ = sample size; $g$ = skewness of the finite sample; $k$ = the excess kurtosis of the listening test results.

- **"This coefficient will lie between 0 and 1. Higher values (> 5/9) can be interpreted as an indication of multi-modality."** *(p.14)*
- Normality decision: based on visual inspection of the plots, $b$, and assumptions about the underlying population. "If the fitting curve is clearly skewed, the histogram contains many outliers or the Q-Q-plot is not at all a straight line, one should not consider the sample as being normally distributed." *(p.14)*
- The median of normalized scores of all listeners remaining after post-screening gives the **median subjective scores**. *(p.14)*

$$
\hat{x} = \mathrm{median}(x) = \begin{cases} x_{\frac{n+1}{2}}, & n \text{ odd} \\ \frac{1}{2}\left(x_{\frac{n}{2}} + x_{\frac{n}{2}+1}\right), & n \text{ even} \end{cases}
$$
Where: $x$ is ordered by size. *(p.14)*

### 9.1 (continued) - Median score notation and robust dispersion measures

- **First step of the analysis is the calculation of the median score $\bar{\eta}_{jk}$ for each of the presentations.** *(p.15)*
- $\eta_{ijk}$ is the median score of observer $i$ for a given test condition $j$ and audio sequence $k$; $\hat{\eta}$ is the median of the sample (all observers, all conditions, all audio sequences). Overall median scores $\bar{\eta}_j$ and $\bar{\eta}_k$ could similarly be calculated for each test condition and each test sequence. *(p.15)*
- Mean values are necessary for ANOVA (§9.3), but the median is an alternative measure of central tendency, "optimal for situations where the sample set is small, the distribution non-normal, or the dataset contains notable outliers." Because a great benefit of standardized testing is comparison and interpretation of scores across users and venues, it is beneficial to identify the most robust and least sensitive methods. *(p.15)*
- **When non-parametric data analysis is applied, means and 95% confidence intervals should be calculated from available methods such as using a common bootstrapping algorithm.** *(p.15)*

**Mean absolute deviation about the median:** *(p.15)*
$$
\hat{\tau} = \frac{\sum_i \left| Y_i - \hat{\eta} \right|}{n}
$$
Where: $Y_i$ is the $i$-th observation; $\hat{\eta}$ is the sample median; $n$ is the number of observations.

- **The Inter-Quartile Range is recommended as the measure of confidence about the median**, $IQR = Q_3 - Q_1$ (formulas in §4.1.2). **If the distribution of results is normal, the IQR represents two times the mean absolute deviation.** *(p.15)*
- **"It is recommended that statistical significance be identified at a significance level of 95%."** *(p.15)*
- Non-parametric tests of randomization are robust measures of statistical significance; unlike parametric analyses they make no assumptions about the underlying distribution and are less sensitive to small-sample concerns. *(p.15)*
- A robust non-parametric **test of randomization (permutation test)** identifies the probability that an observed difference between two testing conditions would occur if the data were truly random as under the null hypothesis. This probability is a real measure determined from the distribution of the actual data rather than an inferred measure assuming a specified distribution shape [5]. The form of testing requires re-sampling such as bootstrapping and Monte-Carlo simulation [6]; described further in Attachment 3. *(p.15)*

### 9.2 Power analysis
- Power analysis estimates needed sample sizes if applied *a priori*, and estimates power / type-II error *a posteriori*. *(p.15)*
- *A priori* analysis delivers the needed sample size given the effect size $d = \bar{x}/s$, a level of significance $\alpha$, and a statistical power $1-\beta$. *(p.15)*

$$
d = \frac{\bar{x}}{s}
$$
Where: $\bar{x}$ is the mean (difference); $s$ is the standard deviation; $d$ is the standardized effect size. *(p.15)*

- *A posteriori* analysis delivers the power $1-\beta$ or the type-II error $\beta$ given effect size $d$, significance level $\alpha$, and sample size $N$. $\beta$ is the probability that the effect $d$ exists in the population but was not found significant. If a test claims quality is not affected by the system, $1-\beta$ is the probability that the impairment was proven by the test. *(pp.15-16)*
- Footnote 2: tools such as **G*Power** [16] exist for automatic power analysis for known population distributions; power is harder to estimate for unknown populations. *(p.16)*

### 9.3 Application and usage of ANOVA

#### 9.3.1 Introduction
- ANOVA is well-suited to BS.1534 data due to model robustness [7][8][12][13] and statistical power. "As the ANOVA F-statistic is quite robust to both, non-normal data distributions and heterogeneity of variance, the assumption testing focuses upon the nature of the error or residuals." *(p.16)*
- Footnote 3: "It is generally advised to select the most powerful statistical analysis method that is permitted by the data [9][10]." *(p.16)*

#### 9.3.2 Specification of a model
- **Strongly advised that during experiment design (§3) the model is thoroughly specified** in terms of independent variables (e.g. SAMPLE, SYSTEM, CONDITION) and dependent variables (e.g. Basic Audio Quality or Listening Effort). The levels of each independent variable should also be defined at the model specification phase. *(p.16)*
- Include all significant variables. Omission of significant variables, e.g. 2- or 3-way interactions of independent factors, may lead to misspecification, poor explained variance ($R^2$), and misinterpretation. *(p.16)*

#### 9.3.3 Checklist for parametric statistical analysis *(pp.16-18)*
1. **Exploratory statistics** (applies equally to parametric and non-parametric statistics — footnote 4):
   - Review that the data structure is correct and as expected.
   - Check for missing data.
   - Study normality of data distributions.
   - Review other potential data distributions (unimodal, bimodal, skewed, etc.).
2. **Unidimensionality**:
   - Check that there is a common use of the scale by the assessors. (Footnote 5: "Multidimensionality has been observed in cases where sub-populations have different opinions regarding the evaluation of particular artefacts.")
   - Test that the data is unidimensional in nature.
   - Principal components analysis, Tucker-1 plots, or Cronbach's alpha.
3. **Independence of observations**: usually defined in the experimental methodology and cannot easily be tested statistically. Ensure data collected independently, i.e. by using double blind experimental techniques and ensuring that assessors do not influence each other.
4. **Homogeneity of variance** (footnote 6: required for ANOVA but not for rmANOVA — see Attachment 4):
   - Test the assumption that each independent variable exhibits similar variance.
   - Visual review using side-by-side boxplots for each level of the independent variables; **as a rule of thumb, heterogeneity may maximally vary by a factor of four**.
   - Brown and Forsythe's test or the Levene Statistic.
5. **Normal distribution of residuals**:
   - Kolmogorov-Smirnov D test, K-S Lilliefors test, or Levene's test.
   - Normal probability plot (P-P plots) or Q-Q plots as a visual test.
6. **Outlier detection**: outliers should be screened for and maybe eliminated when justified; guidance in §4.1.2.
7. **Analysis - ANOVA (General Linear Model or repeated-measurement ANOVA)**:
   - Employ a suitable ANOVA model, e.g. GLM or rmANOVA (details in Attachment 4).
   - Specify the model according to the design of the experiment; **include 2- and 3-way interactions where possible**.
   - Analyse the data with the model and results: review explained variance $R^2$; review the distribution of the residual error; review significant and non-significant factors.
   - The model may be iterated to remove outliers and non-significant factors.
8. **Post-hoc tests**:
   - Apply post-hoc tests to establish significance of difference between means where the dependent factor (or factor interaction) is significant in the ANOVA.
   - Different post-hoc tests offer different levels of discrimination, e.g. Fisher's Least Significant Difference (LSD), Tukey's Honestly Significant Difference (HSD).
   - **Effect sizes are recommended to be reported along with the levels of significance.**
9. **Drawing conclusions**:
   - Summarize findings by plotting means and associated 95% confidence intervals for the raw or ANOVA modelled data (estimated marginal means).
   - Where factor interactions (2- or 3-way) are significant, these should be plotted. Plotting only main effects gives an overview with interaction effect confounded.

Further ANOVA guidance in Attachment 4 and texts [11][13][15]. *(p.18)*

## Section 10 - Test report and presentation of results

### 10.1 General
Presentation should be user-friendly so any reader, naive or expert, gets the relevant information. Readers first want the overall experimental outcome, preferably graphical, supportable by more detailed quantitative information; **full detailed numerical analyses should be in attachments**. *(p.18)*

### 10.2 Contents of the test report
The report should convey the rationale for the study, the methods used and conclusions drawn, with **sufficient detail that a knowledgeable person could in principle replicate the study**. It need not contain all individual results. *(p.18)*

Special attention to the following (verbatim checklist, pp.18-19):
- a graphical presentation of the results;
- a graphical presentation of the screening and specification of the selected *experienced assessors*;
- the definition of the experimental design;
- the specification and selection of test material;
- general information about the system used to process the test material;
- identification and description of whether the tested channel configuration is specified in ITU-R BS.775 or ITU-R BS.2051. If the tested sound system is not specified in BS.775, all loudspeaker positions must be documented with comparable detail as provided in BS.775 to allow external repeatability. The reference listening position must also be documented with respect to the loudspeaker positions (see ITU-R BS.1116 §§8.5.4 and 8.5.5);
- the physical details of the listening environment and equipment, including room dimensions and acoustic characteristics, the transducer types and placements, electrical equipment specification (see Note 1);
- whether satisfaction of distance requirements in ITU-R BS.1116 §8.5.1.2 were met. If they were not, this must be noted;
- if those distance requirements were not met, methods used to control early reflections and meet ITU-R BS.1116 §8.3.3.1 should be described;
- the measured operational room response of all of the loudspeakers. If equalization is processed, acknowledge this and the methods of equalization employed;
- any deviations from acoustical and physical room requirements: tolerated operational room acoustic measurements and responses (ITU-R BS.1116 §8.3), all loudspeaker behavioural response performance metrics (§8.4), and all physical distance requirements (§8.5);
- the impulse response from every loudspeaker, measured at the assessors' listening position with the room set up as it will be used in the test (including furnishings), shown in the time domain;
- the experimental design, training, instructions, experimental sequences, test procedures, data generation;
- the processing of data, including details of descriptive and analytic inferential statistics;
- **that the anchors were used in testing**;
- **which post-screening methods were used in the analysis of the results — this will include methods of outlier or untrained listener exclusion**;
- whether testing was completed using ITU-R BS.1534 or ITU-R BS.1534-1; this should be clearly indicated with description of employed anchor conditions;
- **adequate definition and generation code necessary to allow a new user to produce any anchor employed in testing that is not explicitly described in ITU-R BS.1534-2**;
- the detailed basis of all the conclusions that are drawn.

NOTE 1 (p.19): because there is evidence that listening conditions (e.g. loudspeaker versus headphone reproduction) may influence results, experimenters are requested to explicitly report the listening conditions and reproduction equipment type. If a combined statistical analysis of different transducer types is intended, it has to be checked whether such a combination of the results is possible.

### 10.3 Presentation of the results
- **For each test parameter, the median and IQR of the statistical distribution of the assessment grades must be given.** *(p.19)*
- Results must be given together with: description of the test materials; number of assessors; a graphical presentation of the results — **box plots showing IQRs, in addition to presentation of means and 95% confidence intervals should be included; significant differences between systems under test should be reported as well as the applied method of statistical analysis**. *(p.20)*
- Results may also be presented as means and confidence intervals when the data support such presentations following box-plot visualization. *(p.20)*

### 10.4 Absolute grades
A presentation of the absolute mean grades for the systems under test, the hidden reference, and the anchors gives a good overview. **Caveat:** it provides no information of the detailed statistical analysis; the observations are not independent, and statistical analysis of absolute grades only, without consideration of the underlying population of the observed sample, will not lead to meaningful information. The applied statistical methods as proposed in §9 should be reported. *(p.20)*

### 10.5 Significance level and confidence interval
- The report should inform the reader about the inherent statistical nature of all subjective data. Significance levels should be stated, as well as other details about statistical methods and outcomes; such details might include confidence intervals or error bars in graphs. *(p.20)*
- **"There is of course no 'correct' significance level. However, the value 0.05 is traditionally chosen. It is, in principle, possible to use either a one-tailed or a two-tailed test depending on the hypothesis being tested."** *(p.20)*

## Attachment 1 (NORMATIVE) - Instructions to be given to assessors

"The following is an example of the type of instructions that should be given to or read to the assessors in order to instruct them on how to perform the test." *(p.21)*

### 1 Familiarization or training phase
- The first step is to become familiar with the testing process; the training phase precedes the formal evaluation phase. *(p.21)*
- Two objectives: *(p.21)*
  - **Part A**: to become familiar with all the sound excerpts under test and their quality level ranges.
  - **Part B**: to learn how to use the test equipment and the grading scale.
- Part A: listen to all sound excerpts selected for the tests to illustrate the whole range of possible qualities. Sound items will be more or less critical depending on the bit rate and other "conditions" used. Excerpts are grouped on the basis of common conditions; in the Fig. 3 example three such groups are identified, each including four processed signals. *(pp.21-22)*
- Part B: learn to use the available playback and scoring equipment. *(p.22)*
- **"During the training phase you should be able to learn how you, as an individual, interpret the audible impairments in terms of the grading scale. You should not discuss your personal interpretation of the scale with the other assessors at any time during the training phase. However, you are encouraged to explain artefacts to other assessors."** *(p.22)*
- **"No grades given during the training phase will be taken into account in the true tests."** *(p.22)*

### 2 Blind grading phase
- Purpose: assign grades using the quality scale; grades should reflect the subjective judgement of the quality level for each excerpt. *(p.22)*
- In the example: **each trial will contain 9 signals to be graded. Each of the items is approximately 10 s long.** *(p.22)*
- Listen to the reference, anchor, and all the test conditions by clicking the respective buttons. **"You may listen to the signals in any order, any number of times."** *(p.22)*
- Use the slider for each signal to indicate the opinion of its quality. When satisfied with grading of all signals, click the "register scores" button at the bottom of the screen. *(p.22)*
- **Fig. 3 (p.22):** example training-phase Part A interface. A matrix: rows are reference items (classic, gambia, middleeast, india, gamelan1, tango, pop, speechen, speechfr, speechsp1, speechge) with a left column of reference buttons; columns are test1..test12 arranged into group 1 (test1-4), group 2 (test5-8), group 3 (test9-12). Caption in the dialog: "In each row different sound excerpts produced from the same reference signal are available. The left column gives access to the reference signals." The item set mixes music and **speech in four languages** (English, French, Spanish, German).

### Attachment 1, continued - scale instructions given to assessors *(p.23)*

- "You will use the quality scale as given in Fig. 1 when assigning your grades."
- "The grading scale is continuous from 'excellent' to 'bad'. A grade of 0 corresponds to the bottom of the 'bad' category, while a grade of 100 corresponds to the top of the 'excellent' category."
- **Key anti-anchoring instruction:** "In evaluating the sound excerpts, please note that you should not necessarily give a grade in the 'bad' category to the sound excerpt with the lowest quality in the test. However one or more excerpts must be given a grade of 100 because the unprocessed reference signal is included as one of the excerpts to be graded." *(p.23)*
- **Fig. 4 (p.23):** example blind-grading-phase interface, identical in layout to Fig. 2 — Ref button plus 8 numbered stimulus buttons, one slider each with numeric readouts (53, 20, 76, 96, 40, 100, 87, 61), Excellent/Good/Fair/Poor/Bad labels, waveform with loop A / loop B region markers, stop/pause, "next Test" and "comment" buttons.

## Attachment 2 (INFORMATIVE) - Guidance notes on user interface design

Aimed at (a) those producing systems for performing MUSHRA subjective tests and (b) those performing such tests. Intended to increase the reliability of results and facilitate analysis of irregularities found during processing of test scores. *(p.23)*

- **"The design of the user interface should be such that the chance of a subject assigning a score which does not accord their true intent is minimized."** *(p.24)*
- It must be clear from the interface **which of the processed versions of a test item the subject is listening to at a given time**. Aided by careful choice of colours and brightness of on-screen indicators (clickable buttons), **to avoid potential difficulties should a subject not be sensitive to some colours** (i.e. colour-blindness accessibility). *(p.24)*
- **Only the control for the currently-heard signal should be enabled.** Rationale given verbatim: "It has been observed that some assessors listen to two processed versions of an item, in succession, in order to assign a score to the first, not the last, that they hear. In this circumstance, it is possible that a mistake might be made (especially when a large number of on-screen controls are presented) and the score might be assigned to a signal other than the intended one. To try to reduce this possibility, it is suggested that the only control that is enabled at any one time is the one related to the signal currently being heard. **Controls to assign scores to other signals, not currently being heard, should be disabled.**" *(p.24)*

## Attachment 3 (NORMATIVE) - Non-parametric comparison via re-sampling and Monte-Carlo simulation

Non-parametric tests of randomization may be used with common re-sampling techniques such as bootstrapping procedures to determine the significance of almost any statistical result. *(p.24)*

**Algorithm (verbatim procedure, p.24) for the significance of an observed median response difference between two test signals of sample sizes N1 and N2:**
1. Note the actual difference between the medians of each sample; call it $Diff_{ACT\_1}$.
2. Aggregate all data from these samples into a single file or vector.
3. Run a bootstrap procedure: for each iteration, permute the aggregate set with samples drawn of size $N1$ and $N2$ **without replacement**.
4. Record the difference between the medians of the randomly drawn two samples as $Diff_{EST\_1}$.
5. **Repeat 10 000 times.**
6. The ratio of the number of times $Diff_{EST\_N}$ exceeds $Diff_{ACT\_N}$, divided by 10 000, yields a corresponding $p$ value.
7. **Decision rule:** "If the total number of times in which $Diff_{EST\_N}$ exceeds $Diff_{ACT\_N}$ is less than 500 (500/10 000 = .05) the difference between the two means may be said to be significant at a level of .05, p < .05."

$$
p = \frac{\#\{Diff_{EST\_N} > Diff_{ACT\_N}\}}{10000}
$$
Where: $Diff_{ACT\_N}$ is the observed median difference; $Diff_{EST\_N}$ is the median difference under a permutation of the pooled data; the permutation count is 10 000. *(p.24)*

## Attachment 4 (INFORMATIVE) - Guidance notes for parametric statistical analysis

### A4.1 Introduction
- Especially when many conditions are compared, **an omnibus test like ANOVA is preferable to multiple pairwise comparisons**. *(p.25)*
- **The MUSHRA test uses a *repeated-measures* or *within-subjects* design** (introduction: Maxwell & Delaney, 2004), where two within-subjects factors (**condition** and **audio material**) are completely crossed, and at least one rating is obtained for each combination of listener, audio material, and condition. *(p.25)*
- If the same combinations of audio material and condition are presented to two or more different groups of assessors (e.g. different laboratories), there is an additional **between-subjects factor *group*** that must be accounted for in the analysis. *(p.25)*
- Inferential statistics are needed to generalize from a comparably small sample of listeners to the population of all listeners. *(p.25)*
- **Three hypotheses of interest in a MUSHRA test:** *(p.25)*
  1. Did the perceived audio quality differ between the systems under test (e.g. reference and three different coders)?
  2. If the audio systems were evaluated with different test materials, did the ratings depend on the audio material?
  3. Did the effect of the audio system on perceived audio quality differ between test materials (the condition x audio material interaction)?
- The appropriate way is to first obtain significance tests of the main effect of **condition** (audio system), the main effect of **audio material**, and the **condition x audio material interaction** by ANOVA. An interaction is present when the differences between the perceived quality of the audio systems depend on the audio material. *(p.25)*
- **"Note that due to the potential interactions, it is not advisable to aggregate the ratings for each audio system across audio materials, even if one is not particularly interested in the effect of the audio material or the interaction effect."** *(p.25)*
- More specific hypotheses (e.g. the perceived difference between a pair of audio systems) can then be tested using additional comparisons. *(p.25)*

**Multiplicity / familywise error argument:** *(pp.25-26)*
$$
\binom{K}{2} = \frac{K(K-1)}{2}
$$
Where: $K$ is the number of audio systems included in the test. With $K = 5$ (4 coders plus reference) there are 10 pairs of conditions. *(p.25)*

$$
P(\text{at least one Type I error}) = 1 - (1 - \alpha)^C
$$
Where: $C$ is the number of tests; $\alpha$ the per-test significance level. **For $C = 10$ and $\alpha = 0.05$ this is 0.40, "thus much higher than the desired alpha-level of 0.05."** *(p.26)*

- Familywise error can be controlled with the **Bonferroni correction** or the **Hochberg (1988) procedure** described later. However, "pairwise t-tests with correction still conceal the relevant information, partly because multiple t-tests on all pairs of means use redundant information (each mean appears in several tests). The pairwise testing approach will typically be less powerful ... than using the appropriate omnibus test, which for the MUSHRA test is a **repeated-measures analysis of variance (rmANOVA)**." *(p.26)*
- The step-by-step description that follows assumes a MUSHRA test containing **no between-subject factors** (one group of assessors, all combinations of condition and audio material presented to each assessor at least once). Extension to more than one group (e.g. two labs) is described later. *(p.26)*

### A4.2 Test for normality *(pp.26-27)*
- For a **between-subjects** design where each assessor is tested in only one experimental condition, ANOVAs in the general linear model framework are "surprisingly robust with respect to non-normality of the response measure" ([11]; [13]; [25]; [35]). *(p.26)*
- For a **repeated-measures** design as in MUSHRA: testing the null hypothesis that perceived audio quality is identical for all conditions is equivalent to computing $K-1$ **orthogonal contrasts**, e.g. forming difference variables between the $K$ conditions and testing that the population mean of all these difference variables is 0. Example: with reference and two coders, $D_1$ = reference rating minus coder A rating, $D_2$ = coder A rating minus coder B rating, per subject. *(p.26)*
- **rmANOVA approaches all assume that these difference variables are multinormally distributed.** Unlike the between-subjects design, **non-normality can result in too conservative or too liberal Type I error rates** ([5]; [22]; [30]; [39]), and **simply increasing the sample size does not solve this problem** [30]. *(p.26)*
- **"There is accumulating evidence that departures from symmetry have a much more serious effect than deviations from the normal distribution in terms of kurtosis ([4]; [18])."** Skewness is the third standardized moment (0 for a symmetric distribution like the normal); kurtosis is the standardized fourth population moment about the mean, describing peakedness and tail weights. *(p.26)*
- For small deviations from symmetry, rmANOVAs will still control the Type I error rate, but "the current state of research does not permit to formulate precise rules concerning the acceptable degree of deviation from normality. Therefore, **it is recommended to test for multivariate normality, and to report empirical estimates of skewness and kurtosis**." *(p.26)*
- **Important modelling point:** "the general linear model underlying rmANOVAs does not assume that the raw responses (i.e. rating in the MUSHRA test) are normally distributed. Instead, the model assumes that the *errors* are normally distributed." *(p.26)*

### A4.2 Test for normality (continued) *(p.27)*
- **Skewness and kurtosis must be calculated for the *residuals* of the model, rather than for the raw data.** Most statistical software can save the residuals for each analysed experimental condition, i.e. each combination of audio system and audio material, providing one vector of residuals per experimental condition; in each vector, each value represents one assessor. *(p.27)*
- Tests for multivariate normality: **multivariate Shapiro-Wilk test proposed by Royston [34]**, tests based on **multivariate skewness and kurtosis [10]**, and other approaches [14]. Macros available in SPSS (http://www.columbia.edu/~ld208/normtest.sps) and SAS (http://support.sas.com/kb/24/983.html). The SPSS macro by DeCarlo [9] also calculates multivariate skewness and kurtosis [26]. *(p.27)*
- **"The estimates of univariate or multivariate skewness and kurtosis should be reported, as well as the result of the test of multivariate normality."** *(p.27)*
- **Decision rule:** if the test of multivariate normality is not significant, or if all multivariate or univariate tests show no significant deviation of skewness or kurtosis from normal expectations, **the assumptions of the rmANOVA are met**. *(p.27)*
- **Preliminary rule of thumb: skewness in any experimental condition exceeding 0.5 flags a problem.** *(p.27)*
- Two problems with reacting to a significant normality test: (1) tests of multivariate normality are rather sensitive and often detect minute deviations, and detect kurtosis and other aspects, "while quite likely only asymmetry results in non-robust Type I error rates in rmANOVAs"; (2) estimated multivariate skewness/kurtosis [26] does not permit a decision whether rmANOVA can be applied, again for lack of rules. This emphasizes the need to report skewness and kurtosis measures as well as the test results, so results can be reevaluated when valid rules become available. *(p.27)*
- **If deviation from normality seems severe, "indicated for example by estimates of skewness higher than 1.0 [29]", non-parametric alternatives could be considered** — tests using resampling techniques, or the Friedman test. Caveats: it is not yet clear in which situations resampling solves the non-normality problem [38]; the **Friedman test does not assume multivariate normality but assumes the variances are identical for all experimental conditions [36]**, which will often not be the case; and the Friedman test is univariate, so **even if equal variances hold, it can detect an effect of audio system averaged across audio material, but cannot analyse the audio system x audio material interaction**. *(p.27)*

### A4.3 Selection of the rmANOVA approach *(pp.27-28)*
Assuming no between-subjects (grouping) factors and no missing data (a rating available for each combination of listener, audio material, and condition), **two approaches are recommended**; both are valid when data are multivariate-normal but can differ in statistical power depending on sample size: *(pp.27-28)*
- **(a) univariate approach with Huynh-Feldt correction for the degrees of freedom**;
- **(b) multivariate approach**.
Both are available in R, SAS, SPSS, Statistica. Detailed descriptions in [21]; [28]. *(p.28)*

**Univariate approach.** Due to the repeated-measures structure, ratings in different combinations of condition and audio material are correlated (worked example: "if a listener assigns an unusually high rating to the low quality anchor, then his or her ratings of the coders will likely also tend to be higher than the ratings of the other assessors"). The univariate approach assumes the variance-covariance structure is **spherical**, equivalent to saying the difference variables all have the same variance [16]; [33]. **"However, this assumption is violated for virtually all empirical data sets [21]."** A correction factor is applied to the degrees of freedom when computing the p-value from the F-distribution, estimating the departure from sphericity from the data. **The Huynh-Feldt correction factor $\tilde{\epsilon}$ is recommended [17] because the alternative Greenhouse-Geisser [12] correction factor tends to produce conservative tests** (e.g. [17]; [30]). When the data are normal, the univariate approach with Huynh-Feldt correction produces valid Type I error rates **even for extremely small sample sizes (N = 3)**. *(p.28)*

**Multivariate approach.** Uses an equivalent formulation of the null hypothesis: computing $K-1$ orthogonal contrasts (difference variables between the $K$ conditions) and testing that the vector $\mu$ of the population means of all $K-1$ contrasts equals the null vector, $\mu = 0$. No assumptions concerning the variance-covariance matrix are necessary. For multivariate-normal data this test is **exact**, but it **requires at least as many assessors as number of factor levels**. "Therefore, it cannot be used if for example 9 conditions (8 coders plus reference) were presented to only 8 assessors." *(p.28)*

**Selection rule (Algina and Keselman, 1997):** *(p.28)*
> Use the univariate approach with Huynh-Feldt correction if $\tilde{\epsilon} > 0.85$ and $N < K + 30$, where $N$ is the number of assessors and $K$ is the maximum number of within-subjects factor levels. In the remaining cases, the multivariate approach should be used.

If the experiment was conducted in different labs, $N$ is the **total** number of assessors participating in the study (e.g. 10 in lab A and 10 in lab B gives N = 20). *(p.28)*

### A4.4 Conduct the selected rmANOVA and optional post-hoc tests *(pp.28-31)*
- Omnibus tests of the effects of condition, audio material, and their interaction are conducted using the selected rmANOVA variant. Most software (SAS, SPSS, Statistica) requires the data in a **"one row per assessor" form**: the data table must contain only one row per assessor, with ratings of all combinations of condition and audio material as columns ("variables"). *(pp.28-29)*
- The two-factorial rmANOVA provides information about three effects. *(p.29)*

**1) Main effect of condition** *(p.29)*
- Usually the test of main interest. A significant effect rejects the null hypothesis that in the population the perceived audio quality is identical for all conditions (reference, coder 1 to k), i.e. there are differences between the perceived audio quality of the audio systems.
- **Effect size:** Cohen's [6] $d$ (or analogues) **cannot** be used because $d$ is not defined for a comparison of more than two means. In an ANOVA context report a **measure of association strength** — the proportion of variance accounted for by the effect, the same rationale as $R^2$. Most packages compute **partial $\eta^2$**, "computed as the ratio of the variance caused by the effect to the sum of the effect variance and the error (residual) variance." Alternatives discussed in Olejnik and Algina [31].
- **Locating the origins of a significant main effect: compute specific contrasts.** Worked example: to ask whether a new coder differed from three established systems, first compute the average rating of the three established coders for each assessor (averaging across audio material), giving per assessor (a) one rating for the new coder and (b) one average rating for the three other coders; compare these two values with a **paired-samples t-test**. **"Note that because the data are from a repeated-measures design, it is important to not use pooled variance [27]."** This contrast might also have been tested as a planned contrast instead of conducting the ANOVA. *(p.29)*
- **"It is generally recommended to use two-tailed tests of significance."** However, with an a priori hypothesis (e.g. the new coder should receive better ratings) a one-tailed rejection region is permissible. *(p.29)*

**General contrast formulation:** *(p.29)*
$$
\Psi_i = \sum_{j=1}^{a} c_j Y_{ij}, \qquad \sum_{j=1}^{a} c_j = 0
$$
Where: $Y_{ij}$ is the rating provided by assessor $i$ in condition $j$ (averaged across audio material); $a$ is the number of conditions considered in this contrast; $c_j$ are coefficients that must sum to zero. Then use a **one-sample t-test** to decide whether this contrast differs significantly from 0. Worked example: with the new coder at $j=1$ and three other coders at $j = 2\ldots4$, choosing $c_1 = -1$ and $c_2 = c_3 = c_4 = 1/3$ tests the hypothesis that the audio quality of the new coder differed from the three other coders. *(p.29)*

**Hochberg's [15] sequentially acceptive step-up Bonferroni procedure** (recommended when more than one post-hoc contrast is computed; controls the familywise Type I error rate while being more powerful than many alternatives [20]): *(pp.29-30)*
1. Compute the $m$ contrasts of interest and order them with respect to the p-value.
2. Examine the largest p-value. If it is smaller than $\alpha$, all hypotheses are rejected (all contrasts significant).
3. If not, that t-test was not significant; compare the next smaller p-value with $\alpha/2$. If smaller, this test and all tests with smaller p-value are significant.
4. If not, compare the next smaller p-value with $\alpha/3$, and so on.

Formal statement: *(p.30)*
$$
\text{if } p_i < \frac{\alpha}{m - i + 1} \text{ for } i = m, m-1, \ldots, 1 \text{ (p-values in descending order), then all tests with } i' \le i \text{ are significant}
$$

- **Full pairwise post-hoc comparison is NOT recommended.** With 7 coders and one reference (8 conditions), $8 \cdot 7/2 = 28$ pairwise tests can be computed, and "it will not be easy to extract meaningful information from this high number of tests." If all pairwise differences are tested, applying Hochberg to correct for multiple testing is of particular importance. **If there is evidence for a deviation from normality of the difference scores on which the paired-samples t-test is based, an alternative test not assuming normality is the sign test.** *(p.30)*
- **Discrepancy between omnibus and post-hoc:** following a significant main effect, it can be that none of the post-hoc contrasts or pairwise differences is significant [28], owing to the different statistical information used. **"Importantly, the rmANOVA is the more appropriate test. Therefore, a significant effect indicated by the ANOVA remains valid even if none of the post-hoc tests happens to be significant."** In this case conclude the audio systems differed in perceived sound quality; for the pairs showing the highest difference it is likely these would turn significant with a larger sample, but it must be concluded that in the present study none of the pairwise differences was significant. *(p.30)*
- **Non-significant main effect / transparency:** a non-significant main effect of condition indicates the differences between the systems under test were small. Due to finite sample size, **it cannot be concluded that in the population there are *no* differences [3]** — the population differences could be zero, or the effect sizes too small to detect. If an **a priori power analysis** was conducted (sample size selected to be sufficient to detect a specified effect size with a specified probability), it can be concluded that the data are evidence against an effect of the prespecified size. **"This finding could be taken as a definition of transparency of the coders."** If no a priori power analysis was conducted, caution is required when inferring transparency. **"A usual post-hoc approximate solution is to compare the p-value to [0.2] rather than 0.05. If the test remains non-significant, then this is a somewhat stronger indication of the absence of differences in the perceived audio quality of the conditions."** *(p.30)*

**2) Main effect of audio material** *(p.30)*
Same steps and rationale; provides information about systematic changes of the ratings depending on the test material. **"For most MUSHRA test scenarios, this effect should not be of high interest, because it is unrelated to a difference between audio systems."**

**3) Interaction of condition and audio material** *(pp.30-31)*
- A significant interaction means the effect of the audio system on perceived audio quality differs between test materials. Worked example: the reference and a coder could be rated equally for a highly compressed pop song where coding artifacts are masked by distortion components present in the material, while the coder could be rated inferior to the reference for a high dynamic range recording of a concert grand. **"This interaction will typically be of interest for a MUSHRA test, because it indicates that the difference between the audio systems depends on the test material."** *(pp.30-31)*
- Post-hoc exploration: test **simple main effects**, e.g. by conducting several separate one-factorial rmANOVAs with the within-subjects factor condition, one for each audio material. These show for which audio materials there was a significant effect of condition. **Again the Hochberg procedure should be used as a correction for multiple testing.** *(p.31)*
- All pairwise differences between combinations of condition and audio material could in principle be tested with separate paired-samples t-tests plus Hochberg, but the number explodes: **8 audio systems x 4 test materials = 24 combinations, corresponding to $24 \cdot 23/2 = 276$ pairwise tests. "Clearly, this approach cannot be recommended."** *(p.31)*

### A4.5 Extension to designs containing a between-subject (grouping) variable *(p.31)*
Applies when the test was conducted on different groups of assessors, e.g. two labs, or musicians versus non-musicians. **"If between-subjects factors were present, then it is of critical importance whether the number of assessors was identical in all groups (balanced design) or differed between groups (unbalanced design)."**

**Balanced design.** If the number of assessors was identical for all levels of the between-subjects factor, **or if the group sizes did not differ by more than 10%**, either the univariate approach with Huynh-Feldt correction or the multivariate approach can be used [21]. The design then contains within-subjects factors condition and audio material plus at least one between-subjects factor (e.g. lab); the rmANOVA provides an additional test of the between-subject effect(s) as well as the interactions between all within- and between-subjects effects. Example: a significant **condition x lab** interaction would mean the differences in perceived audio quality of the audio systems differed from lab A to lab B. **Assumption: exactly the same combinations of condition and audio material were presented to all groups. If different audio materials were presented in the two labs, the methods suggested here cannot be used; random effects models would be required [28], which are beyond the scope of the Attachment.** *(p.31)*

**Unbalanced design.** **If the group sizes differ by more than 10%, both the univariate and the multivariate approach no longer provide valid test results [21]. "Therefore, it is highly recommended to plan for equal group sizes."** If group sizes are unequal, two procedures are recommended: *(p.31)*
1. The **Improved General Approximation (IGA) Test [1]** — available as an SAS macro.
2. A specific variant of a **maximum-likelihood based mixed-model analysis [23]** — e.g. SAS PROC MIXED. Two options are important:
   - degrees of freedom computed according to the method by [19] (Kenward-Roger), in SAS via the `ddfm=KR` option in the `model` statement;
   - a **heterogeneous between-subject unstructured covariance structure (UN-H)** must be fitted [23], using the options `type=UN group=groupingvar` in the `repeated` statement, where `groupingvar` is the name of the variable containing the group classification.

## Attachment 5 (INFORMATIVE) - Requirements for optimum anchor behaviours *(p.34)*

"Key descriptors that any successful anchor shall be designed to optimally capture are given below. Optimal anchor behaviour shall:"
1. produce data that do not show substantial changes in the relative orderings of test systems when compared to data collected using the anchor specifications from Recommendation ITU-R BS.1534;
2. be associated with listener ratings that use a broader range of the rating scale for Test Systems when compared to data collected for the systems under test using the anchor specifications from ITU-R BS.1534;
3. be perceived by listeners as more similar to the test systems than anchors described by the specifications from ITU-R BS.1534. "This may, in turn, lead to longer anchor evaluation times";
4. enable sensitive comparison of mid-range test systems;
5. **produce differentiated scores between the low-range and mid-range anchor by approximately 20-30 points**;
6. produce quality impairments in the anchors that have limited content dependence.

## Consolidated Parameter Tables

### Signal preparation and presentation
| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Test sequence length | - | s | ~10 | <= 12 | 7 | Longer requires documented justification in the report |
| Minimum loop duration | - | ms | 500 | >= 500 | 8 | For looped playback |
| Loop fade in/out | - | ms | 5 | - | 8 | Raised-cosine envelope |
| System-switch fade in/out | - | ms | 5 | - | 9 | Raised-cosine envelope; cross-fade forbidden |
| Signals per trial | - | count | - | <= 12 | 8 | e.g. 9 systems + low anchor + mid anchor + hidden reference |
| Example trial size (Attachment 1) | - | count | 9 | - | 22 | Example instruction text |
| Excerpts per system | - | count | 1.5 x (number of systems) | >= 5 | 13 | Must be equal for each system under test |
| Alignment tone burst frequency | - | Hz | 1000 | - | 12 | Example value; alignment only, not replayed in test |
| Alignment tone burst duration | - | ms | 300 | - | 12 | Example value |
| Alignment tone burst level | - | dBFS | -18 | - | 12 | Example value; EBU R.68 alignment level |
| Permitted peak signal above alignment | - | dB | 9 | - | 13 | ITU-R BS.645 max permitted signal (sine wave) |

### Anchors
| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Low anchor cut-off | f_c | kHz | 3.5 | - | 7 | Mandatory; corresponds to ITU-T control-circuit bandwidth |
| Mid-range anchor cut-off | f_c | kHz | 7 | - | 7 | Mandatory; commentary-circuit bandwidth |
| Occasional-circuit bandwidth (reference point only) | - | kHz | 10 | - | 7 | Named as a bandwidth family, not a mandatory anchor |
| Low anchor max pass band ripple | - | dB | ±0.1 | - | 7 | 3.5 kHz filter mask |
| Low anchor min attenuation at 4 kHz | - | dB | 25 | >= 25 | 7 | 3.5 kHz filter mask |
| Low anchor min attenuation at 4.5 kHz | - | dB | 50 | >= 50 | 7 | 3.5 kHz filter mask |
| Target low-vs-mid anchor score separation | - | MUSHRA points | 20-30 | - | 34 | Attachment 5 optimum anchor behaviour |

### Listening conditions
| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Reference sound pressure level | L_ref | dBA | 78 | ±0.25 | 13 | IEC/A-weighted, slow; per reproduction channel |
| Alignment signal level | - | dBu0s | 0 | - | 13 | ITU-R BS.645; -18 dB below digital clipping (EBU R.68) |
| Permitted subject level adjustment | - | dB | 0 | ±4 | 13 | Within a session only; not within one item |

### Grading scale
| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| CQS score | - | MUSHRA points | - | 0-100 | 9, 14 | Continuous; linear conversion from score-sheet length |
| CQS physical scale length | - | cm | 10 | >= 10 | 9 | "typically 10 cm long or more" |
| Bad interval | - | points | - | 0-20 | 9 | |
| Poor interval | - | points | - | 20-40 | 9 | |
| Fair interval | - | points | - | 40-60 | 9 | |
| Good interval | - | points | - | 60-80 | 9 | |
| Excellent interval | - | points | - | 80-100 | 9 | |
| Expected valid score span | - | points | - | 20-80 | 3 | Ideal range with appropriate content |
| Invalid-test warning band | - | points | - | 80-100 | 3 | Majority of conditions here may mean the test is invalid |

### Assessors and screening
| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Sufficient panel size | - | assessors | 20 | - | 6 | "no more than 20 ... often sufficient" under tight control |
| Hidden-reference exclusion threshold (score) | - | points | 90 | - | 5 | Rating hidden reference below 90 |
| Hidden-reference exclusion threshold (item fraction) | - | % | 15 | > 15 | 5 | Exclude if more than 15% of test items rated below 90 |
| Mid-anchor exclusion threshold (score) | - | points | 90 | - | 5 | Rating mid anchor above 90 |
| Mid-anchor exclusion threshold (item fraction) | - | % | 15 | > 15 | 5 | Exclude if more than 15% of items rated above 90 |
| Item-invalidation guard | - | % of assessors | 25 | > 25 | 5 | If more than 25% of assessors rate mid anchor above 90, do not exclude on that item |
| Outlier fence multiplier | - | - | 1.5 | - | 6 | 1.5 x IQR beyond Q1 / Q3 |

### Statistics
| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Significance level | alpha | - | 0.05 | - | 15, 20 | 95% significance recommended; "no correct level" but 0.05 traditional |
| Bootstrap / permutation iterations | - | count | 10000 | - | 24 | Attachment 3 normative procedure |
| Permutation significance count threshold | - | count | 500 | < 500 | 24 | 500/10000 = 0.05 |
| Multimodality coefficient | b | - | - | 0-1 | 14 | b > 5/9 indicates multi-modality |
| Heterogeneity of variance tolerance | - | ratio | - | <= 4 | 17 | Rule of thumb: variances may vary maximally by a factor of four |
| Skewness warning threshold | - | - | 0.5 | > 0.5 | 27 | Preliminary rule of thumb, per experimental condition, on residuals |
| Skewness severe-deviation threshold | - | - | 1.0 | > 1.0 | 27 | Consider non-parametric alternatives |
| Huynh-Feldt epsilon selection threshold | epsilon-tilde | - | 0.85 | > 0.85 | 28 | Use univariate approach if epsilon > 0.85 AND N < K+30 |
| Sample-size selection bound | - | assessors | - | N < K+30 | 28 | K = max within-subjects factor levels |
| Group-size imbalance tolerance | - | % | 10 | <= 10 | 31 | Above 10% both univariate and multivariate approaches are invalid |
| Transparency post-hoc p threshold | - | - | 0.2 | - | 30 | Compare p to 0.2 rather than 0.05 when no a priori power analysis |
| Minimum assessors for multivariate approach | N | assessors | - | >= K | 28 | Must have at least as many assessors as factor levels |
| Minimum N for valid univariate + Huynh-Feldt (normal data) | N | assessors | 3 | >= 3 | 28 | Valid Type I error rates even at N = 3 |

## Figures of Interest
- **Fig. 1 (p.9):** The Continuous Quality Scale, 0-100, five equal intervals labelled Bad / Poor / Fair / Good / Excellent from bottom to top.
- **Fig. 2 (p.10):** Example computer display for a MUSHRA test: Ref button plus 8 numbered stimulus buttons, vertical sliders with numeric readouts, waveform view with loop A / loop B markers, transport controls, next Test / comment buttons.
- **Fig. 3 (p.22):** Example training-phase (Part A) user interface: an items-by-conditions matrix (11 programme items x test1-test12 in three groups) with a reference column.
- **Fig. 4 (p.23):** Example blind-grading-phase user interface (same layout as Fig. 2).

## Methods and Implementation Details (checklist form)
- Present all stimuli of a trial simultaneously with free, near-instantaneous switching; grade only after ranking. *(p.8)*
- Enable only the slider of the currently-audible stimulus; disable all others. *(pp.9, 24)*
- Make the currently-selected stimulus visually obvious; do not rely on colour alone. *(p.24)*
- Randomize presentation order both within and between sessions. *(p.4)*
- Include a mandatory training phase before the graded phase; discard all training grades. *(pp.7, 22)*
- Loop with 500 ms minimum and 5 ms raised-cosine fades; never cross-fade between systems. *(pp.8-9)*
- Normalize excerpt loudness by expert consensus before recording; use a fixed gain within a trial. *(p.12)*
- Convert score-sheet positions linearly to 0-100. *(p.14)*
- Apply post-screening exclusions (hidden reference and mid anchor rules) before aggregation. *(p.5)*
- Compute median and IQR per condition; visualize with box plots, histograms, and Q-Q plots before any inference. *(pp.14, 19-20)*
- For two-sample comparisons, use the 10 000-iteration permutation bootstrap of Attachment 3. *(p.24)*
- For many conditions, use rmANOVA (univariate + Huynh-Feldt, or multivariate per the Algina-Keselman rule) with Hochberg correction for post-hoc contrasts. *(pp.28-30)*
- Record video and audio of the test sessions to diagnose anomalous grades. *(p.10)*
- Report everything in the §10.2 checklist, including which post-screening methods were used and generation code for any non-standard anchor. *(pp.18-19)*

## Limitations and Cautions Acknowledged
- The result is "in principle, only valid for precisely that group of experienced listeners actually involved in the test." *(p.6)*
- Post-screening may clarify tendencies but caution is needed given variability of assessor sensitivity to different artefacts. *(p.6)*
- Additional anchors "should not be used for rescaling results between different tests." *(p.7)*
- Sufficient research has not been done to indicate whether a separate rating for stereophonic image quality distinct from basic audio quality is warranted. *(p.11)*
- Absolute mean grades alone are not a substitute for statistical analysis; observations are not independent. *(p.20)*
- "The current state of research does not permit to formulate precise rules concerning the acceptable degree of deviation from normality" for rmANOVA. *(p.26)*
- It is not yet clear in which situations resampling techniques solve the non-normality problem [38]. *(p.27)*
- The Friedman test cannot analyse the audio system x audio material interaction. *(p.27)*
- Sphericity "is violated for virtually all empirical data sets [21]." *(p.28)*
- Non-significance never proves the absence of a difference [3]; only an a priori power analysis licenses a transparency claim. *(p.30)*
- Random effects models are needed when different audio materials are presented in different labs; these are beyond the Attachment's scope. *(p.31)*
- The 10 s stimulus limit "might not be appropriate in some circumstances," e.g. a long slow-moving sound trajectory. *(p.7)*

## Arguments Against Prior Work
- **ITU-R BS.1116** is intended for small impairments and "is poor at discriminating between small differences in quality at the bottom of the scale"; its triple-stimulus design compares each system only with the reference, so differences between two impaired systems "may be lost." *(pp.1, 3, 8)*
- **ITU-R BS.1284** gives no absolute scoring for intermediate audio quality, or is dedicated only to the high-quality range. *(pp.1, 3)*
- **ITU-T P.800 / P.810 / P.830** are focused on speech in a telephone environment; EBU Project Group B/AIM experiments with broadcast material found none of them fulfils the requirement for an absolute scale, comparison with a reference signal, and small confidence intervals with a reasonable number of assessors at the same time. *(pp.1, 3)*
- **Misuse of the MUSHRA name** for tests not using reference and anchors. *(p.1)*
- **Multiple pairwise t-tests** instead of an omnibus test: inflate familywise Type I error (0.40 for 10 tests at alpha = 0.05), use redundant information, and are less powerful than rmANOVA. *(pp.25-26)*
- **Greenhouse-Geisser correction** tends to produce conservative tests; Huynh-Feldt is preferred. *(p.28)*
- **Aggregating ratings across audio materials** is not advisable because of potential interactions. *(p.25)*
- **Full pairwise post-hoc testing** of condition x material combinations (276 tests for 8 systems x 4 materials) "cannot be recommended." *(p.31)*

## Design Rationale
- **Multi-stimulus over triple-stimulus:** for medium/large impairments detection is easy but relative-annoyance grading is hard, and direct comparison between impaired signals is what gives resolution. *(p.8)*
- **Hidden reference:** provides a per-assessor calibration point and the basis of the post-screening exclusion rule. *(pp.5, 6)*
- **Mandatory anchors at 3.5 kHz and 7 kHz:** stabilize use of the rating scale (considering e)), tie the scale to well-known broadcast circuit bandwidths, and provide a second post-screening criterion. *(pp.1, 5, 7)*
- **Short (~10 s) excerpts:** avoid primacy/recency effects, listener fatigue, and within-signal spectral/temporal heterogeneity. *(p.7)*
- **No cross-fades, fixed 5 ms raised-cosine fades:** prevent assessors using switching-transient spectral coloration cues to identify signals. *(p.9)*
- **Only the current stimulus's slider enabled:** prevents mis-assignment of a score to the wrong signal. *(p.24)*
- **One attribute per trial:** multiple simultaneous attribute questions overburden assessors and degrade all answers. *(p.10)*
- **Median plus IQR as the primary summary:** robust to small samples, non-normality, and outliers, which matters most for cross-lab comparability. *(p.15)*
- **Permutation/bootstrap significance:** measures probability from the actual data distribution rather than an assumed shape. *(p.15)*

## Testable Properties
- CQS scores must lie in [0, 100], with 0 the bottom of "bad" and 100 the top of "excellent". *(pp.9, 14, 23)*
- At least one stimulus in every trial must be gradeable at 100, since the unprocessed reference is present. *(p.23)*
- A valid test has the majority of condition scores in the 20-80 band; a majority in 80-100 signals a probably invalid test. *(p.3)*
- Every trial must contain a hidden reference, a 3.5 kHz low anchor, and a 7 kHz mid anchor. *(pp.6-7)*
- Trial stimulus count must be <= 12. *(p.8)*
- Excerpt count must be equal for each system and >= 5, nominally 1.5 x number of systems. *(p.13)*
- The 3.5 kHz anchor filter must meet: ripple <= ±0.1 dB, >= 25 dB attenuation at 4 kHz, >= 50 dB at 4.5 kHz. *(p.7)*
- An assessor rating the hidden reference below 90 on more than 15% of items must be excluded. *(p.5)*
- An assessor rating the mid anchor above 90 on more than 15% of items must be excluded, unless more than 25% of assessors do so on that item. *(p.5)*
- Grades outside [Q1 - 1.5 IQR, Q3 + 1.5 IQR] are outliers requiring investigation; removal requires a demonstrated error and a report note. *(p.6)*
- Multimodality coefficient b > 5/9 indicates a multi-modal distribution. *(p.14)*
- Residual skewness > 0.5 in any condition flags a normality problem; > 1.0 indicates severe deviation. *(p.27)*
- Heterogeneity of variance across levels should not exceed a factor of four. *(p.17)*
- Use the univariate rmANOVA with Huynh-Feldt correction iff epsilon-tilde > 0.85 and N < K + 30. *(p.28)*
- The multivariate approach requires N >= K. *(p.28)*
- Group sizes in a between-subjects design must not differ by more than 10%. *(p.31)*
- Playback must be calibrated to L_ref = 78 ± 0.25 dBA per channel, with subject adjustment limited to ±4 dB and none within an item. *(pp.13-14)*
- All assessors in a session must use the same transducer type. *(p.13)*
- Loop duration >= 500 ms, all fades 5 ms raised-cosine, no cross-fades. *(pp.8-9)*
- A low anchor and mid anchor should differ by roughly 20-30 MUSHRA points. *(p.34)*

## Relevance to Project
This is the reference protocol for any subjective listening evaluation of a speech synthesizer's output quality in the intermediate-quality band, which is where a formant synthesizer sits relative to natural-speech reference recordings.

Direct applications:
- **Evaluation harness design.** The whole §5.3 / Attachment 2 specification is an implementation spec for a browser-based listening-test tool: multi-stimulus panel, per-stimulus slider, only-current-slider-enabled, no cross-fade switching, 500 ms minimum loop, 5 ms raised-cosine fades, loop region markers.
- **Anchor construction for a synthesizer test.** The 3.5 kHz and 7 kHz low-pass anchors are trivially producible from a natural-speech reference with the stated filter mask, and they are what makes cross-test score comparison legitimate.
- **Validity self-check.** The 20-80 expected score band tells you whether the chosen test material is critical enough to discriminate synthesizer variants; scores bunched at 80-100 mean the material was not stressing the systems.
- **Screening rules.** The hidden-reference and mid-anchor exclusion thresholds give a mechanical, defensible rule for dropping unreliable raters, which matters if raters are recruited online rather than from a trained panel.
- **Statistics.** The Attachment 3 permutation bootstrap (10 000 iterations, without-replacement pooled resampling) is directly implementable and avoids the normality assumptions that synthesizer rating data will usually violate. The rmANOVA path with Hochberg correction covers the many-variants case.
- **Reporting.** The §10.2 checklist is a ready-made template for what a synthesizer evaluation writeup must contain to be reproducible.

Caution: the scale asks for **basic audio quality relative to a reference**, which is a coding-artefact framing. Speech synthesis evaluation often wants naturalness, intelligibility, or preference instead, and those are separate attributes; §6 explicitly permits experimenter-defined attributes but insists on **one attribute per trial** and that basic audio quality be evaluated first if several are judged. A synthesizer with no natural-speech "reference" for the same utterance sits awkwardly with the hidden-reference requirement, which is the main adaptation problem.

## Open Questions
- [ ] For a text-to-speech system there is no unprocessed reference rendering of the same waveform. Does the hidden reference become a natural human recording of the same sentence, and does that break the "one or more excerpts must be given 100" instruction?
- [ ] Do the 3.5 kHz / 7 kHz bandwidth anchors span a useful range for formant-synthesis artefacts, or does Attachment 5's criterion 3 (anchors perceived as more similar to the test systems) call for a synthesis-specific anchor?
- [ ] What replaces the ">= 5 excerpts, 1.5 x systems" rule when the "excerpts" are synthesized sentences from a phonetically balanced corpus?
- [ ] Is the 20-assessor guidance realistic for an open-source project, and what does the a priori power analysis (Cohen's d, alpha, 1-beta) actually demand for the effect sizes expected between synthesizer versions?

## Related Work Worth Reading
- Soulodre, G. A., & Lavoie, M. C. (1999). Subjective evaluation of large and small impairments in audio codecs. AES 17th International Conference. [Reference 4 — the empirical justification for MUSHRA over BS.1116.]
- EBU (2000a). MUSHRA - Method for Subjective Listening Tests of Intermediate Audio Quality. Draft EBU Recommendation B/AIM 022 (Rev.8)/BMC 607rev. [Reference 2 — the origin document.]
- Bech, S., & Zacharov, N. (2007). Perceptual audio evaluation: Theory, method and application. Wiley. [Reference 13 — the standard textbook for this whole area.]
- Maxwell, S. E., & Delaney, H. D. (2004). Designing experiments and analyzing data: A model comparison perspective, 2nd ed. [Attachment 4 reference 28 — the repeated-measures framework MUSHRA analysis assumes.]
- Hochberg, Y. (1988). A sharper Bonferroni procedure for multiple tests of significance. Biometrika 75(4), 800-802. [Attachment 4 reference 15 — the recommended multiple-comparison correction.]
- Report ITU-R BS.2300 — the eGauge assessor-expertise method referenced for pre-screening.
- Recommendation ITU-R BS.1116 — listening conditions (§§7-8) are incorporated by reference into MUSHRA.

## Collection Cross-References

### Conceptual Links (not citation-based)
- [WORLD: A Vocoder-Based High-Quality Speech Synthesis System for Real-Time Applications](../Morise_2016_WORLDVocoder-BasedHigh-QualitySpeech/notes.md) - Morise's listening test is a direct application of this recommendation's MUSHRA methodology (hidden reference, anchor conditions, 0-100 scale); it is a concrete worked example of the GUI and trial structure (per-subject "Experiment N/20" runs, 95% CI reporting) this standard specifies.

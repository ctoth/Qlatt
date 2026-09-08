---
title: "Methods for Subjective Determination of Transmission Quality (ITU-T Recommendation P.800)"
authors: "ITU-T Study Group 12 (1993-1996)"
year: 1996
venue: "ITU-T Recommendation P.800 (08/96), Series P: Telephone Transmission Quality; previously CCITT Recommendation P.80"
doi_url: "https://www.itu.int/rec/T-REC-P.800-199608-I/en"
pages: "28 printed pages (37 PDF pages)"
publisher: "International Telecommunication Union, Geneva"
note: "Amended at Helsinki, 1993; revised in Geneva, 1996. Approved under WTSC Resolution No. 1 on 30 August 1996."
---

# Methods for Subjective Determination of Transmission Quality (ITU-T P.800)

## One-Sentence Summary
P.800 is the normative protocol document that defines how to run subjective listening and conversation tests of speech transmission quality, including the five-point Absolute Category Rating (ACR) scale that produces the Mean Opinion Score (MOS), plus the DCR/DMOS, CCR/CMOS, quantal-response detectability and threshold methods, and the exact acoustic, level, listener-panel, material and statistical conditions required for the resulting numbers to be valid and comparable across laboratories. *(pp. 1-28)*

## Problem Addressed
Digital transmission and low-bit-rate coding introduced impairments whose perceptual effect cannot be predicted from electrical measurements alone. Administrations therefore needed a single agreed subjective-test protocol so that opinion scores obtained in different laboratories, on different material and in different languages, would be mutually comparable and could feed the equipment impairment factors (eifs) and quantization distortion units (qdus) of Recommendation G.113. *(p. vi, p. 1)*

## Key Contributions
- Defines the five-point ACR listening-quality opinion scale (Excellent 5 ... Bad 1) whose arithmetic mean is the MOS. *(p. 18)*
- Defines the companion ACR scales: listening-effort, loudness-preference, conversation-opinion, difficulty, and their category labels and integer values. *(pp. 11-12, 18-19)*
- Defines DCR (degradation, five-point, DMOS) for small impairments and CCR (comparison, seven-point −3..+3, CMOS) for systems that may improve as well as degrade quality. *(pp. 22-25)*
- Fixes the physical test conditions: room volume, reverberation time, noise floor (NC25/NR25), Hoth room-noise spectrum table, vehicle-noise spectra, speech levels, sidetone, listening level, and calibration. *(pp. 5-18)*
- Fixes the speech-material rules: short meaningful unrelated sentences, 2-3 s each, pairs separated by silence, multiple talkers of both sexes, per-talker level equalization. *(pp. 14-16)*
- Fixes the panel and design rules: naive (non-expert) listeners, minimum panel sizes, replication, randomization, and reference conditions (MNRU Q values and IRS/modulated-noise anchors) that must be included in every experiment. *(pp. 17-20)*
- Specifies the statistical treatment: means, standard deviations, confidence limits, analysis of variance, and the requirement to report the reference-condition results alongside the test-condition results. *(pp. 13, 20, 23-24)*
- Annex C gives the quantal-response (detectability threshold) method; Annex F gives the threshold method equating a system to an MNRU Q value. *(pp. 20-27)*

## Ingestion Scope
Full document read: PDF pages 0-36, i.e. cover, front matter (i-vi), body pages 1-28 including Annexes A-F and the Bibliography.

## Structure of the Recommendation
| Clause | Content | Printed page |
|--------|---------|--------------|
| 1 | Scope | 1 |
| 2 | References | 1 |
| 3 | Definitions | 2 |
| 4 | Abbreviations | 3 |
| 5 | Conventions | 3 |
| 6.1 | Conversation-opinion tests | 3 |
| 6.2 | Listening-opinion tests | 3 |
| 6.3 | Interview and survey tests | 5 |
| 6.4 | Other tests (SIBYL) | 5 |
| Annex A | Conversation-opinion tests | 5 |
| Annex B | Listening tests - Absolute Category Rating (ACR) | 14 |
| Annex C | Quantal-Response Detectability Tests | 20 |
| Annex D | Degradation Category Rating (DCR) method | 22 |
| Annex E | Comparison Category Rating (CCR) method | 23 |
| Annex F | Threshold method vs a reference system | 25 |
| — | Bibliography | 28 |

## Definitions *(p. 2)*
- **dBov** — dB relative to the overload point of a digital system. *(p. 2)*
- **Q** — the ratio, in dB, of speech power to modulated noise power in the Modulated Noise Reference Unit (MNRU), as described in Recommendation P.810. *(p. 2)*

## Abbreviations *(p. 3)*
ACR Absolute Category Rating; ADPCM Adaptive Differential Pulse Code Modulation; BER Bit Error Rate; CCR Comparison Category Rating; CMOS Comparison Mean Opinion Score; DCR Degradation Category Rating; DMOS Degradation Mean Opinion Score; FER Frame Erasure Rate; IRS Intermediate Reference System (P.48); MNRU Modulated Noise Reference Unit (P.810); MOS Mean Opinion Score; PCM Pulse Code Modulation; SNR Signal-to-Noise Ratio.

## Scope and Exclusions *(p. 1)*
Explicitly **out of scope**: determination of Reference and Relative Equivalents (Handbook on Telephonometry, 1993); Loudness Ratings (P.78); Articulation Ratings / A.E.N. values (Handbook); and diagnostic/specialised tests such as the Diagnostic Rhyme Test. *(p. 1)*

The methods are intended to be applicable whatever the degradation, with these degradations named explicitly: loss (often frequency dependent); circuit noise; transmission errors (random bit errors and erased frames as in mobile systems); environmental noise; sidetone; talker echo; non-linear distortion including low bit-rate encoding; propagation time; harmful effects of voice-operated devices; distortions of the time scale arising from packet switching; and time-varying degradations of the channel including those arising in loudspeaking sets. Combinations of two or more factors must also be catered for. *(p. 1)*

Application-specific companions: P.830 (digital speech codecs), P.84 (DCME/PCME), P.85 (speech output devices). *(p. 1)*

## Method Selection Guidance *(pp. 3-4)*
- **ACR (Annex B)** is *the* recommended listening-only method. Category ratings are applied to short groups of unrelated sentences passed through standard processes and the processes under test. Validated by cross-laboratory consistency in the work leading to G.726 32 kbit/s ADPCM, G.728, G.729 and G.722. *(pp. 3-4)*
- **Quantal-response (Annex C)** for threshold values and their associated probabilities, e.g. the level above which single-frequency interference has a given probability of being objectionable or detectable, or the probability that crosstalk in a given range of levels is intelligible. *(p. 4)*
- **DCR (Annex D)** compares against a high-quality fixed reference and rates degradation from "Inaudible" to "Very annoying" on a five-point scale. Suitable when the impairment (especially a digital impairment) is **small**; useful for comparing similar digital speech-processing algorithms and for system optimization, once Annexes A/B have shown the worst-case connection is within acceptable limits. *(p. 4)*
- **CCR (Annex E)** is a DCR variant on a "Much Better" to "Much Worse" scale, particularly suitable for systems that may **improve** the input speech (e.g. noise-cancellation systems). *(p. 4)*
- **Threshold method (Annex F)**, also for system optimization, equates the system under test to a reference-condition value (Q for digital processes) by direct comparison with an MNRU reference. *(p. 4)*
- Listening-only results transfer to conversational prediction **only with reservations**, and only if talking degradations (sidetone, echo) and conversation degradations (propagation time, mutilation of speech by voice-operated devices) are separately accounted for. *(p. 4)*
- **Interview/service-observation tests (6.3, P.82)** require at least **100 interviews per condition** for high precision; they give a global appreciation of real-environment performance but little control over the connections tested. *(p. 5)*
- **SIBYL (6.4)** passes a small proportion of a volunteer's ordinary calls through modified-quality arrangements and collects a vote by dialled digit, preserving privacy and recording all results by controlling computer. *(p. 5)*

---

# Annex A - Conversation-opinion tests

## A.1.1.1 Test cabinets *(p. 5)*
- Two subjects, separate sound-proof cabinets, near the point from which the experiment is controlled. *(p. 5)*
- Room volume **not less than 20 m³** with reverberation time **< 500 ms** (normally **200-300 ms**) for handheld/handset or headset systems. *(p. 5)*
- Room volume **not less than 30 m³** for handsfree systems; extra care if reverberation time is itself an experimental variable. *(p. 5)*
- Internal dimensions chosen to minimise standing-wave patterns; **typical dimension ratio 5:4:3**. *(p. 5)*
- Construction must attenuate outside noise enough to meet the A.1.1.2.1 noise-floor requirement. Cabinets are favourably decorated to recreate a natural environment. *(p. 5)*

## A.1.1.2.1 Noise floor *(p. 6)*
Ambient noise (with no deliberately introduced environmental noise) kept as low as possible; practical upper limit **NC25 or NR25** (ISO 1996). These approximate the noise level in homes (sleeping areas), hospitals and libraries. *(p. 6)*

## A.1.1.2.2 Environmental noise *(p. 6)*
- Fed in with the required spectrum (e.g. Hoth spectrum for typical room noise) at the required level (e.g. **50 dBA**), measured with a Precision Sound Level Meter conforming to IEC 651 using **"A" weighting** and the **"fast"** meter characteristic. *(p. 6)*
- If conditions in one experiment need different room-noise levels, transitions must not be obvious. Ideally change noise only when subjects are out of the rooms. Otherwise change gradually **at a rate not exceeding 4 dB per second**, when no experimental conversation is in progress and while the subjects' attention is otherwise occupied. *(p. 6)*
- Fluctuating noise (office/traffic recordings) is allowed provided the statistical characteristics are stable when averaged over a reasonably short period such as **one minute**. *(p. 6)*
- Noise level and spectrum must be measured **at least twice**: beginning and end of the experiment. Significant variation between the two must be assessed by the experimenter as it may invalidate the experiment. *(p. 6)*
- Loudspeakers and amplifiers must faithfully reproduce the required noise. *(p. 6)*

### Table A.1 - Room noise spectrum (Hoth), adjusted to read 50 dBA *(p. 7)*
Spectrum is level-independent: for 40 dBA subtract 10 dB from every band. Tolerance **±3 dB** on all entries. Electrical input (e.g. white noise) band-limited to 1/3-octave bands centred on ISO 266 preferred frequencies **100 Hz to 8000 Hz**, band edges per IEC 1260. Note 2 warns that acoustical room noise below 100 Hz is hard to control (cabinet dimensions, poor attenuation, air-conditioning), so choose a cabinet that minimises unwanted low-frequency SPL.

| Frequency (Hz) | Spectrum density (dB SPL/Hz) | Bandwidth 10 log₁₀ Δf (dB) | Total power in 1/3-octave band (dB SPL) |
|---|---|---|---|
| 100 | 32.4 | 13.5 | 45.9 |
| 125 | 30.9 | 14.7 | 45.4 |
| 160 | 29.1 | 15.7 | 44.9 |
| 200 | 27.6 | 16.5 | 44.1 |
| 250 | 26.0 | 17.6 | 43.6 |
| 315 | 24.4 | 18.7 | 43.1 |
| 400 | 22.7 | 19.7 | 42.3 |
| 500 | 21.1 | 20.6 | 41.7 |
| 630 | 19.5 | 21.7 | 41.2 |
| 800 | 17.8 | 22.7 | 40.4 |
| 1000 | 16.2 | 23.5 | 39.7 |
| 1250 | 14.6 | 24.7 | 39.3 |
| 1600 | 12.9 | 25.7 | 38.7 |
| 2000 | 11.3 | 26.5 | 37.8 |
| 2500 | 9.6 | 27.6 | 37.2 |
| 3150 | 7.8 | 28.7 | 36.5 |
| 4000 | 5.4 | 29.7 | 34.8 |
| 5000 | 2.6 | 30.6 | 33.2 |
| 6300 | −1.3 | 31.7 | 30.4 |
| 8000 | −6.6 | 32.7 | 26.0 |

### Table A.2 - Internal vehicle noise spectra (provisional) *(p. 8)*
Two level-independent spectra, moving and stationary vehicle; tolerance **±3 dB**. Table A.2 is explicitly flagged provisional, with more detailed specifications under study.

| Frequency (Hz) | Density moving (dB SPL/Hz) | Density stationary (dB SPL/Hz) | Bandwidth (dB) | Band power moving (dB SPL) | Band power stationary (dB SPL) |
|---|---|---|---|---|---|
| 63 | 72.3 | 58.3 | 11.7 | 84.0 | 70.0 |
| 80 | 69.3 | 55.0 | 12.7 | 82.0 | 66.7 |
| 100 | 66.5 | 49.8 | 13.5 | 80.0 | 63.3 |
| 125 | 63.3 | 45.1 | 14.7 | 78.0 | 60.0 |
| 160 | 60.3 | 42.0 | 15.7 | 76.0 | 56.7 |
| 200 | 57.5 | 36.8 | 16.5 | 74.0 | 53.3 |
| 250 | 54.4 | 34.7 | 17.6 | 72.0 | 52.3 |
| 315 | 51.3 | 32.6 | 18.7 | 70.0 | 51.3 |
| 400 | 48.3 | 30.6 | 19.7 | 68.0 | 50.3 |
| 500 | 45.4 | 28.7 | 20.6 | 66.0 | 49.3 |
| 630 | 42.3 | 26.6 | 21.7 | 64.0 | 48.3 |
| 800 | 39.3 | 24.6 | 22.7 | 62.0 | 47.3 |
| 1000 | 36.5 | 22.8 | 23.5 | 60.0 | 46.3 |
| 1250 | 33.3 | 20.6 | 24.7 | 58.0 | 45.3 |
| 1600 | 30.3 | 18.6 | 25.7 | 56.0 | 44.3 |
| 2000 | 27.5 | 16.8 | 26.5 | 54.0 | 43.3 |
| 2500 | 24.4 | 14.7 | 27.6 | 52.0 | 42.3 |
| 3150 | 21.3 | 12.6 | 28.7 | 50.0 | 41.3 |
| 4000 | 18.3 | 10.6 | 29.7 | 48.0 | 40.3 |
| 5000 | 15.4 | 8.7 | 30.6 | 46.0 | 39.3 |
| 6300 | 12.3 | 6.6 | 31.7 | 44.0 | 38.3 |
| 8000 | 9.3 | 4.6 | 32.7 | 42.0 | 37.3 |

Table A.3 (p. 9) gives computed unweighted SPLs for various vehicle speeds over ISO 1/3-octave bands centred 63 Hz to 8000 Hz.

## Figures of Interest (Annex A)
- **Fig A.1 (p. 8):** Room noise spectral density curve, dB SPL/Hz vs frequency 0.1-10 kHz, falling from ~32 dB SPL/Hz at 100 Hz to ~−7 dB SPL/Hz at 8 kHz.
- **Fig A.2 a) and b) (p. 9-10 region):** Internal vehicle noise spectrum density, moving and stationary.

### Table A.3 - Computed unweighted SPL of vehicle spectra *(p. 9)*

| Spectrum | Condition | Unweighted SPL (dB SPL) |
|---|---|---|
| Moving | 30 km/h | 80 |
| Moving | 80 km/h | 85 |
| Moving | 110 km/h | 90 |
| Stationary | — | 75 |

Notes to Tables A.2/A.3 *(p. 9)*:
1. Values apply to typical vehicles; adjust downwards for luxury vehicles and upwards for noisier vehicles.
2. Because high SPLs at low frequency are hard to generate, and normal speech has no apparent energy below about 63 Hz where the ear is also comparatively insensitive, it is probably advisable to restrict the recommended noise spectrum to frequencies above 63 Hz. Low- and medium-frequency vibrations nonetheless have physiological and psychological effects that should be studied in their own right.
3. Electrical input (e.g. white noise) band-limited to 1/3-octave bands centred on ISO 266 preferred frequencies **63 Hz to 8000 Hz**, band edges per IEC 1260.
4. Acoustical room noise below 63 Hz is hard to control (cabinet dimensions, poor attenuation, air-conditioning); select a cabinet that minimises unwanted low-frequency SPL.

## A.1.1.3 Noise measurement position *(pp. 9-10)*
SPL measurement in the test cabinets shall be made with:
1. Furniture in position. *(p. 10)*
2. No subject or test personnel present. *(p. 10)*
3. SPL measured at a **vertical distance of 740 mm above the centre of the seat** of the subject's chair, with a meter conforming to Recommendation P.54, using **"A" weighting**. *(p. 10)*
4. Environmental-noise spectrum measured in **one-third octaves** centred at ISO 266 preferred frequencies, staying within the specified tolerances, e.g. **±3 dB for Hoth noise**. *(p. 10)*
5. In rooms where more than one subject is tested, the difference in dBA across all subject positions shall not vary by more than **±2 dB**. *(p. 10)*
- NOTE: suggested minimum distance between each loudspeaker and the measurement position is **1.5 m**. *(p. 10)*

## A.1.2 Establishing the connection *(p. 10)*
Consider telephone sets, initial call set-up, and laboratory representation of telephone connections. The **sensitivity/frequency characteristic of the connection must be measured at least twice**, at the beginning and end of the experiment; significant variation between them may cast doubt on experiment validity. *(p. 10)*

## A.1.3 Monitoring *(p. 10)*
Three commonly used forms:
- **Intercommunication system** — essential so subject and experimenter can communicate.
- **Visual monitoring** — for safety, and to observe subject peculiarities such as how they hold the handset.
- **Tape recordings and recording system** — yields call duration, speech voltage, speech activity.

## A.2 Experiment design *(p. 10)*
Suitable designs: Latin Squares, Youden Squares, Balanced Incomplete Blocks, Randomization with Replication, and n x n graeco-latin square designs. The experimenter chooses based on the number of test conditions, accuracy required, and ability to draw sound conclusions. *(p. 10)*

## A.3 Conversation task *(pp. 10-11)*
Conversations must be **purposeful**, giving subjects full opportunity to exploit the transmission capabilities of the test circuit. General rule: every conversation should have a **natural beginning and a natural ending**; unless absolutely necessary, a conversation must never be terminated in the middle of the task (exception: Simplified Conversation Tests). *(pp. 10-11)*

## A.4.1 Eligibility of subjects (conversation tests) *(p. 11)*
Subjects chosen **at random from the normal telephone-using population**, with the provisos that:
- a) they have **not** been directly involved in work connected with assessment of telephone circuit performance, or related work such as **speech coding**; and *(p. 11)*
- b) they have **not participated in any subjective test whatever for at least the previous six months**, and **not in a conversation test for at least one year**. *(p. 11)*

If the available population is unduly restricted, allowance must be made for that in drawing conclusions. No steps are taken to balance male/female numbers unless the design requires it. Subjects are **arbitrarily paired** prior to the test and **remain paired for its duration**. *(p. 11)*

## A.4.2.1 Conversation-opinion scale *(p. 11)*
Prompt seen by the subject: **"Opinion of the connection you have just been using"**. A category rating obtained from each subject at the end of each conversation.

| Category label | Score |
|---|---|
| Excellent | 5 |
| Good | 4 |
| Fair | 3 |
| Poor | 2 |
| Bad | 1 |

All further statistical processing is performed on these numbers. The arithmetic mean of any collection of these scores is the **mean conversation-opinion score, symbol MOS_C (MOSc)**. *(p. 11)*

Layout and wording of the scale as seen by subjects is very important and should follow the standard arrived at through years of experience; equivalent wording should be used per language, which may cause small variations from the English text. *(p. 11)*

**Historical-comparability rule** *(p. 12)*: in the past, the equivalences Excellent = 4, Good = 3, Fair = 2, Poor = 1, Bad = 0 were often used. Anyone using results from earlier experiments **must increase those mean scores by one** to be comparable with scores obtained under the current numbering; otherwise the numerical processing is unchanged.

## A.4.2.2 Difficulty scale *(p. 12)*
Binary response obtained from each subject at the end of each conversation. Prompt: **"Did you or your partner have any difficulty in talking or hearing over the connection?"** Yes = 1, No = 0.

$$
\%D = 100\,d
$$
Where: %D is the percentage "Difficulty" (percentage of "yes" responses) and d is the corresponding simple proportion of "yes" responses in [0, 1]. *(p. 12)*

NOTE: when the nature of the difficulty is required, the experimenter usually asks the subject to describe their perception of the difficulty in their own words. *(p. 12)*

## A.4.2.3 Other opinion scales *(p. 12)*
Variants of "magnitude estimation" and "cross-modality matching" may be used. Responses may be:
- a) one of a numerical series of categories labelled 1, 2, 3, 4, 5 (presented as such to the subject) with descriptions attached **only to the first and the last** to identify the subjective dimension;
- b) a numerical mark on a scale from one to a number much greater than five, say **10 or 100**; or
- c) a length proportional to some property (e.g. quality), marked manually along a given straight line.

## A.4.3 Instructions to subjects *(p. 12)*
- Instructions given on arrival for the first visit; subjects normally receive a **letter in advance** with non-technical information on the experiment and what is expected of them.
- Subjects are asked whether they read and understood the letter; obscurities are clarified; questions invited.
- The sound-proof rooms and facilities are demonstrated.
- Subjects are told **how many calls** the visit comprises. On subsequent visits they are told only that the procedure is the same, possibly with a different number of calls.

## A.4.4 Data collection *(p. 13)*
- Speech levels, durations and activity factors may be derived from tape recordings, but are now normally measured **on-line by computer-controlled meters** and stored directly into computer files.
- **Two subjective responses per conversation per subject**: the conversation-opinion score and the Difficulty decision. Collection medium may be pencil and paper, electronic buttons, keyboards, keypads, or computer touch-screen terminals. *(p. 13)*

## A.4.5 Treatment of results (conversation tests) *(p. 13)*
Per conversation the data are: two conversation opinions (5/4/3/2/1), two Difficulty votes (1/0), two measured active speech levels, one duration value. Additional variables (e.g. video of handset holding) may be collected. *(p. 13)*

- Compute the **average opinion score for each test condition**. *(p. 13)*
- Evaluate **confidence limits** and perform **significance tests by conventional analysis-of-variance**. *(p. 13)*
- ANOVA assumptions are adequately satisfied for opinion score, active speech level and most variables of interest, but **not** for a binary variate like the Difficulty score, particularly the assumption of constant residual variance. ANOVA is nonetheless robust enough to give reasonable results even with such extreme departures; results from the **first stage** of the ANOVA of Difficulty scores should be **regarded with some reserve**. Once no unexplained abnormalities and no unexplained conflicts with the corresponding MOS_C analysis are established, the **second stage** (detailed analysis of averages from End-Condition combinations) can be confidently undertaken **with the aid of a mathematical transformation**. *(p. 13)*
- Plot mean opinion score against the parameter under test (e.g. MOS_C versus circuit attenuation). **The vertical axis must always be MOS_C.** *(p. 13)*

---

# Annex B - Listening tests: Absolute Category Rating (ACR)

Purpose of B.1: eliminate unwanted variability in the speech source by preparing standardized recorded/stored samples first. *(p. 14)*

## B.1.1 Recording environment *(p. 14)*
- Talker seated in a quiet room, **volume between 30 and 120 m³**. *(p. 14)*
- Reverberation time **< 500 ms**, preferably **200-300 ms**. *(p. 14)*
- Room noise level **below 30 dBA** with **no dominant peaks** in the spectrum. *(p. 14)*
- Report room-noise characteristic as completely as possible: dBA, long-term spectrum, amplitude-time distribution. Desirable to record a **30-second sample of the room noise** for later detailed investigation. *(p. 14)*

## B.1.2 Sending system *(p. 14)*
- Whatever sending system is used (local telephone or IRS per P.48), it must be calibrated per the relevant Recommendation (e.g. P.64), and the **sending sensitivity-frequency characteristic reported in full**. *(p. 14)*
- Annex D/P.830 describes the **"modified IRS"** deemed appropriate for evaluating all-digital connections using speech codecs. *(p. 14)*
- Sending sensitivity characteristic measured **at least twice**, beginning and end of experiment. *(p. 14)*

## B.1.3 Recording system *(p. 14)*
Must be of high (studio) quality; permitted options:
- a) Conventional two-track tape recorder; equalization type must be stated, **IEC equalization recommended**; high-grade tape (low print-through, low noise) at all times.
- b) Two-channel digital audio processor with a high-quality VCR or DAT machine.
- c) **Computer-controlled digital storage system — best and most versatile.**
For a) and b), one track records speech and the other records control signals at a level and frequency chosen to avoid crosstalk. *(p. 14)*

## B.1.4 Speech material *(pp. 14-15)*
- **Simple, meaningful, short sentences**, chosen at random as being easy to understand (e.g. from current non-technical literature or newspapers). *(p. 14)*
- Sentences made into lists in **random order** so there is **no obvious connection of meaning between one sentence and the next**. *(p. 14)*
- Avoid very short and very long sentences: each spoken sentence should fit a **time-slot of 2-3 seconds**. *(p. 14)*
- Group size (sentences per speech sample): **minimum 2, maximum 5 recommended**. *(p. 14)*
- The **time interval between sentences**, during which circuit noise may be heard and adaptive processes settle into new states, is also important. *(pp. 14-15)*
- Record the **longest groups** that may be needed, since shorter groups can always be obtained by copying/replaying parts of longer ones. *(p. 15)*
- Groups are combined into **lists of five or ten groups each**, so a complete list can be used as a series of samples given the same treatment while listening level or another parameter is varied on reproduction. *(p. 15)*

### Table B.1 - Examples of speech material *(p. 15)*
- "You will have to be very quiet."
- "There was nothing to be seen."
- "They worshipped wooden idols."
- "I want a minute with the inspector."
- "Did he need any money?"

## B.1.5 Recording procedure *(p. 15)*
1. Record speech from a **linear microphone and low-noise amplifier with flat frequency response** per IEC 581-5. *(p. 15)*
2. Position the microphone **between 140 mm and 200 mm from the talker's lips**; use a windscreen if breath puffs are noticed. *(p. 15)*
3. The same speech may be recorded simultaneously from the sending output of an **IRS (P.48)** with the handset held normally; another telephone instrument may replace the IRS if the investigation requires it. *(p. 15)*
4. Use **two separate recording systems simultaneously**: one records wideband speech in one channel, the other records telephone speech in the corresponding channel; the other channel of each system records control signals. This ensures the same speech exists in two forms (telephone and wideband). *(p. 15)*
5. Observe the **active speech level (P.56)** during recording. The active speech level in **both** recording systems must be **between 20 and 30 dB below the overload point** of the recording system, **for each sentence measured separately**. Any group of sentences failing this is **re-recorded**. *(p. 15)*
6. Ratio of active speech level to **psophometrically weighted noise level** (definition in 8.2.3/P.830), SNR(p), on the recording media should be **> 40 dB, with an objective of 50 dB**. *(p. 15)*
7. All speech samples used in one experiment may be different: **essential for Listening-Effort tests** and desirable for other types. *(p. 15)*

## B.1.6 Talkers *(p. 16)*
- As many talkers as required by the experiment design (see B.3). *(p. 16)*
- Talkers pronounce sentences **fluently but not dramatically**, with **no speech deficiencies such as stutter**. *(p. 16)*
- Talkers adopt a speaking level **comfortable to them individually** and which they can **maintain fairly constantly**. *(p. 16)*

## B.1.7 Speech levels *(p. 16)*
- After recording, play back and measure the **active speech level of each sentence** with a meter conforming to **P.56**. *(p. 16)*
- Re-record the lists (announcements, sentences, control tones) onto a second system with the necessary **gain adjustments** so each group reaches the standardized active speech level, preserving the time relationships between sentences and the tone signals in the other channel. *(p. 16)*
- **Narrow-band speech standardized level: −26 dB (+0.5 dB) relative to the peak overload level of the recording system**, derived by measuring and adjusting the narrow-band recorded signal directly. The calibration tone has its r.m.s. level equal to the mean active level of the re-recorded speech. *(p. 16)*
- **Wideband speech**: level depends on intended use. Sometimes the same levels as telephone speech are appropriate; if playback is through a loudspeaker or artificial mouth, individual target speech levels must be such that **equality is maintained at the output of the whole electric-acoustic replay chain**. *(p. 16)*

## B.1.8 Calibration signal *(p. 16)*
- Insert **20 seconds or more of tone** at the beginning of each resulting recording at the re-recording stage, at a level in a known relationship to the mean active speech level (**most conveniently equal to it**). *(p. 16)*
- Calibration tone is normally at **1000 Hz**, but may be at another frequency if the recordings are to be played through systems (such as certain sub-band coders) that respond to 1000 Hz in a special way. *(p. 16)*
- This tone is used later to adjust the mean input speech levels (see B.4.3). *(p. 16)*

## B.2.1 Speech input and listening levels *(p. 16)*
Particular attention to the **range of input levels** and the **range of listening levels**, because:
- there is **no universal optimum listening level**;
- a **variety of listening levels will occur in practice**;
- comparability considerations apply;
- **interactions may occur**. *(p. 16)*

## B.2.2 Talkers (circuit-condition selection) *(pp. 16-17)*
- Sophisticated processes often affect male and female voices differently, so the experimental design must provide for **two types of voice as a balanced factor**. *(p. 16)*
- Scores for male and female speech are **evaluated separately**, and averaged **only if** they yield main effects and interactions that are **not statistically different**. *(p. 17)*
- To reduce the danger that results depend heavily on peculiarities of the chosen voices, it is **essential** to use **more than one male and more than one female voice in a balanced design**. *(p. 17)*

## B.2.3 Reference conditions *(p. 17)*
**Every experiment should include reference conditions** so experiments made in different laboratories, or at different times in the same laboratory, can be sensibly compared. Reference conditions depend on what is assessed: for a digital system they may include the **MNRU conforming to P.810**; other controlled degradations (e.g. signal-to-noise ratio, 8.2.3/P.830) are appropriate in other cases. *(p. 17)*

## B.2.4 Other conditions *(p. 17)*
Additional conditions depend on the purpose of the test, e.g. room noise as a variable, bit-error rate for a digital system, Rayleigh fading for a radio system. *(p. 17)*

## B.3 Design of experiment (listening tests) *(p. 17)*
- Same design principles as A.2 (Latin/Youden/graeco-latin squares, balanced incomplete blocks, randomization with replication). *(p. 17)*
- Additionally the design must cater for: a) the requirements of B.2; b) the **order-of-presentation effect**. *(p. 17)*
- Test size is limited by the maximum session length possible **without fatigue**. If too large for one session, sub-divide into two or more. **Ideally no session should last more than 20 minutes, and in no case should a session exceed 45 minutes.** *(p. 17)*

## B.4.1 Listening environment *(p. 17)*
Same conditions as the recording room (B.1.1: 30-120 m³, RT < 500 ms preferably 200-300 ms, room noise < 30 dBA, no dominant spectral peaks) **except** that environmental noise (A.1.1.2.2) should be set to the appropriate level; see the Hoth and vehicle noise spectra for examples. Noise level and spectrum measured **at least twice**, beginning and end. *(p. 17)*

## B.4.2 Listening system *(pp. 17-18)*
- Whatever listening system is chosen (local telephone system, IRS per P.48, loudspeaker system), it must be calibrated per the relevant Recommendation (e.g. P.64) and the **receiving sensitivity/frequency characteristic reported in full**. *(p. 17)*
- Annex D/P.830 "modified IRS" applies for all-digital connections using speech codecs. *(p. 17)*
- Receiving sensitivity/frequency characteristic measured **at least twice**, beginning and end of the experiment. *(pp. 17-18)*

## B.4.3 Listening level *(p. 18)*
- Set system gain so the **calibration tone (B.1.8) played back from the processed tapes produces the required listening level**. *(p. 18)*
- Variations in listening level required by the design are accommodated either by a) **attenuators/amplifiers in the listening system**, or b) included in the processing or re-recording stage. *(p. 18)*
- **Method b) is not recommended**: it is difficult to maintain a high enough signal-to-noise ratio at low levels, and flexibility and variety in the randomization are greatly reduced. *(p. 18)*
- **The listening level should always be recorded.** *(p. 18)*

## B.4.4 Listeners *(p. 18)*
Subjects chosen **at random from the normal telephone-using population**, with the provisos that:
- a) they have **not been directly involved** in work connected with assessment of telephone-circuit performance, or related work such as **speech coding**; *(p. 18)*
- b) they have **not participated in any subjective test whatever for at least the previous six months**, and **not in any listening-opinion test for at least one year**; and *(p. 18)*
- c) they have **never heard the same sentence lists before**. *(p. 18)*

If the available population is unduly restricted, allowance must be made for this in drawing conclusions. In some cases **screening of subjects** may be necessary; a method based on **Annex B/P.78** may be applicable. *(p. 18)*

## B.4.5 Opinion scales recommended by the ITU-T *(pp. 18-19)*
Layout and wording as seen by subjects is very important and should follow the standard arrived at through years of experience; equivalent wording per language may cause small variations from the English text.

### a) Listening-quality scale -> MOS *(p. 18)*
Heading seen by the subject: **"Quality of the speech"**.

| Category | Score |
|---|---|
| Excellent | 5 |
| Good | 4 |
| Fair | 3 |
| Poor | 2 |
| Bad | 1 |

The quantity evaluated (mean listening-quality opinion score, or simply mean opinion score) has the symbol **MOS**. *(p. 18)*

### b) Listening-effort scale -> MOS_LE *(p. 19)*
Heading seen by the subject: **"Effort required to understand the meanings of sentences"**. The heading is **particularly important; without it the other descriptions are liable to be seriously misunderstood.** *(p. 19)*

| Category | Score |
|---|---|
| Complete relaxation possible; no effort required | 5 |
| Attention necessary; no appreciable effort required | 4 |
| Moderate effort required | 3 |
| Considerable effort required | 2 |
| No meaning understood with any feasible effort | 1 |

Mean listening-effort opinion score symbol: **MOS_LE (MOSle)**. *(p. 19)*

### c) Loudness-preference scale -> MOS_LP *(p. 19)*
Heading seen by the subject: **"Loudness preference"**. This scale is **non-monotonic in quality**: the ideal response is the midpoint 3 ("Preferred"), not 5.

| Category | Score |
|---|---|
| Much louder than preferred | 5 |
| Louder than preferred | 4 |
| Preferred | 3 |
| Quieter than preferred | 2 |
| Much quieter than preferred | 1 |

Mean loudness-preference opinion score symbol: **MOS_LP (MOSlp)**. *(p. 19)*

NOTE: alternative subjective scales should be used **only if** the above three do not meet the experimenter's needs; examples in 2.6 of the Handbook on Telephonometry and CCIR Report 751, Volume VIII.3, 1986. *(p. 19)*

## B.4.6 Instructions to subjects (listening tests) *(p. 19)*
1. Give the instructions (verbally as well if necessary) **prior to commencement** of the experiment; example in Table B.2. *(p. 19)*
2. Once the subject has understood, they listen to a **preliminary list** and give opinions. *(p. 19)*
3. **No suggestion** should be made that the preliminary samples include the best or worst in the range to be covered, or exhaust the range of conditions they can expect to hear. *(p. 19)*
4. After the preliminary list, allow sufficient time for the subjects' questions. Questions about **procedure** or the **meaning of the instructions** are answered; **any technical question must be met with: "We cannot tell you anything about that until the experiment is finished".** *(p. 19)*

### Table B.2 - Example of instructions to subjects (verbatim) *(p. 20)*
> **LISTENING EXPERIMENT No. …**
> In this experiment you will be listening to short groups of sentences via the telephone handset, and giving your opinion of the speech you hear.
> On the table in front of you is a box with five illuminated press buttons. When all the lamps go on, you will hear … sentences. Listen to these, and when the lamps go out, press the appropriate button to indicate your opinion on the following scale.
> **EFFORT REQUIRED TO UNDERSTAND THE MEANINGS OF SENTENCES**
> 5 Complete relaxation possible; no effort required.
> 4 Attention necessary; no appreciable effort required.
> 3 Moderate effort required.
> 2 Considerable effort required.
> 1 No meaning understood with any feasible effort.
> The button you have pressed will light up for a short time. Then the lamp will go out, and there will be a brief pause before all the lamps go on again for the next group of … sentences.
> There will be a longer pause after every … groups (each calling for an opinion). There will be a total of … groups in this visit, and a similar number in your subsequent visit(s).
> Thank you for your help in this experiment.

## B.4.7 Statistical analysis and reporting of results (listening tests) *(p. 20)*
1. Calculate the **numerical mean over subjects for each condition at each listening level**, and list these means for initial inspection so that effects such as those due to male and female speech can be seen. *(p. 20)*
2. **Calculation of separate standard deviations for each condition is NOT recommended.** *(p. 20)*
3. **Confidence limits should be evaluated and significance tests performed by conventional analysis-of-variance techniques.** *(p. 20)*
4. Historical note repeated: earlier equivalences Excellent = 4 ... Bad = 0 require **adding one** to earlier mean scores for comparability; otherwise numerical processing is unchanged. *(p. 20)*
5. The method of analysis of the B.4.5 opinion scales follows the principles stated in A.4.5. *(p. 20)*
6. Plot mean opinion score against the parameter under test (e.g. MOS versus circuit attenuation); **the vertical axis must always be MOS**. *(p. 20)*
7. **Averaging the scores of male and female talkers must be done with care** and does not imply that this step would be warranted for a detailed study and interpretation of results unless the significance tests justify it. *(p. 20)*

---

# Annex C - Quantal-Response Detectability Tests *(pp. 20-22)*

The best method for obtaining information on the **detectability** (or an analogous property) of a sound such as echo, as a function of an objective quantity such as listening level, is a quantal-response method similar in principle to that described in 2.2 of the Handbook on Telephonometry. The main difference is that the subject's response is not a "Reference"/"Test" decision (which of two circuits is louder) but a vote on a scale. *(pp. 20-21)*

### Detectability opinion scale *(p. 21)*
| Code | Category |
|---|---|
| A | Objectionable |
| B | Detectable (understood as "Detectable but not objectionable") |
| C | Not detectable |

- Such three-point scales serve a variety of quantal-response tests. This scale suits stimuli such as **echo, reverberation, sidetone, voice-switching mutilation, or interfering tones**; **crosstalk** and sometimes echo may instead be judged on the scale **Intelligible - Detectable - Not detectable**. *(p. 21)*
- It is **sometimes permissible** to treat these votes as opinion scores with values **2, 1, 0** and analyse them like listening or conversation opinion scores. *(p. 21)*
- **But this is often unsatisfactory**: detectability decisions are not equivalents of responses on a continuous scale (unlike "Loudness preference"), because they embody **two distinct dichotomies** (detectable/not detectable and objectionable/not objectionable) which, though not independent, may call different psychological processes into action. **Objectionability or Intelligibility differs in kind, not merely in degree, from Detectability.** *(p. 21)*
- **Preferred analysis**: express the probability of response according to **each dichotomy separately**, as a function of some objective variable, by **fitting probit or logit equations**, then use the **quantiles or other parameters** as the basis of comparison between circuit conditions, analogously to the use of articulation scores. *(p. 21)*
- Conduct resembles listening-effort tests (Annex B), with differences: the **first presentation of the signal in each run should be at a high listening level**, so the listener is in no doubt what kind of signal is a candidate for decisions. Where **sidetone or echo** is involved, the subject **must talk as well as listen**. *(p. 21)*
- **Simple audiometric measurements as described in Recommendation P.78 are usually performed on subjects** in these experiments, so results can be expressed relative to their threshold of hearing. *(p. 21)*

### Seven-point noise-disturbance scale (for noise, fading and other disturbances) *(p. 21)*
| Code | Category | Meaning |
|---|---|---|
| A | Inaudible | Noise completely undetectable |
| B | Just audible | Noise can just be detected by listening carefully |
| C | Slight | Noise detectable, but not disturbing |
| D | Moderate | Noise slightly disturbing |
| E | Rather loud | Noise causes appreciable disturbance |
| F | Loud | Noise very disturbing, but call would be continued |
| G | Intolerable | Noise so loud that the call would be abandoned, or operator asked to change the line |

These scales are more nearly of the **quantized-continuum type**, like the Loudness-preference scale, and can be treated similarly. *(p. 21)*

---

# Annex D - Degradation Category Rating (DCR) method

## D.1 Introduction *(p. 22)*
ACR (Annex B) **tends to lead to low sensitivity in distinguishing among good quality circuits**. DCR, a modified ACR adapted from a CCIR Recommendation, affords **higher sensitivity**. It uses an **annoyance scale** and a **quality reference before each configuration to be evaluated**, and seems suitable for evaluating good-quality speech. *(p. 22)*

## D.2.1 Speech samples *(p. 22)*
- Each configuration is evaluated by judgements on speech samples from **at least four talkers**. *(p. 22)*
- Each sample is composed of **two sentences separated by approximately 0.5 s of silence**. *(p. 22)*
- Two samples (S1, S2), hence **four different sentences**, are selected from a **wider corpus of phonetically balanced sentences** so that the mean score for reference (e.g. MNRU) circuits on these sentences is **about the same as that obtained for the wider corpus**. *(p. 22)*
- The corpus therefore consists of **eight samples**: talker T1 reading S1, S2; T2 reading S1, S2; T3 reading S1, S2; T4 reading S1, S2. *(p. 22)*
- This causes **repetition of the two samples** during the test. That is judged not critical for a procedure where degradation is evaluated with regard to the reference, especially at good telephone quality where intelligibility is nearly perfect. **Using different samples for each configuration, as ACR often does (confounding speaker and sentence effects), could be one of the reasons for the lack of sensitivity in the ACR method.** *(p. 22)*
- Variations allowed: increase the number of talkers, mix sentence and talker effects. **All configurations must be evaluated on the same corpus.** *(p. 22)*

## D.2.2 Reference conditions (DCR) *(p. 22)*
- Reference conditions **shall** be included, e.g. for digital processes **multiplicative noise with Q values within the range 10 to 30 dB with a minimum of four steps is desirable**. *(p. 22)*
- A **quality reference** should be chosen to be inserted **before each judgement**. Usually **source conditions** are used, i.e. samples with no more degradation than those introduced by sending systems and bandwidth limitations. Choice depends on application: *(p. 22)*
  - standard telephony: source signal **3.4 kHz** bandwidth limited;
  - wideband telephony: **7 kHz** band limited;
  - high quality sound: **15 or 20 kHz** band limited.

## D.2.3 Stimulus presentation (DCR) *(pp. 22-23)*
- Stimuli are presented as **pairs (A-B)** or **repeated pairs (A-B-A-B)** where **A is the quality reference sample** and **B is the same sample processed by the system under evaluation**. *(p. 22)*
- The reference sample's purpose is to **anchor each judgement**. *(p. 23)*
- **"Null pairs" (A-A), at least one for each talker, are included to check the quality of anchoring.** *(p. 23)*
- **Separation between samples A and B: 0.5-1 s.** *(p. 23)*
- **In a repeated-pair procedure (A-B-A-B), the separation between the two pairs is 1-1.5 s.** *(p. 23)*
- The **order effect** observed in one-sample listening tests (e.g. ACR) is **not observed with DCR**, so **only one random order of presentation can be used**. *(p. 23)*
- Therefore the basic number of test and reference conditions is **eight times (four talkers x two samples) the number of nominal conditions**. *(p. 23)*

## D.2.4 Test instructions / DCR degradation scale -> DMOS *(p. 23)*
| Score | Category |
|---|---|
| 5 | Degradation is inaudible |
| 4 | Degradation is audible but not annoying |
| 3 | Degradation is slightly annoying |
| 2 | Degradation is annoying |
| 1 | Degradation is very annoying |

The mean of these scores is the **degradation mean opinion score, symbol DMOS**. *(p. 23)*

## D.3 Statistical analysis (DCR) *(p. 23)*
Sensitivities can be quantified by a **statistical multiple comparison test**. For an *a posteriori* comparison of circuits, a **Tukey Honestly Significant Difference (HSD) test** can be applied effectively; the HSD test makes all pair-wise comparisons among the means and determines the significance of differences in the mean values. *(p. 23)*

---

# Annex E - Comparison Category Rating (CCR) method

## E.1 Introduction and CCR scale *(pp. 23-24)*
- CCR is similar to DCR: listeners are presented with a **pair of speech samples on each trial**. *(p. 23)*
- In DCR the reference (unprocessed) sample is **always first** and listeners always rate how much the processed (second) sample is **degraded** relative to it. *(p. 23)*
- In CCR the **order of the processed and unprocessed samples is chosen at random for each trial**: on **half** of the trials the unprocessed sample is followed by the processed sample; on the remaining half the order is reversed. *(p. 23)*

Scale heading: **"The Quality of the Second Compared to the Quality of the First is:"** *(p. 24)*

| Score | Category |
|---|---|
| 3 | Much Better |
| 2 | Better |
| 1 | Slightly Better |
| 0 | About the Same |
| −1 | Slightly Worse |
| −2 | Worse |
| −3 | Much Worse |

- Listeners in effect provide **two judgements with one response**: "Which sample has better quality?" and "By how much?" *(p. 24)*
- DCR and CCR are **particularly useful for assessing telecommunications systems when the input has been corrupted by background noise**. The **advantage of CCR over DCR is the possibility to assess speech processing that either degrades or improves the quality of the speech.** *(p. 24)*
- The mean is the **comparison mean opinion score, symbol CMOS**. *(p. 24)*
- **NOTE (caution):** some laboratories found CCR useful in evaluating noise-reduction systems; however, when used in the recent subjective evaluations of the **G.729 (8 kbit/s) codec, the method was found to be too sensitive** when evaluating the performance of the codec for speech embedded in background noise. *(p. 24)*

## E.2 Quality reference (CCR) *(p. 24)*
The reference (unprocessed) sample, called the **Quality reference** or **Direct connection**, is presented either before or after the processed/degraded signal. It is generated using the **same talker and speech material** as the processed sample, **corrupted by the same noise (if any)** and **processed through the same preliminary processes** (transmitter characteristic, logarithmic companding, etc.). **There will therefore be a different quality reference for each test condition.** *(p. 24)*

## E.3 MNRU references (CCR) *(p. 24)*
MNRU reference conditions **should be included to calibrate the judgement scale**. These multiplicative-noise references are **used without being further mixed with environmental noises**. *(p. 24)*

## E.4 Presentation to listeners (CCR) *(p. 24)*
- Each speech sample is presented to the listener through the **quality reference condition** and through a **test codec or reference condition** (e.g. G.726, MNRU). *(p. 24)*
- A **"Null pair" should be included for each of the quality references**: on those trials the quality reference is presented twice. *(p. 24)*
- Listeners judge the quality of the second sample relative to the first on the **7-point scale of E.1**; sample instructions are in Table E.1. *(p. 24)*

## E.5 Data analysis (CCR) *(pp. 24-25)*
1. Half the trials for any test condition are presented in the order (unprocessed, processed) and the other half in the opposite order, so **simple averaging of the raw numerical scores would yield a CMOS of approximately 0 for all conditions**. *(pp. 24-25)*
2. **The raw data must be recoded.** If the order of presentation was (processed, unprocessed), **the sign of the numerical score must be reversed** (−1 -> 1, −2 -> 2, ..., 2 -> −2, 1 -> −1). *(p. 25)*
3. The recoded scores are used to compute CMOS, standard deviations, etc. **Results are presented in terms of the (unprocessed, processed) order.** *(p. 25)*
4. Appropriate Analysis of Variance or other statistical tests may be performed on the recoded scores. *(p. 25)*
5. **Caveat:** comparison opinion scores **may not be presumed to represent a linear interval scale**; therefore **statistics for ordinal scales may need to be applied instead**. *(p. 25)*

### Table E.1 - Example of CCR instructions to subjects (verbatim) *(p. 25)*
> **INSTRUCTIONS TO LISTENERS — Comparison category rating test**
> "Evaluation of the influence of various environmental noises on the quality of different telephone systems"
> In this experiment you will hear pairs of speech samples that have been recorded through various experimental telephone equipment. You will listen to these samples through the telephone handset in front of you.
> What you will hear is one pair of sentences, a short period of silence, and another pair of sentences. You will evaluate the quality of the second pair of sentences compared to the quality of the first pair of sentences.
> You should listen carefully to each pair of samples. Then, when the green light is on, please record your opinion about the quality of the second sample relative to the quality of the first sample using the following scale:
> The Quality of the Second Compared to the Quality of the First is: 3 Much Better; 2 Better; 1 Slightly Better; 0 About the Same; −1 Slightly Worse; −2 Worse; −3 Much Worse.
> You will have **five seconds** to record your answer by pushing the button corresponding to your choice. There will be a short pause before the presentation of next pair of sentences.
> We will begin with a short practice session to familiarize you with the test procedure. The actual tests will take place during **sessions of 10 to 15 minutes**.

---

# Annex F - Threshold method for comparison with a reference system

## F.1 Introduction *(p. 25)*
By direct comparison of a transmission system with a reference system, the performance of the system under test can be expressed in terms of a **degradation characteristic of the reference system that can be varied and set to defined values**, e.g. signal-to-noise ratio SNR(p) (8.2.3/P.830). The method leads to a **threshold of equality defined as the 50% preference level between the MNRU and the digital system**. *(p. 25)*

## F.2 Testing procedure *(p. 26)*
- A **listening-only** procedure. A **signal pair** consisting of a reference signal and a test signal is presented; listeners indicate **which of the two they judge to have the highest quality** (preference rating). *(p. 26)*
- **Subjective equivalence is defined as the reference value corresponding to the intersection point of the regression curve of the preference scores at the 50% preference level.** *(p. 26)*

## F.3 Presentation of signals *(p. 26)*
- Reference signal A and test signal B are arranged in an **equal number of A-B pairs and B-A pairs**, presented in **random order**. *(p. 26)*
- Several degradation levels, **spaced for example at 2 dB intervals**, are introduced in the reference path so that the **range of preference scores extends from 20% to 80%**, with the **50% preference lying in the middle of the degradation range**. *(p. 26)*

### Figure F.2 timing diagram of one trial *(p. 26)*
| Interval | Duration |
|---|---|
| Cue tone | 0.3-1 s |
| Gap after cue tone | 0.7-1 s |
| Sample A (sentence) | 2.5-5 s |
| Gap between A and B | 1-1.5 s |
| Sample B (sentence) | 2.5-5 s |
| Gap before cue tone for next pair | > 1.5 s |

- The subject makes a **forced choice**, responding "A is better" or "B is better". **The responses "A equals B" and "No difference" are forbidden.** *(p. 27)*
- **Presentation duration should be limited to about six minutes** so as not to tire listeners; more listening samples may follow after a suitable rest period. *(p. 27)*
- **At least two, preferably four or five replications** (repetitions of identical presentations) are recommended. *(p. 27)*
- NOTE (simplified variant): if the reference system exists in hardware and its degradation characteristic can easily be changed between presentations, the **subject performs the balancing to equally perceived quality themselves**, adjusting during the pause between pairs, with **the reference signal always presented first**; presentation continues until the subject reports the equality threshold has been reached. *(p. 27)*

## F.4 Speech sources (threshold method) *(p. 27)*
- Short sentences spoken by **at least two males and two females, preferably four or six of each**; **different sentences are required for each speaker**. *(p. 27)*
- Duration **2.5-5 s for speech**, and **less than 10-15 s for music signals**. *(p. 27)*
- **Clicks at the beginning and end of samples must be avoided.** *(p. 27)*
- Record source signals with a **linear microphone of sufficient bandwidth** in a sound-absorbent room with **ambient noise less than 20 dBA** and **reverberation time less than 0.3 s in the band 125-8000 Hz**. *(p. 27)*
- With digital recording equipment, the **quantizing noise level should be less than the noise level in 14-bit linear PCM**. *(p. 27)*

## F.5 Listening environment (threshold method) *(p. 27)*
- Use a **high-fidelity sound reproduction system**. *(p. 27)*
- With loudspeakers, the reproduction equipment should be **studio quality** and the listening room should conform to **CCIR Report 797 or IEC 268-13**. *(p. 27)*
- With headphones, **diotic (binaural) listening is preferable**. *(p. 27)*
- **The bandwidth shall be at least as wide as that of the system under test.** *(p. 27)*

## F.6 Listeners (threshold method) *(p. 27)*
- Selection per the ACR method (Annex B) is preferred but **not a strict condition** in the pair-comparison test. *(p. 27)*
- If the purpose is to obtain the opinions of **untrained** listeners, untrained subjects are necessary; otherwise **trained listeners can be used**, and reliability can be extended by **increasing the number of replications per listener**. *(p. 27)*
- **Minimum number of listeners is six, but preferably twelve or more.** *(p. 27)*
- Several subjects may listen simultaneously, but **responses must be obtained independently**. *(p. 27)*

## F.7 Reliability *(p. 27)*
Variations in preference score in subjective tests are assumed to conform to a **t-distribution**. The score variation width r yielding **95% reliability** at score u (0 <= u <= 1) over n trials is:

$$
r = \pm\, t(n-1,\ 0.05)\ \sqrt{\frac{u\,(1-u)}{n-1}}
$$
Where: `r` is the +/- score-variation width at 95% reliability (dimensionless proportion); `t(n-1, 0.05)` is Student's t at n-1 degrees of freedom and the 0.05 level; `u` is the preference score expressed as a proportion in [0, 1]; and `n` is the number of trials, i.e. **the number of repetitions for each presentation pair multiplied by the number of subjects and the number of source signals**. Equation (E-1). *(p. 27)*

- NOTE: **the threshold method is expected to give stable and reliable results even for high quality systems with little degradation.** *(p. 27)*
- Degradation can be introduced in the reference system e.g. by **addition of white noise**. For **digital systems, multiplicative noise as defined in P.810 (MNRU) is recommended**. For **wideband digital speech coders, a wideband MNRU (P.810) is recommended**. For some purposes **shaped noise instead of white may be appropriate**. *(pp. 27-28)*

---

## Master Parameter Table

### Conversation-test facility parameters (Annex A)
| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Test cabinet volume, handset/headset | — | m³ | — | >= 20 | 5 | Per subject cabinet |
| Test cabinet volume, handsfree | — | m³ | — | >= 30 | 5 | Extra care if RT is a variable |
| Reverberation time, test cabinet | RT | ms | 200-300 | < 500 | 5 | Normal range in parentheses |
| Cabinet dimension ratio | — | — | 5:4:3 | — | 5 | Minimises standing waves |
| Ambient noise floor | — | NC/NR rating | — | <= NC25 / NR25 | 6 | Comparable to homes, hospitals, libraries |
| Environmental noise level (example) | — | dBA | 50 | — | 6 | Hoth spectrum, IEC 651 meter, A-weighting, "fast" |
| Max rate of noise-level change during test | — | dB/s | — | <= 4 | 6 | Only when no conversation in progress |
| Fluctuating-noise averaging window | — | s | 60 | — | 6 | Statistics must be stable over this window |
| Noise-spectrum tolerance (Hoth) | — | dB | — | ±3 | 7, 10 | Per 1/3-octave band |
| Room-noise band limits | — | Hz | — | 100-8000 | 7 | ISO 266 centres, IEC 1260 filters |
| Vehicle-noise band limits | — | Hz | — | 63-8000 | 9 | ISO 266 centres, IEC 1260 filters |
| SPL measurement height | — | mm | 740 | — | 10 | Above centre of subject's seat, P.54 meter, A-weighting |
| Inter-position dBA uniformity | — | dB | — | ±2 | 10 | Across all subject positions in one room |
| Loudspeaker-to-measurement distance | — | m | 1.5 | >= 1.5 | 10 | Suggested minimum |
| Noise/connection measurement repetitions | — | count | 2 | >= 2 | 6, 10 | Beginning and end of experiment |
| Subject subjective-test abstinence | — | months | 6 | >= 6 | 11 | Any subjective test |
| Subject conversation-test abstinence | — | years | 1 | >= 1 | 11 | Conversation tests specifically |
| Interviews per condition (service observation) | — | count | 100 | >= 100 | 5 | P.82 method |

### ACR listening-test parameters (Annex B)
| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Recording-room volume | — | m³ | — | 30-120 | 14 | Talker's room |
| Recording-room reverberation time | RT | ms | 200-300 | < 500 | 14 | Preferred range in Default |
| Recording-room noise level | — | dBA | — | < 30 | 14 | No dominant spectral peaks |
| Room-noise sample duration to archive | — | s | 30 | — | 14 | For later detailed investigation |
| Sentence duration slot | — | s | — | 2-3 | 14 | Each spoken sentence |
| Sentences per group (speech sample) | — | count | — | 2-5 | 14 | Minimum 2, maximum 5 recommended |
| Groups per list | — | count | — | 5 or 10 | 15 | Lists reused with varied listening level |
| Microphone-to-lips distance | — | mm | — | 140-200 | 15 | Linear mic, IEC 581-5 flat response |
| Active speech level headroom at recording | — | dB below overload | — | 20-30 | 15 | Per sentence, both recording systems; P.56 meter |
| Recording-media SNR (psophometric) | SNR(p) | dB | 50 (objective) | > 40 | 15 | Definition per 8.2.3/P.830 |
| Standardized narrow-band active speech level | — | dB rel. peak overload | −26 | −26 +0.5 | 16 | Calibration tone r.m.s. equals mean active level |
| Calibration tone duration | — | s | — | >= 20 | 16 | Inserted at start of each recording |
| Calibration tone frequency | — | Hz | 1000 | — | 16 | May differ for sub-band coders |
| Session length, ideal | — | min | <= 20 | — | 17 | Fatigue limit |
| Session length, absolute maximum | — | min | — | <= 45 | 17 | Never exceed |
| Listener subjective-test abstinence | — | months | 6 | >= 6 | 18 | Any subjective test |
| Listener listening-test abstinence | — | years | 1 | >= 1 | 18 | Any listening-opinion test |
| Listening-quality scale range | MOS | — | — | 1-5 | 18 | Bad=1 ... Excellent=5 |
| Listening-effort scale range | MOS_LE | — | — | 1-5 | 19 | 1 = no meaning understood |
| Loudness-preference scale range | MOS_LP | — | — | 1-5 | 19 | 3 = "Preferred" is the optimum, not 5 |

### DCR parameters (Annex D)
| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Talkers per configuration | — | count | 4 | >= 4 | 22 | May be increased |
| Sentences per sample | — | count | 2 | — | 22 | Separated by silence |
| Intra-sample sentence silence | — | s | 0.5 | ~0.5 | 22 | Approximately |
| Samples per talker | — | count | 2 | — | 22 | S1, S2 -> 8-sample corpus with 4 talkers |
| MNRU reference Q range | Q | dB | — | 10-30 | 22 | Minimum four steps desirable |
| MNRU reference steps | — | count | 4 | >= 4 | 22 | Desirable minimum |
| Quality-reference bandwidth, standard telephony | — | kHz | 3.4 | — | 22 | Source condition |
| Quality-reference bandwidth, wideband telephony | — | kHz | 7 | — | 22 | Source condition |
| Quality-reference bandwidth, high quality sound | — | kHz | — | 15 or 20 | 22 | Source condition |
| A-to-B separation within a pair | — | s | — | 0.5-1 | 23 | A = reference, B = processed |
| Separation between pairs in A-B-A-B | — | s | — | 1-1.5 | 23 | Repeated-pair procedure |
| Presentation multiplier | — | x nominal conditions | 8 | — | 23 | 4 talkers x 2 samples |
| Null pairs (A-A) | — | count per talker | 1 | >= 1 | 23 | Checks quality of anchoring |
| DCR degradation scale range | DMOS | — | — | 1-5 | 23 | 5 = inaudible, 1 = very annoying |

### CCR parameters (Annex E)
| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| CCR comparison scale | CMOS | — | — | −3 to +3 | 24 | 7 points; 0 = About the Same |
| Trials with (unprocessed, processed) order | — | fraction | 0.5 | — | 23 | Remaining half reversed |
| Sign-reversal recode | — | — | — | — | 25 | Applied to (processed, unprocessed) trials before averaging |
| Response window | — | s | 5 | — | 25 | Per Table E.1 instructions |
| Session length (CCR example) | — | min | — | 10-15 | 25 | Per Table E.1 instructions |

### Threshold-method parameters (Annex F)
| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Equality threshold preference level | — | % preference | 50 | — | 25, 26 | Intersection of preference regression curve |
| Reference degradation step spacing | — | dB | 2 | — | 26 | Example spacing |
| Target preference-score span | — | % | — | 20-80 | 26 | 50% must fall mid-range |
| Cue tone duration | — | s | — | 0.3-1 | 26 | Figure F.2 |
| Gap after cue tone | — | s | — | 0.7-1 | 26 | Figure F.2 |
| Sample duration (speech) | — | s | — | 2.5-5 | 26, 27 | Figure F.2 and F.4 |
| Sample duration (music) | — | s | — | < 10-15 | 27 | F.4 |
| Gap between samples A and B | — | s | — | 1-1.5 | 26 | Figure F.2 |
| Gap before next cue tone | — | s | — | > 1.5 | 26 | Figure F.2 |
| Presentation block duration | — | min | ~6 | <= ~6 | 27 | Then rest period |
| Replications per presentation pair | — | count | 4-5 preferred | >= 2 | 27 | More replications raise reliability |
| Male talkers | — | count | 4-6 preferred | >= 2 | 27 | Different sentences per speaker |
| Female talkers | — | count | 4-6 preferred | >= 2 | 27 | Different sentences per speaker |
| Source-recording ambient noise | — | dBA | — | < 20 | 27 | Sound-absorbent room |
| Source-recording reverberation time | RT | s | — | < 0.3 | 27 | Measured in 125-8000 Hz band |
| Digital source quantizing noise ceiling | — | — | — | < 14-bit linear PCM noise | 27 | Requirement on recording equipment |
| Listeners | — | count | 12+ preferred | >= 6 | 27 | Responses obtained independently |
| Reliability level | — | % | 95 | — | 27 | Equation (E-1) |

## Key Equations Summary
1. Percentage Difficulty: `%D = 100 d` *(p. 12)*
2. Threshold-method 95% reliability width: `r = ± t(n-1, 0.05) sqrt(u(1-u)/(n-1))` *(p. 27)*
3. MOS is the arithmetic mean of the integer category scores; the same applies to MOS_C, MOS_LE, MOS_LP, DMOS and (after sign recoding) CMOS. *(pp. 11, 18-19, 23, 25)*
4. Historical rescaling: `MOS_current = MOS_legacy + 1` when converting from the old 0-4 numbering. *(pp. 12, 20)*

## Results Summary
P.800 reports no experimental results of its own; it is a normative protocol. The only empirical claims are: cross-laboratory ACR tests performed on the same physical conditions and identical transmission systems in the work leading to G.726 32 kbit/s ADPCM, G.728, G.729 and G.722 **showed a high degree of consistency** *(p. 4)*; and the CCR method proved **too sensitive** in the G.729 8 kbit/s subjective evaluations for speech embedded in background noise *(p. 24)*.

## Limitations (acknowledged in the text)
- ACR has **low sensitivity in distinguishing among good quality circuits**, which motivated DCR. Using different samples for each configuration, as ACR often does, confounds speaker and sentence effects and may be one cause of that insensitivity. *(pp. 22)*
- CCR was found **too sensitive** for evaluating G.729 performance on speech embedded in background noise. *(p. 24)*
- CCR comparison opinion scores **may not be presumed to represent a linear interval scale**; ordinal statistics may be required. *(p. 25)*
- Listening-only results predict conversational assessment **only with reservations**, and only if talking and conversation degradations are separately accounted for. *(p. 4)*
- ANOVA assumptions (particularly constant residual variance) **fail for the binary Difficulty score**; first-stage results must be regarded with reserve. *(p. 13)*
- Treating three-point detectability votes as 2/1/0 opinion scores is **often unsatisfactory** because the scale embodies two distinct dichotomies; probit/logit fitting per dichotomy is preferred. *(p. 21)*
- The **internal vehicle noise spectra of Table A.2 are explicitly provisional**, with more detailed specifications under study. *(p. 7)*
- Acoustical room noise is **difficult to control below 100 Hz (Table A.1) / below 63 Hz (Table A.2-A.3)** because of cabinet dimensions, poor attenuation and extraneous noise such as air-conditioning. *(pp. 7, 9)*
- Service-observation (interview) methods give **little control over the detailed characteristics of the connections tested**. *(p. 5)*
- If the available subject population is unduly restricted, **allowance must be made for that in drawing conclusions**. *(pp. 11, 18)*

## Arguments Against Prior Work
- Against ACR for good-quality circuits: it lacks sensitivity, and using a different speech sample for each configuration confounds speaker and sentence effects. DCR fixes this by anchoring every judgement to a reference and reusing a fixed eight-sample corpus. *(p. 22)*
- Against DCR when systems may improve speech: DCR always asks how much the second sample is **degraded**, so it cannot represent improvement. CCR randomises order and uses a signed scale. *(pp. 23-24)*
- Against treating detectability votes as continuous opinion scores: "Objectionability or Intelligibility differs in kind, not merely in degree, from Detectability." *(p. 21)*
- Against the earlier 0-4 category numbering: mean scores from those experiments are not comparable without adding one. *(pp. 12, 20)*
- Against embedding listening-level variation in the processing/re-recording stage: it is difficult to maintain a high enough SNR at low levels and it greatly reduces flexibility and variety in the randomization. *(p. 18)*
- Against reporting per-condition standard deviations in ACR: explicitly **not recommended**; use confidence limits and ANOVA. *(p. 20)*

## Design Rationale
- Reference conditions in **every** experiment exist so results from different laboratories or different times are commensurable; MNRU supplies a calibrated, reproducible degradation axis for digital systems. *(p. 17)*
- The quality reference is inserted **before each DCR judgement** to anchor the listener's internal scale; null pairs (A-A) exist to verify that the anchoring is working. *(pp. 22-23)*
- Sentences are unrelated and randomised so context cannot carry meaning across items; sentences are short (2-3 s) so listening effort reflects transmission quality rather than memory load. *(p. 14)*
- Male and female voices are a **balanced factor** because sophisticated processes affect them differently; scores are evaluated separately and merged only when the difference is not significant. *(pp. 16-17, 20)*
- Naive listeners with long abstinence periods and no prior exposure to the sentence lists exist to keep judgements representative of ordinary users rather than trained analysts. *(pp. 11, 18)*
- Session length is bounded (20 min ideal, 45 min hard maximum) because fatigue is a confound, not a nuisance. *(p. 17)*
- The forced-choice, no-"equal"-allowed design of the threshold method exists to produce a clean psychometric preference function whose 50% crossing defines equivalence. *(pp. 26-27)*
- The first presentation in a quantal-response run is at a high listening level so the listener knows what signal they are being asked to detect. *(p. 21)*

## Testable Properties
- Opinion category scores must map to integers 5 (Excellent) down to 1 (Bad); MOS must lie in [1, 5]. *(p. 18)*
- MOS_LP is optimal at 3, not at the scale extremes; a loudness-preference MOS far from 3 indicates a level error in either direction. *(p. 19)*
- CMOS must lie in [−3, +3]; before sign recoding, the raw average across both presentation orders must be approximately 0. *(pp. 24-25)*
- DMOS must lie in [1, 5]; null pairs (A-A) should score at or near 5 ("degradation is inaudible"), and a substantially lower null-pair DMOS indicates broken anchoring. *(pp. 23)*
- Active speech level of every recorded sentence must be 20-30 dB below the recording system's overload point. *(p. 15)*
- Recording-media SNR(p) must exceed 40 dB, target 50 dB. *(p. 15)*
- Standardized narrow-band active speech level must equal −26 dB (+0.5 dB) relative to peak overload. *(p. 16)*
- Room-noise spectrum must match Table A.1 within ±3 dB per 1/3-octave band from 100 Hz to 8 kHz; the Hoth spectrum is level-independent, so a 10 dB overall reduction must reduce every band by exactly 10 dB. *(pp. 6-7)*
- Across all subject positions in a room, the A-weighted noise level must not vary by more than ±2 dB. *(p. 10)*
- No listening session may exceed 45 minutes; ideally none exceeds 20 minutes. *(p. 17)*
- The threshold-method preference scores across the reference degradation range must span 20% to 80%, with 50% at the middle of the range. *(p. 26)*
- Reliability width r must decrease as sqrt(1/(n-1)) with the number of trials n, and is maximised at u = 0.5. *(p. 27)*
- Legacy 0-4-scaled means must be raised by exactly 1 to compare with current MOS values. *(pp. 12, 20)*
- Listener panels: minimum 6 in the threshold method, preferably 12 or more. *(p. 27)*
- DCR corpus size: number of presentations equals 8 x the number of nominal conditions when 4 talkers x 2 samples are used. *(p. 23)*

## Relevance to Project
This is the reference protocol for any subjective evaluation of a speech synthesizer's output quality, and it settles several decisions that would otherwise be arbitrary:

- **Scale choice.** Use the ACR listening-quality scale (5-1, Excellent-Bad) for absolute quality claims, reporting MOS. Use the listening-effort scale (MOS_LE) when the question is intelligibility cost rather than pleasantness, and remember its heading is load-bearing. Use DCR/DMOS when comparing two closely similar synthesis configurations, where ACR will not resolve the difference. Use CCR/CMOS when a change might improve as well as degrade quality, which is the common case for a synthesis-parameter tweak.
- **Reference anchors are mandatory, not optional.** Every experiment needs MNRU (P.810) reference conditions spanning Q = 10-30 dB in at least four steps, so results are comparable across sessions and across time. Without them, two MOS runs of the same synthesizer months apart cannot be compared.
- **Stimulus construction.** Short unrelated meaningful sentences, 2-3 s each, 2-5 per sample, randomised so no meaning carries between items, at least four talkers (here: four voices or four utterance sets), male and female balanced.
- **Level discipline.** Normalise every stimulus to a fixed active speech level (P.56), keep 20-30 dB of headroom, and calibrate playback with a tone. Level differences between conditions otherwise leak into the quality judgement.
- **Panel hygiene.** Naive listeners who have not heard the sentence list before and have not taken a subjective test recently; sessions under 20 minutes; a practice list whose range is not described to them; technical questions deflected until the experiment ends.
- **Statistics.** Report per-condition means plus confidence limits from ANOVA. Do not report per-condition standard deviations for ACR. For DCR use Tukey HSD for post-hoc pairwise comparisons. For CCR, sign-recode before averaging and treat the scale as ordinal.
- **A cheap regression harness** falls out of this: a fixed sentence corpus, fixed MNRU anchors, a fixed listening level, and a stored panel protocol turns "does this synthesis change sound better" into a repeatable measurement rather than an argument.

## Open Questions
- [ ] What panel size does P.800 require for ACR? The document specifies a minimum only for the threshold method (6, preferably 12+) and for service observations (100 interviews per condition); ACR panel size is left to the experiment design (B.3) and is specified in companion Recommendations such as P.830.
- [ ] The Hoth spectrum below 100 Hz and the vehicle spectra below 63 Hz are explicitly unspecified; how should a synthesis-evaluation rig handle low-frequency room noise?
- [ ] Table A.2's vehicle spectra are provisional; a later revision may supersede them.
- [ ] The "mathematical transformation" for second-stage ANOVA of binary Difficulty scores is referenced but not given; it lives in 2.5.9 of the Handbook on Telephonometry.
- [ ] For a speech synthesizer there is no "unprocessed reference" in the CCR sense; what plays the role of the quality reference when the system generates rather than transmits speech? P.85 (speech output devices) is the companion to consult.

## Related Work Worth Reading
- **ITU-T P.810 (1996), Modulated Noise Reference Unit (MNRU)** — defines Q and the reference degradation used as the anchor in DCR, CCR and the threshold method. Essential companion.
- **ITU-T P.830 (1996), Subjective performance assessment of telephone-band and wideband digital codecs** — the application-specific procedure P.800 was aligned with in this revision; defines the modified IRS and SNR(p).
- **ITU-T P.85 (1994), A method for subjective performance assessment of the quality of speech voice output devices** — the direct analogue of P.800 for synthesized speech.
- **ITU-T P.56 (1993), Objective measurement of active speech level** — required for every level normalization step in Annex B.
- **ITU-T P.48 (1988), Specification for an intermediate reference system (IRS)** — the sending/receiving characteristic assumed throughout.
- **HOTH (D.F.), Room noise spectra at subscribers' telephone locations, JASA 12, 1941** — the source of Table A.1.
- **COMBESCURE (P.) et al, ICASSP 82** — the origin of the DCR method.
- **TUKEY (J.W.), The problem of multiple comparisons, 1953** — the HSD test prescribed for DCR analysis.

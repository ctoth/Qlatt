---
title: "Principles for Designing Computer Music Controllers"
authors: "Perry Cook"
year: 2001
venue: "Proceedings of the CHI'01 Workshop on New Interfaces for Musical Expression (NIME-01), Seattle, USA"
doi_url: "https://www.nime.org/proceedings/2001/nime2001_003.pdf"
pages: "NIME01-03 – NIME01-06"
affiliation: "Department of Computer Science (also Department of Music), Princeton University"
---

# Principles for Designing Computer Music Controllers

*Notes profile: theory / design-principles (non-empirical). The empirical scaffold (Study Design, Effect Sizes, Statistical Models) is intentionally absent; this paper reports no measurements, no equations, and no numeric parameters.*

## One-Sentence Summary
Cook states thirteen numbered design principles for real-time gestural controllers of computer-synthesized sound, distilled from fifteen years of building wind, voice, percussion, string, and everyday-object controllers, and argues each principle from named project successes and failures.

## Problem Addressed
Cheap sensors and real-time synthesis made new computer instruments easy to build, but the resulting music "can be even more greatly influenced by our initial design decisions and techniques" *(p.NIME01-03)*. The paper addresses the absence of stated, defensible design heuristics for the controller side of computer music: what mapping, programmability, sensor, and interconnect choices actually produce playable, durable, musically useful instruments.

## Key Contributions
- A numbered, explicitly non-universal list of **13 design principles**, split into human/artistic (1-6), technological (7-9), and "other" (10-13) groups *(p.NIME01-03)*.
- A retrospective case series of the author's controllers, each tagged with the principles it confirms: Cook/Morrill Trumpet, HIRN, SPASM/Singer, PhISEM shakers, TapShoe, PicoGlove, JavaMug / Fillup Glass / P-Ray's Café, BoSSA, Nukelele, SqueezeVox *(pp.NIME01-03 – NIME01-06)*.
- Two explicit negative results (the trumpet looping scheme, the HIRN "super instrument") used as evidence against high-bandwidth, high-state controller designs *(pp.NIME01-03, NIME01-04)*.
- The stated conclusion that instrument construction is "more art than science" while the human/artistic principles are durable and the technological ones are contingent *(p.NIME01-06)*.

## Key Concepts and Definitions

- **Controller (musical interface)**: the physical/sensor front end whose measured gestures drive synthesis parameters, distinguished throughout from the synthesis algorithm it drives *(p.NIME01-03)*.
- **Control bandwidth**: the aggregate rate/dimensionality of gesture information a controller supplies. HIRN's negative lesson: "huge control bandwidth is not necessarily a good thing" *(p.NIME01-04)*.
- **Spare bandwidth (of a player)**: the portion of a performer's motor capacity not already consumed by playing the base instrument. Trumpet players have it ("Trumpet players lie squarely in the 'some players have spare bandwidth' category"); violin players largely do not, "so a successful interface must exploit interesting remappings of existing gestures" *(pp.NIME01-03, NIME01-05)*.
- **Statelessness / near-statelessness**: interaction schemes that do not require the player to track hidden system state. After the loop scheme failed, "a set of simple, nearly stateless interactions were devised" *(p.NIME01-03)*.
- **Programmability as a curse**: the property that reconfigurability of a computer instrument invites endless remapping instead of finished art *(pp.NIME01-03, NIME01-04)*.
- **Smart instrument**: an instrument that adapts/learns from the player. Cook's sense is pejorative: "That the instrument is 'learning from their play and modifying its behavior' often does not make any sense at all, and can be frustrating, paralyzing, or offensive" *(p.NIME01-04)*.
- **Co-design of synthesis/processing algorithms with controllers**: the positive HIRN lesson; algorithm and controller developed together rather than one bolted onto the other *(p.NIME01-04)*.
- **Few-to-many mapping**: the SPASM/Singer problem of driving "well over 40 continuously controlled parameters" from a smaller gesture set (Figure 4 is titled "Few-to-Many Mappings") *(p.NIME01-04)*.
- **Idiomatic gesture**: an existing physical action native to an object or practice which the controller senses and enhances, e.g. "the idiomatic gesture of moving the hand in and out of the shells was enhanced by a tilt sensor in the glove" *(p.NIME01-05)*.
- **Instant music, subtlety later**: an interaction gradient in which naive first contact yields attractive output and expert nuance is discovered by continued play *(pp.NIME01-03, NIME01-05)*.

## Core Argument / Thesis
Musical controller design is governed less by sensing technology than by human factors and by committing to a specific musical result. Cook argues that (a) the flexibility of computer instruments is a liability rather than an asset, because it removes the closure that finishes art and confuses ordinary players; (b) controllers should be designed against a specific composition or musical target rather than as general "super instruments"; and (c) the payoff comes from exploiting expert technique and idiomatic gestures already present in players and objects, not from copying instruments or from maximizing sensor channels. He supports this by pairing each principle with named projects that confirmed it, and by reporting two designs that failed precisely by violating it *(pp.NIME01-03 – NIME01-06)*.

## The Thirteen Principles (verbatim)

### Some Human/Artistic Principles *(p.NIME01-03)*
1. "Programmability is a curse"
2. "Smart instruments are often not smart"
3. "Copying an instrument is dumb, leveraging expert technique is smart"
4. "Some players have spare bandwidth, some do not"
5. "Make a piece, not an instrument or controller"
6. "Instant music, subtlety later"

### Some Technological Principles *(p.NIME01-03)*
7. "MIDI = Miracle, Industry Designed, (In)adequate"
8. "Batteries, Die (a command, not an observation)"
9. "Wires are not that bad (compared to wireless)"

### Some Other Principles *(p.NIME01-03)*
10. "New algorithms suggest new controllers"
11. "New controllers suggest new algorithms"
12. "Existing instruments suggest new controllers"
13. "Everyday objects suggest amusing controllers"

Cook states the list is not offered as universal: "These are not assumed to be universal, but are rather a set of opinions formed as part of the process of making many musical interfaces" *(p.NIME01-03)*. Principles are bolded in the body text wherever a project reinforces them.

## Project Case Series (evidence per principle)

### Cook/Morrill Trumpet, 1986-89 *(p.NIME01-03)*
- Built with Dexter Morrill (Colgate) under an NEA grant, targeted at trumpeter Wynton Marsalis. Yielded new interface devices, software systems [1][2], and musical works [3].
- Sensors on **valves, mouthpiece, and bell** enabled "fast and accurate pitch detection, and extended computer control for the trumpet player."
- Confirms principle 4: trumpet players have spare bandwidth, so "attaching a few extra switches and sliders around the valves proved very successful."
- **Negative result:** the intended scheme of entering played notes into loops and later triggering them "proved a miserable failure, because of the mental concentration needed to keep track of which loop was where, what the loop contents were, syncing the recording, triggering, etc."
- Replacement design: "a set of simple, nearly stateless interactions." Switches trigger pre-composed motifs, navigate forward/backward through sections, and capture pitch from the horn to seed "fairly autonomous compositional algorithms."

### HIRN wind controller, 1991 *(p.NIME01-04)*
- Sensed: rotation in both hands, translation in both hands, arm orientation, independent control with each finger, breath pressure, and muscle tension in the lips [4].
- Mapped to the parameters of the **WhirlWind meta-wind-instrument physical model**; also investigated as a controller for FM and other synthesis techniques.
- **Negative lesson (two parts):** "huge control bandwidth is not necessarily a good thing," and attempting a "super instrument" **with no specific musical composition to directly drive the project (principle 5)** "yields interesting research questions, but with no real product or future direction."
- **Positive lesson:** "the co-design of synthesis/processing algorithms with controllers can benefit both."
- Figure 2 enumerates the HIRN sensor set: 1. Pitch Detector, 2. Breath Pressure Sensor, 3. Lip Tension Sensors, 4. Bite Sensor, 5./6./8. Rotation Controls, 7. Control Keys, 9. Linear Slide Control, plus optional foot controllers 10. Left Foot Expression Pedal and 11. Right Foot Switch Pedal.

### SPASM/Singer voice synthesizer, 1988-94 *(p.NIME01-04)*
- Physical modeling of the voice [5][6]; real-time capable, but "had well over 40 continuously controlled parameters."
- Improved graphical interfaces plus MIDI fader-box control [7] "proved that the voice is a truly difficult 'instrument' to control (**principles 3 & 4**)."
- Figure 3 shows the SPASM editor (vocal tract shape, glottal reflection gain, lip reflection gain, tract section radii, noise/turbulence generator with position of noise injection, nasal cavity). Figure 4 shows few-to-many mappings.

### PhISEM shaker percussion, 1996-1999 *(p.NIME01-04)*
- Physically Inspired Stochastic Event Modeling [8][9]; supports the "**new algorithms lead to new controllers lead to new algorithms …**" cycle (principles 10 and 11).
- Synthesis of particle-type percussion and real-world sounds produced controllers for shaker/scraper sounds, sound effects, and algorithmic interactive music.
- **Frog Maraca** (Figure 5) sends MIDI to control an algorithmic fusion jazz combo of bass, piano, drums. Success with adults and children [10] attributed to: "its simple interface (just shake it), the fun of making fairly complicated music with such a simple and whimsical looking device, and the fact that it only performed one function (and always performed that function when turned on)."
- A related Tambourine controller "could also compose algorithmic modal marimba solos when shaken."
- Architecture: "a single embedded microcontroller, programmed for one or two functions (selectable by the state of a button on power-up)," emitting standard General MIDI.
- Durability claim: except for battery replacement (**Die Batteries Die!!**), "these controllers have a strong possibility of working perfectly as designed in 10 (perhaps 20) years. Those who craft complex systems using custom hardware, multiple computers, and multiple operating systems, can make no such claims."

### Foot, Hand, Kitchen Wear/Ware, 1997-2000 *(pp.NIME01-04 – NIME01-05)*
- **TapShoe** (Figure 6, Interval Research / Bob Adams' Expressions Project): force sensing resistors and accelerometers attached directly to a DSP board running PhISEM shaker algorithms plus a small rhythmic loop. The algorithm generated a basic "groove" over which the wearer added accents and dynamics in addition to their own tapping sounds. Success came from making the wearer feel they were actually performing the music, "though the algorithmic loop would play a relatively boring tapping sound even if the shoe sat unworn ('**Instant music, subtlety later**')."
- **PicoGlove** (Figure 7): "**designed as a single composition**," called "Pico I for Seashells and Interactive Glove" [11]. A tilt sensor in the glove enhanced the idiomatic hand-in-and-out-of-shells gesture and steered fractal note-generation algorithms in real time to accompany the blown shells.
- **JavaMug** (Figure 8): built for a transcontinental MIDI jam between Tokyo and Columbia University in 1997 [12]. Pressure sensors beneath the fingers, a tilt sensor, a pot, and two buttons control an algorithmic techno-latin band. Dominated by "**Instant music, subtlety later**": squeezing it "yields attractive and (fairly) deterministic music, because algorithmic randomness is increased by *decreasing* pressure on the sensors." Neophytes progress by discovering that varied relative pressures and tilts produce more interesting music. Also an instance of "**Smart instruments are often not smart**": "the instrument doesn't change at all, but rather trains the user to use more gentle and subtle manipulations of the sensors."
- **Fillup Glass**: plays minimalist music loops (**via MIDI**) controlled by sensors in a water glass.
- **P-Ray's Café: Table 1**: control of a melodic percussion group by movement of common tabletop items (sugar, salt shaker, etc.) over a small table surface.
- These together demonstrate "**Everyday objects suggest amusing controllers**."

### BoSSA and the Nukelele, 1998-99 *(p.NIME01-05)*
- Stringed instruments have both a rich historical tradition and a rich electronic-interface tradition (electrified, MIDI, pure digital violins and guitars).
- Work with Dan Trueman began with the **RBow** (sensor-enhanced violin bow) and the **NBody** project modeling directional radiation of stringed instruments [13], leading to **BoSSA** (The Bowed Sensor, Speaker Array) [14], Figure 9.
- Principles reinforced: "**Existing instruments suggest new controllers**"; "**Copying an instrument is dumb, leveraging expert technique is smart**"; "**Some players have spare bandwidth, some do not**" — "violin players generally have their hands completely occupied, so a successful interface must exploit interesting remappings of existing gestures"; and "**Wires are not that bad (compared to wireless)**" — "the BoSSA is played sitting by a player who often plays electric violin, so the increased complexity of wireless was not justified."
- **Nukelele** (Figure 10, Interval Research Expressions project, named by Michael Brooke): "a personal experiment to design, implement, and test a new controller as rapidly as possible." Intended "to match the expressiveness of a true stringed instrument, by using audio directly from a sensor to drive a plucked string physical model." **Two sandwiched linear force sensing resistors** under the right hand provided pluck/strike position information along with the audio excitation for the string model.

### SqueezeVox, 2000 *(p.NIME01-06)*
- With Colby Leider (Princeton) [15]; revisits controlling models of the human voice.
- Design premise: "Breathing, pitch, and articulation of vowels and consonants must be controlled in a vocal model, so the accordion was selected as a natural interface (**principle 10**)."
- Mapping:
  - **Right hand / keyboard** — pitch.
  - **Aftertouch** — vibrato.
  - **Linear strip (right hand)** — fine pitch and vibrato.
  - **Bellows** — breathing.
  - **Left hand buttons (presets)** — vowels and consonants; alternatively continuous controllers such as a touch pad, plungers, or a squeeze interface.
- Figure 11 shows two builds: "Squeezevox Lisa" and "Bart."
- Future work: a self-contained version with onboard DSP synthesis ("Santa's Little Helper") and a small concertina version ("Maggie") under construction *(p.NIME01-06)*.

## Design Rationale (choices the paper justifies)
- **Reject stateful loop-based performance interaction** in favor of near-stateless triggers, because tracking loop identity, contents, sync, and triggering exceeds the performer's available concentration mid-performance *(p.NIME01-03)*.
- **Reject maximal sensing** (HIRN's ~11 sensed degrees of freedom) as a design goal; bandwidth without a composition to serve produces research questions, not instruments *(p.NIME01-04)*.
- **Design against a specific composition** (PicoGlove as "a single composition") so the project has a terminating condition and a musical target *(p.NIME01-05)*.
- **Fix the function of the device** rather than exposing configuration: PhISEM controllers do one or two functions selected by a power-up button state, which Cook credits for both usability and 10-20 year durability *(p.NIME01-04)*.
- **Prefer standard General MIDI output and a single embedded microcontroller** over custom hardware plus multiple computers and operating systems, on longevity grounds *(p.NIME01-04)*.
- **Prefer wires to wireless** when the performance situation is stationary, because wireless complexity is not justified by the gain *(p.NIME01-05)*.
- **Choose the interface from the model's control requirements**: the accordion is selected for vocal synthesis because breath, pitch, and articulation map naturally onto bellows, keyboard, and left-hand controls *(p.NIME01-06)*.
- **Use sensor audio directly as model excitation** (Nukelele: force sensing resistors supply both pluck position and the audio excitation signal for a plucked string model), rather than reducing the gesture to a parametric event *(p.NIME01-05)*.
- **Invert the naive randomness mapping** so that the easy gesture is the deterministic/attractive one: JavaMug increases algorithmic randomness as pressure *decreases* *(p.NIME01-05)*.
- **Co-design algorithm and controller**, the one durable positive lesson salvaged from HIRN *(p.NIME01-04)*.

## Arguments Against Prior Work
- Against **programmable/reconfigurable computer instruments**: "the programmability of computer-based musical systems often make them too easy to configure, redefine, remap, etc. For programmers and composers, this provides an infinite landscape for experimentation, creativity, writing papers, wasting time, and never actually completing any art projects or compositions" *(p.NIME01-04)*.
- Against **adaptive / "smart" instruments**: "For normal humans, being able to pick up an instrument with a simple obvious interaction and 'play it' only makes logical sense. That the instrument is 'learning from their play and modifying its behavior' often does not make any sense at all, and can be frustrating, paralyzing, or offensive" *(p.NIME01-04)*.
- Against **complex multi-machine system craft**, on durability grounds: such builders "can make no such claims" about working as designed in 10-20 years *(p.NIME01-04)*.
- Against **instrument copying**: principle 3, reinforced by BoSSA — the productive move is leveraging expert technique, not replicating the source instrument *(pp.NIME01-03, NIME01-05)*.
- Against **maximal-bandwidth "super instruments"** built without a composition, via the HIRN negative result *(p.NIME01-04)*.
- Ambivalence toward **MIDI**: principle 7, "MIDI = Miracle, Industry Designed, (In)adequate" — simultaneously credited (used throughout the projects) and marked inadequate *(pp.NIME01-03, NIME01-04)*.
- Against **wireless by default**: principle 9 *(pp.NIME01-03, NIME01-05)*.

## Load-Bearing Propositions
- Performer state-tracking load, not sensing capability, is the binding constraint on real-time control schemes; interaction should be near-stateless. *(p.NIME01-03)*
- Increasing sensed degrees of freedom does not monotonically increase musical usefulness; HIRN is the counterexample. *(p.NIME01-04)*
- A controller project without a specific musical composition to drive it has no completion criterion and no future direction. *(p.NIME01-04)*
- Available performer bandwidth is instrument-specific: trumpet players have spare bandwidth for added switches/sliders; violinists do not, and require remappings of gestures they already make. *(pp.NIME01-03, NIME01-05)*
- An interface should produce attractive output on first, naive contact, and reveal subtlety through continued play (instant music, subtlety later). *(pp.NIME01-03, NIME01-05)*
- Apparent instrument "intelligence" is better achieved by training the user than by adapting the instrument: the JavaMug "doesn't change at all, but rather trains the user." *(p.NIME01-05)*
- Fixed-function, single-microcontroller, standard-MIDI controllers survive on a 10-20 year horizon; custom multi-machine systems do not. *(p.NIME01-04)*
- Algorithms and controllers mutually generate each other (principles 10 and 11), evidenced by PhISEM → shaker controllers → new algorithmic music, and by vocal models → accordion controller. *(pp.NIME01-04, NIME01-06)*
- Human/artistic constraints outlast technological ones: "Some of the technological issues might go away, but not completely or not necessarily very quickly. Many of the human/artistic issues are likely to be with us as long as musical instruments have been." *(p.NIME01-06)*
- The whole enterprise is craft: "Musical interface construction proceeds as more art than science, and possibly this is the only way that it can be done." *(p.NIME01-06)*

## Parameters

This paper reports no numeric parameters, equations, thresholds, or measurements. The only quantities stated are counts and dates, recorded here for completeness.

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Number of stated design principles | — | count | 13 | — | NIME01-03 | 6 human/artistic, 3 technological, 4 other |
| SPASM/Singer continuously controlled parameters | — | count | >40 | — | NIME01-04 | "well over 40"; motivates few-to-many mapping |
| HIRN sensed control channels (Figure 2) | — | count | 9 | 9–11 | NIME01-04 | 9 on-instrument; 11 including 2 optional foot controllers |
| PhISEM embedded microcontrollers per controller | — | count | 1 | — | NIME01-04 | One or two selectable functions, chosen by button state at power-up |
| Nukelele force sensing resistors | — | count | 2 | — | NIME01-05 | Sandwiched linear FSRs under the right hand |
| Projected PhISEM controller service life | — | years | 10 | 10–20 | NIME01-04 | "10 (perhaps 20) years," batteries excepted |
| Author's design experience at time of writing | — | years | 15 | — | NIME01-03 | "over the last 15 years" |

## Figures of Interest
- **Fig 1 (p.NIME01-03):** Interface panel for the Cook/Morrill Trumpet — "MIDI Trumpet Interface Controller Window," with pitch-detector display, period/frequency/tuning readouts, amplitude sensing with threshold and level, trumpet valve and switch sensing, MIDI control panel (mod wheel, pitch bend, MIDI channels, attack/attack-list options), and DSP voice selection.
- **Fig 2 (p.NIME01-04):** The HIRN Meta-Wind Controller — labeled diagram of all sensor positions (pitch detector, breath pressure, lip tension, bite sensor, three rotation controls, control keys, linear slide, optional foot pedals).
- **Fig 3 (p.NIME01-04):** SPASM vocal tract editor — vocal tract shape with nasal cavity, glottal and lip reflection gains, tract section radii sliders, noise/turbulence generator with injection position.
- **Fig 4 (p.NIME01-04):** Few-to-Many Mappings — SPASM shape interpolator, vowel-space/shape-set interpolation panels, and a MIDI control/simulation matrix.
- **Fig 5 (p.NIME01-04):** PhISEM controllers — photograph of the Frog Maraca and related shaker hardware.
- **Fig 6 (p.NIME01-05):** Digital Tapshoe.
- **Fig 7 (p.NIME01-05):** PicoGlove, with seashells.
- **Fig 8 (p.NIME01-05):** P-Ray's Café, with Fillup Glass and Java Mug on a tabletop.
- **Fig 9 (p.NIME01-05):** BoSSA in performance.
- **Fig 10 (p.NIME01-05):** The Nukelele, held under the right hand.
- **Fig 11 (p.NIME01-06):** Squeezevox "Lisa" and "Bart" — two accordion-based vocal controllers.

## Limitations
- The principles are explicitly opinion, not established results: "These are not assumed to be universal, but are rather a set of opinions formed as part of the process of making many musical interfaces" *(p.NIME01-03)*.
- Evidence is a single author's retrospective case series with no controlled evaluation, no user study metrics, and no comparison conditions *(pp.NIME01-03 – NIME01-06)*.
- Validation beyond the author is anecdotal: "many have been verified in talking with other digital instrument designers" *(p.NIME01-06)*.
- The technological principles (7-9) are acknowledged as time-limited: "Some of the technological issues might go away, but not completely or not necessarily very quickly" *(p.NIME01-06)*.
- The domain is conceded to be non-scientific: "more art than science, and possibly this is the only way that it can be done" *(p.NIME01-06)*.

## Relevance to Project

This is a control-surface paper, not a synthesis paper, and it is directly on point for the gestural/real-time control layer of a formant/source-filter speech synthesizer.

- **The few-to-many problem is stated in exactly our terms.** SPASM had "well over 40 continuously controlled parameters" and Cook's verdict after building GUI editors and MIDI fader boxes is that "the voice is a truly difficult 'instrument' to control" *(p.NIME01-04)*. A formant synthesizer with per-formant frequency, bandwidth, amplitude, plus source parameters lands in the same regime. Figure 4's "Few-to-Many Mappings" (shape-set interpolation over a vowel space) is the concrete mitigation: interpolate among named articulatory/formant targets rather than exposing every parameter.
- **SqueezeVox gives a worked control decomposition for a vocal model** *(p.NIME01-06)*: breath → bellows (a continuous, effort-shaped pressure signal), pitch → keyboard, fine pitch and vibrato → linear strip, vibrato depth → aftertouch, vowels/consonants → discrete presets or a continuous pad. For a source-filter engine this maps to: source amplitude/open-quotient from a pressure-like continuous control, F0 from a discrete-plus-continuous pair (coarse note plus fine strip), and formant targets from a low-dimensional continuous vowel-space control with button presets as anchors.
- **Discrete presets plus continuous interpolation is the recommended articulation control**, not per-formant sliders. Cook offers both variants (buttons vs. touch pad/plungers/squeeze) as alternatives on the same instrument *(p.NIME01-06)*.
- **Instant music, subtlety later** translates to a defaults policy: the synthesizer should produce a plausible, attractive voice with no parameter tuning, and reveal expressive nuance under continued manipulation *(pp.NIME01-03, NIME01-05)*. The JavaMug inversion is directly transferable — make the easy gesture yield the deterministic/clean result and put variability at the far end of the control range, rather than the reverse *(p.NIME01-05)*.
- **"Programmability is a curse" is a warning about our own parameter surface** *(p.NIME01-04)*. An engine that exposes every coefficient invites endless remapping and no finished output. Argues for a small number of committed, named control schemes over an infinitely configurable mapping layer.
- **"Smart instruments are often not smart"** argues against adaptive/learned mapping layers that change behavior under the user *(p.NIME01-04)*. The JavaMug precedent says fixed behavior that trains the user is preferable to a model that retrains itself.
- **Co-design of algorithm and controller** *(p.NIME01-04)* supports developing the control scheme alongside the synthesis engine rather than adding a UI at the end.
- **Nukelele's direct-audio excitation** *(p.NIME01-05)* is a template for driving the source of a source-filter model straight from a sensor waveform instead of from a parameterized event, relevant to any real-time excitation input.
- **Principle 3 (leverage expert technique, don't copy)** cautions against replicating a physical vocal tract UI; better to remap gestures a performer already commands.
- **Principle 4 (spare bandwidth)** is a checklist item for any control scheme: a performer already producing text, phrasing, or another instrument has little residual capacity, so controls must ride on gestures already being made.

## Testable / Checkable Properties
- A vocal-model control scheme should be evaluable by whether a naive user produces acceptable output on first contact with no configuration *(pp.NIME01-03, NIME01-05)*.
- Increasing the number of independently exposed synthesis parameters should not be assumed to improve playability; HIRN and SPASM both argue the opposite *(p.NIME01-04)*.
- A control scheme requiring the performer to track hidden state (loop identity, mode, recording status) is predicted to fail in live performance *(p.NIME01-03)*.
- Deterministic output should sit at the high-effort end of a continuous control and variability at the low-effort end, per the JavaMug pressure inversion *(p.NIME01-05)*.
- Fixed-function devices with a single microcontroller and standard MIDI output are predicted to remain functional on a 10-20 year horizon; multi-machine custom systems are not *(p.NIME01-04)*.

## Open Questions
- [ ] The paper gives no quantitative criterion for "too much control bandwidth"; where the HIRN failure threshold sits between the trumpet's few extra switches and HIRN's ~11 channels is unspecified.
- [ ] SqueezeVox's vowel/consonant control is described only as "buttons (presets), or continuous controllers"; the interpolation scheme between presets is not specified here (see [15]).
- [ ] The SPASM "few-to-many" mapping strategy of Figure 4 is shown but not described algorithmically; the shape-space interpolation method must be recovered from [6] or [7].
- [ ] No evaluation methodology is offered for any principle; each is asserted from case outcomes.

## Collection Cross-References

### Already in Collection
- (none - all of Cook's cited references are self-citations to his own unpublished/CMJ/ICMC work, none of which are in this collection)

### New Leads (Not Yet in Collection)
- Cook (1991), "Identification of Control Parameters in an Articulatory Vocal Tract Model, With Applications to the Synthesis of Singing," Stanford PhD dissertation - the source of the few-to-many mapping problem this paper summarizes.
- Cook (1992), "SPASM: a Real-Time Vocal Tract Physical Model Editor/Controller and Singer," Computer Music Journal 17:1 - the system behind the "well over 40 parameters" claim and Figures 3-4.
- Cook (1993), "New Control Strategies for the Singer Articulatory Voice Synthesis System," Stockholm Music Acoustics Conference - direct treatment of the few-to-many mapping problem for voice.
- Cook and Leider (2000), "SqueezeVox: A New Controller for Vocal Synthesis Models," ICMC - full accordion-based vocal control mapping this paper summarizes.
- Cook (1992), "A Meta-Wind-Instrument Physical Model, and a Meta-Controller for Real Time Performance Control," ICMC - the HIRN/WhirlWind co-design case supplying the negative result on control bandwidth.

### Conceptual Links (not citation-based)
- [Software for a Cascade/Parallel Formant Synthesizer](../Klatt_1980_CascadeParallelFormantSynthesizer/notes.md) - Cook's central problem (a voice model with "well over 40 continuously controlled parameters" is "a truly difficult 'instrument' to control") is the exact regime of a Klatt-style synthesizer, whose variable control set alone runs to F0, five formant frequencies, three bandwidths, and half a dozen amplitude parameters updated every 5ms. Cook's mitigation - interpolate among named shape/vowel targets rather than exposing every parameter, per his "Few-to-Many Mappings" figure - is a concrete design recommendation for any real-time control layer built on top of this synthesizer's parameter set.

## Related Work Worth Reading
- **[5] Cook, P.R., "Identification of Control Parameters in an Articulatory Vocal Tract Model, With Applications to the Synthesis of Singing," PhD Dissertation, Stanford, 1991.** The most directly relevant item: control-parameter identification for an articulatory model.
- **[6] Cook, P.R., "SPASM: a Real-Time Vocal Tract Physical Model Editor/Controller and Singer: the Companion Software Synthesis System," Computer Music Journal 17:1, pp 30-44, 1992.** The system behind the "well over 40 parameters" claim and Figures 3-4.
- **[7] Cook, P.R., "New Control Strategies for the Singer Articulatory Voice Synthesis System," Stockholm Music Acoustics Conference, 1993.** Direct treatment of the few-to-many mapping problem for voice.
- **[15] Cook, P.R and Leider, C., "SqueezeVox: A New Controller for Vocal Synthesis Models," Proc. ICMC, 2000.** Full description of the accordion-based vocal control mapping summarized here.
- **[4] Cook, P.R, "A Meta-Wind-Instrument Physical Model, and a Meta-Controller for Real Time Performance Control," Proc ICMC, 1992.** The HIRN/WhirlWind co-design case.

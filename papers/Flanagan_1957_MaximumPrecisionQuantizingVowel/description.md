---
tags: [perception, formants, quantization, psychoacoustics, fundamental-frequency, signal-processing]
---

Flanagan uses psychoacoustic difference limen experiments to estimate the maximum precision needed when digitally quantizing vowel sound parameters (formant frequencies, formant amplitudes, and fundamental frequency). The paper establishes that formant frequencies need no more than ~3% precision, F0 needs ~1% precision, and formant amplitudes need ~1-5 dB precision, yielding a total information content of ~16-20 bits per vowel frame at 20 samples/sec (~300-400 bits/sec). These perceptual bounds remain foundational for speech coding system design and provide principled minimum step sizes for synthesizer parameter scheduling.

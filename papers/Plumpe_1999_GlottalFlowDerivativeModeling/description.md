---
tags:
  - glottal-source
  - lf-model
  - inverse-filtering
  - speaker-characteristics
  - voice-quality
---

This paper presents an automatic technique for estimating and decomposing the glottal flow derivative waveform from speech into coarse structure (fitted via the LF model using NL2SOL nonlinear least-squares regression) and fine structure (aspiration and ripple energy from source-vocal tract interaction), applied to GMM-based speaker identification on TIMIT. The key contributions are a closed-phase detection algorithm based on first-formant modulation stationarity, a complete 7-parameter LF fitting pipeline with physically-motivated bounds, and demonstration that glottal source features contain significant speaker-dependent information that complements traditional vocal tract features (5% error reduction on telephone speech). For speech synthesis, this work provides practical methodology for LF parameter extraction from natural speech, quantifies the source-filter interaction ripple that affects first-formant behavior within pitch periods, and establishes normalized glottal timing parameters (CQ, OQ, RQ) as speaker-characterizing features relevant to voice quality control.

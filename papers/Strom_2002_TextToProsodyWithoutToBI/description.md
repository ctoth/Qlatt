---
tags:
  - prosody
  - tts
  - duration
  - fundamental-frequency
---

Strom (2002) presents a data-driven method for predicting prosodic parameters (phone durations and F0 targets) from preprocessed text, bypassing the need for manual ToBI annotation. The system uses four CARTs (Classification and Regression Trees) trained on a large speech database: two for binary accent/boundary prediction and two for F0 targets and phone duration z-scores. Prosodic labels are created via a bootstrapping/EM-like iterative process that alternates between prosody prediction from text and prosody recognition from text plus acoustics. Evaluated on German TTS voices, the data-driven approach (DataPro) was significantly preferred over hand-crafted rules (ManPro) by a 2:1 ratio in listening tests. Published at ICSLP 2002, AT&T Labs Research.

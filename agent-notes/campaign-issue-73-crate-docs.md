# Goal

Add narrow source-backed module documentation for six remaining crate headers in #73.

# State

Approved documentation-only scope, based on a7ea5308. No runtime changes, tests, or local CI runs.

# Decisions and why

Smallest change: 18–24 module-documentation lines across resonator, antiresonator, impulsive-source, square-source, triangular-source, and tilt-filter. Cite existing klsyn88 implementation functions rather than inventing paper fidelity claims. Preserve all current code, inline references, names, and ABI.

Compared the Rust coefficient/recurrence and waveform code with `C:/Users/Q/src/klsyn/c/parwv.c`: setabc at 758–780, setzeroabc at 799–826, impulsive_source at 494–507, triangular_source at 547–565, square_source at 569–580, tilt recurrence at 160–162 and lookup at 694–711. The three source generators adapt the reference to base-rate processing and normalized amplitudes. Headers identify these limits.

# Surprises

LF already has module citations. Oversampled-glottal-source and aerodynamic-model remain separate documentation work; this slice does not complete the entire nine-crate checklist or adjudicate any paper.

# Next step

Publish for hosted CI and independent Claude review, respond to review, and let the supervisor merge and update #73 bookkeeping.

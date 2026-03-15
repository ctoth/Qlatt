# Abstract

Intelligible English has been synthesized in part "by rule", with a system consisting of a computer programme and an electronic analogue synthesizer. Methods for the synthesis of the various phonetic classes and their transitions are described.

## Interpretation

This paper presents the first practical system for rule-based synthesis of continuous English speech. The authors demonstrate that a computer programme can calculate the time course of nine synthesizer parameters (F0, source switch, three formant frequencies, three formant amplitudes, and high-frequency amplitude) at 10 msec intervals from a phonemic input string plus lookup tables. The key innovation is the transition calculation algorithm: each phonetic element has a "rank" determining which of two adjacent elements controls the formant transitions at their boundary; boundary values are computed from a fixed contribution plus a proportion of the adjacent element's steady-state value; and linear interpolation produces the actual parameter trajectories. This target-plus-transition model with dominance ranking became the foundational paradigm for all subsequent rule-based formant synthesizers.

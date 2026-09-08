# LF jitter and shimmer

The LF source exposes `jitter` (F0 coefficient of variation, percent) and
`shimmer` (cycle amplitude coefficient of variation, percent). Both default to
zero and accept 0–10. They are sampled at cycle boundaries; flutter and DI
remain separate controls. These controls apply to the LF source, including
klsyn88 SS=3, not the oversampled KLGLOTT88 source.

Schoentgen (2001), Model II / Eq. 16 supplies the AR(2) microtremor model:
`v[n] = a1*v[n-1] + a2*v[n-2] + 0.23*e[n]`, with 5 Hz microtremor and
4 Hz bandwidth. The engineering filter realization uses complex poles of
radius `exp(-pi*4/100)` and angle `2*pi*5/100` on a fixed 100 Hz clock,
independent of device rate and F0. Its output is held between clock ticks.
Stationary variance from the Yule-Walker equations normalizes this process;
`F0_out = F0_in * (1 + jitter/100 * normalized_noise)`.

The magnitude is Titze (1991) Eq. 10 CV, **not** Eq. 9 adjacent-cycle JIT.
Normal neurologic F0 variation is about 0.2–0.3%. Wendahl (1963) Table I
explores peak frequency deviations through 10%; the 10% CV control ceiling
is an engineering range informed by that experiment, not a conversion of
peak deviation to CV. Integer sample periods impose a quantization floor,
especially at high pitches and very small requested CV.

Shimmer uses an independently seeded copy of the same filter and multiplies
each cycle's output by `1 + shimmer/100 * normalized_noise`. This is an
engineering analogy with a 0–10% engineering range: Wendahl (1963) did not
measure shimmer and Titze (1991) does not establish an amplitude range.
Both streams advance during silence and with zero controls, preserving a
stable timescale and deterministic output across audio block sizes.

## Migration from the Fraj control

The old jitter input was a normalized 0–100 Fraj (2011) control, **not Hz**
and not percentage CV. Its approximate CV was
`control * 4.5 * sqrt(F0 / sampleRate)` percent, before period rounding.
Nonzero callers must now pass the desired CV directly. There is no universal
conversion because the old magnitude depended on F0 and device rate.

The bundled creaky and whispery presets use 4.5% and 1.125%, engineering
conversions of the old 20 and 5 controls at 110 Hz / 44100 Hz. This preserves
their approximate reference magnitude, not their old uncorrelated waveform.
Neutral defaults remain zero, so neutral audio goldens need no regeneration.
Tests measure emitted cycle CV at 100/200 Hz and 44100/48000 Hz, stationary
filter CV and independence, and actual WASM shimmer routing.

import argparse
import json
import math
import os

import numpy as np


def klatt_resonator_coeffs(freq_hz, bw_hz, sample_rate):
    """Klatt 1980 SETABC coefficients for a resonator (two-pole)."""
    if (
        not math.isfinite(freq_hz)
        or not math.isfinite(bw_hz)
        or not math.isfinite(sample_rate)
        or sample_rate <= 0.0
        or bw_hz <= 0.0
        or freq_hz < 0.0
        or freq_hz >= sample_rate * 0.5
    ):
        return 0.0, 0.0, 0.0
    r = math.exp(-math.pi * bw_hz / sample_rate)
    c = -r * r
    b = 2.0 * r * math.cos(2.0 * math.pi * freq_hz / sample_rate)
    a = 1.0 - b - c
    return a, b, c


def klatt_antiresonator_coeffs(freq_hz, bw_hz, sample_rate):
    """Klatt 1980 SETABC coefficients for a zero pair (two-zero FIR)."""
    a, b, c = klatt_resonator_coeffs(freq_hz, bw_hz, sample_rate)
    if a == 0.0:
        return 0.0, 0.0, 0.0
    a_inv = 1.0 / a
    return a_inv, -a_inv * b, -a_inv * c


def resonator_impulse(sample_rate, freq_hz, bw_hz, gain=1.0, length=256):
    a, b, c = klatt_resonator_coeffs(freq_hz, bw_hz, sample_rate)
    y1 = 0.0
    y2 = 0.0
    out = np.zeros(length, dtype=np.float64)
    for i in range(length):
        x = 1.0 if i == 0 else 0.0
        y = a * x + b * y1 + c * y2
        y2 = y1
        y1 = y
        out[i] = y * gain
    return out


def antiresonator_impulse(sample_rate, freq_hz, bw_hz, gain=1.0, length=256):
    a, b, c = klatt_antiresonator_coeffs(freq_hz, bw_hz, sample_rate)
    x1 = 0.0
    x2 = 0.0
    out = np.zeros(length, dtype=np.float64)
    for i in range(length):
        x = 1.0 if i == 0 else 0.0
        y = a * x + b * x1 + c * x2
        x2 = x1
        x1 = x
        out[i] = y * gain
    return out


def perrotin_rd_to_params(rd, t0):
    """Perrotin 2021 Appendix A re-parameterization."""
    ra = (-1.0 + 4.8 * rd) / 100.0
    rk = (22.4 + 11.8 * rd) / 100.0
    rg_denom = 0.44 * rd - 4.0 * ra * (0.5 + 1.2 * rk)
    if abs(rg_denom) < 1e-9:
        return None
    rg = rk * (0.5 + 1.2 * rk) / rg_denom
    oq = (1.0 + rk) / (2.0 * rg)
    alpha_m = 1.0 / (1.0 + rk)
    ta = ra * t0
    return oq, alpha_m, ta


def perrotin_open_phase_coeffs(sample_rate, t0, oq, alpha_m, amplitude=1.0):
    """Perrotin 2021 Appendix C (Eqs C1-C3) biquad coefficients."""
    tan_term = math.tan(math.pi * (1.0 - alpha_m))
    if abs(tan_term) < 1e-9:
        return None
    fg = 1.0 / (2.0 * oq * t0)
    bg = 1.0 / (oq * t0 * tan_term)
    a1 = -2.0 * math.exp(-math.pi * bg / sample_rate) * math.cos(
        2.0 * math.pi * fg / sample_rate
    )
    a2 = math.exp(-2.0 * math.pi * bg / sample_rate)
    b1 = -amplitude
    b2 = amplitude
    return (b1, b2, a1, a2, fg, bg)


def perrotin_tilt_coeffs(sample_rate, ta):
    """Perrotin 2021 Appendix C (Eqs C5-C6) spectral tilt coefficients."""
    fa = 1.0 / (2.0 * math.pi * ta)
    pole = math.exp(-2.0 * math.pi * fa / sample_rate)
    b_st = 1.0 - pole
    a_st = -pole
    return b_st, a_st, fa


def lf_lm_samples(sample_rate, f0_hz, rd, length=256, amplitude=1.0):
    """Perrotin 2021 LF_LM using causal z^-1 form (Appendix D)."""
    if f0_hz <= 0.0 or rd <= 0.0:
        return np.zeros(length, dtype=np.float64)
    t0 = 1.0 / f0_hz
    params = perrotin_rd_to_params(rd, t0)
    if params is None:
        return np.zeros(length, dtype=np.float64)
    oq, alpha_m, ta = params
    coeffs = perrotin_open_phase_coeffs(sample_rate, t0, oq, alpha_m, amplitude)
    if coeffs is None:
        return np.zeros(length, dtype=np.float64)
    b1, b2, a1, a2, fg, bg = coeffs
    b_st, a_st, fa = perrotin_tilt_coeffs(sample_rate, ta)

    period_len = max(1, int(round(sample_rate / f0_hz)))
    pos_in_period = 0
    y1 = 0.0
    y2 = 0.0
    x1 = 0.0
    x2 = 0.0
    tilt_y1 = 0.0
    out = np.zeros(length, dtype=np.float64)
    for i in range(length):
        if pos_in_period >= period_len:
            pos_in_period = 0
        x = 1.0 if pos_in_period == 0 else 0.0

        # LF_LM open-phase filter (causal z^-1 form).
        y = b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2 = x1
        x1 = x
        y2 = y1
        y1 = y

        # Spectral tilt (causal first-order lowpass).
        tilt = b_st * y - a_st * tilt_y1
        tilt_y1 = tilt
        out[i] = tilt
        pos_in_period += 1
    meta = {
        "fg": fg,
        "bg": bg,
        "fa": fa,
        "a_lm": -math.pi * bg,
        "b_lm": 2.0 * math.pi * fg,
    }
    return out, meta


def lf_calm_samples(sample_rate, f0_hz, rd, length=256, amplitude=1.0):
    """Perrotin 2021 LF_CALM open-phase filter (non-causal z+1 form)."""
    if f0_hz <= 0.0 or rd <= 0.0:
        return np.zeros(length, dtype=np.float64)
    t0 = 1.0 / f0_hz
    params = perrotin_rd_to_params(rd, t0)
    if params is None:
        return np.zeros(length, dtype=np.float64)
    oq, alpha_m, ta = params
    coeffs = perrotin_open_phase_coeffs(sample_rate, t0, oq, alpha_m, amplitude)
    if coeffs is None:
        return np.zeros(length, dtype=np.float64)
    b1, b2, a1, a2, fg, bg = coeffs
    b_st, a_st, fa = perrotin_tilt_coeffs(sample_rate, ta)

    period_len = max(1, int(round(sample_rate / f0_hz)))
    x = np.zeros(length + 2, dtype=np.float64)
    pos = 0
    for i in range(length + 2):
        if pos >= period_len:
            pos = 0
        x[i] = 1.0 if pos == 0 else 0.0
        pos += 1

    y = np.zeros(length, dtype=np.float64)
    y1 = 0.0
    y2 = 0.0
    for i in range(length):
        future = b1 * x[i + 1] + b2 * x[i + 2]
        y0 = future - a1 * y1 - a2 * y2
        y2 = y1
        y1 = y0
        y[i] = y0

    tilt_y1 = 0.0
    out = np.zeros(length, dtype=np.float64)
    for i in range(length):
        tilt = b_st * y[i] - a_st * tilt_y1
        tilt_y1 = tilt
        out[i] = tilt

    meta = {"fg": fg, "bg": bg, "fa": fa}
    return out, meta


def metrics(buf):
    if buf.size == 0:
        return {"rms": 0.0, "peak": 0.0}
    rms = float(np.sqrt(np.mean(buf * buf)))
    peak = float(np.max(np.abs(buf)))
    return {"rms": rms, "peak": peak}


def round_list(values, digits=9):
    return [round(float(v), digits) for v in values]


def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    default_out = os.path.join(repo_root, "test", "golden", "klatt_paper.json")
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default=default_out)
    parser.add_argument("--sample-rate", type=float, default=22050.0)
    args = parser.parse_args()

    sr = args.sample_rate
    resonator = resonator_impulse(sr, 500.0, 60.0, gain=1.0, length=256)
    antiresonator = antiresonator_impulse(sr, 270.0, 100.0, gain=1.0, length=256)
    lf_lm, lf_lm_meta = lf_lm_samples(sr, 110.0, 1.0, length=256, amplitude=1.0)
    lf_calm, lf_calm_meta = lf_calm_samples(sr, 110.0, 1.0, length=256, amplitude=1.0)

    payload = {
        "sampleRate": sr,
        "sources": {
            "klatt1980": "SETABC.FOR (Klatt 1980 resonator/antiresonator)",
            "perrotin2021": "Appendix A/C/D (LF_LM)",
        },
        "resonator": {
            "params": {"frequency": 500.0, "bandwidth": 60.0, "gain": 1.0},
            "impulse": round_list(resonator),
            "metrics": metrics(resonator),
        },
        "antiresonator": {
            "params": {"frequency": 270.0, "bandwidth": 100.0, "gain": 1.0},
            "impulse": round_list(antiresonator),
            "metrics": metrics(antiresonator),
        },
        "lfLm": {
            "params": {"f0": 110.0, "rd": 1.0, "amplitude": 1.0},
            "meta": lf_lm_meta,
            "samples": round_list(lf_lm),
            "metrics": metrics(lf_lm),
        },
        "lfCalm": {
            "params": {"f0": 110.0, "rd": 1.0, "amplitude": 1.0},
            "meta": lf_calm_meta,
            "samples": round_list(lf_calm),
            "metrics": metrics(lf_calm),
        },
    }

    out_path = os.path.abspath(args.out)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()

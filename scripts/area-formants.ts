/**
 * Offline frequency-domain solution of the wave-reflection tube network.
 * Story, Titze & Hoffman 1996, Sec. II A / III C / Table III: piecewise uniform areas.
 * Fant 1960 Eq. A.34-23: alpha = 0.007 sqrt(pi/A) neper/cm.
 * This reduced model uses empirical distributed loss and a pressure-release lip
 * termination with Fant's 0.8r end correction. It does NOT reproduce Story's
 * yielding-wall, viscosity, radiation-resistance or side-branch implementation.
 */
export interface AreaGeometry {
  areas_cm2: number[];
  section_length_cm: number;
  pharynx_fraction: number;
}
export interface TubeSection {
  area_cm2: number;
  length_cm: number;
}
export interface WaveModel {
  sound_speed_cm_s: number;
  attenuation_neper: number;
  lip_end_correction: number;
}
export interface Formant {
  frequency_hz: number;
  bandwidth_hz: number;
}
export const MODEL_ID = "wave-reflection-fant-loss-v1";

function positive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${label} must be positive and finite`);
}

export function scaleGeometry(
  geometry: AreaGeometry,
  speaker: Readonly<Record<string, number>>,
): TubeSection[] {
  positive(geometry.section_length_cm, "section length");
  if (!geometry.areas_cm2.length) throw new Error("area function must contain sections");
  if (!(geometry.pharynx_fraction > 0 && geometry.pharynx_fraction < 1))
    throw new Error("pharynx_fraction must be in (0, 1)");
  for (const field of ["tract_length_scale", "pharynx_scale", "mouth_scale"])
    positive(speaker[field], field);
  const boundary = geometry.areas_cm2.length * geometry.pharynx_fraction;
  const sections: TubeSection[] = [];
  geometry.areas_cm2.forEach((area, index) => {
    positive(area, `area[${index}]`);
    // Split the boundary section exactly; no rounding of the regional lengths.
    const pharynxPart = Math.max(0, Math.min(1, boundary - index));
    for (const [part, factor] of [
      [pharynxPart, speaker.pharynx_scale],
      [1 - pharynxPart, speaker.mouth_scale],
    ]) {
      if (part === 0) continue;
      // Nordstrom 1977 (1975 report), experiment 2: A scales by regional k^2.
      const area_cm2 = area * factor ** 2;
      const length_cm = geometry.section_length_cm * part * speaker.tract_length_scale * factor;
      positive(area_cm2, "scaled area");
      positive(length_cm, "scaled length");
      sections.push({ area_cm2, length_cm });
    }
  });
  return sections;
}

/** Inverse lip-flow/glottal-flow transfer at complex frequency f + i decayHz. */
function denominator(
  frequency: number,
  decayHz: number,
  sections: TubeSection[],
  model: WaveModel,
): [number, number] {
  let plusR = 1,
    plusI = 0,
    minusR = -1,
    minusI = 0;
  const lipArea = sections[sections.length - 1].area_cm2;
  for (let index = sections.length - 1; index >= 0; index--) {
    const section = sections[index];
    // Fant 1960 lip inductance corresponds to an effective extension of 0.8r.
    const length =
      section.length_cm +
      (index === sections.length - 1 ? model.lip_end_correction * Math.sqrt(lipArea / Math.PI) : 0);
    const alpha =
      model.attenuation_neper * Math.sqrt(Math.PI / section.area_cm2) -
      (2 * Math.PI * decayHz) / model.sound_speed_cm_s;
    const phase = (2 * Math.PI * frequency * length) / model.sound_speed_cm_s;
    const c = Math.cos(phase),
      s = Math.sin(phase),
      gain = Math.exp(alpha * length);
    // Reverse propagation: forward wave exp(+gamma L), backward exp(-gamma L).
    const pr = gain * (plusR * c - plusI * s);
    const pi = gain * (plusR * s + plusI * c);
    const mr = (minusR * c + minusI * s) / gain;
    const mi = (-minusR * s + minusI * c) / gain;
    if (index === 0) {
      const real = section.area_cm2 * (pr - mr),
        imag = section.area_cm2 * (pi - mi);
      return [real / (2 * lipArea), imag / (2 * lipArea)];
    }
    // Pressure/volume-flow continuity, expressed with the junction reflection r.
    const leftArea = sections[index - 1].area_cm2;
    const r = (leftArea - section.area_cm2) / (leftArea + section.area_cm2);
    plusR = (pr + r * mr) / (1 + r);
    plusI = (pi + r * mi) / (1 + r);
    minusR = (mr + r * pr) / (1 + r);
    minusI = (mi + r * pi) / (1 + r);
  }
  throw new Error("area function must contain sections");
}

export function deriveFormants(sections: TubeSection[], model: WaveModel): Formant[] {
  if (!sections.length) throw new Error("area function must contain sections");
  sections.forEach((s) => {
    positive(s.area_cm2, "area");
    positive(s.length_cm, "length");
  });
  positive(model.sound_speed_cm_s, "sound speed");
  positive(model.attenuation_neper, "attenuation");
  if (!Number.isFinite(model.lip_end_correction) || model.lip_end_correction < 0)
    throw new Error("invalid lip end correction");
  // Engineering numerical settings: 1 Hz lossless bracketing, 0.001 Hz refinement,
  // 10 continuation steps and 30 Newton iterations per step. Find complex poles,
  // not spectral maxima: overlapping peaks need not have half-power crossings.
  // Fant 1960: sigma = -pi B, so f + i decayHz gives F=f and B=2*decayHz.
  const limit = 10000;
  const lossless = { ...model, attenuation_neper: 0 };
  const results: Formant[] = [];
  let previous = denominator(0, 0, sections, lossless)[0];
  for (let f = 1; f < limit && results.length < 4; f++) {
    const current = denominator(f, 0, sections, lossless)[0];
    if (!Number.isFinite(current)) throw new Error("non-finite wave-reflection spectrum");
    if (previous * current > 0) {
      previous = current;
      continue;
    }
    let lo = f - 1,
      hi = f;
    while (hi - lo > 0.001) {
      const mid = (lo + hi) / 2;
      if (denominator(mid, 0, sections, lossless)[0] * previous > 0) lo = mid;
      else hi = mid;
    }
    previous = current;
    let frequency = (lo + hi) / 2,
      decay = 0;
    for (let step = 1; step <= 10; step++) {
      const partial = { ...model, attenuation_neper: (model.attenuation_neper * step) / 10 };
      let converged = false;
      for (let iteration = 0; iteration < 30; iteration++) {
        const [real, imag] = denominator(frequency, decay, sections, partial);
        const [ar, ai] = denominator(frequency + 0.01, decay, sections, partial);
        const [br, bi] = denominator(frequency - 0.01, decay, sections, partial);
        const dr = (ar - br) / 0.02,
          di = (ai - bi) / 0.02;
        const norm = dr ** 2 + di ** 2;
        const deltaF = (real * dr + imag * di) / norm;
        const deltaD = (imag * dr - real * di) / norm;
        if (!Number.isFinite(deltaF) || !Number.isFinite(deltaD))
          throw new Error("non-finite wave-reflection pole");
        frequency -= deltaF;
        decay -= deltaD;
        if (Math.hypot(deltaF, deltaD) < 0.0001) {
          converged = true;
          break;
        }
      }
      if (!converged) throw new Error(`wave-reflection pole did not converge near ${f} Hz`);
    }
    if (
      !(frequency > 0 && frequency < limit && decay > 0) ||
      (results.length && frequency <= results[results.length - 1].frequency_hz)
    )
      throw new Error(`unresolved or unordered pole near ${f} Hz`);
    results.push({ frequency_hz: frequency, bandwidth_hz: 2 * decay });
  }
  if (results.length !== 4)
    throw new Error(`found only ${results.length} resolved formants below ${limit} Hz`);
  return results;
}

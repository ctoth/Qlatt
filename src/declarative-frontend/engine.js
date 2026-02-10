import { PHONEME_TARGETS } from "../tts-frontend-rules.js";
import { parseDslSpec } from "./parser.js";
import { assertValidSpec } from "./validation.js";

function cloneSequence(sequence) {
  return sequence.map((token) => ({ ...token }));
}

function applyDurationScale(token, scale) {
  if (!token || !Number.isFinite(scale)) return;
  const di = Number.isFinite(token.duration) ? token.duration : 0;
  if (di <= 0) return;
  const dinh = Number.isFinite(token.inherentDuration) ? token.inherentDuration : di;
  const dmin = getIncompressibleMin(token, dinh);
  const df = scale * (di - dmin) + dmin;
  token.duration = Math.round(Math.max(dmin, df));
}

function applyDurationFloor(token) {
  if (!token || !Number.isFinite(token.duration)) return;
  const dinh = Number.isFinite(token.inherentDuration) ? token.inherentDuration : token.duration;
  const dmin = getIncompressibleMin(token, dinh);
  token.duration = Math.round(Math.max(dmin, token.duration));
}

function getIncompressibleMin(token, inherent) {
  if (!Number.isFinite(inherent) || inherent <= 0) return 0;
  const ratio = token?.type === "vowel" ? 0.42 : 0.6;
  return inherent * ratio;
}

function ruleInsertStopReleases(sequence) {
  const nextSequence = [];
  const releaseMap = {
    P_CL: "P_REL",
    T_CL: "T_REL",
    K_CL: "K_REL",
    B_CL: "B_REL",
    D_CL: "D_REL",
    G_CL: "G_REL",
  };
  const aspirationMap = {
    P_REL: "P_ASP",
    T_REL: "T_ASP",
    K_REL: "K_ASP",
  };

  for (let i = 0; i < sequence.length; i += 1) {
    const current = sequence[i];
    nextSequence.push(current);

    const releasePhoneme = releaseMap[current.phoneme];
    if (!releasePhoneme) continue;

    let addRelease = true;
    const next = sequence[i + 1];
    if (next) {
      const nextTarget =
        PHONEME_TARGETS[next.phoneme + "1"] ||
        PHONEME_TARGETS[next.phoneme + "0"] ||
        PHONEME_TARGETS[next.phoneme];

      if (next.phoneme === "SIL" || nextTarget?.type?.includes("stop")) {
        addRelease = false;
      }
    }

    if (addRelease) {
      nextSequence.push({ phoneme: releasePhoneme, stress: current.stress });
      const aspiration = aspirationMap[releasePhoneme];
      if (aspiration) {
        nextSequence.push({ phoneme: aspiration, stress: current.stress });
      }
      continue;
    }

    if (next?.phoneme === "SIL") {
      nextSequence.push({ phoneme: releasePhoneme, stress: current.stress, weak: true });
      const aspiration = aspirationMap[releasePhoneme];
      if (aspiration) {
        nextSequence.push({ phoneme: aspiration, stress: current.stress, weak: true });
      }
    }
  }

  return nextSequence;
}

function ruleStressDuration(sequence) {
  const STRESS_FACTOR = 1.3;
  const UNSTRESSED_FACTOR = 0.8;

  for (const token of sequence) {
    if (token.type === "vowel") {
      if (token.stress === 1) applyDurationScale(token, STRESS_FACTOR);
      else if (token.stress === 0) applyDurationScale(token, UNSTRESSED_FACTOR);
    }
    applyDurationFloor(token);
  }
  return sequence;
}

function ruleVowelShortening(sequence) {
  const SHORTENING_FACTOR = 0.7;
  const FRIC_SHORTENING = 0.85;
  const PREPAUSAL_LENGTHENING = 1.2;

  for (let i = 0; i < sequence.length; i += 1) {
    const current = sequence[i];
    if (!current || current.type !== "vowel") continue;
    const next = sequence[i + 1];
    if (!next) {
      applyDurationScale(current, PREPAUSAL_LENGTHENING);
      continue;
    }

    const nextTarget =
      PHONEME_TARGETS[next.phoneme + "1"] ||
      PHONEME_TARGETS[next.phoneme + "0"] ||
      PHONEME_TARGETS[next.phoneme];

    if (!nextTarget) continue;
    if (nextTarget.type?.includes("stop") && nextTarget.voiceless) {
      applyDurationScale(current, SHORTENING_FACTOR);
    } else if (nextTarget.type === "fricative" && nextTarget.voiceless) {
      applyDurationScale(current, FRIC_SHORTENING);
    } else if (next.phoneme === "SIL") {
      applyDurationScale(current, PREPAUSAL_LENGTHENING);
    }
  }
  return sequence;
}

function rulePreBoundaryLengthening(sequence) {
  const PHRASE_FINAL_FACTOR = 1.4;
  const WORD_FINAL_FACTOR = 1.1;

  for (let i = 0; i < sequence.length; i += 1) {
    const current = sequence[i];
    const next = sequence[i + 1];

    if (current.phoneme === "SIL") continue;

    const isBeforePhraseBreak = next?.phoneme === "SIL" && next?.punctuationSymbol;
    if (isBeforePhraseBreak || (!next && current.phoneme !== "SIL")) {
      applyDurationScale(current, PHRASE_FINAL_FACTOR);
      continue;
    }

    if (next && current.word && next.word && current.word !== next.word && next.phoneme !== "SIL") {
      applyDurationScale(current, WORD_FINAL_FACTOR);
    }
  }

  return sequence;
}

function applyRule(rule, sequence) {
  switch (rule.op) {
    case "insert_stop_releases":
      return ruleInsertStopReleases(sequence);
    case "stress_duration":
      return ruleStressDuration(sequence);
    case "vowel_shortening":
      return ruleVowelShortening(sequence);
    case "pre_boundary_lengthening":
      return rulePreBoundaryLengthening(sequence);
    default:
      throw new Error(`Unsupported declarative slice rule op '${rule.op}'`);
  }
}

export function runRuleEngine(sequence, specSource, options = {}) {
  const spec = parseDslSpec(specSource);
  const diagnostics = assertValidSpec(spec);

  const selectedPhases = Array.isArray(options.phases) && options.phases.length > 0
    ? new Set(options.phases)
    : null;

  const trace = [];
  let current = cloneSequence(sequence);

  for (const phase of spec.phases) {
    if (selectedPhases && !selectedPhases.has(phase.name)) continue;
    trace.push({ type: "phase_start", phase: phase.name });
    for (const ruleName of phase.rules) {
      const rule = spec.rules[ruleName];
      trace.push({ type: "rule_start", phase: phase.name, rule: ruleName });
      current = applyRule(rule, current);
      trace.push({ type: "rule_end", phase: phase.name, rule: ruleName });
    }
    trace.push({ type: "phase_end", phase: phase.name });
  }

  return {
    sequence: current,
    diagnostics,
    trace,
  };
}

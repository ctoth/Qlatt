export const QLATT_V11_SLICE_RULEPACK = {
  version: "v11-slice",
  parameters: {
    base_f0: 110,
    fall_rate_hz: 20,
    stress_rise: 1.15,
    question_rise_hz: 30,
  },
  streams: {
    phone: {
      type: "base",
      scalars: {
        duration: { unit: "ms", resolution: "klatt", max: 500 },
      },
    },
    f0: {
      type: "point",
      value_type: "number",
      unit: "Hz",
    },
  },
  phases: [
    {
      name: "structural",
      rules: ["insert_stop_releases"],
    },
    {
      name: "duration",
      rules: [
        "k_context_cl_f2",
        "k_context_rel_copy",
        "punctuation_pause",
        "stress_duration",
        "vowel_shortening",
        "pre_boundary_lengthening",
        "lock_stop_release_duration",
        "sw_explicit_override",
        "sw_default_assignment",
      ],
      resolve_scalars: ["duration"],
    },
    {
      name: "prosody",
      rules: ["f0_baseline_start", "f0_targets", "f0_stress_peak", "f0_question_rise"],
    },
    {
      name: "finalize",
      after: ["duration", "prosody"],
      rules: [],
      compute_times: true,
      resolve_points: ["f0"],
    },
  ],
  rules: {
    insert_stop_releases: {
      kind: "structural",
      op: "insert_stop_releases",
      citation: "Stevens 1998 Ch.8",
    },
    stress_duration: {
      kind: "scalar",
      citation: "Klatt 1976 §III.B",
      select: {
        stream: "phone",
        where: "current.type = 'vowel'",
      },
      apply: [
        {
          field: "duration",
          op: "mul",
          value: "current.stress = 1 ? 1.3 : (current.stress = 0 ? 0.8 : 1)",
          tag: "stress",
        },
      ],
    },
    k_context_cl_f2: {
      kind: "scalar",
      citation: "Allen et al. 1987 Ch.11 (velar locus)",
      select: {
        stream: "phone",
        where: "current.phoneme = 'K_CL'",
      },
      apply: [
        {
          field: "params.F2",
          op: "set",
          value:
            "($cand := ($next(current) != null and $next(current).phoneme = 'K_REL' ? $next($next(current)) : $next(current)); $cand != null and $cand.type = 'vowel' ? ($cand.back ? 1200 : (($cand.front or $cand.hi) ? 1900 : 1500)) : 1500)",
        },
      ],
    },
    k_context_rel_copy: {
      kind: "scalar",
      citation: "Allen et al. 1987 Ch.11 (velar locus transitions)",
      select: {
        stream: "phone",
        where:
          "current.phoneme = 'K_REL' and $prev(current) != null and $prev(current).phoneme = 'K_CL'",
      },
      apply: [
        {
          field: "params.F2",
          op: "set",
          value: "$exists($prev(current).params.F2) ? $prev(current).params.F2 : 1500",
        },
      ],
    },
    punctuation_pause: {
      kind: "scalar",
      citation: "Allen et al. 1987 Ch.8 (pause insertion)",
      select: {
        stream: "phone",
        where: "current.phoneme = 'SIL' and $exists(current.punctuationSymbol)",
      },
      apply: [
        {
          field: "duration",
          op: "set",
          value:
            "current.punctuationSymbol = ',' ? 150 : ((current.punctuationSymbol = '.' or current.punctuationSymbol = '?' or current.punctuationSymbol = '!') ? 300 : current.duration)",
        },
      ],
    },
    vowel_shortening: {
      kind: "scalar",
      citation: "Chen 1970; Wells 1990",
      select: {
        stream: "phone",
        where: "current.type = 'vowel'",
      },
      apply: [
        {
          field: "duration",
          op: "mul",
          value:
            "($n := $next(current); $n = null or $n.phoneme = 'SIL' ? 1.2 : (($n.voiceless = true and ($n.type = 'stop' or $n.type = 'stop_closure')) ? 0.7 : (($n.voiceless = true and $n.type = 'fricative') ? 0.85 : 1)))",
          tag: "segmental_context",
        },
      ],
    },
    pre_boundary_lengthening: {
      kind: "scalar",
      citation: "Klatt 1976 §III.A",
      select: {
        stream: "phone",
        where: "current.phoneme != 'SIL'",
      },
      apply: [
        {
          field: "duration",
          op: "mul",
          value:
            "($n := $next(current); ($n = null or ($n.phoneme = 'SIL' and $exists($n.punctuationSymbol))) ? 1.4 : (($n != null and $n.phoneme != 'SIL' and $exists(current.word) and $exists($n.word) and current.word != $n.word) ? 1.1 : 1))",
          tag: "boundary",
        },
      ],
    },
    lock_stop_release_duration: {
      kind: "scalar",
      citation: "Allen et al. 1987 Table C-1 (fixed burst/aspiration durations)",
      select: {
        stream: "phone",
        where: "current.type = 'stop_release' or current.type = 'stop_aspiration'",
      },
      apply: [
        {
          field: "duration",
          op: "set",
          value: "$exists(current.inherentDuration) ? current.inherentDuration : current.duration",
        },
      ],
    },
    sw_explicit_override: {
      kind: "scalar",
      citation: "Klatt 1980 (SW switch); Allen et al. 1987 Table 12-1",
      select: {
        stream: "phone",
        where: "$exists(current.inventorySW)",
      },
      apply: [
        {
          field: "params.SW",
          op: "set",
          value: "current.inventorySW",
        },
      ],
    },
    sw_default_assignment: {
      kind: "scalar",
      citation: "Klatt 1980 (cascade/parallel source routing)",
      select: {
        stream: "phone",
        where: "$not($exists(current.inventorySW))",
      },
      apply: [
        {
          field: "params.SW",
          op: "set",
          value:
            "(current.type = 'fricative' or current.type = 'affricate' or current.type = 'stop_release' or current.type = 'stop_aspiration') ? 1 : 0",
        },
      ],
    },
    f0_baseline_start: {
      kind: "point",
      citation: "Pierrehumbert 1980; O'Shaughnessy 1976",
      select: {
        stream: "phone",
        where: "$prev(current) = null",
      },
      insert_point: {
        stream: "f0",
        at: "$at_sync(current.sync_left)",
        value: "params.base_f0",
        tag: "f0_baseline",
      },
    },
    f0_targets: {
      kind: "point",
      citation: "Pierrehumbert 1980; Allen et al. 1987; O'Shaughnessy 1976",
      select: {
        stream: "phone",
        where: "current.phoneme != 'SIL' and (current.params.AV > 0 or current.params.AVS > 0)",
      },
      insert_point: {
        stream: "f0",
        at: "$at_sync(current.sync_right)",
        value:
          "$max([((params.base_f0 - params.fall_rate_hz * (($phrase_total(current) <= 1) ? 0 : ($phrase_index(current) / ($phrase_total(current) - 1)))) * ($exists(current.params.F0_Factor) ? current.params.F0_Factor : 1)), params.base_f0 * 0.6])",
        tag: "f0_declination",
      },
    },
    f0_stress_peak: {
      kind: "point",
      citation: "O'Shaughnessy 1976; Allen et al. 1987",
      select: {
        stream: "phone",
        where: "current.type = 'vowel' and current.stress = 1 and (current.params.AV > 0 or current.params.AVS > 0)",
      },
      insert_point: {
        stream: "f0",
        at: "$at_ratio(current, 0.45)",
        value: "($prev_point('f0') = null ? params.base_f0 : $prev_point('f0').value) * params.stress_rise",
        tag: "f0_stress",
      },
    },
    f0_question_rise: {
      kind: "point",
      citation: "Pierrehumbert 1980; Ladd 2008; O'Shaughnessy 1976",
      select: {
        stream: "phone",
        where: "current.phoneme = 'SIL' and current.punctuationSymbol = '?'",
      },
      insert_point: {
        stream: "f0",
        at: "$at_sync(current.sync_left)",
        value: "($prev_point('f0') = null ? params.base_f0 : $prev_point('f0').value) + params.question_rise_hz",
        tag: "f0_question",
      },
    },
  },
};

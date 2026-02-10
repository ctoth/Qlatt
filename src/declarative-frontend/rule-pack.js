export const QLATT_V11_SLICE_RULEPACK = {
  version: "v11-slice",
  phases: [
    {
      name: "structural",
      rules: ["insert_stop_releases"],
    },
    {
      name: "duration",
      rules: ["stress_duration", "vowel_shortening", "pre_boundary_lengthening"],
      resolve_scalars: ["duration"],
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
      op: "stress_duration",
      citation: "Klatt 1976 §III.B",
    },
    vowel_shortening: {
      kind: "scalar",
      op: "vowel_shortening",
      citation: "Chen 1970; Wells 1990",
    },
    pre_boundary_lengthening: {
      kind: "scalar",
      op: "pre_boundary_lengthening",
      citation: "Klatt 1976 §III.A",
    },
  },
};

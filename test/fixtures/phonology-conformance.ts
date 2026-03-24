export type NormalizationConformanceCase = {
  name: string;
  input: string;
  expected: string;
};

export type FullPipelineWordCase = {
  name: string;
  input: string;
  word: string;
  occurrence?: number;
  transcribe?: {
    exactPhonemes?: string[];
  };
  track?: {
    mustContain?: string[];
    mustNotContain?: string[];
    exactPhonemes?: string[];
    primaryStressCount?: number;
  };
};

export const NORMALIZATION_CONFORMANCE_CASES: NormalizationConformanceCase[] = [
  {
    name: "dotted_initialism",
    input: "U.S. policy",
    expected: "u s policy",
  },
  {
    name: "comma_and_exclamation_spacing",
    input: "Hello, world!",
    expected: "hello , world !",
  },
  {
    name: "preserve_contraction_apostrophe",
    input: "we're talking",
    expected: "we're talking",
  },
];

export const FULL_PIPELINE_WORD_CASES: FullPipelineWordCase[] = [
  {
    name: "the_prevocalic_reduction_applies",
    input: "the apple",
    word: "the",
    occurrence: 0,
    transcribe: {
      exactPhonemes: ["DH", "AH"],
    },
    track: {
      mustContain: ["IH"],
      mustNotContain: ["AH"],
    },
  },
  {
    name: "the_prevocalic_reduction_blocked_before_consonant",
    input: "the dog",
    word: "the",
    occurrence: 0,
    transcribe: {
      exactPhonemes: ["DH", "AH"],
    },
    track: {
      mustContain: ["AH"],
      mustNotContain: ["IH"],
    },
  },
  {
    name: "butter_flaps_t",
    input: "butter",
    word: "butter",
    occurrence: 0,
    track: {
      mustContain: ["DX"],
      mustNotContain: ["T", "T_CL"],
    },
  },
  {
    name: "water_flaps_t",
    input: "water",
    word: "water",
    occurrence: 0,
    track: {
      mustContain: ["DX"],
      mustNotContain: ["T", "T_CL"],
    },
  },
  {
    name: "about_has_single_primary_stress_after_diphthong_expansion",
    input: "about",
    word: "about",
    occurrence: 0,
    transcribe: {
      exactPhonemes: ["AH", "B", "AW", "T"],
    },
    track: {
      mustContain: ["W"],
      mustNotContain: ["UH0"],
      primaryStressCount: 1,
    },
  },
  {
    name: "post_has_single_primary_stress_after_diphthong_expansion",
    input: "post",
    word: "post",
    occurrence: 0,
    transcribe: {
      exactPhonemes: ["P", "OW", "S", "T"],
    },
    track: {
      mustContain: ["W"],
      mustNotContain: ["UH0"],
      primaryStressCount: 1,
    },
  },
  {
    name: "five_has_single_primary_stress_after_diphthong_expansion",
    input: "five",
    word: "five",
    occurrence: 0,
    transcribe: {
      exactPhonemes: ["F", "AY", "V"],
    },
    track: {
      mustContain: ["Y"],
      mustNotContain: ["IH0"],
      primaryStressCount: 1,
    },
  },
  {
    name: "ago_has_single_primary_stress_after_diphthong_expansion",
    input: "ago",
    word: "ago",
    occurrence: 0,
    transcribe: {
      exactPhonemes: ["AH", "G", "OW"],
    },
    track: {
      mustContain: ["W"],
      mustNotContain: ["UH0"],
      primaryStressCount: 1,
    },
  },
  {
    name: "no_has_single_primary_stress_after_diphthong_expansion",
    input: "no",
    word: "no",
    occurrence: 0,
    transcribe: {
      exactPhonemes: ["N", "OW"],
    },
    track: {
      mustContain: ["W"],
      mustNotContain: ["UH0"],
      primaryStressCount: 1,
    },
  },
  {
    name: "why_uses_glide_offglide_in_track",
    input: "why",
    word: "why",
    occurrence: 0,
    transcribe: {
      exactPhonemes: ["W", "AY"],
    },
    track: {
      mustContain: ["Y"],
      mustNotContain: ["IH0"],
      primaryStressCount: 1,
    },
  },
  {
    name: "sound_uses_glide_offglide_in_track",
    input: "sound",
    word: "sound",
    occurrence: 0,
    transcribe: {
      exactPhonemes: ["S", "AW", "N", "D"],
    },
    track: {
      mustContain: ["W"],
      mustNotContain: ["UH0"],
      primaryStressCount: 1,
    },
  },
  {
    name: "so_uses_glide_offglide_in_track",
    input: "so",
    word: "so",
    occurrence: 0,
    transcribe: {
      exactPhonemes: ["S", "OW"],
    },
    track: {
      mustContain: ["W"],
      mustNotContain: ["UH0"],
      primaryStressCount: 1,
    },
  },
];

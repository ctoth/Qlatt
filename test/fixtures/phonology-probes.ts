export type ProbeWordTrackExpectation = {
  mustContain?: string[];
  mustNotContain?: string[];
  transcriptionExact?: string[];
  minMaxParam?: Record<string, number>;
};

export type ProbeWordRhoticExpectation = {
  erPhoneme: string;
  tailPhoneme: string;
  tailLowerParams: string[];
};

export type PhonologyProbeCase = {
  name: string;
  phrase: string;
  words?: Array<{
    word: string;
    occurrence?: number;
    track?: ProbeWordTrackExpectation;
    rhotic?: ProbeWordRhoticExpectation;
  }>;
};

export const PHONOLOGY_PROBE_CASES: PhonologyProbeCase[] = [
  {
    name: "diphthong_glides_hold_up_in_context",
    phrase: "Why do you sound so weird?",
    words: [
      {
        word: "why",
        track: {
          transcriptionExact: ["W", "AY"],
          mustContain: ["Y"],
          mustNotContain: ["IH0"],
        },
      },
      {
        word: "sound",
        track: {
          transcriptionExact: ["S", "AW", "N", "D"],
          mustContain: ["W"],
          mustNotContain: ["UH0"],
          minMaxParam: {
            AF: 60,
          },
        },
      },
      {
        word: "so",
        track: {
          transcriptionExact: ["S", "OW"],
          mustContain: ["W"],
          mustNotContain: ["UH0"],
          minMaxParam: {
            AF: 60,
          },
        },
      },
    ],
  },
  {
    name: "spelling_mode_preserves_letter_names",
    phrase: "B A N A N A S!",
    words: [
      {
        word: "b",
        track: {
          transcriptionExact: ["B", "IY"],
        },
      },
      {
        word: "a",
        occurrence: 0,
        track: {
          transcriptionExact: ["EY"],
          mustContain: ["EH1", "Y"],
          mustNotContain: ["AH"],
        },
      },
      {
        word: "n",
        occurrence: 0,
        track: {
          transcriptionExact: ["EH", "N"],
        },
      },
      {
        word: "s",
        occurrence: 0,
        track: {
          transcriptionExact: ["EH", "S"],
        },
      },
    ],
  },
  {
    name: "dentals_and_rhotics_survive_a_probe_phrase",
    phrase: "Thin thieves thought that they thrilled those other brothers.",
    words: [
      {
        word: "thin",
        track: {
          mustContain: ["TH"],
          minMaxParam: {
            AF: 44,
            AB: 48,
          },
        },
      },
      {
        word: "that",
        track: {
          mustContain: ["DH"],
          minMaxParam: {
            AF: 34,
            AB: 48,
          },
        },
      },
      {
        word: "other",
        track: {
          mustContain: ["ER", "R"],
        },
      },
      {
        word: "brothers",
        track: {
          mustContain: ["ER", "R"],
        },
      },
    ],
  },
  {
    name: "rhotic_tail_probe_stays_dynamic",
    phrase: "other mother heard",
    words: [
      {
        word: "other",
        track: {
          mustContain: ["ER", "R"],
        },
        rhotic: {
          erPhoneme: "ER",
          tailPhoneme: "R",
          tailLowerParams: ["F2", "F3"],
        },
      },
      {
        word: "mother",
        track: {
          mustContain: ["ER", "R"],
        },
        rhotic: {
          erPhoneme: "ER",
          tailPhoneme: "R",
          tailLowerParams: ["F2", "F3"],
        },
      },
      {
        word: "heard",
        track: {
          mustContain: ["ER", "R"],
        },
        rhotic: {
          erPhoneme: "ER",
          tailPhoneme: "R",
          tailLowerParams: ["F2", "F3"],
        },
      },
    ],
  },
];

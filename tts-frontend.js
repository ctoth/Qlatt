
import { dictionary as CMU_DICT } from "cmu-pronouncing-dictionary";
import {
  BASE_PARAMS,
  PHONEME_TARGETS,
  fillDefaultParams,
  rule_GenerateF0Contour,
  rule_K_Context,
  rule_StressDuration,
  rule_VowelShortening,
} from "./tts-frontend-rules.js"; // Import BASE_PARAMS too

// --- Text Normalization & numberToWords --- (Keep as is)
function normalizeText(text) {
  /* ... */
  let normalized = text.toLowerCase();
  normalized = normalized.replace(/(\d+)/g, (match) =>
    numberToWords(parseInt(match))
  );
  normalized = normalized.replace(/,/g, " , ");
  normalized = normalized.replace(/\./g, " . ");
  normalized = normalized.replace(/\?/g, " ? ");
  normalized = normalized.replace(/!/g, " ! ");
  normalized = normalized.replace(/\s+/g, " ").trim();
  return normalized;
}
function numberToWords(num) {
  /* ... */
  const ones = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
  ];
  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];
  const teens = [
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  if (num === 0) return "zero";
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100)
    return (
      tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "")
    );
  return String(num);
}

// --- Phonetic Transcription --- (Keep as is)
function transcribeText(text) {
  /* ... */
  const words = text.split(" ");
  const phonemeSequence = [];
  const punctuation = [",", ".", "?", "!"];
  for (const word of words) {
    /* ... lookup logic ... */
    if (punctuation.includes(word)) {
      phonemeSequence.push({
        phoneme: "SIL",
        stress: null,
        isPunctuation: true,
        symbol: word,
      });
      continue;
    }
    if (!word) continue;
    const lowerWord = word.toLowerCase();
    let pronunciation = CMU_DICT[lowerWord];
    if (!pronunciation && lowerWord.includes("(")) {
      pronunciation = CMU_DICT[lowerWord.replace(/\(\d+\)$/, "")];
    }
    if (pronunciation) {
      /* ... split and push phones/stress ... */
      const phones = pronunciation.split(" ");
      for (const phoneWithStress of phones) {
        const match = phoneWithStress.match(/^([A-Z]+)(\d)?$/);
        if (match)
          phonemeSequence.push({
            phoneme: match[1],
            stress: match[2] ? parseInt(match[2]) : null,
          });
        else if (phoneWithStress === "SIL")
          phonemeSequence.push({ phoneme: "SIL", stress: null });
      }
    } else {
      console.warn(`Word "${word}" not found. Skipping.`);
      phonemeSequence.push({ phoneme: "SIL", stress: null, duration: 50 });
    }
  }
  return phonemeSequence;
}

// --- Stop Release Rule --- (Keep as is)
function insertStopReleases(phonemeList) {
  /* ... */
  const newList = [];
  const releaseMap = {
    P_CL: "P_REL",
    T_CL: "T_REL",
    K_CL: "K_REL",
    B_CL: "B_REL",
    D_CL: "D_REL",
    G_CL: "G_REL",
  };
  for (let i = 0; i < phonemeList.length; i++) {
    const current = phonemeList[i];
    newList.push(current);
    const releasePhoneme = releaseMap[current.phoneme];
    if (releasePhoneme) {
      let addRelease = true;
      if (phonemeList[i + 1]) {
        const nextPhKey = phonemeList[i + 1].phoneme;
        const nextPhTarget =
          PHONEME_TARGETS[nextPhKey + "1"] ||
          PHONEME_TARGETS[nextPhKey + "0"] ||
          PHONEME_TARGETS[nextPhKey];
        if (
          phonemeList[i + 1].phoneme === "SIL" ||
          nextPhTarget?.type?.includes("stop")
        ) {
          addRelease = false;
        }
      }
      if (addRelease) {
        newList.push({ phoneme: releasePhoneme, stress: current.stress });
      }
    }
  }
  return newList;
}

// --- Main Pipeline ---
export function textToKlattTrack(inputText, baseF0 = 110, transitionMs = 30) {
  console.log("Input Text:", inputText);
  const normalized = normalizeText(inputText);
  console.log("Normalized:", normalized);
  let phonemeSequence = transcribeText(normalized);
  console.log(
    "Initial Phonemes:",
    phonemeSequence
      .map((p) => p.phoneme + (p.stress !== null ? p.stress : ""))
      .join(" ")
  );

  // --- Prepare Parameter Sequence (UPDATED Target Lookup Logic) ---
  let parameterSequence = phonemeSequence.map((ph) => {
    let targetKeyBase = ph.phoneme;
    let isStopClosure = false;
    if (["P", "T", "K", "B", "D", "G"].includes(targetKeyBase)) {
      targetKeyBase += "_CL";
      isStopClosure = true;
    }

    // Determine lookup key: Vowels use stress, Consonants ignore stress for lookup
    let baseTarget;
    const targetInfoBase =
      PHONEME_TARGETS[targetKeyBase + "1"] ||
      PHONEME_TARGETS[targetKeyBase + "0"] ||
      PHONEME_TARGETS[targetKeyBase]; // Check base first
    const isVowel = targetInfoBase?.type === "vowel";

    if (isVowel) {
      let stressMarker = ph.stress === 1 ? "1" : "0"; // Default null/2 stress to 0
      let targetKey = targetKeyBase + stressMarker;
      baseTarget = PHONEME_TARGETS[targetKey];
      // Fallback for vowels if specific stress variant missing
      if (!baseTarget) {
        let fallbackStressMarker = stressMarker === "1" ? "0" : "1";
        baseTarget = PHONEME_TARGETS[targetKeyBase + fallbackStressMarker];
      }
    } else {
      // For consonants, try finding *any* entry (ignore stress marker initially)
      baseTarget =
        PHONEME_TARGETS[targetKeyBase + "1"] ||
        PHONEME_TARGETS[targetKeyBase + "0"] ||
        PHONEME_TARGETS[targetKeyBase];
    }

    // Handle punctuation and final fallback
    if (!baseTarget && ph.isPunctuation) {
      baseTarget = PHONEME_TARGETS["SIL"];
      ph.phoneme = "SIL";
    } else if (!baseTarget) {
      console.warn(
        `No baseline target found for ${targetKeyBase} (Stress: ${ph.stress}). Using SIL.`
      );
      baseTarget = PHONEME_TARGETS["SIL"];
      ph.phoneme = "SIL";
    }

    return {
      phoneme: ph.phoneme,
      stress: ph.stress,
      // Fill defaults based on the FOUND target (or SIL if fallback)
      params: fillDefaultParams(baseTarget),
      duration: baseTarget.dur || 100,
      punctuationSymbol: ph.isPunctuation ? ph.symbol : null,
    };
  });

  // --- Apply Rules ---
  parameterSequence = insertStopReleases(parameterSequence);
  // Re-fill params/durations for inserted releases and add type flags
  parameterSequence = parameterSequence.map((ph) => {
    if (!ph.params) {
      // If it's a newly inserted release
      let targetKeyBase = ph.phoneme;
      // For releases, lookup without stress marker first
      let baseTarget = PHONEME_TARGETS[targetKeyBase];

      if (!baseTarget) {
        console.warn(
          `No target found for inserted release ${ph.phoneme}. Using SIL.`
        );
        baseTarget = PHONEME_TARGETS["SIL"];
        ph.phoneme = "SIL";
      }
      ph.params = fillDefaultParams(baseTarget);
      ph.duration = baseTarget.dur || 30;
    }
    // Ensure type flags are present
    const targetLookupKey =
      ph.phoneme + (ph.type === "vowel" && ph.stress === 1 ? "1" : "0"); // Use stress for vowel flags
    const targetInfo =
      PHONEME_TARGETS[targetLookupKey] ||
      PHONEME_TARGETS[ph.phoneme + "1"] ||
      PHONEME_TARGETS[ph.phoneme + "0"] ||
      PHONEME_TARGETS[ph.phoneme];
    if (targetInfo) Object.assign(ph, targetInfo); // Copy flags like 'type', 'voiced' etc.
    ph.params =
      ph.params || fillDefaultParams(targetInfo || PHONEME_TARGETS["SIL"]); // Ensure params filled

    return ph;
  });

  parameterSequence = rule_K_Context(parameterSequence);
  parameterSequence.forEach((ph) => {
    /* Punctuation pause adjustments */
    if (ph.phoneme === "SIL" && ph.punctuationSymbol) {
      if (ph.punctuationSymbol === ",") ph.duration = 150;
      else if ([".", "?", "!"].includes(ph.punctuationSymbol))
        ph.duration = 300;
    }
  });
  parameterSequence = rule_StressDuration(parameterSequence);
  parameterSequence = rule_VowelShortening(parameterSequence);

  // --- Generate F0 ---
  const f0Contour = rule_GenerateF0Contour(parameterSequence, baseF0);
  // console.log("F0 Contour:", f0Contour.map(p => `(${p.time.toFixed(3)}s, ${p.f0.toFixed(1)}Hz)`).join(' '));

  // --- Generate Final Klatt Track (FILTER PARAMS) ---
  const klattTrack = [];
  let currentTime = 0;
  function getF0AtTime(time) {
    /* ... (same interpolation) ... */
    if (!f0Contour || f0Contour.length === 0) return 0;
    for (let i = 0; i < f0Contour.length - 1; i++) {
      const p1 = f0Contour[i];
      const p2 = f0Contour[i + 1];
      if (time >= p1.time && time <= p2.time) {
        if (Math.abs(p2.time - p1.time) < 1e-6) return p1.f0;
        const fraction = (time - p1.time) / (p2.time - p1.time);
        return p1.f0 + fraction * (p2.f0 - p1.f0);
      }
    }
    return f0Contour[f0Contour.length - 1].f0;
  }

  // Get the set of valid Klatt parameter keys from BASE_PARAMS
  const validKlattParamKeys = Object.keys(BASE_PARAMS);

  // Start silent
  let initialSilentParams = fillDefaultParams(PHONEME_TARGETS["SIL"]);
  let filteredInitialParams = {};
  validKlattParamKeys.forEach((key) => {
    filteredInitialParams[key] = initialSilentParams[key];
  });
  klattTrack.push({ time: 0, params: filteredInitialParams });

  for (let i = 0; i < parameterSequence.length; i++) {
    const ph = parameterSequence[i];
    const phDuration = Math.max(20, ph.duration || 100) / 1000.0;
    const targetTime = currentTime + phDuration;
    const currentParams =
      ph.params || fillDefaultParams(PHONEME_TARGETS["SIL"]); // Ensure params exist
    const targetParamsRaw = { ...currentParams }; // Get raw params including flags

    // Determine F0
    const isTargetVoiced = targetParamsRaw.AV > 0 || targetParamsRaw.AVS > 0;
    targetParamsRaw.F0 = isTargetVoiced ? getF0AtTime(targetTime) : 0;
    if (ph.phoneme === "SIL") targetParamsRaw.F0 = 0;

    // *** FILTER *** the parameters to only include valid numeric Klatt keys
    const targetParamsFiltered = {};
    validKlattParamKeys.forEach((key) => {
      // Ensure the value exists and is numeric before adding
      if (
        typeof targetParamsRaw[key] === "number" &&
        isFinite(targetParamsRaw[key])
      ) {
        targetParamsFiltered[key] = targetParamsRaw[key];
      } else {
        // If a core param is missing/invalid, use default from BASE_PARAMS
        targetParamsFiltered[key] = BASE_PARAMS[key];
        // console.warn(`Using default for missing/invalid param ${key} in phoneme ${ph.phoneme}`);
      }
    });

    if (targetTime > currentTime) {
      klattTrack.push({ time: targetTime, params: targetParamsFiltered }); // Add filtered params
      currentTime = targetTime;
    } else {
      // console.warn(`Skipping track event for ${ph.phoneme} due to zero or negative duration.`);
    }
  }
  const finalTime = currentTime + 0.1;
  let finalSilentParams = fillDefaultParams(PHONEME_TARGETS["SIL"]);
  let filteredFinalParams = {};
  validKlattParamKeys.forEach((key) => {
    filteredFinalParams[key] = finalSilentParams[key];
  });
  klattTrack.push({ time: finalTime, params: filteredFinalParams });

  console.log(
    `Generated Klatt Track: ${
      klattTrack.length
    } events, duration: ${finalTime.toFixed(3)}s`
  );
  return klattTrack;
}

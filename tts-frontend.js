
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
export function normalizeText(text) { // Added export
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
export function transcribeText(text) { // Added export
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

// --- Debug Logger ---
function debugLog(...args) {
    console.log("[TTS Frontend DEBUG]", ...args);
}

// --- Main Pipeline ---
export function textToKlattTrack(inputText, baseF0 = 110, transitionMs = 30) {
  debugLog("--- textToKlattTrack Start ---");
  debugLog("Input Text:", inputText);
  const normalized = normalizeText(inputText);
  debugLog("Normalized Text:", normalized);
  let phonemeSequence = transcribeText(normalized);
  debugLog(
    "Initial Phonemes:",
    phonemeSequence
      .map((p) => p.phoneme + (p.stress !== null ? p.stress : ""))
      .join(" ")
  );

  // --- Prepare Parameter Sequence (UPDATED Target Lookup Logic) ---
  debugLog("Preparing initial parameter sequence...");
  let parameterSequence = phonemeSequence.map((ph) => {
    let targetKeyBase = ph.phoneme;
    let isStopClosure = false;
    debugLog(`  Processing phoneme: ${ph.phoneme}${ph.stress ?? ''}`);
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
      debugLog(`    Phoneme is punctuation, using SIL target.`);
    } else if (!baseTarget) {
      console.warn(
        `[TTS Frontend] No baseline target found for ${targetKeyBase} (Stress: ${ph.stress}). Using SIL.`
      );
      baseTarget = PHONEME_TARGETS["SIL"];
      ph.phoneme = "SIL"; // Update the phoneme name too
      debugLog(`    No target found, falling back to SIL.`);
    } else {
       debugLog(`    Found target: ${baseTarget.type || 'unknown type'}, dur: ${baseTarget.dur}`);
    }

    const filledParams = fillDefaultParams(baseTarget);
    debugLog(`    Filled Params (AV=${filledParams.AV}, AF=${filledParams.AF}, AH=${filledParams.AH}, AVS=${filledParams.AVS})`);

    // *** ADDED: Copy essential flags from baseTarget ***
    const flags = {};
    if (baseTarget) {
        if (baseTarget.type) flags.type = baseTarget.type;
        if (baseTarget.hasOwnProperty('voiceless')) flags.voiceless = baseTarget.voiceless;
        if (baseTarget.hasOwnProperty('voiced')) flags.voiced = baseTarget.voiced;
        // Add other flags needed by rules later? (e.g., front, back, hi, low for K_Context?)
        if (baseTarget.hasOwnProperty('front')) flags.front = baseTarget.front;
        if (baseTarget.hasOwnProperty('back')) flags.back = baseTarget.back;
        if (baseTarget.hasOwnProperty('hi')) flags.hi = baseTarget.hi;
        if (baseTarget.hasOwnProperty('low')) flags.low = baseTarget.low;
    }

    return {
      phoneme: ph.phoneme, // Use potentially updated phoneme (e.g., SIL fallback)
      stress: ph.stress,
      params: filledParams, // Use the filled params
      duration: baseTarget.dur || 100,
      punctuationSymbol: ph.isPunctuation ? ph.symbol : null,
      ...flags // Add the copied flags
    };
  });
  debugLog("Initial parameter sequence prepared.");

  // --- Apply Rules ---
  debugLog("Applying rule: insertStopReleases...");
  parameterSequence = insertStopReleases(parameterSequence);
  // --- REVISED Refill step ---
  debugLog("Applying rule: Refill params/durations/flags for releases...");
  parameterSequence = parameterSequence.map((ph) => {
    if (!ph.params) { // Only for inserted releases
      debugLog(`  Refilling params for inserted phoneme: ${ph.phoneme}`);
      let targetKeyBase = ph.phoneme;
      let baseTarget = PHONEME_TARGETS[targetKeyBase];

      if (!baseTarget) {
        console.warn(`[TTS Frontend] No target found for inserted release ${ph.phoneme}. Using SIL.`);
        baseTarget = PHONEME_TARGETS["SIL"];
        ph.phoneme = "SIL";
        debugLog(`    No target found for ${targetKeyBase}, using SIL.`);
      }
      ph.params = fillDefaultParams(baseTarget);
      ph.duration = baseTarget.dur || 30;
      debugLog(`    Filled Params (AV=${ph.params.AV}, AF=${ph.params.AF}, AH=${ph.params.AH}, AVS=${ph.params.AVS}), Duration=${ph.duration}`);

      // Add flags from the found target
      if (baseTarget) {
          if (baseTarget.type) ph.type = baseTarget.type;
          if (baseTarget.hasOwnProperty('voiceless')) ph.voiceless = baseTarget.voiceless;
          if (baseTarget.hasOwnProperty('voiced')) ph.voiced = baseTarget.voiced;
          // No need to copy other flags here as releases aren't usually context for other rules
      }
    }
    // Ensure all phonemes have params (maybe redundant now?)
    // ph.params = ph.params || fillDefaultParams(PHONEME_TARGETS["SIL"]); // Removed redundant line

    return ph;
  });
  debugLog("Finished refilling params and flags for releases.");
  // --- End REVISED Refill step ---

  debugLog("Applying rule: rule_K_Context...");
  parameterSequence = rule_K_Context(parameterSequence);
  debugLog("Applying rule: Punctuation pause adjustments...");
  parameterSequence.forEach((ph) => {
    /* Punctuation pause adjustments */
    if (ph.phoneme === "SIL" && ph.punctuationSymbol) {
      const oldDur = ph.duration;
      if (ph.punctuationSymbol === ",") ph.duration = 150;
      else if ([".", "?", "!"].includes(ph.punctuationSymbol))
        ph.duration = 300;
      debugLog(`  Adjusted SIL duration for '${ph.punctuationSymbol}' from ${oldDur} to ${ph.duration}`);
    }
  });
  debugLog("Applying rule: rule_StressDuration...");
  parameterSequence = rule_StressDuration(parameterSequence); // Note: This rule also ensures min duration
  debugLog("Applying rule: rule_VowelShortening...");
  parameterSequence = rule_VowelShortening(parameterSequence);
  debugLog("Finished applying rules.");
  debugLog("Parameter sequence after rules:", parameterSequence.map(p => `${p.phoneme}${p.stress ?? ''}(${p.duration}ms)`).join(' '));


  // --- Generate F0 ---
  debugLog("Generating F0 contour...");
  const f0Contour = rule_GenerateF0Contour(parameterSequence, baseF0);
  debugLog("F0 Contour:", f0Contour.map(p => `(${p.time.toFixed(3)}s, ${p.f0.toFixed(1)}Hz)`).join(' '));

  // --- Generate Final Klatt Track (FILTER PARAMS) ---
  debugLog("Generating final Klatt track...");
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
  debugLog(`  Added initial silence event at t=0.000`);

  for (let i = 0; i < parameterSequence.length; i++) {
    const ph = parameterSequence[i];
    const phDuration = Math.max(20, ph.duration || 100) / 1000.0; // Use duration from rules
    const targetTime = currentTime + phDuration;
    debugLog(`  Processing phoneme ${i}: ${ph.phoneme}${ph.stress ?? ''}, duration=${phDuration.toFixed(3)}s, targetTime=${targetTime.toFixed(3)}s`);
    const targetParams = ph.params || fillDefaultParams(PHONEME_TARGETS["SIL"]); // Ensure params exist

    // Determine F0
    debugLog(`    Current Params (AV=${targetParams.AV}, AF=${targetParams.AF}, AH=${targetParams.AH}, AVS=${targetParams.AVS})`);
    const isTargetVoiced = targetParams.AV > 0 || targetParams.AVS > 0;
    let calculatedF0 = isTargetVoiced ? getF0AtTime(targetTime) : 0;
    if (ph.phoneme === 'SIL') calculatedF0 = 0;
    // *** Clamp calculated F0 to prevent sending 0 when voicing should be on ***
    if (isTargetVoiced && calculatedF0 < 1) {
         debugLog(`    WARN: Calculated F0 near zero (${calculatedF0.toFixed(1)}) for voiced phoneme ${ph.phoneme} at ${targetTime.toFixed(3)}s. Clamping to baseF0/2.`);
         calculatedF0 = baseF0 / 2; // Use a low default if contour gives 0 for voiced segment
    }
    targetParams.F0 = calculatedF0; // Add calculated F0 directly to the params object

    // *** Logging for release phonemes ***
    if (ph.type === 'stop_release') {
        debugLog(`    Inspecting params for ${ph.phoneme}: AF=${targetParams.AF}, AH=${targetParams.AH}, AB=${targetParams.AB}`);
    }

    // *** REMOVED FILTERING STEP - Assuming ph.params is already valid ***
    debugLog(`    Final Params (F0=${targetParams.F0.toFixed(1)}, AV=${targetParams.AV}, AF=${targetParams.AF}, AH=${targetParams.AH}, AVS=${targetParams.AVS}, GO=${targetParams.GO})`);

    if (targetTime > currentTime) {
      // Ensure all base keys exist before pushing (minimal safety check)
      const finalParamsToSend = {};
       validKlattParamKeys.forEach(key => {
           const valueToAssign = (typeof targetParams[key] === 'number' && isFinite(targetParams[key])) ? targetParams[key] : BASE_PARAMS[key];
           finalParamsToSend[key] = valueToAssign;
           // *** ADDED LOGGING INSIDE LOOP ***
           if (key === 'AF' && ph.type === 'stop_release') {
               debugLog(`      Assigning finalParamsToSend.AF = ${valueToAssign} (Source value: ${targetParams[key]}, Type: ${typeof targetParams[key]}, IsFinite: ${isFinite(targetParams[key])})`);
           }
           // *** END ADDED LOGGING ***
       });

      klattTrack.push({ time: targetTime, params: finalParamsToSend }); // Add potentially modified params

      // Log Event Details (Log ALL events now)
      console.log(`Track Event ${i + 1}: Time=${targetTime.toFixed(3)}s, Phoneme=${ph.phoneme}, AV=${finalParamsToSend.AV.toFixed(1)}, AF=${finalParamsToSend.AF.toFixed(1)}, AH=${finalParamsToSend.AH.toFixed(1)}, F0=${finalParamsToSend.F0.toFixed(1)}, F1=${finalParamsToSend.F1.toFixed(0)}`);
      debugLog(`    Added track event at t=${targetTime.toFixed(3)}`);
      currentTime = targetTime;
    } else {
       console.warn(`[TTS Frontend] Skipping track event for ${ph.phoneme} due to zero or negative duration.`);
       debugLog(`    WARN: Skipping track event for ${ph.phoneme} due to zero or negative duration.`);
    }
  }
  const finalTime = currentTime + 0.1; // Add final silence buffer
  let finalSilentParams = fillDefaultParams(PHONEME_TARGETS["SIL"]);
  let filteredFinalParams = {};
  validKlattParamKeys.forEach((key) => {
    filteredFinalParams[key] = finalSilentParams[key];
  });
  klattTrack.push({ time: finalTime, params: filteredFinalParams });
  debugLog(`  Added final silence event at t=${finalTime.toFixed(3)}`);

  console.log( // Keep top-level log
    `Generated Klatt Track: ${
      klattTrack.length
    } events, duration: ${finalTime.toFixed(3)}s`
  );
  debugLog("--- textToKlattTrack End ---");
  return klattTrack;
}


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

// --- Phonetic Transcription --- (MODIFIED: Return word info)
export function transcribeText(text) {
  const words = text.split(" ");
  const wordPhonemeList = []; // Array of { word: '...', phonemes: [...] }
  const punctuation = [",", ".", "?", "!"];

  for (const word of words) {
    if (!word) continue; // Skip empty strings resulting from multiple spaces

    const currentWordData = { word: word, phonemes: [] };

    if (punctuation.includes(word)) {
      currentWordData.phonemes.push({
        phoneme: "SIL",
        stress: null,
        isPunctuation: true,
        symbol: word,
      });
    } else {
      const lowerWord = word.toLowerCase();
      let pronunciation = CMU_DICT[lowerWord];
      // Handle alternate pronunciations like "read(1)" -> "read"
      if (!pronunciation && lowerWord.includes("(")) {
        pronunciation = CMU_DICT[lowerWord.replace(/\(\d+\)$/, "")];
      }

      if (pronunciation) {
        const phones = pronunciation.split(" ");
        for (const phoneWithStress of phones) {
          const match = phoneWithStress.match(/^([A-Z]+)(\d)?$/);
          if (match) {
            currentWordData.phonemes.push({
              phoneme: match[1],
              stress: match[2] ? parseInt(match[2]) : null,
            });
          } else if (phoneWithStress === "SIL") {
            // Handle SIL within a pronunciation if needed (though unlikely in CMU)
            currentWordData.phonemes.push({ phoneme: "SIL", stress: null });
          }
        }
      } else {
        console.warn(`Word "${word}" not found. Skipping.`);
        // Represent unknown word as silence associated with the word
        currentWordData.phonemes.push({ phoneme: "SIL", stress: null, duration: 50 });
      }
    }
    // Only add if phonemes were generated (handles empty words/skips)
    if (currentWordData.phonemes.length > 0) {
        wordPhonemeList.push(currentWordData);
    }
  }
  return wordPhonemeList; // Return the list of word objects
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
  // Transcribe returns list of { word: '...', phonemes: [...] }
  const wordPhonemeList = transcribeText(normalized);
  debugLog(
    "Initial Word/Phonemes:",
    wordPhonemeList.map(wp => `${wp.word}(${wp.phonemes.map(p => p.phoneme + (p.stress ?? '')).join(' ')})`).join(' | ')
  );

  // --- Prepare Parameter Sequence (Flatten word list, add word info) ---
  debugLog("Preparing initial parameter sequence...");
  let parameterSequence = [];
  wordPhonemeList.forEach(wordData => {
    wordData.phonemes.forEach(ph => {
      let targetKeyBase = ph.phoneme;
      let isStopClosure = false;
      // debugLog(`  Processing phoneme: ${ph.phoneme}${ph.stress ?? ''} for word: ${wordData.word}`); // Can be noisy
      if (["P", "T", "K", "B", "D", "G"].includes(targetKeyBase)) {
        targetKeyBase += "_CL";
        isStopClosure = true;
      }
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
      phoneme: targetKeyBase, // *** Use the potentially modified targetKeyBase ***
      stress: ph.stress,
      params: filledParams, // Use the filled params
      duration: baseTarget.dur || 100,
      punctuationSymbol: ph.isPunctuation ? ph.symbol : null,
      ...flags, // Add the copied flags
      word: wordData.word // *** ADD WORD INFO ***
    });
  }); // End of parameterSequence mapping

  debugLog("Initial parameter sequence prepared.");

  // --- Apply Rules (Rules now operate on the flattened parameterSequence) ---
  debugLog("Applying rule: insertStopReleases...");
  parameterSequence = insertStopReleases(parameterSequence);
  // --- Simplified Refill Step ---
  debugLog("Applying rule: Refill params/durations for releases...");
  for (let i = 0; i < parameterSequence.length; i++) {
      const ph = parameterSequence[i];
      if (!ph.params) { // Only process phonemes inserted by rules (like releases)
          debugLog(`  Refilling params for inserted phoneme: ${ph.phoneme}`);
          let baseTarget = PHONEME_TARGETS[ph.phoneme]; // Directly use phoneme name

          if (!baseTarget) {
              console.warn(`[TTS Frontend] No target found for inserted phoneme ${ph.phoneme}. Using SIL.`);
              baseTarget = PHONEME_TARGETS["SIL"];
              // Consider if we should change ph.phoneme to SIL here? Maybe not needed if params are SIL.
          }

          // Use the refined fillDefaultParams
          ph.params = fillDefaultParams(baseTarget);
          ph.duration = baseTarget?.dur || 30; // Use optional chaining

          // Add minimal type flag and other relevant flags
          if (baseTarget) {
              if (baseTarget.type) ph.type = baseTarget.type;
              // Copy other flags that might be relevant, similar to initial mapping
              if (baseTarget.hasOwnProperty('voiceless')) ph.voiceless = baseTarget.voiceless;
              if (baseTarget.hasOwnProperty('voiced')) ph.voiced = baseTarget.voiced;
              // Add other flags from PHONEME_TARGETS if needed by future rules
              if (baseTarget.hasOwnProperty('front')) ph.front = baseTarget.front;
              if (baseTarget.hasOwnProperty('back')) ph.back = baseTarget.back;
              if (baseTarget.hasOwnProperty('hi')) ph.hi = baseTarget.hi;
              if (baseTarget.hasOwnProperty('low')) ph.low = baseTarget.low;
              if (baseTarget.hasOwnProperty('bilabial')) ph.bilabial = baseTarget.bilabial;
              if (baseTarget.hasOwnProperty('alveolar')) ph.alveolar = baseTarget.alveolar;
              // etc. for other place/manner features if necessary
          }


          debugLog(`    Filled Params (AV=${ph.params.AV}, AF=${ph.params.AF}, AH=${ph.params.AH}), Duration=${ph.duration}, Type=${ph.type}, Voiceless=${ph.voiceless}`);
      }
  }
  debugLog("Finished refilling params for releases.");
  // --- End Simplified Refill Step ---

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

  // *** ADDED LOGGING: Inspect sequence before final loop ***
  debugLog("Inspecting parameterSequence before final track generation:");
  parameterSequence.forEach((ph, index) => {
      debugLog(`  [${index}] ${ph.phoneme}${ph.stress ?? ''}: Duration=${ph.duration}, AV=${ph.params?.AV?.toFixed(1)}, AF=${ph.params?.AF?.toFixed(1)}, AH=${ph.params?.AH?.toFixed(1)}, F0=${ph.params?.F0?.toFixed(1)}`);
      if (ph.phoneme.endsWith('_REL')) {
          debugLog(`    -> Release Phoneme Params: ${JSON.stringify(ph.params)}`);
      }
  });
  // *** REMOVED DETAILED LOGGING BLOCK ***

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

  // Start silent
  klattTrack.push({ time: 0, params: fillDefaultParams(PHONEME_TARGETS["SIL"]) }); // Use filled SIL params directly
  debugLog(`  Added initial silence event at t=0.000`);

  for (let i = 0; i < parameterSequence.length; i++) {
    const ph = parameterSequence[i];
    const phDuration = Math.max(20, ph.duration || 100) / 1000.0; // Restore original calculation

    // *** ADDED: Specific logging for P_REL inside loop ***
    if (ph.phoneme === 'P_REL') {
        debugLog(`    INSIDE LOOP CHECK for P_REL:`);
        debugLog(`      ph.duration (ms): ${ph.duration}`);
        debugLog(`      Calculated phDuration (s): ${phDuration.toFixed(4)}`);
    }
    // *** END ADDED LOGGING ***

    if (phDuration <= 0) {
        console.warn(`[TTS Frontend DEBUG] Calculated duration is non-positive (${phDuration.toFixed(4)}s) for ${ph.phoneme}. Original duration: ${ph.duration}ms. Skipping.`);
        debugLog(`    WARN: Skipping track event for ${ph.phoneme} due to zero or negative calculated duration.`);
        continue; // Explicitly skip if duration is bad
    }
    const targetTime = currentTime + phDuration;

    // *** ADDED: Specific logging for P_REL inside loop ***
     if (ph.phoneme === 'P_REL') {
        debugLog(`      targetTime: ${targetTime.toFixed(4)}`);
        debugLog(`      currentTime: ${currentTime.toFixed(4)}`);
        debugLog(`      Condition (targetTime > currentTime): ${targetTime > currentTime}`);
     }
    // *** END ADDED LOGGING ***

    debugLog(`  Processing phoneme ${i}: ${ph.phoneme}${ph.stress ?? ''}, duration=${phDuration.toFixed(3)}s (original: ${ph.duration}ms), targetTime=${targetTime.toFixed(3)}s`);

    // Use the params object directly from the sequence (already filled and potentially modified by rules)
    const finalParams = ph.params ? { ...ph.params } : fillDefaultParams(PHONEME_TARGETS["SIL"]); // Ensure we have a params object, copy it

    // Determine and set F0
    const isTargetVoiced = finalParams.AV > 0 || finalParams.AVS > 0;
    let calculatedF0 = isTargetVoiced ? getF0AtTime(targetTime) : 0;
    if (ph.phoneme === 'SIL') calculatedF0 = 0;
    if (isTargetVoiced && calculatedF0 < 1) {
         debugLog(`    WARN: Calculated F0 near zero (${calculatedF0.toFixed(1)}) for voiced phoneme ${ph.phoneme} at ${targetTime.toFixed(3)}s. Clamping to baseF0/2.`);
         calculatedF0 = baseF0 / 2;
    }
    finalParams.F0 = calculatedF0; // Set F0 on the copied params

    // *** REMOVED Safety Check Loop - Assuming ph.params is already valid after fillDefaultParams and rules ***

    debugLog(`    Final Params (F0=${finalParams.F0.toFixed(1)}, AV=${finalParams.AV}, AF=${finalParams.AF}, AH=${finalParams.AH}, AVS=${finalParams.AVS}, GO=${finalParams.GO})`);

    if (targetTime > currentTime) {
      // *** ADD WORD and PHONEME to track event ***
      klattTrack.push({
          time: targetTime,
          phoneme: ph.phoneme, // Keep original phoneme name (e.g., K_CL)
          word: ph.word,      // Add the associated word
          params: finalParams
      });

      // Log Event Details (including word)
      console.log(`Track Event ${i + 1}: Time=${targetTime.toFixed(3)}s, Word=${ph.word}, Phoneme=${ph.phoneme}, AV=${finalParams.AV.toFixed(1)}, AF=${finalParams.AF.toFixed(1)}, AH=${finalParams.AH.toFixed(1)}, F0=${finalParams.F0.toFixed(1)}, F1=${finalParams.F1.toFixed(0)}`);
      debugLog(`    Added track event at t=${targetTime.toFixed(3)}`);
      currentTime = targetTime;
    }
    // Removed the 'else' block as the non-positive duration case is handled by the 'continue' above
  }
  // Add final silence
  const finalTime = currentTime + 0.1;
  klattTrack.push({ time: finalTime, phoneme: 'SIL', params: fillDefaultParams(PHONEME_TARGETS["SIL"]) });
  debugLog(`  Added final silence event at t=${finalTime.toFixed(3)}`);

  console.log( // Keep top-level log
    `Generated Klatt Track: ${
      klattTrack.length
    } events, duration: ${finalTime.toFixed(3)}s`
  );
  debugLog("--- textToKlattTrack End ---");
  return klattTrack;
}

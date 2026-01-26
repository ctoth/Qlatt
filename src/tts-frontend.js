import { CMU_DICT } from "./cmu-dictionary.js";
import {
  PHONEME_TARGETS,
  fillDefaultParams,
  rule_GenerateF0Contour,
  rule_K_Context,
  rule_PreBoundaryLengthening,
  rule_StressDuration,
  rule_VowelShortening,
} from "./tts-frontend-rules.js";

export function normalizeText(text) {
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

function guessPronunciation(word) {
  const cleaned = word.toLowerCase().replace(/[^a-z']/g, "");
  if (!cleaned) return [];
  const phones = [];
  const isVowel = (ch) => "aeiouy".includes(ch);
  let i = 0;

  while (i < cleaned.length) {
    const two = cleaned.slice(i, i + 2);
    const three = cleaned.slice(i, i + 3);

    if (three === "tch") {
      phones.push("CH");
      i += 3;
      continue;
    }
    if (two === "ch") {
      phones.push("CH");
      i += 2;
      continue;
    }
    if (two === "sh") {
      phones.push("SH");
      i += 2;
      continue;
    }
    if (two === "th") {
      phones.push("DH");
      i += 2;
      continue;
    }
    if (two === "ph") {
      phones.push("F");
      i += 2;
      continue;
    }
    if (two === "ng") {
      phones.push("NG");
      i += 2;
      continue;
    }
    if (two === "wh") {
      phones.push("W");
      i += 2;
      continue;
    }
    if (two === "ck") {
      phones.push("K");
      i += 2;
      continue;
    }
    if (two === "qu") {
      phones.push("K", "W");
      i += 2;
      continue;
    }
    if (two === "ee") {
      phones.push("IY0");
      i += 2;
      continue;
    }
    if (two === "oo") {
      phones.push("UW0");
      i += 2;
      continue;
    }
    if (two === "ea") {
      phones.push("IY0");
      i += 2;
      continue;
    }
    if (two === "ai" || two === "ay") {
      phones.push("EY0");
      i += 2;
      continue;
    }
    if (two === "oi" || two === "oy") {
      phones.push("OY1");
      i += 2;
      continue;
    }
    if (two === "ow" || two === "ou") {
      phones.push("OW0");
      i += 2;
      continue;
    }
    if (two === "er" || two === "ur" || two === "ir") {
      phones.push("ER0");
      i += 2;
      continue;
    }
    if (two === "ar") {
      phones.push("AA0", "R");
      i += 2;
      continue;
    }
    if (two === "or") {
      phones.push("AO0", "R");
      i += 2;
      continue;
    }

    const ch = cleaned[i];
    const next = cleaned[i + 1] || "";
    switch (ch) {
      case "a":
        phones.push("AE0");
        break;
      case "e":
        phones.push("EH0");
        break;
      case "i":
        phones.push("IH0");
        break;
      case "o":
        phones.push("AO0");
        break;
      case "u":
        phones.push("AH0");
        break;
      case "y":
        phones.push(i === 0 ? "Y" : "IY0");
        break;
      case "b":
        phones.push("B");
        break;
      case "c":
        phones.push("eiy".includes(next) ? "S" : "K");
        break;
      case "d":
        phones.push("D");
        break;
      case "f":
        phones.push("F");
        break;
      case "g":
        phones.push("eiy".includes(next) ? "JH" : "G");
        break;
      case "h":
        phones.push("HH");
        break;
      case "j":
        phones.push("JH");
        break;
      case "k":
        phones.push("K");
        break;
      case "l":
        phones.push("L");
        break;
      case "m":
        phones.push("M");
        break;
      case "n":
        phones.push("N");
        break;
      case "p":
        phones.push("P");
        break;
      case "q":
        phones.push("K");
        break;
      case "r":
        phones.push("R");
        break;
      case "s":
        phones.push(
          i === cleaned.length - 1 && i > 0 && isVowel(cleaned[i - 1]) ? "Z" : "S"
        );
        break;
      case "t":
        phones.push("T");
        break;
      case "v":
        phones.push("V");
        break;
      case "w":
        phones.push("W");
        break;
      case "x":
        phones.push("K", "S");
        break;
      case "z":
        phones.push("Z");
        break;
      default:
        break;
    }
    i += 1;
  }

  return phones;
}

// --- Phonetic Transcription --- (MODIFIED: Return flat phoneme list with word info)
export function transcribeText(text) {
  const words = text.split(" ");
  const flatPhonemeList = []; // Flat array of { phoneme: '...', stress: ..., word: '...' }
  const punctuation = [",", ".", "?", "!"];

  for (const word of words) {
    if (!word) continue; // Skip empty strings resulting from multiple spaces

    if (punctuation.includes(word)) {
      flatPhonemeList.push({
        phoneme: "SIL",
        stress: null,
        isPunctuation: true,
        symbol: word,
        word: word, // Associate punctuation with itself as the 'word'
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
            flatPhonemeList.push({
              phoneme: match[1],
              stress: match[2] ? parseInt(match[2]) : null,
              word: word, // Add the original word to each phoneme
            });
          } else if (phoneWithStress === "SIL") {
            // Handle SIL within a pronunciation if needed (though unlikely in CMU)
            flatPhonemeList.push({ phoneme: "SIL", stress: null, word: word });
          }
        }
      } else {
        const fallbackPhones = guessPronunciation(lowerWord);
        if (fallbackPhones.length) {
          console.warn(
            `[TTS Frontend] Word "${word}" not found. Using fallback phonemes.`
          );
          for (const phoneWithStress of fallbackPhones) {
            const match = phoneWithStress.match(/^([A-Z]+)(\d)?$/);
            if (match) {
              flatPhonemeList.push({
                phoneme: match[1],
                stress: match[2] ? parseInt(match[2]) : null,
                word: word,
              });
            } else if (phoneWithStress === "SIL") {
              flatPhonemeList.push({ phoneme: "SIL", stress: null, word: word });
            }
          }
        } else {
          console.warn(`Word "${word}" not found. Representing as SIL.`);
          // Represent unknown word as silence associated with the word
          flatPhonemeList.push({
            phoneme: "SIL",
            stress: null,
            duration: 50,
            word: word,
          });
        }
      }
    }
  }
  return flatPhonemeList; // Return the flat list of phoneme objects
}

// --- Stop Release Rule --- (Operates on flat list)
function insertStopReleases(phonemeList) {
  // Now receives the flat list
  const newList = [];
  const releaseMap = {
    P_CL: "P_REL",
    T_CL: "T_REL",
    K_CL: "K_REL",
    B_CL: "B_REL",
    D_CL: "D_REL",
    G_CL: "G_REL",
  };
  // Voiceless stops have separate aspiration phase following burst
  const aspirationMap = {
    P_REL: "P_ASP",
    T_REL: "T_ASP",
    K_REL: "K_ASP",
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
        // Voiceless stops: add aspiration phase after burst
        const aspirationPhoneme = aspirationMap[releasePhoneme];
        if (aspirationPhoneme) {
          newList.push({ phoneme: aspirationPhoneme, stress: current.stress });
        }
      } else if (phonemeList[i + 1]?.phoneme === "SIL") {
        // Add weak release for word-final stops (before silence) for clarity
        newList.push({ phoneme: releasePhoneme, stress: current.stress, weak: true });
        // Also add weak aspiration for voiceless stops
        const aspirationPhoneme = aspirationMap[releasePhoneme];
        if (aspirationPhoneme) {
          newList.push({ phoneme: aspirationPhoneme, stress: current.stress, weak: true });
        }
      }
    }
  }
  return newList;
}

// --- Debug Logger ---

function debugLog(...args) {
  return;
  // console.log("[TTS Frontend DEBUG]", ...args);
}

// --- Main Pipeline ---
export function textToKlattTrack(inputText, baseF0 = 110, transitionMs = 30) {  
  debugLog("--- textToKlattTrack Start ---");
  debugLog("Input Text:", inputText);
  const normalized = normalizeText(inputText);
  debugLog("Normalized Text:", normalized);
  // Transcribe returns a flat list of phoneme objects with word info
  let parameterSequence = transcribeText(normalized);
  debugLog(
    "Initial Phonemes:",
    parameterSequence
      .map((p) => `${p.phoneme}${p.stress ?? ""}(${p.word})`)
      .join(" ")
  );

  // --- Prepare Parameter Sequence (Map phonemes to targets, fill params) ---
  debugLog("Preparing initial parameter sequence (mapping to targets)...");
  parameterSequence = parameterSequence.map((ph) => {
    let targetKeyBase = ph.phoneme;
    let isStopClosure = false;
    // debugLog(`  Processing phoneme: ${ph.phoneme}${ph.stress ?? ''} from word: ${ph.word}`); // Can be noisy

    // Map P, T, K, B, D, G to their closure versions initially
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
      targetKeyBase = "SIL"; // Update the base key
      debugLog(
        `    Phoneme is punctuation ('${ph.symbol}'), using SIL target.`
      );
    } else if (!baseTarget) {
      console.warn(
        `[TTS Frontend] No baseline target found for ${targetKeyBase} (Stress: ${ph.stress}, Word: ${ph.word}). Using SIL.`
      );
      baseTarget = PHONEME_TARGETS["SIL"];
      targetKeyBase = "SIL"; // Update the base key
      debugLog(`    No target found, falling back to SIL.`);
    } else {
      debugLog(
        `    Found target for ${targetKeyBase}: ${
          baseTarget.type || "unknown type"
        }, dur: ${baseTarget.dur}`
      );
    }

    const filledParams = fillDefaultParams(baseTarget);
    // debugLog(`    Filled Params (AV=${filledParams.AV}, AF=${filledParams.AF}, AH=${filledParams.AH}, AVS=${filledParams.AVS})`);

    // Copy essential flags from baseTarget
    const flags = {};
    if (baseTarget) {
      if (baseTarget.type) flags.type = baseTarget.type;
      if (baseTarget.hasOwnProperty("voiceless"))
        flags.voiceless = baseTarget.voiceless;
      if (baseTarget.hasOwnProperty("voiced")) flags.voiced = baseTarget.voiced;
      if (baseTarget.hasOwnProperty("front")) flags.front = baseTarget.front;
      if (baseTarget.hasOwnProperty("back")) flags.back = baseTarget.back;
      if (baseTarget.hasOwnProperty("hi")) flags.hi = baseTarget.hi;
      if (baseTarget.hasOwnProperty("low")) flags.low = baseTarget.low;
      // Add other flags as needed by rules
    }

    // Return the enriched phoneme data object for the sequence
    return {
      phoneme: targetKeyBase, // Use the potentially modified targetKeyBase (e.g., P_CL, SIL)
      stress: ph.stress,
      params: filledParams,
      duration: baseTarget?.dur || (targetKeyBase === "SIL" ? 100 : 50), // Default duration, use optional chaining
      inherentDuration: baseTarget?.dur, // Preserve inherent duration for incompressibility
      punctuationSymbol: ph.isPunctuation ? ph.symbol : null,
      ...flags,
      word: ph.word, // Keep the word info
    };
  });

  debugLog("Initial parameter sequence prepared after mapping.");

  // --- Apply Rules (Rules operate on the enriched parameterSequence) ---
  debugLog("Applying rule: insertStopReleases...");
  parameterSequence = insertStopReleases(parameterSequence); // Operates on the flat list
  // --- Simplified Refill Step ---
  debugLog("Applying rule: Refill params/durations for releases...");
  for (let i = 0; i < parameterSequence.length; i++) {
    const ph = parameterSequence[i];
    if (!ph.params) {
      // Only process phonemes inserted by rules (like releases)
      debugLog(`  Refilling params for inserted phoneme: ${ph.phoneme}`);

      let baseTarget = PHONEME_TARGETS[ph.phoneme]; // Directly use phoneme name

      if (!baseTarget) {
        console.warn(
          `[TTS Frontend] No target found for inserted phoneme ${ph.phoneme}. Using SIL.`
        );
        baseTarget = PHONEME_TARGETS["SIL"];
        // Consider if we should change ph.phoneme to SIL here? Maybe not needed if params are SIL.
      }

      // Use the refined fillDefaultParams
      ph.params = fillDefaultParams(baseTarget);
      ph.duration = baseTarget?.dur || 30; // Use optional chaining
      ph.inherentDuration = baseTarget?.dur;

      // Reduce amplitude for weak releases (word-final stops)
      if (ph.weak) {
        ph.params.AF = Math.max(0, (ph.params.AF || 0) - 10); // Reduce frication by 10 dB
        ph.params.AH = Math.max(0, (ph.params.AH || 0) - 10); // Reduce aspiration by 10 dB
        ph.duration = Math.max(15, ph.duration * 0.5); // Shorter duration
      }

      // Add minimal type flag and other relevant flags
      if (baseTarget) {
        if (baseTarget.type) ph.type = baseTarget.type;
        // Copy other flags that might be relevant, similar to initial mapping
        if (baseTarget.hasOwnProperty("voiceless"))
          ph.voiceless = baseTarget.voiceless;
        if (baseTarget.hasOwnProperty("voiced")) ph.voiced = baseTarget.voiced;
        // Add other flags from PHONEME_TARGETS if needed by future rules
        if (baseTarget.hasOwnProperty("front")) ph.front = baseTarget.front;
        if (baseTarget.hasOwnProperty("back")) ph.back = baseTarget.back;
        if (baseTarget.hasOwnProperty("hi")) ph.hi = baseTarget.hi;
        if (baseTarget.hasOwnProperty("low")) ph.low = baseTarget.low;
        if (baseTarget.hasOwnProperty("bilabial"))
          ph.bilabial = baseTarget.bilabial;
        if (baseTarget.hasOwnProperty("alveolar"))
          ph.alveolar = baseTarget.alveolar;
        // etc. for other place/manner features if necessary
      }

      debugLog(
        `    Filled Params (AV=${ph.params.AV}, AF=${ph.params.AF}, AH=${ph.params.AH}), Duration=${ph.duration}, Type=${ph.type}, Voiceless=${ph.voiceless}`
      );
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
      debugLog(
        `  Adjusted SIL duration for '${ph.punctuationSymbol}' from ${oldDur} to ${ph.duration}`
      );
    }
  });
  debugLog("Applying rule: rule_StressDuration...");
  parameterSequence = rule_StressDuration(parameterSequence); // Note: This rule also ensures min duration
  debugLog("Applying rule: rule_VowelShortening...");
  parameterSequence = rule_VowelShortening(parameterSequence);
  debugLog("Applying rule: rule_PreBoundaryLengthening...");
  parameterSequence = rule_PreBoundaryLengthening(parameterSequence);
  // Set SW (source selection): parallel (SW=1) for most fricatives/stops, cascade (SW=0) for vowels/sonorants
  // Klatt 80 COEWAV.FOR: aspiration routes through cascade (SW=0), so HH uses cascade per explicit target
  parameterSequence.forEach((ph) => {
    if (!ph?.params) return;
    // Respect explicit SW in phoneme definition (e.g., HH uses cascade per Klatt 80)
    const target = PHONEME_TARGETS[ph.phoneme];
    if (target && target.SW !== undefined) {
      ph.params.SW = target.SW;
      return;
    }
    const useParallel =
      ph.type === "fricative" ||
      ph.type === "affricate" ||
      ph.type === "stop_release" ||
      ph.type === "stop_aspiration";
    ph.params.SW = useParallel ? 1 : 0;
  });
  debugLog("Finished applying rules.");
  debugLog(
    "Parameter sequence after rules:",
    parameterSequence
      .map((p) => `${p.phoneme}${p.stress ?? ""}(${p.duration}ms)`)
      .join(" ")
  );

  // *** ADDED LOGGING: Inspect sequence before final loop ***
  debugLog("Inspecting parameterSequence before final track generation:");
  parameterSequence.forEach((ph, index) => {
    debugLog(
      `  [${index}] ${ph.phoneme}${ph.stress ?? ""}: Duration=${
        ph.duration
      }, AV=${ph.params?.AV?.toFixed(1)}, AF=${ph.params?.AF?.toFixed(
        1
      )}, AH=${ph.params?.AH?.toFixed(1)}, F0=${ph.params?.F0?.toFixed(1)}`
    );
    if (ph.phoneme.endsWith("_REL")) {
      debugLog(`    -> Release Phoneme Params: ${JSON.stringify(ph.params)}`);
    }
  });
  // *** REMOVED DETAILED LOGGING BLOCK ***

  // *** ADDED LOGGING: Inspect sequence before F0 generation ***
  debugLog("Inspecting parameterSequence before F0 generation:");
  parameterSequence.forEach((ph, index) => {
    debugLog(
      `  [${index}] ${ph.phoneme}: AV=${ph.params?.AV?.toFixed(
        1
      )}, AVS=${ph.params?.AVS?.toFixed(1)}, Stress=${ph.stress}`
    );
  });
  // *** END ADDED LOGGING ***

  // --- Generate F0 ---
  debugLog("Generating F0 contour...");
  const f0Contour = rule_GenerateF0Contour(parameterSequence, baseF0);
  // *** ADDED LOGGING: Log the generated contour ***
  debugLog("Generated F0 Contour (Raw):", JSON.stringify(f0Contour));
  // *** END ADDED LOGGING ***
  debugLog(
    "F0 Contour:",
    f0Contour
      .map((p) => `(${p.time.toFixed(3)}s, ${p.f0.toFixed(1)}Hz)`)
      .join(" ")
  );

  // --- Generate Final Klatt Track (FILTER PARAMS) ---
  debugLog("Generating final Klatt track...");
  const klattTrack = [];
  let currentTime = 0;
  const transitionSec = Math.max(0, transitionMs) / 1000.0;
  const blendFactor = 0.35;
  const smoothTypes = new Set(["vowel", "nasal", "liquid", "glide"]);
  const blendKeys = ["F1", "F2", "F3", "B1", "B2", "B3"];

  function blendParams(baseParams, nextParams) {
    if (!nextParams) return { ...baseParams };
    const blended = { ...baseParams };
    for (const key of blendKeys) {
      const a = baseParams[key];
      const b = nextParams[key];
      if (Number.isFinite(a) && Number.isFinite(b)) {
        blended[key] = a + (b - a) * blendFactor;
      }
    }
    return blended;
  }
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
  klattTrack.push({
    time: 0,
    params: fillDefaultParams(PHONEME_TARGETS["SIL"]),
  }); // Use filled SIL params directly

  for (let i = 0; i < parameterSequence.length; i++) {
    const ph = parameterSequence[i];
    // Stop releases/aspiration must use their fixed MITalk durations (5-25ms)
    const isStopRelease = ph.type === "stop_release" || ph.type === "stop_aspiration";
    const minDuration = isStopRelease ? 5 : 20;
    const targetDur = isStopRelease ? PHONEME_TARGETS[ph.phoneme]?.dur : null;
    const phDurationMs = Number.isFinite(targetDur) ? targetDur : (ph.duration || 100);
    const phDuration = Math.max(minDuration, phDurationMs) / 1000.0;
    const segmentStart = currentTime;

    // *** ADDED: Specific logging for P_REL inside loop ***
    if (ph.phoneme === "P_REL") {
      debugLog(`    INSIDE LOOP CHECK for P_REL:`);
      debugLog(`      ph.duration (ms): ${ph.duration}`);
      debugLog(`      Calculated phDuration (s): ${phDuration.toFixed(4)}`);
    }
    // *** END ADDED LOGGING ***

    if (phDuration <= 0) {
      console.warn(
        `[TTS Frontend DEBUG] Calculated duration is non-positive (${phDuration.toFixed(
          4
        )}s) for ${ph.phoneme}. Original duration: ${ph.duration}ms. Skipping.`
      );
      debugLog(
        `    WARN: Skipping track event for ${ph.phoneme} due to zero or negative calculated duration.`
      );
      continue; // Explicitly skip if duration is bad
    }
    const targetTime = segmentStart + phDuration;

    // *** ADDED: Specific logging for P_REL inside loop ***
    if (ph.phoneme === "P_REL") {
      debugLog(`      targetTime: ${targetTime.toFixed(4)}`);
      debugLog(`      currentTime: ${currentTime.toFixed(4)}`);
      debugLog(
        `      Condition (targetTime > currentTime): ${
          targetTime > currentTime
        }`
      );
    }
    // *** END ADDED LOGGING ***

    debugLog(
      `  Processing phoneme ${i}: ${ph.phoneme}${
        ph.stress ?? ""
      }, duration=${phDuration.toFixed(3)}s (original: ${
        ph.duration
      }ms), targetTime=${targetTime.toFixed(3)}s`
    );

    // Use the params object directly from the sequence (already filled and potentially modified by rules)
    const finalParams = ph.params
      ? { ...ph.params }
      : fillDefaultParams(PHONEME_TARGETS["SIL"]); // Ensure we have a params object, copy it

    // Determine and set F0
    const isTargetVoiced = finalParams.AV > 0 || finalParams.AVS > 0;
    // *** ADDED LOGGING: Log voicing check and getF0AtTime result ***
    const f0FromContour = getF0AtTime(targetTime);
    debugLog(
      `    Check Voicing for ${ph.phoneme}: AV=${finalParams.AV?.toFixed(
        1
      )}, AVS=${finalParams.AVS?.toFixed(
        1
      )} -> isTargetVoiced=${isTargetVoiced}`
    );
    debugLog(
      `    getF0AtTime(${targetTime.toFixed(
        3
      )}) returned: ${f0FromContour?.toFixed(1)}`
    );
    // *** END ADDED LOGGING ***
    let calculatedF0 = isTargetVoiced ? f0FromContour : 0; // Use the logged value
    if (ph.phoneme === "SIL") calculatedF0 = 0;
    if (isTargetVoiced && calculatedF0 < 1) {
      debugLog(
        `    WARN: Calculated F0 near zero (${calculatedF0.toFixed(
          1
        )}) for voiced phoneme ${ph.phoneme} at ${targetTime.toFixed(
          3
        )}s. Clamping to baseF0/2.`
      );
      calculatedF0 = baseF0 / 2;
    }
    finalParams.F0 = calculatedF0; // Set F0 on the copied params

    // *** REMOVED Safety Check Loop - Assuming ph.params is already valid after fillDefaultParams and rules ***

    debugLog(
      `    Final Params (F0=${finalParams.F0.toFixed(1)}, AV=${
        finalParams.AV
      }, AF=${finalParams.AF}, AH=${finalParams.AH}, AVS=${
        finalParams.AVS
      }, GO=${finalParams.GO})`
    );

    if (targetTime > segmentStart) {
      const nextPh = parameterSequence[i + 1];
      const canSmooth =
        transitionSec > 0 &&
        smoothTypes.has(ph.type) &&
        smoothTypes.has(nextPh?.type);
      const steadyTime = canSmooth
        ? Math.max(segmentStart + 0.02, targetTime - transitionSec)
        : null;

      klattTrack.push({
        time: segmentStart,
        phoneme: ph.phoneme,
        word: ph.word,
        params: finalParams,
      });

      if (steadyTime && steadyTime > segmentStart && steadyTime < targetTime) {
        const transitionParams = blendParams(finalParams, nextPh?.params);
        const transitionF0 = isTargetVoiced ? getF0AtTime(steadyTime) : 0;
        transitionParams.F0 = ph.phoneme === "SIL" ? 0 : transitionF0;
        klattTrack.push({
          time: steadyTime,
          phoneme: ph.phoneme,
          word: ph.word,
          params: transitionParams,
        });
      }

      debugLog(`    Added track event at t=${segmentStart.toFixed(3)}`);
      if (steadyTime && steadyTime > segmentStart && steadyTime < targetTime) {
        debugLog(`    Added transition event at t=${steadyTime.toFixed(3)}`);
      }
      currentTime = targetTime;
    }
    // Removed the 'else' block as the non-positive duration case is handled by the 'continue' above
  }
  // Add final silence
  const finalTime = currentTime + 0.1;
  klattTrack.push({
    time: finalTime,
    phoneme: "SIL",
    params: fillDefaultParams(PHONEME_TARGETS["SIL"]),
  });
  debugLog(`  Added final silence event at t=${finalTime.toFixed(3)}`);
  debugLog("--- textToKlattTrack End ---");
  return klattTrack;
}

/**
 * hoist-magic-numbers.ts
 *
 * Migrates hardcoded numeric literals in CEL expressions to named
 * parameters under parameters.policy in frontend.yaml.
 *
 * Usage: npx tsx scripts/hoist-magic-numbers.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const RULES_DIR = path.join(ROOT, "public", "rules");
const FRONTEND_YAML = path.join(RULES_DIR, "frontend.yaml");

// ---------------------------------------------------------------------------
// 1. Define all replacements as { file, find, replace } tuples
// ---------------------------------------------------------------------------

interface Replacement {
  file: string;
  find: string;
  replace: string;
  /** If true, replace ALL occurrences; otherwise just first */
  all?: boolean;
}

const rulesDir = path.join(RULES_DIR, "rules");

const replacements: Replacement[] = [
  // === postlexical.yaml - t_flapping ===
  {
    file: path.join(rulesDir, "postlexical.yaml"),
    find: 'duration: "30"',
    replace: 'duration: "params.policy.duration.flap_duration_ms"',
  },
  {
    file: path.join(rulesDir, "postlexical.yaml"),
    find: 'inherentDuration: "30"',
    replace: 'inherentDuration: "params.policy.duration.flap_duration_ms"',
  },

  // === structural.yaml - expand_diphthongs ===
  {
    file: path.join(rulesDir, "structural.yaml"),
    find: "comp1_duration: total_dur * 0.6",
    replace: "comp1_duration: total_dur * params.policy.duration.diphthong_nucleus_share",
  },
  {
    file: path.join(rulesDir, "structural.yaml"),
    find: "comp2_duration: total_dur * 0.4",
    replace: "comp2_duration: total_dur * (1 - params.policy.duration.diphthong_nucleus_share)",
  },

  // === structural.yaml - 8 occurrences of "- 10" in weak release expressions ===
  // These appear in 4 rules. We replace all occurrences.
  {
    file: path.join(rulesDir, "structural.yaml"),
    find: "rel_target.params.AF - 10",
    replace: "rel_target.params.AF - params.policy.duration.weak_release_amplitude_reduction_db",
    all: true,
  },
  {
    file: path.join(rulesDir, "structural.yaml"),
    find: "rel_target.params.AH - 10",
    replace: "rel_target.params.AH - params.policy.duration.weak_release_amplitude_reduction_db",
    all: true,
  },
  {
    file: path.join(rulesDir, "structural.yaml"),
    find: "asp_target.params.AF - 10",
    replace: "asp_target.params.AF - params.policy.duration.weak_release_amplitude_reduction_db",
    all: true,
  },
  {
    file: path.join(rulesDir, "structural.yaml"),
    find: "asp_target.params.AH - 10",
    replace: "asp_target.params.AH - params.policy.duration.weak_release_amplitude_reduction_db",
    all: true,
  },

  // === formant.yaml - k_context_cl_f2 dispatch values ===
  // Back vowel: value: 1200
  // We need to be precise: this is in the k_context_cl_f2 rule dispatch
  // The pattern is "value: 1200" under the back-vowel when clause
  // We'll use surrounding context to be precise
  // Actually, looking at the file, these values appear as standalone "value: 1200" etc.
  // We need a careful approach: replace in the right context.

  // k_context_cl_f2: replace "value: 1200" (line 15), "value: 1900" (line 19), "default: 1500" (line 20)
  // But "value: 1200" could also appear in bilabial_f2_locus default.
  // No -- bilabial default uses "default: params.policy.formant.bilabial_f2_locus" already.
  // And "1200" only appears once in formant.yaml (in k_context_cl_f2 dispatch).
  // Let me verify by checking all occurrences...

  // k_context_cl_f2 dispatch: back vowel -> 1200, front vowel -> 1900, default -> 1500
  {
    file: path.join(rulesDir, "formant.yaml"),
    find: `        value: 1200`,
    replace: `        value: params.policy.formant.velar_f2_locus_back`,
  },
  {
    file: path.join(rulesDir, "formant.yaml"),
    find: `        value: 1900`,
    replace: `        value: params.policy.formant.velar_f2_locus_front`,
  },
  // "default: 1500" in k_context_cl_f2
  {
    file: path.join(rulesDir, "formant.yaml"),
    find: `      - default: 1500`,
    replace: `      - default: params.policy.formant.velar_f2_locus`,
  },

  // k_context_rel_copy: "prev.params.F2 : 1500"
  {
    file: path.join(rulesDir, "formant.yaml"),
    find: `prev.params.F2 : 1500"`,
    replace: `prev.params.F2 : params.policy.formant.velar_f2_locus"`,
  },

  // bilabial_f2_locus: value: 1350 (front), value: 1100 (back)
  {
    file: path.join(rulesDir, "formant.yaml"),
    find: `        value: 1350`,
    replace: `        value: params.policy.formant.bilabial_f2_locus_front`,
  },
  {
    file: path.join(rulesDir, "formant.yaml"),
    find: `        value: 1100`,
    replace: `        value: params.policy.formant.bilabial_f2_locus_back`,
  },

  // nasal_antiformant_by_place: "current.params.FNZ : 480"
  {
    file: path.join(rulesDir, "formant.yaml"),
    find: `current.params.FNZ : 480"`,
    replace: `current.params.FNZ : params.policy.formant.nasal_fnz_default"`,
  },

  // nasal_place_assimilation: "current.params.FNZ : 1700" -> ref existing nasal_fnz_n
  {
    file: path.join(rulesDir, "formant.yaml"),
    find: `current.params.FNZ : 1700"`,
    replace: `current.params.FNZ : params.policy.formant.nasal_fnz_n"`,
  },

  // nasal_place_assimilation: "current.params.F2 : 1400" (2 occurrences)
  {
    file: path.join(rulesDir, "formant.yaml"),
    find: `current.params.F2 : 1400"`,
    replace: `current.params.F2 : params.policy.formant.nasal_n_f2_default"`,
    all: true,
  },

  // dark_l_allophony: "current.params.F2 : 1050"
  {
    file: path.join(rulesDir, "formant.yaml"),
    find: `current.params.F2 : 1050"`,
    replace: `current.params.F2 : params.policy.formant.light_l_f2"`,
  },

  // dark_l_allophony: "current.params.F3 : 2600"
  {
    file: path.join(rulesDir, "formant.yaml"),
    find: `current.params.F3 : 2600"`,
    replace: `current.params.F3 : params.policy.formant.light_l_f3"`,
  },

  // f1_stop_onset: "default: 280" -> must match the right one (indented)
  {
    file: path.join(rulesDir, "formant.yaml"),
    find: `      - default: 280`,
    replace: `      - default: params.policy.formant.f1_release_default`,
  },

  // burst_spectral_template: 15 values for A2-A6 by place
  // A2: bilabial=50, alveolar=40, velar=45
  // We need to be careful since these values might collide.
  // Looking at the actual file, the burst_spectral_template has 5 field blocks:
  // A2 (bilabial=50, alveolar=40, velar=45)
  // A3 (bilabial=40, alveolar=50, velar=50)
  // A4 (bilabial=35, alveolar=50, velar=55)
  // A5 (bilabial=45, alveolar=45, velar=40)
  // A6 (bilabial=30, alveolar=50, velar=35)
  //
  // Since some values repeat (e.g. 50 appears multiple times),
  // we can't do simple find/replace with just "value: 50".
  // We need context-aware replacement. Let's use multi-line matching.
  // Actually, since values like "50" appear in multiple dispatch entries,
  // we need to process the burst_spectral_template section specially.

  // === vcv_coarticulation: 3 occurrences of "1500" ===
  {
    file: path.join(rulesDir, "formant.yaml"),
    find: `prev_f2: "has(prev.?params.F2) ? prev.params.F2 : 1500"`,
    replace: `prev_f2: "has(prev.?params.F2) ? prev.params.F2 : params.policy.formant.default_f2_fallback"`,
  },
  {
    file: path.join(rulesDir, "formant.yaml"),
    find: `next_f2: "has_flanking ? (has(next_vowel.?params.F2) ? next_vowel.params.F2 : 1500) : 1500"`,
    replace: `next_f2: "has_flanking ? (has(next_vowel.?params.F2) ? next_vowel.params.F2 : params.policy.formant.default_f2_fallback) : params.policy.formant.default_f2_fallback"`,
  },
  {
    file: path.join(rulesDir, "formant.yaml"),
    find: `cur_f2: "has(current.?params.F2) ? current.params.F2 : 1500"`,
    replace: `cur_f2: "has(current.?params.F2) ? current.params.F2 : params.policy.formant.default_f2_fallback"`,
  },

  // === prosody.yaml - f0_stress_peak ===
  {
    file: path.join(rulesDir, "prosody.yaml"),
    find: `at: at_ratio(current, 0.45)`,
    replace: `at: at_ratio(current, params.policy.f0.stress_peak_position)`,
  },

  // === prosody.yaml - f0_question_rise_onset ===
  {
    file: path.join(rulesDir, "prosody.yaml"),
    find: `at: at_ratio(last_stress, 0.8)`,
    replace: `at: at_ratio(last_stress, params.policy.f0.question_rise_onset_position)`,
  },
];

// ---------------------------------------------------------------------------
// 2. Handle burst_spectral_template specially (context-aware replacement)
// ---------------------------------------------------------------------------

/**
 * Replace burst_spectral_template values using regex patterns that match
 * the specific formant field context.
 */
function replaceBurstValues(content: string): string {
  // Map of formant -> place -> { oldValue, paramRef }
  const burstMap: Record<string, Record<string, { old: number; ref: string }>> = {
    A2: {
      bilabial: { old: 50, ref: "params.policy.formant.burst_a2_bilabial" },
      alveolar: { old: 40, ref: "params.policy.formant.burst_a2_alveolar" },
      velar: { old: 45, ref: "params.policy.formant.burst_a2_velar" },
    },
    A3: {
      bilabial: { old: 40, ref: "params.policy.formant.burst_a3_bilabial" },
      alveolar: { old: 50, ref: "params.policy.formant.burst_a3_alveolar" },
      velar: { old: 50, ref: "params.policy.formant.burst_a3_velar" },
    },
    A4: {
      bilabial: { old: 35, ref: "params.policy.formant.burst_a4_bilabial" },
      alveolar: { old: 50, ref: "params.policy.formant.burst_a4_alveolar" },
      velar: { old: 55, ref: "params.policy.formant.burst_a4_velar" },
    },
    A5: {
      bilabial: { old: 45, ref: "params.policy.formant.burst_a5_bilabial" },
      alveolar: { old: 45, ref: "params.policy.formant.burst_a5_alveolar" },
      velar: { old: 40, ref: "params.policy.formant.burst_a5_velar" },
    },
    A6: {
      bilabial: { old: 30, ref: "params.policy.formant.burst_a6_bilabial" },
      alveolar: { old: 50, ref: "params.policy.formant.burst_a6_alveolar" },
      velar: { old: 35, ref: "params.policy.formant.burst_a6_velar" },
    },
  };

  // We'll process the burst_spectral_template section by finding each
  // "- field: params.AX" block and replacing the dispatch values within it.
  for (const [formant, places] of Object.entries(burstMap)) {
    // Find the block starting with "- field: params.<formant>"
    // and ending at the next "- field:" or the end of the rule
    const fieldMarker = `- field: params.${formant}`;
    const fieldIdx = content.indexOf(fieldMarker);
    if (fieldIdx === -1) {
      console.warn(`WARNING: Could not find ${fieldMarker} in formant.yaml`);
      continue;
    }

    // Find the extent of this field block (until next "- field:" or "- default:")
    const nextFieldIdx = content.indexOf("- field:", fieldIdx + fieldMarker.length);
    const blockEnd = nextFieldIdx !== -1 ? nextFieldIdx : content.length;
    let block = content.slice(fieldIdx, blockEnd);

    // Within this block, replace each place's value
    for (const [place, { old, ref }] of Object.entries(places)) {
      // Pattern: after "current.<place> == true\n" ... "value: <old>"
      // We look for the "when: has(current.<place>)..." line followed by "value: <old>"
      const placePattern = new RegExp(`(when:.*current\\.${place}.*\\n\\s+value: )${old}`);
      const match = block.match(placePattern);
      if (match) {
        block = block.replace(placePattern, `$1${ref}`);
      } else {
        console.warn(`WARNING: Could not find ${place}=${old} in ${formant} block`);
      }
    }

    content = content.slice(0, fieldIdx) + block + content.slice(blockEnd);
  }

  return content;
}

// ---------------------------------------------------------------------------
// 3. New parameters to add to frontend.yaml
// ---------------------------------------------------------------------------

const NEW_PARAMS_YAML = `      flap_duration_ms:
        value: 30
        citations:
          - Miller 1998, Pronunciation Modeling in Speech Synthesis
      diphthong_nucleus_share:
        value: 0.6
        citations:
          - Standard diphthong decomposition for formant synthesis
      weak_release_amplitude_reduction_db:
        value: 10
        citations:
          - Allen et al. 1987 Table C-1
          - Stevens 1998 Ch.8`;

const NEW_F0_PARAMS_YAML = `      stress_peak_position:
        value: 0.45
        citations:
          - O'Shaughnessy 1976
      question_rise_onset_position:
        value: 0.8
        citations:
          - O'Shaughnessy 1976
          - Pierrehumbert 1980`;

const NEW_FORMANT_PARAMS_YAML = `      velar_f2_locus:
        value: 1500
        citations:
          - Allen et al. 1987 Ch.11 (velar locus default)
      velar_f2_locus_back:
        value: 1200
        citations:
          - Allen et al. 1987 Ch.11 (velar locus, back vowel context)
      velar_f2_locus_front:
        value: 1900
        citations:
          - Allen et al. 1987 Ch.11 (velar locus, front/high vowel context)
      bilabial_f2_locus_front:
        value: 1350
        citations:
          - Stevens & House 1956 (bilabial locus, front/high vowel context)
      bilabial_f2_locus_back:
        value: 1100
        citations:
          - Stevens & House 1956 (bilabial locus, back vowel context)
      nasal_fnz_default:
        value: 480
        citations:
          - Stevens 1998 Ch.10 (nasal consonant antiformant fallback)
      nasal_n_f2_default:
        value: 1400
        citations:
          - Allen et al. 1987 Ch.10 (nasal place assimilation F2 fallback)
      light_l_f2:
        value: 1050
        citations:
          - Sproat & Fujimura 1993 (onset /l/ F2)
          - Recasens 2012
      light_l_f3:
        value: 2600
        citations:
          - Recasens 2012 (onset /l/ F3)
      f1_release_default:
        value: 280
        citations:
          - Stevens 1998 Ch.8 (stop consonant F1 at release, default fallback)
      burst_a2_bilabial:
        value: 50
        citations:
          - Blumstein & Stevens 1979
          - Zue 1976
      burst_a2_alveolar:
        value: 40
        citations:
          - Blumstein & Stevens 1979
          - Zue 1976
      burst_a2_velar:
        value: 45
        citations:
          - Blumstein & Stevens 1979
          - Zue 1976
      burst_a3_bilabial:
        value: 40
        citations:
          - Blumstein & Stevens 1979
          - Zue 1976
      burst_a3_alveolar:
        value: 50
        citations:
          - Blumstein & Stevens 1979
          - Zue 1976
      burst_a3_velar:
        value: 50
        citations:
          - Blumstein & Stevens 1979
          - Zue 1976
      burst_a4_bilabial:
        value: 35
        citations:
          - Blumstein & Stevens 1979
          - Zue 1976
      burst_a4_alveolar:
        value: 50
        citations:
          - Blumstein & Stevens 1979
          - Zue 1976
      burst_a4_velar:
        value: 55
        citations:
          - Blumstein & Stevens 1979
          - Zue 1976
      burst_a5_bilabial:
        value: 45
        citations:
          - Blumstein & Stevens 1979
          - Zue 1976
      burst_a5_alveolar:
        value: 45
        citations:
          - Blumstein & Stevens 1979
          - Zue 1976
      burst_a5_velar:
        value: 40
        citations:
          - Blumstein & Stevens 1979
          - Zue 1976
      burst_a6_bilabial:
        value: 30
        citations:
          - Blumstein & Stevens 1979
          - Zue 1976
      burst_a6_alveolar:
        value: 50
        citations:
          - Blumstein & Stevens 1979
          - Zue 1976
      burst_a6_velar:
        value: 35
        citations:
          - Blumstein & Stevens 1979
          - Zue 1976
      default_f2_fallback:
        value: 1500
        citations:
          - Peterson & Barney 1952 (midrange F2 default)`;

// ---------------------------------------------------------------------------
// 4. Main execution
// ---------------------------------------------------------------------------

function main() {
  console.log("=== Hoisting CEL magic numbers to parameters.policy ===\n");

  // --- Step A: Add new parameters to frontend.yaml ---
  let frontendContent = fs.readFileSync(FRONTEND_YAML, "utf-8");

  // Insert new duration params after the last existing duration param (stop_unreleasing_min_ms block)
  const durationInsertMarker = "          - Crystal & House 1988\n          - Miller 1998";
  if (!frontendContent.includes(durationInsertMarker)) {
    console.error("ERROR: Cannot find duration insert marker in frontend.yaml");
    process.exit(1);
  }
  frontendContent = frontendContent.replace(
    durationInsertMarker,
    durationInsertMarker + "\n" + NEW_PARAMS_YAML,
  );

  // Insert new f0 params after the last existing f0 param (question_last_stress_lookback_tokens block)
  const f0InsertMarker = `          - "Engineering estimate: lookback window for placing pre-boundary question-rise onset"`;
  if (!frontendContent.includes(f0InsertMarker)) {
    console.error("ERROR: Cannot find f0 insert marker in frontend.yaml");
    process.exit(1);
  }
  frontendContent = frontendContent.replace(
    f0InsertMarker,
    f0InsertMarker + "\n" + NEW_F0_PARAMS_YAML,
  );

  // Insert new formant params after the last existing formant param (vcv_coarticulation_rate block)
  const formantInsertMarker = `        citations:
          - Ohman 1966
output:`;
  if (!frontendContent.includes(formantInsertMarker)) {
    console.error("ERROR: Cannot find formant insert marker in frontend.yaml");
    process.exit(1);
  }
  frontendContent = frontendContent.replace(
    formantInsertMarker,
    `        citations:
          - Ohman 1966\n` +
      NEW_FORMANT_PARAMS_YAML +
      "\noutput:",
  );

  fs.writeFileSync(FRONTEND_YAML, frontendContent, "utf-8");
  console.log(`Updated: ${FRONTEND_YAML}`);

  // --- Step B: Apply all string replacements to rule files ---
  // Group replacements by file for efficiency
  const byFile = new Map<string, Replacement[]>();
  for (const r of replacements) {
    const list = byFile.get(r.file) || [];
    list.push(r);
    byFile.set(r.file, list);
  }

  for (const [filePath, reps] of byFile) {
    let content = fs.readFileSync(filePath, "utf-8");

    for (const r of reps) {
      if (r.all) {
        const count = content.split(r.find).length - 1;
        if (count === 0) {
          console.warn(`WARNING: Pattern not found in ${path.basename(filePath)}: "${r.find}"`);
          continue;
        }
        content = content.split(r.find).join(r.replace);
        console.log(
          `  Replaced ${count}x: "${r.find}" -> "${r.replace}" in ${path.basename(filePath)}`,
        );
      } else {
        if (!content.includes(r.find)) {
          console.warn(`WARNING: Pattern not found in ${path.basename(filePath)}: "${r.find}"`);
          continue;
        }
        content = content.replace(r.find, r.replace);
        console.log(`  Replaced: "${r.find}" -> "${r.replace}" in ${path.basename(filePath)}`);
      }
    }

    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Updated: ${filePath}`);
  }

  // --- Step C: Apply burst_spectral_template replacements to formant.yaml ---
  const formantPath = path.join(rulesDir, "formant.yaml");
  let formantContent = fs.readFileSync(formantPath, "utf-8");
  formantContent = replaceBurstValues(formantContent);
  fs.writeFileSync(formantPath, formantContent, "utf-8");
  console.log(`Updated burst_spectral_template values in: ${formantPath}`);

  console.log("\n=== Done. Run tests to verify. ===");
}

main();

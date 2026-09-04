// dt-10 syllabification table extractor.
//
// Reads the DECtalk 4.63 US syllabification source tables from
//   C:/Users/Q/src/dectalk/463/dapi/src/PH/p_us_sy1.c       (us_ascky_check, us_syl_vowels, us_syl_cons, us_common_affixes)
//   C:/Users/Q/src/dectalk/463/dapi/src/INCLUDE/l_all_ph.h  (US_* phone enum -> ascky_check index)
// and emits the syllabification:{} YAML block for the dectalk-english pipeline,
// plus the ARPABET<->ascky map.
//
// The us_ascky_check[] array is indexed by the US_* phone enum value (SIL=0,
// US_IY=1, ... US_CZ=58).  The DECtalk phone NAME (US_IY -> "IY") is the same
// ARPABET symbol the Qlatt dectalk-english frontend emits, so the ascky char for
// an ARPABET symbol X is us_ascky_check[US_X].  A few port symbols rename the
// DECtalk enum entry: HH=US_HX, NG=US_NX, GS=US_Q (mapped below).
//
// Run: npx tsx scripts/dt10-extract-syllable-tables.ts
import { readFileSync } from "node:fs";

const SY1 = "C:/Users/Q/src/dectalk/463/dapi/src/PH/p_us_sy1.c";
const PH = "C:/Users/Q/src/dectalk/463/dapi/src/INCLUDE/l_all_ph.h";

// --- 1. US_* enum (name -> index) ---
const phText = readFileSync(PH, "utf8");
const enumByName = new Map<string, number>();
// SIL is "#define SIL 0" (no US_ prefix); US_* are "#define US_NAME  N".
for (const m of phText.matchAll(/^#define\s+(SIL|US_([A-Z]+))\s+(\d+)/gm)) {
  const name = m[2] ?? "SIL"; // strip US_ prefix; SIL stays SIL
  enumByName.set(name, Number(m[3]));
}

// --- 2. us_ascky_check[] (index -> char code or 0) ---
const sy1 = readFileSync(SY1, "utf8");
const asckyBody = sy1.match(/us_ascky_check\[\]\s*=\s*\{([\s\S]*?)\};/)?.[1];
if (!asckyBody) throw new Error("could not find us_ascky_check[]");
const asckyTokens = asckyBody
  .split(",")
  .map((t) => t.trim())
  .filter((t) => t.length > 0);
// Each token is either `0` or `'c'`.
const asckyByIndex: string[] = asckyTokens.map((t) => {
  if (t === "0") return ""; // 0 = non-sounded / transparent
  const c = t.match(/^'(.+)'$/)?.[1];
  if (c == null) throw new Error(`unexpected ascky token: ${t}`);
  return c;
});

// --- 3. ARPABET (port symbol) -> ascky char ---
// Port symbol -> DECtalk enum name (only the renamed ones differ).
const PORT_TO_ENUM: Record<string, string> = { HH: "HX", NG: "NX", GS: "Q" };
const arpabetToAscky: Record<string, string> = {};
// Every enum name that has a non-zero ascky char, keyed by the PORT symbol.
const enumToPort = new Map<string, string>();
for (const [port, en] of Object.entries(PORT_TO_ENUM)) enumToPort.set(en, port);
for (const [name, idx] of enumByName) {
  const ch = asckyByIndex[idx] ?? "";
  if (ch === "") continue; // transparent phones not mapped
  const port = enumToPort.get(name) ?? name;
  arpabetToAscky[port] = ch;
}

// PORT-SPECIFIC OVERRIDE: the r-colored vowels IR/ER/AR/OR/UR have
// us_ascky_check[]==0 (transparent) in DECtalk because DECtalk syllabifies
// BEFORE r-fusion -- at that stage the word still contains a separate /R/
// (e.g. "car" = K AH R) so the rhotic vowel code does not yet exist.  The
// Qlatt port runs r-fusion (postlexical) BEFORE the syllabify annotation pass,
// so by syllabify time the relation carries the fused rhotic vowel as the
// syllable nucleus.  Map them to the syllabic-r nucleus char 'R' (= US_RR's
// ascky char, which IS in us_syl_vowels) so they count as nuclei.
// Citation: DECtalk 4.63 p_us_sy1.c us_syl_vowels (US_RR -> 'R' nucleus);
//           port ordering note (r-fusion precedes syllabification).
for (const v of ["IR", "ER", "AR", "OR", "UR"]) {
  if (arpabetToAscky[v] == null) arpabetToAscky[v] = "R";
}

// --- 4. us_syl_vowels (ascky chars that are nuclei) ---
const vowelsRaw = sy1.match(/us_syl_vowels\[\]\s*=\s*"([^"]*)"/)?.[1] ?? "";
const sylVowels = vowelsRaw.split("");

// --- 5. us_syl_cons (legal onset clusters, longest-first) ---
const consBody =
  sy1.match(/us_syl_cons\[\]\s*=\s*\{([\s\S]*?)\};/)?.[1] ??
  sy1.match(/us_syl_cons\b[\s\S]*?\{([\s\S]*?)\};/)?.[1];
if (!consBody) throw new Error("could not find us_syl_cons[]");
const onsetClusters = [...consBody.matchAll(/"([^"]*)"/g)].map((m) => m[1]);

// --- 6. us_common_affixes ---
const affixBody = sy1.match(/us_common_affixes\b[\s\S]*?\{([\s\S]*?)\};/)?.[1];
if (!affixBody) throw new Error("could not find us_common_affixes[]");
const affixes = [...affixBody.matchAll(/"([^"]*)"/g)].map((m) => m[1]);

// --- report ---
console.log("=== ARPABET -> ascky (sounded phones) ===");
console.log(JSON.stringify(arpabetToAscky, null, 0));
console.log("\nsyllable nuclei (ascky):", sylVowels.join(""));
console.log("onset clusters (longest-first, count " + onsetClusters.length + "):");
console.log(JSON.stringify(onsetClusters));
console.log("\naffixes (count " + affixes.length + "):");
console.log(JSON.stringify(affixes));

// Sanity: which ascky chars used by onset/vowel tables have no ARPABET preimage?
const asckyToArpabet = new Map<string, string>();
for (const [a, c] of Object.entries(arpabetToAscky)) asckyToArpabet.set(c, a);
const referenced = new Set<string>();
for (const v of sylVowels) referenced.add(v);
for (const cl of onsetClusters) for (const ch of cl) if (ch !== " ") referenced.add(ch);
for (const af of affixes) for (const ch of af) if (ch !== " ") referenced.add(ch);
const unmapped = [...referenced].filter((ch) => !asckyToArpabet.has(ch));
console.log(
  "\nascky chars referenced by tables with NO ARPABET preimage in port:",
  JSON.stringify(unmapped),
);
console.log(
  "(these are DECtalk phones the port does not emit -- vowels like @,a,c,| ; consonants like C,J,G,L,N already mapped?)",
);

// Emit a YAML-ready block
console.log("\n=== YAML block (syllabification:) ===");
const yamlArpabet = Object.entries(arpabetToAscky)
  .map(([k, v]) => `    ${k}: "${v}"`)
  .join("\n");
console.log("syllabification:");
console.log('  nuclei: "' + sylVowels.join("") + '"');
console.log("  onset_clusters:");
for (const cl of onsetClusters) console.log(`    - "${cl}"`);
console.log("  affixes:");
for (const af of affixes) console.log(`    - "${af}"`);
console.log("  ascky:");
console.log(yamlArpabet);

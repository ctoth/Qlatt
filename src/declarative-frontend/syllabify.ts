// Generic, data-driven syllabification pass for the declarative frontend.
//
// This is a reusable linguistic primitive (like count_word_vowels /
// cluster_position_in_word in engine.ts): a pure algorithm that consumes the
// onset-cluster / nucleus / affix TABLES supplied as DATA by a frontend config
// and annotates each phone token with its syllable structure.  It contains NO
// hardcoded phoneme, cluster, or affix lists -- every linguistic fact lives in
// the `SyllabificationTables` passed in.  A frontend that declares no
// syllabification tables gets a no-op (the engine never calls this).
//
// Algorithm: DECtalk 4.63 ph_syl.c ph_syllab() (L876-1069) operating BACKWARD
// over one word -- affix-stripping (us_common_affixes) then maximal-onset using
// the longest-first onset-cluster table (us_syl_cons), with nuclei from
// us_syl_vowels.  Tables extracted from p_us_sy1.c by
// scripts/dt10-extract-syllable-tables.ts.
//
// Citations:
//   - DECtalk 4.63 ph_syl.c ph_syllab() (backward maximal-onset + affix strip)
//   - DECtalk 4.63 p_us_sy1.c (us_syl_vowels, us_syl_cons, us_common_affixes,
//     us_ascky_check phone->sonority-char alphabet)

export type SyllabificationTables = {
  /** ascky chars that count as syllable nuclei (us_syl_vowels). */
  nuclei: string;
  /** Legal onset clusters in ascky chars, longest-first (us_syl_cons). */
  onsetClusters: string[];
  /** Common affix strings in ascky chars (us_common_affixes). */
  affixes: string[];
  /** Port ARPABET symbol -> ascky char (us_ascky_check, via the US_* enum). */
  ascky: Record<string, string>;
};

export type SyllableRole = "onset" | "nucleus" | "coda";

/** Per-token syllable annotation produced for one word. */
export type SyllableAnnotation = {
  /** 0-based syllable ordinal within the word. */
  syllableIndex: number;
  role: SyllableRole;
  /** "first" | "medial" | "last" | "only" -- derived from index + count. */
  positionInWord: "first" | "medial" | "last" | "only";
  /** Total syllables in the word. */
  syllableCount: number;
};

/**
 * Validate and normalize a raw `syllabification:` config block into tables.
 * Returns null when the block is absent/empty so the caller treats syllabify as
 * a no-op.  Throws on a malformed (present-but-wrong-shape) block so config
 * errors surface loudly.
 */
export function parseSyllabificationTables(raw: unknown): SyllabificationTables | null {
  if (raw == null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("E_SYLLABIFICATION_INVALID: syllabification must be an object");
  }
  const block = raw as Record<string, unknown>;
  const nuclei = block.nuclei;
  const onsetClusters = block.onset_clusters;
  const affixes = block.affixes;
  const ascky = block.ascky;
  if (typeof nuclei !== "string" || nuclei.length === 0) return null;
  if (!Array.isArray(onsetClusters)) {
    throw new Error("E_SYLLABIFICATION_INVALID: syllabification.onset_clusters must be an array");
  }
  if (!Array.isArray(affixes)) {
    throw new Error("E_SYLLABIFICATION_INVALID: syllabification.affixes must be an array");
  }
  if (typeof ascky !== "object" || ascky == null || Array.isArray(ascky)) {
    throw new Error("E_SYLLABIFICATION_INVALID: syllabification.ascky must be a map");
  }
  const asckyMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(ascky as Record<string, unknown>)) {
    if (typeof v !== "string" || v.length !== 1) {
      throw new Error(
        `E_SYLLABIFICATION_INVALID: syllabification.ascky['${k}'] must be a single char`,
      );
    }
    asckyMap[k] = v;
  }
  return {
    nuclei,
    onsetClusters: onsetClusters.map((c) => String(c)),
    affixes: affixes.map((a) => String(a)),
    ascky: asckyMap,
  };
}

/**
 * Reduce a surface phoneme symbol to the base ARPABET symbol used as a key in
 * the ascky map.  Strips a trailing stress digit (IY1 -> IY) and the
 * release/aspiration/closure suffixes that the structural phase appends when it
 * splits a stop (T_REL/T_ASP/T_CL -> T).  Returns the base symbol.
 */
export function basePhonemeSymbol(phoneme: string): string {
  let base = phoneme;
  const underscore = base.indexOf("_");
  if (underscore > 0) base = base.slice(0, underscore);
  base = base.replace(/[0-9]+$/, "");
  return base;
}

/**
 * Map a surface phoneme to its ascky char, or "" (transparent) if the phone is
 * non-sounded (release burst, aspiration, dummy-vowel carrier, boundary) -- i.e.
 * not present in the ascky map.  Transparent phones are skipped by the scans,
 * matching us_ascky_check[]==0.
 */
function phonemeToAscky(phoneme: string, tables: SyllabificationTables): string {
  const base = basePhonemeSymbol(phoneme);
  const ch = tables.ascky[base];
  return typeof ch === "string" ? ch : "";
}

type WordPhone = {
  /** Original index of this phone within the word's phone list. */
  wordPos: number;
  /** ascky char ("" = transparent / non-sounded). */
  ascky: string;
};

/**
 * Syllabify one word given its phones (in surface order) and assign every phone
 * a SyllableAnnotation.  Transparent phones (ascky "") inherit the syllable of
 * the most recent sounded phone in the same syllable; if none yet, the next.
 *
 * Implements DECtalk maximal-onset + affix stripping.  Works in ascky space.
 * Operates backward (word-end -> word-start), building syllable boundaries, then
 * the boundaries are re-numbered front-to-back so syllableIndex 0 = first.
 */
export function syllabifyWord(
  phonemes: readonly string[],
  tables: SyllabificationTables,
): SyllableAnnotation[] {
  const n = phonemes.length;
  const phones: WordPhone[] = phonemes.map((p, i) => ({
    wordPos: i,
    ascky: phonemeToAscky(p, tables),
  }));

  // Indices of the SOUNDED phones (ascky != "") in surface order.  All scanning
  // happens over this list; transparent phones are attached afterward.
  const sounded = phones.filter((p) => p.ascky !== "");
  const isNucleus = (ch: string): boolean => tables.nuclei.includes(ch);

  // No nucleus -> the whole word is a single syllable; everything is onset/coda
  // with no nucleus (degenerate but safe).  Treat all as one syllable.
  const nucleusCount = sounded.filter((p) => isNucleus(p.ascky)).length;

  // role per sounded-phone index (into `sounded`)
  const roles: SyllableRole[] = new Array(sounded.length);
  // syllable boundary BEFORE sounded[i] (true => sounded[i] starts a new syll)
  const startsSyllable: boolean[] = new Array(sounded.length).fill(false);
  let syllableOf: number[] = new Array(sounded.length).fill(0);

  if (nucleusCount === 0) {
    // Degenerate: one syllable, no nucleus.  Mark all coda-ish as onset (they
    // precede no nucleus) -- choose "onset" for a sounded consonant-only word.
    for (let i = 0; i < sounded.length; i++) roles[i] = "onset";
  } else {
    // Longest-first onset clusters, pre-tokenized into ascky-char arrays.
    // Leading-space entries (" Sm", " SL", " Y") encode a word/morpheme-edge
    // special case in DECtalk; we treat the trailing chars as the cluster and
    // only allow them when they reach the start of the word (no preceding
    // sounded consonant), mirroring the leading-space "edge only" intent.
    const onsets = tables.onsetClusters.map((c) => ({
      chars: c.replace(/^ /, "").split(""),
      edgeOnly: c.startsWith(" "),
    }));
    // Sort longest-first defensively (the table already is, but be robust).
    onsets.sort((a, b) => b.chars.length - a.chars.length);

    // Find nucleus positions (indices into `sounded`).
    const nucleusIdx: number[] = [];
    for (let i = 0; i < sounded.length; i++) {
      if (isNucleus(sounded[i].ascky)) nucleusIdx.push(i);
    }

    // AFFIX STRIPPING (DECtalk ph_syl.c L971-986, runs before maximal-onset):
    // peel known affixes off the word TAIL (in ascky space), forcing a syllable
    // boundary at the START of each matched affix.  Affixes are matched
    // longest-first against the sounded-phone tail and stripping repeats until
    // no affix matches the remaining tail.  We record the forced boundary start
    // indices (into `sounded`); the maximal-onset loop below honors them.
    const forcedBoundary = new Set<number>();
    const soundedAscky = sounded.map((p) => p.ascky);
    if (tables.affixes.length > 0) {
      // affixes pre-split into ascky-char arrays, longest first
      const affixChars = tables.affixes.map((a) => a.split("")).sort((x, y) => y.length - x.length);
      let tailEnd = sounded.length; // exclusive end of the remaining word tail
      // Don't strip into the first syllable: keep at least one nucleus + its
      // onset before the earliest affix (an affix cannot be the whole word).
      let progressed = true;
      while (progressed && tailEnd > 0) {
        progressed = false;
        for (const af of affixChars) {
          const len = af.length;
          const from = tailEnd - len;
          if (from <= 0) continue; // never strip the entire word / first phone
          // The affix must contain a nucleus to be a syllable-bearing affix and
          // must not consume the last remaining nucleus run.
          let match = true;
          for (let j = 0; j < len; j++) {
            if (soundedAscky[from + j] !== af[j]) {
              match = false;
              break;
            }
          }
          if (!match) continue;
          const affixHasNucleus = af.some((c) => isNucleus(c));
          if (!affixHasNucleus) continue;
          // Ensure at least one nucleus remains before the affix start.
          let nucleusBefore = false;
          for (let j = 0; j < from; j++) {
            if (isNucleus(soundedAscky[j])) {
              nucleusBefore = true;
              break;
            }
          }
          if (!nucleusBefore) continue;
          forcedBoundary.add(from);
          tailEnd = from;
          progressed = true;
          break;
        }
      }
    }

    // For each nucleus, determine how many of the consonants immediately before
    // it (and after the previous nucleus) form this syllable's onset, using the
    // longest legal cluster.  The rest are the previous syllable's coda.
    // boundaryAt[k] = index into `sounded` where syllable k begins.
    const syllableStart: number[] = [];
    let prevNucleus = -1;
    for (let k = 0; k < nucleusIdx.length; k++) {
      const nuc = nucleusIdx[k];
      // consonants between prevNucleus (exclusive) and nuc (exclusive)
      const clusterStart = prevNucleus + 1; // first consonant index
      const available = nuc - clusterStart; // count of consonants before nucleus
      let onsetLen = 0;
      if (k === 0) {
        // First syllable: ALL leading consonants are onset (word-initial),
        // regardless of cluster legality -- DECtalk takes the whole word-initial
        // consonant run as the first onset.
        onsetLen = available;
      } else {
        // Maximal legal onset: longest cluster (from the table) that matches the
        // consonants immediately before the nucleus, bounded by `available`.
        for (const o of onsets) {
          const len = o.chars.length;
          if (len > available) continue;
          // The cluster occupies sounded[nuc-len .. nuc-1].
          const from = nuc - len;
          if (o.edgeOnly && from !== clusterStart) continue; // edge-only: only if it consumes the whole inter-vocalic run
          let match = true;
          for (let j = 0; j < len; j++) {
            if (sounded[from + j].ascky !== o.chars[j]) {
              match = false;
              break;
            }
          }
          if (match) {
            onsetLen = len;
            break;
          }
        }
        // No table cluster matched: a single consonant is still a legal onset of
        // the following syllable if there is at least one consonant; take 1
        // (maximal onset prefers giving the following syllable an onset).  If
        // there are 0 consonants, onsetLen stays 0.
        if (onsetLen === 0 && available > 0) {
          // Single-consonant onsets are all present in the table, so this only
          // triggers for a consonant char that has no 1-char table entry; still
          // attach one consonant as onset to honor maximal onset.
          onsetLen = Math.min(1, available);
        }
      }
      let start = nuc - onsetLen;
      // Honor affix-forced boundaries: an onset may not extend back across a
      // forced boundary that lies between the previous nucleus and this one.
      // If such a boundary exists, the onset starts at (or after) it.
      for (let b = clusterStart; b <= nuc; b++) {
        if (forcedBoundary.has(b) && b > start) start = b;
      }
      syllableStart.push(start);
      prevNucleus = nuc;
    }
    // A forced boundary in a consonant run that has NO following nucleus in this
    // word tail (rare) is still recorded as a syllable start below.

    // Mark startsSyllable from syllableStart (skip k==0; word start is implicit).
    for (let k = 1; k < syllableStart.length; k++) {
      startsSyllable[syllableStart[k]] = true;
    }
    // Also mark any affix-forced boundary that did not coincide with a computed
    // onset start (e.g. a boundary inside a coda run), but never at index 0.
    for (const b of forcedBoundary) {
      if (b > 0 && b < sounded.length) startsSyllable[b] = true;
    }

    // Assign syllable index to each sounded phone by walking and bumping at
    // boundaries.  Leading consonants before the first nucleus belong to
    // syllable 0.
    let syl = 0;
    syllableOf = new Array(sounded.length);
    for (let i = 0; i < sounded.length; i++) {
      if (startsSyllable[i]) syl++;
      syllableOf[i] = syl;
    }

    // Determine role: nucleus phones are "nucleus"; a sounded phone before the
    // nucleus of its OWN syllable is "onset"; after it is "coda".
    // Find each syllable's nucleus index (first nucleus phone in that syllable).
    const sylNucleus = new Map<number, number>();
    for (let i = 0; i < sounded.length; i++) {
      if (isNucleus(sounded[i].ascky) && !sylNucleus.has(syllableOf[i])) {
        sylNucleus.set(syllableOf[i], i);
      }
    }
    for (let i = 0; i < sounded.length; i++) {
      const s = syllableOf[i];
      const nucI = sylNucleus.get(s);
      if (isNucleus(sounded[i].ascky)) roles[i] = "nucleus";
      else if (nucI != null && i < nucI) roles[i] = "onset";
      else roles[i] = "coda";
    }
  }

  const syllableCount = Math.max(1, (syllableOf[syllableOf.length - 1] ?? 0) + 1);

  const positionFor = (idx: number): SyllableAnnotation["positionInWord"] => {
    if (syllableCount === 1) return "only";
    if (idx === 0) return "first";
    if (idx === syllableCount - 1) return "last";
    return "medial";
  };

  // Build the result array aligned to the ORIGINAL phone order (length n).
  const result: SyllableAnnotation[] = new Array(n);
  // Map each sounded phone (by its position in `sounded`) back to wordPos.
  for (let si = 0; si < sounded.length; si++) {
    const wp = sounded[si].wordPos;
    const sIdx = syllableOf[si];
    result[wp] = {
      syllableIndex: sIdx,
      role: roles[si],
      positionInWord: positionFor(sIdx),
      syllableCount,
    };
  }
  // Transparent phones: attach to the nearest preceding sounded phone in the
  // same run; if none precede (word starts with a transparent phone), attach to
  // the nearest following sounded phone.  They take that phone's syllable, and a
  // "coda"/"onset" role matching their side relative to the nucleus.
  for (let i = 0; i < n; i++) {
    if (result[i] != null) continue;
    // search backward
    let donor: SyllableAnnotation | null = null;
    for (let j = i - 1; j >= 0; j--) {
      if (result[j] != null) {
        donor = result[j];
        break;
      }
    }
    if (donor == null) {
      for (let j = i + 1; j < n; j++) {
        if (result[j] != null) {
          donor = result[j];
          break;
        }
      }
    }
    if (donor == null) {
      // Entire word is transparent (no sounded phones): single empty syllable.
      result[i] = { syllableIndex: 0, role: "coda", positionInWord: "only", syllableCount: 1 };
    } else {
      result[i] = {
        syllableIndex: donor.syllableIndex,
        // A transparent phone (burst/aspiration/dummy) sits with the consonant it
        // came from; inherit a non-nucleus role.
        role: donor.role === "nucleus" ? "coda" : donor.role,
        positionInWord: donor.positionInWord,
        syllableCount: donor.syllableCount,
      };
    }
  }
  return result;
}

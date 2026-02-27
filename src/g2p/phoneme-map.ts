/**
 * Maps Elovitz phoneme notation to Qlatt ARPAbet.
 *
 * Most phonemes are identity mappings. Key differences:
 *   AX -> AH  (schwa — no stress digit, stress added by Phase 4)
 *   NX -> NG  (velar nasal)
 *   WH -> W   (modern English wh-merger)
 *   Prosodic markers (< >, <,>, <.>, <?>, <->) are filtered out.
 *
 * Citation: Elovitz, Johnson, McHugh & Shore (1976). NRL Report 7948.
 */

const ELOVITZ_TO_QLATT: Record<string, string> = {
  AX: 'AH',
  NX: 'NG',
  WH: 'W',
};

/** Prosodic markers emitted by Elovitz rules — filtered from output. */
const PROSODIC_MARKERS = new Set(['< >', '<,>', '<.>', '<?>', '<->']);

/**
 * Convert an array of Elovitz-notation phonemes to Qlatt ARPAbet.
 * Prosodic markers are removed; non-mapped phonemes pass through unchanged.
 */
export function mapElovitzToQlatt(elovitzPhonemes: string[]): string[] {
  const result: string[] = [];
  for (const p of elovitzPhonemes) {
    if (PROSODIC_MARKERS.has(p)) continue;
    result.push(ELOVITZ_TO_QLATT[p] ?? p);
  }
  return result;
}

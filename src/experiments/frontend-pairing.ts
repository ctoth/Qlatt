/**
 * Which experiment (synthesizer backend) a frontend is played through when
 * the user has not chosen one.
 *
 * The pairing is data: a frontend's entry in
 * `public/rules/frontends/manifest.json` may name a `defaultExperiment`.
 * Without that field the experiment with the frontend's own id is its
 * default, if there is one; otherwise the frontend has no default and the
 * current selection stands (qlatt-english plays through whatever experiment
 * is selected).
 */

export interface FrontendManifestEntry {
  id: string;
  name?: string;
  description?: string;
  entryPoint?: string;
  /** Id of the experiment this frontend is paired with by default. */
  defaultExperiment?: string;
}

export interface FrontendManifest {
  frontends?: FrontendManifestEntry[];
}

/**
 * The default experiment of a frontend among the experiments on offer, or
 * null when it has none. A `defaultExperiment` that names an experiment not
 * on offer is an error in the manifests, not a reason to fall back silently.
 */
export function defaultExperimentFor(
  frontendId: string,
  manifest: FrontendManifest | null | undefined,
  experimentIds: readonly string[],
): string | null {
  const entry = manifest?.frontends?.find((candidate) => candidate.id === frontendId);
  const declared = entry?.defaultExperiment;
  if (declared !== undefined) {
    if (typeof declared !== "string" || !experimentIds.includes(declared)) {
      throw new Error(
        `E_FRONTEND_DEFAULT_EXPERIMENT: frontend '${frontendId}' names default experiment ` +
          `'${String(declared)}', which is not in the experiment manifest`,
      );
    }
    return declared;
  }
  return experimentIds.includes(frontendId) ? frontendId : null;
}

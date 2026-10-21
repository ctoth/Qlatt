/**
 * Which experiment (synthesizer backend) a frontend is played through when
 * the user has not chosen one.
 *
 * The pairing is data: a frontend's entry in
 * `public/rules/frontends/manifest.json` may name a `defaultExperiment`.
 * No id equality or baseline fallback supplies an undeclared default.
 * Callers retain an explicitly selected experiment instead of applying a default.
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
 * an error when it has none. A `defaultExperiment` that names an experiment not
 * on offer is an error in the manifests, not a reason to fall back silently.
 */
export function defaultExperimentFor(
  frontendId: string,
  manifest: FrontendManifest | null | undefined,
  experimentIds: readonly string[],
): string {
  const entry = manifest?.frontends?.find((candidate) => candidate.id === frontendId);
  const declared = entry?.defaultExperiment;
  if (typeof declared !== "string" || !declared.trim() || !experimentIds.includes(declared)) {
    const reason = !entry
      ? "is not in the frontend catalogue"
      : declared === undefined
        ? "declares no default experiment"
        : `names invalid or unavailable default experiment '${String(declared)}'`;
    throw new Error(`E_FRONTEND_DEFAULT_EXPERIMENT: frontend '${frontendId}' ${reason}`);
  }
  return declared;
}

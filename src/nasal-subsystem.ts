import type { Diagnostics } from "./diagnostics";
import type { ProvenanceCollector } from "./provenance";

type TokenLike = Record<string, any>;
type FrameLike = { phoneme?: string; params?: Record<string, number> };

const KLATT_1980 = "Klatt 1980 Table I";
const HAWKINS_STEVENS_1985 = "Hawkins & Stevens 1985";
const FUJIMURA_1962 = "Fujimura 1962";
const STEVENS_1998 = "Stevens 1998 Ch.10";
const CHEN_1997 = "Chen 1997";
const MAEDA_1982 = "Maeda 1982";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getTokenId(token: TokenLike, fallback: string): string {
  return typeof token?.id === "string" && token.id.length > 0 ? token.id : fallback;
}

function getTokenParent(tokenDecisionIds: Map<string, string>, token: TokenLike, fallback: string): string[] | undefined {
  const parent = tokenDecisionIds.get(getTokenId(token, fallback));
  return parent ? [parent] : undefined;
}

function regimeForToken(token: TokenLike): "oral" | "nasalized_vowel" | "nasal_murmur" {
  if (token?.type === "nasal" || (token?.params?.nasalMurmurStrength ?? 0) > 0) {
    return "nasal_murmur";
  }
  if ((token?.params?.nasalCoupling ?? 0) > 0 || Array.isArray(token?.control_windows)) {
    return "nasalized_vowel";
  }
  return "oral";
}

function emitRulesStageEvents(
  tokens: TokenLike[],
  provenance: ProvenanceCollector,
  tokenDecisionIds: Map<string, string>,
): void {
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token?.stream === "f0" || token?.status === 2) continue;
    const tokenId = getTokenId(token, `ph_${i}`);
    const parents = getTokenParent(tokenDecisionIds, token, `ph_${i}`);
    const regime = regimeForToken(token);

    if (regime !== "oral") {
      provenance.add({
        stage: "rules",
        type: "nasal_regime_selected",
        subject: `token:${tokenId}`,
        reason: `${regime} because nasal controls were assigned (tag: nasal_coupling)`,
        citations:
          regime === "nasal_murmur"
            ? [FUJIMURA_1962, STEVENS_1998]
            : [HAWKINS_STEVENS_1985],
        parents,
      });
    }

    const placeIndex = Number(token?.params?.nasalPlaceIndex ?? 0);
    if (placeIndex > 0) {
      const place =
        placeIndex === 1 ? "m" :
        placeIndex === 2 ? "n" :
        placeIndex === 3 ? "ng" :
        "none";
      const placeDecision = provenance.add({
        stage: "rules",
        type: "nasal_place_assigned",
        subject: `token:${tokenId}`,
        reason: `nasal place set to ${place} because nasal segment or assimilation rule matched (tag: nasal_place)`,
        citations: [FUJIMURA_1962, STEVENS_1998],
        parents,
      });
      tokenDecisionIds.set(tokenId, placeDecision.id);
    }

    const windows = Array.isArray(token?.control_windows) ? token.control_windows : [];
    const hasCouplingWindow = windows.some((window) =>
      window?.fields &&
      typeof window.fields === "object" &&
      Object.prototype.hasOwnProperty.call(window.fields, "nasalCoupling")
    );
    if (hasCouplingWindow) {
      provenance.add({
        stage: "rules",
        type: "nasal_coupling_contour_applied",
        subject: `token:${tokenId}`,
        reason: "nasal coupling contour inserted because nasal context was detected (tag: nasal_coupling)",
        citations: [HAWKINS_STEVENS_1985],
        parents,
      });
    }

    const hasSecondaryCue =
      (token?.params?.nasalCoupling ?? 0) > 0 ||
      (token?.params?.nasalMurmurStrength ?? 0) > 0 ||
      windows.some((window) =>
        window?.fields &&
        typeof window.fields === "object" &&
        (Object.prototype.hasOwnProperty.call(window.fields, "nasalCoupling") ||
          Object.prototype.hasOwnProperty.call(window.fields, "nasalMurmurStrength"))
      );
    if (hasSecondaryCue) {
      provenance.add({
        stage: "rules",
        type: "nasal_secondary_cue_applied",
        subject: `token:${tokenId}`,
        reason: "nasal secondary cue applied because nasal context was detected (tag: nasalization_secondary_cue)",
        citations: [CHEN_1997, MAEDA_1982],
        parents,
      });
    }
  }
}

function emitFrameStageEvents(
  frames: FrameLike[],
  provenance: ProvenanceCollector,
): void {
  let oralBaselineEmitted = false;
  for (let i = 0; i < frames.length; i += 1) {
    const frame = frames[i];
    const params = frame?.params ?? {};
    const coupling = Number(params.nasalCoupling ?? 0);
    const clampedCoupling = Math.max(0, Math.min(1, coupling));
    const coreFnp = Number(params.nasalCoreFnp ?? params.nasalPoleBaseHz ?? 250);
    const coreFnz = Number(params.nasalCoreFnz ?? coreFnp);
    const placeFnz = Number(params.nasalPlaceFnz ?? 0);
    const placeBnz = Number(params.nasalPlaceBnz ?? 0);
    const placeIndex = Number(params.nasalPlaceIndex ?? 0);
    const subject = `frame:${i}`;

    if (!oralBaselineEmitted && clampedCoupling === 0 && coreFnz === coreFnp) {
      oralBaselineEmitted = true;
      provenance.add({
        stage: "semantics",
        type: "nasal_core_zero_derived",
        subject,
        reason: "core zero equals nasal pole because oral cancellation baseline was selected (tag: nasal_coupling)",
        citations: [KLATT_1980],
      });
    }

    if (clampedCoupling > 0) {
      const targetDecision = provenance.add({
        stage: "semantics",
        type: "nasal_core_zero_target_derived",
        subject,
        reason: "core zero target derived from F1 and nasal pole because coupling was active (tag: nasal_coupling)",
        citations: [HAWKINS_STEVENS_1985, KLATT_1980],
      });
      const coreDecision = provenance.add({
        stage: "semantics",
        type: "nasal_core_zero_derived",
        subject,
        reason: "effective core zero derived from target plus coupling ratio (tag: nasal_coupling)",
        citations: [HAWKINS_STEVENS_1985, KLATT_1980],
        parents: [targetDecision.id],
      });
      provenance.add({
        stage: "runtime",
        type: "nasal_runtime_binding_applied",
        subject: `node:nasal-core:${i}`,
        reason: "nasal runtime bindings applied because realized nasal values were present (tag: nasal_coupling)",
        citations: [KLATT_1980],
        parents: [coreDecision.id],
      });
      provenance.add({
        stage: "runtime",
        type: "nasal_runtime_mode_applied",
        subject: `primitive:nasal:${i}`,
        reason: "runtime entered vowel nasalization behavior because coupling exceeded oral baseline (tag: nasal_coupling)",
        citations: [HAWKINS_STEVENS_1985],
      });
    }

    if (placeIndex > 0 && placeFnz > 0 && placeBnz > 0) {
      const placeDecision = provenance.add({
        stage: "semantics",
        type: "nasal_murmur_antiformant_derived",
        subject,
        reason: "place antiformant selected because nasal murmur strength and place were active (tag: nasal_murmur)",
        citations: [FUJIMURA_1962, STEVENS_1998],
      });
      provenance.add({
        stage: "runtime",
        type: "nasal_runtime_mode_applied",
        subject: `primitive:nasal:${i}`,
        reason: "runtime entered murmur-emphasis behavior because place antiformant was active (tag: nasal_murmur)",
        citations: [FUJIMURA_1962, STEVENS_1998],
        parents: [placeDecision.id],
      });
    }

  }
}

function emitDiagnostics(
  tokens: TokenLike[],
  frames: FrameLike[],
  diagnostics: Diagnostics,
): void {
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const tokenId = getTokenId(token, `ph_${i}`);
    const coupling = token?.params?.nasalCoupling;
    if (isFiniteNumber(coupling) && (coupling < 0 || coupling > 1)) {
      diagnostics.warn(
        "Nasal coupling was clamped into [0,1]",
        { tokenId, param: "nasalCoupling", value: coupling, clamped: Math.max(0, Math.min(1, coupling)) },
        "W_NASAL_COUPLING_CLAMPED",
      );
    }

    const placeIndex = token?.params?.nasalPlaceIndex;
    if (isFiniteNumber(placeIndex) && ![0, 1, 2, 3].includes(placeIndex)) {
      diagnostics.warn(
        "Unknown nasal place index fell back to none",
        { tokenId, param: "nasalPlaceIndex", value: placeIndex, fallback: 0 },
        "W_NASAL_UNKNOWN_PLACE",
      );
    }

    const usesLegacy =
      isFiniteNumber(token?.params?.FNZ) ||
      isFiniteNumber(token?.params?.FNP) ||
      isFiniteNumber(token?.params?.BNZ) ||
      isFiniteNumber(token?.params?.BNP);
    if (usesLegacy) {
      diagnostics.warn(
        "Deprecated raw nasal parameters were supplied",
        { tokenId, params: ["FNZ", "FNP", "BNZ", "BNP"].filter((name) => isFiniteNumber(token?.params?.[name])) },
        "W_NASAL_LEGACY_PARAM_USED",
      );
    }

    if (token?.type === "nasal" && !isFiniteNumber(placeIndex)) {
      diagnostics.warn(
        "Nasal place default was used",
        { tokenId, fallback: "alveolar-like default via none" },
        "W_NASAL_PLACE_DEFAULT_USED",
      );
    }
  }

  for (let i = 0; i < frames.length; i += 1) {
    const params = frames[i]?.params ?? {};
    const coupling = Number(params.nasalCoupling ?? 0);
    const f1 = params.F1;
    if (coupling > 0 && !isFiniteNumber(f1)) {
      diagnostics.warn(
        "F1 was missing while deriving a nasal core zero target",
        { frame: i, param: "F1", coupling },
        "W_NASAL_F1_MISSING",
      );
    }
    if (
      Number(params.nasalCoreFnz ?? 0) > 0 ||
      Number(params.nasalPlaceFnz ?? 0) > 0 ||
      Number(params.nasalCoupling ?? 0) > 0 ||
      Number(params.nasalPlaceIndex ?? 0) > 0
    ) {
      diagnostics.info(
        "Realized nasal values were bound onto the runtime path",
        {
          frame: i,
          nasalCoreFnz: params.nasalCoreFnz ?? null,
          nasalPlaceFnz: params.nasalPlaceFnz ?? null,
          nasalCoupling: params.nasalCoupling ?? null,
          nasalPlaceIndex: params.nasalPlaceIndex ?? null,
        },
        "I_NASAL_RUNTIME_BOUND",
      );
      break;
    }
  }
}

export function emitNasalSubsystemExplainability(
  tokens: TokenLike[],
  frames: FrameLike[],
  provenance: ProvenanceCollector | null | undefined,
  diagnostics: Diagnostics | null | undefined,
  tokenDecisionIds: Map<string, string>,
): void {
  if (provenance) {
    emitRulesStageEvents(tokens, provenance, tokenDecisionIds);
    emitFrameStageEvents(frames, provenance);
  }
  if (diagnostics) {
    emitDiagnostics(tokens, frames, diagnostics);
  }
}

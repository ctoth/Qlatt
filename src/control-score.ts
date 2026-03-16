import type {
  ControlScoreF0Event,
  ControlScorePhoneToken,
  ControlWindowSpec,
  DeclarativeControlScore,
} from "./tts-frontend-types";

type TokenLike = Record<string, unknown>;

function toFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readFormantPlan(params: Record<string, unknown>): ControlScorePhoneToken["filter"] {
  const formants: NonNullable<ControlScorePhoneToken["filter"]>["formants"] = [];
  for (let index = 1; index <= 10; index += 1) {
    const frequency = toFiniteNumber(params[`F${index}`]);
    const bandwidth = toFiniteNumber(params[`B${index}`]);
    if (frequency == null) continue;
    formants.push({
      index,
      frequency_hz: frequency,
      ...(bandwidth != null ? { bandwidth_hz: bandwidth } : {}),
    });
  }

  const coupling = toFiniteNumber(params.nasalCoupling);
  const placeIndex = toFiniteNumber(params.nasalPlaceIndex);
  const murmurStrength = toFiniteNumber(params.nasalMurmurStrength);

  if (formants.length === 0 && coupling == null && placeIndex == null && murmurStrength == null) {
    return undefined;
  }

  return {
    formants,
    ...(
      coupling != null || placeIndex != null || murmurStrength != null
        ? {
            nasal: {
              ...(coupling != null ? { coupling } : {}),
              ...(placeIndex != null ? { place_index: placeIndex } : {}),
              ...(murmurStrength != null ? { murmur_strength: murmurStrength } : {}),
            },
          }
        : {}
    ),
  };
}

function readSourcePlan(params: Record<string, unknown>): ControlScorePhoneToken["source"] {
  const sourceMode = toFiniteNumber(params.sourceMode);
  const rd = toFiniteNumber(params.Rd);
  const rdRef = toFiniteNumber(params.RdRef);
  const oq = toFiniteNumber(params.OQ);
  const tl = toFiniteNumber(params.TL);
  const av = toFiniteNumber(params.AV);
  const avs = toFiniteNumber(params.AVS);
  const ah = toFiniteNumber(params.AH);
  const af = toFiniteNumber(params.AF);

  if (
    sourceMode == null &&
    rd == null &&
    rdRef == null &&
    oq == null &&
    tl == null &&
    av == null &&
    avs == null &&
    ah == null &&
    af == null
  ) {
    return undefined;
  }

  return {
    ...(sourceMode != null ? { source_mode: sourceMode } : {}),
    ...(rd != null ? { rd } : {}),
    ...(rdRef != null ? { rd_ref: rdRef } : {}),
    ...(oq != null ? { oq } : {}),
    ...(tl != null ? { tl } : {}),
    ...(av != null ? { av } : {}),
    ...(avs != null ? { avs } : {}),
    ...(ah != null ? { ah } : {}),
    ...(af != null ? { af } : {}),
  };
}

function cloneControlWindows(value: unknown): ControlWindowSpec[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((entry): entry is ControlWindowSpec => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry))
    .map((entry) => ({ ...entry }));
}

function buildPhoneToken(token: TokenLike): ControlScorePhoneToken {
  const params =
    token.params && typeof token.params === "object" && !Array.isArray(token.params)
      ? (token.params as Record<string, unknown>)
      : {};

  const lexicalTargetMs = toFiniteNumber(token.inherentDuration);
  const realizedTargetMs = toFiniteNumber(token.duration) ?? 0;
  const minimumMs = toFiniteNumber(token.minimumDuration);
  const transitionMs = toFiniteNumber(token.transition_ms);

  return {
    id: typeof token.id === "string" ? token.id : "",
    phoneme: typeof token.phoneme === "string" ? token.phoneme : "",
    type: typeof token.type === "string" ? token.type : "unknown",
    ...(typeof token.word === "string" && token.word.length > 0 ? { word: token.word } : {}),
    ...(typeof token.stress === "number" ? { stress: token.stress } : {}),
    ...(typeof token.breakIndex === "number" ? { break_index: token.breakIndex } : {}),
    prosody: {
      ...(typeof token.isFunctionWord === "boolean" ? { is_function_word: token.isFunctionWord } : {}),
      ...(typeof token.isAccented === "boolean" ? { is_accented: token.isAccented } : {}),
      ...(typeof token.isAccentCarrier === "boolean" ? { is_accent_carrier: token.isAccentCarrier } : {}),
      ...(typeof token.isNuclearAccent === "boolean" ? { is_nuclear_accent: token.isNuclearAccent } : {}),
      ...(token.initialBoundaryTone === null || typeof token.initialBoundaryTone === "string"
        ? { initial_boundary_tone: (token.initialBoundaryTone as string | null | undefined) ?? null }
        : {}),
      ...(token.accentType === null || typeof token.accentType === "string"
        ? { accent_type: (token.accentType as string | null | undefined) ?? null }
        : {}),
      ...(token.phraseAccent === null || typeof token.phraseAccent === "string"
        ? { phrase_accent: (token.phraseAccent as string | null | undefined) ?? null }
        : {}),
      ...(token.boundaryTone === null || typeof token.boundaryTone === "string"
        ? { boundary_tone: (token.boundaryTone as string | null | undefined) ?? null }
        : {}),
    },
    alignment: {
      anchors: {
        ...(typeof token.sync_left === "string" && token.sync_left.length > 0 ? { onset: token.sync_left } : {}),
        ...(typeof token.sync_right === "string" && token.sync_right.length > 0 ? { release: token.sync_right } : {}),
      },
      ...(transitionMs != null ? { transition_ms: transitionMs } : {}),
    },
    duration: {
      ...(lexicalTargetMs != null ? { lexical_target_ms: lexicalTargetMs } : {}),
      realized_target_ms: realizedTargetMs,
      ...(minimumMs != null ? { minimum_ms: minimumMs } : {}),
    },
    ...(readSourcePlan(params) ? { source: readSourcePlan(params)! } : {}),
    ...(readFormantPlan(params) ? { filter: readFormantPlan(params)! } : {}),
    ...(cloneControlWindows(token.control_windows) ? { control_windows: cloneControlWindows(token.control_windows)! } : {}),
  };
}

function buildF0Event(token: TokenLike): ControlScoreF0Event | null {
  const valueHz = toFiniteNumber(token.value);
  if (valueHz == null) return null;

  return {
    id: typeof token.id === "string" ? token.id : "",
    ...(toFiniteNumber(token.time) != null ? { time_ms: toFiniteNumber(token.time)! } : {}),
    value_hz: valueHz,
    ...(typeof token.tag === "string" ? { tag: token.tag } : {}),
    ...("anchor_left" in token ? { anchor_left: token.anchor_left } : {}),
    ...("anchor_right" in token ? { anchor_right: token.anchor_right } : {}),
    ...(toFiniteNumber(token.ratio) != null ? { ratio: toFiniteNumber(token.ratio)! } : {}),
  };
}

export function buildDeclarativeControlScore(
  frontendId: string,
  parameterSequence: Array<Record<string, unknown>>,
): DeclarativeControlScore {
  const activePhoneTokens = parameterSequence.filter(
    (token) => token?.stream !== "f0" && token?.status !== 2,
  );
  const f0Events = parameterSequence
    .filter((token) => token?.stream === "f0" && token?.status !== 2)
    .map(buildF0Event)
    .filter((event): event is ControlScoreF0Event => event !== null);

  return {
    version: "v1",
    frontend_id: frontendId,
    tokens: activePhoneTokens.map(buildPhoneToken),
    f0_events: f0Events,
  };
}

export function validateDeclarativeControlScore(score: DeclarativeControlScore): void {
  if (score.version !== "v1") {
    throw new Error(`E_CONTROL_SCORE_VERSION: unsupported version '${String(score.version)}'`);
  }
  if (typeof score.frontend_id !== "string" || score.frontend_id.length === 0) {
    throw new Error("E_CONTROL_SCORE_FRONTEND: frontend_id is required");
  }
  if (!Array.isArray(score.tokens)) {
    throw new Error("E_CONTROL_SCORE_TOKENS: tokens must be an array");
  }
  if (!Array.isArray(score.f0_events)) {
    throw new Error("E_CONTROL_SCORE_F0: f0_events must be an array");
  }

  for (const token of score.tokens) {
    if (typeof token.id !== "string" || token.id.length === 0) {
      throw new Error("E_CONTROL_SCORE_TOKEN_ID: token id is required");
    }
    if (typeof token.phoneme !== "string" || token.phoneme.length === 0) {
      throw new Error(`E_CONTROL_SCORE_TOKEN_PHONEME: token '${token.id}' missing phoneme`);
    }
    if (!Number.isFinite(token.duration.realized_target_ms)) {
      throw new Error(`E_CONTROL_SCORE_TOKEN_DURATION: token '${token.id}' has non-finite duration`);
    }
  }

  for (const event of score.f0_events) {
    if (typeof event.id !== "string" || event.id.length === 0) {
      throw new Error("E_CONTROL_SCORE_F0_ID: f0 event id is required");
    }
    if (!Number.isFinite(event.value_hz)) {
      throw new Error(`E_CONTROL_SCORE_F0_VALUE: event '${event.id}' has non-finite value`);
    }
  }
}

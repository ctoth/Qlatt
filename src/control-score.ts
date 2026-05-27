import type {
  ControlFieldSpec,
  ControlScoreF0LayerCommand,
  ControlScoreF0Point,
  ControlScoreGlobalOverlay,
  ControlScoreSegment,
  ControlScoreTimedControl,
  ControlScoreTiming,
  DeclarativeControlScore,
} from "./tts-frontend-types";
import type { Diagnostics } from "./diagnostics";

type TokenLike = Record<string, unknown>;
type BuildDeclarativeControlScoreOptions = {
  loweringSpecId?: string;
  policyPaths?: string[];
  voiceQuality?: Record<string, unknown> | null;
  diagnostics?: Diagnostics | null;
};

const CONTROL_FIELD_OPS = new Set(["set", "add", "mul", "max", "min", "unset"]);
const FORMANT_FREQUENCY_PARAM = /^F([1-9]\d*)$/;

function toFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, "");
}

function readNumericMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value)) {
    const number = toFiniteNumber(raw);
    if (number != null) result[key] = number;
  }
  return result;
}

function readFormantPlan(params: Record<string, unknown>): ControlScoreSegment["filter"] {
  const formants: NonNullable<ControlScoreSegment["filter"]>["formants"] = [];
  const formantIndices = Object.keys(params)
    .map((key) => {
      const match = key.match(FORMANT_FREQUENCY_PARAM);
      return match ? Number(match[1]) : NaN;
    })
    .filter((index) => Number.isInteger(index) && index > 0)
    .sort((left, right) => left - right);

  for (const index of formantIndices) {
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

function readSourcePlan(params: Record<string, unknown>): ControlScoreSegment["source"] {
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

function buildSegment(token: TokenLike): ControlScoreSegment {
  const params = readNumericMap(token.params);
  const lexicalTargetMs = toFiniteNumber(token.inherentDuration);
  const realizedTargetMs = toFiniteNumber(token.duration) ?? 0;
  const minimumMs = toFiniteNumber(token.minimumDuration);
  const transitionMs = toFiniteNumber(token.transition_ms);

  return {
    id: toNonEmptyString(token.id) ?? "",
    phoneme: toNonEmptyString(token.phoneme) ?? "",
    type: toNonEmptyString(token.type) ?? "unknown",
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
      ...(toNonEmptyString(token.sync_left) ? { onset_mark: toNonEmptyString(token.sync_left)! } : {}),
      ...(toNonEmptyString(token.sync_right) ? { release_mark: toNonEmptyString(token.sync_right)! } : {}),
      ...(transitionMs != null ? { transition_ms: transitionMs } : {}),
    },
    duration: {
      ...(lexicalTargetMs != null ? { lexical_target_ms: lexicalTargetMs } : {}),
      realized_target_ms: realizedTargetMs,
      ...(minimumMs != null ? { minimum_ms: minimumMs } : {}),
    },
    params,
    ...(readSourcePlan(params) ? { source: readSourcePlan(params)! } : {}),
    ...(readFormantPlan(params) ? { filter: readFormantPlan(params)! } : {}),
  };
}

function getSyncMarkerKey(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    if (typeof source.mark === "string" && source.mark.length > 0) return source.mark;
    if (typeof source.id === "string" && source.id.length > 0) return source.id;
    if (typeof source.rank === "string" && source.rank.length > 0) {
      const kind = typeof source.kind === "string" ? source.kind : "RANK";
      return `${kind}:${source.rank}`;
    }
  }
  return null;
}

function buildSyncTimeMap(segments: ControlScoreSegment[]): Map<string, number> {
  const syncTimeByKey = new Map<string, number>();
  let cursorMs = 0;
  for (const segment of segments) {
    if (segment.alignment.onset_mark) syncTimeByKey.set(segment.alignment.onset_mark, cursorMs);
    cursorMs += segment.duration.realized_target_ms;
    if (segment.alignment.release_mark) syncTimeByKey.set(segment.alignment.release_mark, cursorMs);
  }
  return syncTimeByKey;
}

function resolveAnchorEndpointMs(
  primary: unknown,
  secondary: unknown,
  syncTimeByKey: Map<string, number>,
): number | null {
  const key = getSyncMarkerKey(primary) ?? getSyncMarkerKey(secondary);
  if (key && syncTimeByKey.has(key)) return syncTimeByKey.get(key) ?? null;
  return toFiniteNumber(primary) ?? toFiniteNumber(secondary) ?? null;
}

function timingFromToken(token: TokenLike, syncTimeByKey: Map<string, number>): ControlScoreTiming {
  const absoluteMs = toFiniteNumber(token.time);
  if (absoluteMs != null) return { kind: "absolute", time_ms: absoluteMs };

  const anchorLeft = toNonEmptyString(token.anchor_left);
  const anchorRight = toNonEmptyString(token.anchor_right);
  const ratio = toFiniteNumber(token.ratio);
  if (anchorLeft && anchorRight && ratio != null) {
    return { kind: "anchored", anchor_left: anchorLeft, anchor_right: anchorRight, ratio };
  }

  const leftMs = resolveAnchorEndpointMs(token.anchor_left, token.sync_left, syncTimeByKey);
  const rightMs = resolveAnchorEndpointMs(token.anchor_right, token.sync_right, syncTimeByKey);
  if (leftMs != null && rightMs != null) {
    const resolvedRatio = Math.max(0, Math.min(1, ratio ?? (leftMs === rightMs ? 0 : 0.5)));
    return { kind: "absolute", time_ms: leftMs + (rightMs - leftMs) * resolvedRatio };
  }

  return { kind: "absolute", time_ms: 0 };
}

function buildF0Point(token: TokenLike, syncTimeByKey: Map<string, number>): ControlScoreF0Point | null {
  const valueHz = toFiniteNumber(token.value);
  if (valueHz == null) return null;
  return {
    id: toNonEmptyString(token.id) ?? "",
    timing: timingFromToken(token, syncTimeByKey),
    value_hz: valueHz,
    ...(toNonEmptyString(token.tag) ? { tag: toNonEmptyString(token.tag)! } : {}),
    ...(toNonEmptyString(token.accentType) ? { accent_type: toNonEmptyString(token.accentType)! } : {}),
  };
}

function buildF0LayerCommand(token: TokenLike, syncTimeByKey: Map<string, number>): ControlScoreF0LayerCommand | null {
  const value = toFiniteNumber(token.value);
  if (value == null) return null;
  const profilePoints = Array.isArray(token.profile_points)
    ? token.profile_points.filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry))
    : undefined;
  return {
    id: toNonEmptyString(token.id) ?? "",
    timing: timingFromToken(token, syncTimeByKey),
    layer: toNonEmptyString(token.layer) ?? "",
    value,
    ...(toFiniteNumber(token.duration_frames) != null ? { duration_frames: toFiniteNumber(token.duration_frames)! } : {}),
    ...(profilePoints && profilePoints.length > 0 ? { profile_points: profilePoints } : {}),
    ...(toNonEmptyString(token.tag) ? { tag: toNonEmptyString(token.tag)! } : {}),
  };
}

function resolveWindowOffsetMs(
  window: Record<string, unknown>,
  durationMs: number,
  msField: "start_ms" | "end_ms",
  ratioField: "start_ratio" | "end_ratio",
  fallbackMs: number,
): number {
  const msValue = toFiniteNumber(window[msField]);
  if (msValue != null) return msValue;
  const ratioValue = toFiniteNumber(window[ratioField]);
  if (ratioValue != null) return durationMs * Math.max(0, Math.min(1, ratioValue));
  return fallbackMs;
}

function resolveWindowSpanMs(
  window: Record<string, unknown>,
  durationMs: number,
): { startMs: number; endMs: number } | null {
  const prefixMs = toFiniteNumber(window.prefix_ms);
  if (prefixMs != null) {
    const endMs = Math.max(0, Math.min(durationMs, prefixMs));
    return endMs > 0 ? { startMs: 0, endMs } : null;
  }

  const suffixMs = toFiniteNumber(window.suffix_ms);
  if (suffixMs != null) {
    const spanMs = Math.max(0, Math.min(durationMs, suffixMs));
    const startMs = Math.max(0, durationMs - spanMs);
    return durationMs > startMs ? { startMs, endMs: durationMs } : null;
  }

  const rawStartMs = resolveWindowOffsetMs(window, durationMs, "start_ms", "start_ratio", 0);
  const rawEndMs = resolveWindowOffsetMs(window, durationMs, "end_ms", "end_ratio", durationMs);
  const startMs = Math.max(0, Math.min(durationMs, rawStartMs));
  const endMs = Math.max(startMs, Math.min(durationMs, rawEndMs));
  return endMs > startMs ? { startMs, endMs } : null;
}

function readControlFieldOps(rawFields: unknown): Record<string, ControlFieldSpec> | null {
  if (!rawFields || typeof rawFields !== "object" || Array.isArray(rawFields)) return null;
  const fields: Record<string, ControlFieldSpec> = {};
  for (const [fieldName, rawSpec] of Object.entries(rawFields)) {
    const shorthand = toFiniteNumber(rawSpec);
    if (shorthand != null) {
      fields[fieldName] = { op: "set", value: shorthand };
      continue;
    }
    if (!rawSpec || typeof rawSpec !== "object" || Array.isArray(rawSpec)) continue;
    const spec = rawSpec as Record<string, unknown>;
    const rawOp = toNonEmptyString(spec.op);
    const op = rawOp ? stripQuotes(rawOp) : null;
    if (!op || !CONTROL_FIELD_OPS.has(op)) continue;
    const value = toFiniteNumber(spec.value);
    fields[fieldName] = op === "unset"
      ? { op: "unset" }
      : { op: op as ControlFieldSpec["op"], value: value ?? 0 };
  }
  return Object.keys(fields).length > 0 ? fields : null;
}

function buildTimedControls(
  tokens: TokenLike[],
  segments: ControlScoreSegment[],
  diagnostics?: Diagnostics | null,
): ControlScoreTimedControl[] {
  const controls: ControlScoreTimedControl[] = [];
  for (let sourceIndex = 0; sourceIndex < tokens.length; sourceIndex += 1) {
    const rawWindows = Array.isArray(tokens[sourceIndex]?.control_windows)
      ? tokens[sourceIndex].control_windows as unknown[]
      : [];
    for (let windowIndex = 0; windowIndex < rawWindows.length; windowIndex += 1) {
      const rawWindow = rawWindows[windowIndex];
      if (!rawWindow || typeof rawWindow !== "object" || Array.isArray(rawWindow)) {
        diagnostics?.warn("Dropped malformed control window from control score", { sourceIndex, windowIndex }, "CONTROL_SCORE_WINDOW_DROPPED");
        continue;
      }
      const window = rawWindow as Record<string, unknown>;
      const target = stripQuotes(toNonEmptyString(window.target) ?? "current");
      const targetIndex = target === "next"
        ? sourceIndex + 1
        : target === "prev"
          ? sourceIndex - 1
          : sourceIndex;
      const targetSegment = segments[targetIndex];
      if (!targetSegment) {
        diagnostics?.warn("Dropped control window with out-of-range target", { sourceIndex, windowIndex, target }, "CONTROL_SCORE_WINDOW_TARGET");
        continue;
      }
      const span = resolveWindowSpanMs(window, targetSegment.duration.realized_target_ms);
      const fields = readControlFieldOps(window.fields);
      if (!span || !fields) {
        diagnostics?.warn("Dropped control window with invalid span or fields", { sourceIndex, windowIndex }, "CONTROL_SCORE_WINDOW_DROPPED");
        continue;
      }
      controls.push({
        id: `${tokens[sourceIndex]?.id ?? `segment_${sourceIndex}`}:control_window:${windowIndex}`,
        target_segment_id: targetSegment.id,
        start_offset_ms: span.startMs,
        end_offset_ms: span.endMs,
        fields,
        ...(toNonEmptyString(window.tag) ? { tag: stripQuotes(toNonEmptyString(window.tag)!) } : {}),
      });
    }
  }
  return controls;
}

function buildGlobalOverlays(voiceQuality?: Record<string, unknown> | null): ControlScoreGlobalOverlay[] {
  if (!voiceQuality) return [];
  const fields: Record<string, ControlFieldSpec> = {};
  const rd = toFiniteNumber(voiceQuality.rd);
  if (rd != null) fields.Rd = { op: "set", value: rd };
  const oq = toFiniteNumber(voiceQuality.oq);
  if (oq != null && oq !== 0) fields.OQ = { op: "set", value: oq };
  const tl = toFiniteNumber(voiceQuality.tl);
  if (tl != null && tl !== 0) fields.TL = { op: "add", value: tl };
  const flutter = toFiniteNumber(voiceQuality.flutter);
  if (flutter != null) fields.flutter = { op: "set", value: flutter };
  const jitter = toFiniteNumber(voiceQuality.jitter);
  if (jitter != null) fields.jitter = { op: "set", value: jitter };
  const ahOffset = toFiniteNumber(voiceQuality.ah_offset_db);
  if (ahOffset != null && ahOffset !== 0) fields.AH = { op: "add", value: ahOffset };
  return Object.keys(fields).length > 0
    ? [{ id: "voice_quality", fields, tag: "voice_quality" }]
    : [];
}

function assertNonEmptyString(value: unknown, error: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(error);
  return value;
}

function assertFiniteNumber(value: unknown, error: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(error);
  return value;
}

function assertFieldOps(fields: unknown, label: string): void {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
    throw new Error(`E_CONTROL_SCORE_FIELD_OPS: ${label} fields must be an object`);
  }
  for (const [fieldName, rawField] of Object.entries(fields)) {
    if (!rawField || typeof rawField !== "object" || Array.isArray(rawField)) {
      throw new Error(`E_CONTROL_SCORE_FIELD_OP: ${label}.${fieldName} must be an object`);
    }
    const field = rawField as ControlFieldSpec;
    if (!CONTROL_FIELD_OPS.has(field.op)) {
      throw new Error(`E_CONTROL_SCORE_FIELD_OP: ${label}.${fieldName} has invalid op`);
    }
    if (field.op !== "unset") {
      assertFiniteNumber(field.value, `E_CONTROL_SCORE_FIELD_OP: ${label}.${fieldName} value must be finite`);
    }
  }
}

function assertTiming(timing: unknown, label: string): void {
  if (!timing || typeof timing !== "object" || Array.isArray(timing)) {
    throw new Error(`E_CONTROL_SCORE_TIMING: ${label} timing must be an object`);
  }
  const spec = timing as ControlScoreTiming;
  if (spec.kind === "absolute") {
    assertFiniteNumber(spec.time_ms, `E_CONTROL_SCORE_TIMING: ${label} absolute time must be finite`);
    return;
  }
  if (spec.kind === "anchored") {
    assertNonEmptyString(spec.anchor_left, `E_CONTROL_SCORE_TIMING: ${label} anchor_left is required`);
    assertNonEmptyString(spec.anchor_right, `E_CONTROL_SCORE_TIMING: ${label} anchor_right is required`);
    const ratio = assertFiniteNumber(spec.ratio, `E_CONTROL_SCORE_TIMING: ${label} ratio must be finite`);
    if (ratio < 0 || ratio > 1) {
      throw new Error(`E_CONTROL_SCORE_TIMING: ${label} ratio must be between 0 and 1`);
    }
    return;
  }
  throw new Error(`E_CONTROL_SCORE_TIMING: ${label} timing kind is unsupported`);
}

export function buildDeclarativeControlScore(
  frontendId: string,
  parameterSequence: Array<Record<string, unknown>>,
  options: BuildDeclarativeControlScoreOptions = {},
): DeclarativeControlScore {
  const activePhoneTokens = parameterSequence.filter(
    (token) =>
      (token?.stream === "phone" || token?.stream == null) &&
      token?.status !== 2,
  );
  const segments = activePhoneTokens.map(buildSegment);
  const syncTimeByKey = buildSyncTimeMap(segments);
  const f0Points = parameterSequence
    .filter((token) => token?.stream === "f0" && token?.status !== 2)
    .map((token) => buildF0Point(token, syncTimeByKey))
    .filter((event): event is ControlScoreF0Point => event !== null);
  const f0LayerCommands = parameterSequence
    .filter((token) => token?.stream === "f0_layer" && token?.status !== 2)
    .map((token) => buildF0LayerCommand(token, syncTimeByKey))
    .filter((event): event is ControlScoreF0LayerCommand => event !== null);

  return {
    version: "v2",
    frontend_id: frontendId,
    segments,
    timeline_marks: segments.flatMap((segment) => [
      ...(segment.alignment.onset_mark
        ? [{ id: segment.alignment.onset_mark, segment_id: segment.id, edge: "onset" as const }]
        : []),
      ...(segment.alignment.release_mark
        ? [{ id: segment.alignment.release_mark, segment_id: segment.id, edge: "release" as const }]
        : []),
    ]),
    timed_controls: buildTimedControls(activePhoneTokens, segments, options.diagnostics),
    f0_points: f0Points,
    f0_layer_commands: f0LayerCommands,
    global_overlays: buildGlobalOverlays(options.voiceQuality),
    lowering_refs: {
      spec_id: options.loweringSpecId ?? `${frontendId}:track-lowering`,
      policy_paths: options.policyPaths ?? ["/rules/control-score.yaml", `/rules/frontends/${frontendId}/frontend.yaml`],
    },
  };
}

export function validateDeclarativeControlScore(score: DeclarativeControlScore): void {
  if (score.version !== "v2") {
    throw new Error(`E_CONTROL_SCORE_VERSION: unsupported version '${String(score.version)}'`);
  }
  assertNonEmptyString(score.frontend_id, "E_CONTROL_SCORE_FRONTEND: frontend_id is required");

  if (!Array.isArray(score.segments)) throw new Error("E_CONTROL_SCORE_SEGMENTS: segments must be an array");
  if (!Array.isArray(score.timeline_marks)) throw new Error("E_CONTROL_SCORE_TIMELINE: timeline_marks must be an array");
  if (!Array.isArray(score.timed_controls)) throw new Error("E_CONTROL_SCORE_CONTROLS: timed_controls must be an array");
  if (!Array.isArray(score.f0_points)) throw new Error("E_CONTROL_SCORE_F0: f0_points must be an array");
  if (!Array.isArray(score.f0_layer_commands)) throw new Error("E_CONTROL_SCORE_F0_LAYER: f0_layer_commands must be an array");
  if (!Array.isArray(score.global_overlays)) throw new Error("E_CONTROL_SCORE_OVERLAYS: global_overlays must be an array");
  if (!score.lowering_refs || typeof score.lowering_refs !== "object") {
    throw new Error("E_CONTROL_SCORE_LOWERING_REFS: lowering_refs is required");
  }

  const segmentIds = new Set<string>();
  for (const segment of score.segments) {
    const id = assertNonEmptyString(segment.id, "E_CONTROL_SCORE_SEGMENT_ID: segment id is required");
    if (segmentIds.has(id)) throw new Error(`E_CONTROL_SCORE_SEGMENT_ID: duplicate segment id '${id}'`);
    segmentIds.add(id);
    assertNonEmptyString(segment.phoneme, `E_CONTROL_SCORE_SEGMENT_PHONEME: segment '${id}' missing phoneme`);
    assertNonEmptyString(segment.type, `E_CONTROL_SCORE_SEGMENT_TYPE: segment '${id}' missing type`);
    assertFiniteNumber(segment.duration.realized_target_ms, `E_CONTROL_SCORE_SEGMENT_DURATION: segment '${id}' duration must be finite`);
    if (!segment.params || typeof segment.params !== "object" || Array.isArray(segment.params)) {
      throw new Error(`E_CONTROL_SCORE_SEGMENT_PARAMS: segment '${id}' params must be an object`);
    }
    for (const [key, value] of Object.entries(segment.params)) {
      assertFiniteNumber(value, `E_CONTROL_SCORE_SEGMENT_PARAMS: segment '${id}' param '${key}' must be finite`);
    }
  }

  for (const mark of score.timeline_marks) {
    assertNonEmptyString(mark.id, "E_CONTROL_SCORE_TIMELINE_MARK_ID: timeline mark id is required");
    const segmentId = assertNonEmptyString(mark.segment_id, "E_CONTROL_SCORE_TIMELINE_MARK_SEGMENT: segment_id is required");
    if (!segmentIds.has(segmentId)) {
      throw new Error(`E_CONTROL_SCORE_TIMELINE_MARK_SEGMENT: unknown segment '${segmentId}'`);
    }
    if (mark.edge !== "onset" && mark.edge !== "release") {
      throw new Error("E_CONTROL_SCORE_TIMELINE_MARK_EDGE: edge must be onset or release");
    }
    if (mark.time_ms != null) {
      assertFiniteNumber(mark.time_ms, "E_CONTROL_SCORE_TIMELINE_MARK_TIME: time_ms must be finite");
    }
  }

  for (const control of score.timed_controls) {
    assertNonEmptyString(control.id, "E_CONTROL_SCORE_CONTROL_ID: timed control id is required");
    const targetId = assertNonEmptyString(control.target_segment_id, "E_CONTROL_SCORE_CONTROL_TARGET: target_segment_id is required");
    if (!segmentIds.has(targetId)) throw new Error(`E_CONTROL_SCORE_CONTROL_TARGET: unknown segment '${targetId}'`);
    const start = assertFiniteNumber(control.start_offset_ms, `E_CONTROL_SCORE_CONTROL_SPAN: control '${control.id}' start must be finite`);
    const end = assertFiniteNumber(control.end_offset_ms, `E_CONTROL_SCORE_CONTROL_SPAN: control '${control.id}' end must be finite`);
    if (end <= start) throw new Error(`E_CONTROL_SCORE_CONTROL_SPAN: control '${control.id}' end must be after start`);
    assertFieldOps(control.fields, `timed_controls.${control.id}`);
  }

  for (const point of score.f0_points) {
    assertNonEmptyString(point.id, "E_CONTROL_SCORE_F0_ID: f0 point id is required");
    assertTiming(point.timing, `f0_points.${point.id}`);
    assertFiniteNumber(point.value_hz, `E_CONTROL_SCORE_F0_VALUE: point '${point.id}' value must be finite`);
  }

  for (const command of score.f0_layer_commands) {
    assertNonEmptyString(command.id, "E_CONTROL_SCORE_F0_LAYER_ID: f0 layer command id is required");
    assertTiming(command.timing, `f0_layer_commands.${command.id}`);
    assertNonEmptyString(command.layer, `E_CONTROL_SCORE_F0_LAYER_NAME: command '${command.id}' layer is required`);
    assertFiniteNumber(command.value, `E_CONTROL_SCORE_F0_LAYER_VALUE: command '${command.id}' value must be finite`);
    if (command.duration_frames != null) {
      assertFiniteNumber(command.duration_frames, `E_CONTROL_SCORE_F0_LAYER_DURATION: command '${command.id}' duration_frames must be finite`);
    }
    if (command.profile_points != null) {
      if (!Array.isArray(command.profile_points)) {
        throw new Error(`E_CONTROL_SCORE_F0_LAYER_PROFILE: command '${command.id}' profile_points must be an array`);
      }
      for (const value of command.profile_points) {
        assertFiniteNumber(value, `E_CONTROL_SCORE_F0_LAYER_PROFILE: command '${command.id}' profile point must be finite`);
      }
    }
  }

  for (const overlay of score.global_overlays) {
    assertNonEmptyString(overlay.id, "E_CONTROL_SCORE_OVERLAY_ID: global overlay id is required");
    assertFieldOps(overlay.fields, `global_overlays.${overlay.id}`);
  }

  assertNonEmptyString(score.lowering_refs.spec_id, "E_CONTROL_SCORE_LOWERING_REFS: spec_id is required");
  if (!Array.isArray(score.lowering_refs.policy_paths) || score.lowering_refs.policy_paths.length === 0) {
    throw new Error("E_CONTROL_SCORE_LOWERING_REFS: policy_paths must be a non-empty array");
  }
  for (const entry of score.lowering_refs.policy_paths) {
    assertNonEmptyString(entry, "E_CONTROL_SCORE_LOWERING_REFS: policy path must be a non-empty string");
  }
}

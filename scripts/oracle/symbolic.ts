type OracleSymbolicPayload = {
  rawPhonemeLog: string;
  phonemeTokens: string[];
  comparisonTokens: string[];
};

type TrackEvent = {
  time?: number;
  phoneme?: string;
  word?: string;
  params?: Record<string, unknown>;
};

type QlattSegment = {
  rawPhoneme: string;
  phoneme: string;
  word?: string;
  startMs: number;
  durationMs: number;
};

type QlattRegion = {
  startMs: number;
  durationMs: number;
};

type QlattBurstRegion = QlattRegion & {
  phoneme: string;
  kind: "release" | "aspiration";
};

const DECTALK_US_TOKENS = new Set([
  "_",
  "iy",
  "ih",
  "ey",
  "eh",
  "ae",
  "aa",
  "ay",
  "aw",
  "ah",
  "ao",
  "ow",
  "oy",
  "uh",
  "uw",
  "rr",
  "yu",
  "ax",
  "ix",
  "ir",
  "er",
  "ar",
  "or",
  "ur",
  "w",
  "yx",
  "r",
  "ll",
  "hx",
  "rx",
  "lx",
  "m",
  "n",
  "nx",
  "el",
  "dz",
  "en",
  "f",
  "v",
  "th",
  "dh",
  "s",
  "z",
  "sh",
  "zh",
  "p",
  "b",
  "t",
  "d",
  "k",
  "g",
  "dx",
  "tx",
  "q",
  "ch",
  "jh",
  "df",
  "tz",
  "cz",
  "~",
  "=",
  "`",
  "'",
  "\"",
  "/",
  "\\",
  "/\\",
  "-",
  "*",
  "#",
  "(",
  ")",
  ";",
  ",",
  ".",
  "?",
  "!",
  "+",
  "^",
  "&",
  ">",
]);

const DECTALK_RHOTIC_LOG_TOKENS: Record<string, string> = {
  // DECtalk 4.63 ph_aloph.c:823-872 fuses vowel + /R/ internally.
  // The -lp log prints those fused allophones with the source vowel spelling.
  iyr: "ir",
  ihr: "ir",
  eyr: "er",
  ehr: "er",
  aer: "er",
  aar: "ar",
  ahr: "ar",
  owr: "or",
  aor: "or",
  uwr: "ur",
  uhr: "ur",
  axr: "rr",
};

const NON_COMPARISON_TOKENS = new Set([
  "_",
  "~",
  "=",
  "`",
  "'",
  "\"",
  "/",
  "\\",
  "/\\",
  "-",
  "*",
  "#",
  "(",
  ")",
  ";",
  ",",
  ".",
  "?",
  "!",
  "+",
  "^",
  "&",
  ">",
]);

const QLATT_TO_DECTALK_TOKEN: Record<string, string> = {
  IY: "iy",
  IH: "ih",
  EY: "ey",
  EH: "eh",
  AE: "ae",
  AA: "aa",
  AY: "ay",
  AW: "aw",
  AH: "ah",
  AO: "ao",
  OW: "ow",
  OY: "oy",
  UH: "uh",
  UW: "uw",
  ER: "er",
  AX: "ax",
  IX: "ix",
  IR: "ir",
  AR: "ar",
  OR: "or",
  UR: "ur",
  EL: "el",
  EN: "en",
  W: "w",
  Y: "yx",
  R: "r",
  L: "ll",
  LL: "ll",
  HH: "hx",
  M: "m",
  N: "n",
  NG: "nx",
  NX: "nx",
  F: "f",
  V: "v",
  TH: "th",
  DH: "dh",
  S: "s",
  Z: "z",
  SH: "sh",
  ZH: "zh",
  P: "p",
  B: "b",
  T: "t",
  D: "d",
  K: "k",
  G: "g",
  CH: "ch",
  JH: "jh",
  DX: "dx",
  TX: "t",
  DZ: "dh",
  Q: "q",
};

const QLATT_SYLLABIC_PHONEMES = new Set([
  "IY",
  "IH",
  "EY",
  "EH",
  "AE",
  "AA",
  "AY",
  "AW",
  "AH",
  "AO",
  "OW",
  "OY",
  "UH",
  "UW",
  "ER",
  "AX",
  "IX",
  "IR",
  "AR",
  "OR",
  "UR",
  "EL",
  "EM",
  "EN",
]);

function normalizeComparisonToken(token: string): string {
  switch (token) {
    // DECtalk's phoneme log uses AX/IX-style reduced vowels where Qlatt's
    // frontend normalizes to canonical ARPAbet vowels.
    case "ax":
      return "ah";
    case "ix":
      return "ih";
    case "rr":
      return "er";
    default:
      return token;
  }
}

function isSameWord(left: QlattSegment, right: QlattSegment): boolean {
  return (
    left.word != null &&
    right.word != null &&
    left.word.length > 0 &&
    left.word === right.word
  );
}

function mapQlattComparisonSegment(
  segment: QlattSegment,
  nextSegment: QlattSegment | undefined,
): string | null {
  if (segment.phoneme === "RR") {
    // DECtalk ph_aloph.c:636-648 changes prevocalic /R/ to the RR acoustic
    // target, but the phoneme log remains an onset `r`; postvocalic AX+R
    // fusion uses RR as a rhotic vowel, logged as `rr` and normalized to `er`.
    return nextSegment != null &&
      isSameWord(segment, nextSegment) &&
      QLATT_SYLLABIC_PHONEMES.has(nextSegment.phoneme)
      ? "r"
      : "er";
  }

  return QLATT_TO_DECTALK_TOKEN[segment.phoneme] ?? null;
}

function mapQlattComparisonSegments(segments: QlattSegment[]): string[] {
  const comparisonSegments = segments.filter(
    (segment) => !isStructuralTransientPhoneme(segment.rawPhoneme),
  );
  return collapseQlattComparisonTokens(
    comparisonSegments
      .map((segment, index) =>
        mapQlattComparisonSegment(segment, comparisonSegments[index + 1]),
      )
      .filter(
        (token): token is string => typeof token === "string" && token.length > 0,
      )
      .map(normalizeComparisonToken),
  );
}

function collapseQlattComparisonTokens(tokens: string[]): string[] {
  const collapsed: string[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const current = tokens[index];
    const next = tokens[index + 1];
    // DECtalk logs /y uw/ as the single symbol `yu`; the frontend keeps this as
    // glide + vowel. Collapse that sequence so the oracle comparison is stage-aligned.
    if (current === "yx" && next === "uw") {
      collapsed.push("yu");
      index += 1;
      continue;
    }
    collapsed.push(current);
  }
  return collapsed;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeQlattPhoneme(rawPhoneme: string): string | null {
  const trimmed = rawPhoneme.trim();
  if (!trimmed || trimmed === "SIL") return null;
  const strippedStress = trimmed.replace(/[012]$/, "");
  const structuralBase = strippedStress.replace(/_(REL|ASP)$/, "");
  return structuralBase || null;
}

function isStructuralTransientPhoneme(rawPhoneme: string): boolean {
  return /_(REL|ASP)$/.test(rawPhoneme.trim());
}

function toTrackEvents(value: unknown): TrackEvent[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is TrackEvent => !!item && typeof item === "object",
  );
}

function extractTrackSwRegions(trackEvents: TrackEvent[]): QlattRegion[] {
  if (trackEvents.length === 0) return [];

  const swRegions: QlattRegion[] = [];
  const lastTrackTime = isFiniteNumber(trackEvents[trackEvents.length - 1]?.time)
    ? Number(trackEvents[trackEvents.length - 1]?.time)
    : 0;
  let swStartTime: number | null = null;

  for (let i = 0; i < trackEvents.length - 1; i += 1) {
    const current = trackEvents[i];
    const next = trackEvents[i + 1];
    const startTime = isFiniteNumber(current?.time) ? Number(current.time) : null;
    const endTime = isFiniteNumber(next?.time) ? Number(next.time) : null;
    const duration = startTime != null && endTime != null ? endTime - startTime : 0;
    if (startTime == null || endTime == null || duration <= 0) continue;
    const swValue = current?.params?.SW;
    const swOn = isFiniteNumber(swValue) && swValue === 1;
    if (swOn && swStartTime == null) {
      swStartTime = startTime;
    }
    if (!swOn && swStartTime != null) {
      swRegions.push({
        startMs: swStartTime * 1000,
        durationMs: Math.max(0, (startTime - swStartTime) * 1000),
      });
      swStartTime = null;
    }
  }

  if (swStartTime != null) {
    swRegions.push({
      startMs: swStartTime * 1000,
      durationMs: Math.max(0, (lastTrackTime - swStartTime) * 1000),
    });
  }

  return swRegions;
}

function extractTrackBurstRegions(trackEvents: TrackEvent[]): QlattBurstRegion[] {
  if (trackEvents.length < 2) return [];

  const MIN_BURST_RISE_DB = 20;
  const ACTIVE_BURST_DB = 6;
  const bursts: QlattBurstRegion[] = [];

  for (let i = 1; i < trackEvents.length; i += 1) {
    const previous = trackEvents[i - 1];
    const current = trackEvents[i];
    const startTime = isFiniteNumber(current?.time) ? Number(current.time) : null;
    if (startTime == null) continue;

    const previousAfValue = previous?.params?.AF;
    const currentAfValue = current?.params?.AF;
    const previousAhValue = previous?.params?.AH;
    const currentAhValue = current?.params?.AH;
    const previousAf = isFiniteNumber(previousAfValue) ? Number(previousAfValue) : 0;
    const currentAf = isFiniteNumber(currentAfValue) ? Number(currentAfValue) : 0;
    const previousAh = isFiniteNumber(previousAhValue) ? Number(previousAhValue) : 0;
    const currentAh = isFiniteNumber(currentAhValue) ? Number(currentAhValue) : 0;

    const afRise = currentAf - previousAf;
    const ahRise = currentAh - previousAh;
    const useAf = afRise >= ahRise;
    const rise = useAf ? afRise : ahRise;
    const activeValue = useAf ? currentAf : currentAh;
    if (rise < MIN_BURST_RISE_DB || activeValue < ACTIVE_BURST_DB) continue;

    let endTime = startTime;
    for (let j = i + 1; j < trackEvents.length; j += 1) {
      const candidateTime = isFiniteNumber(trackEvents[j]?.time)
        ? Number(trackEvents[j].time)
        : null;
      if (candidateTime == null) continue;
      const candidateRawValue = useAf
        ? trackEvents[j]?.params?.AF
        : trackEvents[j]?.params?.AH;
      const candidateValue = isFiniteNumber(candidateRawValue)
        ? Number(candidateRawValue)
        : 0;
      endTime = candidateTime;
      if (candidateValue < ACTIVE_BURST_DB) {
        break;
      }
    }

    const rawPhoneme =
      typeof current?.phoneme === "string" && current.phoneme.trim().length > 0
        ? current.phoneme
        : "TRACK";
    bursts.push({
      startMs: startTime * 1000,
      durationMs: Math.max(0, (endTime - startTime) * 1000),
      phoneme: rawPhoneme,
      kind: useAf ? "release" : "aspiration",
    });
  }

  return bursts;
}

function levenshteinDistance(left: string[], right: string[]): number {
  if (left.length === 0) return right.length;
  if (right.length === 0) return left.length;
  const previous = new Array<number>(right.length + 1);
  const current = new Array<number>(right.length + 1);
  for (let j = 0; j <= right.length; j += 1) previous[j] = j;
  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
    }
    for (let j = 0; j <= right.length; j += 1) previous[j] = current[j];
  }
  return previous[right.length];
}

export function parseDectalkUsPhonemeLog(rawText: string): OracleSymbolicPayload {
  const normalized = rawText.replace(/\r?\n/g, "");
  const tokens: string[] = [];

  for (let i = 0; i < normalized.length; ) {
    const char = normalized[i];
    if (/\s/.test(char)) {
      i += 1;
      continue;
    }

    const rhoticLogToken = DECTALK_RHOTIC_LOG_TOKENS[normalized.slice(i, i + 3)];
    if (rhoticLogToken != null) {
      tokens.push(rhoticLogToken);
      i += 3;
      continue;
    }

    const slashPair = normalized.slice(i, i + 2);
    if (slashPair === "/\\") {
      tokens.push(slashPair);
      i += 2;
      continue;
    }

    const pair = normalized.slice(i, i + 2);
    if (pair.length === 2 && DECTALK_US_TOKENS.has(pair)) {
      tokens.push(pair);
      i += 2;
      continue;
    }

    if (DECTALK_US_TOKENS.has(char)) {
      tokens.push(char);
      i += 1;
      continue;
    }

    tokens.push(char);
    i += 1;
  }

  return {
    rawPhonemeLog: normalized.trimEnd(),
    phonemeTokens: tokens,
    comparisonTokens: tokens
      .filter((token) => !NON_COMPARISON_TOKENS.has(token))
      .map(normalizeComparisonToken),
  };
}

export function extractQlattSymbolic(payload: unknown): {
  segmentCount: number;
  segments: QlattSegment[];
  phonemeSequence: string[];
  comparisonTokens: string[];
  swRegions: QlattRegion[];
  burstRegions: QlattBurstRegion[];
} {
  const trackEvents = toTrackEvents(
    payload && typeof payload === "object"
      ? (payload as { track?: unknown }).track
      : null,
  );
  const swRegions = extractTrackSwRegions(trackEvents);
  const trackBurstRegions = extractTrackBurstRegions(trackEvents);

  if (trackEvents.length === 0) {
    return {
      segmentCount: 0,
      segments: [],
      phonemeSequence: [],
      comparisonTokens: [],
      swRegions: [],
      burstRegions: [],
    };
  }

  const segments: QlattSegment[] = [];
  let activeSegment:
    | {
        rawPhoneme: string;
        phoneme: string;
        word?: string;
        startTime: number;
      }
    | null = null;

  const lastTrackTime = isFiniteNumber(trackEvents[trackEvents.length - 1]?.time)
    ? Number(trackEvents[trackEvents.length - 1]?.time)
    : 0;

  for (const event of trackEvents) {
    const eventTime = isFiniteNumber(event.time) ? event.time : null;
    const rawPhoneme = typeof event.phoneme === "string" ? event.phoneme : null;
    const phoneme = rawPhoneme ? normalizeQlattPhoneme(rawPhoneme) : null;
    if (!rawPhoneme || !phoneme || eventTime == null) continue;

    if (
      !activeSegment ||
      activeSegment.rawPhoneme !== rawPhoneme ||
      activeSegment.startTime > eventTime
    ) {
      if (activeSegment) {
        const durationMs = Math.max(0, (eventTime - activeSegment.startTime) * 1000);
        segments.push({
          rawPhoneme: activeSegment.rawPhoneme,
          phoneme: activeSegment.phoneme,
          ...(activeSegment.word ? { word: activeSegment.word } : {}),
          startMs: activeSegment.startTime * 1000,
          durationMs,
        });
      }
      activeSegment = {
        rawPhoneme,
        phoneme,
        word: typeof event.word === "string" ? event.word : undefined,
        startTime: eventTime,
      };
    }
  }

  if (activeSegment) {
    const durationMs = Math.max(0, (lastTrackTime - activeSegment.startTime) * 1000);
    segments.push({
      rawPhoneme: activeSegment.rawPhoneme,
      phoneme: activeSegment.phoneme,
      ...(activeSegment.word ? { word: activeSegment.word } : {}),
      startMs: activeSegment.startTime * 1000,
      durationMs,
    });
  }

  const phonemeSequence: string[] = [];
  for (const segment of segments) {
    if (phonemeSequence[phonemeSequence.length - 1] !== segment.phoneme) {
      phonemeSequence.push(segment.phoneme);
    }
  }

  const comparisonTokens = mapQlattComparisonSegments(segments);

  const labeledBurstRegions = segments
    .filter(
      (segment) =>
        segment.rawPhoneme.endsWith("_REL") || segment.rawPhoneme.endsWith("_ASP"),
    )
    .map((segment) => ({
      startMs: segment.startMs,
      durationMs: segment.durationMs,
      phoneme: segment.rawPhoneme,
      kind: segment.rawPhoneme.endsWith("_ASP") ? "aspiration" : "release",
    }));
  const burstRegions = labeledBurstRegions.length > 0 ? labeledBurstRegions : trackBurstRegions;

  return {
    segmentCount: segments.length,
    segments,
    phonemeSequence,
    comparisonTokens,
    swRegions,
    burstRegions,
  };
}

export function buildSymbolicComparison(
  oracleSymbolic: unknown,
  qlattPayload: unknown,
): {
  oracle: Record<string, unknown>;
  qlatt: Record<string, unknown>;
  comparison: Record<string, unknown>;
} {
  const oracle =
    oracleSymbolic && typeof oracleSymbolic === "object"
      ? (oracleSymbolic as Record<string, unknown>)
      : {};
  const qlatt = extractQlattSymbolic(qlattPayload);

  const oracleTokens = Array.isArray(oracle.comparisonTokens)
    ? oracle.comparisonTokens.filter((token): token is string => typeof token === "string")
    : [];
  const qlattTokens = qlatt.comparisonTokens;

  const maxLength = Math.max(oracleTokens.length, qlattTokens.length);
  const tokenEdits = maxLength > 0 ? levenshteinDistance(oracleTokens, qlattTokens) : 0;
  const tokenSimilarity = maxLength > 0 ? 1 - tokenEdits / maxLength : null;

  return {
    oracle: {
      rawPhonemeLog:
        typeof oracle.rawPhonemeLog === "string" ? oracle.rawPhonemeLog : "",
      phonemeTokens:
        Array.isArray(oracle.phonemeTokens) ? oracle.phonemeTokens : [],
      comparisonTokens: oracleTokens,
      ...(typeof oracle.phonemeLogPath === "string"
        ? { phonemeLogPath: oracle.phonemeLogPath }
        : {}),
    },
    qlatt: {
      segmentCount: qlatt.segmentCount,
      segments: qlatt.segments,
      phonemeSequence: qlatt.phonemeSequence,
      comparisonTokens: qlatt.comparisonTokens,
      swRegions: qlatt.swRegions,
      burstRegions: qlatt.burstRegions,
    },
    comparison: {
      oracleTokenCount: oracleTokens.length,
      qlattTokenCount: qlattTokens.length,
      tokenEdits,
      tokenSimilarity,
      tokenLengthDelta: qlattTokens.length - oracleTokens.length,
      qlattSegmentCount: qlatt.segmentCount,
      qlattSwRegionCount: qlatt.swRegions.length,
      qlattBurstCount: qlatt.burstRegions.length,
    },
  };
}

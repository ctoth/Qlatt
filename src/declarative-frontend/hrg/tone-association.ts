/**
 * Ordered symbolic association: Goldsmith (1976), Chapter 3 (star convention),
 * and p. 51 (well-formedness/no crossing). No pitch or language policy lives here.
 * Local melody domains and anchors are supplied by the cited declaring rule.
 */
import { isPlainObject } from "../../yaml-loader";
import type { Item } from "./item";
import type { HrgTransaction } from "./transaction";
import type { HrgSchema } from "./types";
import type { Utterance } from "./utterance";

export const TONE_ITEM_SCHEMA: HrgSchema["itemTypes"][string] = {
  features: {
    symbol: { kind: "string" },
    role: { kind: "string" },
    starred: { kind: "boolean" },
    domain: { kind: "string" },
    index: { kind: "number" },
  },
};

type Tone = { symbol: string; role: string; starred: boolean };
type Anchor = { tone: number; unit: number };

export function applyToneAssociation(
  utterance: Utterance,
  tx: HrgTransaction,
  source: Item,
  spec: Readonly<Record<string, unknown>>,
  evaluate: (expression: unknown) => unknown,
): void {
  const domain = evaluate(spec.domain);
  const fail = (code: string, detail: string): never => {
    const message = `${code}: domain '${String(domain)}': ${detail}`;
    utterance.diagnostics.error(message, { rule: tx.metadata.ruleId, domain }, code);
    throw new Error(message);
  };
  if (typeof domain !== "string" || !domain) fail("E_TONE_DOMAIN", "expected a nonempty domain id");
  const rawUnits = evaluate(spec.units);
  const rawTones = evaluate(spec.tones);
  const rawAnchors = evaluate(spec.anchors);
  if (!Array.isArray(rawUnits) || !Array.isArray(rawTones) || !Array.isArray(rawAnchors))
    fail("E_TONE_INPUT", "units, tones and anchors must evaluate to lists");
  const units: Item[] = (rawUnits as unknown[]).map((value) => {
    const item =
      isPlainObject(value) && typeof value.id === "string"
        ? utterance.getItem(value.id)
        : undefined;
    if (!item || (item.has("active") && tx.read(item, "active") === false))
      return fail("E_TONE_UNIT", "every unit must be an active HRG item");
    return item;
  });
  if (new Set(units).size !== units.length) fail("E_TONE_UNIT", "duplicate unit in ordered domain");
  const tones: Tone[] = (rawTones as unknown[]).map((value) => {
    if (
      !isPlainObject(value) ||
      typeof value.symbol !== "string" ||
      !value.symbol ||
      typeof value.role !== "string" ||
      !value.role ||
      typeof value.starred !== "boolean" ||
      Object.keys(value).some((key) => !["symbol", "role", "starred"].includes(key))
    )
      return fail("E_TONE_INPUT", "each tone requires only symbol, role and starred");
    return { symbol: value.symbol, role: value.role, starred: value.starred };
  });
  const anchors: Anchor[] = (rawAnchors as unknown[])
    .map((value) => {
      if (
        !isPlainObject(value) ||
        typeof value.tone !== "number" ||
        !Number.isInteger(value.tone) ||
        typeof value.unit !== "number" ||
        !Number.isInteger(value.unit) ||
        value.tone < 0 ||
        value.tone >= tones.length ||
        value.unit < 0 ||
        value.unit >= units.length ||
        Object.keys(value).some((key) => !["tone", "unit"].includes(key))
      )
        return fail("E_TONE_ANCHOR", "anchor must index an existing tone and unit");
      return { tone: value.tone, unit: value.unit };
    })
    .sort((a, b) => a.tone - b.tone);
  if ((units.length === 0) !== (tones.length === 0))
    fail("E_TONE_EMPTY", "an empty tier cannot associate to a nonempty tier");
  if (spec.mode !== "left_to_right" && spec.mode !== "anchored")
    fail("E_TONE_MODE", "unknown association mode");
  if (spec.mode === "left_to_right" && (anchors.length || tones.some((tone) => tone.starred)))
    fail("E_TONE_ANCHOR", "non-accentual mapping cannot contain stars or anchors");
  if (spec.mode === "anchored") {
    if (tones.length && anchors.length === 0)
      fail("E_TONE_ANCHOR", "anchored mapping requires an anchor");
    for (let i = 0; i < tones.length; i++) {
      if (tones[i].starred && !anchors.some((anchor) => anchor.tone === i))
        fail("E_TONE_ANCHOR", `starred tone ${i} (${tones[i].symbol}) has no anchor`);
    }
  }
  for (let i = 1; i < anchors.length; i++) {
    const previous = anchors[i - 1];
    const current = anchors[i];
    if (previous.tone === current.tone)
      fail("E_TONE_ANCHOR", `tone ${current.tone} has conflicting anchors`);
    if (previous.unit > current.unit)
      fail(
        "E_TONE_CROSSING",
        `tone ${previous.tone} (${tones[previous.tone].symbol}) -> ${units[previous.unit].id} crosses tone ${current.tone} (${tones[current.tone].symbol}) -> ${units[current.unit].id}`,
      );
  }
  const links = tones.map(() => new Set<number>());
  const link = (tone: number, unit: number) => links[tone].add(unit);
  // Map a gap in its declared direction. Overflow stacks on the last available
  // unit; underflow spreads the last available tone (Goldsmith Ch. 3).
  const gap = (
    toneIndices: number[],
    unitIndices: number[],
    fallbackTone: number,
    fallbackUnit: number,
  ) => {
    for (let i = 0; i < Math.max(toneIndices.length, unitIndices.length); i++) {
      link(
        toneIndices[Math.min(i, toneIndices.length - 1)] ?? fallbackTone,
        unitIndices[Math.min(i, unitIndices.length - 1)] ?? fallbackUnit,
      );
    }
  };
  const range = (start: number, end: number) =>
    Array.from({ length: Math.max(0, end - start) }, (_, i) => start + i);
  if (anchors.length === 0) {
    if (tones.length) gap(range(0, tones.length), range(0, units.length), 0, 0);
  } else {
    for (const anchor of anchors) link(anchor.tone, anchor.unit);
    const first = anchors[0];
    gap(range(0, first.tone).reverse(), range(0, first.unit).reverse(), first.tone, first.unit);
    for (let i = 1; i < anchors.length; i++) {
      const left = anchors[i - 1];
      const right = anchors[i];
      gap(range(left.tone + 1, right.tone), range(left.unit + 1, right.unit), left.tone, left.unit);
    }
    const last = anchors[anchors.length - 1];
    gap(
      range(last.tone + 1, tones.length),
      range(last.unit + 1, units.length),
      last.tone,
      last.unit,
    );
  }
  // Validate the complete proposal before staging any writes. Shared endpoints
  // are legal; decreasing endpoints are crossing lines.
  let previousMax = -1;
  for (let i = 0; i < links.length; i++) {
    const targets = [...links[i]].sort((a, b) => a - b);
    if (!targets.length) fail("E_TONE_UNRESOLVED", `tone ${i} is unassociated`);
    if (targets[0] < previousMax)
      fail("E_TONE_CROSSING", `tone ${i} crosses a preceding association`);
    previousMax = targets[targets.length - 1];
  }
  const relationName = String(spec.relation);
  const itemTypes = utterance.relation(relationName).itemTypes();
  if (itemTypes.length !== 1)
    fail("E_TONE_RELATION", "tone relation must admit exactly one item type");
  for (let i = 0; i < tones.length; i++) {
    const tone = tx.createItem(itemTypes[0], `${source.id}:${tx.metadata.ruleId}:tone:${i}`);
    tx.set(tone, "symbol", tones[i].symbol, String(spec.tag));
    tx.set(tone, "role", tones[i].role, String(spec.tag));
    tx.set(tone, "starred", tones[i].starred, String(spec.tag));
    tx.set(tone, "domain", domain, String(spec.tag));
    tx.set(tone, "index", i, String(spec.tag));
    tx.append(relationName, tone);
    tx.associate(String(spec.source_association), source, tone);
    for (const index of [...links[i]].sort((a, b) => a - b))
      tx.associate(String(spec.association), tone, units[index]);
  }
}

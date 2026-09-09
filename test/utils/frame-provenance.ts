import { expect } from "vitest";
import type { Utterance } from "../../src/declarative-frontend/hrg";
import { decisionChain } from "../../src/declarative-frontend/hrg/provenance-query";

export function expectFrameSource(
  utterance: Utterance,
  decisionId: string | undefined,
  sourceId: string | undefined,
): void {
  expect(decisionId).toBeDefined();
  expect(sourceId).toBeDefined();
  const chain = decisionChain(utterance.provenance, decisionId!);
  expect(chain[0]?.subject).toMatch(/^item:frame:/);
  expect(chain[0]?.citations.length).toBeGreaterThan(0);
  expect(chain.map((decision) => decision.id)).toContain(sourceId);
}

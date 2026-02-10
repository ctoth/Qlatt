import { describe, expect, it } from "vitest";
import {
  TokenStatus,
  joinTokenStatus,
  normalizeTokenStatus,
  isActiveToken,
} from "../src/declarative-frontend/model.js";

describe("declarative frontend token model", () => {
  it("normalizes token statuses with ACTIVE default", () => {
    expect(normalizeTokenStatus(undefined)).toBe(TokenStatus.ACTIVE);
    expect(normalizeTokenStatus("UNKNOWN")).toBe(TokenStatus.UNKNOWN);
    expect(normalizeTokenStatus("ACTIVE")).toBe(TokenStatus.ACTIVE);
    expect(normalizeTokenStatus("SUPPRESSED")).toBe(TokenStatus.SUPPRESSED);
    expect(normalizeTokenStatus(2)).toBe(TokenStatus.SUPPRESSED);
  });

  it("joins token statuses monotonically", () => {
    expect(joinTokenStatus(TokenStatus.UNKNOWN, TokenStatus.ACTIVE)).toBe(TokenStatus.ACTIVE);
    expect(joinTokenStatus(TokenStatus.ACTIVE, TokenStatus.SUPPRESSED)).toBe(
      TokenStatus.SUPPRESSED
    );
    expect(joinTokenStatus(TokenStatus.SUPPRESSED, TokenStatus.ACTIVE)).toBe(
      TokenStatus.SUPPRESSED
    );
  });

  it("treats only ACTIVE status as active", () => {
    expect(isActiveToken({ status: TokenStatus.ACTIVE })).toBe(true);
    expect(isActiveToken({ status: TokenStatus.UNKNOWN })).toBe(false);
    expect(isActiveToken({ status: TokenStatus.SUPPRESSED })).toBe(false);
  });
});


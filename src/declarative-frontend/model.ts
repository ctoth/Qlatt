export const TokenStatus = Object.freeze({
  UNKNOWN: 0,
  ACTIVE: 1,
  SUPPRESSED: 2,
});

export type TokenStatusValue = (typeof TokenStatus)[keyof typeof TokenStatus];

const STRING_TO_STATUS: Record<keyof typeof TokenStatus, TokenStatusValue> = {
  UNKNOWN: TokenStatus.UNKNOWN,
  ACTIVE: TokenStatus.ACTIVE,
  SUPPRESSED: TokenStatus.SUPPRESSED,
};

export function normalizeTokenStatus(status: unknown): TokenStatusValue {
  if (
    typeof status === "number" &&
    Number.isInteger(status) &&
    status >= TokenStatus.UNKNOWN &&
    status <= TokenStatus.SUPPRESSED
  ) {
    return status as TokenStatusValue;
  }

  if (typeof status === "string") {
    const key = status.toUpperCase();
    if (Object.prototype.hasOwnProperty.call(STRING_TO_STATUS, key)) {
      return STRING_TO_STATUS[key as keyof typeof STRING_TO_STATUS];
    }
  }

  return TokenStatus.ACTIVE;
}

export function joinTokenStatus(left: unknown, right: unknown): TokenStatusValue {
  return Math.max(normalizeTokenStatus(left), normalizeTokenStatus(right)) as TokenStatusValue;
}

export function isActiveToken(token: { status?: unknown } | null | undefined): boolean {
  return normalizeTokenStatus(token?.status) === TokenStatus.ACTIVE;
}

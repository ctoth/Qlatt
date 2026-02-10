export const TokenStatus = Object.freeze({
  UNKNOWN: 0,
  ACTIVE: 1,
  SUPPRESSED: 2,
});

const STRING_TO_STATUS = {
  UNKNOWN: TokenStatus.UNKNOWN,
  ACTIVE: TokenStatus.ACTIVE,
  SUPPRESSED: TokenStatus.SUPPRESSED,
};

export function normalizeTokenStatus(status) {
  if (Number.isInteger(status) && status >= TokenStatus.UNKNOWN && status <= TokenStatus.SUPPRESSED) {
    return status;
  }

  if (typeof status === "string") {
    const normalized = STRING_TO_STATUS[status.toUpperCase()];
    if (normalized !== undefined) return normalized;
  }

  return TokenStatus.ACTIVE;
}

export function joinTokenStatus(left, right) {
  return Math.max(normalizeTokenStatus(left), normalizeTokenStatus(right));
}

export function isActiveToken(token) {
  return normalizeTokenStatus(token?.status) === TokenStatus.ACTIVE;
}


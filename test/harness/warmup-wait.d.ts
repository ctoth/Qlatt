export const IDLE_WAIT_LIMIT_MS: number;
export const SPEAK_WAIT_LIMIT_MS: number;

export function idle(limitMs?: number): Promise<void>;

export function waitForWarmup(
  pending: Promise<unknown>,
  frontendId: string,
  limitMs?: number,
  warn?: (message: string) => void,
): Promise<boolean>;

export function settledWithin<T>(
  pending: Promise<T>,
  limitMs: number,
): Promise<{ settled: true; value: T } | { settled: false; reason: unknown }>;

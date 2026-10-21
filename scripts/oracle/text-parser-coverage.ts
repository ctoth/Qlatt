#!/usr/bin/env node

/**
 * text-parser-coverage.ts
 * =======================
 * Which rules of the text parser table the recorded texts exercise: over
 * every text of the parser fixtures (scripts/oracle/text-parser-port.ts), the
 * live rules that hit at least once and those that never do, each with its
 * line and text in the rule source.
 *
 * A rule is live when the port's two passes can start it: it stands in the
 * punctuation section or the main section, its language mask has the port's
 * language bit and its mode mask has the pass's mode bit (liveRules).
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/text-parser-coverage.ts [--fired]
 *
 * A measurement tool: exit code 0.
 */

import { firedRules, liveRules } from "./text-parser-port.ts";

const live = liveRules();
const fired = firedRules();
const never = live.filter((rule) => !fired.has(rule.number as number));
console.log(
  JSON.stringify({ live: live.length, fired: live.length - never.length, never: never.length }),
);
if (process.argv.includes("--fired")) {
  for (const rule of live.filter((candidate) => fired.has(candidate.number as number))) {
    console.log(`fired ${fired.get(rule.number as number)}x  R${rule.number} (line ${rule.line})`);
  }
}
for (const rule of never) console.log(`never  R${rule.number} (line ${rule.line})  ${rule.text}`);

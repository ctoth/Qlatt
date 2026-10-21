#!/usr/bin/env node

/**
 * dump-frontend-diagnostics.ts
 * ============================
 * The diagnostics a frontend emits for one text, one JSON line each (level,
 * code, message, data), as scripts/hash-frontend-outputs.ts hashes them: to
 * see what a differing diagnostics hash differs in.
 *
 * Usage:
 *   node --no-warnings --loader ts-node/esm/transpile-only \
 *     --experimental-specifier-resolution=node \
 *     scripts/dump-frontend-diagnostics.ts <text> [<frontend id>]
 *
 * A measurement tool; nothing in the build depends on it.
 */

import { createDiagnostics } from "../src/diagnostics";
import { createProvenanceCollector } from "../src/provenance";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const [text, frontendId = "dectalk-english"] = process.argv.slice(2);
if (text === undefined) throw new Error("Usage: <text> [<frontend id>]");
const diagnostics = createDiagnostics({ maxEntries: 1000000 });
textToKlattTrackDetailed(text, undefined, 30, {
  frontendId,
  provenance: createProvenanceCollector(),
  diagnostics,
});
for (const { level, code, message, data } of diagnostics.getEntries()) {
  console.log(JSON.stringify({ level, code, message, data }));
}

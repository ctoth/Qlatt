Report failed realization through caller Diagnostics with affected rules, bindings, actual fallback outcomes, and bounded occurrence counts. Reject invalid track timing before replacing automation; report malformed frames and omitted required writes while preserving sparse tracks.

Closes #162

Validation:
- npx vitest run test/realization-diagnostics.test.ts test/realize-error-routing.test.ts test/runtime-diagnostics.test.ts test/klatt-interpreter.test.ts
- npm run typecheck
- npm run check
- pwsh -NoProfile -File build.ps1
- npm run build
- CI: npm test

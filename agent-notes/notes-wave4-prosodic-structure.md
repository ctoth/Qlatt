# Wave 4.1: Prosodic Structure Annotation — Working Notes

## Goal
Implement `annotateProsody()` function that annotates pipeline tokens with prosodic structure:
- isFunctionWord / isContentWord
- isAccented / isNuclearAccent
- accentType (H*, L*, etc.)
- breakIndex (0-4)
- phraseAccent / boundaryTone

## Key Findings
- PipelineToken is `Record<string, any>` — all new fields are accessible
- CEL rules access token fields via `toCursorView()` which spreads token (`{ ...token }`)
- So `current.isFunctionWord` etc. will work in CEL rules
- ProvenanceStage union needs `"prosody"` added (currently: transcribe | rules | semantics | interpreter | runtime)
- `tts-frontend.ts` already uses `stage: 'frontend'` which isn't in the union
- Insert point: after line 245 (stream/status map), before line 249 (prosody runPhases)
- Function word list: ~145 words from O'Shaughnessy 1976 and Allen 1987

## Implementation Plan
1. Create src/prosodic-annotator.ts with annotateProsody() + FUNCTION_WORDS set
2. Add "prosody" to ProvenanceStage union in provenance.ts
3. Wire into tts-frontend.ts between status map and prosody phases
4. Write tests in test/prosodic-annotator.test.ts
5. Run tests, commit

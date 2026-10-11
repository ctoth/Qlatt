# Code Review Fixes - Progress Notes

## Goal
Fix 5 confirmed code review issues TDD-style, committing between each one.

## Order
1. Extract duplicated `requireNumericArg`/`registerNumericBuiltins` to shared module
2. Clean up `buildContext` deep copy (remove dead function refs)
3. Remove duplicated proximity corrections from interpreter
4. Add proper error routing for realize failures (issue 6)
5. Extract PLSTEP threshold constant (issue 5)

## Progress

### Fix 1: Extract Duplicated Code
- Status: DONE
- Commit: 121ca74
- New shared module: `src/semantics/register-builtins.ts`
- Tests: 9/9 passed in `test/register-builtins.test.ts`

### Fix 2: buildContext Deep Copy Cleanup
- Status: DONE
- Commit: 918db5d
- Removed dead function refs from staticContext (standardFunctions, proximity)
- Replaced JSON.parse/stringify with structuredClone
- Extracted buildStaticContext/buildFrameContext as exported testable functions
- Tests: 5/5 passed in `test/build-context-cleanup.test.ts`

### Fix 3: Remove Proximity Duplication
- Status: DONE
- Commit: 875ba49
- Removed 8 hardcoded proximity lines from buildContext
- KEY FINDING: proximity() was never registered with CEL evaluator!
  Semantics rules were silently failing, hardcoded values surviving by accident.
  Fixed by registering proximity in register-builtins.ts.
- Tests: 5/5 passed in `test/proximity-from-semantics.test.ts`

### Fix 4: Silent Fallthrough Observability
- Status: DONE
- Commit: 6e7a777
- evaluate() errors now route through runtime's log() callback
- applyValues() detects bindings affected by failed realize rules, logs summary
- KEY FINDING: the ?? fallthrough in resolveParamValue is effectively dead code
  (topological evaluator seeds result.values from context.params first)
- Tests: 3/3 passed in `test/realize-error-routing.test.ts`

### Fix 5: PLSTEP Threshold Constant
- Status: DONE
- Commit: 70cdb41
- Added plstepThreshold: 49 as semantics constant with PARCOE.FOR citation
- graph.yaml edge-detectors now use { bind: plstepThreshold }
- Interpreter reads threshold from semantics with fallback
- Tests: 5/5 passed in `test/plstep-threshold-consistency.test.ts`

---

## Round 2: Architecture Review Fixes

Scout report: `reports/scout-architecture-review-issues.md`

### Fix 6: PLSTEP state update unconditional
- Status: DONE
- Commit: eff9138
- Moved prevAF/prevAH updates outside if(telemetryHandler)
- Tests: 4/4 passed in `test/klatt-interpreter.test.ts`

### Fix 7: Move getAudioParam before first call
- Status: DONE
- Commit: faad976
- Pure reorder, no logic changes. 81-line gap closed.

### Fix 8: Fix isAudioWorkletNode type guard
- Status: DONE
- Commit: 23b0ed5
- Replaced 'port' in node with typeof AudioWorkletNode !== 'undefined' && node instanceof AudioWorkletNode
- Environment guard needed because vitest runs in Node.js (no AudioWorkletNode global)
- Tests: 6/6 passed in `test/audio-node-guards.test.ts`

### Fix 9: waitForNodeReady reject on timeout
- Status: DONE
- Commit: 7acbcca
- Timeout now rejects, handler cleaned up on timeout
- awaitWorkletReady catches rejection, logs warning, continues
- Tests: 4/4 passed in `test/klatt-runtime-worklet.test.ts`

### Fix 10: as any consistency + non-empty catch
- Status: DONE
- Commit: e64d222
- Replaced `as any` with `as unknown as Record<string, unknown>`
- Added warning log to cancelScheduledValues catch block

### Fix 11: resolveParamValue throw on expr specs at validation
- Status: DONE
- Commit: be7730c
- Added validation in createKlattRuntime that throws on { expr: "..." } param specs
- Error message directs users to use realize rules in semantics.yaml
- Tests: 3/3 passed in `test/graph-validation.test.ts`

### Fix 12: Tagged union for binding lists
- Status: DONE
- Commit: 047ea2d
- Replaced 3 separate lists with single CategorizedBinding[] with 'realized' | 'ramp' | 'passthrough'
- compileSchedule uses switch(binding.type) instead of 3 separate loops
- Net ~25 lines removed
- Tests: 6/6 passed in `test/klatt-interpreter.test.ts`

### Fix 13: connectToDestination error on missing outputs
- Status: DONE
- Commit: 895013b
- Removed fallback chain, graph.outputs is now authoritative
- Missing/empty/invalid outputs throws clear error
- Tests: 7/7 passed in `test/graph-validation.test.ts`

### Fix 14: Shared AudioParam access
- Status: DONE
- Commit: 9cf00ee
- Created `src/audio-param-utils.ts` with shared getAudioParam/applyParamValue
- Removed duplicated implementations from interpreter and runtime
- Tests: 11/11 passed in `test/audio-param-access.test.ts`

### Fix 15: Shared CEL evaluator factory
- Status: DONE
- Commit: dca097c
- Created `src/semantics/evaluator-factory.ts` with createConfiguredEvaluator()
- Both interpreter and runtime now use the factory
- Tests: 4/4 passed in `test/evaluator-factory.test.ts`

### Fix 16: Document structuredClone justification
- Status: DONE
- Commit: 2ba11bb
- Comment-only change explaining why structuredClone is needed (cel-js context mutation)
- No behavioral change

---

## Round 3: Second Architecture Review Fixes

### Fix 17: Remove dead expr branch in resolveParamValue
- Status: DONE
- Commit: f635b17
- Unreachable code removed (load-time validation makes it dead)

### Fix 18: Move burst amplitude offset to semantics.yaml
- Status: DONE
- Commit: 82358f5
- plstepBurstOffsetDb: 75 added to semantics constants
- plstepAmplitude realize rule updated to reference constant
- Interpreter reads from semantics with fallback
- Tests: 7/7 in plstep-threshold-consistency

### Fix 19: startTime type/nullish-coalescing mismatch
- Status: DONE
- Commit: 8e4f68d
- Removed dead ?? fallback (type is number, all callers pass concrete value)

### Fix 20: let currentInputs → const
- Status: DONE
- Commit: 39d06e9
- One-word change, never reassigned

### Fix 21: Type evaluator errors properly
- Status: DONE
- Commit: 4f18600
- Exported EvaluationError interface from types.ts
- Runtime duck-typing removed, uses typed access
- Interpreter already had typed access via inference

### Fix 22: Rename BindingInfo/BindingList for clarity
- Status: DONE
- Commit: b30e396
- BindingInfo → BindingSpec (metadata level)
- Binding → ResolvedBinding (live AudioParam handle level)
- BindingList → ResolvedBindingList
- Updated across runtime, interpreter, and tests

## ALL 22 FIXES COMPLETE

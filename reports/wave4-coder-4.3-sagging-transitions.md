# Coder Report 4.3: Sagging Transitions

## What Was Implemented

### 1. Extended F0Point Type (`src/track-assembler.ts`)
Added optional `tag` and `accentType` fields to the `F0Point` type:
- `tag?: string` -- source rule tag (e.g., "f0_h_star", "f0_l_star", "f0_boundary_low")
- `accentType?: string` -- ToBI accent type derived from tag ("H*" or "L*")

### 2. Tag Propagation in buildF0ContourFromDeclarative()
Updated the `.map()` call to extract `tag` from source tokens and derive `accentType`:
- `f0_h_star` tag -> `accentType = "H*"`
- `f0_l_star` tag -> `accentType = "L*"`
- All other tags propagated without accentType

Also updated the dedup (last-write-wins) loop to preserve tag/accentType metadata from the winning point.

### 3. Added Sag Parameters to frontend.yaml
Under `params.policy.f0`:
- `sag_depth_hz: 12` -- Engineering estimate: 12 Hz below linear midpoint
- `sag_min_span_ms: 150` -- Minimum span for audible sag
- Both have full citations to Pierrehumbert 1980 and Ladd 2008

### 4. Implemented applySaggingTransitions()
Pure function that:
1. Collects indices of H* accent points in the contour
2. For each consecutive H*-H* pair, checks:
   - Span >= minSpanMs (default 150ms)
   - No phrase boundary between them (checks for `f0_boundary_low`, `f0_boundary_rise`, `f0_register_reset` tags)
3. Inserts 3 sag points at t=0.25, t=0.50, t=0.75 using the parabolic model:
   `f0_sag(t) = f0_linear(t) - sagDepthHz * 4 * t * (1-t)`
4. Returns merged + sorted contour

Sag amounts at the three sample points:
- t=0.25: `sagDepthHz * 0.75` (75% of max sag)
- t=0.50: `sagDepthHz * 1.0` (full sag at midpoint)
- t=0.75: `sagDepthHz * 0.75` (75% of max sag)

### 5. Pipeline Wiring
- Extended `AssembleTrackOptions` with `sagDepthHz?` and `sagMinSpanMs?`
- In `assembleKlattTrack()`: calls `applySaggingTransitions()` after `buildF0ContourFromDeclarative()` and before the phone frame loop
- In `tts-frontend.ts`: reads `sag_depth_hz` and `sag_min_span_ms` from `QLATT_V12_CEL_RULEPACK.parameters.policy.f0` and passes them through

### 6. Updated Snapshots and Golden Files
- Regenerated `test/__snapshots__/tts-frontend-snapshot.test.ts.snap` (F0 values changed)
- Regenerated `test/golden/declarative-corpus-summary.json` (F0 metrics changed)

## Parameter Values

| Parameter | Value | Citations |
|-----------|-------|-----------|
| `sag_depth_hz` | 12 Hz | Pierrehumbert 1980, Ladd 2008, Engineering estimate |
| `sag_min_span_ms` | 150 ms | Pierrehumbert 1980, Engineering estimate |

## Test Results

16 tests pass in `test/sagging-transitions.test.ts`:

**applySaggingTransitions (9 tests):**
1. Inserts sag points between two H* accents at midpoint
2. Inserts three sag points at t=0.25, t=0.50, t=0.75
3. Does NOT insert sag between H* and L*
4. Does NOT insert sag across phrase boundaries (f0_boundary_low)
5. Does NOT insert sag when accents are too close together (<150ms)
6. Handles multiple consecutive H* pairs (three H* = two sag regions)
7. Returns copy of contour when sagDepthHz is zero
8. Returns copy of contour when fewer than two H* accents
9. Result is sorted by time after sag insertion
10. Does NOT sag across f0_register_reset boundary

**buildF0ContourFromDeclarative tag propagation (5 tests):**
11. Propagates f0_h_star tag and derives accentType H*
12. Propagates f0_l_star tag and derives accentType L*
13. Propagates other tags without accentType
14. Points without tag have no tag or accentType
15. Dedup preserves tag from winning (last) point

**Integration (1 test):**
16. F0 at midpoint between accent peaks is below linear interpolation

Full suite: 665 passed, 5 failed (all pre-existing -- jmespath-resolver, audit-dictionary x2, rulepack-shape, schema, dental-fricatives).

## Deviations from Prompt

None. All instructions followed as specified:
- Symmetric parabolic model (not asymmetric)
- H*-H* pairs only
- Minimum span 150ms
- 12 Hz depth
- Post-processing pure function approach
- getF0AtTime() left unchanged
- prosody.yaml left unchanged

## Files Modified

- `src/track-assembler.ts` -- Extended F0Point, tag propagation, applySaggingTransitions(), pipeline wiring
- `src/tts-frontend.ts` -- Read sag policy params, pass to assembleKlattTrack()
- `public/rules/frontend.yaml` -- Added sag_depth_hz and sag_min_span_ms under params.policy.f0
- `test/sagging-transitions.test.ts` -- New test file (16 tests)
- `test/__snapshots__/tts-frontend-snapshot.test.ts.snap` -- Updated snapshot
- `test/golden/declarative-corpus-summary.json` -- Regenerated golden data

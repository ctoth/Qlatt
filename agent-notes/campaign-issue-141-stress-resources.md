# Goal

Move stress-policy and phonotactics acquisition into the existing frontend
resource owner, with parsed context passed through pronunciation (#141).

# State

Fresh isolated branch from origin/master 0a6045ac. Implementation and caller
adaptations complete; owned diff inspected, preparing hosted CI/Claude publication.

# Decisions and why

- Estimate: 120–180 production additions / 70–100 removals plus 100–170 existing
  fixture/caller lines. No new cache, framework, loader wrapper or guard.
- Existing requireAsset callback reads stress raw data, acquires its declared
  phonotactics through the same cache, parses and stores one stress composite.
- Morphology's phonotactics is separately acquired; do not substitute stress's
  document merely because bundled paths currently match.
- Stress and syllabification become parse/data-only. Morphology retains its raw
  document loader for later work, but receives phonotactics explicitly through
  allomorph and recursive calls. DECtalk's compiled-table early return stays.
- Explicit transcription overrides become parsed stress and morphology context
  overrides rather than silently retaining unused path-only options. Preserve
  source paths in those contexts and transport actual callers explicitly.
- Existing parser/input/resource tests retain validation evidence. Hosted CI
  owns checks; no local CI duplication. #141 stays open.

# Surprises

Nested requireAsset acquisition initially hid the existing dependency name in
its outer error. Existing g2p-resources fixtures require that name; preserve
already-contextual E_FRONTEND_CONFIG errors rather than rewrapping them.
Policy parse failures retain E_STRESS_POLICY in the resource owner's cause.
Supervisor independently checked the dependency-context correction against the
existing g2p-resources fixture before publication.
The stress composite is cached once, while morphology keeps its own declared
phonotactics. Existing fixtures now exercise this separation, repeat loading,
explicit parsed overrides and incompatible parser input. No local CI has run.

# Next step

Commit/push and publish for hosted CI and Claude; respond to actual results.
Supervisor owns merge/cleanup. Raw morphology and LTS acquisition remain out of
scope, as does removing DECtalk's temporary required shared resource declarations.

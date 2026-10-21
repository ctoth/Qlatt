# Goal

Remove track-analysis import-time baseline reference loading and select its
three existing display thresholds from experiment semantics (#210/#141 slice).

# State

Fresh isolated branch from origin/master 23842f68. Implementation and owned diff
inspection complete; preparing PR publication for hosted CI and Claude review.

# Decisions and why

- Smallest change: 35–60 production additions, roughly 15 removals, 30–45 YAML
  lines and 40–70 existing fixture lines. No new loader, framework or guard.
- Stop analysis requires its existing reference document explicitly. The only
  callers are existing conformance fixtures, which already load that document.
- Optional semantics.analysis holds the three existing value+basis thresholds.
  Existing semantics inheritance and display wiring carry selected policy.
- Baseline, klsyn88 and Beauty declare retained engineering estimates; baseline
  children inherit. Missing policy yields explicit unavailable display status.
- DECtalk-VTM does declare Klatt compatibility parameters, including AF. My
  earlier absence claim came from reading only its parameter prefix. Its sole
  OUT_T0 realization, not parameter absence, supports leaving gain policy absent.
- Preserve arithmetic and all other analyzers. #210 remains open for shared
  classification, silence, modes and other warning policy; #141 also remains open.
- Update directly affected existing fixtures, including selected thresholds,
  inherited policy and missing-policy display. Hosted CI only.

# Surprises

The selected gain parameter is parallelScale, not the display fixture's older
parallelGainScale spelling. The new threshold fixture uses the declared
parallelScale parameter and GO=0 so the unchanged low-gain branch is exercised.
No local CI has run. Production delta is smaller than estimated: 20 additions
and 14 removals, plus the YAML relocation and existing regression fixtures.

# Next step

Commit/push and publish for Claude and hosted CI.
Supervisor owns merge; other agents' work must remain intact.

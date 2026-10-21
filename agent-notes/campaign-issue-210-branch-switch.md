# Goal
Move #210's branch-switch track counts to selected analysis declarations and remove unsupported parallel-activity claims.

# State
PR #395 implementation and existing regressions complete. Claude reviewed the complete nine-file fb64e26e range in two passes with no findings; implementer accepts that review. No local tests or CI run.

# Decisions and why
Smallest change: about 25–40 production additions and 35–50 removals, 8–10 YAML lines, 35–50 existing-test lines. Baseline and Beauty declare branch_switch param/value/citations. Klsyn88 and VTM have no switch policy. Rename the existing summary to summarizeBranchSwitch, retaining event counts and positive-duration weighting for finite observations; label nonmatching finite values accurately. Delete the fixed amplitude-list count and its cascade-only warning: parallel frication flows independently of SW in the baseline graph. No new registry, evaluator, framework, or audio behavior.

# Surprises
Old swOff included every finite value other than 1, although its display claimed SW=0. Absent and nonfinite switch fields stay unclassified; no zero/default observation is invented. Dead unrelated helpers remain out of scope.

Actual change remains bounded: about 40 production additions/40 removals, 10 YAML lines and 50 regression lines. Existing summarizeParallel is renamed in place with no alias; both actual callers use the selected policy. Regressions cover unchanged SW control behavior, renamed parameter/value, unequal interval lengths, absent/nonfinite observations, inherited declarations, absent klsyn88/VTM policy, and selected display labels. Removed the parallelEvents amplitude-list inference and its harness warning; configured tap measurements remain unchanged.

# Next step
Hosted quality job 119129445296 rejected the single-line harness ternary formatting. Applied its multiline reflow without changing behavior; push for replacement CI. Supervisor owns merge and final #210 acceptance assessment; preserve other agents' work.

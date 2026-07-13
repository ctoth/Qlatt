# Rule Ugliness Scout

Survey of `public/rules/frontends/qlatt-english/` for patterns that beg
for a higher-level declarative construct.  Engine constraints checked
against `src/declarative-frontend/engine.ts`.

## Engine capabilities (what already exists, often unused)

- `predicates:` library is fully wired (`engine.ts:926-940`).  Condition
  objects of the form `{ predicate: "name" }` resolve against the
  pipeline's `predicates:` block.  `pipeline.yaml:2-4` defines just TWO
  predicates today — every duplicated `where:` fragment below is a
  predicate that was never written.
- Structured condition objects (`expr`, `all`, `any`, `not`,
  `predicate`) are supported (`engine.ts:911-965`) — but essentially
  every rule uses giant single-line CEL strings instead.
- `dispatch:` with `when:` ladders is built in.  What's missing is a
  way to share one dispatch ladder across multiple effect fields.
- `look_back_pred`, `look_ahead_pred`, `look_back_where` exist
  (`engine.ts:1014-1038`) and accept predicate names.
- Custom navigation functions live in `engine.ts:1040-1157`
  (`count_word_vowels`, `cluster_position_in_word`) — confirms the
  project happily adds domain-aware helpers in code; the same shape
  works for adding `is_coda`, `is_word_initial`, `phrase_position`.
- There is NO rule-template / parametric-rule / for-each-field
  mechanism in the engine.  That would be a new schema feature.

## TOP 5 constructs (biggest cleanup-per-effort)

1. **`predicates:` library, actually used** — already supported.
   Roughly 30+ duplicated `where:` fragments collapse to named
   predicates.  Zero engine work, hundreds of lines saved.
2. **`for_each_field:` parametric effect (new schema)** — collapses
   `burst_spectral_template` (formant.yaml:370-480, ~110 lines, 10x4
   copy-paste) and `weak_stop_release_parallel_attenuation`
   (formant.yaml:481-526, ~46 lines, 10x identical effect) to under 30
   lines combined.  Requires modest engine work in
   `applyEffectToToken`.
3. **Table-driven ToBI accent rule (new schema or generated rule
   pack)** — `prosody.yaml:65-429` contains 14 accent rules that
   differ only by `accentType` literal and per-accent (anchor,
   target-height, downstep-yes/no) tuple.  An `accent_targets:` table
   plus a single `tobi_accent` rule collapses ~360 lines to ~80.
4. **Place-of-articulation locus table + one parametric locus rule**
   — `formant.yaml:3-126` (k/bilabial/alveolar) has 6 rules with
   identical structure differing by phoneme set and 2 policy keys.
   Collapses to ~30 lines.
5. **Syllable / coda / boundary domain primitives** — kills the
   duplicated `is_coda` define block in two rules
   (`formant.yaml:308-311`, `336-339`), collapses
   `pre_boundary_lengthening`'s 86-line manual ahead-scan
   (`duration.yaml:179-265`) to one expression, and replaces all the
   "same-word window" gymnastics throughout duration.yaml.  Highest
   engine cost (new domain object / function), highest cleanup payoff
   long-term.

---

## Finding 1: `predicates:` library is supported but under-used

**Where:** `pipeline.yaml:2-4` currently defines two predicates.
**Engine support:** `engine.ts:926-940` (already there).

### 1a. Pausable-consonant set duplicated 4x in `duration.yaml`

`current.type in ['stop_closure', 'fricative', 'nasal', 'liquid', 'glide', 'affricate']`
appears at:
- `duration.yaml:8` (`non_word_initial_consonant_shortening`)
- `duration.yaml:22` (`word_medial_consonant_shortening`)
- `duration.yaml:37` (`unstressed_consonant_shortening`)
- `duration.yaml:51` (`word_initial_lengthening`)

A subtly different sonorant list appears at `duration.yaml:178`
(`pre_boundary_lengthening`: `current.type == 'vowel' || ... prev.type == 'vowel' || prev.type == 'nasal' || prev.type == 'liquid' || prev.type == 'glide'`).

**Proposed:** predicates in `pipeline.yaml`:
```yaml
predicates:
  is_pausable_consonant: >-
    current.type in ['stop_closure', 'fricative', 'nasal', 'liquid', 'glide', 'affricate']
  is_sonorant: current.type in ['nasal', 'liquid', 'glide']
  is_vowel_or_sonorant: current.type == 'vowel' || current.type in ['nasal', 'liquid', 'glide']
```
Rules then use `where: { predicate: is_pausable_consonant }` (and a
small refactor for the mixed `current/prev` versions).
**Payoff:** ~12 lines of duplicated CEL collapse to 4 single-line
selects + one predicate definition.

### 1b. Same-word check duplicated ~20x

`(has(prev.word) && has(current.word) ? prev.word == current.word : false)` and
its `!=` variant appear in nearly every duration and postlexical rule:
`duration.yaml:9, 23, 52, 187, 192-211, 220-246`;
`postlexical.yaml:9, 18, 111-114, 147, 173, 200-203, 286, 308`;
`formant.yaml:311, 339`.

**Proposed:**
```yaml
predicates:
  prev_same_word: has(prev.word) && has(current.word) && prev.word == current.word
  next_same_word: has(next.word) && has(current.word) && next.word == current.word
  prev_diff_word: prev == null || (has(prev.word) && has(current.word) && prev.word != current.word)
```
**Payoff:** kills ~20 verbose ternaries; one canonical truth for
"word boundary."

### 1c. Coda predicate duplicated verbatim across allophony rules

`formant.yaml:308-311` (`dark_l_allophony`) and `formant.yaml:336-339`
(`r_f3_lowering`) contain the *exact same* `define: is_coda:` block:
```yaml
is_coda: >-
  n == null || n.phoneme == 'SIL' || n.type in ['stop', 'stop_closure', 'fricative', 'nasal', 'affricate'] ||
  (has(n.word) && has(current.word) && n.word != current.word)
```
**Proposed:** `predicates: is_coda: ...` (or a true syllable-domain;
see Finding 6).  **Payoff:** ~8 lines × 2 collapse to one predicate.

### 1d. Coronal-context defines duplicated

`formant.yaml:660-667` (`schwa_coronal_fronting`) and
`formant.yaml:689-696` (`uw_coronal_fronting`) duplicate
`prev_coronal / next_coronal / both_coronal / one_coronal` defines.
**Proposed:** predicates `prev_coronal`, `next_coronal`, `both_coronal`,
`one_coronal`.  **Payoff:** ~16 lines collapse to 4 predicate defs.

### 1e. Voicing/place feature checks repeated

`(has(current.bilabial) && current.bilabial == true)` and variants for
`alveolar/velar/voiced/voiceless` recur dozens of times in
`formant.yaml:360-474` and `prosody.yaml:642-672`.

**Proposed:** predicates `is_bilabial`, `is_alveolar`, `is_velar`,
`is_voiced`, `is_voiceless`, `is_back_vowel`, `is_front_vowel`,
`is_high_vowel`.  These are bedrock phonetic categories — they should
not be inlined as `has(x.foo) && x.foo == true` 50 times.

---

## Finding 2: Repeated effect-block over a list of fields — wants `for_each_field:`

### 2a. `burst_spectral_template` (formant.yaml:370-480)

TEN sequential effect blocks, one each for `params.A1`..`params.A10`,
identical 3-arm dispatch (bilabial/alveolar/velar) plus a fallback
that reads `current.params.A<n>`.  111 lines of pure copy-paste.

Policy keys follow the strict pattern
`policy.formant.burst_a<n>_<place>` (confirmed: 27 such keys at
`frontend.yaml:552-...` per grep), so a templated effect is fully
mechanical.

**Proposed schema:**
```yaml
- for_each_field: [A2, A3, A4, A5, A6, A7, A8, A9, A10]
  field: "params.{field}"
  op: set
  dispatch:
    - when: is_bilabial
      value: "params.policy.formant.burst_{field_lower}_bilabial"
    - when: is_alveolar
      value: "params.policy.formant.burst_{field_lower}_alveolar"
    - when: is_velar
      value: "params.policy.formant.burst_{field_lower}_velar"
    - default: "has(current.?params.{field}) ? current.params.{field} : 0"
  tag: burst_spectrum
```
**Payoff:** ~110 lines → ~12 lines. Engine work: small template
expansion at rule-load time.

### 2b. `weak_stop_release_parallel_attenuation` (formant.yaml:481-526)

TEN copies of:
```yaml
- field: params.A<n>
  op: add
  value: -18
  tag: weak_release_spectrum
```
**Proposed:** same `for_each_field: [A1..A10]`.
**Payoff:** 46 lines → 6 lines.

### 2c. `t_deletion` / `d_deletion` (postlexical.yaml:115-138, 204-225)

Two rules with identical effect bodies (zero out `duration`,
`inherentDuration`, `params.AV`, `params.AF`, `params.AH`), only the
`select` phoneme differs.  Plus a `for_each_field` over `[duration,
inherentDuration, params.AV, params.AF, params.AH]` with op `set`
value `0` would collapse the 5-effect block per rule.  Better still:
parametric rule by phoneme (see Finding 7).

---

## Finding 3: Table-driven rule wanted — ToBI accents

**Where:** `prosody.yaml:65-429`.

14 rules
(`tobi_accent_h_star`, `_h_star_plus_l_peak`, `_h_star_plus_l_tail`,
`_l_plus_h_star_lead`, `_l_plus_h_star_peak`,
`_h_plus_downstepped_h_star_lead`, `_h_plus_downstepped_h_star_peak`,
`_h_star_plus_h_peak`, `_h_star_plus_h_tail`,
`_h_plus_l_star_lead`, `_h_plus_l_star_peak`, `_l_star`,
`_l_star_plus_h_trailing`).

Each rule's `where:` is the SAME 7-line check (accented stressed vowel
with non-zero AV/AVS) except for the `accentType ==` literal
(prosody.yaml:69-74, 104-109, 136-141, 159-164, 184-189, 217-222,
245-250, 277-282, 309-314, 337-342, 365-370, 388-393, 412-417).

Most rules' `define:` are identical:
```yaml
accent_idx: "has(current.accentIndexInPhrase) && current.accentIndexInPhrase >= 0 ? current.accentIndexInPhrase : 0"
downstep_factor: ...pow(params.policy.f0.downstep_k, accent_idx)
raw_height: params.policy.f0.h_star_height * downstep_factor
clamped_height: max([raw_height, params.policy.f0.downstep_floor_fraction])
target_hz: params.policy.f0.base_hz + params.policy.f0.range_hz * clamped_height
```
verbatim at lines 76-84, 110-119, 191-199, 252-260, 283-292, etc.

The genuinely varying axes are:
- `accentType` literal
- anchor (`at_ratio(current, 0.45)` vs `at_sync(current.sync_left)` vs `at_sync(current.sync_right)`)
- which height policy key (`h_star_height` / `l_star_height` /
  `boundary_h_pct_fraction`)
- whether to apply downstep
- whether nuclear-accent suppresses downstep (only `h_star` does)

**Proposed schema:**
```yaml
accent_targets:
  H*:    [{anchor: at_ratio_0.45, height: h_star_height, downstep: true, nuclear_no_downstep: true}]
  H*+L:  [{anchor: at_ratio_0.45, height: h_star_height, downstep: true, nuclear_no_downstep: true},
          {anchor: sync_right,    height: l_star_height, downstep: false}]
  L+H*:  [{anchor: sync_left,     height: l_star_height, downstep: false},
          {anchor: at_ratio_0.45, height: h_star_height, downstep: true}]
  H+!H*: [{anchor: sync_left, value: prev_or_floor_h},
          {anchor: at_ratio_0.45, height: h_star_height, downstep: true}]
  ...
rules:
  tobi_accent:
    kind: point
    select: { stream: phone, where: { predicate: is_voiced_accent_stressed_vowel } }
    for_each: "accent_targets[current.accentType]"
    insert_point:
      stream: f0
      at: "$each.anchor"
      value: "$each.height_expr"   # computed from height + downstep + nuclear_no_downstep
      tag: "'f0_' + current.accentType"
```
**Payoff:** ~360 lines → ~60-80. Phrase accent / boundary rules
(`tobi_phrase_accent_high/low`, `tobi_boundary_low/rise`,
prosody.yaml:462-556) fold into the same table.

---

## Finding 4: Place-of-articulation locus rules (formant.yaml:3-126)

Six rules:
- `k_context_cl_f2` (lines 3-23)
- `k_context_rel_copy` (lines 24-35)
- `bilabial_f2_locus` (lines 36-60)
- `bilabial_rel_copy` (lines 61-73)
- `alveolar_f2_locus` (lines 74-97)
- `alveolar_rel_copy` (lines 98-110)
- (`palatal_f2_locus` (lines 111-126) is a degenerate version)

The `_f2_locus` rules share the structure: detect closure phoneme set →
pick the post-release vowel via a `cand:` define that skips the
`_REL` token (lines 9, 42-44, 80-82) → dispatch on vowel features.

The `_rel_copy` rules all do the same: copy the previous closure's F2
onto the release.

**Proposed:** an inventory-side `place_loci:` table:
```yaml
place_loci:
  velar:    { closure_set: [K_CL], release_set: [K_REL], locus_front: ..., locus_back: ..., locus_default: ... }
  bilabial: { closure_set: [P_CL, B_CL, M], release_set: [P_REL, B_REL], ... }
  alveolar: { closure_set: [T_CL, D_CL, N], release_set: [T_REL, D_REL], ... }
```
Plus two parametric rules `<place>_f2_locus` and `<place>_rel_copy`
that iterate over the table.  Could be implemented either as a
template feature or as a code-generated rule pack.
**Payoff:** ~120 lines → ~40.

---

## Finding 5: Inline numeric tables in `value:` expressions

### 5a. Stress-conditioned multipliers (`duration.yaml:85-87`)
```
has(current.stress) && current.stress == 1 ? params.policy.duration.stress_primary_multiplier :
((has(current.stress) && current.stress == 0) ? params.policy.duration.stress_unstressed_multiplier : 1.0)
```
A 3-row table pretending to be an expression.  Wants:
```yaml
dispatch:
  - when: "current.stress == 1": params.policy.duration.stress_primary_multiplier
  - when: "current.stress == 0": params.policy.duration.stress_unstressed_multiplier
  - default: 1.0
```
or, cleaner, a `cases: by: current.stress` table.

### 5b. Punctuation-keyed durations (`duration.yaml:68-72`)

`current.punctuationSymbol == ',' ? ... : (current.punctuationSymbol in [';', ':'] ? ... : ...)`
— wants `cases: by: current.punctuationSymbol`.

### 5c. Continuation rise by punctuation (`prosody.yaml:706-707`)
`current.punctuationSymbol == ',' ? continuation_rise_hz : continuation_minor_rise_hz`
— same pattern.

### 5d. Fricative-class floors (`duration.yaml:296-313`)

Four-way dispatch on phoneme groups [S/Z/SH/ZH] / [F/V] / [TH/DH] /
[HH], each setting a class-specific floor.  Wants a per-phoneme
`fricative_min_ms` field in inventory, plus a single rule:
`if current.duration < inventory.fricative_min_ms set it to that`.

### 5e. Aspiration frication carryover by place (`duration.yaml:377-381`)

Three-way ternary on `alveolar/velar/bilabial`.  Same shape as the
burst template (see Finding 2a) — wants the same per-place table.

### 5f. VOT targets by phoneme (`structural.yaml:184-189, 263-268`)

Nested ternary picking VOT from `policy.duration.vot_target_ms.initial.{p,t,k}`
or `.noninitial.{p,t,k}` — the policy is already a table, but the
*lookup* is hand-coded as a ternary.  Wants `params.policy.duration.vot_target_ms[word_initial ? 'initial' : 'noninitial'][lc(current.phoneme.split('_')[0])]` or simpler — a `lookup` helper function.

### 5g. Nasal place index (`formant.yaml:135-142`)
```
- when: current.phoneme == 'M': 1
- when: current.phoneme == 'N': 2
- when: current.phoneme == 'NG': 3
- default: 0
```
Pure phoneme→integer lookup.  Belongs in inventory as
`nasalPlaceIndex` per nasal phoneme.

---

## Finding 6: Syllable / boundary domain primitives missing

### 6a. `pre_boundary_lengthening` (`duration.yaml:172-287`)

86 lines of hand-coded `ahead(current, 1..6)` plus parallel
`a1_word/a2_word/.../a6_word` checks, plus `sil_bi_1..sil_bi_6` sentinel
ladder, all to express:

> "find the next prosodic break-index within the same word, or 0 if
> the search escapes the word."

This is the worst single rule in the corpus.  Five duplicated
`a<n>_word == same_word_check` chains, six `sil_bi_<n>` sentinel
computations, manual `-1` propagation, and a final 6-way OR-cascade
(`ahead_bi:` lines 248-254) to take the first nonzero.

**Proposed primitives (engine work needed):**
- `current.next_boundary` → returns the nearest forthcoming SIL/break
  token within the same word, or null.
- `current.syllable` / `.syllable.position` / `.syllable.is_final` — a
  syllable domain object with phoneme membership.
- `find_within_word(current, predicate)` — scan ahead/behind, stopping
  at word boundary.

The complex "is in final-syllable rhyme" computation
(`same_word_vowel_after_nonvowel:` lines 192-211) is a textbook
syllable-domain query (`current.syllable.is_final && current.is_in_rhyme`).

**Payoff:** ~86-line rule shrinks to ~15 lines.

### 6b. Word-position queries done by token counting

`prev != null ? (prev.word == current.word ? ... : ...)` and friends
are everywhere (see Finding 1b).  These all want a `current.position`
or `current.word.is_initial / is_final` accessor.

### 6c. `spelling_mode_letter_names` (`orthography.yaml`)

Worst case of disjunctive list misuse in the corpus.  The 26-letter
list `['a','b','c',...,'z']` is written out **four times verbatim**
(lines 11, 16-17, 20-21, 26-27, 30-31, 36-37, 40-41).  Then a
26-arm ternary chain at lines 46-58 picks `LETTER_X`.

**Proposed:** a `phoneme_sets:` (or `string_sets:`) block:
```yaml
phoneme_sets:
  ascii_letter: ['a','b','c',...,'z']
```
plus a string-key map for the LETTER_* lookup:
```yaml
maps:
  letter_to_pronunciation:
    a: LETTER_A
    b: LETTER_B
    ...
```
referenced as `current.word in sets.ascii_letter` and
`maps.letter_to_pronunciation[current.word]`.
**Payoff:** ~50 lines → ~10.

---

## Finding 7: Phoneme-parameterized stop-release rules (`structural.yaml`)

`insert_voiceless_stop_release_and_aspiration` (lines 166-247) and
`_final` (lines 248-304) plus `insert_voiced_stop_release` (lines
305-352) and `_final` (lines 353-383) are FOUR rules.  Within each
pair, the only difference is `next == null` vs `next != null`.
Within voiceless/voiced, the only difference is `_ASP` insertion and
the closure phoneme set.

The phoneme remapping `P_CL → P_REL, P_ASP` is a manual ternary
chain (lines 174-175, 254-255, 313, 359).

**Proposed:** a `phoneme_release_map:` table:
```yaml
phoneme_release_map:
  P_CL: {release: P_REL, aspiration: P_ASP, voicing: voiceless, place: bilabial}
  T_CL: {release: T_REL, aspiration: T_ASP, voicing: voiceless, place: alveolar}
  ...
  B_CL: {release: B_REL, voicing: voiced, place: bilabial}
  ...
```
plus ONE rule (or two — final / non-final) that consults the map.
**Payoff:** ~220 lines → ~80-100.

---

## Finding 8: ToBI accent `where:` patterns and feature-list copies

The 14 accent rules in prosody.yaml all share the same 7-line `where:`
prefix:
```
has(current.isAccented) && current.isAccented == true && current.stress == 1
&& has(current.accentType) && current.accentType == '<X>'
&& current.params != null
&& ((has(current.params.AV) && current.params.AV > 0)
    || (has(current.params.AVS) && current.params.AVS > 0))
```
Even before introducing the accent-table (Finding 3), a single
predicate `is_voiced_accent_stressed_vowel` would collapse the shared
prefix, with only the `accentType ==` literal varying per rule.

Repeated `(prev.type in ['stop_release','stop_aspiration']` voicing
trigger at `prosody.yaml:642-647` and `670-673` wants a predicate
`prev_is_voiceless_obstruent_release`.

---

## Finding 9: `frontend.yaml` policy mirror

`frontend.yaml` contains 27 distinct `burst_a<n>_<place>` policy keys
(grep count) for the `burst_spectral_template` rule.  Adding a
`for_each_field` (Finding 2a) without also reshaping the policy keys
to a `burst_table[n][place]` structure leaves the ugliness only half-
eaten.  Recommend the same construct on the policy side: a `tables:`
schema or simply nested maps `policy.formant.burst_amplitudes[A2].bilabial`.

---

## Compliance notes (not ugliness, but logged for the AGENTS.md
citation rule)

Every rule scanned has a `citations:` block — no compliance gaps
found in the rule YAMLs.  Several `citations:` entries are tagged
explicitly as "Engineering estimate:" (e.g. `duration.yaml:76, 318,
392-393, 435; formant.yaml:531, 552; prosody.yaml:660, 685, 715, 785;
structural.yaml`) which complies with the
"label engineering estimates" guidance in AGENTS.md.

`tag:` field appears on essentially all apply/dispatch ops in
duration / formant / prosody.  No misuse spotted.

The two existing predicates in `pipeline.yaml` are used: a search for
`look_ahead_pred(current, 20, 'is_stressed_vowel')` confirms
`is_stressed_vowel` is consumed (`prosody.yaml:603`).
`is_question_boundary` does not appear in any `predicate:`-form
condition — defined but unused.

---

## Approximate total payoff

Rough line-saving estimates if all Top-5 constructs land:

| Construct | Lines saved |
|-----------|-------------|
| Predicates library actually used | ~150 |
| `for_each_field:` | ~150 |
| Table-driven ToBI accent | ~280 |
| Place-locus table + parametric rules | ~80 |
| Syllable/boundary primitives | ~100 |
| Phoneme-parameterized stop release | ~120 |
| Inline-table → `cases:`/inventory lookup | ~80 |
| `spelling_mode_letter_names` rewrite | ~50 |

Total: ~1000 lines of churn collapse, on a corpus of ~3000 rule-YAML
lines (excluding lts-rules.yaml and inventory.yaml).  Conservatively
a 1/3 reduction in the rule corpus is reachable, while improving the
ability to author new accents/places/phoneme classes by editing
tables instead of duplicating rules.

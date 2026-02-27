# G2P Phase 6 - Postlexical Rules Report

## Summary
Phase 6 is implemented in the current workspace state.

Implemented items:
- Added `postlexical` phase in `public/rules/frontend.yaml`.
- Added two postlexical rules:
  - `"the" reduction` (`the_prevocalic_reduction`): `AH0 -> IH0` before a vowel-initial following word.
  - `/t/ flapping` (`t_flapping`): `T_CL -> DX` between stressed and unstressed vowels.
- Added `DX` target in `public/rules/inventory.yaml`.
- Added postlexical tests in `test/g2p-postlexical.test.ts`.

## Exact YAML Added

From `public/rules/frontend.yaml`:

```yaml
phases:
  - name: postlexical
    rules:
      - the_prevocalic_reduction
      - t_flapping
```

```yaml
the_prevocalic_reduction:
  kind: postlexical
  citation: Miller 1998, Pronunciation Modeling in Speech Synthesis (postlexical rule inventory)
  select:
    stream: phone
    where: >-
      current.phoneme == 'AH0'
      && (has(current.word) ? current.word == 'the' : false)
      && next != null
      && (has(next.word) ? next.word != 'the' : false)
      && next.type == 'vowel'
  splice:
    type: replace_range
    range_left: current.sync_left
    range_right: current.sync_right
    insert:
      - copy_from: current
        copy_fields:
          - stress
          - word
          - params
          - duration
          - inherentDuration
          - type
        phoneme: '"IH0"'
```

```yaml
t_flapping:
  kind: postlexical
  citation: Miller 1998, Pronunciation Modeling in Speech Synthesis (postlexical rule inventory)
  select:
    stream: phone
    where: >-
      current.phoneme == 'T_CL'
      && prev != null && prev.type == 'vowel'
      && (has(prev.stress) ? prev.stress == 1 : false)
      && next != null && next.type == 'vowel'
      && (has(next.stress) ? next.stress == 0 : false)
  define:
    dx_target: target("DX")
    dx_params: dx_target.params
  splice:
    type: replace_range
    range_left: current.sync_left
    range_right: current.sync_right
    insert:
      - copy_from: current
        copy_fields:
          - stress
          - word
        phoneme: '"DX"'
        type: '"flap"'
        duration: '30'
        inherentDuration: '30'
        params: dx_params
```

From `public/rules/inventory.yaml`:

```yaml
DX:
  F1: 300
  F2: 1600
  F3: 2600
  B1: 100
  B2: 100
  B3: 170
  AV: 55
  AF: 0
  AH: 0
  AVS: -70
  dur: 30
  type: flap
  voiced: true
  alveolar: true
```

## Test Results

Executed and observed:

1. `npm run test -- test/g2p-postlexical.test.ts`
- Result: PASS
- `7 passed (7)`

2. `npm run test -- test/declarative-frontend-integration-phases.test.ts`
- Result: PASS
- `1 passed (1)`

3. `npx vitest run`
- Result: FAIL (unrelated failures outside Phase 6 scope)
- `2 failed | 55 passed (57)` test files
- Failing tests:
  - `test/declarative-frontend-slice.test.ts` (`materializes inserted release targets during structural phase`)
  - `test/declarative-frontend-rulepack-context.test.ts` (`darkens /L/ in coda position (before silence)`)

## Rule Engine Limitations
No rule-engine limitation blocked implementation of these two postlexical rules.

## Commit Hash
`1aa8f01` - `feat: add postlexical rules - 'the' reduction and /t/ flapping`

# Frame rules

A rule of kind `frame` is a guarded assignment to a named register, run once
for every control frame of the utterance. The frame rules of one program run
together, in the order their phase lists them, and what they leave in the
registers is sampled into track columns every frame.

Use them for a parameter that depends on its own past: a value that moves a
fraction of the remaining distance toward a target each frame, a counter that
steps while a condition holds, a flag one phone sets and the next clears. A
Segment target with a transition cannot express that. Everything else (a
target, a duration, an F0 command) stays a `scalar`, `point` or `f0_layer`
rule.

Code: `src/declarative-frontend/hrg/frame-program.ts` (the machine),
`runFrameRules` in `hrg/rule-engine.ts` (units, transactions),
`validateFramePrograms` in `validation.ts`, `applyFrameValues` in
`hrg/lowering.ts`. Tests: `test/hrg-frame-program.test.ts`.

## Declaring a program

```yaml
frame_programs:
  tank:
    relation: Segment              # the Items the frames run over, in order
    unit: "current.valve != 'pipe'" # Items that start a unit
    frame_ms: "params.policy.tank.frame_ms"
    lead_in_frames: "2"            # a silent unit before the first Item
    features:                      # read once per unit
      open:
        value: "current.valve == 'open'"
        edge: false                # value in the lead-in and beyond either end
    registers:                     # value before the first frame
      level: 0
      target: 0
    outputs:                       # sampled after the rules, every frame
      LEVEL: "r.level"
    write: tank_frames             # Segment feature that receives the columns
    tag: tank
    citations:
      - "..."
```

- A **unit** is the stretch of Items one set of features describes. The first
  Item starts a unit, and so does every Item `unit` accepts; any other Item
  extends the unit before it. Without `unit` every Item is its own unit.
- The frame clock starts at the first Item. A unit owns the frames between its
  two ends, each rounded to that clock; a unit that does not end on a frame is
  reported (`HRG_FRAME_DURATION_ROUNDED`). The Items inside a unit need not
  start on a frame: each gets the frames it overlaps.
- `unit`, `frame_ms`, `lead_in_frames` and each feature's `value` are ordinary
  rule-engine expressions: `current`, `prev`, `next`, navigation, predicates
  and `functions:` macros all work. `frame_ms` and `lead_in_frames` are read
  at the first Item.
- The **lead-in** is a unit of `lead_in_frames` frames before the first Item,
  with every feature at its `edge` value. It exists because lowering's initial
  silence is not a Segment.
- `delay_frames: N` (optional, default 0) shows every frame N frame periods
  after the instant it was computed for, for a controller that sends a word
  later than it computes it. The delay crosses Item boundaries: an Item's
  first frames are then the last ones of the Item before. The first instant
  holds the first frame, so a lead-in N frames longer than the initial silence
  puts its first frame exactly there.
- `tail_frames: <expression>` (optional) is read at each unit's last Item and
  makes that many of the unit's last frames a unit of their own, with every
  feature at its `edge` value like the lead-in: a pause inside one Item whose
  end belongs to what follows. The rules that assigned in a tail are listed on
  the unit's first Item with `tail: true`.
- `after: { COLUMN: number }` (optional) gives output columns a value for the
  instant the run ends, the track's last event: a gate that must fall, say.
  Columns it does not name keep no value there.
- Every output column must be listed in `output.lowering.columns`, and `write`
  must be a declared feature of the relation.

### Groups

A rule sometimes needs to know how much of something is still to come, a
clause's remaining frames for instance. A program may put its units in groups
and declare sums over each group, which are known before the group's first
frame:

```yaml
    group:
      start: "u.clause_initial"            # units that start a group
      totals:
        voiced_frames: "u.voiced ? f.count : 0"
```

The first unit starts a group, and so does every unit `start` accepts. `start`
and each total are frame expressions read once per unit, in unit order; they
may read the units, `params` and `f` (of which `f.count` is the useful one),
not `r`. A total may also read `g`, which at that point is the group as summed
so far: the units before this one, and this unit's totals declared above it.
That is how a sum stops at a marker ("frames before the first stop").
Rules and outputs read the finished group as `g`: `g.frame` and `g.frames`
(frame within the group from 0, frames in it), `g.unit` and `g.units`, and
each total by name.

## Writing a rule

```yaml
rules:
  tank_target_open:
    kind: frame
    program: tank
    unit: "u.open"                 # once per unit
    when: "f.index == 0"           # every frame of a unit that passed `unit`
    set:
      - register: target
        value: "params.policy.tank.fill"
        tag: tank
    citations:
      - "..."
```

`unit`, `when` and `value` are frame expressions: CEL over

| name | holds |
|------|-------|
| `u`, `p`, `n` | the features of this unit, the one before and the one after |
| `p2`, `p3`, `n2`, `n3` | the units two and three before and after; beyond either end, the `edge` values |
| `r` | the registers |
| `f.index`, `f.count` | frame within the unit from 0, frames in the unit |
| `f.unit`, `f.units` | unit number from 0 (the lead-in is 0 when there is one), units in the run |
| `f.frame`, `f.frames` | frame within the run from 0, frames in the run |
| `f.prev_count`, `f.next_count` | frames in the unit before and after, 0 when there is none |
| `f.prev2_count`, `f.next2_count`, `f.next3_count` | the same two before, two after and three after |
| `g` | the unit's group, when the program declares groups |
| `params` | rulepack parameters |

`unit` may not read `r` or `f`. Both conditions must be true or false, not a
number. The assignments of a rule run in order and later ones see earlier
ones. A register keeps the type it was declared with, and the machine never
resets one: a rule that wants a reset writes it. Integer arithmetic is written
out, for example `floor((r.target - r.level) / 4)` for an arithmetic shift
right by two.

A frame rule has no `select`, `match` or `apply`. All frame rules of a program
must be listed in one phase; that phase should come after the last rule that
changes a duration.

## What is checked at load

Citations on every rule and program; a declared tag on the program and on
every assignment; the relation, the written feature and the output columns;
the syntax and variables of every expression; every `u.`, `p.`, `n.`, `r.` and
`f.` member against the program's features, registers and the counters; every
`params` path; the one-phase rule.

## What the engine writes

For each unit, one transaction that writes the program's feature on every Item
of the unit:

```yaml
period_ms: 5
origin_ms: -10          # where columns[0] starts, from this Item's start
columns:
  LEVEL: [0, 0, 4, 6, 7]
fired:                  # on the unit's first Item
  - { rule: tank_target_open, first: 0, last: 0, count: 1, lead_in: false }
  - { rule: tank_approach, first: 0, last: 4, count: 5, lead_in: false }
```

`fired` lists each rule that assigned in the unit with the first and last unit
frame in which it did. The write's citations are the program's plus those of
every rule in `fired`, and its parents are the decisions behind each feature
the unit read. Provenance therefore grows with Items, not with frames or
rules: to ask why a column has its value at a frame, follow the frame's
provenance id to this write and read `fired` for the rules active at that
frame.

## What lowering does

Each frame of the feature is an event point. At an event inside an Item the
frame covering that instant overrides the Item's own value for each column;
the initial silence reads the first Item's lead-in frames. Frame values are
applied after Segment targets and transitions and before control windows.

## Cost

Features are read once per unit through the rule engine. `unit` is evaluated
once per rule per unit, and `when` and the assignments once per frame, in a
context of plain objects, which costs well under a microsecond per expression
where a rule-engine `select` costs tens. `scripts/measure-frontend-time.ts`
reports frontend time per second of speech.

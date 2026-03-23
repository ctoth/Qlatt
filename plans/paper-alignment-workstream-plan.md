# Plan: Paper Alignment Workstream

**Date:** 2026-03-15
**Status:** Draft, minimal-first

## 1. What We Are Actually Doing

Track divergences between:

1. the live implementation
2. the papers the implementation cites

The source of truth is already in the repo:

1. the rules
2. the semantics
3. the code
4. the paper collection
5. the existing citation strings
6. the existing paper resolver logic

We are **not** building a second metadata system unless a concrete working step proves it is necessary.

## 2. The Core Rule

Before building anything, ask:

1. What am I doing?
2. What does it require?
3. What is the minimum thing required to do it?
4. Which assumptions do I need to check before I act?
5. Can I make that minimum thing work right now?
6. Can I see it working, yes or no?

If the answer is not visible and testable, stop.
Do not assume. Check by running code.
Prefer an immutable test or equivalent executable proof.

## 3. The First Actual Deliverable

The first deliverable is a script.

That script should:

1. read the live rule files
2. extract rule names and `citations:`
3. resolve each citation to a paper directory using the existing resolver logic or equivalent local logic
4. print:
   1. resolved citations
   2. unresolved citations
   3. duplicate citation variants

That is the first brick because it proves:

1. what the repo currently cites
2. whether those citations point cleanly into `papers/`
3. where the first real cleanup work is

The script is not complete until it is run and its behavior is checked by a real test or equivalent executable proof.

## 4. The Second Deliverable

After the citation-resolution script works, pick one subsystem and track divergences for that subsystem only.

Start with `duration`.

Why:

1. it is heavily declarative already
2. it has paper-backed rules
3. it is small enough to inspect directly

The first divergence file should be minimal and hand-authored.

It should contain only judgment calls we cannot derive automatically, for example:

1. cited but wrong value
2. cited but only approximate implementation
3. paper-backed behavior missing
4. speech logic living in TS/Rust that should be declarative

Nothing else should be hand-maintained.

## 5. The Work Sequence

The sequence is:

1. build citation-resolution script
2. run it
3. prove it with a test or equivalent executable check
4. inspect output
5. choose one subsystem
6. write one small divergence file
7. use that file to drive one real fix
8. only then decide whether another layer is actually needed

If a proposed new file or abstraction does not directly help one of those steps, do not add it.

## 6. What We Are Not Doing Yet

Not yet:

1. no canonical paper database in-repo
2. no hand-built implementation-site registry
3. no claim ontology
4. no graph model
5. no repo-wide alignment platform
6. no general schema unless the first script and divergence file force one into existence

Those may become useful later, but they are not the first move.

## 7. Hard Parts

The hard parts are still real, but we deal with them only when the previous step makes them unavoidable.

## 7.1 Citation normalization

Different strings may refer to the same paper.

Handle this first with code and visible output, not with a hand-maintained paper registry.

## 7.2 Divergence judgment

A script can find citations.
A script cannot reliably decide whether an implementation truly matches a paper.

That judgment belongs in the divergence file.

## 7.3 Imperative speech logic

If speech-domain logic lives in TS or Rust, that is a smell.

But do not start by cataloging all of it.
Start by recording only the instances discovered while auditing the chosen subsystem.

## 8. Success Criteria

This workstream is succeeding when:

1. a tiny script reads live citations and resolves papers
2. that script is checked by a real executable proof
3. the output is visible and useful
4. one subsystem has a small divergence file
5. that file leads to one real implementation fix

Anything more abstract than that has to earn its existence.

## 9. Rules To Prevent This Failure Mode Again

## 9.1 No second source of truth

Do not create a registry of things that can already be derived from:

1. rule YAML
2. semantics YAML
3. source code
4. paper directories

unless a working script proves the derived approach is insufficient.

## 9.2 No schema before proof

Do not design a schema for hypothetical future needs before the first tiny workflow works.

## 9.3 No noun explosion

Do not invent objects like:

1. claim
2. impl site
3. alignment link
4. canonical paper entity

unless a concrete working step cannot proceed without them.

## 9.4 Hand-author only judgments

Manual data should be reserved for things automation cannot safely derive.

In this workstream, that mostly means divergences.

## 9.5 Every new layer must remove a real burden

Before adding a file, ask:

1. what exact manual pain does this remove?
2. what exact command or workflow will use it?
3. can I prove that immediately?

If not, do not add it.

## 10. Immediate Next Step

Write the smallest possible script under `scripts/` that:

1. scans the rule files
2. extracts citations
3. resolves them to papers
4. prints the result

Then add the smallest possible test or equivalent executable proof that shows the script actually works.

That is the next correct move.

## 11. Current Remediation Backlog

The workstream has moved past citation resolution and now has concrete implementation mismatches with executable proof.

These are the current tracked fixes for `qlatt-english`:

1. stop release and aspiration timing is being overwritten after structural insertion
2. pre-boundary lengthening is reaching onset material instead of staying in the final-syllable rhyme
3. stop VOT defaults are biased toward isolated-word values where the cited papers distinguish sentence and connected-speech conditions
4. `/l/` allophony targets and/or logic understate the light-dark contrast relative to cited ranges
5. the prosody inventory is labeled as ToBI while mixing original Pierrehumbert labels with later MAE-ToBI framing

We fix these in that order unless a direct blocker appears.

## 11.1 Current Status

### Fixed

1. stop release and aspiration timing now survives structural insertion for weak/final tokens
2. `/s/`-cluster aspiration reduction now survives on structurally inserted aspiration tokens
3. pre-boundary lengthening is restricted to the final-syllable rhyme instead of leaking into onset material and earlier syllables
4. voiceless stop VOT defaults now use connected-speech sentence values by position instead of isolated-word defaults
5. onset vs coda `/l/` targets now show a paper-backed light/dark contrast
6. the tune inventory is now described as Pierrehumbert-style rather than misdescribed as canonical ToBI

### Next

1. audit whether `/l/` should become gradient with pre-boundary rime duration rather than remain binary
2. audit whether weak/final stop release minima should vary by place now that connected-speech VOT defaults are in place
3. continue deeper paper-alignment passes beyond the initial five confirmed mismatches

## 12. Acceptance Checks For The Current Fixes

Each issue must be closed with an executable proof.

### 12.1 Stop release / aspiration overwrite

Need to prove:

1. weak/final stop releases survive the full duration phase
2. `/s/`-cluster aspiration reduction survives the full duration phase
3. connected-speech stop timing rules are not silently reset by a later lock rule

Preferred proof:

1. a focused test in `test/`
2. one command showing the output phone sequence for a phrase like `cap.` or `spa`

Current proof:

1. `npx vitest run test/declarative-frontend-slice.test.ts`
2. `node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/dump-track.ts "cap."`
3. `node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/dump-track.ts "spa"`

Observed:

1. `cap.` now yields `P_REL 15ms` and `P_ASP 27ms`
2. `spa` now yields `P_ASP 10ms`

### 12.2 Pre-boundary lengthening locus

Need to prove:

1. rhyme material in the final syllable lengthens
2. onset material in the final syllable does not lengthen purely because a boundary follows
3. phrase-medial controls remain unchanged

Preferred proof:

1. a focused duration test
2. one explain/provenance command showing which tokens match the boundary rule

Current proof:

1. `npx vitest run test/duration-model.test.ts`
2. `node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/dump-track.ts "hotel."`
3. `npm run explain -- "hotel." --verbose | rg -n "pre_boundary_lengthening match|pre_boundary_lengthening rewrite"`

Observed:

1. `hotel.` no longer matches `AO0`, `UH0`, or onset `T_CL`
2. `hotel.` now matches only final-rhyme `EH` and `L`
3. `hotel.` onset `T_CL` dropped from `43ms` to `41ms`

### 12.3 VOT defaults

Need to prove:

1. the chosen default condition matches the intended speaking style
2. the connected-speech defaults are explicit in code comments and citations
3. stop-release tests cover sentence vs cluster vs weak/final cases

Current proof:

1. `npx vitest run test/declarative-frontend-slice.test.ts test/duration-model.test.ts`
2. `node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/dump-track.ts "hotel room."`

Observed:

1. `hotel room.` now yields `T_REL 8ms` and `T_ASP 29ms`
2. the rulepack now uses `initial` and `noninitial` connected-speech VOT targets from Lisker & Abramson 1964 Table 17

### 12.4 /l/ allophony

Need to prove:

1. onset and coda `/l/` fall into cited acoustic ranges
2. the contrast is visible in a simple phone dump or track check
3. any residual engineering estimate is labeled as such

Current proof:

1. `npx vitest run test/declarative-frontend-rulepack-context.test.ts`

Observed:

1. onset `/l/` now uses `F2=1300`, `F3=2900`
2. coda `/l/` remains `F2=900`, `F3=2400`

### 12.5 ToBI / Pierrehumbert label reconciliation

Need to prove:

1. the tune grammar and prosody rules use one consistent inventory description
2. tests still cover all supported accent labels
3. provenance and downstream consumers still recognize the accent tags

Current proof:

1. `npx vitest run test/tune-grammar.test.ts test/tobi-intonation.test.ts test/prosodic-annotator.test.ts`

Observed:

1. the tune grammar and prosody headers now describe a Pierrehumbert-style accent inventory with ToBI-compatible break indices and edge notation
2. prosody-facing tests still pass unchanged

## 13. Current Principle

Do not try to "solve paper alignment" in one pass.

Do this loop instead:

1. write down one concrete mismatch
2. prove it with a local command or test
3. fix it
4. add a regression test
5. run the smallest relevant verification set
6. then move to the next mismatch

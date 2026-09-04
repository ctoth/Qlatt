# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Qlatt is a WebAudio Klatt formant synthesizer with TTS frontend. It implements the Klatt 1980 synthesizer model using WASM-backed AudioWorklets for DSP processing, driven by a declarative YAML-based configuration system.

## Core Principles

### 1. Explainability Is Not Optional

This is an *explainable* synthesizer. Every decision the system makes — which phoneme target was selected, which rules fired, why F0 is 142 Hz at this instant, why B1 widened here — must be traceable back to a specific rule, a specific paper, and a specific justification.

This is enforced through three interlocking systems:

**Provenance** (`src/provenance.ts`):
- `ProvenanceCollector` records a `DecisionRecord` for every pipeline decision
- Each record has: `stage`, `type`, `subject`, `reason`, `citations[]`, `parents[]`
- Records form a DAG: inventory selection → rule match → rule rewrite, linked by parent IDs
- The rule trace captures every match and rewrite event with the originating token ID

**Citations on rules** (every rule in `public/rules/frontends/<frontend-id>/phases/*.yaml`):
- Every rule has a `citations:` array linking to the paper or source that justifies it
- These citations flow into provenance records automatically via `RULE_CITATIONS` map
- A rule without citations is a bug. If you write a rule, cite its source.

**Tags on rule applications** (the `tag:` field on apply/dispatch entries):
- Tags like `stress`, `consonant_position`, `boundary`, `f0_declination` label what *kind* of modification a rule made
- These feed into diagnostics and provenance, making it possible to ask "why is this vowel short?" and get "duration was multiplied by 0.7 (tag: consonant_position, citation: Klatt 1976 Table III)"

**What this means for you as an agent:**
- When you write a new rule: include `citations:` with the paper reference. No citation = do not commit.
- When you add a rule application: include a `tag:` that describes the linguistic motivation.
- When you add a new pipeline stage: integrate with `ProvenanceCollector` — emit decision records for every non-trivial choice.
- When you modify semantics.yaml realize rules: comment the formula source. `# Fant 1960 Table 2.34-1` is the minimum.
- When you write Rust DSP code: cite the paper in a doc comment at the top of the module. See `crates/aerodynamic-model/src/lib.rs` for the pattern.
- Never introduce a magic number without a citation. If you can't cite it, label it `# engineering estimate` so we know it needs a real source later.

### 2. Always Cite Your Work

When we write code from a paper, cite that paper in the code. This is a specific instance of Principle 1.

The paper library lives in `papers/`. Each paper has a `notes.md` with implementation-focused extractions (equations, parameter tables, algorithms). Before implementing anything from a paper, read `papers/<Author_Year_ShortTitle>/notes.md` first — the extraction work is already done.

### 3. The Diagnostics System

`src/diagnostics.ts` provides runtime diagnostic logging (info/warn/error) with subscriber support. This is separate from provenance — diagnostics are for runtime observations ("warning: F0 clamped to floor"), while provenance is for decision tracing ("F0 set to 142 Hz because rule f0_declination matched, citation: O'Shaughnessy 1976").

When you add new processing stages or error conditions, emit diagnostics. When a parameter is clamped, defaulted, or falls back — that's a diagnostic event.

### 4. Script Repetitive Inspection And Migration Work

Do not rely on long shell or Node one-liners for non-trivial repo analysis, migration, or data inspection. If a task needs more than a simple command, write an actual script in `scripts/` (or another appropriate checked-in location) so the logic is readable, reusable, and reviewable.

**What this means for you as an agent:**
- For repeatable searches, inspections, or report generation: prefer a real script over an inline one-liner.
- For schema migrations or corpus analysis: write a dedicated script and run that script.
- Use one-liners only for genuinely trivial commands (`rg`, `Get-Content`, `git status`, short smoke checks).
- If a throwaway script is only needed temporarily, still make it a normal file first; delete it afterward if it should not stay in the repo.

## Build Commands

In a fresh worktree, do not launch the unfiltered `npm test` suite until the
WASM files imported by `test/klsyn88.test.ts` exist under
`target/wasm32-unknown-unknown/release/`. If they are absent, run the documented
Windows or Unix WASM build below once and verify the produced paths first.

```bash
# Build WASM modules (required first)
pwsh -File build.ps1          # Windows
./build.sh                     # Unix

# Full Vitest suite (requires the WASM build above in this exact checkout)
npm test

# Run dev server
npm run dev                    # Vite server at http://localhost:8000

# Golden tests
npm run test:golden            # Run golden comparison tests

# Build CMU dictionary
npm run build:dict

# Explain a phrase (provenance trace)
npm run explain -- "hello world"           # compact text output (~40 decisions)
npm run explain -- "hello world" --verbose  # all decisions
npm run explain -- "hello world" --format json --out report.json  # full JSON
npm run explain -- "hello world" --stage rules  # filter by pipeline stage
npm run explain -- "hello world" --why d000045  # trace ancestry of a decision
npm run explain -- "hello world" --strict-citations  # exit code 2 if any uncited

# Summarize an explain JSON report
npm run explain:summary -- report.json
```

### Explain Tool Reference

The `explain` CLI (`scripts/explain-phrase.ts`) runs the full TTS pipeline on a phrase and collects every provenance decision. Use it to verify that rules fire correctly, citations exist, and the decision DAG makes sense.

**Flags:**

| Flag | Description |
|------|-------------|
| `--format text\|json` | Output format (default: text) |
| `--verbose` | Show all decisions in text mode (default shows ~40) |
| `--stage <stages>` | Comma-separated filter: `transcribe`, `rules`, `prosody`, `semantics`, `interpreter`, `runtime`, `frontend` |
| `--subject <pat>` | Filter by subject (exact or `prefix*` wildcard) |
| `--range <spec>` | Filter by `seq:START-END`, `time:START-END`, `token:START-END`, or `id:START-END` |
| `--why <id>` | Show ancestry chain for a decision (e.g., `--why d000045`) |
| `--base-f0 <Hz>` | Fundamental frequency (default: 110) |
| `--transition-ms <ms>` | Formant transition duration (default: 30) |
| `--strict-citations` | Exit code 2 if any decisions in the output window lack citations (respects --stage, --subject, --range filters) |
| `--out <file>` | Write output to file instead of stdout |
| `--item <id>` | Filter by item ID (required with `--field` or `--why-not`) |
| `--field <key>` | Show field history for an item |
| `--why-not <rule>` | Show why a specific rule did not fire |
| `--field-phase <phase>` | Phase for field replay |
| `--field-boundary <where>` | Boundary for field display (default: `after`) |
| `--phase-views` | Include phase boundary checkpoints in output |
| `--verify-replay` | Enable replay verification |
| `--tooling-only` | Show only tooling decisions |
| `--frontend <id>` | Frontend rulepack ID (default: `qlatt-english`) |
| `--speaker <name>` | Speaker profile for synthesis |

## Testing Audio in Chrome

Dev server: `npm run dev` → `http://localhost:8000`

Trigger speech (useful for testing audio):
```javascript
Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Speak')).click()
```

## Architecture

### Data Flow

```
Text → normalizeText() → transcribeText() → [inventory lookup]
     → typed Utterance HRG
     → graph rule phases (postlexical → structural → duration → formant → prosody)
     → one final HRG lowering → frames → interpreter → WebAudio Graph
```

1. **TTS Frontend** (`src/tts-frontend.ts`)
   - `normalizeText()` — text normalization (numbers, abbreviations, currency)
   - `transcribeText()` — CMU dictionary lookup + LTS fallback (`src/g2p/`)
   - Selected-frontend inventory lookup maps phonemes to typed Segment Items
   - Constructs the canonical `Utterance` with shared Token, Word, Syllable,
     Segment, and SylStructure identity
   - Runs graph-native rules and invokes `hrg/lowering.ts` exactly once

2. **Declarative HRG Rule Engine** (`src/declarative-frontend/hrg/rule-engine.ts`)
   - Processes rule phases defined in `public/rules/frontends/<frontend-id>/phases/*.yaml`
   - Reads and writes typed Items and Relations through atomic transactions
   - Rule kinds: `scalar` (modify values), `point` (insert F0 targets), `postlexical` (splice/replace tokens), `structural` (expand phonemes into sub-segments)
   - Rules use CEL expressions for conditions and values
   - Navigation is relation-aware and preserves shared Item identity
   - Every committed write is versioned and provenance-stamped from the rule's
     required `citations:` and application `tag:`
   - Phase checkpoints, rule attempts, and replay come from the same execution

3. **Runtime/Interpreter System** (`src/klatt-runtime.ts`, `src/klatt-interpreter.ts`)
   - **Runtime**: Creates WebAudio graph from YAML graph definition
   - **Interpreter**: Schedules track frames to AudioParams
   - Uses CEL expressions for parameter derivation (semantics evaluation)

4. **Legacy Synthesizer** (`src/klatt-synth.ts`)
   - Standalone implementation with hardcoded graph topology
   - Used by test harness, parallel to runtime system

### Declarative Configuration (Bacon IR)

Configuration lives in `public/experiments/<experiment-id>/` (e.g.
`public/experiments/klatt80-baseline/`; experiments may `extends` a parent via
`public/experiments/manifest.json`):

- **`registry.yaml`**: Primitive node definitions (resonator, gain, etc.)
- **`graph.yaml`**: Audio graph topology (nodes + connections); Qlatt macro
  data such as `formantBanks` lives under the graph's `meta:` key
- **`semantics.yaml`**: Parameter derivation rules using CEL expressions

The Bacon IR schemas and validator live in the sibling `../bacon` repo;
`bacon check public/experiments/<id>/graph.yaml` validates a graph against its
declared registry layers. See `docs/host-contract.md` for the execution
semantics a host must implement.

### Semantics Evaluation Pipeline

```
src/semantics/
├── types.ts              # Type definitions (SemanticsDocument, etc.)
├── cel-evaluator.ts      # CEL expression evaluation (uses cel-js)
├── topological-evaluator.ts  # Dependency-ordered rule evaluation
└── jmespath-resolver.ts  # JMESPath queries (for nested constants)
```

Key concepts:
- **params**: Input parameters (F0, F1, AV, etc.) with defaults/ranges
- **constants**: Static values (ndbScale offsets, correction tables)
- **realize**: CEL expressions that derive output values (e.g., `voiceGain: dbToLinear(GO + AV + ndbScale.AV)`)

The interpreter:
1. Builds context from frame params + constants + defaults
2. Evaluates realize rules in topological order (respecting deps)
3. Applies realized values to bound AudioParams

### WASM Primitives (crates/)

Rust DSP modules compiled to WASM:
- `resonator` - Two-pole formant filter
- `antiresonator` - Two-zero nasal filter
- `lf-source` - Liljencrants-Fant glottal source
- `decay-envelope` - Exponential decay for PLSTEP bursts
- `edge-detector` - Threshold crossing detector
- `signal-switch` - N-to-1 signal selector
- `aerodynamic-model` - Aerodynamic tract model
- `biquad-notch` - Biquad notch filter
- `fujisaki-resonator` - Fujisaki model resonator
- `impulsive-source` - Impulse train source
- `oversampled-glottal-source` - Oversampled glottal source
- `pitch-sync-mod` - Pitch-synchronous modulation
- `reconstruction-filter` - Signal reconstruction filter
- `square-source` - Square wave source
- `tilt-filter` - Spectral tilt filter
- `triangular-source` - Triangular wave source

Shared utilities in `crates/klatt-wasm-common/`.

### Builtin Functions

`src/builtin-functions.ts` is the single source of truth for:
- `dbToLinear()` - Klatt dB conversion (6 dB per doubling)
- `proximity()` - Formant proximity correction
- `ndbScale` - Source amplitude scale factors (includes G0 compensation)

These are registered with the CEL evaluator for use in semantics expressions.

## Documentation

- `docs/parameter-scheduling.md` - How parameters flow from text to audio (track structure, ramp vs step, semantics)
- `docs/adding-a-synthesizer.md` - Guide for adding new synthesizer configurations
- `docs/synthesizer-architecture.md` - Overview of synthesizer architecture
- `docs/yaml-graph-tests.md` - Testing YAML graph definitions

## Paper Library

The `papers/` directory contains ~370 processed research papers with implementation-focused notes. Each paper folder has:
- `notes.md` — extracted equations, parameter tables, algorithms (START HERE)
- `description.md` — brief summary
- `paper.pdf` — original PDF
- `papers/index.md` — index with one-paragraph descriptions of every paper

**Before implementing anything from a paper, read `papers/<folder>/notes.md` first.** The extraction work is already done. Don't re-read the PDF when the notes exist.

**Key topic clusters:**
- Glottal source: Fant 1985/1988/1995 (LF model), Doval 2003 (CALM), Klatt 1990 (voice quality)
- Formants: Peterson & Barney 1952 (vowels), Kent & Vorperian 2018 (bandwidths), Fant 1960 (theory)
- Fricatives: Jongman 2000, Shadle 1985/2023, Badin 1989
- Duration: Klatt 1976, van Santen 1993/1994, Crystal & House 1988
- Prosody: Pierrehumbert 1980, Ladd 2008, O'Shaughnessy 1976, Fujisaki
- Stops: Zue 1976, Stevens 1998, Blumstein & Stevens 1979
- Coarticulation: Ohman 1966, Recasens 1997/2003
- Voice quality: Gobl 2003, Burkhardt 2009, Childers & Lee 1991
- G2P/TTS: Allen 1987 (MITalk), Miller 1998, Elovitz 1976

## Key References

- Klatt (1980) - Synthesizer specification (PARCOE.FOR, COEWAV.FOR)
- Peterson & Barney (1952) - Canonical vowel formants
- Local reference implementations:
  - `~/src/klatt80/` - Original FORTRAN
  - `~/src/klatt-syn/` - TypeScript implementation (chdh)
  - `~/src/klsyn/` - klsyn88: Dennis Klatt's original C synthesizer (`c/parwv.c`, `c/klsyn.c`) with a Python/Cython wrapper (Keith Johnson). The 1982-87 "new voicing source" engine (KLGLOTT88; pre-1990, so no flutter/diplophonia/SQ/LF/tracheal). NOT Nim.

## Important Patterns

### Provenance Integration

When adding new pipeline stages or rules, integrate with the provenance system:

```typescript
// In pipeline code — emit a decision record for every non-trivial choice
provenance.add({
  stage: "rules",                    // "transcribe" | "rules" | "semantics" | "interpreter" | "runtime"
  type: "rule_matched",              // descriptive type string
  subject: `token:${tokenId}`,       // what was affected
  reason: "pre_boundary_lengthening matched (phrase-final sonorant)",
  citations: ["Crystal & House 1988"],
  parents: [parentDecisionId],       // chain to prior decisions
});
```

In YAML rules, every rule must have:
```yaml
my_rule:
  kind: scalar
  select: ...
  apply:
    - field: duration
      op: mul
      value: 1.3
      tag: boundary            # what kind of modification (feeds diagnostics)
  citations:
    - Crystal & House 1988     # justification (feeds provenance)
```

### Ramp vs Step Parameters

Aspiration (AH) and frication (AF) use `linearRampToValueAtTime` for smooth transitions.
Most other parameters use `setValueAtTime` for instantaneous changes.
The semantics marks ramp params with `ramp: true`.

### PLSTEP Burst Mechanism

Plosive releases inject DC step via edge-detector → decay-envelope chain.
Triggered when AF or AH rises by ≥49 dB between frames.

### SW (Cascade/Parallel Switch)

`SW=0` routes through cascade formant chain (vowels).
`SW=1` enables parallel branch (fricatives, stops).
Critical: Branch gains must use `setValueAtTime`, not ramp, for instantaneous switching.

### Provenance Number Assertions

Before asserting an exact provenance substring that contains a formatted number,
inspect the production formatter and use its actual precision in the expected
text. Keep separate numeric assertions on the underlying value so presentation
coverage cannot substitute for behavior coverage.

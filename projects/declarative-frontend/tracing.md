## Part 10: Tracing and Introspection



Debugging phonological rules is notoriously difficult. This section specifies the introspection tooling required for the DSL to be usable in practice.



### 10.1 Design Principles



1\. **Every decision must be traceable** - Why did this rule fire? Why didn't it?

2\. **Every value must have provenance** - Where did this duration come from?

3\. **State is always inspectable** - What did the streams look like at any point?

4\. **Visualization is first-class** - Multi-stream alignment must be visible



### 10.2 Trace Events



The engine emits structured trace events at each step:



```typescript

type TraceEvent =

  | PhaseStart

  | PhaseEnd

  | SnapshotCreated

  | RuleEvaluationStart

  | MatchAttempt

  | MatchSuccess

  | MatchFailure

  | ExpressionEvaluation

  | PatchGenerated

  | PatchApplied

  | PatchSkipped

  | ScalarResolution

  | TimeComputation

  | PointResolution

  | Warning

  | Error;



interface MatchAttempt {

  type: 'match_attempt';

  rule: string;

  pattern: string;

  position: { stream: string; index: number; token_id: string };

  timestamp: number;

}



interface MatchSuccess {

  type: 'match_success';

  rule: string;

  pattern: string;

  captures: Record<string, TokenId | TokenId[] | null>;

  span: { left: SyncMarkId; right: SyncMarkId };

  constraint_result: boolean | null;  // null if no constraint

}



interface MatchFailure {

  type: 'match_failure';

  rule: string;

  pattern: string;

  step_index: number;              // which step failed

  step_where: string;              // the where clause

  token_evaluated: TokenId;

  evaluation_result: any;          // what the where clause returned

  reason: 'where_false' | 'scope_boundary' | 'end_of_stream' | 'constraint_false';

}



interface ExpressionEvaluation {

  type: 'expression_eval';

  rule: string;

  expression: string;

  context: Record<string, any>;    // the data root

  result: any;

  duration_us: number;             // for perf tracking

}



interface PatchGenerated {

  type: 'patch_generated';

  rule: string;

  match_index: number;

  patch: Patch;

  source_tokens: TokenId[];        // tokens that triggered this patch

}



interface PatchSkipped {

  type: 'patch_skipped';

  patch: Patch;

  reason: 'target_deleted' | 'target_null' | 'conflict' | 'validation_failed';

  details: string;

}



interface ScalarResolution {

  type: 'scalar_resolution';

  token_id: TokenId;

  field: string;

  base: number;

  floor: number | null;

  effects: ResolvedEffect[];

  resolved: number;

  computation_steps: string[];     // human-readable step-by-step

}

```



### 10.3 Provenance Tracking



Every resolved value carries its provenance:



```typescript

interface Provenance {

  field: string;

  token_id: TokenId;

  base_value: number;

  base_source: 'inventory' | 'override';

  effects: ProvenanceEffect[];

  final_value: number;

}



interface ProvenanceEffect {

  rule: string;

  citation: string;

  tag: string;

  op: 'set' | 'mul' | 'add';

  value: number;

  value_before: number;

  value_after: number;

  match_context: {

    captures: Record<string, TokenId>;

    position: number;

  };

}

```



**Query interface:**



```typescript

// "Why is this token's duration 152ms?"

engine.explain(tokenId, 'duration') → Provenance



// Returns:

{

  field: 'duration',

  token_id: 'phone_42',

  base_value: 240,

  base_source: 'inventory',  // from æ entry

  effects: [

    {

      rule: 'stress_lengthening',

      citation: 'Klatt 1976 §III.B',

      tag: 'stress',

      op: 'mul',

      value: 1.0,              // stress == 0, so no change

      value_before: 240,

      value_after: 240

    },

    {

      rule: 'fortis_clipping', 

      citation: 'Wells 1990; Chen 1970',

      tag: 'fortis',

      op: 'mul',

      value: 0.6,

      value_before: 240,

      value_after: 186         // Klatt: 0.6 \* (240 - 105) + 105

    },

    {

      rule: 'phrase_final_lengthening',

      citation: 'Klatt 1976 §III.A',

      tag: 'boundary',

      op: 'mul',

      value: 1.0,              // not phrase-final

      value_before: 186,

      value_after: 186

    }

  ],

  final_value: 186

}

```



### 10.4 Snapshot Diffing



Compare state between any two points:



```typescript

interface SnapshotDiff {

  phase_from: string;

  phase_to: string;

  

  tokens: {

    added: TokenSummary[];

    deleted: TokenSummary[];

    modified: TokenModification[];

  };

  

  sync_marks: {

    added: SyncMarkId[];

    deleted: SyncMarkId[];

  };

  

  associations: {

    added: AssociationEdge[];

    deleted: AssociationEdge[];

  };

}



interface TokenModification {

  token_id: TokenId;

  changes: FieldChange[];

}



interface FieldChange {

  path: string;              // e.g., 's.duration', 'f.place', 'sync_right'

  old_value: any;

  new_value: any;

  caused_by: string[];       // rule names

}

```



**Usage:**



```typescript

const diff = engine.diff('after:allophonic', 'after:duration');

// Shows all changes made by duration phase

```



### 10.5 Rule Coverage Report



Track which rules fired and where:



```typescript

interface RuleCoverage {

  rule: string;

  citation: string;

  

  matches: {

    total: number;

    by_position: Map<number, number>;  // index → count

  };

  

  non_matches: {

    total_attempts: number;

    failure_reasons: Map<string, number>;  // reason → count

  };

  

  effects_applied: number;

  effects_skipped: number;

  

  example_matches: MatchSuccess[];      // first N

  example_failures: MatchFailure[];     // first N

}



// "Why didn't insert_aspiration fire on this stop?"

engine.whyNot('insert_aspiration', tokenId) → MatchFailure[]

```



### 10.6 Stream Visualization



Multi-stream alignment view specification:



```typescript

interface StreamView {

  time_range: [number, number];

  streams: StreamLayer[];

  sync_marks: SyncMarkDisplay[];

  annotations: Annotation[];

}



interface StreamLayer {

  stream: string;

  tokens: TokenDisplay[];

  y_position: number;

  height: number;

}



interface TokenDisplay {

  token_id: TokenId;

  name: string;

  x_start: number;           // pixels or time

  x_end: number;

  features: Record<string, string>;  // formatted for display

  scalars: Record<string, string>;

  highlight: 'none' | 'selected' | 'matched' | 'modified' | 'inserted' | 'deleted';

  provenance_available: string[];    // which fields have provenance

}



interface SyncMarkDisplay {

  id: SyncMarkId;

  x: number;

  time: number | null;

  order: string;

  references: TokenId[];     // tokens using this mark

  is_interior: boolean;

}



interface Annotation {

  type: 'rule_match' | 'patch_applied' | 'warning' | 'custom';

  x_start: number;

  x_end: number;

  y_stream: string;

  label: string;

  details: any;

}

```



### 10.7 Interactive Debugger Protocol



For IDE/UI integration:



```typescript

interface DebuggerProtocol {

  // Breakpoints

  setBreakpoint(location: BreakpointLocation): BreakpointId;

  removeBreakpoint(id: BreakpointId): void;

  

  // Execution control

  run(): Promise<void>;

  stepPhase(): Promise<PhaseResult>;

  stepRule(): Promise<RuleResult>;

  stepMatch(): Promise<MatchResult>;

  pause(): void;

  

  // State inspection

  getStreams(): StreamState[];

  getToken(id: TokenId): Token;

  getSyncMark(id: SyncMarkId): SyncMark;

  explain(tokenId: TokenId, field: string): Provenance;

  whyNot(rule: string, tokenId: TokenId): MatchFailure[];

  

  // Queries

  query(jsonata: string): any;  // query current state

  

  // Events

  onTraceEvent(callback: (event: TraceEvent) => void): void;

  onBreakpoint(callback: (bp: BreakpointId) => void): void;

}



type BreakpointLocation =

  | { type: 'phase'; phase: string; when: 'before' | 'after' }

  | { type: 'rule'; rule: string; when: 'before' | 'after' }

  | { type: 'match'; pattern: string; token?: TokenId }

  | { type: 'patch'; patch_type: string }

  | { type: 'token_modified'; token: TokenId; field?: string }

  | { type: 'condition'; expr: string };  // break when expr is true

```



### 10.8 Trace Output Formats



**JSON Lines (streaming):**



```jsonl

{"type":"phase_start","phase":"duration","timestamp":1234567890}

{"type":"match_success","rule":"stress_lengthening","captures":{"current":"phone_42"}}

{"type":"expression_eval","rule":"stress_lengthening","expression":"$parent(current,'syllable').f.stress","result":1}

...

```



**HTML Report:**



Self-contained HTML with:

\- Collapsible phase sections

\- Token timeline visualization

\- Click-to-expand provenance

\- Search/filter by rule, token, field

\- Diff view between phases



**SQLite Database:**



```sql

CREATE TABLE trace_events (

  id INTEGER PRIMARY KEY,

  timestamp_us INTEGER,

  phase TEXT,

  event_type TEXT,

  event_json TEXT

);



CREATE TABLE provenance (

  token_id TEXT,

  field TEXT,

  base_value REAL,

  final_value REAL,

  effects_json TEXT,

  PRIMARY KEY (token_id, field)

);



CREATE TABLE snapshots (

  phase TEXT PRIMARY KEY,

  state_json TEXT  -- or msgpack for size

);



-- Query: all effects on duration fields

SELECT p.token_id, p.effects_json 

FROM provenance p 

WHERE p.field = 'duration';

```



**Storage semantics (implementation-defined):**



The following are not specified and left to implementation:

\- Maximum trace size / rotation policy

\- Buffering vs streaming behavior

\- Behavior when disk fills (fail, truncate, or drop events)

\- Memory limits for in-memory traces during interactive debugging



Implementations should document their choices.



### 10.9 Performance Profiling



```typescript

interface PerformanceReport {

  total_time_ms: number;

  

  by_phase: {

    phase: string;

    time_ms: number;

    breakdown: {

      snapshot: number;

      matching: number;

      patch_generation: number;

      patch_application: number;

      resolution: number;

    };

  }[];

  

  by_rule: {

    rule: string;

    time_ms: number;

    match_attempts: number;

    match_successes: number;

    expressions_evaluated: number;

    avg_expression_time_us: number;

  }[];

  

  hot_expressions: {

    expression: string;

    count: number;

    total_time_us: number;

    avg_time_us: number;

  }[];

  

  memory: {

    peak_tokens: number;

    peak_sync_marks: number;

    snapshot_copies: number;

  };

}

```



### 10.10 Configuration



```yaml

debug:

  enabled: true

  

  trace:

    events: [match_success, match_failure, patch_applied, scalar_resolution]

    # or: all, none, errors_only

    

    include_context: true      # include full expression context

    include_snapshots: true    # store snapshots for diffing

    max_example_failures: 10   # per rule

    

  output:

    format: jsonl              # jsonl, html, sqlite

    path: "./debug/trace.jsonl"

    

  breakpoints:

    - { type: phase, phase: duration, when: after }

    - { type: condition, expr: "current.s.duration < 50" }

    

  performance:

    enabled: true

    sample_expressions: true   # profile JSONata evaluation



  visualization:

    enabled: true

    output: "./debug/timeline.html"

    streams: [phone, syllable, f0]

    time_range: auto           # or [0, 2000]

```



### 10.11 Command Line Interface

The implementation MUST provide a CLI that supports:

- Running a spec against input text or a file
- Validating a spec and emitting diagnostics
- Diffing states between phases
- Producing visualizations of streams
- Profiling performance by phase/rule
- Interactive debugging with breakpoints
- LSP mode for editor integration

The reference CLI and detailed usage live in `projects/declarative-frontend/cli.md` (informative).


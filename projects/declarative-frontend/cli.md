### 10.11 Command Line Interface



```

tts-dsl - Declarative TTS Frontend DSL



USAGE:

    tts-dsl <COMMAND> [OPTIONS]



COMMANDS:

    run         Process input through the DSL pipeline

    validate    Check spec for errors without running

    explain     Show provenance for a token's field

    why-not     Explain why a rule didn't fire on a token

    diff        Compare state between phases

    visualize   Generate timeline visualization

    profile     Performance profiling

    debug       Interactive debugger

    lsp         Language Server Protocol mode

    completion  Generate shell completions



GLOBAL OPTIONS:

    -s, --spec <FILE>       Spec file (default: tts.yaml)

    -v, --verbose           Increase verbosity (-v, -vv, -vvv)

    -q, --quiet             Suppress non-error output

    --color <WHEN>          Color output: auto, always, never

    --config <FILE>         Config file for defaults

```



#### tts-dsl run



```

Process input through the DSL pipeline



USAGE:

    tts-dsl run [OPTIONS] <INPUT>



ARGS:

    <INPUT>     Input text, file path, or "-" for stdin



INPUT FORMATS:

    --input-format <FMT>    Input format: text, phonemes, json

                            text     - Plain text (requires G2P)

                            phonemes - Space-separated phonemes

                            json     - Pre-structured token stream



OUTPUT:

    -o, --output <FILE>     Output file (default: stdout)

    --output-format <FMT>   Output format:

                            klatt    - Klatt parameter frames (default)

                            json     - Full token state as JSON

                            praat    - Praat TextGrid

                            ssml     - Annotated SSML

                            wav      - Synthesized audio (requires backend)



TRACING:

    --trace <FILE>          Write trace to file (jsonl, html, or sqlite by extension)

    --trace-events <LIST>   Events to trace: all, none, or comma-separated list

                            (match, patch, resolution, expression, error)

    --snapshots             Include full snapshots in trace (large!)



PHASES:

    --stop-after <PHASE>    Stop after named phase

    --skip <PHASES>         Skip comma-separated phases

    --only <PHASES>         Run only comma-separated phases



EXAMPLES:

    tts-dsl run "hello world"

    tts-dsl run -s en-us.yaml --output-format wav -o hello.wav "hello world"

    tts-dsl run --input-format phonemes "h ə l oʊ"

    tts-dsl run --trace trace.html --trace-events all input.txt

    cat text.txt | tts-dsl run -

```



#### tts-dsl validate



```

Check spec for errors without running



USAGE:

    tts-dsl validate [OPTIONS] [SPEC]



ARGS:

    [SPEC]      Spec file (default: tts.yaml)



OPTIONS:

    --strict            Treat warnings as errors

    --check-citations   Verify citation format

    --check-inventory   Verify all phonemes have targets

    --list-rules        List all rules with citations

    --list-patterns     List all patterns with streams

    --deps              Show phase dependencies as graph



OUTPUT:

    --format <FMT>      Output format: text, json, sarif (for CI)



EXAMPLES:

    tts-dsl validate en-us.yaml

    tts-dsl validate --strict --format sarif > results.sarif

    tts-dsl validate --list-rules

```



#### tts-dsl explain



```

Show provenance for a token's field value



USAGE:

    tts-dsl explain [OPTIONS] <INPUT> --token <ID> --field <FIELD>



ARGS:

    <INPUT>             Input text or file



OPTIONS:

    --token <ID>        Token ID or selector:

                        phone_42      - by ID

                        phone:5       - phone stream index 5

                        "æ":first     - first token named æ

                        syllable:2    - syllable index 2

    

    --field <FIELD>     Field to explain: duration, F1, F2, etc.

    

    --phase <PHASE>     Show state after this phase (default: final)

    

    --format <FMT>      Output format: text, json, markdown



OUTPUT:

    Shows: base value, source, each effect with rule/citation/before/after



EXAMPLES:

    tts-dsl explain "hello" --token phone:3 --field duration

    tts-dsl explain "hello" --token "ɛ":first --field F1 --format json

```



#### tts-dsl why-not



```

Explain why a rule didn't fire on a token



USAGE:

    tts-dsl why-not [OPTIONS] <INPUT> --rule <RULE> --token <ID>



ARGS:

    <INPUT>             Input text or file



OPTIONS:

    --rule <RULE>       Rule name

    --token <ID>        Token ID or selector (see 'explain')

    --phase <PHASE>     Evaluate at this phase (default: rule's phase)

    --all-failures      Show all match attempts, not just for this token



OUTPUT:

    Shows: which pattern step failed, the where clause, 

           actual token values, expected values



EXAMPLES:

    tts-dsl why-not "did you" --rule insert_aspiration --token phone:0

    tts-dsl why-not input.txt --rule d_j_coalescence --all-failures

```



#### tts-dsl diff



```

Compare state between phases



USAGE:

    tts-dsl diff [OPTIONS] <INPUT> --from <PHASE> --to <PHASE>



ARGS:

    <INPUT>             Input text or file



OPTIONS:

    --from <PHASE>      Start phase (or "init" for initial state)

    --to <PHASE>        End phase (or "final" for end state)

    --stream <STREAM>   Filter to specific stream

    --format <FMT>      Output format: text, json, patch



OUTPUT:

    Shows: tokens added/deleted/modified, sync marks changed,

           associations changed, with causing rules



EXAMPLES:

    tts-dsl diff "hello" --from init --to sandhi

    tts-dsl diff "hello" --from duration --to final --stream phone

```



#### tts-dsl visualize



```

Generate timeline visualization



USAGE:

    tts-dsl visualize [OPTIONS] <INPUT> -o <OUTPUT>



ARGS:

    <INPUT>             Input text or file



OPTIONS:

    -o, --output <FILE>     Output file (.html, .svg, .png)

    --streams <LIST>        Streams to show (default: phone,syllable,f0)

    --phase <PHASE>         Show state at phase (default: final)

    --time-range <RANGE>    Time range in ms: "0-2000" or "auto"

    --show-sync-marks       Draw sync mark lines

    --show-provenance       Color by rule that last modified

    --interactive           HTML with hover/click (html only)



EXAMPLES:

    tts-dsl visualize "hello world" -o timeline.html --interactive

    tts-dsl visualize input.txt -o diagram.svg --streams phone,f0

```



#### tts-dsl profile



```

Performance profiling



USAGE:

    tts-dsl profile [OPTIONS] <INPUT>



ARGS:

    <INPUT>             Input text or file (or --corpus for batch)



OPTIONS:

    --iterations <N>    Run N times and average (default: 10)

    --corpus <DIR>      Profile all .txt files in directory

    --warmup <N>        Warmup iterations (default: 2)

    --format <FMT>      Output format: text, json, flamegraph

    --output <FILE>     Output file (default: stdout)



BREAKDOWN:

    --by-phase          Time breakdown by phase

    --by-rule           Time breakdown by rule

    --expressions       Profile JSONata expressions

    --memory            Track memory allocations



EXAMPLES:

    tts-dsl profile "hello world" --iterations 100

    tts-dsl profile --corpus ./test-sentences/ --format json -o profile.json

    tts-dsl profile input.txt --expressions --format flamegraph -o profile.svg

```



#### tts-dsl debug



```

Interactive debugger



USAGE:

    tts-dsl debug [OPTIONS] <INPUT>



ARGS:

    <INPUT>             Input text or file



OPTIONS:

    --break <BP>        Initial breakpoint (can repeat):

                        phase:sandhi:before

                        phase:duration:after

                        rule:stress_lengthening

                        token:phone_5:modified

                        condition:"current.s.duration < 50"

    

    --script <FILE>     Run debugger commands from file

    --port <PORT>       DAP server mode on port (for IDE integration)



DEBUGGER COMMANDS:

    break <location>    Set breakpoint

    delete <id>         Delete breakpoint

    list                List breakpoints

    

    run                 Run to next breakpoint

    step phase          Step one phase

    step rule           Step one rule

    step match          Step one match attempt

    continue            Continue execution

    

    state               Show current state summary

    tokens [stream]     List tokens in stream

    token <id>          Show token details

    sync <id>           Show sync mark details

    

    explain <id> <fld>  Show provenance

    why-not <rule> <id> Explain match failure

    diff [from] [to]    Diff between phases

    

    query <jsonata>     Query current state

    watch <expr>        Watch expression value

    

    visualize           Open timeline in browser

    

    help [command]      Show help

    quit                Exit debugger



EXAMPLES:

    tts-dsl debug "hello world"

    tts-dsl debug input.txt --break phase:duration:after

    tts-dsl debug input.txt --port 4711  # DAP mode for VS Code

```



#### tts-dsl lsp



```

Language Server Protocol mode for editor integration



USAGE:

    tts-dsl lsp [OPTIONS]



OPTIONS:

    --stdio             Communicate via stdin/stdout (default)

    --socket <PORT>     Communicate via TCP socket

    --log <FILE>        Log LSP messages to file



FEATURES:

    - Syntax highlighting for .tts.yaml files

    - Diagnostics (errors, warnings)

    - Hover: show rule citations, pattern definitions

    - Go to definition: rule → pattern, stream → definition

    - Completion: rule names, stream names, feature values

    - Code actions: add missing citation, fix feature typo



EXAMPLES:

    tts-dsl lsp --stdio

    tts-dsl lsp --socket 5007 --log lsp.log

```



#### tts-dsl completion



```

Generate shell completions



USAGE:

    tts-dsl completion <SHELL>



ARGS:

    <SHELL>     Shell: bash, zsh, fish, powershell



EXAMPLES:

    tts-dsl completion bash > /etc/bash_completion.d/tts-dsl

    tts-dsl completion zsh > ~/.zfunc/_tts-dsl

```



### 10.12 Exit Codes



```

0   Success

1   General error

2   Invalid arguments

3   Spec validation failed

4   Input parsing failed

5   Rule execution error

10  Breakpoint hit (debug mode, non-interactive)

```



### 10.13 Environment Variables



```

TTS_DSL_SPEC          Default spec file path

TTS_DSL_CONFIG        Config file path

TTS_DSL_TRACE_DIR     Directory for trace files

TTS_DSL_COLOR         Color mode: auto, always, never

TTS_DSL_PAGER         Pager for long output (default: less)

```



### 10.14 Config File



```yaml

# ~/.config/tts-dsl/config.yaml



defaults:

  spec: ~/tts/en-us.yaml

  output_format: klatt

  

trace:

  events: [match, patch, error]

  directory: ~/.local/share/tts-dsl/traces/

  

debug:

  history_file: ~/.local/share/tts-dsl/debug_history

  

profile:

  iterations: 10

  warmup: 2

```



### 10.15 Example Debug Session



```

$ tts-dsl debug spec.yaml "did you eat"



TTS-DSL Debugger v11

Loaded spec: spec.yaml

Input: "did you eat" (3 words, 7 phones)



(tts) break phase sandhi after

Breakpoint 1 set: after phase 'sandhi'



(tts) run

Running...

Hit breakpoint 1: after phase 'sandhi'



(tts) diff

Phase diff (init → sandhi):

  Tokens:

    - deleted: phone_3 (d)

    - deleted: phone_4 (j)  

    + inserted: phone_3a (dʒ) [rule: coalesce_dj, citation: Cruttenden 2014 §10.3]

  Sync marks:

    - removed (gc): s4



(tts) explain phone_3a duration

Token: phone_3a (dʒ)

Field: duration



Base: 100ms (from inventory: dʒ)

Effects: (none yet - duration phase hasn't run)

Current: 100ms



(tts) step phase

Running phase: allophonic...

Done. 2 releases inserted.



(tts) step phase  

Running phase: duration...

Done. 5 scalars resolved.



(tts) explain phone_5 duration

Token: phone_5 (i)

Field: duration



Base: 100ms (from inventory: i)

Floor: 42ms (Klatt 1976)



Effects applied:

  1. stress_lengthening [Klatt 1976 §III.B]

     op: mul, value: 1.3 (stress=1)

     100ms → 117ms (Klatt: 1.3 \* (100-42) + 42 = 117)

     

  2. phrase_final_lengthening [Klatt 1976 §III.A]

     op: mul, value: 1.3 (boundary=major)

     117ms → 140ms (Klatt: 1.3 \* (117-42) + 42 = 140)



Final: 140ms



(tts) why-not insert_aspiration phone_1

Rule: insert_aspiration

Token: phone_1 (d)



Match attempted at position 0

Step 0: capture 'stop' where "f.manner = 'stop' and f.voicing = 'voiceless'"

  f.manner = 'stop' → true

  f.voicing = 'voiceless' → false (actual: 'voiced')

  

Result: FAILED at step 0 (where_false)

Reason: /d/ is voiced; rule requires voiceless stop



(tts) visualize

Generated: ./debug/timeline.html



(tts) quit

```



This tooling is what makes the difference between "interesting research project" and "system someone can actually debug."






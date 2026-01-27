# The Delta Rule Development System for Speech Synthesis from Text

**Authors:** Susan R. Hertz, James Kadin, Kevin J. Karplus
**Year:** 1985
**Venue:** Proceedings of the IEEE, Vol. 73, No. 11, November 1985
**Pages:** 1589-1601
**DOI:** 0018-9219/85/1100-1589

## One-Sentence Summary

Delta is a domain-specific programming language and development environment for writing text-to-speech synthesis rules, featuring multi-level synchronized data structures ("deltas") that overcome the limitations of linear string representations in previous systems.

## Problem Addressed

Previous TTS rule development systems (like SRS and Carlson/Granstrom's system) were too restrictive:
- Forced linear utterance representations (couldn't handle phrases/syllables as units parallel to phonemes)
- Dictated fixed rule frameworks and application orders
- Couldn't manipulate sub-phoneme units (aspiration, stop closure)
- Rules buried in general-purpose programming languages were hard to test/modify

SRS (Hertz's earlier system) forced rule-writers to work with four rule types in fixed order:
1. text-modification rules
2. conversion rules
3. feature-modification rules
4. parameter rules

At the parameter rule level, SRS forced a target-and-transition model. Rules were always tested top-to-bottom through rule set, left-to-right across utterance.

## Key Contributions

1. **Multi-level delta data structure**: Synchronized streams representing different linguistic levels (morphs, letters, phonemes, syllables) that can be tested and manipulated independently
2. **Flexible pattern-matching language**: Rules can test across streams, use context operators, handle complex synchronization patterns
3. **Dictionary facilities**: Beyond simple exception lookups - can store arbitrary actions, handle context-dependent pronunciations
4. **Interactive symbolic debugger**: Conditional breakpoints, automatic commands, source-level and machine-level debugging
5. **Compiled to portable pseudo-machine**: Delta Machine instructions, with "patcher" for rapid rule iteration
6. **No forced rule framework**: Rule-writers choose their own rule organization, application order, and synthesis model

## Methodology

### Architecture (Fig. 1)

```
Delta program
    ↓
Delta compiler → Dictionary entries
    ↓                    ↓
Delta Machine      Dictionary builder
instructions            ↓
    ↓              Loadable dictionary
Assembler/linker         ↓
    ↓                    ↓
Load module ←────────────┘
    ↓
Delta Machine interpreter ←→ symbolic debugger
    ↓
text → sound
```

**Implementation notes:**
- Entire system written in C for speed, portability, compactness
- Compiled to Delta Machine pseudo-code (portable across hardware)
- Contrast: SRS rules are interpreted; Carlson/Granstrom compile to specific computer
- Linker can "patch" modified procedures into existing load modules for rapid iteration

### The Delta Data Structure

A **delta** consists of one or more user-defined **streams** synchronized at **sync marks**.

Example delta for "bathed":
```
%morph:   |    root          | suffix |
%letter:  | b | a | t | h | e |   d    |
%phoneme: | b |GAP| dh  |GAP |   d    |
```

- Vertical bars = sync marks (synchronize tokens across streams)
- GAP tokens = placeholders for phonemes to be assigned by later rules
- Each token has **fields** with **attributes** (name-valued, multi-valued, or binary)

### Stream Definitions

Each token in a stream is a collection of **fields** with particular **values**. All tokens have at least a `name` field.

**Three field types:**
1. **Name-valued field** - takes token names from some stream as values (e.g., `strong-pronunc: names in %phoneme`)
2. **Multi-valued field** - non-name field with >2 possible values (e.g., `character-type: letter, punct, space, digit`)
3. **Binary field** - non-name field with exactly 2 values (e.g., `letter-type: vowel` implies opposite `~vowel`)

```delta
stream %text;
  name: a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,
        '.', '?', '!', ' ', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0';
  character-type: letter, punct, space, digit;
  letter-type: vowel;
end %text;

stream %phoneme;
  name: b, p, d, t, g, k, dh, th, f, v, s, z, sh, zh, ch, jh, l, r, y, w, i, I, ae, ..., uh;
  voicing: voiced;
  phoneme-class: consonant(b-r), vowel(i-uh), glide(y,w);
  manner-of-articulation: stop, fricative, affricate, ...;
  place-of-articulation: labial, interdental, alveolar, palatal, ...;

  th has manner-of-articulation: fricative, place-of-articulation: interdental;
  dh like th except voicing: voiced;
  ch has affricate, palatal;
  jh like ch except voiced;
end %phoneme;
```

**Initial attributes**: The `has` and `like` statements assign default field-values automatically set when token is inserted:
- `th has fricative, interdental;` - assigns initial attributes for th
- `dh like th except voiced;` - copies th's attributes, overrides voicing
- Attributes can be used without field name when unambiguous

**Extended text stream with name-valued fields:**
```delta
stream %text;
  strong-pronunc: names in %phoneme;
  default-pronunc: names in %phoneme;

  a has strong-pronunc: e, default-pronunc: ae;
  e has strong-pronunc: i, default-pronunc: E;
  i has strong-pronunc: ay, default-pronunc: I;
  o has strong-pronunc: o, default-pronunc: a;
  u has strong-pronunc: u, default-pronunc: uh;
end %text;
```

### Advantages of Multi-Level Deltas

1. **Clarity**: Structure visible (prefix/root/suffix boundaries, syllable alignment)
2. **Non-contiguous synchronization**: Hebrew consonant roots can skip vowels
3. **Derivational history preserved**: Distinguish epenthetic [t] in "sense" from inherent [t] in "cents"
4. **Sub-phoneme representation**: Aspiration, diphthong parts, affricate components

**Detailed examples:**

**1. Clarity - "discovers" representation:**
```
%morph:    | prefix |    root     | suffix |
%text:     | d | i | s | c | o | v | e | r |   s   |
%phoneme:  | d | I | s | k | uh| v | E | r |   z   |
%syllable: |  syl   |    syl      |  syl   |
```

In SRS linear notation, same word would be: `++dI.s- +cover+ -s++`
- Cluttered with special markers
- Higher-level units not directly testable/manipulable

**2. Non-contiguous synchronization - Hebrew "kotev" (write):**
```
%vowel:     |  | GAP | e | GAP | o | GAP |  |
%consonant: |  |  v  |   |  t  |   |  k  |  |
%morph:     |          root              |
```

Adjacent sync marks with no intervening token act as single sync mark. Tokens between them in other streams are "invisible" in that stream. Consonant root k-t-v can be looked up directly by finding consonant sequence synchronized with root token.

**3. Derivational history - "sense" vs "cents":**
```
sense:
%text:     | s | e | n |   | s | e |
%phoneme:  | s | E | n | t | s |   |

cents:
%text:     | c | e | n | t | s |
%phoneme:  | s | E | n | t | s |
```

In "sense", epenthetic [t] is NOT synchronized with any letter (inserted between [n] and [s]). In "cents", inherent [t] IS synchronized with letter 't'. Rule can easily distinguish: epenthetic stop has shorter closure duration [Dinnsen 1984].

Note: Inserted [t] is "invisible" in text stream (not synchronized with gap), so pattern for "ns" still succeeds despite phoneme [t] intrusion.

**4. Sub-phoneme representation - "chide":**
```
%phoneme:  | ch | ay | d |
%sub-phon: | t | sh | a | y | d |
```

Phoneme-sized units (ch, ay, d) used for duration prediction. Subparts (t, sh, a, y) used for formant transitions since:
- Transitions INTO [ay] are like transitions into monophthong [a]
- Transitions FROM [ay] are like transitions from [y]

**5. Aspiration as independent unit - "pie":**
```
%letter:         |   p   |       | i | e |
%phoneme:        |   p   |       |  ay   |
%amplitude-type: | silence | aspiration | voicing |
```

Aspiration associated with NEITHER stop nor vowel exclusively. Third alternative vs forced linear choice.

### Pattern Matching

Patterns test sync marks and tokens using **pointer variables**. Sync marks are referenced by pointer variables (e.g., `^1`, `^left`, `^right`).

**Basic pattern syntax:**
```delta
[%text _^1 a]                           -- letter 'a' after pointer ^1
[%text _^1 {a | e | i | o | u}]         -- any vowel letter (alternation)
[%text _^1 (vowel)]                     -- token with attribute <vowel>
[%phoneme _^1 dh]                       -- phoneme 'dh' after ^1
```

**Bracket types:**
- `[ ]` - square brackets: test secondary default stream (phoneme)
- `{ }` - curly braces: test primary default stream (text), can surround patterns without changing meaning

**Cross-stream patterns** (implicit sync mark at `[` boundary):
```delta
[%text _^1 a [%phoneme (consonant)] e]  -- 'a', sync mark, consonant phoneme, sync mark, 'e'
{ _^1 a [(consonant)] e }               -- simplified with defaults: 'a' + consonant phoneme + 'e'
```

**Setting pointers as side-effects** (use `!` prefix):
```delta
{ _^1 a !^2 [(consonant)] e }           -- ^2 set to sync mark after 'a'
```

**Side-effect rollback**: If pattern fails after `!^2` was set, the setting is undone. Failed tests don't affect delta or variables.

**Built-in pointers:**
- `^left` - leftmost sync mark of delta (always set)
- `^right` - rightmost sync mark of delta (always set)

**Context operators `\\` and `//`** for "contained in" tests:
```delta
{ [(vowel) _^1] & [%syllable_ \\^1 (~stress)] }  -- vowel in unstressed syllable
```

The `\\^1` finds the closest sync mark in syllable stream to the LEFT of `^1`.
The `//^1` finds the closest sync mark in syllable stream to the RIGHT of `^1`.

**Conjunction operator `&`:**
```delta
{ { _^1 a !^2 [(consonant)] e !^end} & [%morph root _^end] }
```
Both halves must succeed. Left conjunct tested first (ensures `^end` is set before right half tests it).

**Negation brackets `[' ... ']`:**
```delta
{ _^1 [' (vowel) '] }                   -- ABSENCE of vowel token after anchor
{ _^1 (~vowel) }                        -- PRESENCE of token WITHOUT vowel attribute (different!)
```

Key difference: Negation brackets fail if ANY token matches; attribute test matches tokens lacking that attribute. `[' (vowel) ']` won't match at rightmost sync mark; `(~vowel)` would require a token to be present.

**Empty angle brackets `( )`** match any single token:
```delta
[ _^1 ( ) !$ph !^2 [' [%morph] '] $ph ] -- match any phoneme, store in $ph, check next is same
```

**Repetition operator `++`** matches one or more (longest match):
```delta
{_^begin (letter)++ !^end}              -- match longest sequence of letters
```

### Rules

Rules couple patterns with actions. Basic form: `pattern -> action;`

**Example - root-final e rule:**
```delta
{ { _^1 a !^2 [(consonant)] e !^end}
  & [%morph root _^end] }
-> insert [e] ^1...^2;
```

This rule: if letter 'a' is followed by consonant phoneme and root-final 'e', insert phoneme [e]. Applies to: bathe, bake, fate, lathe, etc.

**Action types:**
1. `insert [token] ^ptr1...^ptr2;` - insert token between pointers
2. `delete %stream ^ptr1...^ptr2;` - delete tokens in range
3. `mark [%stream (attribute)] range;` - set attribute on tokens in range
4. Procedure calls

**Token variables `$name`** store copies of matched tokens:
```delta
{ { _^1 (vowel) !$v !^2 [(consonant)] e !^end}
  & [%morph root _^end] }
-> insert [(name: $v.strong-pronunc)] ^1...^2;
```

The `$v` stores the matched vowel token. `$v.strong-pronunc` accesses its strong-pronunc field value. `(name: value)` creates a token with that name.

**Delete example:**
```delta
[ _^1 ( ) !$ph !^2 [' [%morph] '] $ph ]
-> delete %phoneme ^1...^2;
```
Deletes first of two identical phonemes not separated by morph boundary (e.g., first t in "ditto").

### Control Structures

**If-statement** (tests patterns in order, executes first matching action):
```delta
proc strong-vowel(^before, ^after);
  if
    {_^before a} -> insert [e] ^before...^after;
    {_^before e} -> insert [i] ^before...^after;
    {_^before i} -> insert [ay] ^before...^after;
    {_^before o} -> insert [o] ^before...^after;
    {_^before u} -> insert [u] ^before...^after;
  fi;
end strong-vowel;
```

**Forall loop** (iterates over matches in delta):
```delta
loop forall {_^begin (letter)++ !^end} from ^left;
  break_into_morphs(^begin, ^end);
  continue from ^end;
pool;
```

**Forall behavior:**
- `from ^left` initializes anchor `^begin` to `^left`
- If pattern doesn't match at `^begin`, advance one sync mark and retry
- Repeat until pattern matches (execute body) or `^begin` reaches right end (terminate)
- `continue from ^end` advances anchor and continues scan

**Forall options:**
- Direction to scan
- Which stream to scan in
- Which pointer to advance

**Do/od grouping** for multiple statements:
```delta
{pol !^1 i !^2 ce} ->
  do
    mark [%syllable (stressed)] (\\^1 in %syllable)...(//^2 in %syllable);
    insert [i] ^1...^2;
  od;
```

### Procedures

Procedures are like conventional programming languages but with special parameter passing:

**Parameter passing modes:**
- **Pass-by-value** (default): copy given to procedure, changes don't affect caller
- **Pass-by-value-return**: copy given, then copied back if procedure succeeds

**Unusual design**: The CALL SITE specifies passing mode, not the definition:
```delta
proc strip-prefix(^beg, ^end);
  -- body
end strip-prefix;

-- Call with value-return (! prefix means may be modified):
strip-prefix(!^1, !^2);

-- Call with value (no prefix):
strip-prefix(^1, ^2);
```

This allows same procedure to be called differently in different contexts.

### Dictionary Facilities

Delta's dictionary has two parts: **action dictionary** and **sets**.

**Sets** (token sequences without actions, for grouping similar words):
```delta
set no-ly-strip contains {humbly}, {crumbly}, {nimbly}, {assembly};
```

**Using sets in rules:**
```delta
{ !^suff ly _^end}
-> ~find {^beg...^end} in no-ly-strip    -- ~ is negation: if NOT found
-> insert [%morph suffix] ^suff...^end;
```

**Find statement:**
```delta
find {^beg...^end}                       -- look up in action dictionary
find {^beg...^end} in prepositions       -- look up in named set
```

**Action dictionary** (entries with associated actions):

Dictionary definition block:
```delta
dictionary(^beg, ^end, ^1, ^2);          -- header: delimiting pointers + 2 auxiliary
  -- entries go here
end dictionary;
```

**Simple insert shorthand** (`=>` instead of `-> insert`):
```delta
{coup} => [k u];                         -- shorthand for: {coup} -> insert [k u] ^beg...^end;
{of} => [uh v];
```

**Partial pronunciation** (insert only for irregular graphemes):
```delta
{gl !^1 o !^2 ve} => [uh];              -- just inserts [uh] for irregular 'o'
{sh !^1 o !^2 ve} => [uh];              -- rest of pronunciation by rules
{l !^1 o !^2 ve} => [uh];
```
The `^1` and `^2` auxiliary pointers mark the irregular letter(s); action inserts pronunciation only between those pointers. Rest of word handled by general rules.

**Context-dependent actions:**
```delta
dictionary(^beg, ^end, ^1, ^2);
  {have} ->
    if { _^end ' ' to !^end [' (letter) '] }  -- followed by " to" + non-letter
      -> insert [h ae f t uh] ^beg...^end;
    else -> insert [h ae v] ^beg...^end;
    fi;
end dictionary;
```

The "have to" example: [h ae f t uh] when followed by "to", otherwise [h ae v]. Note that `^end` is MOVED to after "to" when matched, so the calling loop continues correctly.

**Dictionary can move pointers** - keeps calling code simple:
```delta
loop forall {_^beg (letter)++ !^end} from ^left;
  find {^beg...!^end};                   -- ! means dictionary may modify ^end
  continue from ^end;
pool;
```

When processing "I have to go", dictionary returns with `^end` after "to" (not after "have"), so loop correctly continues with "go".

**Arbitrary actions in dictionary:**
```delta
{pol !^1 i !^2 ce} ->
  do
    mark [%syllable (stressed)] (\\^1 in %syllable)...(//^2 in %syllable);
    insert [i] ^1...^2;
  od;
```
Marks final syllable of "police" as stressed AND inserts pronunciation for 'i'.

**Like-shorthand** (same action as another entry):
```delta
{l !^1 o !^2 ve} like {glove};          -- uses glove's action
```

**Set membership in dictionary:**
```delta
{near} (in prepositions);               -- adds to set, no action
{of} (in prepositions) => [uh v];       -- adds to set AND has action
```

**Alternate syntax** (less typing):
```delta
dictionary(^beg, ^end, ^1, ^2);
  set prepositions contains %text: at, in, under, by;
  %text:
    coup => [k u];
    gl !^1 o !^2 ve => [uh];
end dictionary;
```

**Using sets for conditional actions:**
```delta
set prefix-not-syl contains {discover}, {discuss}, {disease}, {mistake};

find {^begw...^endw} in prefix-not-syl
-> {!^ends () _^endp}                    -- set ^ends one letter before prefix end
-> insert [%syllable syl] ^begw...^ends;
```
Inserts first syllable token in words where prefix boundary ≠ syllable boundary (e.g., "dis|cover" prefix, but "di|scover" syllable).

### Debugging Environment

The debugger is critical because synthesis rule development is inherently iterative, trial-and-error:
1. Examine data (word lists, spectrograms)
2. Formulate hypotheses
3. Embody in rule program
4. Test program
5. Repeat

Incorrect pronunciations often not revealed until many utterances tested, can stem from any rule portion.

**Debugger capabilities:**
- Display and modify delta data structure
- Uses source language notation (procedure names, stream names, variable names, etc.)
- Breakpoints at arbitrary source locations
- Step through source line by line
- Examine/alter variables and delta when suspended
- Display selected source lines
- Machine-level debugging also available (addresses, assembly format)

**Conditional breakpoints** - halt when conditions arise:

```
break on delta                           -- stop before any delta change
break after delta                        -- stop after any delta change
break on delta in strip-prefix           -- only in procedure strip-prefix
break after delta strip-prefix: 3-20     -- lines 3-20 only
```

**Breakpoint conditions can trigger on:**
- Before/after delta change (or specific streams)
- Procedure entry/return
- Specific source line or machine address
- Pattern match failure/success
- Specific instruction types (e.g., insert)
- Named tags in program

**Multiple independent ranges** supported per condition.

**Automatic commands** (execute when breakpoint occurs):
```
break after delta in strip-prefix (print delta \
  %text %morph ^begw...^endw; go)
```

This prints text/morph streams after any delta change in strip-prefix, then continues. Single command produces list of all words modified by strip-prefix.

If command list doesn't include `go`, user is prompted for further commands.

**Built-in debugging variables:**
- `^^1`, `^^2` - built-in pointer variables for interactive testing
- Extra `^` marks them as debugger variables vs program variables

**Independent procedure testing:**
```
call strip-prefix(!^^1, !^^2)
```
Can test any procedure before supporting routines are written by setting up delta interactively.

**Additional built-in variables** (assigned at breakpoint):
- Position where pattern is being matched
- Stream being matched
- Left/right end of pending delta change
- Stream of pending change
- Source line number being executed
- Instruction address being executed

### The Delta "Patcher"

Recompile single procedure and patch into existing load module:
```
patch strip-prefix rules
```

This overwrites previous strip-prefix in load module named "rules". Minimizes frustrating compilation/linking delays.

Dictionary entries can also be patched into existing dictionaries.

## Parameters

| Name | Type | Description |
|------|------|-------------|
| Pointer variables | `^name` | Reference sync marks in delta |
| Token variables | `$name` | Store matched token copies |
| Streams | `%name` | Named synchronized token sequences |
| Attributes | `(value)` or `(~value)` | Field-value pairs on tokens |

## Complete Operator Reference

### Pattern Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `_^ptr` | Anchor pattern at pointer | `{_^1 a}` - test for 'a' after ^1 |
| `!^ptr` | Set pointer as side-effect | `{a !^2 b}` - set ^2 between a and b |
| `!$var` | Store matched token in variable | `{!$v (vowel)}` - store vowel in $v |
| `++` | Match one or more (longest) | `{(letter)++}` - longest letter sequence |
| `[' ... ']` | Negation brackets (must NOT match) | `{[' (vowel) ']}` - no vowel present |
| `~` | Negation operator (for find, attributes) | `~find`, `(~vowel)` |
| `&` | Conjunction (both must match) | `{pat1} & {pat2}` |
| `{a \| b \| c}` | Alternation (any of) | `{a \| e \| i \| o \| u}` |
| `\\^ptr` | Left context in specified stream | `[%syllable \\^1 (stressed)]` |
| `//^ptr` | Right context in specified stream | `[%syllable //^2 (stressed)]` |
| `( )` | Match any single token | `{( ) !$ph}` - match any, store in $ph |
| `(attr)` | Match token with attribute | `{(vowel)}` |
| `(~attr)` | Match token WITHOUT attribute | `{(~voiced)}` |

### Action Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `->` | General action arrow | `{pat} -> action;` |
| `=>` | Shorthand insert action | `{word} => [phonemes];` |
| `^ptr...^ptr` | Range between pointers | `insert [x] ^1...^2;` |

### Bracket Types

| Bracket | Purpose |
|---------|---------|
| `[ ]` | Test secondary default stream (phoneme) |
| `{ }` | Test primary default stream (text) |
| `< >` | Token name (in patterns) |
| `( )` | Attribute test OR any-token match |
| `[' ']` | Negation brackets |

### Stream and Variable Syntax

| Syntax | Meaning |
|--------|---------|
| `%name` | Stream name |
| `^name` | Pointer variable |
| `$name` | Token variable |
| `^^name` | Debugger pointer variable |
| `$var.field` | Access field of token variable |
| `(name: value)` | Create token with specified name |
| `(field: value)` | Token with field=value |

### Dictionary Syntax

| Syntax | Meaning |
|--------|---------|
| `find {seq}` | Look up in action dictionary |
| `find {seq} in setname` | Look up in named set |
| `!^ptr` in find | Pointer may be modified by dictionary |
| `like {entry}` | Use same action as another entry |
| `(in setname)` | Add to set (optionally with action) |

## Implementation Details

- Written in C for speed, portability, compactness
- Compiles to Delta Machine pseudo-code (portable)
- SRS rules are interpreted; Carlson/Granstrom compile to specific computer
- Dictionary builder produces searchable dictionary from entries
- Linker can "patch" modified procedures into existing load modules

## Figures of Interest

- **Fig. 1 (p. 1591)**: Block diagram of Delta System components
- **Fig. 2 (p. 1591)**: Delta fragment for "bathed" showing 3 synchronized streams
- **Fig. 5 (p. 1592)**: Delta for "discovers" with morph/text/phoneme/syllable streams
- **Fig. 6 (p. 1592)**: Hebrew "kotev" showing non-contiguous root consonants
- **Fig. 7 (p. 1593)**: Contrast of "sense" vs "cents" for epenthetic stop detection

## Limitations

- Version described lacks full numeric capabilities (planned for "Delta version 2")
- Cannot yet do interpolation for synthesizer parameter values natively
- Must interface external procedures for actual synthesis parameter generation

## Planned Extensions (Section IV) - Delta Version 2

### Numeric Capabilities

Delta v2 will add numeric capabilities for synthesizer parameter generation:

**New numeric data structure:**
- Separate from the delta
- Designed for efficient numeric operations (interpolations)
- "Synchronizable" with delta at selected points along time continuum
- Rules can test for particular synchronizations

**Numeric attributes on tokens:**
- Tokens in delta itself can contain numeric information
- Example: default target values for synthesizer parameters

**Pointer attributes:**
- Tokens can point to other tokens in any stream
- Enables arbitrary graphs (e.g., recursive tree structures)

### Synthesis Strategy Flexibility

Delta v2 will NOT force:

1. **Traditional rule component division**: Can intermingle symbolic and numeric manipulations (vs. purely symbolic → purely numeric)

2. **Concatenative vs rule-based choice**: Can extract SOME values from dictionary, generate OTHERS by rule. Not all-or-none.

3. **Single unit type for parameter generation**: Can use demisyllables/diphones for some parameters, phonemes for others. Whatever works best for each phenomenon.

4. **Single synthesizer parameter type**: Can work with articulatory parameters, acoustic parameters, or both (if driving program provided).

5. **Unit-by-unit parameter assignment**: Can generate patterns extending across arbitrary domains.

### Intonation Model Support

Planned to accommodate various intonation models:
- **Target-and-transition models**: Phonological targets linked by low-level transitions [Pierrehumbert 1981, Anderson/Pierrehumbert/Liberman 1984, Bruce 1977, Ladd 1983]
- **Function-based models**: Contours as result of two or more interacting mathematical functions [Fujisaki & Hirose 1982]

## Relevance to Qlatt Project

### Direct Relevance
- **Rule architecture model**: Delta's multi-level synchronized streams could inform Qlatt's `tts-frontend-rules.js` organization
- **Dictionary + rules hybrid**: Qlatt already uses exception dictionaries; Delta's action dictionary pattern (context-dependent pronunciations) is more powerful
- **Morphological analysis**: Delta's morph/root/suffix stream separation is cleaner than marker-based approaches

### Design Patterns Worth Adopting

1. **Sync marks for alignment**: Instead of linear phoneme strings, consider parallel arrays with explicit synchronization points
   - Current Qlatt: Linear phoneme array
   - Delta approach: Parallel streams with sync marks enabling cross-level queries

2. **Context operators**: `\\` and `//` for "contained in" tests could simplify syllable/word boundary rules
   - Example: "Is this vowel in an unstressed syllable?" becomes trivial

3. **Derivational history**: Keeping letter-phoneme alignment enables rules like:
   - Epenthetic stop distinction (sense vs cents)
   - Context-dependent vowel reduction
   - Morpheme-boundary-sensitive rules

4. **Action dictionaries**: Beyond simple pronunciation lookup - store arbitrary rule actions
   - "have to" → [h ae f t uh] vs "have" → [h ae v]
   - Pointer movement to span multi-word units

5. **Partial pronunciation entries**: Insert only irregular grapheme pronunciation
   - `{gl !^1 o !^2 ve} => [uh]` - just the 'o', rest by rules
   - Reduces dictionary size, maintains rule generality

6. **Sub-phoneme representation** for complex segments:
   - Affricates: phoneme-level [ch], sub-phoneme [t][sh]
   - Diphthongs: phoneme-level [ay], sub-phoneme [a][y]
   - Enables different rule granularities for different phenomena

### Implementation Ideas for Qlatt

**Multi-stream track structure:**
```javascript
// Current: linear phoneme array
const track = [
  { phoneme: 'b', duration: 80, ... },
  { phoneme: 'ae', duration: 120, ... },
  ...
];

// Delta-inspired: parallel synchronized streams
const delta = {
  streams: {
    morph: ['root'],
    text: ['b', 'a', 't', 'h', 'e', 'd'],
    phoneme: ['b', 'ae', 'th', 'd'],
    syllable: ['syl', 'syl']
  },
  syncMarks: [
    { morph: 0, text: 0, phoneme: 0, syllable: 0 },
    { morph: 0, text: 1, phoneme: 1, syllable: 0 },
    // ...
  ]
};
```

**Context-dependent dictionary with actions:**
```javascript
// Current: simple exception lookup
const exceptions = {
  'lasagna': ['l', 'ah', 'z', 'aa', 'n', 'y', 'ah'],
};

// Delta-inspired: action dictionary
const actionDictionary = {
  'have': (context) => {
    if (context.followedBy('to')) {
      return { phonemes: ['h', 'ae', 'f', 't', 'ah'], consumeNext: true };
    }
    return { phonemes: ['h', 'ae', 'v'] };
  },
  'read': (context) => {
    // Past tense vs present based on syntactic context
    if (context.isPastTense()) {
      return { phonemes: ['r', 'eh', 'd'] };
    }
    return { phonemes: ['r', 'iy', 'd'] };
  }
};
```

### Not Directly Applicable
- Delta is a full programming language; Qlatt uses JavaScript
- Debugging environment is specific to Delta Machine
- Numeric synthesis (Klatt parameters) is handled differently in Qlatt

### Comparison with Qlatt's Current Approach

| Aspect | Delta | Qlatt Current |
|--------|-------|---------------|
| Data structure | Multi-level synchronized streams | Linear phoneme array + separate metadata |
| Letter-phoneme alignment | Explicit via sync marks | Implicit/lost after conversion |
| Dictionary actions | Arbitrary code, pointer movement | Simple pronunciation lookup |
| Sub-phoneme units | First-class in sub-phoneme stream | Not represented |
| Morphological info | Preserved in morph stream | Lost after G2P |
| Rule testing | Pattern language with pointers | JavaScript functions |

## Open Questions

- [ ] Did Delta version 2 with numeric capabilities ever ship?
- [ ] What became of Eloquent Technology's commercial products? (ETI-Eloquence became a commercial product - see Hertz 1999 paper)
- [ ] How does Delta's performance compare to modern TTS rule systems?
- [ ] Are the full Delta language specifications available anywhere?

## Practical Implementation Insights

### For Building a Modern Rule System

**1. Data structure design**: The delta multi-stream approach with sync marks is more powerful than linear representations. Key insight: synchronization is a first-class concept.

**2. Pattern language**: The anchor-based pattern matching (`_^ptr`) with side-effect pointer setting (`!^ptr`) enables stateless, composable rules.

**3. Dictionary architecture**: Action dictionaries with pointer movement enable multi-word units without special-casing in main rule loop.

**4. Derivational transparency**: Keeping letter↔phoneme alignment enables rules that depend on spelling, not just pronunciation.

**5. Granularity flexibility**: Sub-phoneme streams for transitions, phoneme streams for duration - different levels for different phenomena.

### Design Decisions Worth Emulating

| Decision | Rationale |
|----------|-----------|
| Call-site parameter passing mode | Same procedure can be called with value or value-return in different contexts |
| Side-effect rollback on pattern failure | Enables speculative matching without corruption |
| Dictionary pointer movement | Multi-word units handled cleanly |
| Partial pronunciation entries | Insert only irregular parts, rest by rules |
| Patcher for rapid iteration | Minimizes edit-compile-test cycle |

### What NOT to Emulate (Context-Specific)

| Decision | Why it made sense then | Why maybe not now |
|----------|------------------------|-------------------|
| Custom pseudo-machine | Portability across 1985 hardware | Modern VMs (JS, WASM) are fast |
| Compiled rules | Speed on slow hardware | Interpreted JS is fast enough |
| Custom debugger | No alternative in 1985 | Browser DevTools, node --inspect |

## Historical Context

- Delta was developed at Cornell Phonetics Laboratory and Eloquent Technology, Ithaca NY
- Built on 9 years of SRS experience synthesizing multiple languages
- SRS rules for Japanese achieved high quality in 6 months - demonstrating tooling ROI
- Written in C for "speed, portability, and compactness" (vs LISP/PROLOG alternatives)
- Designed to be practical for commercial products, not just research

## Key Terminology

| Term | Definition |
|------|------------|
| Delta | The synchronized multi-stream data structure |
| Stream | A sequence of tokens at one linguistic level (%text, %phoneme, etc.) |
| Token | A unit in a stream with named fields and values |
| Sync mark | A synchronization point between streams (vertical bar) |
| Pointer | A variable referencing a sync mark (^name) |
| Attribute | A field-value pair on a token ((voiced), (consonant)) |
| GAP | A placeholder token for phonemes not yet assigned |
| Action dictionary | Dictionary entries with associated rule actions |
| Set | Dictionary entries without actions (for membership tests) |
| Delta Machine | The portable pseudo-machine executing compiled rules |
| Patcher | Tool to quickly update single procedures in load modules |

## Related Work Worth Reading

### Rule Development Systems
- [14] Carlson & Granstrom (1976) - Text-to-speech based entirely on rules
- [15] Hertz (1982) - SRS system (Delta's predecessor)
- [19] Aggoun, Sorin, Emerard, Stella - SYNTHEX expert system (LISLOG-based)

### Text-to-Phoneme Systems
- [1] Allen (1976) - MITalk system: Synthesis of speech from unrestricted text
- [2] Allen, Hunnicutt, Carlson, Granstrom (1979) - MITalk-79 system (12000-entry morph dictionary)
- [5] Elovitz et al. (1976) - NRL letter-to-sound rules (no morphological analysis)

### Synthesis Approaches
- [6] Fujimura, Macchi, Lovins (1977) - Demisyllables and affixes
- [7] Browman (1980) - Demisyllable synthesis with Lingua interpreter
- [8] Dettweiler (1981) - Demisyllable synthesis for German
- [9] Holmes, Mattingly, Shearme (1964) - Speech synthesis by rule (target-and-transition model)
- [10] Klatt (1982) - KLATTalk text-to-speech system
- [11] Coker (1976) - Articulatory dynamics model
- [12] Olive (1974) - Speech synthesis by rule
- [13] Wolf (1981) - Diphone concatenation prosody control

### Intonation Models
- [24] Pierrehumbert (1981) - Synthesizing intonation (phonological targets + transitions)
- [25] Anderson, Pierrehumbert, Liberman (1984) - English intonation synthesis by rule
- [26] Bruce (1977) - Swedish word accents in sentence perspective
- [27] Ladd (1983) - Phonological features of intonational peaks
- [28] Fujisaki & Hirose (1982) - F0 modeling with interacting mathematical functions

### Phonological Theory
- [20] Davidsen-Nielsen (1974) - Syllabification in English words with medial sp, st, sk
- [21] Dinnsen (1984) - Phonological neutralization (epenthetic vs inherent stops)
- [22] Anderson (1976) - Nasal consonants and internal structure of segments
- [23] van der Hulst & Smith (1982) - Autosegmental and metrical phonology

### Synthesis Approaches Taxonomy (from paper)

**First rule component (text → phonemes):**

| Approach | System | Description |
|----------|--------|-------------|
| Whole-word | NRL | Simple rewrite rules, no morph analysis |
| Morph-based (dictionary) | MITalk | 12000-entry morph dictionary, etymological |
| Morph-based (rules) | SRS | 200 rules insert morph markers, "spelling morphs" |

**Second rule component (phonemes → synthesizer values):**

| Approach | Pre-stored | Rules | Examples |
|----------|------------|-------|----------|
| Concatenative | Demisyllables | Smoothing, duration, pitch only | [6], [7], [8] |
| Pure rule-based | None | Target interpolation | [1], [9], [10], [11] |
| Hybrid (diphone) | Transitions | Some | [12], [13] |

## Quotes Worth Preserving

> "Progress in speech synthesis has been hampered by the lack of rule-writing tools of sufficient flexibility and power." (p. 1589)

> "Perhaps the most serious weakness of the two rule-development systems, however, is that they are restricted to operating on linear utterance representations. The systems cannot manipulate larger units like phrases or syllables as single units in parallel with smaller units like phonemes." (p. 1590)

> "The high-quality SRS synthesis rules for Japanese, for example, are the result of only six months of work." (p. 1590)

> "A concatenative approach, on the other hand, frees the rule-writer from having to predict the spectral information that is already present in the pre-stored units." (p. 1590)

> "The pace of developments in speech synthesis depends largely on the ease of creating, testing, and discarding rules, and on the ease of transferring the knowledge gained to new practitioners." (p. 1600)

> "Since rule-writers can surround any token sequences in the delta with built-in pointer variables, then pass them as arguments to a procedure, any procedure can be tested independently of others." (p. 1599)

> "Debugging aids like these are important for developing any complex program, and are especially important for developing synthesis rules, where the output (the synthesizer parameter values) is generally not well-specified, but is determined through extensive experimentation." (p. 1598)

> "Delta's flexibility should satisfy almost all synthesis rule developers, whether linguistic researchers or the developers of talking products. The practicality of the resulting rule sets will make it more than just a research tool." (p. 1600)

### On synthesis strategy debates

> "A primary factor in determining the choice of synthesis strategy is the rule-writer's linguistic convictions. For example, the proponents of an approach based on demisyllables claim that many of the influences of adjacent sounds on each other are automatically present in the demisyllables and cannot easily be captured with rules that operate on smaller units. The opponents of this approach counter that the degree to which sounds influence each other depends on the overall context (e.g., stressed versus unstressed), and therefore, a particular demisyllable in one context is not necessarily appropriate for another context." (p. 1590)

### On MITalk vs SRS approaches

> "The MITalk system breaks words into morphs via an extensive morph dictionary with about 12000 entries, and it generates pronunciations primarily on the basis of morph pronunciations extracted from the dictionary. The SRS rules for English, on the other hand, predict morphs with a set of about 200 context-dependent rules that insert morphological markers into the input text." (p. 1589)

> "The MITalk system respects etymological origins, distinguishing briber ('bribe' + 'er') from fiber ('fiber'), while the SRS rules for English do not, generating such 'spelling morphs' as 'fibe' + 'er' for fiber." (p. 1589)

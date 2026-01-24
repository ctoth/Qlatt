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

## Key Contributions

1. **Multi-level delta data structure**: Synchronized streams representing different linguistic levels (morphs, letters, phonemes, syllables) that can be tested and manipulated independently
2. **Flexible pattern-matching language**: Rules can test across streams, use context operators, handle complex synchronization patterns
3. **Dictionary facilities**: Beyond simple exception lookups - can store arbitrary actions, handle context-dependent pronunciations
4. **Interactive symbolic debugger**: Conditional breakpoints, automatic commands, source-level and machine-level debugging
5. **Compiled to portable pseudo-machine**: Delta Machine instructions, with "patcher" for rapid rule iteration

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

### Advantages of Multi-Level Deltas

1. **Clarity**: Structure visible (prefix/root/suffix boundaries, syllable alignment)
2. **Non-contiguous synchronization**: Hebrew consonant roots can skip vowels
3. **Derivational history preserved**: Distinguish epenthetic [t] in "sense" from inherent [t] in "cents"
4. **Sub-phoneme representation**: Aspiration, diphthong parts, affricate components

### Pattern Matching

Patterns test sync marks and tokens using **pointer variables**:

```delta
[%text _^1 a]                           -- letter 'a' after pointer ^1
[%text _^1 {a | e | i | o | u}]         -- any vowel letter
[%text _^1 (vowel)]                     -- token with attribute <vowel>
[%phoneme _^1 dh]                       -- phoneme 'dh' after ^1
```

Cross-stream patterns:
```delta
{ _^1 a [(consonant)] e }               -- 'a' + consonant phoneme + 'e'
```

Setting pointers as side-effects:
```delta
{ _^1 a !^2 [(consonant)] e }           -- ^2 set to sync mark after 'a'
```

Context operators `\\` and `//` for "contained in" tests:
```delta
{ [(vowel) _^1] & [%syllable_ \\^1 (~stress)] }  -- vowel in unstressed syllable
```

### Rules

Pattern → Action:
```delta
{ { _^1 a !^2 [(consonant)] e !^end}
  & [%morph root _^end] }
-> insert [e] ^1...^2;
```

This rule: if letter 'a' is followed by consonant phoneme and root-final 'e', insert phoneme [e].

### Control Structures

**If-statement**:
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

**Forall loop**:
```delta
loop forall {_^begin (letter)++ !^end} from ^left;
  break_into_morphs(^begin, ^end);
  continue from ^end;
pool;
```

### Dictionary Facilities

**Sets** (for grouping similar words):
```delta
set no-ly-strip contains {humbly}, {crumbly}, {nimbly}, {assembly};
```

**Action dictionary** (entries with associated actions):
```delta
dictionary(^beg, ^end, ^1, ^2);
  {coup} => [k u];
  {gl !^1 o !^2 ve} => [uh];
  {have} ->
    if { _^end ' ' to !^end [~ (letter) ~] }
      -> insert [h ae f t uh] ^beg...^end;
    else -> insert [h ae v] ^beg...^end;
    fi;
end dictionary;
```

The "have to" example shows context-dependent pronunciation: [h ae f t uh] when followed by "to", otherwise [h ae v].

### Debugging Environment

**Conditional breakpoints**:
```
break on delta                           -- stop before any delta change
break on delta in strip-prefix           -- only in procedure strip-prefix
break after delta strip-prefix: 3-20     -- lines 3-20 only
```

**Automatic commands**:
```
break after delta in strip-prefix (print delta \
  %text %morph ^begw...^endw; go)
```

**Debugging variables**: Built-in pointers `^^1`, `^^2` for interactive testing.

**Patcher**: Recompile single procedure and patch into existing load module:
```
patch strip-prefix rules
```

## Parameters

| Name | Type | Description |
|------|------|-------------|
| Pointer variables | `^name` | Reference sync marks in delta |
| Token variables | `$name` | Store matched token copies |
| Streams | `%name` | Named synchronized token sequences |
| Attributes | `(value)` or `(~value)` | Field-value pairs on tokens |

## Key Operators

| Operator | Meaning |
|----------|---------|
| `_^ptr` | Anchor pattern at pointer |
| `!^ptr` | Set pointer as side-effect |
| `++` | Match one or more (longest) |
| `[' ... ']` | Negation brackets |
| `&` | Both patterns must match |
| `\\^ptr` | Left context (closest sync mark to left in specified stream) |
| `//^ptr` | Right context |
| `^ptr...^ptr` | Range between pointers |
| `=>` | Shorthand for simple insert action |
| `->` | General action arrow |

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

## Planned Extensions (Section IV)

1. Numeric data structure for interpolations, synchronized with delta
2. Numeric attributes on tokens (default target values)
3. Pointer attributes for arbitrary graph structures
4. Flexibility to mix concatenative and rule-based synthesis
5. Support for articulatory or acoustic parameter generation
6. Patterns extending across arbitrary domain sizes (for intonation models)

## Relevance to Qlatt Project

### Direct Relevance
- **Rule architecture model**: Delta's multi-level synchronized streams could inform Qlatt's `tts-frontend-rules.js` organization
- **Dictionary + rules hybrid**: Qlatt already uses exception dictionaries; Delta's action dictionary pattern (context-dependent pronunciations) is more powerful
- **Morphological analysis**: Delta's morph/root/suffix stream separation is cleaner than marker-based approaches

### Design Patterns Worth Adopting
1. **Sync marks for alignment**: Instead of linear phoneme strings, consider parallel arrays with explicit synchronization points
2. **Context operators**: `\\` and `//` for "contained in" tests could simplify syllable/word boundary rules
3. **Derivational history**: Keeping letter-phoneme alignment enables rules like epenthetic stop distinction
4. **Action dictionaries**: Beyond simple pronunciation lookup - store arbitrary rule actions

### Not Directly Applicable
- Delta is a full programming language; Qlatt uses JavaScript
- Debugging environment is specific to Delta Machine
- Numeric synthesis (Klatt parameters) is handled differently in Qlatt

## Open Questions

- [ ] Did Delta version 2 with numeric capabilities ever ship?
- [ ] What became of Eloquent Technology's commercial products?
- [ ] How does Delta's performance compare to modern TTS rule systems?

## Related Work Worth Reading

- [1] Allen (1976) - MITalk system: Synthesis of speech from unrestricted text
- [2] Allen, Hunnicutt, Carlson, Granstrom (1979) - MITalk-79 system
- [5] Elovitz et al. (1976) - NRL letter-to-sound rules (referenced for no-morph approach)
- [9] Holmes, Mattingly, Shearme (1964) - Speech synthesis by rule (target-and-transition model)
- [10] Klatt (1982) - KLATTalk text-to-speech system
- [14] Carlson & Granstrom (1976) - Text-to-speech based entirely on rules
- [15] Hertz (1982) - SRS system (Delta's predecessor)
- [24] Pierrehumbert (1981) - Synthesizing intonation
- [28] Fujisaki & Hirose (1982) - F0 modeling with interacting functions

## Quotes Worth Preserving

> "Progress in speech synthesis has been hampered by the lack of rule-writing tools of sufficient flexibility and power." (p. 1589)

> "Perhaps the most serious weakness of the two rule-development systems, however, is that they are restricted to operating on linear utterance representations. The systems cannot manipulate larger units like phrases or syllables as single units in parallel with smaller units like phonemes." (p. 1590)

> "The high-quality SRS synthesis rules for Japanese, for example, are the result of only six months of work." (p. 1590)

> "A concatenative approach, on the other hand, frees the rule-writer from having to predict the spectral information that is already present in the pre-stored units." (p. 1590)

> "The pace of developments in speech synthesis depends largely on the ease of creating, testing, and discarding rules, and on the ease of transferring the knowledge gained to new practitioners." (p. 1600)

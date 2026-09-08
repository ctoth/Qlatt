---
title: "The Architecture of the Festival Speech Synthesis System"
authors: "Paul Taylor, Alan W. Black, Richard Caley"
year: 1998
venue: "The Third ESCA/COCOSDA Workshop (ETRW) on Speech Synthesis (SSW3), Jenolan Caves House, Blue Mountains, NSW, Australia, November 26-29, 1998"
doi_url: "https://www.isca-archive.org/ssw_1998/taylor98_ssw.html"
pages: "5"
affiliation: "Centre for Speech Technology Research, University of Edinburgh, 80 South Bridge, Edinburgh EH1 1HN, UK"
funding: "UK EPSRC grants GR/L53250 and GR/K54229; Sun Microsystems"
---

# The Architecture of the Festival Speech Synthesis System

## One-Sentence Summary
Festival replaces string-rewriting and multi-level (stream) data structures with a
*heterogeneous relation graph*-style formalism in which linguistic **items** (feature
structures) are indexed by **nodes** belonging to arbitrarily many **relations** (graphs:
lists, trees, or general graphs), all collected into an **utterance** object, with
**function features** computing derived values on the fly to eliminate redundancy. *(p.1)*

## Problem Addressed
Speech synthesis systems must store the many kinds of linguistic information produced
while converting text to speech. Prior central data structures (strings; multi-level
linear streams) either become unwieldy and lossy, or force everything into linear lists,
making trees hard to represent and requiring fragile co-indexing between streams. *(p.1-2)*

## Design Goals Stated in the Introduction *(p.1)*

The paper lists explicit design considerations any synthesis architecture must satisfy:

1. **Representation of simple linguistic objects** — words, phones, syllables and phrases
   need to be represented. *(p.1)*
2. **Co-indexing** — given a word, one must be able to find the phones that comprise that
   word. *(p.1)*
3. **Localized change** — a change in (say) the syllabification algorithm should require
   changing only the parts of the program directly involved with syllabification; other
   modules must be unaffected. *(p.1)*
4. **No redundancy or duplication of information** — e.g. the end time of a word equals
   the end time of its last phone; storing both separately means one goes stale when the
   other changes. *(p.1)*
5. **Theory neutrality for multilinguality** — multi-lingual systems must support a wide
   variety of linguistic theories, hence the architecture must not be tied to any
   particular linguistic theory or formalism. *(p.1)*
6. **Speed and efficiency** — the synthesizer is intended for real-time use. *(p.1)*
7. **Unobtrusiveness (the "real purpose")** — the architecture exists to let synthesis
   algorithms be written as easily as possible. It must abstract away infrastructure
   (data storage, file I/O, memory allocation) so that this code does not become
   intertwined with the algorithm itself. The interface must be easy to use and make
   writing synthesis algorithms quicker than ad-hoc methods. *(p.1)*

## Key Contributions
- A formalism for storing linguistic data based on **intersecting relations** rather than
  linear streams; any graph structure is allowed, not just lists. *(p.2)*
- **Items** as general feature-structure containers, configurable at run time, holding
  arbitrary information; separation of *items* (content) from *nodes* (position). *(p.2)*
- **Items may be contained in more than one relation** simultaneously, which is what
  removes the co-indexing/hole problem and yields more efficient representations. *(p.2)*
- **Function features**: feature values that are computed procedurally on access,
  removing redundant stored copies of derivable information (e.g. start, duration, end,
  word-level accentedness). *(p.2, p.3)*
- **Utterance** as a single object collecting all items and relations. *(p.3)*
- A concrete two-language implementation (C++ core plus Scheme scripting) with identical
  interfaces in both, and run-time-configurable feature/relation naming so that adding a
  new feature never requires recompilation. *(p.4)*

## Background: Criticism of Prior Architectures

### 2.1 String processing *(p.1-2)*
- Early systems used **string re-writing** as the central data structure: the linguistic
  representation of an utterance is stored as a string; initially it contains text, which
  is then re-written or embellished with extra symbols as processing proceeds. *(p.1)*
- Named users of this method: **MITalk** [1] and the **CSTR Alvey synthesizer** [5]. *(p.1)*
- Shortcomings, previously recognized by [6], [3], [4], [7]: *(p.1)*
  - The string soon becomes unwieldy for anything but the most trivial tasks; words,
    phrase symbols, stress symbols and phones all get mixed together. *(p.1)*
  - Two processing options, both bad:
    (a) modules work on the string directly, but symbol interpretation gets in the way of
    the algorithm itself; *(p.1)*
    (b) a module parses the string into an internal format — but then the string must be
    re-parsed every time a module is called, and each module tends to grow its own private
    internal data structure, so new structures and techniques must be learnt to understand
    any new module. *(p.2)*
  - To limit the mess, information is often **deleted** from the string to keep only what
    seems essential — e.g. the orthographic form of a word may be deleted after
    grapheme-to-phoneme conversion — which destroys information a later module might have
    used. *(p.2)*

### 2.2 Multi-level data structures (MLDS) *(p.2)*
- MLDS holds different types of linguistic information in separate **streams**, which are
  linear lists or arrays of linguistic items (e.g. a word stream, a phone stream, a
  syllable stream). Some systems fix the stream set; others allow arbitrarily many. *(p.2)*
- The most famous MLDS system is **Delta** (Hertz [6]); similar formalisms are used by
  **Chatr** [3], the **Bell Labs system** [7], **Polyglot** [4], and **early versions of
  Festival** [2]. *(p.2)*
- Co-indexing between streams comes in two main flavours: *(p.2)*
  1. **Edge alignment (Delta)** — streams are aligned by the edges of items. To find the
     phones in a word one goes to the beginning of the word, traces the edge "down" to the
     phone stream, and progresses along the phone stream until the edge relating to the end
     of the word is found. *(p.2)*
  2. **Centre linking** — a word contains a set of links to the phones related to it, and
     the phones in a word are found by following those links. *(p.2)*
- Drawbacks of MLDS: *(p.2)*
  - All information is forced into **linear** structures; other structures, **specifically
    trees, are very hard to represent**. *(p.2)*
  - Partly because of this the number of streams grows, which makes co-indexing harder. *(p.2)*
  - **The hole problem (edge alignment):** for a given item in one stream there may be no
    corresponding item in others. A pause is an item in the phone stream but has no
    equivalent in the syllable or word streams, so a "hole" must be created in those
    streams for co-indexing to work. With many streams the number of holes becomes
    considerable and processing awkward. *(p.2)*
  - **The link-explosion problem (centre linking):** the hole problem is absent, but every
    item must be explicitly linked to items in other streams, so the number of links
    becomes very large. Adding a new stream would require linking every existing item to
    the items in the new stream for full connectivity; since that is not practical, streams
    are often left **partially connected**, causing confusion about what is linked to what
    when writing a module. *(p.2)*
  - **Item-identity/naming problem:** in multi-level structures it is unclear what an item
    really represents. Each item usually has a single value, typically a name. A phone name
    (/h/, /e/) and a word name ("hello") are obvious, but what is the *name* of a syllable?
    Syllables are **organisational** units grouping phones and have no distinct name.
    Concatenating phone names (e.g. "/h e l/" for the first syllable of "hello") is
    redundant, artificial, and error-prone if the phone representation changes. *(p.2)*

## 3. The Formalism Based on Intersecting Relations

> "The most significant difference between the Festival architecture and those using MLDS
> is that Festival does not constrain linguistic items to be in linear lists: any graph
> structure is allowed." *(p.2)*

Three generalisations over MLDS: *(p.2)*
1. Any graph structure is allowed (not just linear lists).
2. Items can be contained in **more than one structure**, giving more efficient
   representations.
3. The content of an item is generalised so that information of **arbitrary complexity**
   can be stored.

### 3.1 Relations — the data structure *(p.2)*
- A **relation** is Festival's generalisation of the stream concept: a data structure used
  to organise linguistic items into linguistic structures such as trees and lists. *(p.2)*
- Formally: **a relation is a set of *named links* connecting a set of *nodes*.** *(p.2)*
- **Lists** (the MLDS streams) are *linear relations* where each node has a `previous` and
  a `next` link. *(p.2)*
- **Trees** additionally have `up` and `down` links (in addition to next and previous). *(p.2)*
- **Nodes are purely positional units and contain no information apart from their links.** *(p.2)*
- In addition to links to other nodes, **each node has a single link to an *item***, which
  contains the linguistic information. *(p.2)*
- Node structures of **arbitrary complexity** can be constructed, and they are intertwined
  naturally by having links from different nodes to the **same item**. *(p.3)*

Link vocabulary observed in the paper:

| Link name | Relation type | Meaning |
|-----------|---------------|---------|
| `next` | list, tree | successor node in linear order *(p.2, Fig. 1 p.3)* |
| `previous` | list, tree | predecessor node in linear order *(p.2, Fig. 1 p.3)* |
| `up` | tree | parent node *(p.2, Fig. 1 p.3)* |
| `down` | tree | child node *(p.2, Fig. 1 p.3)* |
| node→item | all | the single link from a positional node to its content item *(p.2)* |

### 3.2 Items and features *(p.3)*
- **An item consists of a bundle of features and a set of named links to nodes in
  relations.** *(p.3)*
- Items can be linked into **any number of relations** — in the Fig. 1 example words are
  linked into 2 relations (word relation and syntax relation), but in principle any number
  is possible. *(p.3)*
- The information in items is represented by **features**, stored as a **list of key-value
  pairs**. *(p.3)*
- Feature values are **commonly numbers or strings, but may also take complex objects as
  values** if necessary. *(p.3)*
- **An item can have arbitrarily many features, including zero** — syllable items often
  have no features at all. This is Festival's answer to the MLDS syllable-naming problem:
  an organisational unit simply carries no features. *(p.3)*

### Function features *(p.3)*
- As well as simple values, features can take **functions** as values. Function features
  "greatly reduce the amount of redundant information in an utterance structure." *(p.3)*

Motivating case — phone segmentation timing: *(p.3)*
- A simple segmentation is a contiguous list of named segments each with timing
  information. If the phones are properly contiguous, **only one timing value per phone is
  needed to fully represent all the timing information of the segmentation**. *(p.3)*
- If the **end point** is stored, then: start(item) = end(previous item), and
  duration(item) = end − start. *(p.3)*
- Without function features there are only two options, both unattractive: *(p.3)*
  1. Store end alone and compute start/duration on the fly inside each algorithm — makes
     algorithm writing unwieldy and overly complicated.
  2. Write start and duration in as additional stored features — effectively copies
     information, which can lead to out-of-date information being present.
- Function-feature solution: a `start` function is written (in Festival this can be written
  in **C++ or Scheme**) which looks at the previous item and returns its `end`. This
  function is assigned as the value of a key named `"start"`. Accessing the `start` feature
  returns a time value as if it were actually stored. A `duration` function returns
  `start` subtracted from `end`; **the duration function simply evaluates the feature named
  "start" and does not need to know whether it is a simple feature or a function feature.** *(p.3)*
- **Current Festival usage: time positions are kept only in items linked to the segment
  relation; all other times are calculated by functions.** *(p.3)*
- **Different `start`/`end` functions can be written for different purposes, all assigned
  to the same key.** Example: the `end` function assigned to non-terminal nodes in the
  syntax tree descends from the current node until a terminal node is encountered and
  returns that node's item's `end` value. The terminal node's item is a word, whose `end`
  feature is itself a function — commonly the word's `end` function returns the time of the
  last syllable it is related to, which in turn returns the time of the last phone, etc. *(p.3)*
- Consequence: **algorithms can evaluate the `end` feature on any item and be sure of
  getting a legitimate value without worrying about the details of calculation.** *(p.3)*

Performance caveat and the global-evaluation escape hatch: *(p.3)*
- Although the function feature implementation is very efficient, it can still be expensive
  to constantly evaluate these functions in the middle of a time-critical loop. *(p.3)*
- A **global evaluation facility** is therefore provided which evaluates all the feature
  functions of the items in a relation and **re-writes the features with their
  evaluation**. After the loop these can be **discarded** and the feature functions used
  again — "thus ensuring little chance of out of date information being present." *(p.3)*
  (This is a cache-then-invalidate pattern: materialize, run the hot loop, throw away.)

Other function-feature uses — intonation: *(p.3-4)*
- Intonation accents are typically associated with **syllables**, so one can ask whether a
  syllable is accented. It is also useful to know whether **words** are accented; so a
  function feature is defined on word items which **looks at that word's main stressed
  syllable and returns true if that syllable is accented**. *(p.4)*

### 3.3 Utterances *(p.4)*
- **Utterance structures are collections of relations.** *(p.4)*
- The recommended mental model: an utterance contains an **unordered set of items**, each
  made up from a set of features. **Relations** are then structures comprising **nodes**,
  each of which **indexes into an item**. The utterance structure simply collects these
  together to form a single object. *(p.4)*

### Figure 1 walkthrough — the canonical utterance structure *(p.3)*
Example sentence: **"this is an example"**, shown with two relations. *(p.3)*

- **Syntax relation (top)** — a **tree** with links connecting nodes (drawn as black
  circles); labelled `up` and `down` arcs are shown explicitly. Non-terminal nodes link to
  items carrying a `CAT` feature: `CAT:S` (root), `CAT:VP`, `CAT:NP`. *(p.3)*
- **Word relation (bottom)** — a **list**, with `next` and `previous` arcs. *(p.3)*
- **Items** hold the actual linguistic information and are drawn as rounded boxes; **dotted
  lines show the connections between nodes and items**. *(p.3)*
- The four word items in the figure:

| Item | Features shown |
|------|----------------|
| this | `name: "this"`, `CAT: "pro"` *(p.3)* |
| is | `name: "is"`, `CAT: vb` *(p.3)* |
| an | `name: "an"`, `CAT: art` *(p.3)* |
| example | `name: "example"`, `CAT: noun`, `Focus: +` *(p.3)* |

- Terminal nodes in a syntax tree are **words**, so an additional feature `name` is used
  there (non-terminals need only `CAT`). *(p.3)*
- **The nodes in the word relation are linked to the same items that are linked to the
  terminal nodes in the syntax tree.** This item sharing is the "intersecting relations"
  mechanism — one item, two nodes, two relations, no duplication and no explicit
  cross-stream links. *(p.3)*

## 4. Implementation *(p.4)*

### Language split
- Festival is implemented in **two languages: C++ and Scheme (a variant of Lisp)**. A
  single language would be attractive in principle, but practical language properties
  necessitate the split. *(p.4)*
- Festival is a **run-time system as well as a research platform, so speed is vital**;
  substantial amounts of code must be in a compiled low-level language such as C or C++.
  For particular operations, **such as the array processing often used in signal
  processing, C/C++ is much faster than higher-level alternatives.** *(p.4)*
- But a 100%-compiled system is too restrictive because it prevents essential run-time
  configuration: *(p.4)*
  - **Algorithm experimentation:** trying alternatives in a fully compiled system means
    editing, recompiling, and rerunning. Acceptable for two or three variants, impractical
    for larger numbers, especially when a large set of alternatives must be tried as part of
    an experiment. With an interpreter, changes are made at run time and a simple Scheme
    script can iterate through all the alternatives and produce a table of results. *(p.4)*
  - **Multilinguality:** Festival synthesizes many languages and it would be impossible to
    reconfigure compiled code for each. Any algorithm in any language must be implementable
    **without recompilation of existing code**. *(p.4)*

### Run-time-configurable data structures *(p.4)*
- Because of the no-recompilation requirement, features, items and relations are
  implemented so that **any number of each, with any name, can be used**. *(p.4)*
- **C structs were deliberately avoided**: with fields corresponding to entities such as
  "stress", "end" or "part of speech", the addition of any new feature would require a
  recompilation. *(p.4)*
- Instead: **features are represented by extensible key-value lists. Feature names are
  stored as strings, and efficient functions return the value of a feature given the string
  name.** *(p.4)*
- **The relations in an utterance are also stored as an extensible list**, with strings
  providing access to a given relation. *(p.4)*
- Consequence: **"there is nothing in the C++ architecture which dictates what relations,
  items or features should be called. All items, relations and features are of exactly the
  same type in C++ regardless of what linguistic information they carry. It is only at run
  time that their linguistic function is designated."** *(p.4)* — this is the concrete
  mechanism delivering the theory-neutrality design goal.

### Programmer-expectation lesson (criticism of the authors' own prior work) *(p.4)*
- When designing a complex architecture it is important to account for **the expectations of
  a programmer experienced with the implementation language**. *(p.4)*
- In a previous architecture, **CHATR [3]**, the authors achieved some of the same
  generality and run-time flexibility, but **the C language constructs used were often
  obscure, stretching the language to its very limits.** Even experienced C programmers
  found the system very difficult to program with **simply because much of the code didn't
  look like recognizable C to them.** *(p.4)*
- In Festival, more attention was paid to this, and "the current C++ interface seems fairly
  natural and unobtrusive." *(p.4)*

### File I/O and databases *(p.4)*
- File I/O functions allow **utterance structures to be saved and loaded to and from disk at
  any time in the synthesis procedure**. *(p.4)*
- This proved so useful that **many of CSTR's speech databases (containing phone, word and
  intonation information) are now stored in this utterance format.** *(p.4)*

### 4.1 Core system and modules *(p.4)*
- **A firm distinction is made between the core system and the modules which actually
  perform speech synthesis tasks.** *(p.4)*
- **Core system** — includes the architecture, is written completely in C++, and **doesn't
  change**. *(p.4)*
- **Modules** — can be written in **C++ or Scheme**, and can be **added to or taken away
  from the system with minimal disruption**. (Adding or removing a C++ module requires
  re-linking, but not a major recompilation.) *(p.4)*
- Choice of module language is largely a matter of preference, driven by: *(p.4)*
  - The interpreter aspect makes it **usually easiest to develop modules in Scheme and then
    maybe rewrite them in C++ for efficiency after they are stable**. *(p.4)*
  - Some programming is more natural in one language than the other — **arrays in C++,
    recursion in Scheme**. *(p.4)*
  - Personal experience/preference of the programmer. *(p.4)*
- **As far as possible, identical interfaces to the architecture are provided in both
  languages**, which makes switching between them relatively easy. *(p.4)*

### 4.2 Other languages *(p.5)*
- **Nothing in the design of the system architecture is specific to the languages used.** *(p.5)*
- C++ was used to facilitate better data abstraction in the classes/structures of the
  architecture, but **C could also have been used**. *(p.5)*
- Scheme was chosen for two reasons: (a) it is a **small and clean scripting language**;
  (b) the **Lisp s-expression (bracketed string) data structure allows a generic way to
  store complex data structures**. *(p.5)*
- Other languages would also be suitable; some progress had been made towards alternative
  scripting languages in the style of perl/unix shell and Java. *(p.5)*
- **Ideally the compiled part and the interpreted part would be in the same language.**
  Until recently no available language had this degree of flexibility, but a future
  generation of Festival could perhaps accomplish it using **Java**. *(p.5)*

## The Object Model, Consolidated

| Concept | Definition | Contains | Page |
|---------|-----------|----------|------|
| Utterance | A collection of relations; a single object gathering an unordered set of items plus the relations indexing them | relations, items | p.4 |
| Relation | A set of named links connecting a set of nodes; organizes items into linguistic structures (lists, trees, arbitrary graphs) | nodes | p.2 |
| Node | A purely positional unit; contains no information apart from its links; has exactly one link to an item | links to nodes; 1 link to item | p.2 |
| Item | A bundle of features plus a set of named links to nodes in relations; may belong to any number of relations | features; links to nodes | p.3 |
| Feature | A key-value pair in a list; value may be number, string, complex object, or a **function** | value or function | p.3 |
| Function feature | A feature whose value is a procedure evaluated on access, returning a value as if stored | — | p.3 |
| Module | A synthesis-task unit written in C++ or Scheme, addable/removable with minimal disruption | — | p.4 |
| Core system | The architecture itself, entirely C++, does not change | — | p.4 |

## Named Relations and Features Appearing in the Paper

| Name | Kind | Structure/role | Page |
|------|------|----------------|------|
| Word relation | relation | linear list of word items | p.3 |
| Syntax relation | relation | tree over the same word items plus non-terminals | p.3 |
| Segment relation | relation | the only relation in which time positions are actually stored | p.3 |
| Syllable (implied) | relation | organisational grouping of phones; items often featureless | p.2, p.3 |
| `CAT` | feature | syntactic category (S, VP, NP, pro, vb, art, noun) | p.3 |
| `name` | feature | orthographic/phone name; used on terminal (word) nodes | p.3 |
| `Focus` | feature | focus marking, shown as `+` on the item "example" | p.3 |
| `start` | function feature | returns previous item's `end` | p.3 |
| `end` | function feature | stored on segments; recursive descent on higher units | p.3 |
| `duration` | function feature | `end − start`; agnostic to how `start` is obtained | p.3 |
| accented (word) | function feature | true if the word's main stressed syllable is accented | p.4 |

## Key Equations / Relationships

The paper states no formal equations. The timing identities it relies on are:

$$
\mathrm{start}(i) = \mathrm{end}(\mathrm{previous}(i))
$$
Where: `i` is an item in the segment relation; `previous(i)` is the item linked by the
`previous` link in that linear relation; times are in seconds. Holds only when phones are
"properly contiguous." *(p.3)*

$$
\mathrm{duration}(i) = \mathrm{end}(i) - \mathrm{start}(i)
$$
Where: `end(i)` is the stored end time of segment item `i` and `start(i)` is obtained by
the `start` function feature above; units are seconds. *(p.3)*

$$
\mathrm{end}(n_{\text{nonterminal}}) = \mathrm{end}\big(\mathrm{item}(\text{last terminal node reached by descending } n)\big)
$$
Where: `n` is a non-terminal node in the syntax tree; the `end` function descends via
`down` links until a terminal node is encountered and returns that node's item's `end`
value, which may itself be a function feature (word → last syllable → last phone). *(p.3)*

## Parameters

The paper is an architecture description and reports no numerical parameters, sample sizes,
or effect sizes. The only quantities present are structural.

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Relations an item may belong to | — | count | 2 (in Fig. 1) | 1..∞ ("any number") | p.3 | Words are in the word and syntax relations |
| Features per item | — | count | — | 0..∞ | p.3 | Syllable items often have zero features |
| Timing values per phone needed | — | count | 1 | 1 | p.3 | Sufficient for contiguous segmentations |
| Relations per utterance | — | count | — | extensible list, unbounded | p.4 | Stored as extensible list keyed by string |
| Implementation languages | — | count | 2 | — | p.4 | C++ (core) and Scheme (scripting) |

## Study Design
Not applicable. This is a systems/architecture paper with no empirical study, no
population, no intervention, and no reported measurements.

## Methods & Implementation Details
- Represent an utterance as one object holding an unordered item set plus a string-keyed
  extensible list of relations. *(p.4)*
- Implement relations as node graphs with named links (`next`, `previous`, `up`, `down`);
  nodes carry no data other than links plus one item pointer. *(p.2)*
- Implement items as key-value feature lists with string keys, plus named links back into
  the nodes of the relations they participate in. *(p.3)*
- Look features up by string name via "efficient functions"; do **not** use C structs with
  fixed fields, because adding a field would force recompilation. *(p.4)*
- Allow a feature's value to be a callable; evaluate it on access and return the result
  transparently, so callers cannot tell a stored feature from a computed one. *(p.3)*
- Store time only on segment-relation items; derive every other time by function feature. *(p.3)*
- Provide a global evaluation pass that materializes all function features in a relation
  into plain stored features before a time-critical loop, then discards them afterwards to
  avoid staleness. *(p.3)*
- Provide utterance serialization (save/load to disk at any point in the synthesis
  procedure) and reuse the same format as the speech-database format. *(p.4)*
- Keep the core (architecture) in C++ and unchanging; make modules pluggable in C++ or
  Scheme; mirror the architecture API in both languages. *(p.4)*
- Prototype modules in the interpreted language, then optionally rewrite hot ones in C++
  once stable. *(p.4)*

## Figures of Interest
- **Figure 1 (p.3):** An example utterance structure for "this is an example" showing the
  word relation (a list, bottom, with `next`/`previous` arcs) and the syntax relation (a
  tree, top, with `up`/`down` arcs). Nodes are black circles; items are rounded boxes
  containing features (`name`, `CAT`, `Focus`); dotted lines show node→item connections.
  Crucially the same four word items are pointed at both by word-relation nodes and by
  syntax-tree terminal nodes, illustrating intersecting relations.

## Results Summary
No experimental results are reported. The claimed outcome is qualitative: the formalism
meets the introduction's design goals — complex relations, feature structures in items,
function features, speed, and a natural programmer interface. *(p.5)*

## Limitations
- **Function-feature evaluation cost:** although efficient, constantly evaluating function
  features inside a time-critical loop can still be expensive; the global evaluation
  facility is a workaround rather than a removal of the cost. *(p.3)*
- **Two-language split is a compromise, not a preference:** ideally the compiled and
  interpreted parts would be the same language; no available language then had that
  flexibility (Java is floated as a possible future route). *(p.5)*
- **Adding or removing a C++ module still requires re-linking** (though not a major
  recompilation). *(p.4)*
- **Architecture design is explicitly declared unsolved:** "we acknowledge that architecture
  design is never a solved problem. As the standard of the architecture increases, so do
  the demands and expectations of the programmers using it, and hence new design features
  are always required." *(p.5)*
- No quantitative evaluation of speed, memory, or developer productivity is given despite
  speed being a stated design goal.

## Arguments Against Prior Work
- **Against string rewriting (MITalk [1], CSTR Alvey [5]):** the string becomes unwieldy
  with all symbol types mixed together; direct symbol interpretation obstructs the
  algorithm; parsing per module call is wasteful and breeds per-module private data
  structures; and the standard mitigation — deleting "inessential" information such as
  orthography after G2P — destroys data later modules may need. *(p.1-2)*
- **Against MLDS/streams (Delta [6], Chatr [3], Bell Labs [7], Polyglot [4], early Festival
  [2]):** linearity makes trees very hard to represent; stream proliferation makes
  co-indexing hard; edge alignment forces "holes" for items with no counterpart (pauses);
  centre linking forces an explosion of explicit links and, in practice, partially connected
  streams that confuse module authors; and single-valued items force artificial names on
  organisational units like syllables. *(p.2)*
- **Against fixed C structs for linguistic features:** any new feature forces a
  recompilation, which is fatal for multilingual reconfiguration and for large-scale
  algorithm experimentation. *(p.4)*
- **Against their own prior CHATR [3] C implementation:** the generality was achieved by
  stretching C to its limits with obscure constructs, so even experienced C programmers
  found the code unrecognizable and hard to work with. *(p.4)*

## Design Rationale
- **Why graphs instead of lists:** trees (syntax, prosodic structure) are first-class
  linguistic objects; forcing them into streams was the root defect of MLDS. *(p.2)*
- **Why nodes are separate from items:** separating *position* (node, link-only) from
  *content* (item, features) lets one item be indexed from several relations at once,
  which is what eliminates both the hole problem and the link explosion. *(p.2-p.3)*
- **Why items may hold zero features:** organisational units (syllables) genuinely carry no
  intrinsic name; forcing one is redundant and breaks when the phone inventory changes. *(p.2-3)*
- **Why function features:** the no-redundancy design goal. Derived quantities (start,
  duration, word end, word accentedness) are computed rather than copied, so nothing can go
  stale. *(p.1, p.3)*
- **Why all times live on the segment relation only:** a single stored value per contiguous
  phone fully determines the segmentation; everything else is derivable. *(p.3)*
- **Why the same key can host different functions on different item types:** callers can
  evaluate `end` on any item and be guaranteed a legitimate value without knowing the
  calculation, which keeps algorithms polymorphic across linguistic levels. *(p.3)*
- **Why string-keyed extensible lists rather than structs:** run-time configurability
  without recompilation, which in turn delivers theory neutrality and multilinguality. *(p.4)*
- **Why a compiled core plus an interpreter:** compiled speed where it matters (array/signal
  processing), interpreted flexibility for experiment sweeps and per-language
  configuration. *(p.4)*
- **Why identical APIs in both languages:** so a module can migrate from Scheme prototype to
  C++ production with minimal friction. *(p.4)*
- **Why the interface must look idiomatic:** the CHATR lesson — generality bought with
  unidiomatic language constructs costs adoption. *(p.4)*

## Testable Properties
- Any item reachable in an utterance must return a legitimate value for the `end` feature,
  regardless of which relation or linguistic level it belongs to. *(p.3)*
- For contiguous segments, `start(i)` must equal `end(previous(i))`. *(p.3)*
- `duration(i)` must equal `end(i) − start(i)`, and must be correct whether `start` is
  stored or computed. *(p.3)*
- Storing exactly one timing value per phone must be sufficient to reconstruct all
  segmentation timing. *(p.3)*
- An item must be addressable from every relation it participates in, and editing it must be
  visible from all of them (no duplicated copies to desynchronize). *(p.2-3)*
- Adding a new feature name or a new relation name must require no recompilation of the
  core. *(p.4)*
- Adding or removing a Scheme module must require no recompilation or re-linking; a C++
  module requires re-linking only. *(p.4)*
- Global evaluation of a relation's function features, followed by discarding the
  materialized values, must leave subsequent reads equal to fresh function evaluations. *(p.3)*
- An utterance saved to disk and reloaded must be equivalent to the original at any point in
  the synthesis procedure. *(p.4)*
- Items with zero features must be legal. *(p.3)*

## Relevance to Project

This is the canonical reference for **how to structure the linguistic side of a
formant/source-filter TTS pipeline**, and it maps directly onto a front-end design.

- **The utterance representation is the deliverable.** For a Klatt-style synthesizer the
  natural relation set is: Token → Word → Syllable → Segment (phone) → Intonation/Target,
  with the Segment relation as the single owner of time. Everything the formant synthesizer
  consumes (per-frame F0 and formant targets) can then be expressed as function features
  over the segment relation instead of a second, divergent parameter track.
- **The "time lives in exactly one relation" rule is directly actionable.** A Klatt front
  end typically has durations at phone level and pitch targets at syllable/phrase level;
  Festival's discipline says store phone end times only and derive syllable, word and
  phrase times, which removes the classic bug where a duration model updates phone times
  and leaves word boundaries stale.
- **Function features are a caching/invalidation design.** The global-evaluation facility
  (materialize a relation's function features, run the time-critical loop, discard) is
  exactly the pattern needed when the parameter-generation loop runs at frame rate
  (typically every 5 or 10 ms) and cannot afford per-access recomputation.
- **Intersecting relations solve the syllable/phone/word alignment problem** that any
  prosody module hits, without the "holes" a pause creates in a stream-based design. A
  pause is a segment item with no syllable node; nothing else needs a placeholder.
- **Theory neutrality via string-keyed features** is the mechanism for supporting more than
  one intonation theory (ToBI-style autosegmental labels, Fujisaki parameters, direct F0
  targets) in the same engine without changing the core.
- **The core/module split with a compiled core and a scripted module layer** is a
  transferable structure: keep the DSP (formant filter bank, glottal source) compiled, keep
  the letter-to-sound rules, lexicon lookup, duration rules and intonation rules in the
  configurable layer.
- **The utterance file format doubling as the speech-database format** is a practical tip
  for building rule/parameter training data for a formant synthesizer.
- **Historical positioning:** this paper explicitly places MITalk (the direct ancestor of
  Klatt-style formant synthesis) and the CSTR Alvey synthesizer in the string-rewriting camp
  it is arguing against, which is useful context when deciding how much of a classic formant
  system's front-end structure to keep.

## Open Questions
- [ ] What is the concrete C++ class hierarchy for `EST_Utterance`, `EST_Relation`,
      `EST_Item` and `EST_Features`? The paper deliberately omits low-level details ("we will
      not go into the actual low level details of our implementation here", p.4) and points
      to the system documentation [2].
- [ ] How are relations *created and populated* by modules? The paper describes the data
      model but gives no API for building a relation or attaching an item to a second
      relation.
- [ ] What is the cost model for function-feature evaluation? No timings are given, so the
      threshold at which the global evaluation facility pays for itself is unknown.
- [ ] How is the module execution order determined (a fixed pipeline, a dependency graph, a
      configurable list)? The paper says modules are added and removed with minimal
      disruption but never states how they are sequenced.
- [ ] What happens to a function feature whose recursive descent hits an item that is not in
      the expected relation (e.g. a pause word with no syllables)? No error semantics are
      given.
- [ ] Is there a schema or validation mechanism for feature names, or is it entirely
      convention? String keys with no compile-time checking imply the latter.
- [ ] The paper says "any graph structure is allowed," but only lists and trees are
      exhibited. Are cyclic or multiply-rooted relations actually supported by the traversal
      functions?

## Related Work Worth Reading
- **Hertz (1990), the delta programming language** [6] — the canonical multi-level data
  structure system Festival is arguing against; needed to understand the stream/hole
  problem first-hand. *(Already in this collection as Hertz_1992_NucleusBasedTiming for the
  related timing work.)*
- **Black & Taylor (1994), CHATR: A generic speech synthesis system** [3] — the authors'
  own prior architecture, whose C-language ergonomics failure motivated Festival's design.
- **Black & Taylor (1997), The Festival Speech Synthesis System: system documentation**,
  HCRC/TR-83 [2] — the actual API and low-level details this paper omits.
- **Allen, Hunnicutt & Klatt (1987), From Text to Speech: the MITalk System** [1] — the
  string-rewriting archetype and the direct ancestor of Klatt formant synthesis.
- **Sproat & Olive (1994), A modular architecture for multilingual text-to-speech** [7] —
  the Bell Labs MLDS architecture, the main contemporary alternative.
- **Campbell, Isard, Monaghan & Verhoven (1990), Duration, pitch and diphones in the CSTR
  TTS system** [5] — the Alvey synthesizer, cited as a string-rewriting system.
- **Boves (1991), Considerations in the design of a multi-lingual text-to-speech system**
  [4] — Polyglot; the multilinguality-driven architecture argument.

## Collection Cross-References

### Already in Collection
- [From Text to Speech: The MITalk System](../Allen_1987_MITalk_TTS/notes.md) - cited [1] as the string-rewriting archetype this paper argues against, and the direct ancestor of Klatt-style formant synthesis
- [The Delta Programming Language: An Integrated Approach to Non-Linear Phonology, Phonetics, and Speech Synthesis](../Hertz_1987_DeltaNonLinearPhonology/notes.md) - cited [6] as the canonical multi-level data structure (MLDS) system Festival's intersecting-relations formalism is designed to replace; source of the edge-alignment/hole problem this paper solves

### New Leads (Not Yet in Collection)
- A.W. Black, P. Taylor (1997) - "The Festival Speech Synthesis System: system documentation," HCRC/TR-83 - contains the low-level C++ implementation details (EST_Utterance, EST_Relation, EST_Item classes) this paper deliberately omits
- A.W. Black, P.A. Taylor (1994) - "CHATR: A generic speech synthesis system" - the authors' own prior architecture, criticized here for C constructs so obscure that experienced programmers found the code unrecognizable
- L. Boves (1991) - "Considerations in the design of a multi-lingual text-to-speech system" - Polyglot; the multilinguality-driven architecture argument cited as prior MLDS work
- W.N. Campbell, S.D. Isard, A.I.C. Monaghan, J. Verhoven (1990) - "Duration, pitch and diphones in the CSTR TTS system" - the Alvey synthesizer, cited as a string-rewriting system
- R. Sproat, J. Olive (1994) - "A modular architecture for multi-lingual text-to-speech" - the Bell Labs MLDS architecture, the main contemporary alternative to Festival's design

### Supersedes or Recontextualizes
- (none)

### Cited By (in Collection)
- [Issues in Building General Letter to Sound Rules](../Black_1998_LTS_Rules/notes.md) - cites "Black, Taylor, and Caley, The Festival speech synthesis system, 1998" (the contemporaneous system-documentation citation for the same architecture this paper describes)

### Conceptual Links (not citation-based)
- [The Blizzard Challenge – 2005: Evaluating corpus-based speech synthesis on common datasets](../Black_2005_BlizzardChallenge2005/notes.md) - Black and Tokuda (same author group) distribute Challenge phonetic labels as a "Festival Utterance structure (heterogeneous relation graph)," using the exact item/relation formalism this paper describes as the direct mechanism for the common-dataset protocol.

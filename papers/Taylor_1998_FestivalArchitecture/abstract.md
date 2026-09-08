# Abstract

## Original Text (Verbatim)

We describe a new formalism for storing linguistic data in a text to speech system.
Linguistic entities such as words and phones are stored as *feature structures* in a
general object called an linguistic *item*. Items are configurable at run time and via the
feature structure can contain arbitrary information. Linguistic *relations* are used to
store the relationship between items of the same linguistic type. Relations can take any
graph structure but are commonly trees or lists. Utterance structures contain all the items
and relations contained in a single utterance. We first describe the design goals when
building a synthesis architecture, and then describe some problems with previous
architectures. We then discuss our new formalism in general along with the implementation
details and consequences of our approach.

---

## Our Interpretation

Prior text-to-speech architectures stored an utterance either as a rewritten string or as a
set of parallel linear streams, and both forced information loss, redundant copies, or
awkward cross-stream co-indexing that could not express trees. Festival separates
positional *nodes* (which carry only links) from content *items* (feature structures), lets
one item be indexed from any number of *relations* that may be lists, trees or arbitrary
graphs, and computes derived values such as start time and duration through *function
features* so nothing is duplicated or stale. For a formant/source-filter synthesizer this
supplies a proven front-end data model: store phone times on a single segment relation,
derive every higher-level time, and keep intonation theory choices in run-time string-keyed
features rather than compiled structures.

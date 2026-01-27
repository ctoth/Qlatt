# Abstract

## Original Text (Verbatim)

This paper describes the Kestrel text normalization system, a component of the Google text-to-speech synthesis (TTS) system. At the core of Kestrel are text-normalization grammars that are compiled into libraries of weighted finite-state transducers (WFSTs). While the use of WFSTs for text normalization is itself not new, Kestrel differs from previous systems in its separation of the initial tokenization and classification phase of analysis from verbalization. Input text is first tokenized and different tokens classified using WFSTs. As part of the classification, detected semiotic classes – expressions such as currency amounts, dates, times, measure phases, are parsed into protocol buffers (https://code.google.com/p/protobuf/). The protocol buffers are then verbalized, with possible reordering of the elements, again using WFSTs. This paper describes the architecture of Kestrel, the protocol buffer representations of semiotic classes, and presents some examples of grammars for various languages. We also discuss applications and deployments of Kestrel as part of the Google TTS system, which runs on both server and client side on multiple devices, and is used daily by millions of people in nineteen languages and counting.

---

## Our Interpretation

Kestrel solves a critical TTS problem: correctly converting raw text (numbers, dates, abbreviations, currency) into readable words, which Google discovered is essential for voice quality perception. The paper's main insight is separating text analysis into two phases (tokenization+classification produces structured data, then verbalization consumes that data in language-appropriate order) rather than combining both in one expensive FST, avoiding the cost of branching paths that must "remember" how to reorder elements like currency symbols. Deployed in production across 19 languages, Kestrel demonstrates that text normalization—historically ignored as unsexy compared to synthesis—is worth careful engineering because TTS systems that misread "$4.5 million" as "four point five dollars million" immediately sound incompetent regardless of voice quality.


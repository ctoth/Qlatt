# Beyond CMU Dictionary: Investigation Notes

## Goal
Investigate how to improve Qlatt's pronunciation system beyond the CMU dictionary lookup, leveraging our paper library, declarative frontend rules, and state-of-the-art G2P approaches.

## What "done" looks like
- Clear understanding of current CMU dict limitations in our system
- Inventory of relevant papers we already have
- Survey of alternative/supplementary approaches (rule-based, neural, hybrid)
- Concrete recommendations for what to implement

## Scouts Dispatched
1. `scout-current-g2p` - How CMU dict is used, what rules exist, gaps
2. `scout-paper-g2p-inventory` - What papers we have that inform pronunciation
3. `scout-g2p-alternatives` - Web research on modern G2P approaches

## Progress
- [x] Scout reports received (all 3)
- [x] Synthesis of findings
- [ ] Q's decision on approach

## Key Findings Summary

### Current system (scout-current-g2p.md)
- CMU dict: 135k entries, 4MB JSON, works great for words it has
- Fallback `guessPronunciation()`: ~192 lines of naive char-by-char scanning, <50% accuracy
- Known bugs: th always voiced, no silent-e, no stress, no -tion/-sion
- Text normalization: only handles numbers 0-99
- Declarative frontend does ZERO g2p — purely phoneme-to-parameter

### Paper inventory (scout-paper-g2p-inventory.md)
- Elovitz 1976: 329 LTS rules, 90% accuracy, fully specified in our notes
- Hunnicutt 1976: 413 rules + cyclic stress algorithm (only stress algo we have)
- Allen 1987 (MITalk): THE book — Ch.4-6 not fully extracted, highest-value reading target
- Klatt 1987: G2P pipeline diagram, allophonic rules
- Miller 1998: /t/ allophony (5 variants), function word reduction — biggest naturalness impact

### Alternatives research (scout-g2p-alternatives.md)
- `phonemize` npm: TypeScript, browser-ready, 125k dict, ARPAbet output — but LLM-generated rules
- Elovitz rules: zero weight, ~90% OOV accuracy, C/Perl implementations exist to port from
- Flite CART LTS: 79KB decision graph, trained on CMUdict, includes stress — needs binary format extraction
- Morphological decomposition: low-effort layer that reduces OOV rate significantly
- Neural ONNX: highest accuracy but 5-50MB payload

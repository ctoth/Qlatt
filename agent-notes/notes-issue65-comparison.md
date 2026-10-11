2026-09-08 POS comparison checkpoint
User authorized comparison and selection of Natural, Compromise, and winkNLP; #65 is groomed, #173/#174 filed.
Created isolated investigations/pos-tagger-comparison package and a 72-case diagnostic corpus before any candidate outputs.
Pinned natural 8.1.1, compromise 14.16.0, wink-nlp 2.4.0, web model 1.8.1; dependencies installed without touching root package files.
Next: inspect adapters, score frozen cases, measure browser execution and traceability, choose and update issue. No blocker.
2026-09-08 comparison result checkpoint
Selected Compromise 14.16.0 /two: 67/72 diagnostic broad-class cases, Natural 49/72, wink 63/72 after documented tagset harmonization.
Chrome parity passes 72/72 for each; Compromise bundle 123983 bytes gzip and 0.231ms/warm sentence in this local run.
Pre-tokenized JSON and tag hooks work, but contractions drop ownership and fast/direct writes bypass the hook; production instrumentation remains #65 work.
Report/scripts/raw results and frozen-corpus verifier complete; next update #65 with the concrete selection and revised external-tagger contract. No blocker.

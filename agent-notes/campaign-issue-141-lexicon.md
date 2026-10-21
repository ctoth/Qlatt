# Goal

Remove transcription's import-time/default CMU dictionary load for #141.

# State

Implemented from 0e5ff0f1 after #363 merged. Hosted CI and Claude review are
outstanding; no local CI run.

# Decisions and why

Smallest slice: approximately 60–100 production additions and 30 removals,
plus 80–130 fixture lines and declaration/manifest updates. Existing frontend
resources acquire the selected lexicon through the existing dictionary loader
and caches; TTS passes that map explicitly to transcription. Qlatt declares its
current CMU path, Beauty inherits, and DECtalk keeps its own declared dictionary.
No dictionary relocation, new loader/cache or lazy global replacement.

An absent lexicon means LTS and I_FRONTEND_NO_LEXICON with the selected frontend;
a declared resource that fails to load remains an error. Lookup and compound
membership use the same supplied map; an explicit dictLookup override wins.
The rulepack global, diagnostic helper defaults, source-metadata defaults and
broader resource closure remain subsequent slices; #141 stays open.

# Surprises

The smaller final production diff adds 37 lines and removes 44. Existing
fixtures explicitly select their maps; added cases cover inherited/independent
lexicons, absent lexicon diagnostics, compound lookup and override behavior,
and a declared missing resource. English/Beauty manifests include CMU now that
the existing synchronous resource owner records its acquisition.

The resources.lexicon role takes precedence over the existing dictionary_path
alias. Alias migration/reporting remains later work. skip_dictionary previously
only suppressed the absent-map global fallback; absent maps now always take
that same LTS path, while declared maps retain precedence as before.

Transcription still requests the selected frontend's existing resource bundle
for inventory/G2P paths, so declared resources can load even when a caller
supplies an independent lookup override. Full acquisition/execution separation,
the rulepack import-time load and source ownership comparisons remain open.

# Next step

Publish for hosted CI and Claude review; respond to findings within this slice.

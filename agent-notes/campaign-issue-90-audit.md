# Goal
Report authored citation metadata coverage for #90 without changing runtime schemas or resolving citation prose.

# State
Implemented script and focused fixture from d9a17b2d. No local CI or audit execution; hosted CI will execute the fixture.

# Decisions and why
Smallest change: roughly 80–110 script lines and 35–50 focused fixture lines. Reuse tracked-file enumeration and parseYamlString. Count authored rules, realization entries and templates separately, parameters, top-level constants, primitives and nodes. Constants are raw CEL values: a literal citations key is never metadata. Preserve string realization entries as having no metadata slot. Report present/absent/invalid/no-slot with exact file and path; do not infer citations from comments or source kinds from prose. No inherited/generated count inflation, historical 740 comparison, paper reads, runtime changes or CI gate.

# Surprises
None.

# Next step
Publish, inspect hosted CI and obtain private full-range Claude review. Root owns merge.

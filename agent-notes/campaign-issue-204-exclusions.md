# Goal
Finish #204's target-feature exclusion declaration using the owning inventory, without changing materialization or base parameter seeding.

# State
Implemented on 907a93a1. Active command `npx vitest run test/inventory-conventions.test.ts test/inventory-phonology.test.ts` passed. Claude's two-pass review returned no findings and supervisor verified the gate. No broad local CI runs; replacement hosted checks pending.

# Decisions and why
Smallest change: required copied `target_feature_exclusions` string array on InventorySpec, allowing explicit []; declare [dur, SW, type] in each bundled inventory; replace only the schema-inference literal exclusion with a Set lookup. About 15–22 production lines, three declarations, one raw fixture update, 45–65 focused test lines and a short existing documentation update. The phonology whitelist and materializer stay unchanged. Existing fixtures inherit bundled inventories except the raw voice in inventory-phonology.test.ts. Other agents own adjacent resource imports and affect calls; preserve their work.

# Surprises
Tests verify all three bundled declarations, changed and empty exclusion lists through the public frontend, unchanged complete tracks and materialization, and preserved F1/SW base schema despite exclusion. Missing/non-array/invalid string entries are rejected by inventory loading. The sole raw voice fixture now supplies the declaration; fixtures spreading bundled inventory data inherit it.

# Next step
Push the metadata-only CI correction and await final hosted checks. This completes the exclusion acceptance; #350 supplied transition defaults and #353 supplied cited rate defaults, explicit override preservation and wrapper omission. Supervisor must verify the full #204 acceptance and final checks before merge/closure.

# Review response
Acknowledged Claude's no-findings review. Hosted test job119057519432 found the report's inventory SHA stale after adding the declaration. Verified scripts/generate-formants-from-area.ts62-64 hashes raw inventory text after CRLF-to-LF normalization; the same read-only hash calculation produced c57ccb86a5fb3c0a1c83b5fd591a9173596830ca132913177cdab31f70121539. Updated only that report metadata line, preserving all numeric comparisons and generated YAML. No local CI rerun.

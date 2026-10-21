# Goal
Finish #204's target-feature exclusion declaration using the owning inventory, without changing materialization or base parameter seeding.

# State
Implemented on 907a93a1. Active command `npx vitest run test/inventory-conventions.test.ts test/inventory-phonology.test.ts` passed. No broad local CI runs; hosted checks and independent Claude review pending.

# Decisions and why
Smallest change: required copied `target_feature_exclusions` string array on InventorySpec, allowing explicit []; declare [dur, SW, type] in each bundled inventory; replace only the schema-inference literal exclusion with a Set lookup. About 15–22 production lines, three declarations, one raw fixture update, 45–65 focused test lines and a short existing documentation update. The phonology whitelist and materializer stay unchanged. Existing fixtures inherit bundled inventories except the raw voice in inventory-phonology.test.ts. Other agents own adjacent resource imports and affect calls; preserve their work.

# Surprises
Tests verify all three bundled declarations, changed and empty exclusion lists through the public frontend, unchanged complete tracks and materialization, and preserved F1/SW base schema despite exclusion. Missing/non-array/invalid string entries are rejected by inventory loading. The sole raw voice fixture now supplies the declaration; fixtures spreading bundled inventory data inherit it.

# Next step
Publish for hosted CI and Claude review. This completes the exclusion acceptance; #350 supplied transition defaults and #353 supplied cited rate defaults, explicit override preservation and wrapper omission. Supervisor must verify the full #204 acceptance and final checks before merge/closure.

# Goal
Remove global VQ data acquisition and thread selected channels through existing consumers for #141.

# State
Implemented from d8308238 after #355 merged. Preparing PR for hosted CI and Claude review; no local CI run.

# Decisions and why
- Smallest coherent change: roughly 220-350 production lines plus existing fixtures. Use one cached composite per VQ path containing parsed channels and Rd policy; retain the existing rdPolicy member.
- Existing channel parser, delta algebra, direction schema, parser, lowering and standalone projection receive selected channels. No new schema framework, registry, cache or relocation.
- Validate existing preset channel membership against selected channels even when the structural preset library is cached.
- An absent VQ role is allowed until a delta consumer needs it. No-delta lowering uses identity timing and skips affect projection, preserving DECtalk voice/stress/break paths.
- Preserve arithmetic, precedence and provenance. Other agents may modify adjacent inventory/schema/rate regions; do not revert their changes.

# Surprises
Wrapping the existing direction schema in a factory changes its indentation, increasing textual production diff beyond the logical 220-350-line estimate without adding another schema mechanism. Existing import-rejection fixtures now validate supplied documents explicitly. The selected-channel regression retains add/multiply projections through both actual consumers, and adds cached-preset membership and DECtalk no-delta/missing-role coverage. DECtalk's manifest no longer lists the removed global VQ import dependency.

Source inspection found that the preexisting unconditional neutral affect object also made the F1/F2/F3 clamp run on no-delta paths. With supervisor verification, moved that existing clamp outside the optional affect branch, preserving its exact thresholds and diagnostic. The existing lowering fixture now covers no-channel/no-delta clamp behavior.

# Next step
Publish PR and inspect hosted CI; respond to independent Claude review. #141 remains open for relocation and remaining resource ownership.

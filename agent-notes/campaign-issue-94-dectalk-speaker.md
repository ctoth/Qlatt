# Goal

Remove twelve duplicate DECtalk speaker-policy leaves and correct the audit's speaker section for partial #94 cleanup. Estimate: 37 YAML lines deleted, two stale comments corrected and 10-20 audit lines changed plus unused helper deletion.

# State

Isolated branch starts at 6bcd3fb9. The shipped nine-voice registry supplies F0 minimum, scale and filter values; resolved profile supplies base F0. The configured duplicate policy values do not reach those readers. The audit script is a real remaining reader of the obsolete block.

# Decisions and why

Report the actual declared registry directory, default and voice count in the audit, and remove its obsolete no-roster claim. Delete its sole-use numeric policy helper. Preserve other audit findings, all live voice/profile/model values, and runtime fallback behavior for custom frontends. No new tests or local CI; hosted existing checks own validation.

# Surprises

None.

# Next step

Scoped edits complete. No local tests or CI steps run. Commit and publish for hosted CI and Claude review. Supervisor owns merge; #94 stays open.

Record each initial inventory target selection with the input phone/stress, selected key, source Token and Segment identity, inventory citation, and pronunciation ancestry. Preserve normalization aliases and secondary-stress projection records.

Replace pronunciation and invalid inventory parameter console warnings with structured diagnostics, aggregated per run. Keep token ranges inclusive of materialization writes when selection records precede them.

Closes #161

Validation:
- `pwsh -NoProfile -File build.ps1`
- `npm test`
- `npm run check`
- `npm run typecheck`
- `npm run build`
- `cargo test -p lf-source`

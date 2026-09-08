# Source contour projection

The frontend's `source_contour_path` selects the YAML policy that resolves voice
quality and projects it onto Segment targets before final frame lowering.
`projection` is required; an empty list disables source projection. Formant
scaling still uses the active inventory's formant keys.

Each row declares a source `field`, a `target_param`, an `op`, and a finite,
unique `order`. Rows run in ascending order; later rows see earlier projected
values. The order numbers express sequencing, not acoustic constants.

| Operation | Behavior |
| --- | --- |
| `baseline_const` | Set the target from the resolved baseline's `field`. |
| `override_or_baseline` | Set from the preset's `field`, or from `baseline_field` when absent. |
| `override_if_set` | Set from the preset's `field` when present, including zero. |
| `override_or_current_plus_baseline` | For a numeric current target, use the preset's `field` or add `baseline_field` to the current value. |
| `current_plus_override_if_set` | Add the preset's `field` when it is present and the current target is numeric. |

Baseline fields are `source_mode`, `rd`, `rd_ref`, and
`spectral_tilt_offset_db`. Preset fields are numeric and open to extension;
`citations` and the pitch control `f0_scale` are not projection operands.
An override field must be declared by at least one preset; other presets can omit
it to retain the operation's fallback behavior.

To add a dimension, declare its numeric value and source citations in the
relevant presets, then add a projection row. The target must be supported by the
frontend inventory and lowering columns to reach frames. Loading a paired
frontend and experiment validates projection targets against the experiment's
expanded parameter declarations, including inherited and formant-bank inputs.

Projection writes use the `speaker_source_projection` transaction with the
`speaker` tag. Their provenance includes the selected source YAML path, its
citations, and parent decisions for source and speaker selection.

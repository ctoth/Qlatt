# Declarative tone association

The English prosody pipeline separates accent assignment, symbolic association,
and F0 realization. Assignment still chooses accent labels, nuclear status and
edge labels. `phases/tone-association.yaml` expands those labels into ordered
Tone Items and links them to canonical HRG bearers. Prosody point recipes select
the resulting tones by role and retain the existing pitch and timing formulas.

This implements ordered association and the star convention from Goldsmith
(1976), Chapter 3, with the no-crossing condition on p. 51. English labels and
alignment recipes follow the cited Pierrehumbert/Ladd/Silverman rules. Spreading
a symbolic tone does not prescribe constant Hz across its bearers.

## Host action

An existing structural rule may contain one `associate_tones` action:

```yaml
associate_tones:
  relation: Tone
  domain: "current.id + ':accent'"
  units: "[current.syllable]"
  tones: "[{'symbol': 'L', 'role': 'lead', 'starred': false}, {'symbol': 'H', 'role': 'peak', 'starred': true}]"
  anchors: "[{'tone': 1, 'unit': 0}]"
  mode: anchored
  association: tone_bearer
  source_association: tones
  tag: tone_association
```

`domain`, `units`, `tones` and `anchors` are CEL expressions evaluated in the
rule's ordinary environment. All other fields are literal strings. The declared
parallel relation must admit one runtime item type with string `symbol`, `role`,
`domain`, boolean `starred` and numeric `index` features. Each tone object has
exactly `symbol`, `role`, `starred`; each anchor has integer `tone` and `unit`
indices. Units must be distinct, existing, active HRG Items in declared order.
Rules require citations and a declared application tag as usual.

`left_to_right` forbids stars and anchors. It maps one-to-one, spreads the final
tone over remaining units, or stacks remaining tones on the final unit.
For example, H L over four units yields H→0 and L→1,2,3; L H L over one unit
links all three tones to unit 0.

`anchored` requires anchors for a nonempty melody, including every starred tone.
Anchors are installed first. The prefix maps outward toward the left; the suffix
maps toward the right. Between successive anchors, gaps map left-to-right.
Within a gap, the final available tone spreads or remaining tones stack on the
final available unit. An empty side uses its adjacent anchor as the fallback.
This gap-completion direction is Qlatt's deterministic host convention, not a
claim that all languages share English tune association. L H* L over five units
with H* anchored at 2 yields L→0,1, H*→2, L→3,4.

Shared endpoints are legal. Decreasing unit indices across successive tones are
crossing links and reject the proposal. Duplicate tone anchors, missing anchors,
invalid items and a single empty tier also reject it; two empty tiers succeed.
Floating tones are not supported. Validation occurs before graph writes, emits
an `E_TONE_*` diagnostic on rejection and leaves the attempted transaction
uncommitted. Existing transaction validation owns the atomic commit.

Tone IDs are `source-id:rule-id:tone:index`. Writes, source→tone links and
tone→bearer links participate in ordinary provenance histories and journal replay.
The action is intended to run once for each source/rule in a pipeline execution.

## Point realization

`insert_point` and entries in `insert_points` accept an optional selector:

```yaml
tone:
  association: tones
  role: peak
  bearer: tone_bearer
  within: SylStructure
```

The source's active outgoing `association` links select a tone with the given
role. No match skips that recipe; multiple matches reject it. A selected tone
must have a live bearer link. The point's alignment source must equal that bearer
or descend from it through the optional `within` relation; otherwise realization
rejects with `E_TONE_REALIZATION`. The selector does not retarget an existing
alignment formula to another syllable. Custom melodies must supply matching
point recipes for their roles and alignments.

Each inserted point gets a `realizes_tone` association. Point provenance depends
on the tone's features, source and bearer links, and traversed alignment path,
in addition to the existing formula inputs. Those dependencies lead back to
accent, stress and boundary assignment decisions and their citations.

## Bundled policy and compatibility

`maps.accent_melodies` is the sole symbolic melody inventory for H*, H*+L, L+H*,
H+!H*, H*+H, H+L*, L* and L*+H. Codes contain a symbol with optional star and a
realization role separated by a colon. Downstep remains a realization parameter.
The previous unused `accent-inventory.yaml` has been removed.

The bundled English accent domain is the carrier's canonical syllable, including
structural subsegments. Multiple tones may stack there and realize at different
within-segment times. Initial tones use their segment; phrase/boundary tones use
the punctuation SIL. Existing nuclear grouping, downstep reset, short-segment
alignment, and BI3 phrase-plus-boundary behavior remain unchanged. Beauty shares
the association rules but retains its existing lack of accent assignment;
its edge tones still realize. DECtalk does not run these association rules.

This change does not implement new contour generators (#66), input accent
assignment (#152), or new boundary policy (#153).

`test/hrg-tone-association.test.ts` covers mapping, anchors, malformed inputs and
atomic rejection. `test/tts-tone-association.test.ts` covers all eight labels,
YAML melody authority, short carriers, structural identity, suppressed items,
edge tones, provenance ancestry, invalid alignment and replay.

`test/tone-association-compatibility.test.ts` compares SHA-256 snapshots captured
on clean base `5ad69ccfc6b51a18dfd5c65653ac33695f4f0e8d`. The four phrases are
“The cat sat.”, “Did Bob buy a blue balloon?”, “Gag, gang; go!”, and “sip sip.”,
each through qlatt-english, qlatt-beauty and dectalk-english. All frame fields
except provenance decision IDs are included; all twelve synthesis payloads
match. These are bounded regression controls, not an acoustic quality assessment.

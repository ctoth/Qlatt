# Portable package, resource and artifact contract

Status: normative target for #248, following Q's 2026-10-21 decisions.
This document specifies the contract; it does not claim that package extraction,
portable artifacts or the host adapters below have shipped. Source evidence is
from `f4c406d0169f22f66fe561ed5bff379e3fe72040`.

## Decisions and current implementation

| Subject | Adopted contract | Current implementation / owner |
|---|---|---|
| Pairing | Explicit supported frontend/backend pairs, independent of ownership and id equality. | #76 replaces remaining inference and script maps. |
| DECtalk | One package owns its frontend and both backends; VTM is the default. | Frontend manifest already names `dectalk-vtm`; the server still has a separate map. |
| Dependencies | Discovery supplies one exact selected version per package identity. No consumer version solving. | #76 owns selection; #248 specifies the handoff. |
| Compatibility | Artifact format/version is separate from package version; required capabilities are checked before execution. | #227/#89/#241 implement their consumers. |
| Resources | Standard URLs for placement; declaring-document resolution and separate logical identity. | #78 adapts existing acquisition; #141 owns the frontend closure. |
| Language | Language owns linguistic resources; voice owns acoustic targets/policy; DECtalk retains fidelity replacements. | Adopted in [frontend-model-decisions.md](frontend-model-decisions.md). |

The bundled catalogue now reads `entryPoint` from the frontend manifest
(`rule-pack.ts:988–1042`); it is no longer a three-entry TypeScript path map.
It does not yet implement package dependency or explicit pairing resolution.
`frontend-pairing.ts:31–47` still falls back to matching ids. Backend loading
resolves experiment inheritance and validates prepared data, but uses the global
experiment manifest and `/experiments/<id>` document locations
(`load-experiment-config.ts:91–145`). These are migration inputs, not portable ids.

## Manifest and discovery records

A package manifest is JSON data. It declares no executable plugin entry point.
The following fields are the source-discovery contract; omitted arrays are empty.
All ids and versions are nonempty strings. Versions identify exact releases;
neither version ranges nor a package manager are defined here.

| Field | Type and meaning |
|---|---|
| `id`, `version` | Stable package id and exact package release version. |
| `dependsOn` | Array of `{id, version}` exact package dependencies. |
| `frontends` | Array of owned `{id, entryPoint, artifact?, defaultBackend}` entries. |
| `backends` | Array of owned `{id, graph?, registry?, semantics?, extends?, artifact?}` entries. |
| `supportedPairs` | Array of `{frontend: Endpoint, backend: Endpoint}` explicit supported pairs. |
| `Endpoint` | `{package: string, id: string}`; package must be self or a selected dependency. |
| `entryPoint`, `graph`, `registry`, `semantics`, `artifact` | Resource references as defined below. |
| `extends` | Backend endpoint selected before loading its source documents. |
| `defaultBackend` | Backend endpoint for omitted backend selection, owned by that frontend's declaration. |

The backend-owning package declares the supported pair. It may name a frontend
owned by a dependency even when its own `frontends` array is empty. A dependency
alone grants no compatibility. A frontend's default must be a supported pair;
an explicitly requested unsupported pair fails with `E_SYNTH_PAIRING`, naming
both endpoints, before rendering. There is no id-equality or baseline fallback.
Retain an explicitly selected compatible backend; the default applies only when
the backend is omitted and no selection exists. The target baseline default
moves the existing CLI/server policy into the manifest under #76. Today's
`qlatt-english` harness helper has no default (`frontend-vocabulary.test.ts:81–82`).

An inherited backend may omit documents supplied by its parent. A root source
backend supplies graph, registry and semantics. An artifact-only distribution
may supply `artifact` instead; executing it does not require source documents.
Frontend `entryPoint` names source for compilation, while `artifact` names the
separately checked distribution. No field implies that raw source is checked.

Discovery supplies records `{id, version, baseUrl, manifest}`. `baseUrl` is an
absolute directory URL ending in `/`; manifest paths resolve from that directory.
The selected dependency's version must equal the version named in the requesting
manifest's `dependsOn`. Missing packages or conflicting selected versions fail before loading
dependent entries. Consumers do not choose another version, fetch a substitute,
or silently select a second version under the same id.

The selected records travel with preparation; artifact metadata records the
same identities/versions. Loading an artifact against a different selection is
an incompatibility, not an opportunity to recompile or reinterpret it.

## Resource references and identities

A reference is either a relative URL string or `{package, path}`. A string is
relative to the URL of the document that declares it. An explicit package
reference first selects self/dependency ownership; its `path` is relative to that
package's discovered base URL. References inside the resulting document again
resolve against that document. Neither form invokes a second resolver.

Use standard URL resolution, including `..`, escaping and percent-encoded spaces.
Browser access uses fetch; Node uses filesystem APIs for file URLs and fetch for
HTTP(S). Filesystem entry boundaries use platform path-to-file-URL conversion.
No custom URL scheme, CWD fallback, virtual filesystem or archive is introduced.
Cross-package access names its dependency explicitly rather than escaping a
package directory. Absolute installation URLs belong to discovery/access data,
not authored portable source/citation identities.

Logical resource identity is `{package, version, path}`, where `path` is the
normalized package-relative resource path. It is separate from the physical URL.
Resource roles such as `inventory` or `lexicon` select documents; they do not
replace document identity. Two roles may refer to one document without giving
it two source identities. Moving the base URL changes access, not identity.

An absent optional declaration remains absent. A declared missing resource,
malformed document, permission failure or transport failure is an error with
its cause and declaring owner. An inherited optional document may be absent only
where the existing composition contract expressly permits inheritance.

### Actual reference-bearing surfaces

| Authored field | Reference meaning / owner |
|---|---|
| Manifest entry points, artifact and backend document fields | Discovery selects owner; #78 accesses; #251 composes backend documents. |
| Frontend `extends` | Frontend endpoint selected from self/dependencies before composition. |
| Frontend `include[]` | Document references; #141/#78 preserve declaring ownership through composition. |
| Frontend `resources.*` | Inventory, lexicon, LTS, morphology, stress, speaker/source, VQ and affect documents; #141. |
| `accent_policy_path` | Selected accent policy document; #141. |
| `text_parser.table_path` | Selected parser table; #141. |
| `speakers.dir`, `speakers.definition_path` | Voice document directory and speaker-definition schema; #141. |
| Inventory `phonology_path` | Phonology document relative to the inventory declaring it; #141. |
| Morphology/stress `phonotactics_path` | Nested dependency relative to that policy document; #141. |
| Graph `meta.primitives` (string or array), `meta.semantics` | Authored registry/semantics references; #251 reconciles them with manifest-selected documents. Current Qlatt preparation uses manifest `extends`, not these fields. |

Speaker names select existing entries under the declared voice directory; they
are not arbitrary paths. Ordinary strings, CEL expressions, citation text,
phoneme symbols and map keys are not resource references. Schema-declared
foreign keys remain #227's validation responsibility, not URL rewriting.

Registry `worklet`/`wasm` names currently identify implementations through the
host's core asset loader (`runtime-assets/types.ts:1–5`, browser/node loaders).
They are not frontend-document-relative resources. Portable packages require
registered core kernels; host adapters locate their implementations. Do not turn
these names into per-synthesizer executable plugins during path migration.

Current frontend acquisition binds resource/nested paths before composition
(`rule-pack.ts:170–196`), but includes deliberately retain child-first fallback.
Beauty currently relies on that fallback for inherited phase files. Migration
must make those inherited references explicit under the declaring-owner rule,
preserving selected rules and order; simply changing URL joining is insufficient.
DECtalk, Stevens and Steinecke graphs also name `../klatt80-baseline/registry.yaml`
in `meta.primitives`. #251 must reconcile those existing references with the
manifest-selected registry layers under explicit `qlatt-english` ownership;
portable native consumers must not independently acquire a second closure.

## Three package examples

Paths and release `1.0.0` below are illustrative distribution placements, not
claims about existing published packages. Empty source arrays are shown where
ownership matters. Kernel implementations remain core-owned in every example.

Full DECtalk synthesizer, with both supported backends and an inherited backend:

```json
{
  "id": "dectalk-english", "version": "1.0.0",
  "dependsOn": [{"id": "qlatt-english", "version": "1.0.0"},
    {"id": "english", "version": "1.0.0"}],
  "frontends": [{"id": "dectalk-english", "entryPoint": "frontend/frontend.yaml",
    "defaultBackend": {"package": "dectalk-english", "id": "dectalk-vtm"}}],
  "backends": [
    {"id": "dectalk-vtm", "graph": "vtm/graph.yaml",
      "registry": "vtm/registry.yaml", "semantics": "vtm/semantics.yaml"},
    {"id": "dectalk-english", "extends": {"package": "qlatt-english", "id": "klatt80-baseline"},
      "graph": "klatt/graph.yaml", "registry": "klatt/registry.yaml", "semantics": "klatt/semantics.yaml"}
  ],
  "supportedPairs": [
    {"frontend": {"package": "dectalk-english", "id": "dectalk-english"},
      "backend": {"package": "dectalk-english", "id": "dectalk-vtm"}},
    {"frontend": {"package": "dectalk-english", "id": "dectalk-english"},
      "backend": {"package": "dectalk-english", "id": "dectalk-english"}}
  ]
}
```

Backend-only package with an explicit external frontend pairing target:
the current `klsyn88` vocabulary rejects columns emitted by `qlatt-english`
(`frontend-vocabulary.ts:22–43`); #76/#254 must resolve that before admitting it.

```json
{
  "id": "klsyn88", "version": "1.0.0",
  "dependsOn": [{"id": "qlatt-english", "version": "1.0.0"}],
  "frontends": [],
  "backends": [{"id": "klsyn88", "graph": "graph.yaml",
    "registry": "registry.yaml", "semantics": "semantics.yaml"}],
  "supportedPairs": [{"frontend": {"package": "qlatt-english", "id": "qlatt-english"},
    "backend": {"package": "klsyn88", "id": "klsyn88"}}]
}
```

Inherited package: Beauty owns its pair and declares its source dependencies:

```json
{
  "id": "qlatt-beauty", "version": "1.0.0",
  "dependsOn": [{"id": "qlatt-english", "version": "1.0.0"}, {"id": "english", "version": "1.0.0"}],
  "frontends": [{"id": "qlatt-beauty", "entryPoint": "frontend.yaml",
    "defaultBackend": {"package": "qlatt-beauty", "id": "qlatt-beauty"}}],
  "backends": [{"id": "qlatt-beauty", "graph": "graph.yaml", "registry": "registry.yaml", "semantics": "semantics.yaml"}],
  "supportedPairs": [{"frontend": {"package": "qlatt-beauty", "id": "qlatt-beauty"},
    "backend": {"package": "qlatt-beauty", "id": "qlatt-beauty"}}]
}
```

Its frontend source declares the external parent and inventory override:

```yaml
extends: {package: qlatt-english, id: qlatt-english}
resources:
  inventory: inventory.yaml
include:
  - {package: english, path: normalization/components.yaml}
```

Missing keyed inventory/policy entries inherit under #167/#169; supplied ordered
resources replace their corresponding slot whole, retaining declared
shared-before-variety ordering. It does not introduce per-rule merging.

## Package catalogue

| Package | Owned frontend(s) / backend(s) | Explicit dependencies / supported pairing |
|---|---|---|
| `qlatt-english` | `qlatt-english` / `klatt80-baseline` | `english`; its own pair, target baseline default replacing the current CLI/server policy. |
| `dectalk-english` | `dectalk-english` / `dectalk-english`, `dectalk-vtm` | `qlatt-english`, `english`; both own pairs, VTM default. |
| `qlatt-beauty` | `qlatt-beauty` / `qlatt-beauty` | `qlatt-english`, `english`; its own pair/default. |
| `klsyn88` | none / `klsyn88` | `qlatt-english`; external pair target, currently rejected by vocabulary checks. |
| `stevens91` | none / `stevens91` | `qlatt-english`; inherited baseline and external pair target, preparation currently rejects invalid inherited definitions. |
| `laine88` | none / `laine88` | `qlatt-english`; inherited baseline and external English frontend pair. |
| `steinecke95` | none / `steinecke95` | `qlatt-english`; inherited baseline and external English frontend pair. |
| `english` (language owner) | no synthesizer entries | Shared linguistic resources under the adopted language boundary; not an eighth synthesizer. |

DECtalk directly referencing shared English normalization declares `english`
as well; transitive installation presence does not authorize undeclared access.
The seven rows describe supported composition policy, not historical fidelity.
`test-inherit` remains a core fixture. See [synthesizer-model-audit.md](synthesizer-model-audit.md)
for the Stevens preparation failure and model-specific evidence limits.

## Artifact and compatibility boundary

Each artifact carries `{format, formatVersion, package, dependencies,
requiredCapabilities, resources, sources, payload}`. `format` identifies backend
or checked frontend; `formatVersion` is an integer owned by that format's compiler
and consumer, independent of `{package: {id, version}}`. Dependencies are the
exact selected `{id, version}` records. `requiredCapabilities` is a list of
registered kernel/function capability ids required by the checked program.
Core/consumer owners define those ids from their existing registries; package
authors cannot supply executable implementations to satisfy them.

`resources` is an array of `{identity: {package, version, path}, roles: string[]}`
records for the resolved closure;
discovery/access adapters supply physical locations separately. `sources` keeps
logical document identity, authored node path and one-based exclusive-end spans,
including definition and call-site attribution. Relocation changes no citations,
source-map identities or dependency versions. Authored citation prose remains
unchanged; #90/#224 supply portable catalogs/indexes without requiring `papers/`.

Before allocating audio or executing rules, reject unsupported format/version,
selection mismatch or missing required capabilities. A consumer accepts only
versions it explicitly implements; it does not guess compatibility from package
version, re-run source compilation or fall back to unchecked raw expressions.

The backend payload starts from #251/#252's resolved/prepared graph, registry,
semantics and origins/override records. Preserve nested constant objects, arrays
and null without changing CEL shapes. No source inheritance or macro expansion
runs in the native backend. Preparation and backend consumption do not wait for
the completed frontend compiler or Frame migration.

The frontend payload is #227's checked expression/schema representation consumed
by #241 and exposed to #96. Its exact expression encoding/version belongs to
that coordinated compiler/consumer work, not `dump-spec.ts` output. Current
`CheckedPureExpression` still contains `expression: string`; current backend
`CelExpression` is also a string. Neither fact establishes a portable checked
frontend expression encoding. This contract fixes the envelope and ownership,
not an unimplemented AST encoding or a second compiler.

## Fixture and delivery ownership

| Fixture / remaining delivery | Owner |
|---|---|
| Manifest discovery, exact dependency selection, explicit external pairing, missing dependency, unsupported pair/default | #76 |
| File/HTTP, Windows escaping, browser subpath, changed CWD and relocated package with unchanged source identity | #78 |
| Optional versus malformed/missing declared resources; nested frontend/voice closure; update recorded `resources.json` audit fixtures after relocation (not browser warmup inputs) | #141/#78 |
| Multi-generation inherited references, replacement origins, deterministic plain-data round trip | #251 |
| Expanded graph/semantic binding rejection with authored spans before audio allocation | #252 |
| Backend format/version/capability rejection and resolved bundle execution | #89; all-model conformance #258 |
| Checked frontend format/version/capability rejection, definition/call-site spans and no source compiler at load | #227/#241, with #224 |
| Relocated portable citation catalog and generated effective-spec source identities | #90/#224/#96 |
| Final workspace/package extraction and distribution | #82, after the relevant contract/ownership delivery |

Tests must include full, backend-only and inherited package examples. Missing
dependencies/resources and unsupported versions/capabilities are failures, not
silent alternate selections. Identical prepared data and selected kernels must
retain existing rendering behavior; source-identity checks do not substitute
for audio conformance. These are assignments to existing issues, not new CI gates.

# Lexical stress

Generated morphology and bare LTS pronunciations pass through one lexical-stress stage before inventory materialization. Whole-word dictionary entries, explicit pronunciations and configured clitics keep their established precedence. The English frontends declare `stress_policy_path`; Beauty inherits it, while DECtalk explicitly selects the shared English policy for generated phones. This choice does not claim to reproduce DECtalk's native stress rules.

The model is [Hayes (1982), *Extrametricality and English Stress*](https://brucehayes.org/papers/Hayes1982ExtrametricalityAndEnglishStress.pdf). [Liberman and Prince (1977)](https://languagelog.ldc.upenn.edu/myl/LibermanPrince1977.pdf) supply the metrical background, but their cycle-by-cycle tree erasure is not used. [Hunnicutt (1976)](https://aclanthology.org/J76-4008.pdf) remains the operational morphology/LTS background. The previous count-based implementation, despite its Hunnicutt label, was not a complete implementation of that paper.

## Input and policy

`StressSyllable` carries a stable ID, nucleus, phonological long/short distinction, coda and inherited lexical prominence. Null inherited prominence means unknown; it differs from `unstressed`. `StressDomain` carries a nested, nonshrinking syllable interval, category, affix status, an optional suffix boundary and cited exceptions. `MorphologyCycle` retains phone intervals from the existing affix table, including nested suffixes and shifted prefix/root intervals. Consonant-only suffixes can extend a phone domain without adding a syllable. The existing longest-suffix-first analysis remains authoritative; there is no second suffix list.

`stressPronunciation` converts those phone boundaries to syllable boundaries with the selected policy's phonotactics. A caller with an established phonological analysis can supply `underlying`, `domains`, or a cited `exception`. The ordinary text frontend has no POS/underlying-length oracle: unavailable categories use the policy's explicit noun assumption. This limitation is recorded, not silently described as a noun analysis.

`stress-policy.yaml` declares conditions, operation order, tags and citations. Conditions use the existing CEL evaluator and #47 hygienic macro expansion, including macro citation propagation. Unknown variables, malformed/nonboolean conditions, missing citations, unsupported operation sequences and incompatible phonotactics are rejected. Failed loads are not cached and never fall back to an implicit English resource. The executor provides metrical operations over typed state, not a second expression language.

## Metrical operations and invariants

1. Consonant extrametricality discounts the final consonant for weight. Long Vowel Stressing constructs the final singleton before rhyme/suffix exclusion. Noun or declared adjectival exclusion hides a peripheral constituent without removing its syllables (Hayes, pp. 238–244).
2. The English Stress Rule constructs a right-edge singleton or a left-headed binary foot with a light weak rhyme. It can replace intersecting earlier feet. Strong Retraction feet only unattached material; it does not erase inherited feet (pp. 243–250).
3. Each exclusion records its owner and interval. A stress-affecting extension expires exclusions whose owners are no longer at the right edge. Neutral extensions retain the inner stress domain. Exclusion cannot consume the whole active domain (pp. 235, 269–271).
4. Prestress, sonorant, Arab and poststress destressing remove eligible weak heads; their syllables adjoin leftward, or to the following foot at the left edge. Inherited strong heads are protected unless a permitted redraw replaces them. Binary and singleton deletion have different conditions (pp. 251–264).
5. Late extrametricality hides a final singleton following a branching foot before rightmost-visible-foot prominence. The explicit verbal-affix input permits the American verbal class; unclassified verbal stems are excluded from that adjustment (pp. 273–274). Other foot heads project to secondary prominence.

Foot membership is disjoint; heads remain members of their feet. Unattached peripheral syllables project to unstressed. Decision snapshots copy their feet and exclusion owners so later adjunction cannot change earlier evidence. Domain identities are unique, intervals are bounded, and every emitted decision has citations and a motivation tag.

## Operational limits and fallbacks

Hayes assumes lexical information absent from surface ARPAbet. The implementation exposes these limits rather than claiming a complete predictive grammar:

- The vowel-class table, maximal-onset syllabification, final happy/letter short-vowel interpretation and unknown-category noun default are named engineering assumptions. Acoustic duration is never used as phonological length. Surface AH cannot distinguish schwa from STRUT: the generated `computer` control gets the correct primary but an extra initial secondary. The held-out report retains analogous failures.
- Dictionary stress digits seed singleton feet because the dictionary supplies no internal foot boundaries. This preserves its primary/secondary evidence through neutral morphology, but is an explicit approximation to an underlying cyclic tree.
- Existing forcing affix declarations remain cited exceptions. The last-suffix hint is used only when morphology could not establish a root; it is not represented as a recovered morphological history. Prefix stress neutrality follows the existing prefix concatenation contract and is an engineering assumption.
- Category-specific affix extrametricality requires supplied category/affix information. The existing morphology table does not supply every Hayes category or underlying alternation; ordinary generated forms retain the documented fallback rather than guessing from an independently maintained suffix list.
- Condensation's separately invoked rhythm adjustment (p. 250) is not a new productive operation here. A known lexical pattern can be supplied as a cited exception. The contrast test explicitly tests that route; it is not counted as a predicted derivation.
- Glide vocalization, latent sonorant syllabification, Greek compound bracket erasure, variable word-tree branching and lexical ternary-foot classes are not inferred from surface phones (pp. 254, 261–269). A cited initial metrical checkpoint can represent independently established postcyclic feet. The cursory/creative tests use those checkpoints to test poststress deletion and strong-foot protection; they do not claim to derive the checkpoints from spelling. Otherwise these classes use the same diagnosed surface-input assumptions, or dictionary/explicit exceptions when available.
- Phrase-level grids, Iambic Reversal, vowel reduction and F0/amplitude strength are outside this lexical stage.

## Output, realization and provenance

The metrical result uses `primary`, `secondary`, `unstressed`; ARPAbet serialization emits `1`, `2`, `0`. Existing HRG consumers keep their numeric `stress` representation with the same three values; null remains unknown/nonvocalic. Segment and Syllable both preserve secondary stress. Syllable aggregation orders primary above secondary above unstressed, and a consonant's null cannot erase a nucleus's value. No new competing HRG feature is introduced.

Inventory selection first uses an explicit `*2` target. If absent, a validated `secondary_stress_fallback` must name target 0 or 1 with citations. Bundled inventories explicitly choose target 1 to avoid silently reducing secondary vowels; this is an acoustic engineering choice, not a numeric stress rewrite or a parameter value attributed to Hayes. The frontend emits `stress_inventory_projection` and `STRESS_INVENTORY_FALLBACK` for that choice.

Input assumptions, domain history, inherited feet, each rule attempt, exceptions and final projection form a parent chain under the pronunciation decision. Transcription remaps internal IDs under the actual token identity, so repeated spellings remain distinct. Segment construction depends on that chain and the inventory decision. `STRESS_INPUT_ASSUMPTION` diagnostics expose unavailable input distinctions separately from provenance.

## Regression and evaluation scope

`lexical-stress-contract.test.ts` records phonological inputs, domains, American variants and page references for parental/homonymous, verbal/adjectival coruscate, fraternization/compurgation, compensation/condensation and cursory/creative. It asserts intermediate feet and expiring exclusions where final labels alone could conceal an incorrect derivation. Exception/checkpoint controls are explicitly labeled above.

The [frozen evaluation](lexical-stress-evaluation.md) compares supplied-reference-phone stress separately from dictionary-disabled LTS. It reports primary placement, complete patterns, every failure family, stored reference variants and exact OOV phones. The sample improved reference-phone stress but regressed on the end-to-end stress metrics; richer metrical rules do not repair erroneous LTS phones or missing lexical inputs. No accuracy threshold or improvement guarantee is asserted, and held-out results were not used to tune this implementation.

Existing behavior changes are intentional at the stress boundary: parental and computer use weight-sensitive primary placement; telephone retains final secondary prominence; a forcing employee hint preserves an earlier secondary foot; dictionary secondary stress now chooses the declared acoustic target and survives Syllable construction. Golden audio metrics must therefore be reviewed against the affected secondary-vowel target/lexical consumer, not regenerated merely to hide differences.

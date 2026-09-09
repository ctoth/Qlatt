---
title: "Provenance Semirings"
authors: "Todd J. Green, Grigoris Karvounarakis, Val Tannen"
year: 2007
venue: "PODS 2007 (Proceedings of the 26th ACM SIGMOD-SIGACT-SIGART Symposium on Principles of Database Systems)"
doi_url: "https://doi.org/10.1145/1265530.1265535"
---

# Provenance Semirings

## One-Sentence Summary
Provides a unified algebraic framework based on commutative semirings for computing data provenance, showing that provenance polynomials N[X] are the most general form from which all other provenance notions (lineage, why-provenance, bag semantics, Boolean) can be derived via semiring homomorphisms.

## Problem Addressed
Multiple incompatible notions of data provenance existed (lineage, why-provenance, where-provenance) with no unifying framework. Calculations with annotations were strikingly similar across these notions, suggesting a common algebraic structure. *(p.0)*

## Key Contributions
- Introduces K-relations: relations annotated with elements from a commutative semiring K, with positive relational algebra operations defined algebraically over K *(p.2-3)*
- Shows that provenance polynomials N[X] form the most informative provenance model — all others are homomorphic images *(p.3-4)*
- Extends the framework to Datalog using omega-continuous semirings and formal power series *(p.5-6)*
- Provides algorithms (All Trees, Absorptive Monomial Coefficient) for computing provenance of Datalog queries *(p.7)*
- Demonstrates that incomplete and probabilistic databases are special cases of semiring-annotated relations *(p.7-8)*
- Establishes query containment results for K-relations over distributive lattices *(p.8)*

## Methodology
Annotate each base tuple with a distinct variable from set X. Define relational algebra operations as semiring operations (union = addition, join = multiplication, projection = summation, selection = conditional zeroing). The resulting provenance polynomial in N[X] captures exactly which tuples combined and how. Different provenance notions emerge as homomorphic images of N[X] via specific semiring homomorphisms.

## Key Equations

### K-Relation Definition
$$
R : U^n \to K
$$
Where: R is a K-relation, $U$ is the universe of values, $K$ is a commutative semiring, and only finitely many tuples map to non-zero elements (finite support).
*(p.2)*

### Positive Algebra Operations on K-Relations (Definition 3.2)

**Union:**
$$
(R_1 \cup R_2)(t) = R_1(t) + R_2(t)
$$
*(p.2)*

**Join:**
$$
(R_1 \bowtie R_2)(t_1, t_2) = R_1(t_1) \cdot R_2(t_2)
$$
*(p.2)*

**Projection:**
$$
\pi_V(R)(t) = \sum_{t' : t'|_V = t} R(t')
$$
Where: summation is over all tuples t' whose restriction to attributes V equals t.
*(p.2)*

**Selection:**
$$
\sigma_P(R)(t) = \begin{cases} R(t) & \text{if } P(t) \\ 0 & \text{otherwise} \end{cases}
$$
*(p.2)*

### Provenance Polynomial Evaluation
$$
\text{Eval}_V(P) : N[X] \to K
$$
Where: given valuation $V : X \to K$, $\text{Eval}_V$ is the unique semiring homomorphism extending V from variables to polynomials.
*(p.3)*

### Datalog Fixpoint (omega-continuous semirings)
$$
R^{(i+1)} = R^{(0)} + P(R^{(i)})
$$
Where: $R^{(0)}$ is the base (EDB) relation, $P$ is the immediate consequence operator, and the fixpoint $R^{(\omega)} = \bigsqcup_i R^{(i)}$ exists in omega-continuous semirings.
*(p.5-6)*

### Formal Power Series for Datalog
$$
N_\infty[[X]]
$$
Where: formal power series with coefficients in $N_\infty = N \cup \{\infty\}$, used for provenance of recursive (Datalog) queries. This is omega-continuous.
*(p.6)*

## Parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Tuple annotation variable set | X | - | - | countable | p.3 | One variable per base tuple |
| Semiring | K | - | - | any commutative semiring | p.2 | Must be commutative with 0, 1 |
| Provenance polynomial ring | N[X] | - | - | - | p.3 | Free commutative semiring over X |
| Power series ring | N_inf[[X]] | - | - | - | p.6 | For Datalog provenance |

## Implementation Details

### Semiring Hierarchy (from most to least informative)
All are homomorphic images of N[X]: *(p.3-4)*
1. **N[X]** — provenance polynomials (most general)
2. **Trio(X)** — bag provenance (counting with multiplicity)
3. **Why(X)** — why-provenance (sets of witness sets)
4. **Lin(X)** — lineage (Boolean combinations)
5. **N** — bag semantics (natural number multiplicities)
6. **B** — Boolean (set semantics, tuple present/absent)

### Data Structures Needed
- Semiring interface: elements with +, *, 0, 1 satisfying commutativity, associativity, distributivity *(p.2)*
- K-relation: sparse map from tuple to semiring element (only non-zero entries stored) *(p.2)*
- For Datalog: formal power series representation (potentially infinite sums) *(p.6)*

### Evaluation Strategy
- Annotate each base tuple t_i with a fresh variable x_i *(p.3)*
- Evaluate the query using semiring operations to get a polynomial in N[X] *(p.3)*
- To get a coarser provenance notion, apply the corresponding semiring homomorphism *(p.4)*
- Key property: can evaluate directly in target semiring K, or evaluate in N[X] first then apply homomorphism — same result (Proposition 3.5) *(p.3)*

### Algorithms for Datalog Provenance

**Algorithm: All Trees** *(p.7)*
- Input: Datalog query q, database instance I
- Computes the provenance for every tuple derivable from q on I
- Initializes T(t) for EDB tuples from their annotations
- Iterates: for each rule and each matching of body atoms, multiplies body annotations and adds product to head tuple's annotation
- Terminates when no new derivation trees are found
- Handles infinite provenance via the omega-continuous semiring N_inf[[X]]

**Algorithm: Absorptive Monomial Coefficient** *(p.7)*
- Optimized for idempotent semirings (where a + a = a)
- Input: Datalog query q, database instance I
- Uses BFS-like iteration over rule derivations
- More efficient than All Trees for semirings like Boolean, Why(X), Lin(X)
- Terminates even without omega-continuity requirement

### Extension to Aggregate Queries *(p.5)*
- The semimodule structure extends naturally to aggregate operations
- Aggregation in Datalog can be handled by treating aggregate functions as semimodule operations

## Figures of Interest
- **Fig 1 (p.1):** Sample table and query result — motivating example with R, S, T tables
- **Fig 2 (p.1):** Result of Imilelinski-Lipski computation — Boolean provenance
- **Fig 3 (p.1):** Data provenance example — showing lineage, why-provenance, and polynomial annotations
- **Fig 4 (p.2):** Probabilistic example — tuples annotated with probabilities
- **Fig 5 (p.3):** Why-prov. and provenance polynomials — showing how N[X] subsumes Why(X)
- **Fig 6 (p.4):** Datalog with bag semantics — illustrating semiring operations for recursive queries
- **Fig 7 (p.5):** Datalog example — derivation trees and their provenance
- **Fig 8 (p.7):** Algorithm All Trees — pseudocode
- **Fig 9 (p.7):** Algorithm Absorptive Monomial Coefficient — pseudocode

## Results Summary
- N[X] is the most informative semiring: all other provenance notions factor through it via unique homomorphisms *(p.3-4)*
- The positive relational algebra identities (associativity, commutativity, distributivity, idempotence of union) hold for K-relations over any commutative semiring *(p.2-3)*
- Datalog provenance computation is possible using omega-continuous semirings; the fixpoint exists and is unique *(p.5-6)*
- Query containment for conjunctive queries on K-relations reduces to containment checks for each valuation when K is a distributive lattice *(p.8)*

## Limitations
- Only handles positive relational algebra — negation/difference not covered (requires different algebraic treatment) *(p.0, p.8-9)*
- Formal power series for Datalog do not always define finite objects — omega-continuity is needed *(p.5-6)*
- Practical efficiency of provenance polynomial computation not evaluated experimentally *(p.9)*
- Query containment results limited to distributive lattices *(p.8)*

## Arguments Against Prior Work
- Prior provenance models (lineage by Cui/Widom, why-provenance by Buneman et al.) were defined independently with no unifying framework *(p.0-1)*
- Imielinski-Lipski's conditional tables approach handles incomplete databases but doesn't generalize to bag semantics or full provenance *(p.1-2)*
- Previous work on bag semantics used ad hoc definitions rather than deriving them from an algebraic principle *(p.2)*

## Design Rationale
- Commutative semirings chosen because relational algebra operations naturally correspond to + and * with the right algebraic properties *(p.2)*
- N[X] (free commutative semiring) chosen as the universal object because it allows any other semiring annotation to be recovered via homomorphism — no information is lost *(p.3-4)*
- Omega-continuous semirings required for Datalog because fixpoint computation needs limits of ascending chains *(p.5-6)*
- Formal power series (rather than polynomials) needed for Datalog because recursive derivations can produce infinitely many terms *(p.6)*

## Testable Properties
- For any commutative semiring K, union of K-relations must equal pointwise addition of semiring elements *(p.2)*
- Join of K-relations must equal pointwise multiplication of semiring elements *(p.2)*
- Evaluating a query in N[X] and then applying a homomorphism h to K must give the same result as evaluating directly in K (Proposition 3.5) *(p.3)*
- Positive RA identities (associativity, commutativity, distributivity) must hold for K-relations *(p.2-3)*
- For omega-continuous semirings, the Datalog fixpoint must converge *(p.5-6)*
- Query containment on K-relations for distributive lattice K: q1 contained in q2 iff for every valuation V, Eval_V(q1) <= Eval_V(q2) *(p.8)*

## Relevance to Project
Highly relevant to propstore's provenance tracking. The semiring framework provides the algebraic foundation for tracking how claims combine through derivation chains. Propstore's need to maintain multiple rival normalizations maps to computing in N[X] and projecting to different semirings depending on render policy. The non-commitment principle aligns with keeping the full provenance polynomial rather than collapsing to a coarser notion prematurely.

## Open Questions
- [ ] How to handle negation/difference in propstore's claim derivations (paper explicitly excludes this)
- [ ] Whether omega-continuous semiring machinery is needed for propstore's recursive derivation chains
- [ ] Practical representation of provenance polynomials for large knowledge bases
- [ ] Connection to ATMS assumption sets — both track "which inputs contribute"

## Related Work Worth Reading
- Imielinski and Lipski [18]: conditional tables for incomplete databases — foundational for K-relation approach
- Cui and Widom [10]: lineage definition — one of the provenance notions unified here
- Buneman, Khanna, Tan [5,6]: why-provenance and where-provenance definitions
- Fuhr and Rolleke [14]: probabilistic databases as semiring annotations
- Abiteboul, Hull, Vianu [1]: foundations of databases textbook
- Davey and Priestley [11]: lattice theory background

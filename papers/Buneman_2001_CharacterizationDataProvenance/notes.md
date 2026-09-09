---
title: "Why and Where: A Characterization of Data Provenance"
authors: "Peter Buneman, Sanjeev Khanna, Wang-Chiew Tan"
year: 2001
venue: "ICDT 2001 (LNCS 1973, pp. 316-330), Springer-Verlag Berlin Heidelberg"
doi_url: "10.1007/3-540-44503-X_20"
pages: "316-330"
affiliation: "University of Pennsylvania, Department of Computer and Information Science"
funding: "Digital Libraries 2 grant DL-2 IIS 98-17444; Alfred P. Sloan Research Fellowship (Khanna)"
---

# Why and Where: A Characterization of Data Provenance

## One-Sentence Summary
Introduces the formal why-vs-where distinction for data provenance: why-provenance is the set of source tuples/values whose presence justifies an output value (witness basis), while where-provenance is the location(s) in the source database from which the output value was actually copied; both are characterized syntactically over a deterministic tree data model and a query language DQL, with invariance results under rewriting restricted to appropriate subclasses. *(p.316, p.317, p.329)*

## Problem Addressed
Prior provenance/lineage work [Cui & Widom 2000, Woodruff & Stonebraker 1997] only addressed relational databases and only one intuition of "contributed to"; there was no distinction between the *justification* for a value existing in a view and the *location* from which that value was drawn. The authors argue these are semantically different, that neither was formalized for hierarchical/semistructured data, and that where-provenance (needed to trace error sources and propagate annotations) requires an explicit notion of location absent from the pure relational model. *(p.316, p.317)*

## Key Contributions
- Explicit distinction between **why-provenance** (which parts of the database caused `d` to be in the output — set of witnesses / witness basis) and **where-provenance** (which *location* in the source the value in `d` was actually extracted from). *(p.316, p.317)*
- Uses a *deterministic* edge-labeled tree model (from Buneman, Deutsch & Tan 1999 [ref 6]) that gives every value a unique path identity, so "location" is a first-class concept. *(p.318)*
- Defines a query language DQL (Deterministic QL) with `where ... collect ...` blocks, deep union (⊔), singular expressions, well-formed and well-defined queries; gives a normal form and proves **strong normalization** for the rewrite system 𝓡. *(p.320–322)*
- Formalizes why-provenance via **witness / witness basis / minimal witness basis**; gives a sound and complete procedure Why(t, Q, D) that itself returns a *query* computing the witness basis. *(p.323–325)*
- Proves witness basis invariance under normalization (Lemma 1) and minimal witness basis invariance under equivalent queries with only equality conditions (Theorem 3), extending to some inequality subclasses via homomorphism-based containment [Klug 1988]. *(p.324–326)*
- Shows cascaded/unnested witness computation across views equals direct witness after composition of views (Theorem 4). *(p.326)*
- Formalizes where-provenance via **derivation basis** Γ_{Q,D}(l:v) using augmented path syntax with "%" (edge label reference), identifies the restricted class of **traceable queries** for which where-provenance is preserved under rewriting (Propositions 1–2). *(p.326–329)*
- Demonstrates by example that where-provenance is in general *not* invariant over equivalent queries, motivating the traceable restriction. *(p.327, p.328)*

## Study Design (empirical papers)
*Not applicable — this is a theory paper (formal data model, query language, rewrite system, definitions, lemmas, theorems, propositions). No empirical evaluation, no experiments, no datasets beyond illustrative examples (Composers/Works, Emps, R/S).*

## Methodology
Syntactic-proof-theoretic approach:
1. Adopt a deterministic semistructured tree model where every node has a unique path from the root (l-value analog). *(p.318)*
2. Cast relations, sets, records, arrays, and (approximately) XML as instances of this model. *(p.319, p.320)*
3. Define a query language DQL with a general grammar `e ::= where p ∈ e, …, p ∈ e, condition collect e | e ⊔ e | {e : e} | c | x` and a normal form; restrict to well-formed, well-defined, singular-variable-bound queries. *(p.321)*
4. Characterize why-provenance by *witnesses* (values `s ⊑ D` such that `t ⊑ Q(s)`) and the *witness basis* W_{Q,D}(t) inductively over normal form, proved to equal `Why(t,Q,D)(D)`. *(p.323–325)*
5. Characterize where-provenance via *derivation basis* Γ_{Q,D}(l:v) by tracking variables in the output expression back to patterns in the where-clause and extracting the path pointing at them. *(p.328–329)*
6. Prove invariance results by homomorphism / containment arguments, with explicit class restrictions (well-formed + equality-only → minimal witness; traceable → full where-provenance preservation). *(p.326, p.329)*

## Key Equations / Statistical Models

### Data model: values and paths

$$
v ::= \{x_1{:}y_1, \ldots, x_n{:}y_n\}
$$
Where: `v` is a value, `x_i` edge labels (distinct within a node), `y_i` subvalues. The object is a finite partial function from edge labels to subvalues. *(p.318)*

$$
v(p) = v(x_1.x_2.\ldots.x_n)
$$
Where: `v(p)` is the subvalue reached by following path `p = x_1.x_2.…x_n` from root of `v`; undefined if any label missing. *(p.319)*

### Substructure and deep union

$$
w \sqsubseteq v \iff \mathrm{paths}(w) \subseteq \mathrm{paths}(v)
$$
Where: `paths(v)` is the set of all root-to-constant paths (the *path representation*); `⊑` is substructure. *(p.319, Def. 1)*

$$
v_1 \sqcup v_2 = \text{value } v \text{ with } \mathrm{paths}(v) = \mathrm{paths}(v_1) \cup \mathrm{paths}(v_2)
$$
Where: deep union; undefined if the union fails to be a partial function (i.e. two conflicting values on same path). *(p.319, Def. 2)*

### Query language (DQL) grammar

$$
e ::= \mathbf{where}\; p \in e, \ldots, p \in e,\; \mathit{condition}\; \mathbf{collect}\; e \mid e \sqcup e \mid \{e : e\} \mid c \mid x
$$
Where: `c` ranges over constants, `x` over variables, `p` over patterns (data syntax + variables), `condition` is a boolean predicate on variables. `{e₁:e₁′, …, eₙ:eₙ′}` is shorthand for `{e₁:e₁′} ⊔ … ⊔ {eₙ:eₙ′}`. *(p.321)*

### Normal form query

$$
Q = Q_1 \sqcup \ldots \sqcup Q_m,\quad Q_i = \mathbf{where}\; sp_1 \in D_1, \ldots, sp_n \in D_n,\; \mathit{condition}\; \mathbf{collect}\; se
$$
Where: each `sp_i` is a *singular* pattern, `se` is a *singular* expression, `D_i` is a database constant (not a subquery). *(p.320 Fig.2b, p.322 Def. 5)*

### Witness basis (normal form case)

$$
W_{Q,D}(t) = \{\llbracket p_0\rrbracket_\psi \sqcup \ldots \sqcup \llbracket p_n\rrbracket_\psi \mid \psi \in \Psi,\; t = \llbracket e \rrbracket_\psi\}
$$
Where: `Q = {e | p₀ ∈ e₀, …, pₙ ∈ eₙ, condition}` in normal form with each `eᵢ` a database constant, `Ψ` = valuations making the where-clause hold with `⟦e⟧_ψ = t`, `⟦p⟧_ψ` is the pattern instantiated by ψ. For a union query `Q = Q₁ ⊔ … ⊔ Qₙ`: `W_{Q,D}(t) = W_{Q₁,D}(t) ∪ … ∪ W_{Qₙ,D}(t)`. *(p.324, Def. 6)*

### Witness basis (general well-formed case)

$$
W_{Q,D}(t) = \{P_1 \sqcup P_2 \mid \psi \in \Psi,\; t \sqsubseteq \llbracket e\rrbracket_\psi,\; P_1 = \llbracket p_0^1\rrbracket_\psi \sqcup\ldots\sqcup\llbracket p_k^1\rrbracket_\psi,\; P_2 = w_1 \sqcup \ldots \sqcup w_m \text{ where } w_i \in W_{\psi(e_i^2),D}(\llbracket p_i^2\rrbracket_\psi)\}
$$
Where: partition patterns of `eᵢ` in the where-clause into `S₁ = {pᵢ | eᵢ is database constant D}` (giving `p₀¹,…,pₖ¹`) and `S₂ = {(pᵢ,eᵢ) | pᵢ is matched against a subquery eᵢ}` (giving `(p₀²,e₀²),…,(p_m²,e_m²)`). *(p.324)*

### Compound-value witness basis

$$
W_{Q,D}(t) = \{w_1 \sqcup \ldots \sqcup w_m \mid w_i \in W_{Q,D}(t_i)\},\quad t = t_1 \sqcup \ldots \sqcup t_m
$$
Where: each `tᵢ` singular; compound witness basis is the product of singular witness bases. *(p.324)*

### Why procedure (returns a query)

```
Algorithm Why(t, Q_i, D):
  Let Δ  denote the "where" clause of Q_i.
  Let Δ' denote the deep union of patterns in Δ.
  if there is a valuation ψ from e_i to t then
    return the query "where ψ(Δ) collect ψ(Δ'):C"
    (For simplicity, we did not serialize the output expression on the edge.)
  else
    return no query
  end if
```
`Why(t, Q, D) = Why(t, Q_1, D) ⊔ … ⊔ Why(t, Q_n, D)`. *(p.325)*

$$
\text{Theorem 2 (Soundness \& Completeness): } W_{Q,D}(t) = \mathrm{Why}(t, Q, D)(D)
$$
Where: for `Q` in normal form and `t` singular in `Q(D)`. *(p.325)*

### Minimal witness

$$
s \text{ is a } \textit{minimal witness} \text{ for } t \text{ w.r.t. } Q \iff \forall s' \sqsubset s,\; t \not\sqsubseteq Q(s')
$$

$$
M_{Q,D}(t) = \text{maximal subset of } W_{Q,D}(t) \text{ such that } \forall m \in M_{Q,D}(t),\; \nexists w \in W_{Q,D}(t).\; w \sqsubset m
$$
Where: `M_{Q,D}(t)` is the minimal witness basis. *(p.325, Def. 7)*

### Invariance theorems

$$
\text{Theorem 3: } Q \equiv Q' \text{ (equality-only conditions, well-formed)} \Rightarrow M_{Q,D}(t) = M_{Q',D}(t)
$$
*(p.325)*

$$
\text{Theorem 4 (Unnesting): } W_{Q',D}(t) = \{w \sqcup w' \mid (w \sqcup v') \in W_{Q,\{D, V(D)\}}(t),\; v' = V(D),\; w' \in W_{V,D}(v')\}
$$
Where: `Q'` is the rewritten query via 𝓡 with view `V` "composed out". *(p.326)*

### Where-provenance: derivation basis (normal form)

$$
\Gamma_{Q,D}(l{:}v) = \{(\llbracket p_0\rrbracket_\psi \sqcup \ldots \sqcup \llbracket p_n\rrbracket_\psi,\; S) \mid \psi \in \Psi,\; S = \{\psi(p_i').p'' \mid p_i' \text{ is the path that points to variable } x_\psi \text{ in pattern } p_i,\; 0 \le i \le n\}\}
$$
Where: for `Q = {e | p₀ ∈ e₀, …, pₙ ∈ eₙ, condition}`, `Ψ` are valuations under which the where-clause holds and `ψ(e)` contains `l:v`; `p_{x_ψ}` is the path in `e` to a variable `x_ψ`; `p', p''` split `l = p'.p''` with `ψ(p_{x_ψ}) = p'` and `ψ(x_ψ)(p'') = v`. For a union query: `Γ_{Q,D}(l:v) = Γ_{Q₁,D}(l:v) ∪ … ∪ Γ_{Qₙ,D}(l:v)`. *(p.328, Def. 8)*

### Compound derivation basis

$$
\Gamma_{Q,D}(p_1{:}v_1, p_2{:}v_2) = \Gamma_{Q,D}(p_1{:}v_1) * \Gamma_{Q,D}(p_2{:}v_2) = \{(w_1 \sqcup w_2,\; P_1 \cup P_2) \mid (w_1, P_1) \in \Gamma_{Q,D}(p_1{:}v_1),\; (w_2, P_2) \in \Gamma_{Q,D}(p_2{:}v_2)\}
$$
*(p.329)*

### Traceable-query invariance

$$
\text{Proposition 2: } Q \text{ traceable} \wedge Q \leadsto Q' \text{ via } \mathcal{R} \Rightarrow \forall l{:}v \in Q(D).\; \Gamma_{Q,D}(l{:}v) = \Gamma_{Q',D}(l{:}v)
$$
*(p.329)*

## Parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Deterministic model edge-label uniqueness | — | — | required | strict | p.318 | Out-edges of each node have *distinct* labels (stronger than generic semistructured) |
| Edge-label linearity (when label is semistructured) | — | — | required (for normal forms) | — | p.318 | Footnote: edge labels that are semistructured data must be "linear" for normal-form purposes |
| Well-formedness: no pattern is a single variable | — | — | required | — | p.321 Def.3(a) | Soundness of rewrite rules |
| Well-formedness: eᵢ is either a nested query or non-query expr | — | — | required | — | p.321 Def.3(b) | Soundness of rewrite rules |
| Well-formedness: comparisons only var–var or var–const | — | — | required | — | p.321 Def.3(c) | Restricts queries to conjunctive fragment; enables containment check |
| Well-definedness | — | — | required | — | p.321 | Query not undefined on any input |
| Singular expression constraint | — | — | required | — | p.321 Def.4 | Variables bind only to singular values |
| Normal-form shape | Qᵢ | — | — | — | p.322 Def.5 | Top-level is ⊔ of Qᵢ, each with singular sp_i, singular se, Dᵢ a constant |
| Scope of why-provenance invariance (minimal witness basis) | — | — | — | equality-only + well-formed | p.325 Thm.3 | Also extends to some inequality subclasses via Klug homomorphism [ref 11] |
| Scope of where-provenance invariance | — | — | — | traceable queries | p.329 Prop.2 | Strictly more restrictive than well-formedness |
| Traceable condition (a): every pattern matches DB constant or subquery | — | — | required | — | p.329 Def.9 | — |
| Traceable condition (b): subqueries are views sharing no variables with outer | — | — | required | — | p.329 Def.9 | — |
| Traceable condition (c): only a singular pattern may match a subquery | — | — | required | — | p.329 Def.9 | — |
| Traceable condition (d): that pattern and subquery output expression are sequences of distinct variables of the same length | — | — | required | — | p.329 Def.9 | — |
| Path-augmentation symbol for label reference | % | — | — | — | p.328 | Extends path syntax so that `p%` refers to the *label* at the edge pointed to by `p` rather than the subvalue |

## Effect Sizes / Key Quantitative Results

*Not applicable — no empirical measurements. Formal results:*

| Result | Type | Statement | Scope / Context | Page |
|--------|------|-----------|-----------------|------|
| Strong normalization | Theorem 1 | Rewrite system 𝓡 terminates from any well-formed query in finitely many steps | Well-formed DQL queries | p.322 |
| Witness basis preserved by rewrite | Lemma 1 | `Q ⇝ Q'` via 𝓡 ⇒ `W_{Q,D}(t) = W_{Q',D}(t)` for all `t` in `Q(D)` | Well-formed queries | p.324 |
| Why soundness/completeness | Theorem 2 | `W_{Q,D}(t) = Why(t,Q,D)(D)` | Normal form Q, singular t | p.325 |
| Minimal witness invariance | Theorem 3 | Equivalent well-formed queries with equality-only conditions produce equal minimal witness bases | Equality-only fragment | p.325 |
| Unnesting of witnesses | Theorem 4 | Cascaded witness through views = witness of composed-out query | View-composed queries | p.326 |
| Traceable preserved by rewrite | Proposition 1 | `Q` traceable ∧ `Q ⇝ Q'` ⇒ `Q'` traceable | Traceable class | p.329 |
| Where-provenance invariance (traceable) | Proposition 2 | For traceable `Q`, `Γ_{Q,D}(l:v) = Γ_{Q',D}(l:v)` for any rewrite `Q'` | Traceable class | p.329 |
| Witness basis ≡ SPJU derivation | A Comparison | Witness basis coincides with [ref 7] derivation of a tuple for SPJU queries | SPJU relational subset | p.325 |

## Rules / Algorithms

### Algorithm `Why(t, Q_i, D)` — compute a query that produces the witness basis *(p.325)*

Inputs: singular value `t` in the output of `Q(D)`; a normal-form clause `Q_i`; database `D`.
Output: a DQL query `Q_i'` such that `Q_i'(D) = W_{Q_i,D}(t)`, or no query.

1. Let Δ be the "where" clause of `Q_i`.
2. Let Δ' be the deep union of patterns in Δ.
3. If there exists a valuation ψ from `e_i` to `t`:
   a. Return the query `where ψ(Δ) collect ψ(Δ'):C`.
4. Else return no query.
5. For a union `Q = Q_1 ⊔ … ⊔ Q_n`, `Why(t, Q, D) = Why(t, Q_1, D) ⊔ … ⊔ Why(t, Q_n, D)`.

Soundness and completeness: `W_{Q,D}(t) = Why(t, Q, D)(D)`. *(p.325, Theorem 2)*

### Procedure `Where(l:v, Q, D)` — compute derivation basis *(p.328)*

1. Find variables `x` in the output expression `e` that can generate `v` (partial match `l:v` against `e`).
2. Determine all paths `p_x` to `x` in the patterns of `Q`.
3. For each valuation ψ satisfying the where-clause with `ψ(e)` containing `l:v`:
   a. The valuation of the where-clause patterns is the witness `P_1 = ⟦p_0⟧_ψ ⊔ … ⊔ ⟦p_n⟧_ψ`.
   b. The valuations of the paths pointing to `x` (i.e. `{ψ(p_i').p'' | ...}`) form the derivation basis (where-provenance) of `l:v` with respect to that witness.
4. Aggregate `(P_1, S_ψ)` pairs across valuations; the derivation basis Γ_{Q,D}(l:v) is the set of such pairs. *(p.328, Def. 8)*

### Rewrite system 𝓡 (strongly normalizing) *(p.322)*
- Transforms any well-formed DQL query to an equivalent normal-form query.
- Details omitted in the ICDT paper; claimed deferred to full version. Key consequence: Theorem 1 (strong normalization) guarantees termination regardless of rule-application order.

## Figures of Interest
- **Fig. 1 (p.319):** Examples of data structures represented in the syntax — a record (Name:"Bruce", Height:6.2), an array ({1:"a", 2:"b", 3:"c"}), a set (three elements mapping distinct-index edges to the standard constant `c`), and a relation with compound-key edges labeled `{Id:1}`, `{Id:2}` mapping to `{Name:"Kim", Rate:50}` etc.
- **Fig. 2 (p.320):** (a) General form `where p_i ∈ e_i, condition collect e`. (b) Normal form with `sp_i ∈ D_i` singular, `D_i` database constant, `se` singular expression. (c) Example: `where Composers.x.born:u ∈ D, u < 1700 collect {year:u}:C`.
- **Fig. 3 (p.322):** Two DQL example queries illustrating how XML-QL-style "bind to subtree" can be translated to DQL using deep union reconstruction.
- **Composers/Works encoding (p.320):** Two relations shown side-by-side with their DQL tree encoding, demonstrating compound-key-as-linear-edge-label technique.
- **Where-provenance examples (p.327):** `Q_1` (hard-wired `$50K` constant) vs. `Q_2` (variable-bound `y = $50K`) show where-provenance defined only when value can be associated with an output variable; `Q_3` vs. `Q_4` show multiple simultaneous contributors; `Q_5` vs. `Q_6` show nested-query equivalence requires tracking `u` binding to `y:z`.

## Results Summary
- A *syntactic*, not semantic, characterization of provenance is delivered for a semistructured-tree query language DQL capturing SPJU relational + positive nested algebra. *(p.322, p.329)*
- Why-provenance admits an invariant notion (minimal witness basis) across rewrites for the equality-only well-formed class, extending to certain inequality subclasses via Klug-style homomorphism [ref 11]. *(p.325, p.326)*
- Where-provenance is in general *not* invariant across equivalent queries, but *is* preserved for the traceable subclass, formalized via the derivation basis with the new "%" path-augmentation for referring to edge labels as locations. *(p.327, p.328, p.329)*
- Witness basis coincides with [Cui & Widom 2000] derivations for SPJU queries, unifying this work with prior relational lineage. *(p.325)*
- Witness-basis computation composes with view unnesting: cascaded witnessing through views equals the witness after the rewrite system composes the view out. *(p.326, Theorem 4)*

## Limitations
- No formal semantic characterization of where-provenance given; authors explicitly note they do not know whether one exists, nor whether why-provenance extends semantically beyond SPJU queries. *(p.318)*
- View-maintenance connection is loose: why-provenance is simpler than view maintenance (ignores additions, does not reconstruct under source change). *(p.318)*
- XML support is approximate: XML's child-label repetition is handled via DOM position/attribute-name uniqueness, with full translation deferred to a "full version". *(p.320, Sec 2.3)*
- DQL less expressive than XML-QL: (a) no Kleene-star path patterns, (b) only hierarchical structures, (c) limited simulation of Skolem and nested-query forms. *(p.322)*
- `$50K` hard-coded constants in queries prevent defining where-provenance at those output positions; fall back to attributing where-provenance to the query itself. *(p.327)*
- Traceable-query class is restrictive (conditions a–d in Def. 9), excluding common nested/compound patterns. *(p.329)*
- Rewrite system 𝓡 details and full XML translation deferred to full version (not in the ICDT paper). *(p.322, p.320)*
- Where-provenance not invariant under general rewrites — formal result limited to traceable subclass. *(p.327, p.329)*
- Open problem: necessary and sufficient conditions for well-definedness. *(p.329)*

## Arguments Against Prior Work
- Prior work [Cui & Widom 2000 (ref 7), Woodruff & Stonebraker 1997 (ref 2)] only addressed the relational model. *(p.316, p.317)*
- [Cui & Widom 2000] gives a *semantic* characterization of why-provenance for SPJU but conflates why- and where-provenance; the authors show their syntactic witness basis coincides with [7]'s tuple-derivation for SPJU, but [7] does not separate the two notions. *(p.317, p.325)*
- [Cui & Widom 2000]'s approach argues "every tuple contributed" (under modify-any-tuple-changes-presence), which is exactly why-provenance — but this misses the simpler, location-specific where-provenance question. *(p.317)*
- The relational model has no explicit notion of location, so where-provenance is undefined there without further structure (e.g., SELECT UNIQUE changes answer to a set of locations — an awkward workaround). *(p.317)*
- View maintenance [Zhuge et al. 1995 (ref 17)] is adjacent but not equivalent: it reconstructs under source changes, whereas why-provenance does not. *(p.318)*

## Design Rationale
- **Why deterministic tree model (over generic semistructured):** every value has a unique path → first-class *location* → where-provenance is definable at all. *(p.318)*
- **Why deep union (over other "union" operations):** it precisely preserves path structure and makes compound-value witness definitions product-decomposable. *(p.321, p.319)*
- **Why normal form and singular patterns/expressions:** allows witness basis and derivation basis to be defined inductively over a simple shape; enables strong normalization. *(p.321, p.322)*
- **Why minimal witness basis (over witness basis):** witness basis is not invariant under equivalent queries; taking the ⊑-maximal subset of minimal witnesses restores invariance on the well-behaved class. *(p.325)*
- **Why % path augmentation:** labels themselves can be sources of data (keys in relations, semistructured edge labels); `p%` lets where-provenance point to an edge-label location, not just a leaf. *(p.328)*
- **Why the traceable restriction:** where-provenance is not invariant across equivalent queries in general; the traceable class is the syntactic slice on which syntactic analysis gives a stable answer. *(p.327, p.329)*
- **Why a syntactic approach at all:** semantic approaches conflate why/where and do not extend beyond SPJU; a purely syntactic characterization preserves the distinction and scales to DQL/semistructured. *(p.327)*

## Testable Properties
- Substructure `⊑` is reflexive and transitive, and for deterministic values `w ⊑ v` implies `w` occurs uniquely as part of `v`. *(p.319)*
- Deep union `⊔` is partial: defined iff the union of path sets remains a finite partial function. *(p.319, Def. 2)*
- `v(p)` undefined when path `p` has a label not present at the corresponding level of `v`. *(p.319)*
- Strong normalization: any sequence of 𝓡 rewrites from a well-formed query terminates at a normal-form query. *(p.322, Thm.1)*
- `Q ⇝ Q' via 𝓡 ⇒ W_{Q,D}(t) = W_{Q',D}(t)` for all `t ∈ Q(D)`. *(p.324, Lemma 1)*
- For normal-form `Q` and singular `t`: `W_{Q,D}(t) = Why(t,Q,D)(D)`. *(p.325, Thm.2)*
- Equivalence of equality-only well-formed `Q, Q'` ⇒ `M_{Q,D}(t) = M_{Q',D}(t)`. *(p.325, Thm.3)*
- Homomorphism-based query containment extends Theorem 3 to certain inequality subclasses [ref 11]. *(p.326)*
- Theorem 4 unnesting: `W_{Q',D}(t) = {w ⊔ w' | (w ⊔ v') ∈ W_{Q,{D,V(D)}}(t), w' ∈ W_{V,D}(v')}`. *(p.326)*
- Witness basis = [7]'s tuple derivation for SPJU. *(p.325)*
- Traceable queries closed under 𝓡: `Q` traceable ∧ `Q ⇝ Q'` ⇒ `Q'` traceable. *(p.329, Prop.1)*
- Where-provenance preservation: for traceable `Q`, `Γ_{Q,D}(l:v) = Γ_{Q',D}(l:v)` under rewriting. *(p.329, Prop.2)*
- Where-provenance of a value associated with no output variable is defined to be the entire query (fallback). *(p.327)*
- Compound derivation basis decomposes as a product of singular-value derivation bases. *(p.329)*

## Relevance to Project
Direct and high-value for propstore's provenance story:
- propstore's architectural layer (1) "source-of-truth storage" is exactly the kind of system where the **why vs. where** split matters: *why* a claim is in the store (which source-paper evidence justifies it) is structurally different from *where* a particular value (e.g., an effect size) was extracted from (a specific page/figure/table). PROV-O (Moreau 2013, already ingested) covers process-level provenance but does not formally separate these two query-level notions.
- The **witness basis / minimal witness basis** concept maps cleanly onto propstore's "evidence counts per claim" story: the minimal witness basis is the smallest justifying source set — aligning with honest-ignorance / vacuous-opinion calibration (Jøsang 2001). Evidence accumulation in the argumentation layer is witness-set union; the substructure order `⊑` gives a lattice for subset-minimality.
- **Normal-form + strong normalization + invariance under rewrite** are exactly the properties propstore wants of its render-time resolution strategies: multiple rival normalizations must not lose provenance identity; Buneman/Khanna/Tan give conditions (well-formed, equality-only, traceable) under which rewrites preserve provenance.
- The **deep-union ⊔** operator over path-representations is a natural fit for IC-merge-style assignment-level merges already partly implemented in propstore (`propstore/repo/` branch reasoning). Compound-value product decomposition generalizes how propstore already composes context-scoped claims.
- The **traceable-query** restriction is a practical guide for what kinds of queries the render layer can answer with provenance preservation: if a query violates the traceable constraints, propstore should report derived results without guaranteeing where-level provenance invariance.
- The paper's rejection of semantic-only characterizations in favor of syntactic ones aligns with propstore's non-commitment discipline: storage keeps multiple rival normalizations, and provenance is a *structural* property of the rewrite rather than a collapsed semantic value.

## Open Questions
- [ ] Necessary and sufficient conditions for the class of well-defined queries (paper's own open problem, p.329).
- [ ] How do functional dependencies on the source change the completeness of where-provenance? (Authors suggest extra constraints give more complete where-provenance, p.330.)
- [ ] Is there a semantic characterization of where-provenance at all? (Open per p.318.)
- [ ] Can why-provenance semantics extend past SPJU without collapsing into view-maintenance semantics? (Open per p.318.)
- [ ] How does this relate to provenance polynomials / semirings (Green, Karvounarakis, Tannen 2007), which came later? Not addressed in this 2001 paper; propstore likely wants to bridge both.
- [ ] How to handle XML repetition and Kleene-star paths — deferred to full version (p.322).
- [ ] Exact rewrite rules of 𝓡 — omitted in this paper (p.322).

## Related Work Worth Reading
- **[6] Buneman, Deutsch, Tan 1999 — "A Deterministic Model for Semistructured Data"** (Workshop on Query Processing for Semistructured Data and Non-standard Data Formats). *The foundational data model this paper depends on.* High priority.
- **[7] Cui & Widom 2000 — "Practical lineage tracing in data warehouses"** (ICDE, pp. 367–378). *The why-provenance (semantic) counterpart for SPJU relational queries; witness basis coincides with their derivation.* High priority.
- **[2] Woodruff & Stonebraker 1997 — "Supporting fine-grained data lineage in a database visualization environment"** (ICDE, pp. 91–102). *Earlier lineage work in relations.* Medium priority.
- **[17] Zhuge, Garcia-Molina, Hammer, Widom 1995 — "View maintenance in a warehousing environment"** (SIGMOD, pp. 316–327). *Adjacent view-maintenance problem.*
- **[11] Klug 1988 — "On conjunctive queries containing inequalities"** (JACM). *Homomorphism/containment machinery used to extend Theorem 3 to inequality subclasses.*
- **[10] Liefke & Davidson 1999 — "Efficient View Maintenance in XML Data Warehouses"** (UPenn TR MS-CIS-99-27). *Uses this deterministic model for view maintenance.*
- **[12] Wong 1993 — "Normal Forms and Conservative Properties for Query Languages over Collection Types"** (PODS). *Normal forms for nested relational algebra; DQL expressivity claim leans on this.*
- **[5] Abiteboul, Quass, McHugh, Widom, Wiener 1996 — Lorel** (J. Digital Libraries). *Semistructured query language with a "union" operation compared to deep union.*
- **[13] Buneman, Davidson, Hillebrand, Suciu 1996 — UnQL** (SIGMOD, pp. 505–516). *Another relevant semistructured query language.*
- **[14] Papakonstantinou, Garcia-Molina, Widom 1996 — OEM / object exchange** (ICDE). *Semistructured model baseline.*
- **[9] Durbin & Mieg 1992 — ACeDB.** Illustrative deterministic semistructured DBMS.

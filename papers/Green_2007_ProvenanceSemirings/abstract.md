# Abstract

## Original Text (Verbatim)

We show that relational algebra calculations for incomplete databases, ## probabilistic databases, bag semantics and why-provenance are particular cases of the same general algebraic calculations involving semirings. This further suggests looking for an abstract semiring of provenance that unifies all of the above and that reflects directly how data is used in a calculation. We propose using commutative semirings that satisfy an additional condition we call "naturally ordered" for this purpose. We show how to compute provenance in this way for both the positive relational algebra and for Datalog queries. In the Datalog case, fixpoint semantics for the positive relational algebra and Carnap's inductive definition coincide on naturally ordered semirings, and the semantics of Datalog can be computed bottom-up using SLD resolution.

---

## Our Interpretation

The paper addresses the fragmentation of data provenance models by identifying that lineage, why-provenance, bag semantics, and incomplete/probabilistic database computations all share the same algebraic structure: commutative semiring operations over annotated tuples. The key finding is that provenance polynomials N[X] form the universal (most general) semiring from which all other provenance notions can be derived via homomorphisms. This is relevant to propstore because it provides a principled algebraic framework for tracking how source claims combine through query and derivation operations, supporting the non-commitment discipline by keeping the full polynomial representation rather than collapsing to a coarser provenance notion prematurely.

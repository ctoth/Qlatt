# Abstract

## Original Text (Verbatim)

With the proliferation of database views and curated databases, the issue of *data provenance* – where a piece of data came from and the process by which it arrived in the database – is becoming increasingly important, especially in scientific databases where understanding provenance is crucial to the accuracy and currency of data. In this paper we describe an approach to computing provenance when the data of interest has been created by a database query. We adopt a syntactic approach and present results for a general data model that applies to relational databases as well as to hierarchical data such as XML. A novel aspect of our work is a distinction between "why" provenance (refers to the source data that had some influence on the existence of the data) and "where" provenance (refers to the location(s) in the source databases from which the data was extracted).

---

## Our Interpretation

Two notions of provenance — *why* (which source values justify the output) vs. *where* (which source location the output value was copied from) — are formalized syntactically over a deterministic semistructured-tree data model that subsumes relations and approximates XML, using a query language DQL with deep union. Why-provenance (witness basis / minimal witness basis) is invariant under rewriting of well-formed equality-only queries; where-provenance (derivation basis, with a new `%` path-augmentation referring to edge labels) is invariant only for a restricted *traceable* class, and the paper proves strong normalization of the rewrite system plus soundness/completeness of explicit witness-computing procedures. Relevant to propstore because it supplies the foundational why/where distinction and syntactic invariance conditions for a provenance-typed store that keeps multiple rival normalizations and resolves at render time.

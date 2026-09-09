---
tags: [provenance, data-lineage, semistructured-data, query-rewriting, database-theory]
---
Formalizes a syntactic distinction between why-provenance (which source values justify an output value, via witness / witness basis / minimal witness basis) and where-provenance (which source location the output value was copied from, via derivation basis) over a deterministic semistructured tree model and a query language DQL with deep union.
Proves strong normalization of the rewrite system, invariance of minimal witness basis under equivalent equality-only queries (extending to certain inequality subclasses via homomorphism-based containment), view-unnesting composability, and preservation of where-provenance under rewrites for the restricted class of traceable queries.
Anchors propstore's provenance-type redesign (alongside Moreau 2013 PROV-O) by giving the foundational why/where split and concrete invariance conditions that map onto propstore's non-commitment, render-time resolution, and IC-merge-style assignment-level composition.

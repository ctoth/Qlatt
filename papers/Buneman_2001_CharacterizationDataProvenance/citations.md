# Citations

## Reference List

1. INFOBIOGEN. *DBCAT, The Public Catalog of Databases.* http://www.infobiogen.fr/services/dbcat/, cited 5 June 2000.
2. A. Woodruff and M. Stonebraker. *Supporting fine-grained data lineage in a database visualization environment.* In **ICDE**, pages 91–102, 1997.
3. S. Abiteboul, P. Buneman, and D. Suciu. *Data on the Web. From Relations to Semistructured Data and XML.* Morgan Kaufman, 2000.
4. S. Abiteboul, R. Hull, and V. Vianu. *Foundations of Databases.* Addison Wesley Publishing Co, 1995.
5. S. Abiteboul, D. Quass, J. McHugh, J. Widom, and J. Wiener. *The Lorel query language for semistructured data.* **Journal on Digital Libraries**, 1(1), 1996.
6. P. Buneman, A. Deutsch, and W. Tan. *A Deterministic Model for Semistructured Data.* In **Proc. of the Workshop On Query Processing for Semistructured Data and Non-standard Data Formats**, pages 14–19, 1999.
7. Y. Cui and J. Widom. *Practical lineage tracing in data warehouses.* In **ICDE**, pages 367–378, 2000.
8. A. Deutsch, M. Fernandez, D. Florescu, A. Levy, and D. Suciu. *XML-QL: A Query Language for XML*, 1998. http://www.w3.org/TR/NOTE-xml-ql.
9. R. Durbin and J. T. Mieg. *ACeDB – A C. elegans Database: Syntactic definitions for the ACeDB data base manager*, 1992. http://probe.nalusda.gov:8000/acedocs/syntax.html.
10. H. Liefke and S. Davidson. *Efficient View Maintenance in XML Data Warehouses.* Technical Report MS-CIS-99-27, University of Pennsylvania, 1999.
11. A. Klug. *On conjunctive queries containing inequalities.* **Journal of the ACM**, 1(1):146–160, 1988.
12. L. Wong. *Normal Forms and Conservative Properties for Query Languages over Collection Types.* In **PODS**, Washington, D.C., May 1993.
13. P. Buneman and S. Davidson and G. Hillebrand and D. Suciu. *A Query Language and Optimization Techniques for Unstructured Data.* In **SIGMOD**, pages 505–516, 1996.
14. Y. Papakonstantinou, H. Garcia-Molina, and J. Widom. *Object exchange across heterogeneous information sources.* In **ICDE**, 1996.
15. World Wide Web Consortium (W3C). *Document Object Model (DOM) Level 1 Specification*, 2000. http://www.w3.org/TR/REC-DOM-Level-1.
16. World Wide Web Consortium (W3C). *XML Schema Part 0: Primer*, 2000. http://www.w3.org/TR/xmlschema-0/.
17. Y. Zhuge, H. Garcia-Molina, J. Hammer, and J. Widom. *View maintenance in a warehousing environment.* In **SIGMOD**, pages 316–327, 1995.

## Key Citations for Follow-up

- **[6] Buneman, Deutsch, Tan 1999 — A Deterministic Model for Semistructured Data.** Foundational data model this paper depends on for unique-path locations. Needed to fully understand the "location" semantics on which where-provenance rests.
- **[7] Cui & Widom 2000 — Practical lineage tracing in data warehouses.** Semantic SPJU lineage that the witness basis coincides with for SPJU; essential for any propstore provenance story wanting to reconcile syntactic and semantic views.
- **[2] Woodruff & Stonebraker 1997 — Supporting fine-grained data lineage in a database visualization environment.** Earlier concrete lineage work; useful for historical grounding.
- **[17] Zhuge, Garcia-Molina, Hammer, Widom 1995 — View maintenance in a warehousing environment.** The view-maintenance problem the paper explicitly contrasts with why-provenance.
- **[11] Klug 1988 — On conjunctive queries containing inequalities.** Homomorphism-containment machinery used to extend the minimal-witness invariance result beyond equalities.

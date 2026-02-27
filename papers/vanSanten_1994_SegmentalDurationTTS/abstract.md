# Abstract

## Original Text (Verbatim)

In natural speech, durations of phonetic segments are strongly dependent on contextual factors. For synthetic speech to sound natural, the module for computing segmental duration (the *duration system*) must mimic these contextual effects as closely as possible. Construction of a duration system is obstructed by two facets of segmental duration: (1) interactions between contextual factors, and (2) sparsity of training data. This paper describes a new duration system in which a central role is played by *duration models*, in the form of equations consisting of sums and products such as in: duration (/i/, *voiced, stressed*) = A(/i/) + B(*voiced*) x C(*stressed*). These models, which we call *sums-of-products models*, can capture the types of interaction patterns often found in duration data, where one factor typically amplifies -- but does not reverse -- the effects of other factors. Yet, these models are mathematically sufficiently tractable for robust parameter estimation in the presence of severe sparsity. The overall architecture of the system consists of a *category structure*, or *tree*, that divides the space into similar-behaved cases; for each of these categories a separate sums-of-products model is developed and its parameters are estimated. Perceptual evaluation results are reported for an implementation in the AT&T Bell Laboratories text-to-speech system.

---

## Our Interpretation

Van Santen addresses the fundamental problem that segment durations in speech depend on many interacting factors (stress, position, consonant context, accent) that cannot be captured by simple multiplicative rules. His sums-of-products models provide a mathematically principled way to represent how these factors amplify each other's effects while remaining estimable from sparse data. For speech synthesis, this means duration prediction can be dramatically improved by using the right mathematical structure -- capturing interaction patterns that Klatt-style rules miss -- leading to perceptibly more natural timing.

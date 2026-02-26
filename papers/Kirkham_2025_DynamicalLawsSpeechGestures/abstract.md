# Abstract

## Original Text (Verbatim)

A fundamental challenge in the cognitive sciences is discovering the dynamics that govern behavior. Take the example of spoken language, which is characterized by a highly variable and complex physical movements that map onto the small set of cognitive units that comprise language. What are the fundamental dynamical principles behind the movements that structure speech production? In this study, we discover models in the form of symbolic equations that govern articulatory gestures during speech. A sparse symbolic regression algorithm is used to discover models from kinematic data on the tongue and lips. We explore these candidate models using analytical techniques and numerical simulations and find that a second-order linear model achieves high levels of accuracy, but a nonlinear force is required to properly model articulatory dynamics in approximately one third of cases. This supports the proposal that an autonomous, nonlinear, second-order differential equation is a viable dynamical law for articulatory gestures in speech. We conclude by identifying future opportunities and obstacles in data-driven model discovery and outline prospects for discovering the dynamical principles that govern language, brain, and behavior.

---

## Our Interpretation

This paper uses machine learning (specifically SINDy, a physics-informed sparse regression method) to discover what mathematical equations actually govern how the tongue and lips move during speech, rather than assuming a model a priori. The key finding is that the standard critically-damped harmonic oscillator model used in articulatory phonology is not quite right — the actual dynamics are under-damped, and about a third of movements need a nonlinear cubic force term. For speech synthesis, this suggests that formant transitions might naturally exhibit slight overshoot rather than smooth monotonic approaches to target, and provides data-driven equations for modeling articulatory gesture dynamics.

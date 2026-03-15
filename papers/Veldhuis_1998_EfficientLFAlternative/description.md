---
tags:
  - glottal-source
  - voice-quality
  - computational-efficiency
  - LF-model
  - synthesis
---

Presents the Rosenberg++ (R++) glottal pulse model as a computationally efficient alternative to the Liljencrants-Fant (LF) model. The R++ model uses the same T/R specification parameters as LF but replaces the costly iterative nonlinear solve for the alpha generation parameter with a direct closed-form computation of a polynomial shape parameter t_x. A perceptual experiment with isolated vowels confirms the two models produce speech that is essentially indistinguishable, making R++ a practical drop-in replacement for real-time speech synthesizers.

# Abstract

## Original Text (Verbatim)

Combilex is a high quality pronunciation lexicon, aimed at speech technology applications, that has recently been released by CSTR. Combilex benefits from several advanced features. This paper evaluates one of these: the explicit alignment of phones to graphemes in a word. This alignment can help to rapidly develop robust and accurate letter-to-sound (LTS) rules, without needing to rely on automatic alignment methods. To evaluate this, we used Festival's LTS module, comparing its standard automatic alignment with Combilex's explicit alignment. Our results show using Combilex's alignment improves LTS accuracy: 86.50% words correct as opposed to 84.49%, with our most general form of lexicon. In addition, building LTS models is greatly accelerated, as the need to list allowed alignments is removed. Finally, loose comparison with other studies indicates Combilex is a superior quality lexicon in terms of consistency and size. Index Terms: combilex, letter-to-sound rules, grapheme-to-phoneme conversion

---

## Our Interpretation

The paper evaluates Combilex, a new accent-independent pronunciation lexicon whose base-form entries carry an explicit, expert-authored alignment between phones and letters, preserved automatically through the derivation of accent-specific surface lexica. Training letter-to-sound rules on that alignment, instead of an automatically computed one, measurably improves rule accuracy and removes a manual configuration step, and the resulting rules also beat rules trained on the older OALD lexicon. It matters for a declarative TTS frontend because it demonstrates, empirically, that consistent lexicon construction plus carried-through structural metadata (here, alignment; more generally, any per-accent derivation) pays off downstream, reinforcing the same one-lexicon-plus-accent-derivation architecture as Unisyn.

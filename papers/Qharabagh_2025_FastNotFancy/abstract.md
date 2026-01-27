# Abstract

## Original Text (Verbatim)

Homograph disambiguation remains a significant challenge in grapheme-to-phoneme (G2P) conversion, especially for low-resource languages. This challenge is twofold: (1) creating balanced and comprehensive homograph datasets is labor-intensive and costly, and (2) specific disambiguation strategies introduce additional latency, making them unsuitable for real-time applications such as screen readers and other accessibility tools. In this paper, we address both issues. First, we propose a semi-automated pipeline for constructing homograph-focused datasets, introduce the HomoRich dataset generated through this pipeline, and demonstrate its effectiveness by applying it to enhance a state-of-the-art deep learning-based G2P system for Persian. Second, we advocate for a paradigm shift—utilizing rich offline datasets to inform the development of fast, rule-based methods suitable for latency-sensitive accessibility applications like screen readers. To this end, we improve one of the most well-known rule-based G2P systems, eSpeak, into a fast homograph-aware version, HomoFast eSpeak. Our results show an approximate 30% improvement in homograph disambiguation accuracy for the deep learning-based and eSpeak systems.

---

## Our Interpretation

This paper tackles two critical challenges in grapheme-to-phoneme conversion for low-resource languages: the scarcity and cost of homograph datasets, and the latency constraints of real-time applications like screen readers. The authors present HomoRich, a large-scale Persian homograph dataset (528,891 sentences, 285 homographs), created through a semi-automated pipeline combining human annotation and LLM-generated examples, alongside two improved G2P systems (Homo-GE2PE neural model and HomoFast eSpeak rule-based system) that achieve ~30% improvement in homograph accuracy. The key insight is that high-quality, homograph-focused datasets can simultaneously enhance both neural and rule-based approaches, enabling practical accessibility tools without sacrificing speed for real-time speech synthesis applications.


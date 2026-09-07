---
title: "Notes on: f-DISTILL"
pubDatetime: 2026-09-06T12:30:00Z
description: The actual f-DISTILL framework — the four concrete divergence variants (KL, RKL, JS, TVD), the word-level decomposition that makes them tractable, and why symmetric losses win on DART/XSum/WMT.
tags:
  - distillation
  - nlp
  - papers
  - f-divergence
---

**Paper:** [f-Divergence Minimization for Sequence-Level Knowledge Distillation](https://arxiv.org/abs/2307.15190) — Yuqiao Wen, Zichao Li, Wenyu Du, Lili Mou (ACL 2023)

## The unifying formula

$$D_f(p \Vert q) = \sum_t q(t) \cdot f\left(\frac{p(t)}{q(t)}\right)$$

for any convex $f$ with $f(1)=0$. Different choices of $f$ recover different, previously-treated-as-separate distillation losses — that's the paper's whole point: forward KL, reverse KL, JS, and TVD distillation are one framework with a parameter swapped, not four unrelated ideas.

## Four concrete variants, with their actual failure modes named

- **KL** (standard/forward) — suffers from **mode-averaging**: the student ends up over-smoothed, spreading probability across teacher modes it should instead be committing to one of.
- **Reverse KL (RKL)** — the [MiniLLM](/notes/minillm) choice — fixes mode-averaging but swings the other way into **mode-collapsing**, where "the student only learns one or a few modes of the teacher distribution."
- **Jensen-Shannon (JS)** — symmetric: compares both distributions against their average, balancing the two failure modes above.
- **Total Variation Distance (TVD)** — also symmetric, but uses an $\ell_1$-style term with **no log operator**, which they show gives more stable gradients than JS.

## Making it tractable: word-level decomposition

The naive sequence-level divergence sums over exponentially many possible full sequences — intractable. They derive an **exact** step-wise decomposition for KL, RKL, and JS (turning it into a sum of per-token losses conditioned on the prefix), and an **upper-bound** approximation for TVD (since TVD doesn't decompose exactly). This decomposition is the actual engineering contribution that makes any of this trainable at scale.

Efficiency detail: teacher samples are precomputed offline (only the student is sampled during training), giving a reported 2.25–2.31x training speedup over resampling the teacher live. They also warm-start the student with a "pre-distillation" step combining MLE, word-level KL, and hidden-state matching before switching to the sequence-level f-divergence objective.

## Results

Datasets: DART (data-to-text), XSum (summarization), WMT16 EN→RO (translation), Commonsense Dialogue. Across all four, the **symmetric** losses (JS, TVD) consistently beat the asymmetric ones (KL, RKL), and every f-DISTILL variant beats the SeqKD and ENGINE baselines. On DART, human evaluation shows TVD specifically reduces missing information and hallucination rate compared to the alternatives.

They also introduce two diagnostic metrics worth stealing for other distillation work: **likelihood risk** (quantifies mode-averaging) and **coverage risk** (quantifies mode-collapsing) — symmetric methods score balanced on both, which is the mechanistic explanation for why they win empirically rather than just an empirical coincidence.

Where this fits: it's the theoretical map that [MiniLLM](/notes/minillm)'s reverse-KL choice sits on, and [OPD+](/notes/opd-plus) later shows that the on-policy training mechanics needed to actually *optimize* several of these divergences (beyond reverse KL) have a subtle bias that f-DISTILL's offline/word-level setup happens to sidestep.

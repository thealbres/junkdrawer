---
title: "Notes on: Rethinking On-Policy Distillation of LLMs"
pubDatetime: 2026-09-06T12:25:00Z
description: The actual mechanism behind when on-policy distillation works — token overlap ratio rising toward 91%, a "stronger teacher can fail while a weaker one succeeds" result, and a reverse-distillation experiment that undercuts the whole premise.
tags:
  - distillation
  - llm
  - papers
  - on-policy
  - reasoning
---

**Paper:** [Rethinking On-Policy Distillation of Large Language Models: Phenomenology, Mechanism, and Recipe](https://arxiv.org/abs/2604.13016) — Yaxuan Li, Yuxin Zuo, Bingxiang He, et al. (2026)

Studies on-policy distillation (OPD, the [GKD](/notes/gkd-on-policy-distillation)/[MiniLLM](/notes/minillm) family) in three variants — sampled-token, full-vocabulary, and top-k — and asks *when* it actually transfers something useful, using math-reasoning benchmarks (AIME, AMC, DAPO-Math).

## Two conditions have to hold simultaneously

**1. Thinking-pattern compatibility.** A stronger teacher can *completely fail* to improve a student if its reasoning style doesn't overlap with the student's, while a weaker teacher with better initial alignment succeeds. Concretely: distilling Qwen3-1.7B-Base from Qwen3-4B-Base-GRPO (a teacher post-trained with GRPO) beats distilling from Qwen3-4B (non-thinking), even though the two teachers are comparable on raw benchmarks — because the GRPO teacher starts with a higher top-k token-distribution overlap with the student.

**2. Genuinely new knowledge.** If teacher and student were trained on the same data with the same recipe, they already converge to similar distributions at their respective scales — there's no signal left to transfer. Teachers that went through extra RL post-training produce much bigger gains than same-pipeline teachers of the same benchmark strength.

## The mechanism: progressive high-probability alignment

Successful runs show three consistent signatures over training: the **overlap ratio** between student and teacher top-k tokens climbs steadily (their reported range: ~72% → 91%), the advantage on already-overlapping tokens drifts toward zero, and the entropy gap between student and teacher narrows. The striking practical finding: **shared (overlapping) tokens already concentrate 97–99% of the combined probability mass**, so optimizing *only* the overlap region recovers nearly the full benefit of standard on-policy training — the long tail of non-overlapping tokens contributes almost nothing to the gains.

## Recovery strategies when OPD isn't working

- **Off-policy cold start** — a round of supervised fine-tuning on teacher-generated rollouts before switching to OPD, to raise the initial overlap ratio. Reported to "substantially outperform pure OPD."
- **Teacher-aligned prompts** — using prompts drawn from the teacher's own post-training distribution sharpens alignment, but also collapses student entropy, so it has to be mixed with out-of-distribution prompts to avoid over-narrowing the student.

## The result that should make you skeptical of "teacher quality" as a proxy

A reverse-distillation experiment: JustRL-1.5B (a student) distilled from its own **pre-RL checkpoint** (R1-Distill-1.5B) regresses back toward pre-RL performance, as expected. But distilling from **R1-Distill-7B** — a substantially larger, slightly *stronger* model from the same family — produces almost the *identical* regression. In other words, OPD's outcome can be completely decoupled from the teacher's raw benchmark strength; what matters is the compatibility conditions above, not "is the teacher better."

## Practical notes

Reward quality degrades as trajectory depth increases; response lengths around 3K–7K tokens perform best. Training instability tends to originate at *later* tokens in a sequence and propagate backward — a detail worth remembering if you see OPD training degrade specifically on long generations.

See also [OPD+](/notes/opd-plus), a same-year paper finding a more technical flaw — a biased advantage estimator — in the same family of methods. That paper asks whether the *math* of OPD is correct; this one asks whether there's even a transferable signal to learn from in the first place.

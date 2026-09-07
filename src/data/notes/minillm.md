---
title: "Notes on: MiniLLM"
pubDatetime: 2026-09-06T12:20:00Z
description: The reverse-KL policy-gradient derivation behind MiniLLM — per-token rewards, teacher-mixed sampling, length normalization — plus the actual GPT-2/OPT/LLaMA numbers.
tags:
  - distillation
  - llm
  - papers
  - reverse-kl
  - on-policy
---

**Paper:** [MiniLLM: Knowledge Distillation of Large Language Models](https://arxiv.org/abs/2306.08543) — Yuxian Gu, Li Dong, Furu Wei, Minlie Huang (ICLR 2024)

## Why not forward KL

Forward KL, $KL(\text{teacher} \Vert \text{student})$, forces the student to put non-zero probability everywhere the teacher does — including rare, low-probability continuations. For open-ended generation that's mode-*covering* behavior, and it tends to spread the student thin. MiniLLM instead minimizes **reverse KL**, $KL(\text{student} \Vert \text{teacher})$, which is mode-*seeking*: the student is only penalized for putting probability where the teacher doesn't, so it's free to concentrate on the response types the teacher actually favors within its own smaller capacity, rather than trying to cover everything.

## Turning reverse KL into a policy-gradient problem

Reverse KL minimization is reformulated as reward maximization, where each generated token gets a reward $r_t = \log\frac{p_{\text{teacher}}(y_t|\cdot)}{p_{\text{student}}(y_t|\cdot)}$ — literally "did the teacher like this token more than I expected to produce it." That's a standard policy-gradient setup, but naively applying it to full sequences is unstable, so they add three stabilizers:

1. **Single-step decomposition** — separates the per-step reward from long-horizon variance, computed directly rather than through high-variance Monte Carlo rollouts.
2. **Teacher-mixed sampling** — training sequences are sampled from a mixture $\alpha\cdot p_{\text{teacher}} + (1-\alpha)\cdot p_{\text{student}}$ rather than purely from the student, which prevents the classic RL failure mode of the student drifting into degenerate text that happens to score well.
3. **Length normalization** — reward is divided by sequence length, closing off the obvious exploit where shorter outputs accumulate less negative reward and get "cheaply" preferred.

## Experiments

- Students: GPT-2 (120M–760M), OPT (1.3B–6.7B), LLaMA (7B).
- Teachers: GPT-2-1.5B, OPT-13B, LLaMA-13B.
- Training data: databricks-dolly-15k (12.5K instruction/response pairs).
- Eval sets: DollyEval, SelfInst, VicunaEval, S-NI, UnNI.
- Baselines: plain SFT, word-level KD, sequence-level KD (SeqKD).

Concrete numbers, GPT-2-760M student on DollyEval: **MiniLLM** GPT-4 score 54.7 / Rouge-L 26.4, vs **SeqKD** 52.0 / 25.6, vs plain **SFT** 50.7 / 25.4 — a consistent but not enormous margin over the strongest baseline (SeqKD).

Secondary findings: lower exposure bias (error doesn't compound as fast over long generations), better calibration (confidence tracks the teacher's more closely than standard KD), generation diversity preserved (measured via distinct-4-grams — reverse KL's mode-seeking tendency doesn't collapse output variety in practice), and gains scale positively with teacher size.

Same on-policy-training conclusion as [GKD](/notes/gkd-on-policy-distillation), arrived at independently via the reverse-KL route rather than a tunable divergence family. [f-DISTILL](/notes/f-distill) later places this reverse-KL choice on a broader spectrum of f-divergences, and [OPD+](/notes/opd-plus) points out that reverse KL's specific math is precisely what makes MiniLLM's stop-gradient trick harmless — for other divergences, it isn't.

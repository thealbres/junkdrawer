---
title: "Notes on: On-Policy Distillation of Language Models (GKD)"
pubDatetime: 2026-09-07T12:15:00Z
description: The actual GKD objective — a λ-weighted mix of fixed-dataset and student-sampled sequences, a tunable JSD(β) divergence family, and where each choice wins across T5-family experiments.
tags:
  - distillation
  - llm
  - papers
  - on-policy
  - jsd
---

**Paper:** [On-Policy Distillation of Language Models: Learning from Self-Generated Mistakes](https://arxiv.org/abs/2306.13649) — Rishabh Agarwal, Nino Vieillard, Yongchao Zhou, et al. (ICLR 2024)

## The actual objective

$$L_{GKD}(\theta) = (1-\lambda) \cdot \mathbb{E}_{(x,y)\sim \text{dataset}}\left[D(p_T \Vert p_S^\theta)(y|x)\right] + \lambda \cdot \mathbb{E}_x\left[\mathbb{E}_{y\sim p_S^\theta}\left[D(p_T \Vert p_S^\theta)(y|x)\right]\right]$$

$\lambda \in [0,1]$ is the fraction of training that uses **student-generated** sequences instead of fixed dataset sequences. λ=0 is standard distillation on a fixed corpus; λ=1 is fully on-policy — the student generates its own rollout, and the teacher scores that exact rollout token-by-token. No gradient flows through the sampling step itself. This directly targets the classic autoregressive-generation problem: a model trained only on ground-truth prefixes never practices recovering from its *own* earlier mistakes at inference time.

## Divergence is a knob, not a fixed choice

Rather than committing to forward or reverse KL, they parameterize a **generalized JSD(β)** family that interpolates between the two (plus test forward KL and reverse KL directly). Finding: **"optimal divergence is task-dependent"** — there's no single winner across tasks, and mode-seeking divergences pair better with temperature sampling while forward KL does better under greedy decoding.

## Experiments (T5 family)

Students: T5-small (77M), T5-base (250M), T5-large (800M), distilled from T5-XL (~3B).

- **XSum** (summarization): on-policy GKD gets **2.1x relative gains** over baseline KD; on-policy GKD with only 5% labeled data beats supervised KD trained on the *full* dataset.
- **WMT en→de** (translation): **1.7x relative gains**; JSD variants beat plain forward/reverse KL here.
- **GSM8K** (arithmetic reasoning): **1.9x relative gains**; on-policy training helps once at least 25% of training data is on-policy.
- **FLAN** (task-agnostic instruction tuning): +2% and +1% absolute accuracy on held-out BBH and MMLU respectively, using on-policy GKD with reverse KL.

## Composing with RL

They show GKD folds naturally into RLAIF-style fine-tuning: $(1-\alpha)\cdot\mathbb{E}[r(y)] - \alpha\cdot\mathbb{E}[D(p_T \Vert p_S^\theta)(y|x)]$ — reward maximization and distillation loss share the same on-policy sampling machinery, so adding a distillation term to an RL objective is nearly free. On summarization, the RL+distillation student gets higher ROUGE-2 than a pure-RL baseline while producing more factually consistent summaries than the teacher itself.

Bottom line finding across all tasks: on-policy (λ=1) beats mixed (λ=0.5) beats fully offline (λ=0). See [MiniLLM](/notes/minillm), published around the same time, which arrives at a similar on-policy conclusion from the reverse-KL side specifically. And see [OPD+](/notes/opd-plus), which later argues the stop-gradient trick this paper relies on for stability is quietly biased for every divergence except reverse KL.

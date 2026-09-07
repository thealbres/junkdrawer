---
title: "Notes on: TinyBERT"
pubDatetime: 2026-09-07T12:10:00Z
description: Jiao et al.'s four-loss layer-wise distillation and two-stage framework, with the actual GLUE table — TinyBERT6 essentially matches BERT-base, TinyBERT4 keeps 96.8% of it at 7.5x smaller.
tags:
  - distillation
  - nlp
  - papers
  - bert
  - attention-transfer
---

**Paper:** [TinyBERT: Distilling BERT for Natural Language Understanding](https://arxiv.org/abs/1909.10351) — Xiaoqi Jiao, Yichun Yin, Lifeng Shang, et al. (2019)

## Four losses, not one

Where [DistilBERT](/notes/distilbert) leans mostly on output-logit matching plus a hidden-state cosine term, TinyBERT matches the student to the teacher at every internal stage:

- **Embedding-layer loss** — student embeddings aligned to teacher's via a learned linear projection (handles the dimension mismatch between a narrower student and the teacher).
- **Hidden-state loss** — student hidden states at each layer matched to a corresponding teacher layer via MSE, again through a learned projection.
- **Attention loss** — MSE between student and teacher **attention matrices**. This is the paper's real novelty: attention weights encode which tokens a layer is looking at, and that structure turns out to transfer more linguistic behavior than hidden states alone.
- **Prediction loss** — soft cross-entropy on the final logits, the "classic" distillation term.

## Two-stage framework

1. **General distillation**: all four losses, task-agnostic, on the unfinetuned BERT teacher over the Wikipedia corpus — essentially a distilled "pre-training."
2. **Task-specific distillation**: continue on the labeled downstream task, now against a *fine-tuned* teacher, plus **data augmentation** — token replacement using BERT's own masked-LM predictions, combined with GloVe-embedding-based synonym substitution — to compensate for small student capacity by manufacturing more training signal from limited labeled data.

## Results (actual GLUE table)

| Model | MNLI-m | QQP | QNLI | SST-2 | CoLA | STS-B | MRPC | RTE | Avg |
|---|---|---|---|---|---|---|---|---|---|
| BERT-base | 83.9 | 71.1 | 90.9 | 93.4 | 52.8 | 85.2 | 87.5 | 67.0 | 79.5 |
| TinyBERT₄ | 82.5 | 71.3 | 87.7 | 92.6 | 44.1 | 80.4 | 86.4 | 66.6 | 77.0 |
| TinyBERT₆ | 84.6 | 71.6 | 90.4 | 93.1 | 51.1 | 83.7 | 87.3 | 70.0 | 79.4 |

TinyBERT₄ (4 layers) keeps 96.8% of BERT-base's average score at 7.5x fewer parameters and 9.4x faster inference. TinyBERT₆ (6 layers) essentially *matches* BERT-base — notice it even beats it on MNLI-m, QQP, and RTE, which is a reminder that "distilled" doesn't strictly mean "worse," just smaller.

CoLA (linguistic acceptability, a harder/more idiosyncratic task) shows the biggest drop for TinyBERT₄ (44.1 vs 52.8) — a concrete example of compression hurting most on tasks furthest from the general-purpose pre-training signal.

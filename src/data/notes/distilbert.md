---
title: "Notes on: DistilBERT"
pubDatetime: 2026-09-07T12:05:00Z
description: Sanh et al.'s actual architecture and loss recipe — halved layers initialized every-other-layer from BERT, a triple loss, and the specific GLUE/SQuAD numbers behind the "97% at 40% smaller" headline.
tags:
  - distillation
  - nlp
  - papers
  - bert
---

**Paper:** [DistilBERT, a distilled version of BERT: smaller, faster, cheaper and lighter](https://arxiv.org/abs/1910.01108) — Victor Sanh, Lysandre Debut, Julien Chaumond, Thomas Wolf (2019)

## Architecture and initialization

DistilBERT keeps BERT's architecture but drops the token-type embeddings and the pooler, and **halves the number of layers**. The authors note that hidden-size reduction barely moves inference cost compared to layer count — modern linear algebra libraries are heavily optimized for the last tensor dimension — which is why they cut depth, not width.

Initialization is the detail people skip: the student isn't trained from scratch. It's initialized **by taking every other layer from the teacher** (layer 1, 3, 5, ... of BERT become layers 1, 2, 3, ... of DistilBERT), exploiting the fact that student and teacher already share the same hidden dimension.

## The triple loss

Three terms, summed:

- **L_ce** — distillation loss: cross-entropy against the teacher's softened output distribution.
- **L_mlm** — the standard masked-language-modeling loss on hard labels.
- **L_cos** — a cosine-embedding loss that pulls the *direction* of the student's hidden-state vectors toward the teacher's, independent of magnitude.

Ablation result worth remembering because it's counter-intuitive: removing L_cos and L_mlm together costs **−2.96** points on their evaluation, while removing L_ce (the actual distillation term) only costs **−1.46**. The auxiliary alignment losses matter more than you'd assume relative to the "headline" distillation loss.

## Training setup

Pre-trained (not just fine-tuned) with distillation, on the same corpora as BERT — English Wikipedia + Toronto Book Corpus — using dynamic masking, no next-sentence-prediction objective, and large batches via gradient accumulation (up to 4K examples/batch). Took 8 V100 GPUs for about 90 hours. This is why DistilBERT can be fine-tuned afterward like any normal pre-trained checkpoint — the distillation happened upstream, not per-task.

## Results

- GLUE macro score: **77.0** vs BERT-base's **79.5** (≈97%, matching the paper's headline claim).
- IMDb sentiment: 92.82% accuracy, 0.6 points behind BERT.
- SQuAD: 77.7 EM / 85.8 F1, 3.9 points behind BERT.
- Inference: 60% faster on CPU, 71% faster on an iPhone 7 Plus.
- Size: 66M parameters vs BERT's 110M.

Where it fits: this is the "cheap, general-purpose, one-time" distillation strategy. [TinyBERT](/notes/tinybert) is the more aggressive, layer-by-layer alternative that trades extra training-time complexity (attention-matrix + two-stage distillation) for a much bigger compression ratio.

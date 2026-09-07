---
title: "Notes on: Distilling the Knowledge in a Neural Network"
pubDatetime: 2026-09-06T12:00:00Z
description: Hinton, Vinyals & Dean's 2015 paper — the mechanics of soft-target distillation, the "omit a digit" MNIST experiment, and how it scales an ensemble of specialists back into one model.
tags:
  - distillation
  - deep-learning
  - papers
  - soft-targets
---

**Paper:** [Distilling the Knowledge in a Neural Network](https://arxiv.org/abs/1503.02531) — Geoffrey Hinton, Oriol Vinyals, Jeff Dean (2015)

## The mechanism

Softmax with a **temperature** T: instead of `softmax(z)`, compute `softmax(z/T)`. As T grows, the output distribution gets softer — probability mass that would be squashed to near-zero on "wrong" classes becomes visible. Those small probabilities are the "dark knowledge": they encode how the teacher thinks a 2 is a little bit like a 7 but not at all like a 3, which a one-hot label can never say.

Training loss is a weighted sum of two cross-entropies: one against the teacher's *soft* targets (both models' softmax computed at the same raised temperature T), one against the *hard* ground-truth labels (at T=1). Matching raw logits via squared error, an older compression trick, turns out to be a special/limiting case of this soft-target matching at high temperature.

## MNIST: the "omit a digit" experiment

They train the distilled (student) model on a transfer set that contains **no examples of the digit 3 at all** — the student never sees a "3" with a hard label. Despite that, it still classifies most 3s in the test set correctly, purely because the teacher's soft targets on other digits leak enough information about what a 3 looks like relative to other classes. This is the clearest demonstration in the paper that soft targets carry generalizable structure, not just calibrated confidence.

## Speech: ensemble → single model

An acoustic model ensemble (10 models trained on the same architecture with different random seeds/data shuffles) outperforms any single model. Distilling that ensemble's averaged soft predictions into one model of the *same size as a single ensemble member* recovers most of the ensemble's improvement over the un-distilled single-model baseline — i.e., you get most of the ensemble's benefit without paying its 10x inference cost.

## Specialists on JFT (the scaling result)

The largest-scale experiment: a Google-internal image dataset (JFT) with around 15,000 classes. Instead of one enormous model, they train a **generalist** model plus many **specialist** models, each specialist responsible for a small cluster of easily-confused classes (e.g., different mushroom or dog-breed subtypes) — clusters found by running a clustering algorithm over the generalist's confusion statistics. Specialists are initialized from the generalist's weights so they converge fast, and each only needs to distinguish within its narrow cluster plus a generic "other" class. At inference, the generalist's own top predictions decide which specialists to consult, and their outputs get merged back — effectively distilling an implicit mixture-of-experts into inference-time-cheap predictions.

## Caveats worth remembering

- Temperature is a real hyperparameter to tune, not a fixed constant.
- The technique is most useful when the teacher is meaningfully larger, or is literally an ensemble — distilling a same-size model buys little.
- It assumes you can afford the *teacher's* compute at training time; the payoff is entirely at inference time.

This is the ancestor of every LLM compression paper that follows — [DistilBERT](/notes/distilbert), [TinyBERT](/notes/tinybert), [MiniLLM](/notes/minillm), and on-policy distillation all start from this soft-target idea, then have to solve new problems that only show up once the "student" has to *generate* sequences instead of just classify.

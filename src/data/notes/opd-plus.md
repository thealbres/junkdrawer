---
title: "Notes on: OPD+"
pubDatetime: 2026-09-06T12:35:00Z
description: The actual bug OPD+ finds — stop-gradient drops a real gradient term for every f-divergence except reverse KL, which is why MiniLLM-style training "just happened" to work — plus the fix and the Table 2 numbers.
tags:
  - distillation
  - llm
  - papers
  - f-divergence
  - on-policy
---

**Paper:** [OPD+: Rethinking the Advantage Design for On-Policy Distillation](https://arxiv.org/abs/2606.01039) — Hanyang Zhao, Haoxian Chen, Han Lin, et al. (2026)

## The actual bug

On-policy distillation methods ([GKD](/notes/gkd-on-policy-distillation), [MiniLLM](/notes/minillm)) sample from the student and score with the teacher, using a `stop_gradient` on the advantage/reward term for training stability — standard RL practice. The problem: since the "reward" itself is a function of the *current* policy parameters $\theta$ (it's the teacher/student density ratio, and the student is $\theta$), the true gradient of the objective has **two terms** — a score-function term (the one stop-gradient correctly captures) and a **direct reward-gradient term** (the one stop-gradient silently drops). For a general f-divergence, dropping that second term produces a biased gradient estimate.

## Why nobody noticed for years

They derive the correct advantage weight as $w_f(u) = -f(u) + u\cdot f'(u)$, where $u$ is the teacher/student density ratio. Plug in reverse KL's $f(u) = -\log(u)$ and that correction term collapses to a **constant** (+1) — which vanishes under the score-function identity anyway. In other words: reverse KL happens to be the one divergence where the missing term doesn't matter, which is exactly the divergence MiniLLM used. Forward KL and JSD have no such luck — for those, the dropped term is real and non-constant, so the bias actually bites.

## What OPD+ changes

Keeps the stop-gradient (so training stays as cheap/stable as before) but multiplies the advantage by a **divergence-aware correction weight** derived from the density ratio, computed without needing an explicit, expensive divergence estimate. It's a drop-in change to the advantage-scaling step — no architecture changes needed.

## Results (Table 2, Qwen3 1.7B/8B, math + tool-use)

| Divergence | Standard OPD | OPD+ |
|---|---|---|
| Forward KL | catastrophic collapse | 46.39% avg |
| JSD | collapses to 0% | 48.85% avg |
| Reverse KL | 48.96% avg | 48.99% math / 61.44% tool-use |

The forward-KL and JSD rows are the real story: standard OPD doesn't just underperform on those divergences, it **collapses entirely** — confirming the bias isn't a rounding error, it's training-breaking for anything but reverse KL. With the fix, JSD+ even edges out reverse KL on AIME25 (50.42% vs 48.54%), suggesting reverse KL's earlier dominance in the literature may have been an artifact of it being the only divergence the biased estimator didn't break, not evidence it's the best choice.

## Limitations they own

No scaling analysis beyond 1.7B/8B, evaluated only on the Qwen3 family, and no comparison against logit-level (non-sequence-level) distillation variants.

Reads as the natural next step after [f-DISTILL](/notes/f-distill) generalized distillation to arbitrary f-divergences: f-DISTILL solved the *tractability* problem (word-level decomposition) for the offline setting, and this paper finds that the *on-policy* training mechanics needed to actually use those same divergences had a correctness bug the whole time.

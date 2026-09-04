# Learning 07 — Weeks 1–4 Capstone Assignment

## Goal

Bring the core ideas together: representations, attention shapes, encoder-decoder parameter counts, causal generation, decoding, and BERT's MLM objective.

![Transformer overview](assets/transformer-encoder-decoder.svg)

Use this one-layer encoder-decoder system for Questions 1–10 and Q15:

\[
B=2,\quad T_s=6,\quad T_t=4,\quad d_{\text{model}}=24,\quad h=3,\quad d_{ff}=48,
\]

\[
V_s=100,\qquad V_t=120.
\]

Assume Q/K/V/output projections have biases, each layer norm has learned scale and bias, the source and target embeddings are separate, and there is one encoder layer and one decoder layer.

### Q1 — Source representation shape (Short Answer)

What is the shape of the source hidden-state tensor after its token embeddings and positional information are combined?

<details>
<summary>Solution</summary>

The three axes are batch, source positions, and feature width:

\[
H_s\in\mathbb{R}^{B\times T_s\times d_{\text{model}}}
=\mathbb{R}^{2\times6\times24}.
\]

**Mnemonic:** **B-T-D** = batches, tokens, dimensions.

**Answer:** `2 × 6 × 24`
</details>

### Q2 — Head dimension (Numeric Input)

What is the width \(d_h\) of one attention head?

*(Numeric input)*

<details>
<summary>Solution</summary>

\[
d_h=\frac{d_{\text{model}}}{h}=\frac{24}{3}=8.
\]

**Answer:** \(\boxed{8}\)
</details>

### Q3 — Encoder self-attention scores (Numeric Input)

How many raw score cells does one encoder self-attention head form for one example?

*(Numeric input)*

<details>
<summary>Solution</summary>

Each of the 6 source queries compares with 6 source keys:

\[
T_s^2=6^2=36.
\]

**Answer:** \(\boxed{36}\)
</details>

### Q4 — Decoder's blocked future (Numeric Input)

How many cells are strictly above the diagonal in the decoder's \(T_t=4\) causal self-attention mask?

*(Numeric input)*

<details>
<summary>Solution</summary>

The number of forbidden future pairs is triangular:

\[
\frac{T_t(T_t-1)}2=\frac{4\cdot3}{2}=6.
\]

The allowed region includes the diagonal and the past.

**Answer:** \(\boxed{6}\)
</details>

### Q5 — Cross-attention scores (Numeric Input)

How many raw score cells does one decoder cross-attention head form for one example?

*(Numeric input)*

<details>
<summary>Solution</summary>

Decoder positions provide 4 queries; encoder positions provide 6 keys:

\[
T_tT_s=4\cdot6=24.
\]

**Intuition:** cross-attention is “target asks, source answers.”

**Answer:** \(\boxed{24}\)
</details>

### Q6 — One MHA module (Numeric Input)

How many parameters are in one multi-head-attention module, including all four projection biases?

*(Numeric input)*

<details>
<summary>Solution</summary>

Packed MHA has four \(d_{\text{model}}\to d_{\text{model}}\) projections:

\[
4(d_{\text{model}}^2+d_{\text{model}})
=4(24^2+24)=4(600)=2400.
\]

**Answer:** \(\boxed{2400}\)
</details>

### Q7 — One FFN (Numeric Input)

How many parameters are in one FFN \(24\to48\to24\), including both biases?

*(Numeric input)*

<details>
<summary>Solution</summary>

\[
(24\cdot48+48)+(48\cdot24+24)
=1200+1176=2376.
\]

The FFN expands each token's feature vector, applies a nonlinearity, then projects back.

**Answer:** \(\boxed{2376}\)
</details>

### Q8 — Encoder-layer total (Numeric Input)

How many parameters are in the one encoder layer?

*(Numeric input)*

<details>
<summary>Solution</summary>

An encoder layer has MHA, FFN, and two layer norms. Each layer norm has \(2d_{\text{model}}=48\) parameters:

\[
2400+2376+2(48)=4872.
\]

**Answer:** \(\boxed{4872}\)
</details>

### Q9 — Decoder-layer total (Numeric Input)

How many parameters are in the one decoder layer?

*(Numeric input)*

<details>
<summary>Solution</summary>

The decoder has masked self-attention, cross-attention, FFN, and three layer norms:

\[
2(2400)+2376+3(48)=7320.
\]

**Memory hook:** decoder = **two** attention modules + FFN + **three** norms.

**Answer:** \(\boxed{7320}\)
</details>

### Q10 — Target output projection (Numeric Input)

How many parameters are in the final target-vocabulary linear layer, including bias?

*(Numeric input)*

<details>
<summary>Solution</summary>

The layer maps 24 features to 120 vocabulary logits:

\[
24\cdot120+120=3000.
\]

**Answer:** \(\boxed{3000}\)
</details>

### Q11 — Generated-sequence probability (Numeric Input)

A decoder assigns probabilities \(0.5\), then \(0.6\), then \(0.8\) to the three tokens it generates. What is the joint probability of that three-token sequence, conditioned on its prompt?

*(Numeric input)*

<details>
<summary>Solution</summary>

Apply the chain rule by multiplying the conditional choices:

\[
0.5\times0.6\times0.8=0.24.
\]

**Answer:** \(\boxed{0.24}\)
</details>

### Q12 — Top-\(k\) in the capstone (Numeric Input)

The next-token probabilities are \([0.60,0.25,0.15]\). Under top-\(k\) sampling with \(k=2\), what is the renormalized probability of the first token, rounded to three decimals?

*(Numeric input)*

<details>
<summary>Solution</summary>

Keep mass \(0.60+0.25=0.85\), then normalize the first token:

\[
\frac{0.60}{0.85}=0.705882\ldots\approx0.706.
\]

**Answer:** \(\boxed{0.706}\)
</details>

### Q13 — BERT contrast (Numeric Input)

In a separate BERT MLM example, two selected original tokens receive probabilities \(0.2\) and \(0.5\). What is the summed MLM loss \(-\ln(0.2)-\ln(0.5)\), rounded to three decimals?

*(Numeric input)*

<details>
<summary>Solution</summary>

\[
-\ln(0.2)-\ln(0.5)
=1.609438+0.693147=2.302585\ldots\approx2.303.
\]

Unlike causal generation, MLM predicts selected hidden items using context on both sides.

**Answer:** \(\boxed{2.303}\)
</details>

### Q14 — Choose the right tool (MSQ)

Which pairings are appropriate?

- ( ) Translate a source sequence while generating target tokens: encoder-decoder transformer with decoder cross-attention.
- ( ) Predict a deliberately hidden word from both neighbors: BERT-style MLM.
- ( ) Generate a continuation one token at a time: GPT-style causal language model.
- ( ) Give every future target token to a causal decoder at inference so it can choose the answer.

<details>
<summary>Solution</summary>

The first three pair each task with a matching architectural/objective idea. At inference, future target tokens are unknown, so giving them to a causal decoder would leak the answer.

**Answer:** A, B and C
</details>

### Q15 — Full model total (Numeric Input)

Including source embeddings, target embeddings, one encoder layer, one decoder layer, and the target output projection, how many parameters does this model have?

*(Numeric input)*

<details>
<summary>Solution</summary>

First count the token tables:

\[
V_sd=100(24)=2400,\qquad V_td=120(24)=2880.
\]

Then combine every requested component:

\[
2400+2880+4872+7320+3000=20472.
\]

**Final checklist:** make a component list first, count each once, and include biases only when the question says they exist.

**Answer:** \(\boxed{20472}\)
</details>

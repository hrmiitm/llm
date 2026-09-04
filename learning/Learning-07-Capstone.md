# Learning 07 — Weeks 1–4 Capstone Assignment

## Goal

Bring the core ideas together: representations, attention shapes, encoder-decoder parameter counts, causal generation, decoding, and BERT's MLM objective.

![Transformer overview](assets/transformer-encoder-decoder.svg)

Use this encoder-decoder system for Questions 1–10 and Q15:

\[
B=2,\quad T_s=6,\quad T_t=4,\quad d_{\text{model}}=24,\quad h=3,\quad d_{ff}=48,
\]

\[
V_s=100,\qquad V_t=120.
\]

It has \(N_e=2\) encoder layers and \(N_d=3\) decoder layers. Assume Q/K/V/output projections have biases, each layer norm has learned scale and bias, and the source and target embeddings are separate.

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

### Q3 — Encoder self-attention score tensor (Numeric Input)

How many raw encoder self-attention score cells are formed across the full batch and all heads in **one encoder layer**?

*(Numeric input)*

<details>
<summary>Solution</summary>

Each source sequence contributes \(6\times6\) scores per head. Account for the 2 batch items and 3 heads:

\[
B\times h\times T_s^2=2\times3\times6^2=216.
\]

This is a score-cell count. It is separate from the \(d_h=8\)-dimensional vector arithmetic that produces each score.

**Answer:** \(\boxed{216}\)
</details>

### Q4 — Decoder's blocked future across heads (Numeric Input)

How many score cells are blocked by the decoder's causal mask across the full batch and all heads in one decoder self-attention module?

*(Numeric input)*

<details>
<summary>Solution</summary>

For one target sequence and one head, the forbidden future pairs are triangular:

\[
\frac{T_t(T_t-1)}2=\frac{4\cdot3}{2}=6.
\]

Replicate that mask for 2 batch items and 3 heads:

\[
2\times3\times6=\boxed{36}.
\]

The allowed region includes the diagonal and the past.

**Answer:** \(\boxed{36}\)
</details>

### Q5 — Cross-attention score tensor (Numeric Input)

How many raw cross-attention score cells are formed across the batch and all heads in one decoder layer?

*(Numeric input)*

<details>
<summary>Solution</summary>

Decoder positions provide 4 queries; encoder positions provide 6 keys. Include the batch and head axes:

\[
B\times h\times T_tT_s=2\times3\times4\times6=144.
\]

**Intuition:** cross-attention is “target asks, source answers.”

**Answer:** \(\boxed{144}\)
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

### Q8 — Encoder stack total (Numeric Input)

How many parameters are in the two-layer encoder stack?

*(Numeric input)*

<details>
<summary>Solution</summary>

An encoder layer has MHA, FFN, and two layer norms. Each layer norm has \(2d_{\text{model}}=48\) parameters:

\[
2400+2376+2(48)=4872.
\]

The two encoder layers do not share their parameters:

\[
2\times4872=\boxed{9744}.
\]

**Answer:** \(\boxed{9744}\)
</details>

### Q9 — Decoder stack total (Numeric Input)

How many parameters are in the three-layer decoder stack?

*(Numeric input)*

<details>
<summary>Solution</summary>

One decoder layer has masked self-attention, cross-attention, FFN, and three layer norms:

\[
2(2400)+2376+3(48)=7320.
\]

The three independent decoder layers therefore use

\[
3\times7320=\boxed{21960}.
\]

**Memory hook:** decoder = **two** attention modules + FFN + **three** norms.

**Answer:** \(\boxed{21960}\)
</details>

### Q10 — Output tensor versus output parameters (MCQ)

For \(B=2\), \(T_t=4\), and \(V_t=120\), which statement correctly describes the final vocabulary-logit tensor and the separate output projection's parameter count?

- ( ) Logits: \(2\times4\times120\) (960 scalars); projection: \(24\times120+120=3000\) parameters.
- ( ) Logits: \(2\times4\times24\) (192 scalars); projection: \(24+120=144\) parameters.
- ( ) Logits: \(2\times6\times120\) (1440 scalars); projection: \(24\times120=2880\) parameters.
- ( ) Logits: \(2\times4\times3\) (24 scalars); projection: \(3\) parameters.

<details>
<summary>Solution</summary>

The output tensor needs one vocabulary logit per target position:

\[
2\times4\times120=960.
\]

The shared linear layer maps each 24-dimensional state to 120 logits, with a 120-dimensional bias:

\[
24\times120+120=3000.
\]

Do not multiply the parameter count by batch size or target length; the same projection is reused at every target position.

**Answer:** A
</details>

### Q11 — Sequence probability and loss (Numeric Input)

A decoder assigns correct-token probabilities \(0.7\), then \(0.4\), then \(0.5\) to a three-token continuation. What is the **summed** negative log-likelihood, rounded to three decimals?

*(Numeric input)*

<details>
<summary>Solution</summary>

First combine the autoregressive probabilities:

\[
0.7\times0.4\times0.5=0.14.
\]

Then take negative natural log:

\[
-\ln(0.14)=1.966113\ldots\approx1.966.
\]

This is a **sum** over the three next-token losses. A mean loss would divide this value by 3.

**Answer:** \(\boxed{1.966}\)
</details>

### Q12 — Adaptive nucleus in the capstone (Numeric Input)

The next-token probabilities are \([0.50,0.20,0.15,0.15]\) in descending order. Under top-\(p\) sampling with \(p=0.80\), what is the renormalized probability of the first token, rounded to three decimals?

*(Numeric input)*

<details>
<summary>Solution</summary>

The cumulative masses are \(0.50\), \(0.70\), and \(0.85\), so the smallest nucleus contains the first three tokens. Keep mass \(0.85\), then normalize the first token:

\[
\frac{0.50}{0.85}=0.588235\ldots\approx0.588.
\]

**Answer:** \(\boxed{0.588}\)
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

### Q15 — Full architecture budget (Numeric Input)

Including source embeddings, target embeddings, the two-layer encoder stack, the three-layer decoder stack, and the target output projection, how many parameters does this model have?

*(Numeric input)*

<details>
<summary>Solution</summary>

First count the token tables:

\[
V_sd=100(24)=2400,\qquad V_td=120(24)=2880.
\]

Then combine every requested component:

\[
2400+2880+9744+21960+3000=39984.
\]

**Final checklist:** make a component list first, multiply unshared stacks by their layer count, and count each shared vocabulary projection once.

**Answer:** \(\boxed{39984}\)
</details>

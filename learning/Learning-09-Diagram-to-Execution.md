# Learning 09 — From Transformer Diagram to Computation

## Goal

Use a Transformer architecture diagram to derive tensor shapes, mask sizes, parameter counts, and generation behavior. The diagram is now a specification you can calculate from.

## Context for Q1–Q15

Use the same lettered architecture from Learning 08. In this exercise, the model has

\[
B=2,\quad T_s=5,\quad T_t=4,\quad d_{model}=32,\quad h=4,\quad d_h=8,\quad d_{ff}=64,
\]

\[
V_s=800,\qquad V_t=1000,\qquad N_e=N_d=2.
\]

All Q/K/V/output projections have biases, all layer norms have learned scale and bias, and encoder/decoder stacks do not share parameters.

![Lettered Transformer encoder-decoder architecture](assets/transformer-lettered-architecture.svg)

### Q1 — Source tensor at E (Short Answer)

What is the batch-first shape of the tensor entering E, the encoder self-attention sublayer?

<details>
<summary>Solution</summary>

E receives the source input representation after A and B have been added. Its axes are batch, source positions, and model width:

\[
\mathbb{R}^{B\times T_s\times d_{model}}
=\mathbb{R}^{2\times5\times32}.
\]

The addition at the bottom changes the representation's content, not its shape.

**Answer:** `2 × 5 × 32`
</details>

### Q2 — Encoder score tensor (Numeric Input)

How many raw attention-score cells are produced at E across all examples and heads in one encoder layer, before any padding mask?

*(Numeric input)*

<details>
<summary>Solution</summary>

At E, source queries compare with source keys, giving a \(T_s\times T_s\) table per head/example:

\[
B\times h\times T_s^2=2\times4\times5^2=\boxed{200}.
\]

Do not multiply by \(d_h\): that width is used inside each dot product, whereas this question counts the resulting scores.

**Answer:** \(\boxed{200}\)
</details>

### Q3 — Forbidden cells at L (Numeric Input)

How many score cells are masked as future positions at L across all examples and heads in one decoder layer?

*(Numeric input)*

<details>
<summary>Solution</summary>

L is masked decoder self-attention. One \(T_t=4\) causal mask has

\[
\frac{T_t(T_t-1)}2=\frac{4\cdot3}{2}=6
\]

strictly future cells. Repeat for 2 examples and 4 heads:

\[
2\times4\times6=\boxed{48}.
\]

**Check:** the full decoder score tensor has \(2\times4\times4^2=128\) cells, so 80 remain allowed.

**Answer:** \(\boxed{48}\)
</details>

### Q4 — Compare E, L, and O (MSQ)

Which statements correctly compare the three attention boxes in the diagram?

- ( ) E uses source states as Q, K, and V.
- ( ) L uses target states as Q, K, and V and applies a causal mask.
- ( ) O uses decoder states as Q and encoder state H as K and V.
- ( ) O must use a square \(T_t\times T_t\) score matrix.

<details>
<summary>Solution</summary>

E is encoder self-attention, L is masked decoder self-attention, and O is encoder-decoder cross-attention. Cross-attention compares target queries with source keys, so its score table is \(T_t\times T_s=4\times5\), not necessarily square.

**Memory hook:** E = source looks at source; L = target looks at past target; O = target looks at source.

**Answer:** A, B and C
</details>

### Q5 — Cross-attention scores at O (Numeric Input)

How many raw cross-attention score cells are produced at O across all examples and heads in one decoder layer?

*(Numeric input)*

<details>
<summary>Solution</summary>

O has one query per target position and one key per source position:

\[
B\times h\times T_t\times T_s
=2\times4\times4\times5
=\boxed{160}.
\]

The output still has one row per target query, so cross-attention preserves target length \(T_t\).

**Answer:** \(\boxed{160}\)
</details>

### Q6 — Mask-shape debugging (MCQ)

Which mask has the correct unbroadcasted shape for L in this model?

- ( ) \(5\times5\), because the source has five tokens
- ( ) \(4\times4\), because decoder queries compare with decoder keys
- ( ) \(4\times5\), because all decoder attention is cross-attention
- ( ) \(2\times4\times8\), because the head width is eight

<details>
<summary>Solution</summary>

L is decoder **self**-attention, so every target query needs a permission decision for every target key. Before batch/head broadcasting, that is \(T_t\times T_t=4\times4\).

The \(4\times5\) shape belongs to O's cross-attention score table, not L's causal mask.

**Answer:** B
</details>

### Q7 — One MHA module budget (Numeric Input)

How many parameters are in one MHA module at E, L, or O, including all four projection biases?

*(Numeric input)*

<details>
<summary>Solution</summary>

Packed multi-head attention has Q, K, V, and output maps. Each is \(32\to32\) with a 32-dimensional bias:

\[
4(d_{model}^2+d_{model})
=4(32^2+32)
=4(1056)
=\boxed{4224}.
\]

The number of heads changes how vectors are partitioned, but for fixed \(d_{model}\) it does not change this packed-projection total.

**Answer:** \(\boxed{4224}\)
</details>

### Q8 — One FFN budget (Numeric Input)

How many parameters are in either G or Q, a \(32\to64\to32\) feed-forward network with both biases?

*(Numeric input)*

<details>
<summary>Solution</summary>

The expansion map contributes \(32\cdot64+64=2112\). The contraction map contributes \(64\cdot32+32=2080\). Therefore

\[
2112+2080=\boxed{4192}.
\]

Attention exchanges information between positions; G/Q apply this nonlinear transformation independently at each position.

**Answer:** \(\boxed{4192}\)
</details>

### Q9 — Two-stack block budget (Numeric Input)

Ignoring embeddings and output projection, how many parameters are in the two encoder layers plus two decoder layers?

*(Numeric input)*

<details>
<summary>Solution</summary>

One encoder layer has one MHA, one FFN, and two layer norms:

\[
4224+4192+2(64)=8544.
\]

One decoder layer has two MHA modules, one FFN, and three layer norms:

\[
2(4224)+4192+3(64)=12832.
\]

There are two of each:

\[
2(8544)+2(12832)=\boxed{42752}.
\]

**Answer:** \(\boxed{42752}\)
</details>

### Q10 — Residual and normalization flow (MSQ)

Which statements are correct about F, H, M, P, and R?

- ( ) Each follows a learned sublayer and receives a residual addition.
- ( ) They each contain learned layer-normalization scale and bias vectors.
- ( ) They create a new attention-score matrix by themselves.
- ( ) Their count differs because the decoder has three learned sublayers while the encoder has two.

<details>
<summary>Solution</summary>

These blocks are the post-sublayer Add & Norm stages. Each combines a sublayer's output with its bypassed input, then normalizes features using learned \(\gamma\) and \(\beta\). Score matrices belong to E, L, and O—not to normalization blocks.

**Answer:** A, B and D
</details>

### Q11 — Output-logit volume (Numeric Input)

At T, how many vocabulary-logit scalars are produced for the whole batch before selecting/sampling a token?

*(Numeric input)*

<details>
<summary>Solution</summary>

The output head creates one \(V_t=1000\)-way logit vector for every target position in every example:

\[
B\times T_t\times V_t=2\times4\times1000=\boxed{8000}.
\]

The output-projection parameters are shared across those 8 positions; volume and parameter count are different quantities.

**Answer:** \(\boxed{8000}\)
</details>

### Q12 — Decoder loss from the diagram's output (Numeric Input)

At the four target positions, T assigns correct-token probabilities \(0.5\), \(0.25\), \(0.8\), and \(0.4\). What is the summed next-token negative log-likelihood, rounded to three decimals?

*(Numeric input)*

<details>
<summary>Solution</summary>

First multiply the conditional probabilities for the teacher-forced target:

\[
0.5\times0.25\times0.8\times0.4=0.04.
\]

Then take the negative natural log:

\[
-\ln(0.04)=3.218876\ldots\approx\boxed{3.219}.
\]

If a prompt asks for the **mean** loss, divide this sum by 4; it did not here.

**Answer:** \(\boxed{3.219}\)
</details>

### Q13 — Cross-attention diagnosis (MCQ)

An implementation sends the encoder output H to L as K and V, and sends the output of M to O as Q. What is wrong?

- ( ) Nothing: this is the standard order
- ( ) H belongs at O as K/V; L must first perform masked target self-attention
- ( ) H should be sent to Q only after softmax
- ( ) The decoder needs no target embeddings C

<details>
<summary>Solution</summary>

The diagram's order is C/D → L → M → O. L must build a causally valid target-side state. Only then does O use that decoder representation as Q to retrieve relevant information from source memory H as K and V.

Putting H at L turns the first decoder sublayer into the wrong operation and loses the intended masked self-attention stage.

**Answer:** B
</details>

### Q14 — Q/K/V ownership (Short Answer)

For cross-attention component O, state who supplies Q and who supplies K and V.

<details>
<summary>Solution</summary>

The decoder representation coming from M supplies the queries. The encoder's final state H supplies keys and values:

\[
Q=\text{decoder state},\qquad K,V=H_{\text{encoder}}.
\]

This split is why cross-attention can align a target position with relevant source positions.

**Answer:** `Q: decoder state; K,V: encoder state H`
</details>

### Q15 — End-to-end diagram checkpoint (MSQ)

Choose every correct statement for this model.

- ( ) The source-to-target information route is A/B → E/F/G/H → O → P/Q/R → S/T/U.
- ( ) A target position's probability at U can depend on source tokens through O and earlier target tokens through L.
- ( ) Causal masking belongs at O because it is the only decoder attention operation.
- ( ) During inference, a token selected from U is appended to the shifted-right target prefix before the next pass through C/D.

<details>
<summary>Solution</summary>

Source information flows through the encoder into H, then reaches the decoder through O. L handles target-side causal history, while O reads source context. At inference, the generated token becomes part of the next prefix; no future gold token is available.

The causal mask belongs at L, not O. Cross-attention may use all source positions because they are given input, not future target labels.

**Answer:** A, B and D
</details>

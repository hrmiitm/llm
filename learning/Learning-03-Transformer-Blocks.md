# Learning 03 — Transformer Blocks and Parameter Counting

## Goal

Assemble encoder and decoder layers from attention, feed-forward networks, residual paths, and layer normalization. Then count their trainable parameters accurately.

![Encoder-decoder transformer](assets/transformer-encoder-decoder.svg)

For Questions 1–10, consider a one-layer encoder-decoder transformer with

\[
d_{\text{model}}=32,\quad h=4,\quad d_h=8,\quad d_{ff}=64,
\quad V_s=100,\quad V_t=120.
\]

Assume every linear projection has a bias, every layer norm has a scale and bias, and the source and target embeddings are separate.

### Q1 — Head width (Numeric Input)

What is \(d_h\), the width processed by one attention head?

*(Numeric input)*

<details>
<summary>Solution</summary>

Heads split the model width evenly:

\[
d_h=\frac{d_{\text{model}}}{h}=\frac{32}{4}=8.
\]

**Mnemonic:** model width divided by **h**eads gives **h**ead width.

**Answer:** \(\boxed{8}\)
</details>

### Q2 — One head's query shape (Short Answer)

For a sequence of 5 tokens, what is the shape of the projected query matrix for one head?

<details>
<summary>Solution</summary>

There is one query row per token and \(d_h=8\) features per head:

\[
Q_{\text{one head}}\in\mathbb{R}^{5\times8}.
\]

**Answer:** `5 × 8`
</details>

### Q3 — Self-attention score cells (Numeric Input)

For a five-token self-attention sequence, how many score cells does one head have before masking?

*(Numeric input)*

<details>
<summary>Solution</summary>

Self-attention compares every query token with every key token:

\[
T\times T=5\times5=25.
\]

**Answer:** \(\boxed{25}\)
</details>

### Q4 — Cross-attention score cells (Numeric Input)

If the decoder has 4 target tokens and the encoder has 5 source tokens, how many scores does one cross-attention head form?

*(Numeric input)*

<details>
<summary>Solution</summary>

Cross-attention has a query for each target token and a key for each source token:

\[
T_t\times T_s=4\times5=20.
\]

The score table is rectangular when source and target lengths differ.

**Answer:** \(\boxed{20}\)
</details>

### Q5 — Multi-head attention parameters (Numeric Input)

How many parameters are in one multi-head-attention module, including the \(W_Q,W_K,W_V,W_O\) matrices and their biases?

*(Numeric input)*

<details>
<summary>Solution</summary>

In an implementation, the heads are commonly packed into four \(32\times32\) projections:

\[
4(d_{\text{model}}^2+d_{\text{model}})
=4(32^2+32)=4(1056)=4224.
\]

**Memory hook:** MHA has **four** learned maps: Q, K, V, and Out.

**Answer:** \(\boxed{4224}\)
</details>

### Q6 — Feed-forward parameters (Numeric Input)

How many parameters are in one two-layer FFN, including both biases?

*(Numeric input)*

<details>
<summary>Solution</summary>

The FFN expands then contracts:

\[
32\to64\to32.
\]

\[
(32\cdot64+64)+(64\cdot32+32)
=2112+2080=4192.
\]

**Intuition:** attention moves information *between* tokens; the FFN transforms information *within* each token position.

**Answer:** \(\boxed{4192}\)
</details>

### Q7 — Layer norm parameters (Numeric Input)

How many trainable parameters are in one layer-normalization module over \(d_{\text{model}}=32\)?

*(Numeric input)*

<details>
<summary>Solution</summary>

Layer norm learns a scale \(\gamma\) and offset \(\beta\) for each feature:

\[
2d_{\text{model}}=2\cdot32=64.
\]

Do not confuse these with batch-normalization statistics; layer norm operates across features of each example/token.

**Answer:** \(\boxed{64}\)
</details>

### Q8 — Encoder-layer total (Numeric Input)

An encoder layer has one MHA module, one FFN, and two layer norms. How many parameters does this encoder layer have?

*(Numeric input)*

<details>
<summary>Solution</summary>

\[
\text{encoder}=4224+4192+2(64)=8544.
\]

Residual connections add activations but no trainable parameters.

**Answer:** \(\boxed{8544}\)
</details>

### Q9 — Decoder-layer total (Numeric Input)

A decoder layer has masked self-attention, cross-attention, one FFN, and three layer norms. How many parameters does it have?

*(Numeric input)*

<details>
<summary>Solution</summary>

It contains two MHA modules:

\[
\text{decoder}=2(4224)+4192+3(64)
=8448+4192+192=12832.
\]

**Mnemonic:** encoder: one attention; decoder: **self + source** attention.

**Answer:** \(\boxed{12832}\)
</details>

### Q10 — Embedding tables (Numeric Input)

How many parameters are in the separate source and target token embedding tables together?

*(Numeric input)*

<details>
<summary>Solution</summary>

Each vocabulary item has a \(32\)-dimensional embedding:

\[
V_s d_{\text{model}} + V_t d_{\text{model}}
=100(32)+120(32)=7040.
\]

**Answer:** \(\boxed{7040}\)
</details>

### Q11 — Output projection (Numeric Input)

How many parameters are in the target vocabulary output layer, including its bias, if it maps \(32\) features to \(V_t=120\) logits?

*(Numeric input)*

<details>
<summary>Solution</summary>

\[
d_{\text{model}}V_t+V_t=32(120)+120=3960.
\]

Its output is one logit for every possible next target token.

**Answer:** \(\boxed{3960}\)
</details>

### Q12 — What has parameters? (MSQ)

Which components contain trainable parameters in the usual transformer block?

- ( ) The Q/K/V/output projections
- ( ) The two FFN linear layers
- ( ) Layer norm's scale and bias
- ( ) A residual addition by itself

<details>
<summary>Solution</summary>

Projections and FFN layers have weights/biases. Layer norm has learned \(\gamma\) and \(\beta\). A residual path is simply an addition such as \(x+\operatorname{MHA}(x)\), so it does not introduce a parameter tensor.

**Answer:** A, B and C
</details>

### Q13 — Why residual paths? (MCQ)

What is the main role of a residual connection such as \(x+\operatorname{FFN}(x)\)?

- ( ) It removes the need for attention
- ( ) It gives information and gradients a direct route through the layer
- ( ) It makes all token vectors identical
- ( ) It replaces the vocabulary softmax

<details>
<summary>Solution</summary>

The layer learns a useful modification to \(x\) while retaining a direct identity route. This supports stable optimization in deep stacks.

**Memory hook:** residual means “keep the original, add the refinement.”

**Answer:** B
</details>

### Q14 — Where is the nonlinearity? (MCQ)

Which component normally supplies a pointwise nonlinearity such as ReLU or GELU?

- ( ) The feed-forward network
- ( ) The causal-mask triangle
- ( ) The vocabulary index
- ( ) The residual addition alone

<details>
<summary>Solution</summary>

The FFN is typically

\[
\operatorname{FFN}(x)=W_2\,\sigma(W_1x+b_1)+b_2,
\]

where \(\sigma\) is the nonlinearity. It processes each token position independently after attention has shared context.

**Answer:** A
</details>

### Q15 — Decoder count formula (Short Answer)

Write the component-level parameter formula for one decoder layer, using the symbols MHA, FFN, and LN.

<details>
<summary>Solution</summary>

The decoder contains masked self-attention, cross-attention, an FFN, and three layer norms:

\[
2\operatorname{MHA}+\operatorname{FFN}+3\operatorname{LN}.
\]

Use this structure before inserting any dimensions; it prevents double-counting or missing cross-attention.

**Answer:** `2 MHA + FFN + 3 LN`
</details>

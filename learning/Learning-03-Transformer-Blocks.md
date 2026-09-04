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

### Q2 — Batched head projection shape (Short Answer)

For a batch of 3 sequences of length 5, what is the shape of the projected query tensor for **one** head? Use batch-first order.

<details>
<summary>Solution</summary>

There is one query row per token, \(d_h=8\) features per head, and one such matrix for each batch item:

\[
Q_{\text{one head}}\in\mathbb{R}^{3\times5\times8}.
\]

If all heads are kept in one tensor, an additional head axis would give \(3\times4\times5\times8\). The question asks for a single head, so omit that axis.

**Answer:** `3 × 5 × 8`
</details>

### Q3 — Batched multi-head self-attention work (Numeric Input)

For the batch of 3 five-token sequences and 4 heads, how many raw self-attention score cells are formed before masking?

*(Numeric input)*

<details>
<summary>Solution</summary>

Each head in each example compares every query token with every key token:

\[
 B\times h\times T^2=3\times4\times5^2=300.
\]

This counts score cells, not the \(d_h\)-length dot-product multiplications used to produce them.

**Answer:** \(\boxed{300}\)
</details>

### Q4 — Batched cross-attention score cells (Numeric Input)

For the same batch size and 4 heads, if the decoder has 4 target tokens and the encoder has 5 source tokens, how many cross-attention scores are formed before masking?

*(Numeric input)*

<details>
<summary>Solution</summary>

Cross-attention has a query for each target token and a key for each source token, for every head and batch example:

\[
B\times h\times T_t\times T_s=3\times4\times4\times5=240.
\]

The per-head score table is \(4\times5\), so it is rectangular; the batch and head axes multiply the count.

**Answer:** \(\boxed{240}\)
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

### Q7 — Encoder normalization parameters (Numeric Input)

How many trainable parameters are used by the **two** layer-normalization modules in one encoder layer?

*(Numeric input)*

<details>
<summary>Solution</summary>

One layer norm learns a scale \(\gamma\) and offset \(\beta\) for each feature:

\[
2d_{\text{model}}=2\cdot32=64.
\]

The encoder has two of them, so \(2\times64=128\). Do not confuse these with batch-normalization statistics; layer norm operates across features of each example/token.

**Answer:** \(\boxed{128}\)
</details>

### Q8 — Two-layer encoder stack (Numeric Input)

How many parameters are in a **two-layer encoder stack**, assuming both layers use the stated dimensions but do not share weights?

*(Numeric input)*

<details>
<summary>Solution</summary>

First count one encoder layer:

\[
4224+4192+128=8544.
\]

The two layers have independent parameters, so

\[
2\times8544=17088.
\]

Residual connections add activations but no trainable parameters.

**Answer:** \(\boxed{17088}\)
</details>

### Q9 — Three-layer decoder stack (Numeric Input)

How many parameters are in a **three-layer decoder stack**, assuming independent parameters in each layer?

*(Numeric input)*

<details>
<summary>Solution</summary>

First count one decoder layer. It contains two MHA modules:

\[
\text{decoder}=2(4224)+4192+3(64)
=8448+4192+192=12832.
\]

Then multiply by the three unshared layers:

\[
3\times12832=38496.
\]

**Mnemonic:** encoder: one attention; decoder: **self + source** attention.

**Answer:** \(\boxed{38496}\)
</details>

### Q10 — All vocabulary-facing parameters (Numeric Input)

How many parameters are in the source embedding table, target embedding table, and separate target output projection (including its bias) together?

*(Numeric input)*

<details>
<summary>Solution</summary>

Each vocabulary item has a \(32\)-dimensional embedding:

\[
V_s d_{\text{model}} + V_t d_{\text{model}}
=100(32)+120(32)=7040.
\]

The untied output layer contributes

\[
32(120)+120=3960.
\]

Therefore the vocabulary-facing total is \(7040+3960=11000\). This total would be smaller if target input/output weights were tied.

**Answer:** \(\boxed{11000}\)
</details>

### Q11 — Weight tying changes the budget (Numeric Input)

In a **hypothetical tied-weight variant**, the target input embedding matrix is reused as the target output projection matrix; the source embedding remains separate and the target output bias remains. How many vocabulary-facing parameters does this tied variant have?

*(Numeric input)*

<details>
<summary>Solution</summary>

1. Source embedding: \(100\times32=3200\).
2. One shared target embedding/output matrix: \(120\times32=3840\).
3. Output bias: \(120\).

\[
3200+3840+120=\boxed{7160}.
\]

Compare this with Q10's untied \(11000\): tying removes one duplicate \(32\times120\) target matrix, but not the output bias.

**Answer:** \(\boxed{7160}\)
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

### Q15 — Architecture budget checkpoint (Numeric Input)

Combine the two-layer encoder stack, three-layer decoder stack, and all vocabulary-facing parameters from Q8–Q10. What is the model's total trainable parameter count under the assumptions in this assignment?

*(Numeric input)*

<details>
<summary>Solution</summary>

Keep the three disjoint groups separate before adding:

\[
\underbrace{17088}_{\text{two encoder layers}}
+\underbrace{38496}_{\text{three decoder layers}}
+\underbrace{11000}_{\text{embeddings + output}}.
\]

Thus

\[
17088+38496+11000=\boxed{66584}.
\]

**Check:** the output layer is included once in Q10; do not accidentally add it again.

**Answer:** \(\boxed{66584}\)
</details>

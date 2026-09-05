# Learning 03 — Transformer Blocks and Parameter Counting

> **Goal:** Assemble encoder and decoder layers from attention, feed-forward networks, residual paths, and layer normalization. Then count their trainable parameters accurately from first principles.
> **How to use this assignment:** Attempt a question, then open its solution. Every solution ends with a short memory hook.

## Context for Q1–Q10

Consider a one-layer encoder-decoder transformer with the following specifications:

$$d_{\text{model}}=32, \quad h=4, \quad d_h=8, \quad d_{ff}=64, \quad V_s=100, \quad V_t=120.$$

**Architectural assumptions:**
- Every linear projection has a learnable weight matrix and a bias vector.
- Every layer normalization module has a learnable scale ($\gamma$) and bias ($\beta$) per feature.
- Source and target input embedding tables are separate (untied).

![Encoder-decoder transformer](assets/transformer-encoder-decoder.mmd)

---

### Q1 — Head width (Numeric Input)

**What is $d_h$, the feature width processed by one attention head?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{8}$

#### Step-by-step solution

1. **How Multi-Head Attention splits dimensionality:**
   Instead of performing a single attention function with an expensive $d_{\text{model}}$-dimensional vector, the model projects queries, keys, and values into $h$ separate lower-dimensional subspaces of width $d_h$.

2. **The relationship between $d_{\text{model}}$, $h$, and $d_h$:**
   In the standard Transformer design (Vaswani et al. 2017), the heads split the total model dimension evenly:
   $$d_h = \frac{d_{\text{model}}}{h} = \frac{32}{4} = \boxed{8}.$$

3. **Why this matters:**
   Because each head operates on $d_h = 8$ instead of $32$, running $4$ heads in parallel costs roughly the same total computation (FLOPs) as a single full-dimensional attention head, while allowing the model to jointly attend to information from different representation subspaces.

**Memory hook:** Model width divided by **h**eads gives **h**ead width: $d_h = d_{\text{model}} / h$.

</details>

---

### Q2 — Batched head projection shape (MCQ)

**For a batch of 3 sequences of length 5, what is the shape of the projected query tensor for one head? Use batch-first order.**

- ( ) $3 \times 5 \times 8$
- ( ) $3 \times 5 \times 32$
- ( ) $3 \times 4 \times 5 \times 8$
- ( ) $5 \times 3 \times 8$

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A

#### Step-by-step solution

1. **Understand batch-first tensor axes:**
   In batch-first convention, tensor dimensions are arranged as:
   $$(\text{Batch Size } B, \text{ Sequence Length } T, \text{ Feature Dimension}).$$

2. **Determine the values:**
   - Batch size: $B = 3$ sequences.
   - Sequence length: $T = 5$ tokens per sequence.
   - For **one head**, the feature dimension is the head width: $d_h = 8$.

3. **Assemble the shape:**
   $$Q_{\text{one head}} \in \mathbb{R}^{B \times T \times d_h} = \mathbb{R}^{3 \times 5 \times 8}.$$

4. **Why the other choices are incorrect:**
   - $3 \times 5 \times 32$: Uses full model dimension $d_{\text{model}}=32$ instead of single head width $d_h=8$.
   - $3 \times 4 \times 5 \times 8$: Represents the full multi-head tensor across all $4$ heads ($(B, h, T, d_h)$), rather than the requested single head.
   - $5 \times 3 \times 8$: Inverts batch size and sequence length (time-first rather than batch-first).

**Memory hook:** One head shape = **Batch $\times$ Time $\times$ Head-Width** ($B \times T \times d_h$). $\boxed{\text{A}}$

</details>

---

### Q3 — Batched multi-head self-attention work (Numeric Input)

**For the batch of 3 five-token sequences and 4 heads, how many raw self-attention score cells are formed before masking?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{300}$

#### Step-by-step solution

1. **Pairwise interactions per head:**
   In self-attention, each query token compares against every key token in the same sequence.
   For a sequence of length $T = 5$, the attention score matrix $S = QK^\top$ has size:
   $$T \times T = 5 \times 5 = 25 \text{ score cells.}$$

2. **Multiply across all heads and batch examples:**
   - There are $h = 4$ independent attention heads per sequence.
   - There are $B = 3$ independent sequences in the batch.

3. **Total score volume:**
   $$\text{Total score cells} = B \times h \times T^2 = 3 \times 4 \times (5 \times 5) = 12 \times 25 = \boxed{300}.$$

This counts the total scalar attention logits stored in memory across the entire mini-batch.

**Memory hook:** Batch $\times$ Heads $\times T^2 = B \cdot h \cdot T^2$.

</details>

---

### Q4 — Batched cross-attention score cells (Numeric Input)

**For the same batch size and 4 heads, if the decoder has 4 target tokens and the encoder has 5 source tokens, how many cross-attention scores are formed before masking?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{240}$

#### Step-by-step solution

1. **Cross-attention score matrix per head:**
   In encoder-decoder cross-attention:
   - Queries come from the decoder ($T_t = 4$ target tokens).
   - Keys come from the encoder ($T_s = 5$ source tokens).
   Each head forms a rectangular score matrix of size:
   $$T_t \times T_s = 4 \times 5 = 20 \text{ score cells.}$$

2. **Multiply across all heads and batch examples:**
   - Batch size: $B = 3$.
   - Attention heads: $h = 4$.

3. **Total cross-attention score cells:**
   $$\text{Total cells} = B \times h \times T_t \times T_s = 3 \times 4 \times 4 \times 5 = 12 \times 20 = \boxed{240}.$$

Notice that while self-attention is square ($T^2$), cross-attention is rectangular ($T_t \times T_s$).

**Memory hook:** Cross-attention score volume = $B \cdot h \cdot T_{\text{target}} \cdot T_{\text{source}}$.

</details>

---

### Q5 — Multi-head attention parameters (Numeric Input)

**How many parameters are in one multi-head-attention module, including the $W_Q, W_K, W_V, W_O$ matrices and their biases?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{4224}$

#### Step-by-step solution

1. **Identify the 4 linear projections in Multi-Head Attention:**
   Every MHA module has 4 learned affine transformations:
   - Query projection: $W_Q \in \mathbb{R}^{d_{\text{model}} \times d_{\text{model}}}$ with bias $b_Q \in \mathbb{R}^{d_{\text{model}}}$.
   - Key projection: $W_K \in \mathbb{R}^{d_{\text{model}} \times d_{\text{model}}}$ with bias $b_K \in \mathbb{R}^{d_{\text{model}}}$.
   - Value projection: $W_V \in \mathbb{R}^{d_{\text{model}} \times d_{\text{model}}}$ with bias $b_V \in \mathbb{R}^{d_{\text{model}}}$.
   - Output projection: $W_O \in \mathbb{R}^{d_{\text{model}} \times d_{\text{model}}}$ with bias $b_O \in \mathbb{R}^{d_{\text{model}}}$.

2. **Count parameters for one projection:**
   With $d_{\text{model}} = 32$:
   - Weight matrix: $32 \times 32 = 1024$ parameters.
   - Bias vector: $32$ parameters.
   - Total per projection: $1024 + 32 = 1056$ parameters.

3. **Sum all 4 projections:**
   $$\text{Total MHA parameters} = 4 \times (d_{\text{model}}^2 + d_{\text{model}}) = 4 \times 1056 = \boxed{4224}.$$

*(Note: In implementation, the $h$ heads are packed together into single large projection matrices of shape $d_{\text{model}} \times d_{\text{model}}$, where $h \times d_h = 4 \times 8 = 32 = d_{\text{model}}$).*

**Memory hook:** Multi-Head Attention has **4 projections**: Q, K, V, and Output.

</details>

---

### Q6 — Feed-forward parameters (Numeric Input)

**How many parameters are in one two-layer FFN, including both biases?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{4192}$

#### Step-by-step solution

1. **Understand the Position-wise Feed-Forward Network:**
   The FFN consists of two linear layers with an activation function $\sigma$ (such as ReLU or GELU) in between:
   $$\operatorname{FFN}(x) = \sigma(x W_1 + b_1) W_2 + b_2.$$
   It projects from $d_{\text{model}} \to d_{ff} \to d_{\text{model}}$ ($32 \to 64 \to 32$).

2. **Count Layer 1 parameters ($32 \to 64$ expansion):**
   - Weight matrix $W_1$: shape $32 \times 64 = 2048$ weights.
   - Bias vector $b_1$: shape $64$ biases.
   - Subtotal Layer 1: $2048 + 64 = 2112$.

3. **Count Layer 2 parameters ($64 \to 32$ contraction):**
   - Weight matrix $W_2$: shape $64 \times 32 = 2048$ weights.
   - Bias vector $b_2$: shape $32$ biases.
   - Subtotal Layer 2: $2048 + 32 = 2080$.

4. **Sum both layers:**
   $$\text{Total FFN parameters} = 2112 + 2080 = \boxed{4192}.$$

**Memory hook:** FFN expands then contracts: $(d \cdot d_{ff} + d_{ff}) + (d_{ff} \cdot d + d)$.

</details>

---

### Q7 — Encoder normalization parameters (Numeric Input)

**How many trainable parameters are used by the two layer-normalization modules in one encoder layer?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{128}$

#### Step-by-step solution

1. **What parameters does LayerNorm learn?**
   Layer Normalization normalizes activations across the feature dimension $d_{\text{model}} = 32$ for each token independently:
   $$y = \frac{x - \mu}{\sqrt{\sigma^2 + \epsilon}} \odot \boldsymbol{\gamma} + \boldsymbol{\beta}.$$
   It has two learnable parameters per feature:
   - Scale / gain: $\boldsymbol{\gamma} \in \mathbb{R}^{d_{\text{model}}}$ ($32$ parameters).
   - Shift / bias: $\boldsymbol{\beta} \in \mathbb{R}^{d_{\text{model}}}$ ($32$ parameters).
   Total per LayerNorm: $2 \times d_{\text{model}} = 2 \times 32 = 64$ parameters.

2. **Count LayerNorms in one Encoder Layer:**
   A standard Transformer encoder layer has **two** sublayers, each followed by Add & Norm:
   - Sublayer 1: Multi-Head Self-Attention $\to$ LayerNorm 1.
   - Sublayer 2: Feed-Forward Network $\to$ LayerNorm 2.

3. **Total for 2 LayerNorms:**
   $$\text{Total parameters} = 2 \times 64 = \boxed{128}.$$

**Memory hook:** LayerNorm learns **gain ($\gamma$) and bias ($\beta$)**: $2 \times d_{\text{model}}$ per norm module.

</details>

---

### Q8 — Two-layer encoder stack (Numeric Input)

**How many parameters are in a two-layer encoder stack, assuming both layers use the stated dimensions but do not share weights?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{17088}$

#### Step-by-step solution

1. **Sum the components of ONE Encoder Layer:**
   From Q5, Q6, and Q7:
   - Multi-Head Self-Attention: $4224$ parameters.
   - Position-wise FFN: $4192$ parameters.
   - Two Layer Normalization modules: $128$ parameters.
   *(Note: Residual skip connections perform simple elementwise addition $x + \operatorname{Sublayer}(x)$ and have 0 parameters).*

   $$\text{Parameters per encoder layer} = 4224 + 4192 + 128 = 8544.$$

2. **Multiply by the number of unshared layers ($N = 2$):**
   $$\text{Total encoder stack} = 2 \times 8544 = \boxed{17088}.$$

**Memory hook:** One encoder layer = Attention ($4224$) + FFN ($4192$) + $2\times$LN ($128$) = $8544$. Multiply by $N$.

</details>

---

### Q9 — Three-layer decoder stack (Numeric Input)

**How many parameters are in a three-layer decoder stack, assuming independent parameters in each layer?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{38496}$

#### Step-by-step solution

1. **Understand what makes a Decoder Layer unique:**
   Unlike an encoder layer (which has 2 sublayers), each decoder layer contains **3 sublayers**, each followed by residual connection and LayerNorm:
   - Sublayer 1: **Masked Multi-Head Self-Attention** (attends to previous target tokens).
   - Sublayer 2: **Multi-Head Cross-Attention** (attends to encoder source states).
   - Sublayer 3: **Position-wise Feed-Forward Network**.
   - **Three LayerNorm modules** (one for each sublayer).

2. **Calculate parameters for ONE Decoder Layer:**
   - Masked MHA module: $4224$ parameters.
   - Cross-Attention MHA module: $4224$ parameters.
   - FFN module: $4192$ parameters.
   - 3 LayerNorm modules: $3 \times (2 \times d_{\text{model}}) = 3 \times 64 = 192$ parameters.

   $$\text{Parameters per decoder layer} = 4224 + 4224 + 4192 + 192 = 12832.$$

3. **Multiply by the number of unshared layers ($N = 3$):**
   $$\text{Total decoder stack} = 3 \times 12832 = \boxed{38496}.$$

**Memory hook:** Decoder = **2 Attention modules + 1 FFN + 3 LayerNorms** per layer.

</details>

---

### Q10 — All vocabulary-facing parameters (Numeric Input)

**How many parameters are in the source embedding table, target embedding table, and separate target output projection (including its bias) together?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{11000}$

#### Step-by-step solution

1. **Given vocabulary dimensions:**
   - Source vocabulary: $V_s = 100$.
   - Target vocabulary: $V_t = 120$.
   - Model dimension: $d_{\text{model}} = 32$.

2. **Count the 3 vocabulary components:**
   - **Source Input Embedding Table:**
     Stores one 32-dim vector for each source word:
     $$V_s \times d_{\text{model}} = 100 \times 32 = 3200.$$
   - **Target Input Embedding Table:**
     Stores one 32-dim vector for each target word:
     $$V_t \times d_{\text{model}} = 120 \times 32 = 3840.$$
   - **Target Output Projection Layer (Unembedding / LM Head):**
     Maps from $d_{\text{model}} \to V_t$:
     - Weights: $d_{\text{model}} \times V_t = 32 \times 120 = 3840$.
     - Biases: $V_t = 120$.
     - Subtotal output layer: $3840 + 120 = 3960$.

3. **Sum all three components:**
   $$\text{Total} = 3200 \text{ (source in)} + 3840 \text{ (target in)} + 3960 \text{ (target out)} = \boxed{11000}.$$

**Memory hook:** Vocabulary total = **Source in** + **Target in** + **Target out (weights + bias)**.

</details>

---

### Q11 — Weight tying changes the budget (Numeric Input)

**In a hypothetical tied-weight variant, the target input embedding matrix is reused as the target output projection matrix; the source embedding remains separate and the target output bias remains. How many vocabulary-facing parameters does this tied variant have?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{7160}$

#### Step-by-step solution

1. **What is Weight Tying?**
   In weight tying (Press & Wolf 2017; Vaswani et al. 2017), the target output projection weight matrix is tied to the transpose of the target input embedding table:
   $$W_{\text{out}} = E_{\text{target}}^\top.$$
   The same matrix is shared between input lookup and output projection, eliminating an entire duplicate matrix of weights.

2. **Count parameters with weight tying:**
   - **Source embedding:** $100 \times 32 = 3200$.
   - **Shared target embedding / output matrix (counted once):** $120 \times 32 = 3840$.
   - **Target output bias (still separate):** $120$.

3. **Sum the tied parameter budget:**
   $$\text{Tied Total} = 3200 + 3840 + 120 = \boxed{7160}.$$

4. **Verify the savings:**
   Untied total (Q10) was $11000$.
   Tying saves exactly one $120 \times 32 = 3840$ weight matrix:
   $$11000 - 3840 = 7160.$$

**Memory hook:** Weight tying shares the **embedding matrix**, but leaves the **output bias** intact!

</details>

---

### Q12 — What has parameters? (MSQ)

**Which components contain trainable parameters in the usual transformer block? (Select all that apply.)**

- ( ) The Q/K/V/output projections
- ( ) The two FFN linear layers
- ( ) Layer norm's scale and bias
- ( ) A residual addition by itself

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A, B and C

#### Step-by-step solution

1. **Evaluating each component:**
   - **A is TRUE:** The attention projection maps ($W_Q, b_Q, W_K, b_K, W_V, b_V, W_O, b_O$) are learnable weight matrices and bias vectors.
   - **B is TRUE:** The two feed-forward linear transformations ($W_1, b_1, W_2, b_2$) are learnable weight matrices and bias vectors.
   - **C is TRUE:** Layer Normalization learns a scale parameter $\gamma$ and shift parameter $\beta$ for each feature.
   - **D is FALSE:** A residual connection simply computes elementwise vector addition:
     $$\text{Output} = x + \operatorname{Sublayer}(x).$$
     There are no weights, biases, or learnable parameters associated with this addition.

**Memory hook:** Residual connections are **pure addition**—zero parameters! $\boxed{\text{A, B, C}}$

</details>

---

### Q13 — Why residual paths? (MCQ)

**What is the main role of a residual connection such as $x+\operatorname{FFN}(x)$?**

- ( ) It removes the need for attention
- ( ) It gives information and gradients a direct route through the layer
- ( ) It makes all token vectors identical
- ( ) It replaces the vocabulary softmax

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B

#### Step-by-step solution

1. **The Vanishing Gradient Problem in Deep Stacks:**
   When stacking 12, 24, or 96 Transformer layers, repeatedly multiplying activations by weight matrices causes gradients to shrink exponentially during backpropagation (vanishing gradients).

2. **The "Gradient Highway" of Residual Connections:**
   In a residual block $y = x + F(x)$, the gradient with respect to input $x$ is:
   $$\frac{\partial y}{\partial x} = I + \frac{\partial F(x)}{\partial x}.$$
   Because of the identity term $I$, gradients can flow backward through dozens of layers completely unimpeded, even if $\frac{\partial F(x)}{\partial x}$ is small!

3. **Refinement rather than replacement:**
   Residual connections allow each layer to learn a subtle refinement ($F(x)$) to the representation, rather than having to reconstruct the entire representation from scratch.

**Memory hook:** Residual means **gradient highway**—it keeps the original and adds the refinement. $\boxed{\text{B}}$

</details>

---

### Q14 — Where is the nonlinearity? (MCQ)

**Which component normally supplies a pointwise nonlinearity such as ReLU or GELU?**

- ( ) The feed-forward network
- ( ) The causal-mask triangle
- ( ) The vocabulary index
- ( ) The residual addition alone

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A

#### Step-by-step solution

1. **Linearity of other components:**
   - Multi-head attention projections ($W_Q, W_K, W_V, W_O$) are purely linear.
   - Attention weights combine value vectors linearly: $Z = AV$.
   - Residual connections are linear additions ($x + y$).
   Without non-linear activations, stacking linear layers would simply collapse mathematically into a single giant linear matrix multiplication!

2. **The role of the Feed-Forward Network:**
   The non-linear expressive power is injected inside the FFN:
   $$\operatorname{FFN}(x) = \sigma(x W_1 + b_1) W_2 + b_2.$$
   The activation function $\sigma$ (e.g., ReLU in the original 2017 Transformer, GELU in BERT/GPT, or SwiGLU in LLaMA) applies a non-linear activation independently to each token position.

**Memory hook:** Attention moves context; the **FFN provides the non-linear computation**. $\boxed{\text{A}}$

</details>

---

### Q15 — Architecture budget checkpoint (Numeric Input)

**Combine the two-layer encoder stack, three-layer decoder stack, and all vocabulary-facing parameters from Q8–Q10. What is the model's total trainable parameter count under the assumptions in this assignment?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{66584}$

#### Step-by-step solution

1. **Recall the 3 mutually exclusive components:**
   - **Two-layer encoder stack (from Q8):**
     $$2 \times 8544 = 17088 \text{ parameters.}$$
   - **Three-layer decoder stack (from Q9):**
     $$3 \times 12832 = 38496 \text{ parameters.}$$
   - **Untied vocabulary-facing parameters (from Q10):**
     $$3200 \text{ (source in)} + 3840 \text{ (target in)} + 3960 \text{ (target out)} = 11000 \text{ parameters.}$$

2. **Sum all three components:**
   $$\text{Total parameters} = 17088 + 38496 + 11000 = \boxed{66584}.$$

3. **Check for double counting:**
   Every parameter in the model belongs to exactly one of these three disjoint groups: the encoder layers, the decoder layers, or the vocabulary input/output layers.

**Memory hook:** Complete Transformer budget = **Encoder stack + Decoder stack + Vocabulary embeddings/head**.

</details>

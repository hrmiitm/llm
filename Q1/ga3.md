# Week 3 — Graded Assignment 3

> **Score: 100 / 100** | Submitted: Sun, 05 Jul 2026

> New to these topics? Read the [Weeks 3–4 learning notes](week3-week4-learning-notes.md) before attempting the questions.

---

### Q1 — Sinusoidal Positional Embedding Sum

**Consider the word embedding vector $x = [0.1,\ 0,\ 0.23,\ 0.4,\ -0.75,\ 1]$. The word is at **position 4** in the sentence. Add the sinusoidal position embedding $p$ and enter the sum of elements in $h = x + p$.**

Formulas:

$\displaystyle PE(\text{pos},\ 2i) = \sin\!\left(\frac{\text{pos}}{10000^{2i/d_{\text{model}}}}\right)$

$\displaystyle PE(\text{pos},\ 2i+1) = \cos\!\left(\frac{\text{pos}}{10000^{2i/d_{\text{model}}}}\right)$

*(Numeric input — accepted range: 1.7 to 1.8)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{1.75}$
#### ✏️ Step-by-Step Solution

**Step 1 — Identify the parameters.**

- Position: $\text{pos} = 4$
- Embedding dimension: $d_{\text{model}} = 6$ (since $x$ has 6 elements)
- Index $i$ runs from $0$ to $d_{\text{model}}/2 - 1 = 2$

**Step 2 — Compute each positional embedding component.**

The 6-dimensional positional vector $p$ is computed as:

| Index | Formula | Denominator | Argument | Value |
|:---:|---|---|---|---|
| 0 (even, $i=0$) | $\sin\!\left(\frac{4}{10000^{0/6}}\right)$ | $10000^{0} = 1$ | $\sin(4)$ | $-0.7568$ |
| 1 (odd, $i=0$) | $\cos\!\left(\frac{4}{10000^{0/6}}\right)$ | $10000^{0} = 1$ | $\cos(4)$ | $-0.6536$ |
| 2 (even, $i=1$) | $\sin\!\left(\frac{4}{10000^{2/6}}\right)$ | $10000^{1/3} \approx 21.544$ | $\sin(0.1857)$ | $+0.1848$ |
| 3 (odd, $i=1$) | $\cos\!\left(\frac{4}{10000^{2/6}}\right)$ | $10000^{1/3} \approx 21.544$ | $\cos(0.1857)$ | $+0.9827$ |
| 4 (even, $i=2$) | $\sin\!\left(\frac{4}{10000^{4/6}}\right)$ | $10000^{2/3} \approx 464.16$ | $\sin(0.00862)$ | $+0.00862$ |
| 5 (odd, $i=2$) | $\cos\!\left(\frac{4}{10000^{4/6}}\right)$ | $10000^{2/3} \approx 464.16$ | $\cos(0.00862)$ | $+0.99996$ |

$\displaystyle p = [-0.7568,\ -0.6536,\ 0.1848,\ 0.9827,\ 0.00862,\ 0.99996]$

**Step 3 — Add $p$ to the word embedding $x$.**

$\displaystyle h = x + p = [0.1 + (-0.7568),\ 0 + (-0.6536),\ 0.23 + 0.1848,\ 0.4 + 0.9827,\ -0.75 + 0.00862,\ 1 + 0.99996]$

$\displaystyle h = [-0.6568,\ -0.6536,\ 0.4148,\ 1.3827,\ -0.7414,\ 1.9999]$

**Step 4 — Sum all elements.**

$\displaystyle \text{Sum}(h) = -0.6568 + (-0.6536) + 0.4148 + 1.3827 + (-0.7414) + 1.9999$

$\displaystyle = (-0.6568 - 0.6536) + (0.4148 + 1.3827) + (-0.7414 + 1.9999)$

$\displaystyle = -1.3104 + 1.7975 + 1.2585 = \boxed{1.746 \approx 1.75}$

> **Intuition:** Positional embeddings use different frequencies for different dimensions. Low-index dimensions ($i=0$) vary rapidly (high frequency: $\sin(4)$), while high-index dimensions ($i=2$) vary slowly (low frequency: $\sin(0.009)$). This lets the model distinguish positions at multiple scales.

</details>

---

### Q2 — GPT Attention Mask for Right-to-Left Language

**Consider a Right-to-Left (RTL) language (e.g., "transformer movie the enjoyed I"). If we use GPT for Causal Language Modelling (CLM), then:**

- ( ) It is necessary to flip the attention mask horizontally
- ( ) It is necessary to flip the attention mask vertically
- ( ) Neither the horizontal nor the vertical flipping of attention mask is required

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** Neither horizontal nor vertical flipping is required.

#### ✏️ Step-by-Step Solution

**Step 1 — Recall what the causal mask does.**

In GPT (Causal Language Modelling), the model predicts the **next token** given all **previous tokens**. The causal mask prevents each position from attending to *future* positions:

$\displaystyle M_{ij} = \begin{cases} 0 & \text{if } j \leq i \text{ (can attend)} \\ -\infty & \text{if } j > i \text{ (cannot attend)} \end{cases}$

This is a **lower-triangular mask** — each token can only see itself and tokens to its *left* (earlier in the sequence).

**Step 2 — Understand how RTL text is handled.**

For an RTL language, we simply **feed the tokens in their natural order** as the input sequence. For "transformer movie the enjoyed I":

$\displaystyle \text{Position 0: transformer}, \quad \text{Position 1: movie}, \quad \ldots, \quad \text{Position 4: I}$

The model reads left to right through the *written* sequence, where "earlier in the sequence" corresponds to "earlier in the RTL sentence".

**Step 3 — Does the mask need flipping?**

- The mask's job is to enforce the **autoregressive property**: token at position $i$ can only condition on positions $0, 1, \ldots, i-1$.
- This is the same requirement whether the underlying language is LTR or RTL.
- We do NOT need to flip the mask because we are **not changing the direction of token processing** — we simply treat the RTL text as a normal sequence.

$\displaystyle \boxed{\text{Neither flipping is required.}}$

</details>

---

### Q3 — Correct Statements About GPT Pre-training vs Fine-tuning

**Choose the correct statements: (Select all that apply)**

- ( ) All parameters of GPT are randomly initialized during **pre-training**
- ( ) The model minimizes the CLM objective during **fine-tuning**
- ( ) All parameters of GPT are randomly initialized during **fine-tuning**
- ( ) In general, fine-tuning requires a dataset **with labels**

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** Statements A and D.

#### ✏️ Step-by-Step Solution

**Step 1 — Analyse each statement.**

**Statement A: "All parameters of GPT are randomly initialized during pre-training."**

✅ **CORRECT.**

During pre-training, the model starts with **random weights** and learns from a large unlabelled corpus. The training objective is CLM:

$\displaystyle \mathcal{L}_{\text{CLM}} = -\sum_{t} \log P(x_t \mid x_1, x_2, \ldots, x_{t-1})$

**Statement B: "The model minimizes the CLM objective during fine-tuning."**

❌ **INCORRECT.**

During fine-tuning, the objective changes to match the **downstream task** (e.g., cross-entropy for classification, NER loss, etc.). CLM is the *pre-training* objective, not the fine-tuning objective.

**Statement C: "All parameters of GPT are randomly initialized during fine-tuning."**

❌ **INCORRECT.**

During fine-tuning, we start from the **pre-trained weights** (not random). This is the entire point of transfer learning — we leverage the knowledge already captured during pre-training.

$\displaystyle \theta_{\text{fine-tune, init}} = \theta_{\text{pre-trained}} \quad (\text{NOT random})$

**Statement D: "In general, fine-tuning requires a dataset with labels."**

✅ **CORRECT.**

Fine-tuning on a downstream task (sentiment analysis, NER, QA, etc.) typically requires **labelled examples** $(x_i, y_i)$ for supervised learning. This contrasts with pre-training which uses **unlabelled** text.

$\displaystyle \boxed{\text{Correct: A and D}}$

</details>

---

### Q4 — Will Rare Word Embeddings Get Updated?

**Vocabulary: 10,000 words; 100 rare words appeared only once. Embedding layer and output layer parameters are shared. A batch of 256 samples contains NONE of the 100 rare words. After one training iteration:**

- ( ) It is certain that embeddings of none of the 100 rare words will get updated
- ( ) There is a chance that embeddings of all or some of these 100 rare words will get updated
- ( ) The embeddings of all 100 rare words will definitely get updated

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** There is a chance that all or some of the rare-word embeddings will be updated.

#### ✏️ Step-by-Step Solution

**Step 1 — Understand weight tying (shared embeddings).**

When the **embedding layer** (input) and **output layer** are **weight-tied**, they share the same matrix $E \in \mathbb{R}^{|V| \times d_{\text{model}}}$:

- The embedding layer uses $E$ to look up input token representations.
- The output layer uses $E^{\top}$ (or $E$) to produce logits for each vocabulary token.

**Step 2 — Understand how gradients flow.**

During the forward pass, the model computes:

$\displaystyle \text{logits} = h \cdot E^{\top} \in \mathbb{R}^{|V|}$

where $h$ is the hidden state. After softmax, the loss (CLM cross-entropy) is computed.

**Step 3 — Analyse gradient flow to rare words.**

The gradient with respect to the embedding row of word $w$ comes from the **output layer** (since weights are shared):

$\displaystyle \frac{\partial \mathcal{L}}{\partial E_w} = \frac{\partial \mathcal{L}}{\partial \text{logit}_w} \cdot h$

This gradient is **non-zero for every word** in the vocabulary (including rare words), because:
- The softmax denominator includes all vocabulary words.
- Gradients flow through the softmax to all logits, including those for rare words.

**Step 4 — Conclusion.**

Even though the 100 rare words do not appear in the *input* sequences, their **embedding rows are referenced in the output projection** (weight tying). Therefore:
- There is a **non-zero probability** that their gradients are non-zero.
- However, it is **not guaranteed** — the gradient magnitude depends on the specific forward pass values.

$\displaystyle \boxed{\text{There is a chance that all or some rare word embeddings will get updated.}}$

</details>

---

## Context for Q5 – Q7

**Rajesh's GPT-like model configuration:**

| Parameter | Value |
|---|:---:|
| Vocabulary size | 1000 |
| Sequence length | 64 |
| Embedding dimension $d_{\text{model}}$ | 128 |
| Number of transformer blocks (layers) | 4 |
| Number of attention heads per block | 4 |
| FFN hidden layer size | 256 |

---

### Q5 — Shape of the Positional Embedding

**What is the shape of the positional embedding?**

- ( ) $64 \times 128$
- ( ) $64 \times 4$
- ( ) $12 \times 128$
- ( ) $512 \times 768$

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $64 \times 128$

#### ✏️ Step-by-Step Solution

**Step 1 — Understand what positional embedding is.**

The positional embedding is a matrix that assigns a unique vector to each possible position in the sequence. It has:
- **Rows** = number of possible positions = sequence length $T$
- **Columns** = embedding dimension = $d_{\text{model}}$

**Step 2 — Plug in values.**

$\displaystyle \text{Positional Embedding} \in \mathbb{R}^{T \times d_{\text{model}}} = \mathbb{R}^{64 \times 128}$

**Step 3 — Eliminate wrong options.**

- $64 \times 4$: uses number of heads instead of $d_{\text{model}}$ — wrong.
- $12 \times 128$: 12 is a GPT-style config value (not this model's) — wrong.
- $512 \times 768$: these are GPT-2's dimensions — wrong.

$\displaystyle \boxed{64 \times 128}$

</details>

---

### Q6 — Shape of $W_Q^i$

**What is the shape of the per-head query projection matrix $W_Q^i$?**

- ( ) $32 \times 32$
- ( ) $64 \times 32$
- ( ) $128 \times 16$
- ( ) $128 \times 32$
- ( ) $8 \times 32$
- ( ) None of these

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $128 \times 32$

#### ✏️ Step-by-Step Solution

**Step 1 — Determine the head dimension $d_k$.**

With $n_h = 4$ heads and $d_{\text{model}} = 128$, the standard practice is:

$\displaystyle d_k = \frac{d_{\text{model}}}{n_h} = \frac{128}{4} = 32$

**Step 2 — Determine the shape of $W_Q^i$.**

The query projection for head $i$ maps from the full model dimension to the head dimension:

$\displaystyle W_Q^i \in \mathbb{R}^{d_{\text{model}} \times d_k} = \mathbb{R}^{128 \times 32}$

**Step 3 — Verify with usage.**

For an input $X \in \mathbb{R}^{T \times d_{\text{model}}} = \mathbb{R}^{64 \times 128}$:

$\displaystyle Q^i = X W_Q^i \in \mathbb{R}^{64 \times 32} \quad \checkmark$

$\displaystyle \boxed{128 \times 32}$

</details>

---

### Q7 — Shape of the Causal Attention Mask $M$

**What is the shape of the mask $M$?**

- ( ) $16 \times 16$
- ( ) $32 \times 32$
- ( ) $64 \times 64$
- ( ) $128 \times 128$
- ( ) None of these

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $64 \times 64$

#### ✏️ Step-by-Step Solution

**Step 1 — Understand what the attention mask is.**

The attention mask $M$ is used to implement causal (autoregressive) attention. It is applied to the attention score matrix before softmax:

$\displaystyle \text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}} + M\right) V$

**Step 2 — Determine the dimensions of $QK^{\top}$.**

For one head: $Q \in \mathbb{R}^{T \times d_k}$, $K \in \mathbb{R}^{T \times d_k}$

$\displaystyle QK^{\top} \in \mathbb{R}^{T \times T}$

**Step 3 — The mask must match this shape.**

$\displaystyle M \in \mathbb{R}^{T \times T} = \mathbb{R}^{64 \times 64}$

The mask is a **lower-triangular matrix**:

$\displaystyle M = \begin{bmatrix} 0 & -\infty & -\infty & \cdots & -\infty \\ 0 & 0 & -\infty & \cdots & -\infty \\ \vdots & & \ddots & & \vdots \\ 0 & 0 & 0 & \cdots & 0 \end{bmatrix}_{64 \times 64}$

$\displaystyle \boxed{64 \times 64}$

</details>

---

### Q8 — Identifying Degenerative Text Generation Models

**The following GPT-based models generated text with the prompt "I like":**

| Model | Generated Output |
|---|---|
| $M_1$ | I like to **to** like. |
| $M_2$ | I like **like like**. |
| $M_3$ | I like **the do because**. |
| $M_4$ | I like to study the origin of the universe. |

**Select the degenerative model(s):**

- [ ] $M_1$
- [ ] $M_2$
- [ ] $M_3$
- [ ] $M_4$

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $M_1$, $M_2$, and $M_3$

#### ✏️ Step-by-Step Solution

**Step 1 — Define degenerative text generation.**

A language model is called **degenerative** when it produces text that is:
- **Repetitive**: the same token or phrase appears over and over
- **Incoherent**: grammatically broken or semantically nonsensical
- **Stuck in loops**: the model keeps generating the same token

Degenerative behaviour is a known failure mode of greedy/beam search decoding in LLMs.

**Step 2 — Evaluate each model.**

**$M_1$: "I like to **to** like."**
- The word "to" is repeated immediately → **repetitive loop**
- ✅ **Degenerative**

**$M_2$: "I like **like like**."**
- "like" is repeated 2 more times in a row → **severe repetition**
- ✅ **Degenerative**

**$M_3$: "I like **the do because**."**
- Grammatically incoherent — "the do because" makes no sense
- ✅ **Degenerative** (incoherent, not a valid sentence continuation)

**$M_4$: "I like to study the origin of the universe."**
- Grammatically correct ✓
- Semantically meaningful ✓
- No repetition ✓
- ❌ **NOT degenerative**

$\displaystyle \boxed{M_1,\ M_2,\ M_3 \text{ are degenerative}}$

> **Why does degeneration happen?** Under greedy or beam search, the model can assign high probability to repeating seen tokens because the training distribution is biased towards common patterns. Methods like **Top-k sampling**, **nucleus (top-p) sampling**, and **repetition penalties** are used to mitigate this.

</details>

# Week 12 Learning Notes — Positional Encodings: APE, RPE, RoPE, & ALiBi

These notes support [Graded Assignment 12](ga12.md) and explain how Transformers understand word order, the evolution from absolute coordinates to relative distances, and why modern LLMs use RoPE and ALiBi.

> **Reading order:** Work through Sections 1 → 6 in order. Use the summary cheat sheet and master comparison table in Section 7 for exam revision.

---

## 🗺️ Big Picture: The "Orderless" Transformer

Standard Self-Attention computes pairwise dot products:
$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{Q K^T}{\sqrt{d_k}}\right)V$$

Notice something fundamental: **Self-attention is permutation-equivariant!**
If you shuffle the order of the words in a sentence, the attention values shuffle identically:
$$\text{"Dog bites man"} \quad \longleftrightarrow \quad \text{"Man bites dog"}$$
To a raw Transformer with no position information, both sentences look identical!

To fix this, we must inject **positional information**. Over the past seven years, researchers invented three generations of positional encoding:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    THE THREE GENERATIONS OF ENCODINGS                   │
│                                                                         │
│  1. Absolute (APE)          2. Relative (RPE)         3. Modern Rotary  │
│     (2017 - 2019)              (2018 - 2021)             & Linear       │
│                                                          (2021 - Present)
│  • Added to word vectors   • Added into attention    • RoPE (Rotations) │
│  • Sinusoidal (Vaswani)      matrix                   • ALiBi (Slopes)  │
│  • Learned (BERT, GPT-2)   • Shaw RPE, T5-bias       • Dominates modern │
│  • Poor extrapolation      • Parameter-heavy           frontier LLMs    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Generation 1: Absolute Position Encodings (APE)

In APE, each integer coordinate $pos \in \{0, 1, 2, \dots, T-1\}$ is assigned a unique vector $\mathbf{p}_{pos} \in \mathbb{R}^{d_{\text{model}}}$, which is added directly to the input token embedding $\mathbf{x}_{pos}$:

$$\mathbf{e}_{pos} = \mathbf{x}_{pos} + \mathbf{p}_{pos}$$

There are two primary flavors of APE:

### 1. Parameterized (Learned) APE (BERT, GPT-2)
- The model maintains a lookup table of shape $T_{\text{train}} \times d_{\text{model}}$ containing trainable weights.
- **Fatal Flaw:** If trained with context window $T_{\text{train}} = 512$, the lookup table only has 512 rows ($p_0 \dots p_{511}$).
- At inference time, if given 1024 tokens, **positions 512 to 1023 do not exist!** The model cannot extrapolate.

---

### 2. Fixed Sinusoidal APE (Vaswani et al., 2017)
Instead of learning embeddings, Vaswani et al. generated them using deterministic trigonometric functions of varying frequencies:

$$PE_{(pos, 2i)} = \sin\left(\frac{pos}{10000^{2i / d_{\text{model}}}}\right)$$
$$PE_{(pos, 2i+1)} = \cos\left(\frac{pos}{10000^{2i / d_{\text{model}}}}\right)$$

#### Why Sinusoidal Allows Extrapolation:
Because this is a continuous mathematical function, you can plug in $pos = 1000$ or $pos = 100000$ without needing any trained parameters!

#### Can Sinusoidal APE Encode Relative Positions?
**YES!** By trigonometric angle-addition identities:
$$\sin(pos + k) = \sin(pos)\cos(k) + \cos(pos)\sin(k)$$
$$\cos(pos + k) = \cos(pos)\cos(k) - \sin(pos)\sin(k)$$

For any fixed offset $k$, there exists an orthogonal rotation matrix $M_k$ such that:
$$PE_{pos+k} = M_k \cdot PE_{pos}$$
When self-attention computes $\mathbf{p}_i W_Q W_K^T \mathbf{p}_j^T$, the result explicitly encodes the relative distance $i - j$.

---

## 2. Generation 2: Relative Position Encodings (RPE)

Why give words absolute coordinates? In human language, what matters is **how far apart two words are**, not whether a word is at index 401 or 405!

### Shaw et al. (2018) Formulation
Shaw et al. modified self-attention by injecting relative position vectors $\mathbf{a}_{ij}^K \in \mathbb{R}^{d_k}$ directly into the key representations:

$$e_{ij} = \frac{\mathbf{x}_i W_Q (\mathbf{x}_j W_K + \mathbf{a}_{ij}^K)^T}{\sqrt{d_k}}$$

In full matrix notation across all queries and keys:
$$E = X W_Q (X W_K + P_K)^T$$

> [!IMPORTANT]
> **Tensor Dimension of $P_K$:**
> For every query $i \in \{1, \dots, T\}$ and key $j \in \{1, \dots, T\}$, there is a vector of dimension $d_{\text{model}}$.
> Therefore, $P_K$ has dimension:
> $$\text{Dimension}(P_K) = T \times T \times d_{\text{model}}$$

---

### T5-Bias: Logarithmic Relative Bucketing
Shaw's formulation was heavy because it learned vectors. Raffel et al. (2020) in **T5** drastically simplified this:
Instead of learning vectors, T5 adds a **single scalar bias** $b_{ij}$ to the attention logit:

$$\text{Attention Score}_{ij} = \mathbf{q}_i \mathbf{k}_j^T + b_{ij}$$

- Relative offsets $d = j - i$ are mapped into **32 logarithmic buckets**:
  - Small distances ($\le 8$) get exact buckets.
  - Large distances are grouped into increasingly wide exponential buckets up to max length.
- **Parameter Count:** Only **32 scalar values per attention head**, independent of whether context length is 512 or 16,000!

---

## 3. Generation 3: Modern Parameter-Free Encodings

Modern LLMs require zero-parameter overhead and seamless length extrapolation.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     THE MODERN KINGS: RoPE & ALiBi                      │
│                                                                         │
│   RoPE (Su et al., 2021)             ALiBi (Press et al., 2021)         │
│   Rotates vectors in 2D planes       Subtracts linear slopes from logits│
│                                                                         │
│         Q rotated by mθ                   Softmax(Q Kᵀ - m · |i - j|)   │
│         K rotated by nθ                                                 │
│   Dot product depends on (m - n)     Head slope m = 2^(-8/h · head_idx) │
│   Used in: LLaMA, Mistral, Gemma     Used in: MPT, Bloom, Falcon        │
│   Learned parameters: 0              Learned parameters: 0              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1. Rotary Position Embedding (RoPE)
Instead of adding position vectors to embeddings, RoPE rotates the Query and Key vectors in 2D chunks of embedding space:
$$\tilde{\mathbf{q}}_m = R_{\Theta, m} \mathbf{q}_m, \quad \tilde{\mathbf{k}}_n = R_{\Theta, n} \mathbf{k}_n$$
where $R_{\Theta, m}$ is a block-diagonal rotation matrix:
$$R_{\Theta, m} = \begin{pmatrix} \cos(m\theta_1) & -\sin(m\theta_1) & 0 & 0 \\ \sin(m\theta_1) & \cos(m\theta_1) & 0 & 0 \\ 0 & 0 & \cos(m\theta_2) & -\sin(m\theta_2) \\ 0 & 0 & \sin(m\theta_2) & \cos(m\theta_2) \end{pmatrix}$$

#### The Mathematical Magic:
When you take the inner product of the rotated vectors:
$$\tilde{\mathbf{q}}_m^T \tilde{\mathbf{k}}_n = \mathbf{q}_m^T R_{\Theta, m}^T R_{\Theta, n} \mathbf{k}_n = \mathbf{q}_m^T R_{\Theta, n - m} \mathbf{k}_n$$
The attention score **naturally and purely depends on the relative distance $m - n$!**
- **Learned parameters:** Exactly **0** (the rotation angles $\theta_i$ are fixed constants).

---

### 2. ALiBi (Attention with Linear Biases)
Press et al. (2021) asked: *Can we completely eliminate position embeddings?*

ALiBi adds a fixed, non-learned linear penalty to attention logits proportional to token distance:
$$\text{Attention Logit}_{ij} = \mathbf{q}_i \mathbf{k}_j^T - m \cdot |i - j|$$

where $m$ is a constant geometric slope per head:
$$m \in \left\{ 2^{-\frac{8}{h} \times 1}, 2^{-\frac{8}{h} \times 2}, \dots, 2^{-\frac{8}{h} \times h} \right\}$$

- Closer tokens receive zero or tiny penalties.
- Distant tokens receive linearly larger penalties.
- **Learned parameters:** Exactly **0**.
- **Extrapolation:** Models trained on 512 tokens can extrapolate cleanly to 2,048+ tokens without fine-tuning!

---

## 4. Does a Causal Model Even Need Position Embeddings? (NoPos)

In 2022, Haviv et al. published a groundbreaking paper: *"How Much Position Information Do Causal Language Models Need?"* (**NoPos**).

### The Discovery:
In a decoder-only model with causal masking:
- Token 1 attends to: 1 token (itself).
- Token 2 attends to: 2 tokens.
- Token 3 attends to: 3 tokens.
- Token $t$ attends to: $t$ tokens.

Because the causal mask has a triangular structure, **the model's receptive field uniquely identifies each token's position!** The network can learn word order purely from the causal mask without any positional encodings.

### The Critical Exam Trap:
> *"Can you train with APE, and then drop APE during inference to speed up generation?"*

**Answer: NO!**
Even though causal masking carries positional signal in theory (NoPos), a model trained with APE has learned weights that expect $\mathbf{x}_t + \mathbf{p}_t$. Dropping $\mathbf{p}_t$ only at test time causes a catastrophic distribution mismatch, causing the model to output gibberish!

---

## 5. Master Comparison Table

| Encoding Scheme | Category | Learnable? | Parameter Count | Extrapolates Well? | Used In |
|---|:---:|:---:|:---:|:---:|---|
| **Learned APE** | Absolute | Yes | $T_{\text{train}} \times d$ | ❌ Fails completely | BERT, GPT-2 |
| **Sinusoidal APE** | Absolute | **No** | **0** | 🟡 Poorly (degrades) | Original Transformer |
| **Shaw RPE** | Relative | Yes | $2k \times d$ | 🟡 Moderate | Early Seq2Seq |
| **Transformer-XL** | Relative | Yes | $T \times d + 2d$ | 🟡 Moderate | Transformer-XL |
| **T5-Bias** | Relative | Yes | **32 scalars/head** | 🟢 Good | T5, FLAN-T5 |
| **RoPE** | Relative / Rotary | **No** | **0** | 🟢 Great | LLaMA, Mistral, Gemma |
| **ALiBi** | Relative / Linear | **No** | **0** | 🟢 Excellent | MPT, BLOOM, Falcon |

---

## 6. 💡 Cheat Sheet & Exam Checklist

### Quick Facts to Memorize:
- **Zero Learnable Parameters:** Sinusoidal APE, RoPE, ALiBi.
- **Learned Parameters:** Parameterized APE (BERT/GPT-2), Shaw RPE, Transformer-XL, T5-bias.
- **Lowest Parameters for 16K Context:** **ALiBi (0)** and **T5-bias (32 scalars)**.
- **RPE Tensor Shape:** $P_K \in \mathbb{R}^{T \times T \times d_{\text{model}}}$.
- **Can APE encode relative position?** **YES**, sinusoidal encodings have a linear translation matrix $M_k$ that relates $PE_{t+k}$ to $PE_t$.
- **NoPos:** Causal masking implicitly encodes position, but dropping positional embeddings at inference time after pre-training hurts performance.

### Quick Self-Test:
- [ ] Why can't GPT-2 extrapolate from 1024 to 2048 tokens? *(Learned lookup table only has 1024 rows)*
- [ ] What is the slope formula in ALiBi? *($m = 2^{-8/h \cdot \text{head}}$)*
- [ ] What geometric operation does RoPE perform? *(Rotates query and key vectors in 2D sub-planes)*
- [ ] What is the dimension of the relative position tensor $P_K$? *($T \times T \times d_{\text{model}}$)*

# Week 11 Learning Notes — Efficient Attention, Sparse Transformers, & KV Caching

These notes support [Graded Assessment 11](ga11.md) and cover the quadratic complexity of self-attention, mathematical FLOP and memory counting, sparse attention mechanisms, and KV caching for fast LLM inference.

> **Reading order:** Work through Sections 1 → 6 in order. Use the summary cheat sheet in Section 7 for exam formulas.

---

## 🗺️ Big Picture: The Quadratic Wall

In Weeks 1–8, we studied how Transformers work. But as language models grew from handling single sentences (128 tokens) to entire books and codebases (128K+ tokens), they hit a massive computational wall:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     THE QUADRATIC ATTENTION PROBLEM                     │
│                                                                         │
│   Context Length (T)      Attention Matrix (T × T)       Memory (FP16)  │
│   ──────────────────      ────────────────────────       ─────────────  │
│         1,024                   1,048,576 elements           ~2 MB      │
│         4,096                  16,777,216 elements          ~33 MB      │
│        16,384                 268,435,456 elements         ~536 MB      │
│        32,768               1,073,741,824 elements        ~2,147 MB (2GB)
│       131,072              17,179,869,184 elements         ~34.3 GB!    │
└─────────────────────────────────────────────────────────────────────────┘
```

Notice the explosion: **doubling the context length quadruples ($4\times$) the attention computation and memory!**

Week 11 focuses on the two engineering breakthroughs that conquer this:
1. **Sparse & Efficient Attention:** Modifying the attention matrix to compute fewer entries during training.
2. **KV Caching:** Eliminating redundant computation during autoregressive generation.

---

## 1. Math of Attention: FLOPs and Memory Counting

To analyze model efficiency, AI engineers calculate exact **FLOPs (Floating Point Operations)** and **RAM requirements**.

### What is 1 FLOP?
- $1$ addition $=$ $1$ FLOP: $a + b$
- $1$ multiplication $=$ $1$ FLOP: $a \times b$
- A dot product of two vectors of dimension $d$:
  $$\mathbf{u} \cdot \mathbf{v} = u_1 v_1 + u_2 v_2 + \dots + u_d v_d$$
  requires **$d$ multiplications** and **$d - 1$ additions** $\implies \mathbf{2d - 1 \text{ FLOPs}}$ (often approximated as $2d$).

---

### Step-by-Step FLOP Calculation for Pre-Attention Scores ($Q K^T$)

Given:
- Context length: $T = 1024$
- Head dimension: $d_k = 512$
- Single head ($h = 1$), single layer ($L = 1$)

```
Query Matrix Q: [1024 × 512]
Key Matrix K^T: [512 × 1024]
Pre-Attention Scores S = Q K^T: [1024 × 1024]  (1,048,576 total elements)
```

1. **FLOPs per matrix element:**
   $$\text{FLOPs/entry} = 2 d_k - 1 = 2(512) - 1 = 1{,}023 \text{ FLOPs}$$
2. **Total FLOPs across the entire matrix:**
   $$\text{Total FLOPs} = T \times T \times (2 d_k - 1) = 1024 \times 1024 \times 1023 = 1{,}072{,}693{,}248 \text{ FLOPs}$$
3. **Convert to MFLOPs ($10^6$ FLOPs):**
   $$\text{MFLOPs} = \frac{1{,}072{,}693{,}248}{10^6} = \mathbf{1072.69} \text{ MFLOPs}$$

---

### Step-by-Step Memory Storage Calculation

How much RAM is needed to store that $1024 \times 1024$ matrix of pre-attention scores in 16-bit precision (FP16 / BF16)?

1. **Total elements:**
   $$N_{\text{elements}} = T \times T = 1024 \times 1024 = 1{,}048{,}576 \text{ numbers}$$
2. **Bytes per number:**
   $$\text{16 bits} = \frac{16}{8} = 2 \text{ bytes per number}$$
3. **Total memory in bytes:**
   $$\text{Memory} = 1{,}048{,}576 \times 2 = 2{,}097{,}152 \text{ bytes}$$
4. **Convert to Kilobytes (KB):**
   $$\text{Memory in KB} = \frac{2{,}097{,}152 \text{ bytes}}{1{,}000 \text{ bytes/KB}} = \mathbf{2097.15} \text{ KB}$$

> [!TIP]
> **Common Pitfall:** Don't confuse binary KiB ($1024$ bytes) with decimal KB ($1000$ bytes). Evaluation benchmarks in IITM exams use decimal SI units ($10^3 = 1000$).

---

## 2. Sparse & Efficient Attention Mechanisms

Since computing every cell of the $T \times T$ matrix is too expensive, researchers developed **Sparse Attention** architectures:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SPARSE ATTENTION PATTERNS                          │
│                                                                         │
│  1. Full Attention          2. Local Window Attention   3. Strided /    │
│     (O(T²))                    (O(T · c))                  Dilated      │
│     ■ ■ ■ ■ ■ ■ ■ ■            ■ ■ ■ □ □ □ □ □             ■ □ ■ □ ■ □ ■│
│     ■ ■ ■ ■ ■ ■ ■ ■            ■ ■ ■ ■ □ □ □ □             □ ■ □ ■ □ ■ □│
│     ■ ■ ■ ■ ■ ■ ■ ■            □ ■ ■ ■ ■ □ □ □             ■ □ ■ □ ■ □ ■│
│     ■ ■ ■ ■ ■ ■ ■ ■            □ □ ■ ■ ■ ■ □ □             □ ■ □ ■ □ ■ □│
└─────────────────────────────────────────────────────────────────────────┘
```

### 1. Local (Windowed) Attention
Instead of attending to all $T$ tokens, each token only attends to its immediate neighbors within a window of size $c$:
- **Full Attention Complexity:** $O(T^2)$
- **Local Attention Complexity:** $O(T \cdot c)$

#### Sizing Window Size $c$:
If you want to cut attention complexity from $O(T^2)$ to at most $O\left(\frac{T^2}{2}\right)$:
$$T \cdot c \le \frac{T^2}{2} \implies c \le \frac{T}{2}$$
For context length $T = 1024$, any window size $c \le 512$ (e.g., $c = 512, 256, 128$) achieves this target!

---

### 2. Block-wise Attention & Permutations

In block-wise sparse attention (e.g., BlockBERT, Sparse Transformer):
- The sequence of $T$ tokens is divided into $B$ non-overlapping blocks:
  $$\text{For } T = 8 \text{ tokens and block size } 2 \implies 4 \text{ blocks } (q_1, q_2, q_3, q_4) \text{ and } (k_1, k_2, k_3, k_4)$$
- In each attention head, each query block $q_i$ attends to a specific key block $k_j$, forming a **block permutation matrix**:

```
Permutation Matrix (Head 4 / Subplot d):
                k₁      k₂      k₃      k₄
        q₁  [   0       1       0       0   ]  → q₁ attends to k₂
        q₂  [   0       0       0       1   ]  → q₂ attends to k₄
        q₃  [   0       0       1       0   ]  → q₃ attends to k₃
        q₄  [   1       0       0       0   ]  → q₄ attends to k₁  (q₄ᵀ k₁)
```

A **proper permutation** has exactly one active block per row and per column, ensuring every query and key block is covered without redundancy.

---

### 3. Low-Rank Approximation (Linformer) vs. Local Attention

Can we approximate the $T \times T$ attention matrix with a low-rank decomposition?

In **Linformer** (Wang et al., 2020), keys and values are projected into a lower dimension $k \ll T$ using linear projection matrices $E, F \in \mathbb{R}^{k \times T}$:
$$\tilde{K} = E K \in \mathbb{R}^{k \times d}, \quad \tilde{V} = F V \in \mathbb{R}^{k \times d}$$
The attention score $Q \tilde{K}^T$ is only $T \times k$, giving linear complexity $O(T \cdot k)$.

> [!IMPORTANT]
> **Exam Concept:** When rank $k = 1$ and local window $c = 1$, both Linformer and Local Attention have the same asymptotic computational complexity $O(T)$.
> **Do they compute the same representation? NO!**
> - Low-rank attention computes a **global sequence-wide summary** across all tokens.
> - Local attention restricts tokens to **isolated local positions**.
> Equal complexity does NOT mean equal representations!

---

## 3. KV Caching: The Core Engine of Fast LLM Generation

During training, we use **teacher forcing**: all tokens in the input prompt are fed simultaneously, so self-attention is computed in parallel.

During generation (inference), LLMs are **autoregressive**: they generate one token at a time!

```
Naive Generation Without Cache:
Step 1: Input "The"               ──► Compute K, V for "The"               ──► Generates "cat"
Step 2: Input "The cat"           ──► Recompute K, V for "The", "cat"      ──► Generates "sat"
Step 3: Input "The cat sat"       ──► Recompute K, V for "The","cat","sat" ──► Generates "down"
```

Notice the massive waste: at Step 3, the Key and Value vectors for `"The"` and `"cat"` are identical to what they were in Step 1 and Step 2! **Recomputing them wastes $O(T^3)$ operations!**

---

### How KV Caching Solves This

In **KV Caching**, once a token's Key ($\mathbf{k}$) and Value ($\mathbf{v}$) vectors are computed at a layer, they are saved in GPU memory. At the next step, only the new token's Query, Key, and Value are computed!

```
Generation With KV Cache:
Step 1: Compute & Cache K₁, V₁ for "The"
Step 2: Load K₁, V₁ from cache; Compute & Cache K₂, V₂ for "cat"
Step 3: Load K₁, V₁, K₂, V₂ from cache; Compute only K₃, V₃ for "sat"
```

Inference cost per token drops from $O(T^2)$ to $O(T)$!

---

### Exact KV Cache Memory Sizing Formula

Every engineer must know how to size the KV cache in RAM:

$$\text{KV Cache Elements} = 2 \times L \times h \times d_k \times T_{\text{cache}}$$

where:
- The factor of **$2$** accounts for both **Key** and **Value** tensors.
- $L$ = Number of Transformer layers
- $h$ = Number of attention heads per layer
- $d_k$ = Head dimension (note: $h \times d_k = d_{\text{model}}$ in standard MHA)
- $T_{\text{cache}}$ = Number of cached tokens

```
Memory in Bytes = Elements × (Precision in bits / 8)
```

#### Exam Calculation Walkthrough:
Given:
- $L = 12$ layers
- $h = 8$ heads
- $d_k = 64$
- Precision = $32\text{ bits} = 4\text{ bytes}$
- Cache $T = 512$ tokens

1. **Total elements:**
   $$\text{Elements} = 2 \times 12 \times 8 \times 64 \times 512 = 6{,}291{,}456 \text{ numbers}$$
2. **Total bytes:**
   $$\text{Bytes} = 6{,}291{,}456 \times 4 = 25{,}165{,}824 \text{ bytes}$$
3. **Convert to MB:**
   $$\text{Memory in MB} = \frac{25{,}165{,}824}{10^6} \approx \mathbf{25.17} \text{ MB} \quad (\text{or } 24.0 \text{ MiB})$$

---

## 4. Why KV Caching Does NOT Work for BERT

A favorite conceptual exam question:
> *"Does KV caching help during inference in encoder models like BERT?"*

**Answer: NO.**
- **Decoder models (GPT, LLaMA):** Generate text autoregressively (one new token per step). KV caching saves previous tokens' vectors.
- **Encoder models (BERT, RoBERTa):** Process the **entire input sequence in a single forward pass** to produce classification logits or embeddings. There is no step-by-step token generation, so there are no "future steps" to reuse cached keys or values.

---

## 5. Modern KV Cache Optimizations: MQA and GQA

Standard Multi-Head Attention (MHA) keeps a separate Key and Value head for every Query head, causing the KV cache to eat up massive GPU VRAM.

Modern models use:
- **Multi-Query Attention (MQA):** All $h$ Query heads share **one single** Key and Value head. (Shrinks KV cache by $h\times$!).
- **Grouped-Query Attention (GQA, used in LLaMA-2 70B & LLaMA-3):** Query heads are partitioned into $g$ groups, with one KV head per group. Perfect balance between quality and memory savings.

---

## 6. 💡 Cheat Sheet & Exam Checklist

### Formulas to Memorize:
- **Pre-attention FLOPs ($Q K^T$):** $T \times T \times (2 d_k - 1) \approx 2 T^2 d_k$.
- **Attention Memory:** $T \times T \times \text{Bytes per float}$. (For $T=1024$, FP16 $\implies \approx 2097 \text{ KB}$).
- **Local Attention Window:** $c \le \frac{T}{2}$ cuts complexity to at most half ($O(\frac{T^2}{2})$).
- **KV Cache Memory:** $2 \times L \times h \times d_k \times T \times (\text{bits}/8)$ bytes.
- **Linformer vs Local:** Both have $O(T)$ complexity for $k=1, c=1$, but compute completely different representations.
- **BERT & KV Cache:** KV cache is useless for encoder models (no autoregressive generation).

### Quick Self-Test:
- [ ] How many FLOPs per entry in a $d_k$-dimensional dot product? *(Exact: $2d_k - 1$; Approx: $2d_k$)*
- [ ] Why is KV caching essential for GPT but not BERT? *(GPT generates sequentially token-by-token; BERT runs in a single parallel pass)*
- [ ] In Subplot d of block attention, which key block does query block $q_4$ attend to? *($k_1$)*

# Week 7 Learning Notes — BART, T5, Denoising, & Transfer Learning

These notes support [Graded Assignment 7](ga7.md) and explain encoder-decoder pre-training, span corruption, transfer learning, and compute sizing step-by-step for a beginner.

> **Reading order:** Work through Sections 1 → 7 in order. Use the summary cheat sheet in Section 8 to memorize key rules for exams.

---

## 🗺️ Big Picture: Where Are We in the LLM Universe?

By Week 6, you met two extremes:
1. **BERT (Encoder-Only):** Reads the entire sentence in both directions at once. Fantastic at *understanding* text (classification, named entity recognition), but cannot generate sentences naturally.
2. **GPT (Decoder-Only):** Reads text strictly from left to right. Fantastic at *generating* text, but each token can only see what came before it.

**Week 7 introduces the hybrid powerhouse: Encoder-Decoder models (BART & T5).**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        THE THREE ARCHITECTURES                          │
│                                                                         │
│  1. BERT (Encoder-Only)       2. GPT (Decoder-Only)     3. BART / T5    │
│     Bidirectional                Causal (Left-to-Right)    (Encoder-    │
│                                                            Decoder)     │
│       A ── B ── C                  A ──► B ──► C           Encoder (Bi) │
│       │ ╲  │  ╱ │                  │     │     │              │         │
│       ▼  ▼ ▼ ▼  ▼                  ▼     ▼     ▼              ▼ Cross-  │
│      [Understanding]              [Generation]             Decoder (Cau)│
│                                                            [Both!]      │
└─────────────────────────────────────────────────────────────────────────┘
```

The encoder-decoder design gives you the **deep bidirectional understanding** of BERT inside the encoder, paired with the **flexible text generation** of GPT inside the decoder.

---

## 1. BART: Bidirectional and Auto-Regressive Transformers

**BART** (Lewis et al., 2019, Meta FAIR) is a sequence-to-sequence model designed as a generalized denoising autoencoder.

### How BART Works
1. **Corrupt the text:** Take a clean sentence $X$ and intentionally destroy parts of it using a noise function: $\tilde{X} = \text{corrupt}(X)$.
2. **Encode the noise:** Feed the corrupted sentence $\tilde{X}$ into a bidirectional Transformer encoder.
3. **Decode the original:** The autoregressive decoder reconstructs the **entire clean sentence** $X$, token by token, using cross-attention over the encoder representations.

```
Corrupted Input:   "[start] astronomy [mask] [mask] character building [mask] [end]"
                                      │ (Bidirectional Encoder)
                                      ▼
                             Context Representations
                                      │ (Cross-Attention)
                                      ▼
Clean Output:      "[start] astronomy is a character building experience [end]"
```

### BART's 5 Noise Functions
BART experiments with five distinct ways to corrupt input text:

| Noise Transformation | What It Does | Example Input $\to$ Corrupted |
|---|---|---|
| **Token Masking** | Replaces random tokens with `[MASK]` (like BERT). | `The dog ran` $\to$ `The [MASK] ran` |
| **Token Deletion** | Deletes random tokens without any placeholder. | `The dog ran` $\to$ `The ran` |
| **Text Infilling** | Replaces arbitrary-length spans with a **single** `[MASK]`. | `The quick brown fox` $\to$ `The [MASK] fox` |
| **Sentence Permutation** | Shuffles sentences in a multi-sentence document. | `[S1. S2. S3.]` $\to$ `[S3. S1. S2.]` |
| **Document Rotation** | Picks a random token and rotates text to start there. | `A B C D E` $\to$ `C D E A B` |

> [!TIP]
> **Key Difference from BERT:** BERT's encoder only predicts the specific masked words (`[MASK]`). BART's decoder must generate the **entire original sentence from start to end**, learning sentence structure, grammar, and missing context simultaneously.

---

## 2. Loss Calculation & Greedy Search Decoding (Under the Hood)

In Assignment 7, Question 1, you are given a probability matrix $\hat{Y}$ and asked to calculate the loss under **Greedy Search**. Let's break this down completely.

### The Setup
- **Vocabulary:** $\mathcal{V} = (\text{[start]}, \text{building}, \text{character}, \text{a}, \text{is}, \text{astronomy}, \text{science}, \text{experience}, \text{natural}, \text{[end]})$
- Total vocabulary size: $|\mathcal{V}| = 10$.
- Indices:
  ```
  0: [start]      1: building      2: character    3: a          4: is
  5: astronomy    6: science       7: experience   8: natural    9: [end]
  ```

### What is Greedy Search?
At each decoding step $t$:
1. The model outputs a probability distribution over all 10 words in $\mathcal{V}$:
   $$\mathbf{p}_t = [P(w_0), P(w_1), \dots, P(w_9)]$$
2. **Greedy decoding** simply picks the token with the highest probability:
   $$\hat{y}_t = \operatorname{argmax}_{k \in \{0, \dots, 9\}} P(w_k)$$
3. That picked token is fed as input for step $t+1$.

### Tracing the Matrix Step-by-Step

Look at the prediction matrix $\hat{Y} \in \mathbb{R}^{7 \times 10}$:

```
Row 0: [0.05, 0.02, 0.14, 0.07, 0.09, 0.41, 0.08, 0.05, 0.08, 0.01]  -> Max: 0.41 (idx 5: astronomy)
Row 1: [0.10, 0.04, 0.06, 0.16, 0.43, 0.01, 0.06, 0.09, 0.01, 0.04]  -> Max: 0.43 (idx 4: is)
Row 2: [0.05, 0.07, 0.28, 0.29, 0.03, 0.08, 0.04, 0.08, 0.04, 0.04]  -> Max: 0.29 (idx 3: a)
Row 3: [0.10, 0.02, 0.48, 0.02, 0.01, 0.07, 0.06, 0.14, 0.07, 0.01]  -> Max: 0.48 (idx 2: character)
Row 4: [0.08, 0.29, 0.04, 0.01, 0.04, 0.03, 0.25, 0.05, 0.15, 0.06]  -> Max: 0.29 (idx 1: building)
Row 5: [0.14, 0.22, 0.13, 0.08, 0.01, 0.03, 0.06, 0.23, 0.08, 0.03]  -> Max: 0.23 (idx 7: experience)
Row 6: [0.10, 0.01, 0.01, 0.01, 0.07, 0.20, 0.00, 0.25, 0.05, 0.30]  -> Max: 0.30 (idx 9: [end])
```

Notice how greedy search generates the exact target sentence:
$$\text{``astronomy is a character building experience [end]}''$$

### Computing Cross-Entropy (Negative Log-Likelihood) Loss
For each token $t$ in the target sequence, we find the model's assigned probability $p_t$:
$$\text{Loss}_t = -\ln(p_t)$$

| Step $t$ | Target Token | Probability $p_t$ | $-\ln(p_t)$ |
|:---:|---|:---:|:---:|
| 1 | `astronomy` | $0.41$ | $0.8916$ |
| 2 | `is` | $0.43$ | $0.8440$ |
| 3 | `a` | $0.29$ | $1.2379$ |
| 4 | `character` | $0.48$ | $0.7340$ |
| 5 | `building` | $0.29$ | $1.2379$ |
| 6 | `experience` | $0.23$ | $1.4697$ |
| 7 | `[end]` | $0.30$ | $1.2040$ |

**Total Loss:** $\sum_{t=1}^7 -\ln(p_t) = 7.6189$

**Average Cross-Entropy Loss:**
$$\mathcal{L} = \frac{7.6189}{7} \approx 1.088$$

In online grading platforms, answers inside the tolerance window **$[0.9, 1.1]$** (such as $0.95$) are marked fully correct.

---

## 3. T5: The Text-to-Text Framework & Span Corruption

**T5** (Text-to-Text Transfer Transformer, Raffel et al., 2020, Google) took encoder-decoder models to an industrial scale.

### Philosophy: Everything is Text-to-Text
Before T5, if you wanted to classify sentiment, you added a custom classification head on BERT. If you wanted translation, you used a separate sequence model.

T5 treats **every NLP task as string-in $\to$ string-out**:

```
Task: Sentiment Analysis
Input:  "sst2 sentence: The acting was superb."  ──► T5 ──► Output: "positive"

Task: Translation
Input:  "translate English to German: Good morning" ──► T5 ──► Output: "Guten Morgen"

Task: Summarization
Input:  "summarize: Deep learning is a subset..."  ──► T5 ──► Output: "DL is a ML subset"
```

### T5 Denoising: Span Corruption with Sentinel Tokens
Instead of replacing single words with `[MASK]`, T5 drops **contiguous spans of words** and replaces each span with a unique **sentinel token** (`<extra_id_0>`, `<extra_id_1>`, etc.).

```
Original:
"Thank you for inviting me to your beautiful party last night"

Corrupted Input:
"Thank you <extra_id_0> me to your <extra_id_1> night"

Target Output to Predict:
"<extra_id_0> for inviting <extra_id_1> beautiful party last <extra_id_2>"
```

### Why Span Corruption is Genius:
1. **Efficiency:** In BART, the decoder has to re-output the *entire* sentence (even parts the encoder already knows). In T5, the decoder only outputs the missing spans! This saves massive computation.
2. **Sentinel tokens are real vocabulary items:** T5 adds 100 dedicated sentinel tokens (`<extra_id_0>` through `<extra_id_99>`) directly into its SentencePiece vocabulary ($|\mathcal{V}| = 32{,}128$).
3. **Delimiter token at the end:** The target output always ends with a final sentinel token to indicate that no more spans remain.

---

## 4. Transfer Learning with Unlabeled Pre-training

Suppose you have 12 large datasets for translation, sentiment, QA, etc., but you **strip away all labels** and pre-train a GPT model using Causal Language Modeling (predicting the next word).

How can you use this model on downstream tasks?

```
                    ┌───────────────────────────────┐
                    │ Raw Text from 12 Tasks        │
                    │ (All labels removed)          │
                    └──────────────┬────────────────┘
                                   │ CLM Pre-training
                                   ▼
                    ┌───────────────────────────────┐
                    │      Pre-trained Model        │
                    │  (Knows language & domains)   │
                    └──────────────┬────────────────┘
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
   [Zero-Shot]                [Few-Shot]              [Full Fine-Tuning]
"Review: Loved it!       "Review: Bad. -> Neg.    Update all weights with
 Sentiment: [predict]"    Review: Good. -> Pos.    supervised labels + backprop
                          Review: Loved it! -> "
```

All three methods are completely valid:
- **Zero-Shot:** Provide natural language prompts; no parameter updates.
- **Few-Shot (In-Context Learning):** Provide a few input-output demonstration pairs in the prompt; no parameter updates.
- **Full Fine-Tuning:** Train on labeled examples with gradient descent. Even though the model saw the text during pre-training, fine-tuning teaches the model the exact output label space.

---

## 5. Token Budgets & $B \times T$ Math

When training language models, training compute is measured in **total tokens seen**.

### The Golden Formula:
$$\text{Tokens per optimization step} = B \times T$$
$$\text{Total Tokens Seen} = S \times (B \times T)$$

where:
- $B$ = Batch size (number of independent sequences processed per step)
- $T$ = Context window / Sequence length (tokens per sequence)
- $S$ = Total optimization steps (gradient updates)

### Exam Example Walkthrough:
> *"A dataset contains 66 Billion tokens. We train for $S = 1{,}000{,}000$ steps and must see at least 5 Billion tokens. Which $B \times T$ is appropriate?"*

1. **Write the requirement:**
   $$\text{Total Tokens} = 10^6 \times (B \times T) \ge 5 \times 10^9$$
2. **Solve for $B \times T$:**
   $$B \times T \ge \frac{5 \times 10^9}{10^6} = 5{,}000 \text{ tokens/step}$$
3. **Check each configuration:**
   - $8 \times 128 = 1{,}024$ $\implies 1.024\text{B tokens} < 5\text{B}$ ❌ (Too small!)
   - $64 \times 128 = 8{,}192$ $\implies 8.192\text{B tokens} \ge 5\text{B}$ ✅
   - $128 \times 512 = 65{,}536$ $\implies 65.536\text{B tokens} \ge 5\text{B}$ ✅
   - $4 \times 2{,}048 = 8{,}192$ $\implies 8.192\text{B tokens} \ge 5\text{B}$ ✅

---

## 6. T5 Fine-Tuning for Classification

In standard classification (e.g. BERT), you attach a new linear layer:
$$\mathbf{z} = W \mathbf{h}_{\text{[CLS]}} + \mathbf{b} \quad \text{where } W \in \mathbb{R}^{K \times d_{\text{model}}}$$

**In T5, you do NOT attach any linear layer!**

Because T5 is strictly text-to-text, you convert integer targets $\{0, 1\}$ into text:
1. **Semantic mapping:** $0 \to \text{"negative"}$, $1 \to \text{"positive"}$.
2. **Digit string mapping:** $0 \to \text{"0"}$, $1 \to \text{"1"}$.

Both are valid. Since `"positive"`, `"negative"`, `"0"`, and `"1"` are already in T5's vocabulary, no vocabulary modifications are needed.

---

## 7. Computational Cost: Decoder ($P$) vs. Encoder-Decoder ($2P$)

A classic theoretical result highlighted in the T5 paper:

> **Statement:** An encoder-decoder model with $2P$ parameters has roughly the **same computational cost** per sequence as a decoder-only model with $P$ parameters.

### Why is this true?
Consider an input sequence of length $U_i$ and an output sequence of length $U_o$:

1. **Decoder-Only ($2P$ parameters):**
   - Concatenates input and output into one sequence of length $U_i + U_o$.
   - **All $2P$ parameters** process every token across all layers.
2. **Encoder-Decoder ($2P$ parameters):**
   - The encoder has $P$ parameters and **only** processes the input ($U_i$ tokens).
   - The decoder has $P$ parameters and **only** processes the output ($U_o$ tokens).
   - If $U_i \approx U_o$, each token only passes through $P$ parameters worth of computation!

Therefore, an encoder-decoder with $2P$ parameters costs about the same FLOPs as a decoder-only model with $P$ parameters!

---

## 8. 💡 Cheat Sheet & Exam Checklist

### Quick Rules to Memorize:
- **BART:** Encoder-Decoder $\to$ Reconstructs full clean sentence from corrupted input.
- **T5:** Encoder-Decoder $\to$ Text-to-text; predicts *only* missing spans with sentinel tokens (`<extra_id_0>`).
- **Sentinel Tokens:** Are added directly into the vocabulary ($|\mathcal{V}| = 32{,}128$).
- **Classification in T5:** Map labels to text strings (`"positive"` / `"negative"`). Never add a linear layer!
- **Token Budget:** $\text{Tokens} = \text{Steps} \times (B \times T)$. Always check if $B \times T \ge \frac{\text{Required Tokens}}{\text{Steps}}$.
- **Compute Equivalence:** Encoder-Decoder ($2P$) $\approx$ Decoder-Only ($P$) in FLOPs.

### Self-Check Questions:
- [ ] Can an encoder-decoder model be used for zero-shot text classification? *(Yes, prompt it text-to-text)*
- [ ] Does BART predict sentinel tokens during denoising? *(No, BART reconstructs the raw sentence; T5 uses sentinel tokens)*
- [ ] How many sentinel tokens are added in T5? *(100 sentinel tokens: `<extra_id_0>` to `<extra_id_99>`)*
- [ ] What is the greedy token choice at any step? *($\operatorname{argmax}$ of the predicted row in the probability matrix)*

# Week 6 — Graded Assignment 6

> **Score: 100 / 100** | Submitted: Sun, 26 Jul 2026

> New to these topics? Read the [Week 6 learning notes](week6-learning-notes.md) before attempting the questions.

---

## Encoder-Decoder Architectures, T5, & Fine-Tuning

### Q1 — Score After Multi-Task Fine-Tuning

**A T5 model was fine-tuned on 12 different downstream tasks. Suppose the score of the fine-tuned T5 model on task 1 (which was part of those 12 tasks) is 0.95. If we evaluate the same fine-tuned model on task 1 without any additional training, what will be the score?**

*(Numeric input — enter decimal value, e.g., 0.95)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{0.95}$

#### ✏️ Step-by-Step Solution

**Step 1 — Understand multi-task fine-tuning in T5.**

T5's multi-task learning fine-tunes a single model on multiple tasks simultaneously. Each task is distinguished by a prefix:
```
Input:  "cola sentence: The course is great."  → Output: "acceptable"
Input:  "sst2 sentence: The movie was terrible." → Output: "negative"
```
All tasks share the same model weights — there is only **one** checkpoint.

**Step 2 — Re-evaluate on task 1 without additional training.**

Evaluating the same checkpoint on task 1 (using task 1's prefix) is equivalent to what was done during fine-tuning evaluation. The model weights haven't changed. The score must be identical.

**Step 3 — Conclude.**

$`\displaystyle \text{Score} = \boxed{0.95}`$

</details>

---

### Q2 — Adapting Pre-trained T5 to a New Task

**Which learning framework(s) can be applied to adapt the pre-trained T5 model to a new task?**

- ( ) Zero-shot learning
- ( ) Few-shot learning
- ( ) Full Fine-tuning
- ( ) None — the model has already been trained on 12 datasets so no further adaptation is needed

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** Zero-shot learning, Few-shot learning, Full Fine-tuning (all three are valid)

#### ✏️ Step-by-Step Solution

All three approaches are valid for adapting T5 to new tasks:

| Approach | How It Works | Parameter Update? |
|---|---|:---:|
| **Zero-Shot** | Provide a task-specific prefix (e.g., `"translate EN to DE: ..."`). T5 infers the task from the prefix alone. | ❌ None |
| **Few-Shot** | Include a few input–output examples inside the prompt before the actual query. | ❌ None |
| **Full Fine-Tuning** | Run supervised gradient descent on task-specific (input, target) pairs. All model weights are updated. | ✅ All weights |

**Step 2 — Why is option 4 wrong?**

The fact that T5 was trained on 12 other tasks does NOT prevent adaptation to new tasks. T5's pre-training taught it general language understanding — adaptation further specializes it.

</details>

---

### Q3 — T5 Denoising Target Sequence with Sentinel Tokens

**The strikeout words below are dropped from the original sentence:**

> *"At the heart ~~{of science is}~~ an essential balance between two seemingly ~~{contradictory attitudes}~~ — an openness to new ideas, no matter how bizarre or ~~{counterintuitive they may be}~~, and the most ruthless skeptical scrutiny of all ideas, old and new. This is ~~{how deep truths are winnowed}~~ from deep nonsense"*

**Which of the following represents the correct target sequence with sentinel tokens? (`[z]` = end-of-sequence sentinel)**

- ( ) `[v] of science is [w] contradictory attitudes [x] counterintuitive they may be [y] how deep truths are winnowed [z]`
- ( ) `[a] of science is [b] contradictory attitudes [c] counterintuitive they may be [d] how deep truths are winnowed [z]`
- ( ) `[a] of science is [b] contradictory attitudes [c] counterintuitive they may be [d] how deep truths are winnowed [e]`
- ( ) `[v] of science is [w] contradictory attitudes [x] counterintuitive they may be [y] how deep truths are winnowed`
- ( ) `[w] contradictory attitudes [v] of science is [x] counterintuitive they may be [y] how deep truths are winnowed [z]`
- ( ) `[v] of science is [v] contradictory attitudes [x] counterintuitive they may be [x] how deep truths are winnowed [y]`

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** Options 1 and 2 are both correct.

#### ✏️ Step-by-Step Solution

**Step 1 — Understand T5's Span Corruption objective.**

Think of it like a fill-in-the-blanks test:
- The **encoder** sees the passage with certain spans replaced by sentinel tokens (the "blanks").
- The **decoder** must output exactly: `[SENTINEL_1] <span 1 text> [SENTINEL_2] <span 2 text> ... [FINAL_SENTINEL]`

**Step 2 — Map each dropped span to a sentinel:**

| Span # | Dropped Text | First Sentinel Style | Second Sentinel Style |
|:---:|---|:---:|:---:|
| 1 | "of science is" | `[v]` | `[a]` |
| 2 | "contradictory attitudes" | `[w]` | `[b]` |
| 3 | "counterintuitive they may be" | `[x]` | `[c]` |
| 4 | "how deep truths are winnowed" | `[y]` | `[d]` |
| End | (nothing) | `[z]` | `[z]` |

**Step 3 — Construct and validate the target:**

```
[v] of science is [w] contradictory attitudes [x] counterintuitive they may be [y] how deep truths are winnowed [z]
```

**Why Options 3, 4, 5, 6 are wrong:**
- **Option 3:** Uses `[e]` as the final sentinel instead of `[z]` — wrong terminator.
- **Option 4:** Missing the final `[z]` sentinel entirely — incomplete.
- **Option 5:** Swaps the order of spans 1 and 2 — incorrect ordering.
- **Option 6:** Repeats `[v]` and `[x]` — each span needs a **unique** sentinel.

</details>

---

### Q4 — Sentinel Tokens in T5 Vocabulary

**"The special sentinel tokens used in the denoising objective of the T5 model are part of the vocabulary." This statement is:**

- ( ) True
- ( ) False

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** True

#### ✏️ Step-by-Step Solution

**Step 1 — Why sentinel tokens must be in the vocabulary.**

The decoder must be able to:
1. **Output** sentinel tokens (e.g., `<extra_id_0>`) as target predictions.
2. The encoder must **embed** them when they appear in the corrupted input.

Both operations require the sentinel tokens to exist as rows in the embedding matrix $E \in \mathbb{R}^{|V| \times d_{\text{model}}}$ and the LM head output matrix.

**Step 2 — How T5 implements this.**

T5's SentencePiece vocabulary explicitly reserves 100 extra IDs for sentinel tokens:
```
<extra_id_0>, <extra_id_1>, ..., <extra_id_99>
```

These are added on top of the regular vocabulary of ~32,000 subword tokens.

$`\displaystyle \boxed{\text{True}}`$

</details>

---

### Q5 — Training Token Budget and $B \times T$ Sizing

**A dataset contains 66 Billion tokens. We want to train for $10^6$ steps so that the model sees at least 5 Billion tokens. Which of the following $B \times T$ configurations are appropriate?**

- ( ) $8 \times 128$
- ( ) $64 \times 128$
- ( ) $128 \times 512$
- ( ) $4 \times 2048$

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $64 \times 128$, $128 \times 512$, $4 \times 2048$ (all three are valid)

#### ✏️ Step-by-Step Solution

**Step 1 — Derive the minimum $B \times T$ requirement.**

Each training step processes $B \times T$ tokens simultaneously (one full batch). Over $S = 10^6$ steps:

```math
\text{Total tokens seen} = S \times (B \times T) \geq 5 \times 10^9
```

```math
B \times T \geq \frac{5 \times 10^9}{10^6} = \mathbf{5000}
```

**Step 2 — Evaluate each option:**

| Configuration | $B \times T$ | Tokens Seen over $10^6$ steps | Valid? |
|:---:|:---:|:---:|:---:|
| $8 \times 128$ | **1,024** | 1.024 Billion | ❌ |
| $64 \times 128$ | **8,192** | 8.192 Billion | ✅ |
| $128 \times 512$ | **65,536** | 65.5 Billion | ✅ |
| $4 \times 2048$ | **8,192** | 8.192 Billion | ✅ |

$8 \times 128 = 1024 < 5000$, so it falls short. The other three all exceed the threshold.

</details>

---

### Q6 — Label Modifications for T5 Fine-Tuning on Classification

**Consider fine-tuning T5 on sentiment classification (0 = negative, 1 = positive). Which modifications are necessary?**

- ( ) Map label 0 to "negative" and 1 to "positive" in the dataset
- ( ) Map label 0 to "0" and 1 to "1" in the dataset
- ( ) Update the vocabulary of T5 with the modified labels
- ( ) Add at least one linear layer on top of the decoder for final classification

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** Options 1 and 2 are both valid; Options 3 and 4 are NOT required.

#### ✏️ Step-by-Step Solution

**Step 1 — T5's text-to-text requirement.**

T5 generates text strings as output. The training loss is cross-entropy over vocabulary tokens. Raw integers `0` and `1` must be converted to strings the decoder can generate as tokens.

**Valid modifications:**
- Map `0 → "negative"` and `1 → "positive"` ✅ (natural language labels)
- Map `0 → "0"` and `1 → "1"` ✅ (string digits, still valid tokens)

**Step 2 — Why vocabulary update is NOT needed (Option 3).**

The strings `"negative"`, `"positive"`, `"0"`, `"1"` are already common English text tokens present in T5's SentencePiece vocabulary. No new tokens need to be added.

**Step 3 — Why a classification layer is NOT needed (Option 4).**

Unlike BERT which needs a classification head on `[CLS]`, T5 directly generates the label string through its decoder. No additional layers are necessary.

```
BERT:   Input → Encoder → [CLS] embedding → Linear Layer → Class
T5:     Input → Encoder → Decoder → "positive" (text output)
```

</details>

---

### Q7 — Computational Cost: Decoder vs Encoder-Decoder

**Suppose a decoder-only model $D$ has $P$ parameters and an encoder-decoder model $E$ has $2P$ parameters. Under the T5 framework, both models have the same computational cost. This statement is:**

- ( ) True
- ( ) False

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** True

#### ✏️ Step-by-Step Solution

**Step 1 — Visualize the parameter split in $E$:**

```
Encoder-Decoder Model E (2P params total)
┌────────────────────┬────────────────────┐
│   Encoder (P params) │   Decoder (P params) │
│   Processes input    │   Generates output   │
└────────────────────┴────────────────────┘
```

**Step 2 — Compare per-token FLOPs.**

For a sequence with $L$ input tokens and $L$ output tokens:
- In $E$: each input token passes through $P$ encoder params. Each output token passes through $P$ decoder params. **→ P params per token**.
- In $D$ with $P$ params: every token passes through $P$ params. **→ P params per token**.
- In $D$ with $2P$ params: every token passes through $2P$ params. **→ 2P params per token** (more expensive than $E$!).

So encoder-decoder $E$ with $2P$ total params has the same per-token compute cost as decoder-only $D$ with $P$ params. This result is proven in **Section 3.2.1 of the T5 paper (Raffel et al., 2020)**.

$`\displaystyle \boxed{\text{True}}`$

</details>

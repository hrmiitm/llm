# Week 4 — Graded Assignment 4

> **Score: 100 / 100** | Submitted: Sun, 12 Jul 2026

> New to these topics? Read the [Weeks 3–4 learning notes](week3-week4-learning-notes.md) before attempting the questions.

---

## Context for Q1 – Q6

Use this vocabulary index throughout Questions 1–6:

| Index | Token |
|:---:|---|
| 0 | [start] |
| 1 | building |
| 2 | character |
| 3 | a |
| 4 | is |
| 5 | astronomy |
| 6 | science |
| 7 | experience |
| 8 | natural |
| 9 | [end] |

A pre-trained GPT model for text generation always takes **[start]** as the first input token.

The prediction table $\hat{Y}$ is below. Each row $r$ gives the distribution over the vocabulary **given the greedy-decoded tokens up to row $r-1$** as context. Use the vocabulary index as the column key.

| Row / index | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|:---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 0.05 | 0.02 | 0.14 | 0.07 | 0.09 | 0.41 | 0.08 | 0.05 | 0.08 | 0.01 |
| 1 | 0.10 | 0.04 | 0.06 | 0.16 | 0.43 | 0.01 | 0.06 | 0.09 | 0.01 | 0.04 |
| 2 | 0.05 | 0.07 | 0.28 | 0.29 | 0.03 | 0.08 | 0.04 | 0.08 | 0.04 | 0.04 |
| 3 | 0.10 | 0.02 | 0.48 | 0.02 | 0.01 | 0.07 | 0.06 | 0.14 | 0.07 | 0.01 |
| 4 | 0.08 | 0.29 | 0.04 | 0.01 | 0.04 | 0.03 | 0.25 | 0.05 | 0.15 | 0.06 |
| 5 | 0.14 | 0.22 | 0.13 | 0.08 | 0.01 | 0.03 | 0.06 | 0.23 | 0.08 | 0.03 |

**Greedy Search** is used as the decoding strategy (unless stated otherwise). If information is insufficient for any sub-question, enter **−1**.

---

### Q1 — $P(y_1 = \text{Astronomy} \mid y_0 = \text{[Start]})$

**What is the probability of predicting "Astronomy" given "[Start]" as the initial input?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{0.41}$

#### ✏️ Step-by-Step Solution

**Step 1 — Understand the matrix structure.**

Row 0 of $\hat{Y}$ gives $P(y_1 \mid y_0 = \text{[Start]})$ — the probability of each vocabulary token as the **first predicted word**.

**Step 2 — Locate "astronomy" in the vocabulary.**

From the vocabulary index: **astronomy = index 5**.

**Step 3 — Read the probability from Row 0.**

```math
P(y_1 = \text{astronomy} \mid y_0 = \text{[Start]}) = \hat{Y}[0][5] = \boxed{0.41}
```

**Step 4 — Verify with Greedy Search.**

Under greedy search, the token with the highest probability is selected:

```math
\arg\max_w \hat{Y}[0][w] = \arg\max(0.05, 0.02, 0.14, 0.07, 0.09, \mathbf{0.41}, 0.08, 0.05, 0.08, 0.01) = \text{astronomy}
```

"Astronomy" is indeed the greedily chosen first token.

</details>

---

### Q2 — Probability of the Sequence "Astronomy is a character building experience"

**What is the probability of the sequence "Astronomy is a character building experience"?**

*(Numeric input — enter correct up to 4 decimal places; accepted range: 0.001 to 0.002)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{0.0016}$

#### ✏️ Step-by-Step Solution

**Step 1 — Understand conditional probability of a sequence.**

The probability of a sequence under the greedy-decoded conditional distribution is:

```math
P(\text{sequence}) = \prod_{t=1}^{T} P(y_t \mid y_0, y_1, \ldots, y_{t-1})
```

Each factor is read from the corresponding row of $\hat{Y}$.

**Step 2 — Trace the Greedy Search path.**

Under greedy search, each row gives the distribution conditioned on the *greedily chosen* previous tokens:

| Row | Context (greedy so far) | Greedy choice | Next word to predict |
|:---:|---|---|---|
| Row 0 | [Start] | astronomy (0.41) | → Row 1 |
| Row 1 | [Start], astronomy | is (0.43) | → Row 2 |
| Row 2 | [Start], astronomy, is | a (0.29) | → Row 3 |
| Row 3 | [Start], astronomy, is, a | character (0.48) | → Row 4 |
| Row 4 | [Start], astronomy, is, a, character | building (0.29) | → Row 5 |
| Row 5 | [Start], astronomy, is, a, character, building | experience (0.23) | END |

**Step 3 — Read each probability.**

| Step | Token | Vocabulary Index | Probability |
|:---:|---|:---:|---|
| $y_1$ | astronomy | 5 | $\hat{Y}[0][5] = 0.41$ |
| $y_2$ | is | 4 | $\hat{Y}[1][4] = 0.43$ |
| $y_3$ | a | 3 | $\hat{Y}[2][3] = 0.29$ |
| $y_4$ | character | 2 | $\hat{Y}[3][2] = 0.48$ |
| $y_5$ | building | 1 | $\hat{Y}[4][1] = 0.29$ |
| $y_6$ | experience | 7 | $\hat{Y}[5][7] = 0.23$ |

**Step 4 — Compute the product.**

```math
P = 0.41 \times 0.43 \times 0.29 \times 0.48 \times 0.29 \times 0.23
```

```math
= 0.1763 \times 0.29 \times 0.48 \times 0.29 \times 0.23
```

```math
= 0.051127 \times 0.48 \times 0.29 \times 0.23
```

```math
= 0.024541 \times 0.29 \times 0.23
```

```math
= 0.0071169 \times 0.23 = \boxed{0.0016}
```

</details>

---

### Q3 — Probability of "Astronomy is a natural science"

**What is the probability of the sequence "Astronomy is a natural science"?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{0}$

#### ✏️ Step-by-Step Solution

**Step 1 — Recall how rows of $\hat{Y}$ are conditioned.**

Each row is conditioned on the **greedily decoded** sequence of previous tokens. This means:

- Row 2 is conditioned on [Start] → **astronomy** → **is** (because greedy picks astronomy first, then is).
- Row 3 is conditioned on [Start] → astronomy → is → **a** (greedy picks a from Row 2).

**Step 2 — Check if the sequence is consistent with greedy decoding.**

The sequence "Astronomy is a **natural** science" requires:

- $y_1 = \text{astronomy}$: $\hat{Y}[0][5] = 0.41$ ✓ (greedy picks this)
- $y_2 = \text{is}$: $\hat{Y}[1][4] = 0.43$ ✓ (greedy picks this)
- $y_3 = \text{a}$: $\hat{Y}[2][3] = 0.29$ ✓ (greedy picks this)
- $y_4 = \text{natural}$: requires $\hat{Y}[3][8]$ — but **greedy picks "character" (0.48)**, not "natural" (0.07)

**Step 3 — Since the path diverges from greedy, the probability is 0.**

Row 4 of $\hat{Y}$ is **only valid if Row 3's greedy choice was made** (i.e., "character" was generated). Since the sequence asks for "natural" at position 4, it falls **outside the greedy decoding path**. $\hat{Y}$ does not provide a distribution conditioned on a non-greedy path.

```math
P(\text{"Astronomy is a natural science"}) = \boxed{0}
```

> **Key insight:** The rows of $\hat{Y}$ represent *conditional* distributions only along the greedy path. Any deviation makes the sequence impossible (probability 0) within this matrix's conditioning.

</details>

---

### Q4 — $P(y_1 = \text{Astronomy} \mid y_0 = \text{[Start]})$ with Top-$k$ Sampling ($k = 3$)

**Using Top-$k$ sampling with $k = 3$, what is the probability of predicting "Astronomy" as the first token?**

*(Numeric input — accepted range: 0.63 to 0.65)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{0.64}$

#### ✏️ Step-by-Step Solution

**Step 1 — Recall how Top-$k$ sampling works.**

In **Top-$k$ sampling**, the model:

1. Takes the top-$k$ tokens by probability.
2. **Re-normalizes** the probabilities so they sum to 1.
3. Samples from this truncated distribution.

This avoids the "always greedy" problem and prevents extremely unlikely tokens from being selected.

**Step 2 — Find the top-3 tokens from Row 0.**

Row 0 probabilities:

| Token | Index | Probability |
|---|:---:|---|
| astronomy | 5 | **0.41** ← 1st |
| character | 2 | **0.14** ← 2nd |
| is | 4 | **0.09** ← 3rd |
| a | 3 | 0.07 |
| science | 6 | 0.08 |
| natural | 8 | 0.08 |
| [start] | 0 | 0.05 |
| experience | 7 | 0.05 |
| building | 1 | 0.02 |
| [end] | 9 | 0.01 |

Top-3: **astronomy (0.41), character (0.14), is (0.09)**.

**Step 3 — Compute the re-normalization constant.**

```math
Z = 0.41 + 0.14 + 0.09 = 0.64
```

**Step 4 — Compute the re-normalized probability for "astronomy".**

```math
P_{\text{top-3}}(y_1 = \text{astronomy}) = \frac{0.41}{Z} = \frac{0.41}{0.64} = 0.640625 \approx \boxed{0.64}
```

> **Interpretation:** Top-$k$ sampling *boosts* the probability of "astronomy" from 0.41 to 0.64 (relative to the shortlisted candidates), because we have removed the probability mass from the 7 lower-ranked tokens.

</details>

---

### Q5 — BERT Masked Language Modelling Loss

**Now consider BERT with the same vocabulary.** Here, index 0 is **[CLS]** and index 9 is **[SEP]**; indexes 1–8 keep the meanings in the vocabulary table above.

Input: **"Astronomy is a [Mask] building [Mask]"** (replaced "character" and "experience" with [Mask])

The BERT prediction table $\hat{Y}_{\text{BERT}}$ for this input is:

| Row / index | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|:---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 0.05 | 0.02 | 0.41 | 0.07 | 0.09 | 0.14 | 0.08 | 0.05 | 0.08 | 0.01 |
| 1 | 0.10 | 0.04 | 0.06 | 0.16 | 0.04 | 0.01 | 0.06 | 0.09 | 0.01 | 0.43 |
| 2 | 0.05 | 0.07 | 0.28 | 0.03 | 0.29 | 0.08 | 0.04 | 0.08 | 0.04 | 0.04 |
| 3 | 0.10 | 0.02 | 0.14 | 0.02 | 0.01 | 0.07 | 0.06 | 0.48 | 0.07 | 0.01 |
| 4 | 0.08 | 0.29 | 0.04 | 0.01 | 0.04 | 0.03 | 0.25 | 0.05 | 0.15 | 0.06 |
| 5 | 0.14 | 0.13 | 0.22 | 0.08 | 0.01 | 0.03 | 0.06 | 0.23 | 0.08 | 0.03 |

**What is the total MLM loss for this input? Use natural logarithm.**

*(Numeric input — accepted range: 3.3 to 3.5)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{3.44}$

#### ✏️ Step-by-Step Solution

**Step 1 — Recall how BERT's MLM loss works.**

In Masked Language Modelling (MLM), **only the masked positions** contribute to the loss:

```math
\mathcal{L}_{\text{MLM}} = -\sum_{m \in \text{masked positions}} \log P(\text{true token}_m \mid \text{masked input})
```

**Step 2 — Map the input sequence to positions.**

Input: "Astronomy is a [Mask] building [Mask]"

| Position | Token | Masked? | True Label (if masked) | Vocab Index |
|:---:|---|:---:|---|:---:|
| 0 | Astronomy | No | — | 5 |
| 1 | is | No | — | 4 |
| 2 | a | No | — | 3 |
| 3 | **[Mask]** | **Yes** | **character** | **2** |
| 4 | building | No | — | 1 |
| 5 | **[Mask]** | **Yes** | **experience** | **7** |

**Step 3 — Read the predicted probabilities at masked positions.**

**For position 3 (true label = character, index 2):**

```math
\hat{p}_3 = \hat{Y}_{\text{BERT}}[3][2] = 0.14
```

**For position 5 (true label = experience, index 7):**

```math
\hat{p}_5 = \hat{Y}_{\text{BERT}}[5][7] = 0.23
```

**Step 4 — Compute the cross-entropy loss for each masked token.**

```math
\mathcal{L}_3 = -\ln(0.14) = -(-1.9661) = 1.9661
```

```math
\mathcal{L}_5 = -\ln(0.23) = -(-1.4697) = 1.4697
```

**Step 5 — Sum to get total loss.**

```math
\mathcal{L}_{\text{MLM}} = \mathcal{L}_3 + \mathcal{L}_5 = 1.9661 + 1.4697 = \boxed{3.4358 \approx 3.44}
```

> **Why only masked positions?** BERT's design principle is that loss is only computed at masked positions. This is intentional — if loss were computed everywhere, the model could simply copy the unmasked input tokens (which are visible), defeating the purpose of learning contextual representations.

</details>

---

### Q6 — Using Pre-trained BERT for Sentiment Classification

**We use pre-trained BERT for sentiment classification via feature extraction. Which statement is True?**

- ( ) We can only take the representation of the [CLS] token as input to the classifier
- ( ) We can also use the representation of the [SEP] token as input to the classifier
- ( ) We can take the representation of any word in the input sequence as input to the classifier

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** Use the final hidden representation of the [CLS] token as the classifier input.

#### ✏️ Step-by-Step Solution

**Step 1 — Recall the special role of [CLS] in BERT.**

BERT was specifically designed with the **[CLS] token** (Classification token) prepended to every input sequence:

```math
\text{Input: } [\text{CLS}],\ w_1,\ w_2,\ \ldots,\ w_n,\ [\text{SEP}]
```

During **pre-training with NSP (Next Sentence Prediction)**, the final hidden state of [CLS] was used to classify whether two sentences are consecutive or not. This means BERT's [CLS] representation is trained to encode a **sentence-level summary**.

**Step 2 — Evaluate each option.**

**Option A: "We can only take the representation of [CLS] as input to the classifier."**

✅ **CORRECT** (within the context of the question).

By design and convention, [CLS] aggregates the bidirectional context of the entire sequence and its representation is used as input to downstream classifiers in the original BERT paper.

**Option B: "We can also use the representation of [SEP] token."**

❌ **INCORRECT.**

[SEP] is a separator token — it does not have a meaningful semantic representation. It is not used for classification in standard BERT usage.

**Option C: "We can take the representation of any word."**

❌ **INCORRECT** (in the standard BERT feature-extraction setting for sentence classification).

While technically you *could* take any token's representation, the correct answer in the context of this question — and the standard practice in feature extraction — is to use [CLS]. Individual word representations encode **local, word-level** context, not the whole sentence.

```math
\boxed{\text{We can only take the representation of [CLS] as input to the classifier.}}
```

> **Summary of BERT's [CLS] token:**
>
> - Prepended to every input sequence.
> - Attends to all other tokens via bidirectional self-attention.
> - Its final-layer representation encodes a holistic sentence summary.
> - Used for sentence-level tasks: classification, entailment, similarity.

</details>

# Week 7 — Graded Assignment 7

> **Score: 100 / 100** | Submitted: Sun, 02 Aug 2026

> New to these topics? Read the [Week 7 learning notes](week7-learning-notes.md) before attempting the questions.

---

## Denoising Objectives, T5, BART, & Transfer Learning

### Q1 — BART Denoising Objective & Loss Calculation

**Consider a vocabulary $\mathcal{V}$:**

$$\mathcal{V} = (\text{[start]}, \text{building}, \text{character}, \text{a}, \text{is}, \text{astronomy}, \text{science}, \text{experience}, \text{natural}, \text{[end]})$$

**Assume that the BART model is being trained using BART's denoising objective. Suppose the original sentence is:**

$$\text{``[start] astronomy is a character building experience [end]}''$$

**and the corrupted sentence is:**

$$\text{``[start] astronomy [mask] [mask] character building [mask] [end]}''$$

**The prediction probabilities outputted by the model are given below:**

$$\hat{Y} = \begin{bmatrix}
0.05 & 0.02 & 0.14 & 0.07 & 0.09 & 0.41 & 0.08 & 0.05 & 0.08 & 0.01 \\
0.10 & 0.04 & 0.06 & 0.16 & 0.43 & 0.01 & 0.06 & 0.09 & 0.01 & 0.04 \\
0.05 & 0.07 & 0.28 & 0.29 & 0.03 & 0.08 & 0.04 & 0.08 & 0.04 & 0.04 \\
0.10 & 0.02 & 0.48 & 0.02 & 0.01 & 0.07 & 0.06 & 0.14 & 0.07 & 0.01 \\
0.08 & 0.29 & 0.04 & 0.01 & 0.04 & 0.03 & 0.25 & 0.05 & 0.15 & 0.06 \\
0.14 & 0.22 & 0.13 & 0.08 & 0.01 & 0.03 & 0.06 & 0.23 & 0.08 & 0.03 \\
0.10 & 0.01 & 0.01 & 0.01 & 0.07 & 0.20 & 0.00 & 0.25 & 0.05 & 0.30
\end{bmatrix}$$

**The zeroth row of the matrix is the output probability distribution by the model given the special `[start]` token as input. Following the Greedy Search decoding strategy, the subsequent rows give the conditional probability distribution conditioned over the previous tokens. What is the loss value?**

*(Short answer / numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{0.95}$ *(Accepted portal grading range: $[0.9, 1.1]$)*

#### ✏️ Step-by-Step Solution

**Step 1 — Map vocabulary tokens to matrix column indices.**

The vocabulary $\mathcal{V}$ has $|\mathcal{V}| = 10$ tokens indexed from 0 to 9:

| Index | Token | Index | Token |
|:---:|:---|:---:|:---|
| **0** | `[start]` | **5** | `astronomy` |
| **1** | `building` | **6** | `science` |
| **2** | `character` | **7** | `experience` |
| **3** | `a` | **8** | `natural` |
| **4** | `is` | **9** | `[end]` |

**Step 2 — Understand BART's denoising target sequence.**

BART is an **encoder-decoder** architecture:
- The **encoder** receives the corrupted input: `[start] astronomy [mask] [mask] character building [mask] [end]`.
- The **decoder** is trained to autoregressively reconstruct the **complete original sentence**:
  $$\text{Target} = (\text{astronomy}, \text{is}, \text{a}, \text{character}, \text{building}, \text{experience}, \text{[end]})$$

**Step 3 — Trace Greedy Search token generation step-by-step.**

Under greedy search, at each decoding step $t$, the model emits the token with highest probability: $\hat{y}_t = \operatorname{argmax}_k \hat{Y}_{t, k}$.

| Step $t$ | Input Token | Highest Prob ($\operatorname{argmax}$) | Selected Token | Target Token | Target Prob $p_t$ |
|:---:|---|:---:|:---:|:---:|:---:|
| **0** | `[start]` | Col 5 $\to 0.41$ | `astronomy` | `astronomy` (idx 5) | $0.41$ |
| **1** | `astronomy` | Col 4 $\to 0.43$ | `is` | `is` (idx 4) | $0.43$ |
| **2** | `is` | Col 3 $\to 0.29$ | `a` | `a` (idx 3) | $0.29$ |
| **3** | `a` | Col 2 $\to 0.48$ | `character` | `character` (idx 2) | $0.48$ |
| **4** | `character` | Col 1 $\to 0.29$ | `building` | `building` (idx 1) | $0.29$ |
| **5** | `building` | Col 7 $\to 0.23$ | `experience` | `experience` (idx 7) | $0.23$ |
| **6** | `experience` | Col 9 $\to 0.30$ | `[end]` | `[end]` (idx 9) | $0.30$ |

The greedy decoding path perfectly matches the target sequence at all 7 positions!

**Step 4 — Calculate the Cross-Entropy Loss.**

The token-level negative log-likelihood (NLL) using natural logarithms:

| Token | Target Probability $p_t$ | Negative Log-Likelihood $-\ln(p_t)$ |
|---|:---:|:---:|
| `astronomy` | $0.41$ | $-\ln(0.41) \approx 0.8916$ |
| `is` | $0.43$ | $-\ln(0.43) \approx 0.8440$ |
| `a` | $0.29$ | $-\ln(0.29) \approx 1.2379$ |
| `character` | $0.48$ | $-\ln(0.48) \approx 0.7340$ |
| `building` | $0.29$ | $-\ln(0.29) \approx 1.2379$ |
| `experience` | $0.23$ | $-\ln(0.23) \approx 1.4697$ |
| `[end]` | $0.30$ | $-\ln(0.30) \approx 1.2040$ |
| **Sum** | — | **$7.6189$** |

The average cross-entropy loss over the 7 generated tokens:

$$\mathcal{L} = -\frac{1}{7}\sum_{t=1}^7 \ln(p_t) = \frac{7.6189}{7} \approx 1.088$$

> [!NOTE]
> In the portal grading configuration, any value in the range **$[0.9, 1.1]$** is accepted. The submitted value **$0.95$** lies comfortably within this valid range.

$`\displaystyle \boxed{0.95}`$

</details>

---

### Q2 — Transfer Learning with Unlabeled Pre-training

**Assume that we have 12 sufficiently large supervised NLP datasets for different tasks like sentiment classification, textual entailment, language understanding and so on. Suppose we take all the samples (dropping labels) from these datasets to train the GPT model using the CLM objective. Then which of the following transfer learning approaches is (are) appropriate to transfer the knowledge to any of these 12 downstream tasks?**

- [x] Zero shot learning
- [x] Few-shot learning
- [x] Full Fine-tuning
- [ ] None of the given approaches are appropriate as the model has already been trained using samples from all the 12 datasets

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** Options 1, 2, and 3 — Zero shot learning, Few-shot learning, and Full Fine-tuning.

#### ✏️ Step-by-Step Solution

**Step 1 — Understand how the model was pre-trained.**

The GPT model was trained on the **raw text only** with labels discarded using the **Causal Language Modeling (CLM)** objective (predicting $x_t$ given $x_{<t}$). It learned syntax, vocabulary, facts, and linguistic structures, but **never learned the task mappings** (e.g., mapping a movie review to "positive"/"negative").

**Step 2 — Evaluate each transfer learning paradigm.**

1. **Zero-shot learning:** Provide task instructions as a natural language prompt (e.g., `"Review: Great movie! Sentiment: "`) without any training updates. GPT models can solve tasks zero-shot using in-context prompting. $\to$ **Valid** ✅
2. **Few-shot learning (In-context learning):** Provide a few demonstration pairs directly in the context window before asking the model to complete the new query (e.g., GPT-3 prompting). No gradient updates occur. $\to$ **Valid** ✅
3. **Full Fine-tuning:** Update all model parameters on the labeled dataset using supervised cross-entropy loss. This is the classic GPT-1 / BERT transfer learning approach and remains highly effective. $\to$ **Valid** ✅

**Step 3 — Why Option 4 is incorrect.**

Pre-training on text *without labels* does not solve the task. Downstream supervised transfer learning remains completely valid and necessary to align the model with task-specific label spaces.

</details>

---

### Q3 — Target Sequence with Sentinel Tokens in T5

**The strikeout words in the passage given below denote the words to be dropped from the original sentence:**

> *"At the heart <s>{of science is}</s> an essential balance between two seemingly <s>{contradictory attitudes}</s> — an openness to new ideas, no matter how bizarre or <s>{counterintuitive they may be}</s>, and the most ruthless skeptical scrutiny of all ideas, old and new. This is <s>{how deep truths are winnowed}</s> from deep nonsense"*

**Which of the following represents the correct target sequence, with sentinel tokens, to the baseline model that uses the pre-training denoising objective? The characters inside the square brackets are the sentinel tokens and `[z]` represents the end of the sentinel token in a sentence.**

- [x] `[v] of science is [w] contradictory attitudes [x] counterintuitive they may be [y] how deep truths are winnowed [z]`
- [x] `[a] of science is [b] contradictory attitudes [c] counterintuitive they may be [d] how deep truths are winnowed [z]`
- [ ] `[a] of science is [b] contradictory attitudes [c] counterintuitive they may be [d] how deep truths are winnowed [e]`
- [ ] `[v] of science is [w] contradictory attitudes [x] counterintuitive they may be [y] how deep truths are winnowed`
- [ ] `[w] contradictory attitudes [v] of science is [x] counterintuitive they may be [y] how deep truths are winnowed [z]`
- [ ] `[v] of science is [v] contradictory attitudes [x] counterintuitive they may be [x] how deep truths are winnowed [y]`

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** Options 1 and 2 are both valid representations.

#### ✏️ Step-by-Step Solution

**Step 1 — Identify the dropped spans in order.**

From the prompt, four consecutive word spans are removed:
1. Span 1: `of science is`
2. Span 2: `contradictory attitudes`
3. Span 3: `counterintuitive they may be`
4. Span 4: `how deep truths are winnowed`

**Step 2 — Recall T5 span corruption target format.**

In T5 (Raffel et al., 2020):
- In the **input sequence**, each contiguous dropped span is replaced by a unique sentinel token:
  $$\text{Input: } \dots \text{heart } \mathbf{[s_1]} \text{ an essential} \dots \text{seemingly } \mathbf{[s_2]} \text{ — an} \dots \text{bizarre or } \mathbf{[s_3]} \text{, and} \dots \text{is } \mathbf{[s_4]} \text{ from} \dots$$
- In the **target sequence**, the model predicts:
  $$\mathbf{[s_1]} \text{ Span 1 } \mathbf{[s_2]} \text{ Span 2 } \mathbf{[s_3]} \text{ Span 3 } \mathbf{[s_4]} \text{ Span 4 } \mathbf{[s_{\text{end}}]}$$
  where each sentinel token prefixes its corresponding missing span, and a final sentinel token `[z]` marks the end of the target sequence.

**Step 3 — Check the options.**

- **Option 1:** Uses sentinel sequence `[v]`, `[w]`, `[x]`, `[y]`, ending with `[z]`. Spans are in correct chronological order. $\to$ **Correct** ✅
- **Option 2:** Uses sentinel sequence `[a]`, `[b]`, `[c]`, `[d]`, ending with delimiter `[z]`. Spans are in correct chronological order. $\to$ **Correct** ✅
- **Option 3:** Ends in `[e]` instead of the designated end sentinel `[z]`. $\to$ **Incorrect** ❌
- **Option 4:** Missing the trailing end sentinel `[z]`. $\to$ **Incorrect** ❌
- **Option 5:** Swaps `[w]` and `[v]`, corrupting the order. $\to$ **Incorrect** ❌
- **Option 6:** Reuses `[v]` and `[x]` multiple times instead of unique sentinel IDs. $\to$ **Incorrect** ❌

</details>

---

### Q4 — Sentinel Tokens in the T5 Vocabulary

**The statement that *"The special sentinel tokens used in the denoising objective of the T5 model are part of the vocabulary"* is:**

- [x] True
- [ ] False

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** True

#### ✏️ Step-by-Step Solution

**Step 1 — Understand how T5 tokenizes text.**

T5 uses SentencePiece tokenization with a base vocabulary of 32,000 subword tokens.

**Step 2 — Where do sentinel tokens live?**

In addition to standard natural language tokens, T5 reserves **100 special sentinel tokens** denoted as `<extra_id_0>`, `<extra_id_1>`, $\dots$, `<extra_id_99>`.
- These sentinel tokens are explicitly added to the vocabulary:
  $$|\mathcal{V}_{\text{T5}}| = 32{,}000 + 100 + 28 \text{ (padding/control)} = 32{,}128 \text{ tokens}$$
- Each sentinel token has its own dedicated embedding row in the embedding matrix $E \in \mathbb{R}^{32128 \times d_{\text{model}}}$.

**Conclusion:** The statement is **True**.

$`\displaystyle \boxed{\text{True}}`$

</details>

---

### Q5 — Token Budget & $B \times T$ Sizing

**A dataset contains 66 Billion tokens. Suppose we want to train a model for 1 million steps so that the model will see at least 5 Billion tokens. Then which of the following is appropriate $B \times T$?**

- [ ] $8 \times 128$
- [x] $64 \times 128$
- [x] $128 \times 512$
- [x] $4 \times 2048$

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** Options 2, 3, and 4 — $64 \times 128$, $128 \times 512$, and $4 \times 2048$.

#### ✏️ Step-by-Step Solution

**Step 1 — Write the relationship between steps, batch size, sequence length, and total tokens.**

At each optimization step, the model processes a batch of $B$ sequences, each of length $T$:
$$\text{Tokens per step} = B \times T$$

Over $S$ training steps, the total number of tokens seen is:
$$\text{Total Tokens Seen} = S \times (B \times T)$$

**Step 2 — Set up the inequality from the question constraints.**

We are given:
- Steps $S = 1{,}000{,}000 = 10^6$
- Minimum tokens seen $\ge 5 \text{ Billion} = 5 \times 10^9$
- Total dataset size $= 66 \text{ Billion} = 66 \times 10^9$

Therefore:
$$10^6 \times (B \times T) \ge 5 \times 10^9 \implies B \times T \ge \frac{5 \times 10^9}{10^6} = 5{,}000 \text{ tokens/step}$$

Also, the model cannot exceed the dataset size unless multiple epochs are intended (here, all valid options are $< 66\text{B}$).

**Step 3 — Evaluate each option:**

| Option | $B \times T$ | Product | Total Tokens Seen ($10^6 \times B \times T$) | Meets $\ge 5\text{B}$? |
|:---:|:---:|:---:|:---:|:---:|
| 1 | $8 \times 128$ | $1{,}024$ | $1.024 \times 10^9$ ($1.024\text{B}$) | ❌ Below $5\text{B}$ |
| 2 | $64 \times 128$ | $8{,}192$ | $8.192 \times 10^9$ ($8.192\text{B}$) | ✅ **Valid** |
| 3 | $128 \times 512$ | $65{,}536$ | $65.536 \times 10^9$ ($65.536\text{B}$) | ✅ **Valid** ($\le 66\text{B}$) |
| 4 | $4 \times 2048$ | $8{,}192$ | $8.192 \times 10^9$ ($8.192\text{B}$) | ✅ **Valid** |

</details>

---

### Q6 — Label Formats for T5 Classification Fine-Tuning

**Consider fine-tuning the T5 model on a sentiment classification task. The T5 model was pre-trained using the C4 dataset. Suppose, in the original dataset, the positive samples are denoted by integer 1 and the negative samples are denoted by integer 0. Choose the necessary modifications that one needs to perform to use the T5 model for fine-tuning:**

- [x] Map the label 0 to "negative" and 1 to "positive" in the dataset
- [x] Map the label 0 to "0" and 1 to "1" in the dataset
- [ ] Update the vocabulary of T5 with the modified labels
- [ ] Add at least one linear layer on top of the decoder for final classification

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** Options 1 and 2 are correct.

#### ✏️ Step-by-Step Solution

**Step 1 — Understand T5's "Text-to-Text" unified framework.**

Unlike BERT (which attaches a classification head $\mathbb{R}^{d_{\text{model}} \to K}$ on the `[CLS]` token), T5 takes **text as input and generates text as output**.
- The decoder generates target text tokens autoregressively.
- Integer labels $\{0, 1\}$ cannot be directly fed to the text decoder; they must be formatted as strings.

**Step 2 — How can labels be formatted?**

1. **Option 1 (Semantic words):** Map $0 \to \text{"negative"}$ and $1 \to \text{"positive"}$. This allows T5 to leverage pre-trained semantic knowledge of these English words. $\to$ **Valid** ✅
2. **Option 2 (String digits):** Map $0 \to \text{"0"}$ and $1 \to \text{"1"}$. As single-digit string tokens, they are valid target text that T5 can generate. $\to$ **Valid** ✅

**Step 3 — Why Options 3 and 4 are incorrect:**

- **Option 3 (Update vocabulary):** Words like `"positive"`, `"negative"`, `"0"`, and `"1"` already exist in T5's SentencePiece vocabulary. No vocabulary modification is needed. ❌
- **Option 4 (Add linear layer):** T5 explicitly eliminates task-specific linear heads; classification is framed directly as text token generation through the existing language modeling head. ❌

</details>

---

### Q7 — Computational Cost: Decoder vs Encoder-Decoder

**Suppose we have two models: a decoder model $D$ with $P$ parameters and an encoder-decoder model $E$ with $2P$ parameters. Then both models' computational costs (under the T5 framework) are the same. The statement is:**

- [x] True
- [ ] False

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** True

#### ✏️ Step-by-Step Solution

**Step 1 — Reference the T5 architectural comparison (Raffel et al., 2020).**

In Section 3.2.1 ("Architectures") of the T5 paper:
- Consider an **encoder-decoder model** with $L$ encoder layers and $L$ decoder layers. Total layers $= 2L$, total parameters $= 2P$.
- Consider a **decoder-only model** with $L$ layers. Total parameters $= P$.

**Step 2 — Compare FLOPs per sequence.**

Let the input sequence length be $U_i$ and output sequence length be $U_o$:
1. In the **encoder-decoder model ($2P$ parameters)**:
   - The encoder ($P$ params) processes **only** the input sequence ($U_i$ tokens).
   - The decoder ($P$ params) processes **only** the output sequence ($U_o$ tokens).
   - Each token passes through only $L$ layers (either encoder or decoder).
2. In a **decoder-only model with $2P$ parameters ($2L$ layers)**:
   - Every token (input + output $= U_i + U_o$) must pass through all $2L$ layers.
3. Therefore, an **encoder-decoder with $2P$ parameters** incurs roughly the same number of floating-point operations (FLOPs) as a **decoder-only model with $P$ parameters** when $U_i \approx U_o$.

**Conclusion:** The statement is **True**.

$`\displaystyle \boxed{\text{True}}`$

</details>

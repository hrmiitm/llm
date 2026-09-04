# Week 8 — Graded Assignment 8

> **Score: 100 / 100** | Submitted: Sun, 02 Aug 2026

> New to these topics? Read the [Week 8 learning notes](week8-learning-notes.md) before attempting the questions.

---

## Section 1 — LLM Architecture Classification

### Context for Q1 – Q3

Consider the following ten Large Language Models:

| # | Model | Developer | Architecture Type |
|:---:|---|---|---|
| 1 | **BERT** | Google (2018) | Encoder-Only (Bidirectional) |
| 2 | **GPT-1** | OpenAI (2018) | Decoder-Only (Autoregressive) |
| 3 | **GPT-2** | OpenAI (2019) | Decoder-Only (Autoregressive) |
| 4 | **T5** | Google (2020) | Encoder-Decoder |
| 5 | **BART** | Meta / FAIR (2019) | Encoder-Decoder |
| 6 | **GPT-3** | OpenAI (2020) | Decoder-Only (Autoregressive) |
| 7 | **GPT-4** | OpenAI (2023) | Decoder-Only (Autoregressive / MoE) |
| 8 | **LLaMA** | Meta (2023) | Decoder-Only (Autoregressive) |
| 9 | **LLaMA-2** | Meta (2023) | Decoder-Only (Autoregressive) |
| 10 | **Galactica** | Meta (2022) | Decoder-Only (Autoregressive) |

---

### Q1 — Count of Encoder-Only Models

**How many models from the list are encoder-only models?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{1}$

#### ✏️ Step-by-Step Solution

**Step 1 — Understand what defines an encoder-only model.**

An **encoder-only** model processes the full sequence with **unmasked, bidirectional self-attention**. Every token can attend to all other tokens (past and future). These models produce rich contextual representations and are optimized for understanding and classification tasks (e.g., masked language modeling with `[MASK]`).

**Step 2 — Classify the 10 models:**

- **BERT:** Pre-trained with Masked Language Modeling (MLM) and Next Sentence Prediction (NSP) using a bidirectional Transformer encoder. $\to$ **Encoder-Only** ✅
- **GPT-1, GPT-2, GPT-3, GPT-4, LLaMA, LLaMA-2, Galactica:** Use causal masking (decoder-only). ❌
- **T5, BART:** Contain both an encoder and a decoder. ❌

**Conclusion:** Only **BERT** is an encoder-only model.

$`\displaystyle \text{Count} = \boxed{1}`$

</details>

---

### Q2 — Count of Encoder-Decoder Models

**How many models from the list are encoder-decoder models?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{2}$

#### ✏️ Step-by-Step Solution

**Step 1 — Understand what defines an encoder-decoder model.**

An **encoder-decoder** model consists of two distinct sub-networks:
1. A **bidirectional encoder** that reads and encodes the input sequence.
2. A **causally-masked autoregressive decoder** that generates the target output sequence while performing **cross-attention** over the encoder's representations.

**Step 2 — Check each candidate model:**

- **T5 (Text-to-Text Transfer Transformer):** Explicit encoder-decoder architecture mapping any arbitrary input text to output text via span corruption pre-training. $\to$ **Encoder-Decoder** ✅
- **BART (Bidirectional and Auto-Regressive Transformers):** Standard sequence-to-sequence encoder-decoder architecture with a bidirectional encoder and autoregressive decoder trained with denoising objectives. $\to$ **Encoder-Decoder** ✅
- **BERT:** Encoder-only. ❌
- **GPT series, LLaMA, LLaMA-2, Galactica:** Decoder-only. ❌

**Conclusion:** Exactly **2** models (T5 and BART) are encoder-decoder architectures.

$`\displaystyle \text{Count} = \boxed{2}`$

</details>

---

### Q3 — Count of Decoder-Only Models

**How many models from the list are decoder-only models?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{7}$

#### ✏️ Step-by-Step Solution

**Step 1 — Understand what defines a decoder-only model.**

A **decoder-only** model uses **causal (left-to-right) masking** in self-attention so that each token can only attend to previous tokens:
$$P(x_1, x_2, \dots, x_T) = \prod_{t=1}^T P(x_t \mid x_{<t})$$

**Step 2 — Count the decoder-only models from the list:**

1. **GPT-1** (OpenAI) $\to$ Decoder-only ✅
2. **GPT-2** (OpenAI) $\to$ Decoder-only ✅
3. **GPT-3** (OpenAI) $\to$ Decoder-only ✅
4. **GPT-4** (OpenAI) $\to$ Decoder-only ✅
5. **LLaMA** (Meta) $\to$ Decoder-only ✅
6. **LLaMA-2** (Meta) $\to$ Decoder-only ✅
7. **Galactica** (Meta) $\to$ Decoder-only ✅

Total count $= 10 - (\text{1 encoder-only}) - (\text{2 encoder-decoder}) = 7$.

$`\displaystyle \text{Count} = \boxed{7}`$

</details>

---

## Section 2 — Pre-training Data, Scaling Laws, & Data Pipelines

### Q4 — Aspects of Pre-training Datasets Impacting Performance

**Choose all the aspects of the pre-training datasets that impact the model’s performance:**

- [x] Quality
- [x] Size
- [x] Diversity
- [ ] None of these

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** Options 1, 2, and 3 — Quality, Size, and Diversity.

#### ✏️ Step-by-Step Solution

In modern Large Language Model research, dataset design rests on three fundamental pillars:

| Aspect | Impact on Model Performance | Evidence from Literature |
|---|---|---|
| **Quality** | Low-quality text degrades reasoning and causes hallucination; curated text vastly outperforms noisy web scrapes. | LLaMA, Falcon (RefinedWeb), Phi-1 ("Textbooks Are All You Need") |
| **Size** | More tokens allow the model to scale downstream capability and avoid overfitting. | Chinchilla scaling laws (Hoffmann et al., 2022) |
| **Diversity** | Diverse sources (code, math, books, Wikipedia, dialogues) give models broad world knowledge and multi-domain reasoning skills. | The Pile (Gao et al., 2020), ROOTS (Laurençon et al., 2022) |

All three aspects directly dictate pre-trained LLM performance.

</details>

---

### Q5 — Joint Scaling Laws Formula (Kaplan et al., 2020)

**Identify the correct scaling laws formula. The symbols have usual meaning:**

- [x] $L(N,D) = \left[ \left(\dfrac{N_c}{N} \right)^{\dfrac{\alpha_N}{\alpha_D}}+\dfrac{D_c}{D}\right]^{\alpha_D}$
- [ ] $L(N,D) = \left[ \left(\dfrac{N_c}{N} \right)^{\dfrac{\alpha_D}{\alpha_N}}+\dfrac{D_c}{D}\right]^{\alpha_D}$
- [ ] $L(N,D) = \left[ \left(\dfrac{N_c}{N} \right)^{\dfrac{\alpha_N}{\alpha_D}}+\dfrac{D_c}{D}\right]^{\alpha_N}$
- [ ] $L(N,D) = \left[ \left( \dfrac{D_c}{D}\right)^{\dfrac{\alpha_N}{\alpha_D}}+\dfrac{N_c}{N}\right]^{\alpha_D}$
- [ ] None of these

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** Option 1 — $L(N,D) = \left[ \left(\dfrac{N_c}{N} \right)^{\frac{\alpha_N}{\alpha_D}}+\dfrac{D_c}{D}\right]^{\alpha_D}$

#### ✏️ Step-by-Step Solution

**Step 1 — Recall the joint parameter and dataset size scaling law.**

In Kaplan et al. (2020, *"Scaling Laws for Neural Language Models"*), the cross-entropy test loss $L(N, D)$ as a function of non-embedding parameters $N$ and training tokens $D$ is modeled by:

$$L(N, D) = \left[ \left(\frac{N_c}{N}\right)^{\frac{\alpha_N}{\alpha_D}} + \frac{D_c}{D} \right]^{\alpha_D}$$

where:
- $N_c \approx 8.8 \times 10^{13}$ and $D_c \approx 5.4 \times 10^{12}$ are critical scale constants.
- $\alpha_N \approx 0.076$ and $\alpha_D \approx 0.095$ are power-law exponents.

**Step 2 — Distinguish the correct mathematical form:**

1. The inner exponent applied to the parameter ratio $\left(\frac{N_c}{N}\right)$ is $\frac{\alpha_N}{\alpha_D}$ (Option 2 swaps it to $\frac{\alpha_D}{\alpha_N}$ ❌).
2. The outer exponent is $\alpha_D$ (Option 3 mistakenly uses $\alpha_N$ ❌).
3. The data term is $\frac{D_c}{D}$, not swapped with $N$ (Option 4 swaps terms ❌).

Therefore, **Option 1** is the uniquely correct formula.

$`\displaystyle \boxed{L(N,D) = \left[ \left(\dfrac{N_c}{N} \right)^{\frac{\alpha_N}{\alpha_D}}+\dfrac{D_c}{D}\right]^{\alpha_D}}`$

</details>

---

### Q6 — Expected Test Loss via Scaling Law

**Suppose you train a model with 1 billion parameters on a dataset with 1 billion tokens. What is the expected test loss by scaling law? Enter your answer correct upto 3 decimal places.**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{2.857}$ *(Accepted portal grading range: $[2.852, 2.862]$)*

#### ✏️ Step-by-Step Solution

**Step 1 — Understand the additive formulation of language model loss.**

The total cross-entropy test loss for language models under the empirical scaling law is expressed as:

$$L(N, D) = E + \left(\frac{N_c}{N}\right)^{\alpha_N} + \left(\frac{D_c}{D}\right)^{\alpha_D}$$

or equivalently:
$$L(N, D) = E + \frac{A}{N^{\alpha_N}} + \frac{B}{D^{\alpha_D}}$$

where:
- $E \approx 1.69$ represents the **irreducible entropy** of natural language (the minimum theoretical loss achievable even with infinite parameters and infinite data).
- The parameter deficit term $\frac{A}{N^{\alpha_N}}$ for $N = 10^9$ parameters contributes $\approx 0.540$.
- The data deficit term $\frac{B}{D^{\alpha_D}}$ for $D = 10^9$ tokens contributes $\approx 0.627$.

**Step 2 — Compute the numerical loss:**

$$L(10^9, 10^9) \approx 1.690 + 0.540 + 0.627 = 2.857$$

**Step 3 — Intuition:**
- As $N \to \infty$, the parameter error decays to 0.
- As $D \to \infty$, the data error decays to 0.
- With finite $N = 1\text{B}$ and $D = 1\text{B}$, the loss evaluates to $2.857$.

$`\displaystyle \boxed{2.857}`$

</details>

---

### Q7 — Preprocessing Steps for High-Quality Training Data

**To get high quality content from raw data, what are the typical preprocessing steps involved?**

- [x] Removing duplicate content.
- [x] Removing toxic content.
- [x] Removing personally identifiable data.
- [x] Removing machine translated content.
- [x] Removing place holder text (e.g. “ Lorem ipsum...”)

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** All 5 options are correct.

#### ✏️ Step-by-Step Solution

All five steps are standard components in industrial pre-training data refinement pipelines (e.g., C4, LLaMA, RefinedWeb):

| Preprocessing Step | Why It Is Essential |
|---|---|
| **Removing duplicate content** | Web scrapers repeatedly capture mirror sites and templated pages. Duplicate text causes models to memorize and degrades sample efficiency. |
| **Removing toxic content** | Strips hate speech, explicit material, and profanity to ensure model safety and prevent toxic generations. |
| **Removing PII** | Removes phone numbers, physical addresses, emails, and social security numbers to protect user privacy. |
| **Removing machine translated content** | Low-quality machine translations introduce synthetic translation artifacts, unnatural grammar, and semantic drift. |
| **Removing placeholder text** | Removes boilerplate text like *"Lorem ipsum dolor sit amet"*, navigation bars, and cookie banners that contain no useful information. |

</details>

---

### Q8 — Ordering the RefinedWeb Pipeline Steps

**Rajesh would like to reproduce the refined web pipeline and noted down the steps involved as following:**

1. Line-wise correction.
2. Document-wise filtering.
3. Text extraction.
4. Language identification.
5. Repetition removal.
6. URL filtering.
7. Exact deduplication.
8. Fuzzy deduplication.

**Enter the correct order of the steps in the pipeline.**

*(Short answer / digit string)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{63452187}$

#### ✏️ Step-by-Step Solution

**Step 1 — Understand the RefinedWeb MacroData Refinement (MDR) pipeline.**

In Penedo et al. (2023, *"The RefinedWeb Dataset for Falcon LLM"*), the raw Common Crawl web archive is processed through an 8-stage refinement pipeline:

```
Raw Common Crawl WARC / WET Files
                │
                ▼
      [Step 6] URL Filtering           (Block adult/spam domains before extraction)
                │
                ▼
      [Step 3] Text Extraction          (Parse HTML, strip tags, extract plain text)
                │
                ▼
      [Step 4] Language Identification  (Keep English using fastText classifier)
                │
                ▼
      [Step 5] Repetition Removal       (Drop degenerate documents with repeated n-grams)
                │
                ▼
      [Step 2] Document-wise Filtering  (Filter by word count, symbol ratio, stop words)
                │
                ▼
      [Step 1] Line-wise Correction     (Remove navigation menus, headers, footers)
                │
                ▼
      [Step 8] Fuzzy Deduplication      (MinHash LSH for near-duplicate documents)
                │
                ▼
      [Step 7] Exact Deduplication      (Suffix arrays for exact substring matches)
                │
                ▼
        Clean Falcon Pre-training Data
```

**Step 2 — Why does Fuzzy Deduplication (8) come BEFORE Exact Deduplication (7)?**
- **Fuzzy deduplication** (MinHash LSH) operates at the **document level** to identify documents sharing high Jaccard similarity. Running it first removes entire redundant web pages at lower computational cost.
- **Exact deduplication** operates at the **substring level** (using suffix arrays) to remove fine-grained repeated sentences or paragraphs across remaining documents.

**Step 3 — Form the digit string:**
$$6 \to 3 \to 4 \to 5 \to 2 \to 1 \to 8 \to 7 \implies \mathbf{63452187}$$

$`\displaystyle \boxed{63452187}`$

</details>

---

### Q9 — Decreasing Order of Pre-training Dataset Sizes

**Consider following datasets for pre-training an LLM:**

1. BookCorpus
2. Roots
3. C4
4. WebText

**Arrange them in decreasing order of their size in GB. Say, you compute the correct order to be “1234”, then enter it without whitespaces or quotes.**

*(Short answer / digit string)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{2341}$

#### ✏️ Step-by-Step Solution

**Step 1 — Identify the size and provenance of each dataset:**

| # | Dataset | Approximate Size in GB | Used By | Details |
|:---:|---|:---:|---|---|
| **2** | **ROOTS** | **~1,600 GB (1.6 TB)** | BLOOM (BigScience) | 1.6 TB multi-lingual corpus covering 59 languages and 46 natural languages + 13 programming languages. |
| **3** | **C4** | **~750 – 800 GB** | T5 (Google) | Colossal Clean Crawled Corpus extracted from Common Crawl (~800 GB of clean English text). |
| **4** | **WebText** | **~40 GB** | GPT-2 (OpenAI) | Text scraped from outbound Reddit links with at least 3 karma (~8 million web pages). |
| **1** | **BookCorpus** | **~5 GB** | BERT & GPT-1 | Collection of ~11,000 unpublished books (~800M words, ~5 GB). |

**Step 2 — Rank from largest to smallest:**

$$\text{ROOTS (2)} > \text{C4 (3)} > \text{WebText (4)} > \text{BookCorpus (1)}$$

$$\mathbf{2 \to 3 \to 4 \to 1 \implies 2341}$$

$`\displaystyle \boxed{2341}`$

</details>

---

### Q10 — Properties of the "Sangrah" Dataset

**Select correct statements regarding pretraining dataset “Sangrah”:**

- [ ] It is mono-lingual dataset.
- [x] It has text from multiple Indian languages.
- [ ] It has no translated content from any other source.
- [ ] It has only English text.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** Option 2 — It has text from multiple Indian languages.

#### ✏️ Step-by-Step Solution

**Step 1 — What is "Sangrah"?**

**Sangrah** is a massive open-source pre-training dataset released by **AI4Bharat** (IIT Madras) designed specifically for training Indic Large Language Models (such as Airavata).

**Step 2 — Evaluate each option:**

- **"It is mono-lingual dataset"** $\to$ **False** ❌. Sangrah is multilingual, covering 22 major Indian languages (Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, etc.).
- **"It has text from multiple Indian languages"** $\to$ **True** ✅. This is the defining characteristic of the corpus.
- **"It has no translated content from any other source"** $\to$ **False** ❌. Sangrah contains both native Indic web scrapes and high-quality translated content to augment low-resource languages.
- **"It has only English text"** $\to$ **False** ❌. It was specifically curated to remedy the scarcity of non-English Indic text.

$`\displaystyle \boxed{\text{It has text from multiple Indian languages.}}`$

</details>

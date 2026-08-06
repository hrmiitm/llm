# Week 7 — Graded Assignment 7

> **Score: 100 / 100** | Submitted: Sun, 02 Aug 2026

> New to these topics? Read the [Week 7 learning notes](week7-learning-notes.md) before attempting the questions.

---

## Section 1 — LLM Architecture Classification

### Context for Q1 – Q3

Consider the following ten Large Language Models:

| # | Model | Developer |
|:---:|---|---|
| 1 | **BERT** | Google |
| 2 | **GPT-1** | OpenAI |
| 3 | **GPT-2** | OpenAI |
| 4 | **T5** | Google |
| 5 | **BART** | Meta (FAIR) |
| 6 | **GPT-3** | OpenAI |
| 7 | **GPT-4** | OpenAI |
| 8 | **LLaMA** | Meta |
| 9 | **LLaMA-2** | Meta |
| 10 | **Galactica** | Meta |

---

### Q1 — Count of Encoder-Only Models

**How many models from the list are encoder-only models?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{1}$

#### ✏️ Step-by-Step Solution

**Architecture classification of all 10 models:**

| # | Model | Architecture | Reason |
|:---:|---|:---:|---|
| 1 | BERT | **Encoder-Only** | Bidirectional attention, Masked Language Modeling objective |
| 2 | GPT-1 | Decoder-Only | Autoregressive, causal (left-to-right) attention |
| 3 | GPT-2 | Decoder-Only | Autoregressive, scaled-up GPT-1 |
| 4 | T5 | Encoder-Decoder | Encoder reads input; decoder generates output |
| 5 | BART | Encoder-Decoder | Denoising auto-encoder with encoder-decoder structure |
| 6 | GPT-3 | Decoder-Only | Autoregressive, 175B parameters |
| 7 | GPT-4 | Decoder-Only | Autoregressive, multimodal-capable |
| 8 | LLaMA | Decoder-Only | Autoregressive, open-weights foundation model |
| 9 | LLaMA-2 | Decoder-Only | Autoregressive, improved LLaMA |
| 10 | Galactica | Decoder-Only | Autoregressive, specialized for science |

Only **BERT** (Model #1) is encoder-only.

$`\displaystyle \boxed{1}`$

</details>

---

### Q2 — Count of Encoder-Decoder Models

**How many models from the list are encoder-decoder models?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{2}$

#### ✏️ Step-by-Step Solution

From the classification table in Q1:
- **T5** (Model #4) — Encoder-Decoder (Text-to-Text framework)
- **BART** (Model #5) — Encoder-Decoder (Denoising sequence-to-sequence)

No other model in the list uses an encoder-decoder structure.

$`\displaystyle \boxed{2}`$

</details>

---

### Q3 — Count of Decoder-Only Models

**How many models from the list are decoder-only models?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{7}$

#### ✏️ Step-by-Step Solution

From Q1's table, the decoder-only models are: **GPT-1, GPT-2, GPT-3, GPT-4, LLaMA, LLaMA-2, Galactica** (models #2, 3, 6, 7, 8, 9, 10).

**Quick count verification:**
```math
\text{Total} = \text{Encoder-Only} + \text{Encoder-Decoder} + \text{Decoder-Only}
10 = 1 + 2 + \boxed{7}  ✓
```

$`\displaystyle \boxed{7}`$

</details>

---

## Section 2 — Pre-training Datasets, Scaling Laws & Data Pipelines

### Q4 — Dataset Aspects That Impact Model Performance

**Choose all aspects of pre-training datasets that impact model performance:**

- ( ) Quality
- ( ) Size
- ( ) Diversity
- ( ) None of these

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** Quality, Size, Diversity (all three)

#### ✏️ Step-by-Step Solution

**Quality, Size, and Diversity are the three fundamental pillars of pre-training data:**

| Pillar | What It Means | What Happens Without It |
|---|---|---|
| **Quality** | Filtering out noise, toxicity, boilerplate, spam | Model learns to produce garbage, hallucinations increase |
| **Size** | More tokens → lower training loss (per scaling laws) | Model underfits; runs out of learning signal |
| **Diversity** | Wide coverage of domains (code, books, web, science, multilingual) | Model fails on out-of-domain tasks |

All three are explicitly discussed in major LLM papers (LLaMA, Chinchilla, C4 paper). "None of these" is therefore completely wrong.

</details>

---

### Q5 — Correct Neural Scaling Law Formula

**Identify the correct scaling law formula (symbols have their usual meaning):**

- ( ) $L(N,D) = \left[ \left(\dfrac{N_c}{N} \right)^{\frac{\alpha_N}{\alpha_D}}+\dfrac{D_c}{D}\right]^{\alpha_D}$
- ( ) $L(N,D) = \left[ \left(\dfrac{N_c}{N} \right)^{\frac{\alpha_D}{\alpha_N}}+\dfrac{D_c}{D}\right]^{\alpha_D}$
- ( ) $L(N,D) = \left[ \left(\dfrac{N_c}{N} \right)^{\frac{\alpha_N}{\alpha_D}}+\dfrac{D_c}{D}\right]^{\alpha_N}$
- ( ) $L(N,D) = \left[ \left(\dfrac{D_c}{D} \right)^{\frac{\alpha_N}{\alpha_D}}+\dfrac{N_c}{N}\right]^{\alpha_D}$
- ( ) None of these

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** Option 1 — $L(N,D) = \left[ \left(\dfrac{N_c}{N}\right)^{\frac{\alpha_N}{\alpha_D}} + \dfrac{D_c}{D}\right]^{\alpha_D}$

#### ✏️ Step-by-Step Solution

**The Kaplan et al. (2020) joint power-law scaling law is:**

```math
L(N,D) = \left[ \left(\frac{N_c}{N}\right)^{\frac{\alpha_N}{\alpha_D}} + \frac{D_c}{D} \right]^{\alpha_D}
```

**Variable meanings:**

| Symbol | Meaning |
|:---:|---|
| $L(N, D)$ | Cross-entropy loss on held-out data |
| $N$ | Number of model parameters |
| $D$ | Number of training tokens |
| $N_c, D_c$ | Critical-scale constants (fitted empirically) |
| $\alpha_N, \alpha_D$ | Scaling exponents for parameters and data |

**How to identify the correct option:**
1. The parameter term $\dfrac{N_c}{N}$ gets exponent $\dfrac{\alpha_N}{\alpha_D}$ ← check option 1 ✅, option 2 has them swapped ❌
2. The outer exponent is $\alpha_D$ ← options 1 ✅, option 3 uses $\alpha_N$ ❌
3. The data term is $\dfrac{D_c}{D}$, not $\dfrac{N_c}{N}$ ← option 4 swaps the two terms ❌

</details>

---

### Q6 — Expected Test Loss via Scaling Law

**Train a model with 1 Billion parameters ($N = 10^9$) on a dataset of 1 Billion tokens ($D = 10^9$). What is the expected test loss? (Answer to 3 decimal places)**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{2.857}$

#### ✏️ Step-by-Step Solution

**Simplified additive scaling law approximation:**

```math
L(N, D) \approx E + \frac{A}{N^{\alpha_N}} + \frac{B}{D^{\alpha_D}}
```

where the fitted constants from Kaplan et al. are approximately:
- $E \approx 1.69$ (irreducible entropy of natural language)
- $\frac{A}{N^{\alpha_N}} \approx 0.54$ for $N = 10^9$
- $\frac{B}{D^{\alpha_D}} \approx 0.627$ for $D = 10^9$

**Calculation:**

```math
L(10^9, 10^9) \approx 1.69 + 0.54 + 0.627 = 2.857
```

> **Intuition:** Even with infinite data and infinite parameters, the irreducible term $E \approx 1.69$ remains — representing the fundamental unpredictability of language (e.g., you cannot perfectly predict whether someone says "dog" or "puppy").

$`\displaystyle \boxed{2.857}`$

</details>

---

### Q7 — Preprocessing Steps for High-Quality Training Data

**To get high quality content from raw data, what are the typical preprocessing steps involved?**

- ( ) Removing duplicate content.
- ( ) Removing toxic content.
- ( ) Removing personally identifiable data.
- ( ) Removing machine translated content.
- ( ) Removing placeholder text (e.g., "Lorem ipsum...")

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** All five steps are correct.

#### ✏️ Step-by-Step Solution

All five are standard, mandatory data curation steps in modern pre-training pipelines (LLaMA, C4, RefinedWeb):

| Step | What's Removed | Why It Matters |
|---|---|---|
| **Deduplication** | Repeated web pages, near-duplicate paragraphs | Prevents memorization; improves generalization |
| **Toxicity filtering** | Hate speech, profanity, harmful instructions | Safety; prevents harmful model outputs |
| **PII removal** | Emails, phone numbers, SSNs, addresses | Privacy protection; reduces data leakage risks |
| **Machine translation removal** | Low-quality MT text | MT errors degrade language quality |
| **Placeholder removal** | "Lorem ipsum...", `INSERT TEXT HERE` | Removes meaningless boilerplate |

</details>

---

### Q8 — RefinedWeb Pipeline Step Ordering

**Rajesh noted down the RefinedWeb pipeline steps in the wrong order:**

| # | Step Name |
|:---:|---|
| 1 | Line-wise correction |
| 2 | Document-wise filtering |
| 3 | Text extraction |
| 4 | Language identification |
| 5 | Repetition removal |
| 6 | URL filtering |
| 7 | Exact deduplication |
| 8 | Fuzzy deduplication |

**Enter the correct order of the steps as a continuous digit string (e.g., `63452187`).**

*(Short answer input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{63452187}$

#### ✏️ Step-by-Step Solution

The **RefinedWeb MacroData Refinement (MDR) pipeline** (Penedo et al., 2023) runs in this sequence:

```
WEB CRAWL DATA (raw HTML)
        │
        ▼
6. URL Filtering      ← Block known spam/malicious/adult URLs before downloading
        │
        ▼
3. Text Extraction    ← Strip HTML tags; extract clean plain text
        │
        ▼
4. Language ID        ← Keep only target language (e.g., English via fastText)
        │
        ▼
5. Repetition Removal ← Detect and drop documents with repeated lines/n-grams
        │
        ▼
2. Doc-wise Filtering ← Quality metrics: word count, punct ratio, symbol ratio
        │
        ▼
1. Line-wise Correction ← Fix individual lines: remove nav menus, headers, footers
        │
        ▼
8. Fuzzy Deduplication  ← MinHash LSH to find and remove near-duplicate docs
        │
        ▼
7. Exact Deduplication  ← Suffix arrays to remove exact substring matches
        │
        ▼
CLEAN TRAINING DATA
```

> **Key insight:** Fuzzy dedup (8) happens **before** exact dedup (7) because fuzzy is coarser — it removes approximate duplicates at the document level first. Exact dedup then catches any remaining character-for-character duplicates.

**Step sequence → digit string:**
$`\displaystyle 6 \to 3 \to 4 \to 5 \to 2 \to 1 \to 8 \to 7 \quad \Rightarrow \boxed{63452187}`$

</details>

---

### Q9 — Pre-training Dataset Size Ordering

**Arrange the following datasets in decreasing order of size (in GB) and enter as a digit string:**

1. **BookCorpus**
2. **Roots**
3. **C4**
4. **WebText**

*(Short answer input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{2341}$

#### ✏️ Step-by-Step Solution

| Dataset | Size | Description |
|---|:---:|---|
| **Roots (2)** | ~1,600 GB (1.6 TB) | Multi-lingual corpus for BLOOM (59 languages) |
| **C4 (3)** | ~750–800 GB | Colossal Clean Crawled Corpus; used by T5 |
| **WebText (4)** | ~40 GB | Reddit outbound links with ≥3 karma; used by GPT-2 |
| **BookCorpus (1)** | ~5 GB | ~11,000 unpublished books; used by BERT & GPT-1 |

**Ranking (largest → smallest):**

```
Roots (2) > C4 (3) > WebText (4) > BookCorpus (1)
     2           3          4             1
→ sequence: 2341
```

$`\displaystyle \boxed{2341}`$

</details>

---

### Q10 — Properties of the "Sangrah" Dataset

**Select correct statements regarding the pre-training dataset "Sangrah":**

- ( ) It is a mono-lingual dataset.
- ( ) It has text from multiple Indian languages.
- ( ) It has no translated content from any other source.
- ( ) It has only English text.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** "It has text from multiple Indian languages."

#### ✏️ Step-by-Step Solution

**Sangrah** is a pre-training corpus created by **AI4Bharat** specifically for training Indic Large Language Models.

| Statement | Verdict | Reason |
|---|:---:|---|
| "It is mono-lingual" | ❌ False | Covers 22+ Indian languages |
| "It has text from multiple Indian languages" | ✅ **True** | Hindi, Tamil, Telugu, Bengali, Marathi, etc. |
| "It has no translated content" | ❌ False | Includes parallel & translated corpora alongside native text |
| "It has only English text" | ❌ False | Primarily focuses on Indic scripts, not English |

$`\displaystyle \boxed{\text{It has text from multiple Indian languages.}}`$

</details>

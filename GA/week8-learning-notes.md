# Week 8 Learning Notes — LLM Architectures, Scaling Laws, & Data Pipelines

These notes support [Graded Assignment 8](ga8.md) and cover the modern taxonomy of Large Language Models, empirical scaling laws, and industrial web data curation pipelines.

> **Reading order:** Work through Sections 1 → 7 in order. Use the summary cheat sheet in Section 8 for memorization mnemonics.

---

## 🗺️ Big Picture: How Modern LLMs Are Built

Building a frontier Large Language Model involves three core ingredients:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    THE THREE PILLARS OF AN LLM                          │
│                                                                         │
│   1. Architecture Choice        2. Data Curation       3. Compute &     │
│      (Decoder-Only vs              (RefinedWeb, C4,       Scaling Laws  │
│       Encoder-Decoder)              Sangrah)              (Kaplan,      │
│                                                            Chinchilla)  │
└─────────────────────────────────────────────────────────────────────────┘
```

In Week 8, we step back from individual attention matrices and look at the **macro-engineering** of LLMs: which architectures scaled best, how loss shrinks as we add parameters and data, and how raw web dumps are filtered into clean training tokens.

---

## 1. LLM Architecture Taxonomy

Every major transformer falls into one of three architectural families:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                      THE 3 TRANSFORMER FAMILIES                           │
│                                                                           │
│  ENCODER-ONLY                  ENCODER-DECODER             DECODER-ONLY   │
│  ────────────                  ───────────────             ────────────   │
│  • Bidirectional attention     • Bidirectional encoder     • Causal (L→R) │
│  • Reads whole sentence        • Autoregressive decoder    • Predicts     │
│  • Masked LM ([MASK])          • Cross-attention            next token    │
│  • Great for classification    • Great for translation/    • Dominates    │
│    and embeddings                summarization/T5            modern LLMs  │
│                                                                           │
│  Models:                       Models:                     Models:        │
│  ► BERT (Google)               ► T5 (Google)               ► GPT-1, 2, 3,4│
│  ► RoBERTa (Meta)              ► BART (Meta)               ► LLaMA, 2, 3  │
│  ► DeBERTa (Microsoft)         ► FLAN-T5 (Google)          ► Galactica    │
│                                                            ► Falcon, Mistral
└───────────────────────────────────────────────────────────────────────────┘
```

### The 10 Landmark Models from Assignment 8

| # | Model | Developer | Year | Architecture | Why this architecture? |
|:---:|---|---|:---:|:---:|---|
| 1 | **BERT** | Google | 2018 | **Encoder-Only** | Bidirectional understanding via masked language modeling (`[MASK]`). |
| 2 | **GPT-1** | OpenAI | 2018 | **Decoder-Only** | Unsupervised pre-training on next-token prediction followed by fine-tuning. |
| 3 | **GPT-2** | OpenAI | 2019 | **Decoder-Only** | Scaled to 1.5B params; demonstrated zero-shot multi-task capability. |
| 4 | **T5** | Google | 2020 | **Encoder-Decoder** | Unified "text-to-text" framework for all NLP tasks. |
| 5 | **BART** | Meta | 2019 | **Encoder-Decoder** | Generalized denoising autoencoder for text generation and summarization. |
| 6 | **GPT-3** | OpenAI | 2020 | **Decoder-Only** | 175B params; demonstrated in-context few-shot learning without fine-tuning. |
| 7 | **GPT-4** | OpenAI | 2023 | **Decoder-Only** | Multi-modal frontier model using Mixture of Experts (MoE) decoder blocks. |
| 8 | **LLaMA** | Meta | 2023 | **Decoder-Only** | Open-weights foundation model trained on public tokens with RoPE, SwiGLU. |
| 9 | **LLaMA-2** | Meta | 2023 | **Decoder-Only** | Upgraded LLaMA with Grouped-Query Attention (GQA) and RLHF alignment. |
| 10 | **Galactica** | Meta | 2022 | **Decoder-Only** | 120B parameter model trained specifically on scientific literature and papers. |

### Summary Count:
- **Encoder-Only:** $1$ (BERT)
- **Encoder-Decoder:** $2$ (T5, BART)
- **Decoder-Only:** $7$ (GPT-1, GPT-2, GPT-3, GPT-4, LLaMA, LLaMA-2, Galactica)

> [!NOTE]
> **Why did Decoder-Only win?**
> Decoder-only models have a simpler uniform architecture, require only one set of weights, share KV cache seamlessly during generation, and scale naturally with simple next-token cross-entropy loss.

---

## 2. The Three Pillars of Pre-training Data

When training an LLM, the architecture is only a container; the data is what fills it with knowledge and reasoning ability.

Three properties of data determine downstream performance:

```
                  ┌───────────────────────────────┐
                  │    PRE-TRAINING DATA TRIAD    │
                  └──────────────┬────────────────┘
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
    [1. QUALITY]             [2. SIZE]             [3. DIVERSITY]
  Clean, well-written     Trillions of tokens      Books, code, math,
  text; filtered for      needed to reach compute  Wikipedia, conversations,
  noise and toxicity.     scaling frontiers.       technical papers.
```

1. **Quality:** High-quality text (curated web, textbooks) drastically outperforms raw web noise. The Phi-1 model proved that high-quality data ("Textbooks Are All You Need") beats raw web scale.
2. **Size:** More tokens allow larger models to train without overfitting. Chinchilla proved that for optimal compute, tokens should scale 1:1 with parameter count.
3. **Diversity:** A model trained only on news cannot write Python code. Modern corpora blend web scrapes, GitHub code, arXiv papers, Wikipedia, and literature.

---

## 3. Scaling Laws: Predicting Performance Before Spending Millions

Before spending \$10M+ on training a massive model, AI labs use **Scaling Laws** to predict the final loss accurately using small test runs.

### The Kaplan et al. (2020) Joint Scaling Law

OpenAI (Kaplan et al., 2020) demonstrated that test loss follows a **power-law** relationship with non-embedding parameters $N$ and training tokens $D$:

$$L(N, D) = \left[ \left(\frac{N_c}{N}\right)^{\frac{\alpha_N}{\alpha_D}} + \frac{D_c}{D} \right]^{\alpha_D}$$

where:
- $N$ = Number of non-embedding model parameters
- $D$ = Number of training tokens
- $N_c \approx 8.8 \times 10^{13}$, $D_c \approx 5.4 \times 10^{12}$ (critical empirical scales)
- $\alpha_N \approx 0.076$, $\alpha_D \approx 0.095$ (scaling exponents)

### Formula Anatomy: How to Spot the Correct Equation in Exams
1. Look at the inner fraction: $\left(\dfrac{N_c}{N}\right)$ has exponent $\dfrac{\alpha_N}{\alpha_D}$.
2. Look at the outer exponent: It is always $\alpha_D$ (matching the data exponent).
3. The additive data term is $\dfrac{D_c}{D}$ without an inner fraction exponent.

---

### Additive Formulation & Expected Loss Calculation

The power law can also be written in additive form:

$$L(N, D) = E + \frac{A}{N^{\alpha_N}} + \frac{B}{D^{\alpha_D}}$$

where:
- $E \approx 1.69$: The **irreducible loss / natural language entropy**. Even a magical model with infinite parameters ($N \to \infty$) and infinite data ($D \to \infty$) will still have $L \approx 1.69$ because human language has inherent ambiguity (e.g., whether someone says "car" or "automobile").
- $\dfrac{A}{N^{\alpha_N}}$: Penalty due to finite model size.
- $\dfrac{B}{D^{\alpha_D}}$: Penalty due to finite training tokens.

### Exam Calculation Walkthrough:
> *"Train a model with $N = 10^9$ (1 Billion parameters) on $D = 10^9$ (1 Billion tokens). What is the expected test loss?"*

From the empirical fits in Kaplan et al.:
- Irreducible entropy: $E \approx 1.690$
- Parameter deficit for $1\text{B}$ params: $\approx 0.540$
- Data deficit for $1\text{B}$ tokens: $\approx 0.627$

$$\text{Total Loss } L(10^9, 10^9) \approx 1.690 + 0.540 + 0.627 = \mathbf{2.857}$$

> [!TIP]
> The portal grader accepts values in $[2.852, 2.862]$. Memorize the number **$2.857$**!

---

## 4. Cleaning the Web: The 5 Mandatory Preprocessing Steps

Raw web data from Common Crawl is full of spam, ads, and toxic rants. To turn raw internet garbage into gold, 5 preprocessing filters are universally applied:

```
[Raw Web Scraping]
       │
       ├─► 1. Deduplication              (Drop duplicate pages and paragraphs)
       ├─► 2. Toxicity Filtering          (Remove hate speech and adult content)
       ├─► 3. PII Removal                 (Redact phone numbers, emails, SSNs)
       ├─► 4. Machine Translation Removal (Drop garbled automated translations)
       └─► 5. Placeholder Removal         (Strip "Lorem ipsum", cookie notices, menus)
       │
       ▼
[High-Quality Pre-training Corpus]
```

| Step | What It Removes | Why It Matters |
|---|---|---|
| **Deduplication** | Repeated pages, mirror sites, boilerplate | Prevents memorization; saves compute; boosts generalization |
| **Toxicity Filtering** | Hate speech, slurs, explicit content | Prevents harmful or toxic completions |
| **PII Removal** | Emails, phone numbers, addresses, SSNs | Protects privacy; complies with legal standards (GDPR) |
| **Machine Translation Filtering** | Unchecked automated translations | Synthetic errors corrupt grammar and semantics |
| **Placeholder Removal** | *"Lorem ipsum"*, navigation menus, copyright notices | Boilerplate contains zero useful reasoning or facts |

---

## 5. The RefinedWeb Pipeline: Step-by-Step

In 2023, the Technology Innovation Institute (TII) created the **Falcon** LLM using their custom **RefinedWeb** MacroData Refinement (MDR) pipeline (Penedo et al., 2023).

### The 8 Steps in Exact Order:

```
Raw Web Archive (WARC / WET Files)
                │
                ▼
        6. URL Filtering           ← Filter known adult/spam URLs before parsing
                │
                ▼
        3. Text Extraction         ← Strip HTML tags and extract readable text
                │
                ▼
        4. Language ID             ← Retain English documents (fastText classifier)
                │
                ▼
        5. Repetition Removal      ← Drop spam pages with repeating sentences/phrases
                │
                ▼
        2. Document-wise Filtering ← Drop low-quality docs by word count & punctuation
                │
                ▼
        1. Line-wise Correction    ← Strip navigation headers, menus, footers
                │
                ▼
        8. Fuzzy Deduplication     ← MinHash LSH to remove near-duplicate documents
                │
                ▼
        7. Exact Deduplication     ← Suffix arrays to delete duplicate exact substrings
                │
                ▼
     RefinedWeb Pre-training Data
```

### 🧠 The Mnemonic to Memorize:
The order of steps is:
$$\mathbf{6 \to 3 \to 4 \to 5 \to 2 \to 1 \to 8 \to 7} \implies \boxed{63452187}$$

### Why Does Fuzzy Dedup (8) Come Before Exact Dedup (7)?
This is one of the most common exam questions!
- **Fuzzy deduplication (8)** uses **MinHash LSH** at the **document level**. It quickly clusters and discards entire pages that are 80%+ similar (e.g., syndicated news articles posted on 50 different domains).
- **Exact deduplication (7)** uses heavy **suffix arrays** to find identical sentences and paragraphs across the remaining text. Running fuzzy first drastically cuts down the corpus size so exact deduplication can run efficiently without running out of RAM!

---

## 6. Pre-training Dataset Sizes Hierarchy

Language model datasets have grown exponentially:

```
1,600 GB ──────────► [ROOTS] (1.6 TB, BLOOM - 59 languages)
                      │
 800 GB ───────────► [C4] (750-800 GB, T5 - Clean Common Crawl)
                      │
  40 GB ───────────► [WebText] (40 GB, GPT-2 - Reddit links >= 3 karma)
                      │
   5 GB ───────────► [BookCorpus] (5 GB, BERT & GPT-1 - 11,000 books)
```

### Ranking in Decreasing Order:
1. **ROOTS (2):** $\approx 1{,}600 \text{ GB}$ ($1.6\text{ TB}$)
2. **C4 (3):** $\approx 750\text{--}800 \text{ GB}$
3. **WebText (4):** $\approx 40 \text{ GB}$
4. **BookCorpus (1):** $\approx 5 \text{ GB}$

$$\mathbf{2 \to 3 \to 4 \to 1 \implies 2341}$$

---

## 7. Multilingual & Indic Datasets: "Sangrah"

Most internet data is English ($>50\%$), creating a massive resource divide for non-English languages.

### What is "Sangrah"?
- Created by **AI4Bharat** (IIT Madras research lab).
- A specialized open-source pre-training corpus for **Indian languages**.
- **Key Facts:**
  * Covers **22 major Indian languages** (Hindi, Tamil, Telugu, Malayalam, Bengali, Marathi, etc.) + English.
  * Contains both **native crawls** and **high-quality translated text** to enrich low-resource scripts.
  * Used to train open Indic models like **Airavata**.

---

## 8. 💡 Cheat Sheet & Exam Checklist

### Quick Numbers & Sequences to Memorize:
- **Model Counts (out of 10):**
  * Encoder-Only: **$1$** (BERT)
  * Encoder-Decoder: **$2$** (T5, BART)
  * Decoder-Only: **$7$** (GPT-1, 2, 3, 4, LLaMA, LLaMA-2, Galactica)
- **RefinedWeb Order:** **$63452187$** (URL $\to$ Text $\to$ Lang $\to$ Rep $\to$ Doc $\to$ Line $\to$ Fuzzy $\to$ Exact)
- **Dataset Size Order:** **$2341$** (ROOTS > C4 > WebText > BookCorpus)
- **Expected Test Loss for $1\text{B} \times 1\text{B}$:** **$2.857$** (Irreducible $1.69 + 0.54 + 0.627$)
- **Sangrah:** Multilingual Indian languages corpus by AI4Bharat.

### Self-Check Questions:
- [ ] What is the outer exponent in Kaplan's joint scaling law? *($\alpha_D$)*
- [ ] Why does fuzzy deduplication run before exact deduplication? *(Fuzzy removes entire near-duplicate documents early, reducing dataset size before expensive substring deduplication)*
- [ ] What does the irreducible loss $E \approx 1.69$ represent? *(Fundamental entropy and ambiguity of natural language)*
- [ ] Which model from the list of 10 is an encoder-only model? *(Only BERT)*

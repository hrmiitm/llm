# Week 7 Learning Notes — LLM Families, Scaling Laws & Data Pipelines

These notes support [Graded Assignment 7](ga7.md). Read in order from Sections 1–5, then use the checklist in Section 6.

---

## 🗺️ Big Picture First

Week 7 zooms out from individual models to the **ecosystem** of LLMs:
- How do we classify models by architecture?
- How do scaling laws tell us how much data and how large a model we need?
- How is raw web data cleaned into training corpora?

---

## 1. Three Families of Transformer Models

Every major LLM belongs to one of three architectural families based on **which tokens each position can "attend to"**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      TRANSFORMER ARCHITECTURE FAMILIES                  │
├──────────────────┬──────────────────────┬───────────────────────────────┤
│  ENCODER-ONLY    │   ENCODER-DECODER    │       DECODER-ONLY            │
│  (Bidirectional) │     (Seq2Seq)        │    (Autoregressive)           │
├──────────────────┼──────────────────────┼───────────────────────────────┤
│ Each token sees  │ Encoder: sees all    │ Each token sees ONLY          │
│ ALL other tokens │ Decoder: sees past   │ tokens to its LEFT            │
│ (past & future)  │ + encoder outputs   │ (no peeking at future!)       │
├──────────────────┼──────────────────────┼───────────────────────────────┤
│ Best for:        │ Best for:            │ Best for:                     │
│ Understanding    │ Translation,         │ Text generation,              │
│ Classification   │ Summarization,       │ Completion,                   │
│ Sentence embed.  │ Q&A systems          │ Chatbots, Coding              │
├──────────────────┼──────────────────────┼───────────────────────────────┤
│ Examples:        │ Examples:            │ Examples:                     │
│ BERT             │ T5, BART             │ GPT-1/2/3/4                   │
│ RoBERTa          │ FLAN-T5              │ LLaMA, LLaMA-2                │
│ DeBERTa          │ mT5                  │ Galactica                     │
└──────────────────┴──────────────────────┴───────────────────────────────┘
```

### Classification of the 10 Models in the Assignment

| # | Model | Family | Key Clue |
|:---:|---|:---:|---|
| 1 | BERT | **Encoder-Only** | "Bidirectional Encoder Representations from Transformers" — name says it all |
| 2 | GPT-1 | Decoder-Only | "Generative Pre-trained Transformer" — generative = decoder |
| 3 | GPT-2 | Decoder-Only | Scaled-up GPT-1 |
| 4 | T5 | **Encoder-Decoder** | "Text-to-Text Transfer Transformer" — seq2seq format |
| 5 | BART | **Encoder-Decoder** | Denoising autoencoder architecture |
| 6 | GPT-3 | Decoder-Only | 175B parameter decoder |
| 7 | GPT-4 | Decoder-Only | Multimodal, MoE; still decoder-only |
| 8 | LLaMA | Decoder-Only | Open-weights decoder model from Meta |
| 9 | LLaMA-2 | Decoder-Only | Improved LLaMA with RLHF |
| 10 | Galactica | Decoder-Only | Decoder for scientific text generation |

**Quick counts from 10 models:** 1 Encoder-Only + 2 Encoder-Decoder + **7 Decoder-Only** = 10 ✓

---

## 2. The Three Pillars of Pre-training Data

No matter how large your model is, it can only be as good as the data it learned from.

```
                    WHAT MAKES GREAT TRAINING DATA?
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
        QUALITY             SIZE             DIVERSITY
           │                  │                  │
    Filter out noise    More tokens =         Cover many
    Toxicity, spam      lower loss           domains:
    Boilerplate         (Scaling Laws)       • Code
    PII, duplicates                          • Books
                                             • Web
                                             • Science
                                             • Multilingual
```

**Real-world examples of each pillar failing:**

- **Poor quality:** Training on spam websites → model generates spammy text.
- **Too small:** Training GPT-2 style model on only 1M tokens → underfits badly.
- **No diversity:** Training only on news articles → model fails at creative writing.

---

## 3. Neural Scaling Laws

### 3.1 The "Student Brain vs. Books" Analogy

Imagine teaching a student to become a doctor:

```
Parameters (N) = Student's Brain Capacity
Training Tokens (D) = Medical Textbooks Read

Before Chinchilla (2022):  Industry thought → just build a BIGGER brain!
                           Built 280B param models on only 300B tokens

After Chinchilla (2022):   Insight → balance brain AND books!
                           70B param model + 1.4T tokens outperformed Gopher (280B)!
```

**The Chinchilla "Golden Ratio":** For every **1 billion parameters**, you should train on roughly **20 billion tokens**. If you double model size, double your dataset too!

### 3.2 The Joint Scaling Law Formula

```math
L(N, D) = \left[ \left(\frac{N_c}{N}\right)^{\frac{\alpha_N}{\alpha_D}} + \frac{D_c}{D} \right]^{\alpha_D}
```

**How to read this formula:**

| Term | Meaning | What happens when it increases? |
|---|---|---|
| $N$ = parameters | Brain size | $\dfrac{N_c}{N}$ decreases → loss decreases |
| $D$ = training tokens | Books read | $\dfrac{D_c}{D}$ decreases → loss decreases |
| $\alpha_N, \alpha_D$ | Scaling exponents | Control how fast loss improves |
| $N_c, D_c$ | Critical constants | Fitted empirically from experiments |

**How to spot the right formula in a multiple-choice question:**
1. The parameter term is $\dfrac{N_c}{N}$ (NOT $\dfrac{D_c}{D}$) — check option structure
2. The exponent on the parameter ratio is $\dfrac{\alpha_N}{\alpha_D}$ (N on top)
3. The outer exponent is $\alpha_D$

### 3.3 Computing Expected Test Loss

**Example:** 1 Billion parameters, 1 Billion tokens.

Using empirical constants from Kaplan et al.:

```
L(10⁹, 10⁹) = E + A/N^αN + B/D^αD
             ≈ 1.69 + 0.54 + 0.627
             ≈ 2.857
```

Where:
- **1.69** = irreducible entropy of English (even perfect prediction can't do better than this)
- **0.54** = "model is not large enough" penalty (for N = 1B)
- **0.627** = "model hasn't seen enough data" penalty (for D = 1B tokens)

---

## 4. Data Curation Pipeline

### 4.1 Why Raw Web Data is Unusable

```
RAW COMMON CRAWL DATA
  ├── Spam and clickbait         (~15% of web)
  ├── Duplicate content          (same article shared 1000s of times)
  ├── Toxic content              (hate speech, harassment)
  ├── Machine translations       (low quality EN→XX→EN artifacts)
  ├── PII (names, phones, SSNs)  (privacy risk)
  ├── Boilerplate text           ("Lorem ipsum", "Click here to subscribe")
  └── Wrong language             (non-English for English-focused models)
```

All of this needs to be removed before the data is safe to train on.

### 4.2 Standard Preprocessing Steps (All 5 Are Required)

| Step | What Is Removed | Tool / Method Used |
|---|---|---|
| **Deduplication** | Near-identical documents | MinHash, suffix arrays |
| **Toxicity filtering** | Hate speech, profanity | Classifier (e.g., Perspective API) |
| **PII removal** | Emails, phone #s, SSNs | Regex patterns + NER |
| **Machine translation removal** | Low-quality translated text | Language models / classifiers |
| **Placeholder removal** | "Lorem ipsum", template text | Regex pattern matching |

### 4.3 The RefinedWeb Pipeline (Falcon, 2023)

The RefinedWeb paper (Penedo et al., 2023) published a detailed 8-step pipeline. Here is the **correct order**:

```
📥 RAW WEB CRAWL (Common Crawl HTML dumps)
        │
        ▼
① URL Filtering (Step 6)
   Block blacklisted domains (spam, malware, adult) before downloading text
        │
        ▼  
② Text Extraction (Step 3)
   Parse HTML → extract plain text, remove scripts/styles/tags
        │
        ▼
③ Language Identification (Step 4)
   Use fastText to detect language → keep only English (or target language)
        │
        ▼
④ Repetition Removal (Step 5)
   Detect documents dominated by repeated lines/n-grams → drop them
        │
        ▼
⑤ Document-wise Filtering (Step 2)
   Apply quality heuristics: word count, symbol ratio, punctuation ratio
        │
        ▼
⑥ Line-wise Correction (Step 1)
   Clean individual lines: remove navigation menus, headers, footers
        │
        ▼
⑦ Fuzzy Deduplication (Step 8)
   MinHash + Locality Sensitive Hashing → remove near-duplicate docs
        │
        ▼
⑧ Exact Deduplication (Step 7)
   Suffix arrays → remove exact substring duplicate docs
        │
        ▼
✅ CLEAN TRAINING DATA
```

**Encoding the order as a digit string:**
```
Step label order: 6 → 3 → 4 → 5 → 2 → 1 → 8 → 7
Answer:  63452187
```

> **Why fuzzy (8) before exact (7)?** Fuzzy deduplication is coarser — it quickly removes large clusters of near-duplicates at the document level. Exact deduplication is finer-grained — it then catches any remaining character-for-character matches.

---

## 5. Major Pre-training Datasets

| Dataset | Size | Used By | Source |
|---|:---:|---|---|
| **Roots** | ~1,600 GB | BLOOM | Multi-lingual text across 59 languages |
| **C4** | ~750 GB | T5, many others | Cleaned Common Crawl (English) |
| **WebText** | ~40 GB | GPT-2 | Reddit posts with ≥3 upvotes |
| **BookCorpus** | ~5 GB | BERT, GPT-1 | ~11,000 unpublished books |
| **Sangrah** | Multi-GB | Indic LLMs | 22+ Indian languages (AI4Bharat) |

**Decreasing size order:** Roots > C4 > WebText > BookCorpus → `2341`

---

## 6. Quick Study Checklist

- [ ] Can you name one example of each architecture family: encoder-only, decoder-only, encoder-decoder?
- [ ] From the 10-model list, can you count: 1 encoder-only, 2 encoder-decoder, 7 decoder-only?
- [ ] Can you explain the Chinchilla "student brain vs. books" analogy?
- [ ] What is the Chinchilla golden ratio? (~20 tokens per parameter)
- [ ] Can you identify the correct scaling law formula (check: exponent is $\alpha_N/\alpha_D$, outer power is $\alpha_D$)?
- [ ] What are the three pillars of pre-training data quality?
- [ ] Can you reproduce the RefinedWeb step order as `63452187`?
- [ ] Why does fuzzy deduplication happen before exact deduplication?
- [ ] Can you rank datasets by size: Roots > C4 > WebText > BookCorpus?
- [ ] What is Sangrah and who created it? (AI4Bharat, multi-lingual Indic dataset)

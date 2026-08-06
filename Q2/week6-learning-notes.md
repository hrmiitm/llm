# Week 6 Learning Notes — T5, Span Corruption & Fine-Tuning

These notes support [Graded Assignment 6](ga6.md). Read in order from Sections 1–5, then use the checklist in Section 6.

---

## 🗺️ Big Picture First

BERT read the entire sentence in both directions (bidirectional). GPT could only look to the left (causal). **T5 combined both ideas** into a single unified encoder-decoder model.

```
BERT   (Encoder-Only):    Reads BOTH directions → great at understanding
GPT    (Decoder-Only):    Reads LEFT only → great at generating text
T5     (Encoder-Decoder): Encoder reads everything → Decoder generates output
```

The T5 team had one brilliant insight: **frame every NLP task as "text in → text out"**.

---

## 1. The Text-to-Text Framework

Before T5, each NLP task needed its own custom model head:
- Translation: encoder-decoder with translation loss
- Classification: linear layer on [CLS] token
- Question answering: span prediction heads

T5 eliminated all of this by using a single interface for everything:

```
Task               Input String                              Output String
─────────────────────────────────────────────────────────────────────────
Translation     "translate English to French: Hello"     → "Bonjour"
Sentiment       "sst2 sentence: This movie is great."    → "positive"
Similarity      "stsb sentence1: Dog runs. sentence2:    → "3.8"
                 Animal jogs."
Summarization   "summarize: [long article text...]"      → "Brief summary"
Q&A             "question: When was BERT published?      → "2018"
                 context: BERT was published in 2018."
```

**Why this is powerful:**
- One model, one loss function (cross-entropy), one training loop
- Adding new tasks = just providing new (input prefix, target string) pairs
- Fine-tuning and zero-shot evaluation use exactly the same interface

---

## 2. T5 Pre-training: Span Corruption (Denoising)

### 2.1 The "Fill-in-the-Blanks" Intuition

Think of T5's pre-training like a fill-in-the-blank test where entire phrases are erased:

```
Original:  "The cat sat on the mat near the warm fireplace."

Corrupted: "The cat [X] on the [Y] near the warm fireplace."
                    ↑             ↑
               sentinel 1     sentinel 2

Target:    "[X] sat [Y] mat [Z]"
                  ↑          ↑
            span 1 text   end sentinel
```

The encoder sees the **corrupted input** (with sentinel blanks). The decoder must reconstruct **only the dropped spans**, labeled with sentinels.

### 2.2 The Rules of Sentinel Tokens

| Rule | Explanation |
|---|---|
| Each dropped span gets a **unique** sentinel | `[X]`, `[Y]`, `[Z]`... (or `<extra_id_0>`, `<extra_id_1>`...) |
| Spans are replaced **in order** | Span 1 → first sentinel, Span 2 → second sentinel, etc. |
| Target format: sentinel + span text, alternating | `[X] dropped text 1 [Y] dropped text 2 [Z]` |
| Target always **ends with a sentinel** | The final `[Z]` signals end of all spans |
| Sentinel tokens are **in the vocabulary** | They need to be embedded AND predicted, so they must exist as vocabulary entries |

### 2.3 Detailed Example from the Assignment

**Sentence:** *"At the heart of science is an essential balance between two seemingly contradictory attitudes — an openness to new ideas, no matter how bizarre or counterintuitive they may be..."*

**Dropped spans (marked with strikethrough):**
1. ~~"of science is"~~
2. ~~"contradictory attitudes"~~
3. ~~"counterintuitive they may be"~~
4. ~~"how deep truths are winnowed"~~

**Encoder input (what the model reads):**
```
"At the heart [v] an essential balance between two seemingly [w] — an 
openness to new ideas, no matter how bizarre or [x], and the most 
ruthless skeptical scrutiny of all ideas, old and new. This is [y] from 
deep nonsense"
```

**Decoder target (what the model must generate):**
```
[v] of science is [w] contradictory attitudes [x] counterintuitive they may be [y] how deep truths are winnowed [z]
```

> ✅ Any consistent set of unique sentinel names is valid — `[v][w][x][y][z]` and `[a][b][c][d][z]` are both correct because the names don't matter, only the ordering and uniqueness do.

### 2.4 Why Sentinel Tokens Must Be in the Vocabulary

```
                    ┌──────────────────────────────┐
                    │    T5 SentencePiece Vocab     │
                    ├──────────────────────────────┤
                    │ Regular subword tokens:       │
                    │ "the", "##ing", "un", ...     │
                    │ (≈32,000 entries)             │
                    ├──────────────────────────────┤
                    │ Special sentinel tokens:      │
                    │ <extra_id_0>                  │
                    │ <extra_id_1>                  │
                    │       ...                     │
                    │ <extra_id_99>                 │
                    │ (100 extra entries)           │
                    └──────────────────────────────┘
```

The decoder needs to **predict** sentinel tokens as part of its output sequence. If they weren't in the vocabulary, the model couldn't compute a loss for predicting them.

---

## 3. Parameter Count vs. Computational Cost

### 3.1 The Surprising Equivalence

This is a key result from **Section 3.2.1 of the T5 paper**:

```
Encoder-Decoder E (2P params) ≈ Decoder-Only D (P params)   [same compute per token!]
```

### 3.2 Why This Makes Sense — The Factory Analogy

Imagine two factories:

```
Factory D (Decoder-Only, P machines):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Token 1] → [P machines] → output
[Token 2] → [P machines] → output
[Token 3] → [P machines] → output
Every token uses ALL P machines.


Factory E (Encoder-Decoder, 2P machines total):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Input tokens]  → [P encoder machines] → context vectors
[Output tokens] → [P decoder machines] → output
Each token only uses P machines (half the factory at a time!).
```

So despite having twice as many total machines (parameters), each token in factory E only passes through **P machines**, same as factory D. Compute per token is identical.

---

## 4. Training Token Budget: The $B \times T$ Calculation

When you train for $S$ steps with batch size $B$ and context length $T$:

```math
\text{Total tokens seen} = S \times B \times T
```

**Example problem:**
- Target: see at least **5 Billion** tokens
- Training steps: $S = 10^6$

**Minimum batch×context needed:**
```math
S \times (B \times T) \geq 5 \times 10^9
\implies B \times T \geq \frac{5 \times 10^9}{10^6} = 5000
```

**Checking options:**

```
8  × 128 = 1,024 tokens/step × 1M steps = 1.024B tokens  ❌ NOT enough
64 × 128 = 8,192 tokens/step × 1M steps = 8.192B tokens  ✅ Enough
4  × 2048= 8,192 tokens/step × 1M steps = 8.192B tokens  ✅ Enough
```

---

## 5. Fine-Tuning T5 for New Tasks

### 5.1 Three Adaptation Methods

```
PRE-TRAINED T5 MODEL
        │
        ├──► Zero-Shot:    Use prefix alone, no updates, no examples
        │                  ("translate EN to DE: The sky is blue.")
        │
        ├──► Few-Shot:     Include 2-5 examples in the prompt, no updates
        │                  ("positive: great movie\nnegative: bad film\n
        │                    positive or negative: The acting was superb.")
        │
        └──► Full Fine-Tune: Provide labeled dataset, update ALL weights via SGD
```

### 5.2 Label Mapping for Classification Tasks

| Original Label (integer) | T5 Compatible Target (string) | Valid? |
|:---:|:---:|:---:|
| `0` | `"negative"` | ✅ (common English word, already in vocab) |
| `1` | `"positive"` | ✅ (common English word, already in vocab) |
| `0` | `"0"` | ✅ (digit string, already in vocab) |
| `1` | `"1"` | ✅ (digit string, already in vocab) |

**What you do NOT need:**
- ❌ **Updating the vocabulary** — `"positive"`, `"negative"`, `"0"`, `"1"` are already standard SentencePiece tokens.
- ❌ **Adding a classification layer** — Unlike BERT, T5 generates the label as a text string directly. No linear head needed.

---

## 6. Quick Study Checklist

- [ ] Can you explain the T5 text-to-text format with a concrete example?
- [ ] Can you write the encoder input and decoder target for a span corruption example?
- [ ] Do you understand why sentinel tokens must be in T5's vocabulary?
- [ ] Can you use the "factory analogy" to explain why Encoder-Decoder 2P = Decoder-only P in compute?
- [ ] Can you compute minimum $B \times T$ given total steps and token budget?
- [ ] Do you know why you don't need to update T5's vocabulary for a sentiment classification task?
- [ ] What are the three adaptation strategies for T5 and when would you use each?

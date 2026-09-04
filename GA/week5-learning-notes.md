# Week 5 Learning Notes — Tokenization: BPE & WordPiece

These notes support [Graded Assignment 5](ga5.md) and cover everything a beginner needs to understand about how modern LLMs split text into tokens.

> **Reading order:** Work through Sections 1 → 5 in order. Then use the comparison table in Section 6 and the checklist in Section 7.

---

## 🗺️ Big Picture First

Before any language model can process text, it needs to convert words into numbers. This is **tokenization**.

```
"lowest"  ──► Tokenizer ──► ["low", "est"]  ──► [412, 1203]  ──► Embedding vectors
  word         splits          subword tokens      integer IDs        numbers model can use
```

The key design question is: **what are the right units to split text into?**

---

## 1. Why Not Just Use Words? (The Problem with Word-Level Tokenization)

Imagine giving every word in the English language its own ID number:

```
 Word        ID
"cat"       →  5
"cats"      →  6         ← completely separate entry!
"chatting"  →  7
"chat"      →  8
"ChatGPT"   → ??? UNKNOWN!
```

**Problems:**
1. **Massive vocabulary:** English alone has 170,000+ words. Rare words get poor embeddings from too little training data.
2. **Unknown words:** Any word not seen during training becomes `<unk>` — the model goes blind.
3. **No morphology:** "play", "plays", "played", "playing" all look completely unrelated.
4. **New entities:** "ChatGPT", "2026", "covid-19" → all unknown.

---

## 2. Why Not Just Use Characters? (The Problem with Character-Level)

```
"Hello" → ['H', 'e', 'l', 'l', 'o']     (5 tokens)
"I love natural language processing." → 38 tokens!
```

| Benefit | Drawback |
|---|---|
| ✅ Tiny vocabulary (~100–256 symbols) | ❌ Sequences become 5-10× longer |
| ✅ No unknown tokens ever | ❌ Long sequences → $O(T^2)$ attention cost |
| ✅ Vocabulary never grows | ❌ Hard to learn word meanings from letters alone |
| ✅ Softmax is very cheap ($|V| \approx 100$) | ❌ Context window fills up fast |

> **The key insight:** Character-level is better than word-level on the vocabulary problems, but creates a new sequence-length problem.

---

## 3. The Solution: Subword Tokenization

**Subword algorithms** find a middle ground: they learn to merge frequent character sequences into meaningful chunks.

```
"unaffordability"  →  ["un", "afford", "##ability"]     ← WordPiece style (BERT)
"unaffordability"  →  ["un", "afford", "ability"]        ← BPE style (GPT)
```

**This is best of both worlds:**

| Property | Word-Level | Char-Level | Subword (BPE/WordPiece) |
|---|:---:|:---:|:---:|
| Vocabulary size | 🔴 Huge | 🟢 Tiny | 🟡 Medium (30k–100k) |
| Handles unknown words | 🔴 No | 🟢 Yes | 🟢 Yes |
| Sequence length | 🟢 Short | 🔴 Very long | 🟡 Moderate |
| Softmax cost | 🔴 High | 🟢 Low | 🟡 Moderate |

---

## 4. Pre-tokenization: The Language Bottleneck

Before BPE can even start, most tokenizers split text on **whitespace** to get initial "words":

```
"My name is John" → ["My", "name", "is", "John"] ← then BPE processes each word
```

**Problem: Not all languages use spaces!**

```
English:   "Hello world"   ← space between words ✅ BPE works fine
German:    "Hallo Welt"    ← space between words ✅ BPE works fine  
Turkish:   "Merhaba dünya" ← space between words ✅ BPE works fine
Japanese:  "こんにちは世界"  ← NO spaces at all  ❌ BPE fails without MeCab/other segmenter
Chinese:   "你好世界"        ← NO spaces at all  ❌ Same problem
```

Japanese and Chinese require **morphological analyzers** (like MeCab for Japanese) to segment text into words before BPE can be applied.

---

## 5. Byte Pair Encoding (BPE) — The Greedy Compressor

### 5.1 Core Idea

BPE was originally a **data compression algorithm** (1994). The idea: repeatedly find the most common adjacent pair and replace it with a single new symbol.

**Key rule:** At each step, merge the pair with the **highest raw frequency count**.

### 5.2 The BPE Algorithm

```
Step 0: Collect word frequencies → append </w> to each word
Step 1: Split every word into individual characters → this is V₀
Step 2: Count how often each adjacent pair (A, B) appears across the entire corpus
Step 3: Merge the most frequent pair → add the new combined token to vocabulary
Step 4: Update the corpus (replace all occurrences of A B with AB)
Step 5: Repeat Steps 2–4 until vocabulary reaches target size
```

### 5.3 Worked Example — Complete BPE Walkthrough

**Corpus:**
```python
wo = {"low": 4, "older": 5, "finest": 6, "lowest": 7, "loneliest": 8}
```

**Step 0 — Represent with `</w>`:**

```
l o w </w>           freq: 4
o l d e r </w>       freq: 5
f i n e s t </w>     freq: 6
l o w e s t </w>     freq: 7
l o n e l i e s t </w>  freq: 8
```

**Step 1 — Initial vocabulary $V_0$:**

```
{ l, o, w, d, e, r, f, i, n, s, t, </w> }   → |V₀| = 12 tokens
```

**Step 2 — Count all pair frequencies:**

| Pair | Appears In | Frequency |
|:---:|---|:---:|
| `(e, s)` | finest(6) + lowest(7) + loneliest(8) | **21** 🏆 |
| `(s, t)` | finest(6) + lowest(7) + loneliest(8) | **21** 🏆 |
| `(t, </w>)` | finest(6) + lowest(7) + loneliest(8) | **21** 🏆 |
| `(l, o)` | low(4) + lowest(7) + loneliest(8) | 19 |
| `(n, e)` | finest(6) + loneliest(8) | 14 |
| `(o, w)` | low(4) + lowest(7) | 11 |
| `(w, </w>)` | low(4) only | **4** ← least frequent |

**Step 3 — Merge #1: `(e, s)` → `es`**

Vocabulary becomes: `{ l, o, w, d, e, r, f, i, n, s, t, </w>, es }` → **|V₁| = 13**

After this merge, how do individual token counts change?
- `e` count: was 34, drops to **13** (21 instances of `e` before `s` were merged away)
- `s` count: was 21, drops to **0** (all `s` were preceded by `e` in those words)
- All other tokens: **unchanged**

→ Exactly **2 tokens** have their frequencies reduced.

**Tokenizing `finest</w>` after 7 merges:**

After merges 1-3: `e`+`s`→`es`, `es`+`t`→`est`, `est`+`</w>`→`est</w>`

```
f  i  n  e  s  t  </w>
↓  ↓  ↓  └──┴──┴────┘
f  i  n    est</w>        ← est</w> is now a single token in V₇!
```

Result: **`('f', 'i', 'n', 'est</w>')`**

---

## 6. WordPiece — The Smart Linguist

### 6.1 The Key Difference from BPE

Instead of picking the most **frequent** pair, WordPiece picks the pair with the highest **likelihood score**:

```math
\text{Score}(A, B) = \frac{\text{freq}(AB)}{\text{freq}(A) \times \text{freq}(B)}
```

### 6.2 Intuition — The "Sticky Pair" Concept

This score answers: *"Are A and B appearing together more than we'd expect by chance?"*

**Example with two pairs:**

| Pair | freq(AB) | freq(A) | freq(B) | Score | Interpretation |
|:---:|:---:|:---:|:---:|:---:|---|
| `(f, i)` | 6 | 6 | 14 | $\frac{6}{6 \times 14} = 0.071$ 🏆 | `f` ALWAYS followed by `i` — very sticky! |
| `(e, s)` | 21 | 34 | 21 | $\frac{21}{34 \times 21} = 0.029$ | `e` often NOT followed by `s` (e.g., in "older") |

Even though `(e, s)` appears 21 times vs `(f, i)`'s 6 times, `(f, i)` wins because every single `f` in the corpus is followed by `i`!

### 6.3 BPE vs. WordPiece — Side-by-Side

```
Corpus: {"low": 4, "older": 5, "finest": 6, "lowest": 7, "loneliest": 8}

BPE selects:      (e, s) with freq = 21  ← "Most common pair"
WordPiece selects: (f, i) with score = 1/14 ≈ 0.071 ← "Most semantically 'sticky'"
```

| Property | BPE | WordPiece |
|---|---|---|
| **Selection rule** | Max raw frequency | Max likelihood score |
| **Philosophy** | Greedy compression | Maximize language model probability |
| **Used by** | GPT-2/3/4, LLaMA, RoBERTa | BERT, DistilBERT, Electra |
| **Notation for subwords** | `</w>` suffix | `##` prefix (e.g., `##ing`) |

---

## 7. Quick Study Checklist

Before looking at the assignment, make sure you can answer these:

- [ ] What are the 4 main vocabulary-building challenges?
- [ ] Why is character-level tokenization impractical for long texts?
- [ ] Why can't whitespace-based BPE work on Japanese?
- [ ] What is `</w>` and why do we append it?
- [ ] How do you compute the initial vocabulary size?
- [ ] How does BPE decide which pair to merge?
- [ ] After merge `(e, s) → es`, does vocabulary size increase by 1? (Yes!)
- [ ] Why does `e` drop from 34 to 13 (not to 0) after the first BPE merge?
- [ ] What is the WordPiece score formula?
- [ ] Why does `(f, i)` beat `(e, s)` in WordPiece despite lower raw frequency?

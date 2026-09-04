# Week 5 — Graded Assignment 5

> **Score: 100 / 100** | Submitted: Sun, 19 Jul 2026

> New to these topics? Read the [Week 5 learning notes](week5-learning-notes.md) before attempting the questions.

---

## Section 1 — Vocabulary Creation & Pre-tokenization

### Q1 — Challenges in Building a Vocabulary

**What are all the challenges one would face while building a vocabulary from a large corpus of text (assume the corpus contains only English text)?**

- ( ) Deciding the size of the vocabulary
- ( ) Method to handle unknown tokens
- ( ) Handling misspelled words
- ( ) Handling names and numbers
- ( ) None of these

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** All four — Deciding vocabulary size, Method to handle unknown tokens, Handling misspelled words, Handling names and numbers

#### ✏️ Step-by-Step Solution

**Step 1 — Vocabulary size trade-off.**

The vocabulary is stored in an embedding matrix $E \in \mathbb{R}^{|V| \times d_{\text{model}}}$.

| Vocabulary too **large** | Vocabulary too **small** |
|---|---|
| Huge memory footprint for $E$ | Too many `<unk>` tokens |
| Softmax over $|V|$ is slow | Long sequence lengths |
| Many rare tokens with bad embeddings | Poor semantic coverage |

**Step 2 — Unknown tokens (`<unk>`).**

Every word-level vocabulary has a fixed set of words. At inference time, an unseen word like `"transformer"` (not in BERT's 2018 vocabulary) would be replaced by `<unk>`, losing all meaning.

**Step 3 — Misspelled words.**

`"teh"`, `"recieve"`, `"occured"` — misspelled tokens become new vocabulary entries with very low frequency, leading to poor embeddings or `<unk>` mapping.

**Step 4 — Names and numbers.**

Proper nouns (`"Elon Musk"`, `"ChatGPT"`) and numbers (`"3.14159"`, `"2024"`) are virtually infinite and cannot be fully listed in a fixed vocabulary.

**Step 5 — Conclusion.**

All four represent fundamental, well-documented challenges in vocabulary construction for NLP systems.

</details>

---

### Q2 — Character-Level Tokenization Properties

**Select correct statements regarding character-level tokenization.**

- ( ) The size of vocabulary by character level tokenization will be **larger** than word level tokenization, if the corpus consists of all the books published on Harry Potter.
- ( ) Computing softmax probabilities will be easy.
- ( ) The vocabulary will not expand if new words/sentences are added to the corpus.
- ( ) No issue of handling unknown tokens

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** Statements 2, 3, and 4 are correct.

#### ✏️ Step-by-Step Solution

**Key intuition:** Character-level tokenization uses a tiny fixed alphabet (e.g., 26 letters + digits + punctuation ≈ 100–256 tokens). Any new word or sentence in the English language is still made of the same letters!

**Statement 1 — Vocabulary size comparison.**

```
Word-level (Harry Potter books):  |V| ≈ 20,000+ unique words
Character-level:                  |V| ≈ 100–256 characters
```

Character-level vocabulary is **far smaller** than word-level. → Statement 1 is **False**.

**Statement 2 — Softmax cost.**

The final prediction layer computes:
```math
\text{softmax over } |V| \text{ outputs} \quad \Rightarrow \quad O(|V|)
```

With $|V| \approx 100$ characters vs. $|V| \approx 50{,}000$ words, the character-level softmax is **much cheaper**. → Statement 2 is **True**.

**Statement 3 — Vocabulary stability.**

Adding new words to the corpus (e.g., `"ChatGPT"`, `"blockchain"`) does NOT introduce new characters — they are all composed of existing letters. → Statement 3 is **True**.

**Statement 4 — No unknown tokens.**

Since any new text (in any language using the same alphabet) decomposes entirely into existing characters, `<unk>` tokens are virtually never needed. → Statement 4 is **True**.

</details>

---

### Q3 — BPE Feasibility Across Languages

**For which of the following options, applying BPE (based on white-space delimiter as a pre-tokenization step) is NOT feasible?**

- ( ) (Japanese) — see image in assets
- ( ) (Turkish) benim adım John Smith
- ( ) (English) My name is John Smith
- ( ) (German) Mein Name ist John Smith

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** Japanese

#### ✏️ Step-by-Step Solution

**How BPE pre-tokenization works:**

Standard BPE splits text on whitespace first, treating each space-separated chunk as a "word" before learning subword merges.

```
English: "My name is John" → ["My", "name", "is", "John"] ✅ Whitespace works!
Turkish: "benim adım John" → ["benim", "adım", "John"]    ✅ Whitespace works!
German:  "Mein Name ist"   → ["Mein", "Name", "ist"]      ✅ Whitespace works!

Japanese: "私の名前はジョン" → ["私の名前はジョン"]           ❌ Entire sentence = one token!
```

**Why Japanese fails:**

Japanese (and Chinese, Thai) writes words **continuously without spaces**. Whitespace pre-tokenization cannot find word boundaries, so the entire sentence becomes a single "word" token.

Japanese requires a morphological segmenter (like **MeCab**) or a language-aware tokenizer (like **Byte-Level BPE** in GPT) before BPE can work correctly.

$`\displaystyle \boxed{\text{Japanese}}`$

</details>

---

## Section 2 — Byte Pair Encoding (BPE) Algorithm

### Context for Q4 – Q10

Consider the following dictionary of word frequencies in a corpus:

```python
wo = {
    "low":       4,
    "older":     5,
    "finest":    6,
    "lowest":    7,
    "loneliest": 8
}
```

> **Important:** Append `</w>` (end-of-word marker) to every word before starting BPE.

**Words represented as character sequences:**

| Word | Character Sequence | Frequency |
|:---:|---|:---:|
| low | `l o w </w>` | 4 |
| older | `o l d e r </w>` | 5 |
| finest | `f i n e s t </w>` | 6 |
| lowest | `l o w e s t </w>` | 7 |
| loneliest | `l o n e l i e s t </w>` | 8 |

---

### Q4 — Initial Vocabulary Size

**You will be learning Byte Pair Encoding. How many tokens are there in the initial vocabulary?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{12}$

#### ✏️ Step-by-Step Solution

**Collect all unique character tokens across all words:**

| From "low" | From "older" | From "finest" | From "lowest" | From "loneliest" |
|---|---|---|---|---|
| `l, o, w, </w>` | `o, l, d, e, r, </w>` | `f, i, n, e, s, t, </w>` | `l, o, w, e, s, t, </w>` | `l, o, n, e, l, i, e, s, t, </w>` |

**Unique token set $V_0$:**

```
{ l, o, w, d, e, r, f, i, n, s, t, </w> }
  1  2  3  4  5  6  7  8  9  10 11  12
```

$`\displaystyle |V_0| = \boxed{12}`$

</details>

---

### Q5 — Least Frequent Pair Before First Merge

**Which of the following pairs has the least frequency before any merge?**

- ( ) (`w`, `</w>`)
- ( ) (`l`, `d`)
- ( ) (`i`, `n`)
- ( ) (`n`, `e`)
- ( ) (`w`, `e`)
- ( ) None of these.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** (`w`, `</w>`)

#### ✏️ Step-by-Step Solution

**Calculate frequency of each candidate pair across all words (multiply by word frequency):**

| Pair | Found In | Count |
|:---:|---|:---:|
| `(w, </w>)` | `low` (4) only | **4** ← minimum |
| `(l, d)` | `older` (5) only | **5** |
| `(i, n)` | `finest` (6) only | **6** |
| `(n, e)` | `finest` (6) + `loneliest` (8) | **14** |
| `(w, e)` | `lowest` (7) only | **7** |

The pair `('w', '</w>')` with frequency **4** is the least frequent among all options.

$`\displaystyle \boxed{\text{(`w', `</w>')}}`$

</details>

---

### Q6 — Most Frequent Pair Before First Merge

**What is the most frequent byte-pair before the very first merge? (Enter the pair string, e.g., `es`)**

*(Short answer input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{\text{es}}$

#### ✏️ Step-by-Step Solution

**Compute all adjacent pair frequencies:**

| Pair | Words Containing It | Frequency |
|:---:|---|:---:|
| `(e, s)` | `finest`(6) + `lowest`(7) + `loneliest`(8) | **21** 🏆 |
| `(s, t)` | `finest`(6) + `lowest`(7) + `loneliest`(8) | **21** 🏆 |
| `(t, </w>)` | `finest`(6) + `lowest`(7) + `loneliest`(8) | **21** 🏆 |
| `(l, o)` | `low`(4) + `lowest`(7) + `loneliest`(8) | 19 |
| `(n, e)` | `finest`(6) + `loneliest`(8) | 14 |
| `(o, w)` | `low`(4) + `lowest`(7) | 11 |

Three pairs tie at frequency **21**. By left-to-right tie-breaking, `('e', 's')` is selected first.

$`\displaystyle \boxed{\text{es}}`$

</details>

---

### Q7 — Frequency of Most Frequent Pair

**What is the frequency of the most frequent byte-pair before the very first merge?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{21}$

#### ✏️ Step-by-Step Solution

From Q6's table, the pair `('e', 's')` appears in three words:

```math
\text{freq}(e, s) = 6 \underbrace{(\text{finest})}_{} + 7 \underbrace{(\text{lowest})}_{} + 8 \underbrace{(\text{loneliest})}_{} = 21
```

$`\displaystyle \boxed{21}`$

</details>

---

### Q8 — Token Frequencies Revised After First Merge

**How many tokens in the vocabulary will have their frequency revised/reduced after the first merge?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{2}$

#### ✏️ Step-by-Step Solution

**The first merge combines `e` + `s` → `es`.**

Wherever `e` immediately precedes `s` in a word, that `e`-`s` pair is replaced by the new token `es`. This **reduces** the standalone counts of both `e` and `s`:

| Token | Count Before Merge | What Happened | Count After Merge |
|:---:|:---:|---|:---:|
| `e` | 34 | 21 instances of `e` followed by `s` were merged → those `e`s disappear | **13** |
| `s` | 21 | Every `s` preceded by `e` was merged → all 21 disappear | **0** |
| All others | unchanged | `l`, `o`, `w`, `d`, `r`, `f`, `i`, `n`, `t`, `</w>` are unaffected | unchanged |

> **Why does `e` drop from 34 to 13?**  
> `e` appears in `older` (5×) as `d-e-r` — the `e` here is NOT followed by `s`, so it survives.  
> But in `finest`, `lowest`, `loneliest`, `e` always precedes `s`, so 6+7+8 = **21** of those `e`s get merged away.  
> $34 - 21 = \mathbf{13}$ standalone `e`s remain.

Exactly **2** tokens (`e` and `s`) have their frequencies reduced.

$`\displaystyle \boxed{2}`$

</details>

---

### Q9 — Vocabulary Size After First Merge

**After the first merge, how many tokens are there in the updated vocabulary?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{13}$

#### ✏️ Step-by-Step Solution

**BPE rule:** Every merge adds exactly **1** new token to the vocabulary. Existing tokens are NOT removed.

```math
|V_1| = |V_0| + 1 = 12 + 1 = 13
```

**Vocabulary after merge 1:**
```
{ l, o, w, d, e, r, f, i, n, s, t, </w>, es }
  ↑ original 12 tokens             ↑ new token
```

$`\displaystyle \boxed{13}`$

</details>

---

### Q10 — Tokenization After 7 Merges

**Suppose the process stopped after 7 merges (in order):**

| # | Token 1 | Token 2 | → Merged |
|:---:|:---:|:---:|:---:|
| 1 | `e` | `s` | `es` |
| 2 | `es` | `t` | `est` |
| 3 | `est` | `</w>` | `est</w>` |
| 4 | `l` | `o` | `lo` |
| 5 | `lo` | `w` | `low` |
| 6 | `lo` | `n` | `lon` |
| 7 | `lon` | `e` | `lone` |

**How will the word `finest</w>` be tokenized?**

- ( ) (`f`, `i`, `n`, `est</w>`)
- ( ) (`f`, `i`, `n`, `est`, `</w>`)
- ( ) (`f`, `i`, `n`, `e`, `s`, `t</w>`)
- ( ) (`f`, `i`, `n`, `e`, `st`, `</w>`)
- ( ) (`fin`, `est</w>`)
- ( ) None of these

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** (`f`, `i`, `n`, `est</w>`)

#### ✏️ Step-by-Step Solution

**Step 1 — List vocabulary $V_7$ after all 7 merges:**

```
Original: l, o, w, d, e, r, f, i, n, s, t, </w>
Merge 1:  + es
Merge 2:  + est
Merge 3:  + est</w>   ← key token!
Merge 4:  + lo
Merge 5:  + low
Merge 6:  + lon
Merge 7:  + lone
```

**Step 2 — Apply greedy longest-match tokenization to `finest</w>`:**

```
f i n e s t </w>
↓
f    → matches "f"       ✅
i    → matches "i"       ✅
n    → matches "n"       ✅
est</w> → matches "est</w>" ✅ (longest match wins!)
```

**Result:**
$`\displaystyle \text{finest</w>} \longrightarrow (\text{`f'}, \text{`i'}, \text{`n'}, \text{`est</w>'})`$

$`\displaystyle \boxed{(\text{`f'}, \text{`i'}, \text{`n'}, \text{`est</w>'})}`$

</details>

---

## Section 3 — WordPiece Algorithm

### Context for Q11 – Q12

Same corpus dictionary as Section 2:

```python
wo = {"low": 4, "older": 5, "finest": 6, "lowest": 7, "loneliest": 8}
```

> You will now prepare the vocabulary using the **WordPiece** algorithm (used by BERT), which uses a **score-based** merging criterion instead of raw frequency.

---

### Q11 — Highest Scoring Pair in WordPiece Before First Merge

**What is the highest scoring byte-pair before the very first merge? (Enter the pair string, e.g., `fi`)**

*(Short answer input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{\text{fi}}$

#### ✏️ Step-by-Step Solution

**WordPiece score formula:**

```math
\text{Score}(A, B) = \frac{\text{freq}(AB)}{\text{freq}(A) \times \text{freq}(B)}
```

> **Intuition:** This score is high when $A$ and $B$ occur together far more often than expected by chance. A rare pair that always sticks together scores higher than a common pair that occasionally appears adjacent.

**Step 1 — Individual symbol total counts across all words:**

| Symbol | Calculation | Count |
|:---:|---|:---:|
| `e` | `older`(1×5) + `finest`(1×6) + `lowest`(1×7) + `loneliest`(2×8) | **34** |
| `l` | `low`(1×4) + `older`(1×5) + `lowest`(1×7) + `loneliest`(2×8) | **32** |
| `</w>` | appears once in every word: 4+5+6+7+8 | **30** |
| `o` | `low`(4) + `older`(5) + `lowest`(7) + `loneliest`(8) | **24** |
| `s` | `finest`(6) + `lowest`(7) + `loneliest`(8) | **21** |
| `t` | `finest`(6) + `lowest`(7) + `loneliest`(8) | **21** |
| `i` | `finest`(6) + `loneliest`(8) | **14** |
| `n` | `finest`(6) + `loneliest`(8) | **14** |
| `w` | `low`(4) + `lowest`(7) | **11** |
| `f` | `finest`(6) only | **6** |
| `d` | `older`(5) only | **5** |
| `r` | `older`(5) only | **5** |

**Step 2 — Compute scores for top candidate pairs:**

| Pair | freq(AB) | freq(A) | freq(B) | Score = freq(AB)/(A×B) |
|:---:|:---:|:---:|:---:|:---:|
| **(f, i)** | 6 | 6 | 14 | $\frac{6}{6 \times 14} = \frac{1}{14} \approx \mathbf{0.0714}$ 🏆 |
| (s, t) | 21 | 21 | 21 | $\frac{21}{21 \times 21} = \frac{1}{21} \approx 0.0476$ |
| (o, w) | 11 | 24 | 11 | $\frac{11}{24 \times 11} = \frac{1}{24} \approx 0.0417$ |
| (e, s) | 21 | 34 | 21 | $\frac{21}{34 \times 21} = \frac{1}{34} \approx 0.0294$ |

> **Why does `(f, i)` win?** Although it only appears 6 times, `f` itself is extremely rare (total count = 6). Every single `f` in the corpus is always followed by `i`. This mutual exclusivity gives `(f, i)` the highest score!

**Answer:** `fi`

$`\displaystyle \boxed{\text{fi}}`$

</details>

---

### Q12 — Value of $100 \cdot s_1$

**Say the score of the very first pair merged is $s_1$. What is the value of $100 \cdot s_1$? (Correct up to 2 decimal places)**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{7.14}$

#### ✏️ Step-by-Step Solution

From Q11, the first merged pair is `(f, i)` with score:

```math
s_1 = \frac{\text{freq}(fi)}{\text{freq}(f) \times \text{freq}(i)} = \frac{6}{6 \times 14} = \frac{6}{84} = \frac{1}{14}
```

Multiplying by 100:

```math
100 \cdot s_1 = \frac{100}{14} = \frac{50}{7} = 7.142857\ldots
```

Truncated to 2 decimal places (without rounding):

$`\displaystyle \boxed{7.14}`$

</details>

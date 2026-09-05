# Learning 01 — From Text to Transformer Inputs

> **Goal:** Learn the input pipeline from zero: text → tokens → IDs → vectors → positions → a batch tensor.
> **How to use this assignment:** Attempt a question, then open its solution. Every solution ends with a short memory hook.

## Context for Q1–Q15

Keep this input pipeline in mind throughout the assignment:

```text
text → tokenizer → token IDs → embedding lookup → add position information → hidden-state tensor
```

![Input pipeline from text to initial hidden states](assets/input-pipeline.mmd)

---

### Q1 — Token or word? (MCQ)

**Which statement is most accurate?**

- ( ) A token is always a complete dictionary word.
- ( ) A token ID is a learned meaning score.
- ( ) A token can be a word, a subword, or punctuation.
- ( ) Tokens only exist after attention is computed.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** C

#### Step-by-step solution

1. **What is a token?**
   A tokenizer breaks raw text into smaller pieces called **tokens**. Depending on the tokenizer vocabulary, a token can be:
   - A whole word: e.g., `"learn"`, `"cat"`.
   - A subword chunk: e.g., `"unbelievable"` split into `"un"`, `"believ"`, `"able"`, or `"learning"` split into `"learn"` and `"ing"`.
   - A punctuation mark or symbol: e.g., `","`, `"?"`, `"\n"`.
   - A special control token: e.g., `[CLS]`, `[SEP]`, `<pad>`.

2. **Why not whole words only?**
   If we only used complete dictionary words, any typo, name, or new word (like `"ChatGPT"`) would become an unknown word (`[UNK]`). Subwords allow models to handle infinite open vocabularies using a compact dictionary of 30,000–100,000 tokens.

3. **Why are the other options incorrect?**
   - Option A is false: Tokens are frequently subwords or punctuation, not just complete words.
   - Option B is false: A token ID is merely an integer address (an index from $0$ to $|V|-1$) used to look up a vector in a table. It contains no learned meaning or numeric score.
   - Option D is false: Tokenization happens as the very first step before any neural network or attention layer runs.

**Memory hook:** **T**oken = a **T**ext piece (word, subword, or symbol), not necessarily a dictionary word. $\boxed{\text{C}}$

</details>

---

### Q2 — Minimum context length (Short Answer)

**A batch contains sequences of 3, 5, and 4 tokens. What is the smallest context length $T$ that avoids truncating any sequence?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{5}$

#### Step-by-step solution

1. **What is context length $T$?**
   In deep learning, sequence models process sentences in parallel on GPUs. Because GPU operations require fixed-size, rectangular matrices (tensors), every sequence in a batch must be allocated the same number of token slots, denoted by $T$.

2. **What does truncation mean?**
   If we choose $T < \text{length}$, the sequence is cut short (truncated), and all tokens beyond position $T$ are permanently lost.

3. **Finding the minimum non-truncating length:**
   To ensure that **no** sequence loses any of its tokens:
   $$T \ge \max(\text{lengths}) = \max(3, 5, 4) = 5.$$

4. **Handling shorter sequences:**
   The longest sequence (5 tokens) fills all 5 slots. Shorter sequences (3 and 4 tokens) receive placeholder `<pad>` tokens to reach length 5.

$$T=\max(3,5,4)=\boxed{5}.$$

**Memory hook:** **T = Tallest token row** in the batch.

</details>

---

### Q3 — Padding cost in a hidden-state tensor (Short Answer)

**Three examples contain 4, 7, and 2 real tokens and are padded to their batch maximum. With $d_{model}=12$, how many hidden-state *elements* belong to padded positions?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{96}$

#### Step-by-step solution

1. **Determine the batch context length $T$:**
   The batch must expand to fit the longest sequence:
   $$T = \max(4, 7, 2) = 7.$$

2. **Count the padded token slots for each example:**
   - Example 1: has 4 real tokens $\to$ needs $7 - 4 = 3$ pad tokens.
   - Example 2: has 7 real tokens $\to$ needs $7 - 7 = 0$ pad tokens.
   - Example 3: has 2 real tokens $\to$ needs $7 - 2 = 5$ pad tokens.

   Total padded token positions across the batch:
   $$\text{Total pad positions} = 3 + 0 + 5 = 8.$$

3. **Convert positions to tensor elements (scalar values):**
   In a hidden-state tensor, each token position is represented by a vector of depth $d_{model} = 12$ numbers:
   $$\text{Padded elements} = 8 \text{ positions} \times 12 \text{ values/position} = \boxed{96}.$$

4. **Visualizing the full tensor budget:**
   - Total allocated elements: $\text{Batch} \times T \times d_{model} = 3 \times 7 \times 12 = 252$.
   - Real token elements: $(4 + 7 + 2) \times 12 = 13 \times 12 = 156$.
   - Padded elements: $252 - 156 = 96$.

This illustrates why an attention **padding mask** is essential: those 96 placeholder numbers occupy physical memory on the GPU, but carry no linguistic meaning and must be ignored during attention.

**Memory hook:** First count **pad slots**, then multiply by **depth** ($d_{model}$).

</details>

---

### Q4 — Input/output vocabulary parameters (Short Answer)

**A language model has vocabulary size $V=500$ and $d_{model}=16$. It uses an input embedding table and a separate output projection with a bias. How many vocabulary-related trainable parameters are there in total?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{16500}$

#### Step-by-step solution

1. **Input Embedding Table ($E_{\text{in}}$):**
   - The input table assigns one $d_{model}$-dimensional vector to every word in the vocabulary $V$.
   - It is a matrix of shape $|V| \times d_{model}$ (lookup tables have no bias):
   $$\text{Parameters}_{\text{input}} = |V| \times d_{model} = 500 \times 16 = 8{,}000.$$

2. **Output Projection Layer (Unembedding / LM Head):**
   - The final layer transforms the model's hidden representation ($d_{model}=16$) into unnormalized prediction scores (logits) for all 500 possible next words.
   - **Weight matrix ($W_{\text{out}}$):** shape $16 \times 500$ (or $500 \times 16$), giving:
     $$16 \times 500 = 8{,}000 \text{ weights.}$$
   - **Bias vector ($b_{\text{out}}$):** one scalar bias for each vocabulary word:
     $$500 \text{ biases.}$$
   - Total for output layer:
     $$8{,}000 + 500 = 8{,}500.$$

3. **Total vocabulary-related parameters:**
   Because the problem states that the tables are **separate** (untied):
   $$\text{Total} = \text{Input Table} + \text{Output Layer} = 8{,}000 + 8{,}500 = \boxed{16{,}500}.$$

*(Note: If the model used **weight tying**, the $500 \times 16$ matrix would be shared between input and output, leaving $8{,}000 \text{ (shared matrix)} + 500 \text{ (output bias)} = 8{,}500$ parameters).*

**Memory hook:** Vocabulary parameters = **Input table** ($V \cdot d$) + **Output layer** ($V \cdot d + V$). Check if weights are tied!

</details>

---

### Q5 — Correct input shape (MCQ)

**For $B=2$, $T=7$, and $d_{model}=32$, which is the usual batch-first encoder-input shape?**

- ( ) $2\times32\times7$
- ( ) $2\times7\times32$
- ( ) $7\times2\times32$
- ( ) $32\times7\times2$

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B

#### Step-by-step solution

1. **Understand standard tensor dimensions:**
   In modern deep learning frameworks (such as PyTorch and HuggingFace Transformers), the standard **batch-first** convention arranges the axes as:
   $$(\text{Batch Size } B, \text{ Sequence Length } T, \text{ Hidden Dimension } d_{model}).$$

2. **Mapping our values:**
   - Axis 0 ($B=2$): Number of independent sentences/samples in the mini-batch.
   - Axis 1 ($T=7$): Number of token positions (time steps) per sentence.
   - Axis 2 ($d_{model}=32$): Number of feature dimensions representing each token.

3. **Substituting the dimensions:**
   $$\underbrace{2}_{B} \times \underbrace{7}_{T} \times \underbrace{32}_{d_{model}}.$$

Thus, the tensor shape is $2 \times 7 \times 32$.

**Memory hook:** Say **“Batch, Time, Depth”** ($B \times T \times d_{model}$). $\boxed{\text{B}}$

</details>

---

### Q6 — Meaning of a token ID (MCQ)

**What does token ID 4812 mean before embedding lookup?**

- ( ) The token is 4,812 times more important than ID 1.
- ( ) It is an address selecting one row of the embedding table.
- ( ) It is the token's probability.
- ( ) It is one coordinate of the token vector.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B

#### Step-by-step solution

1. **Discrete Categorical Indexes:**
   A token ID is an integer label (e.g., $4812$) assigned to a specific string in the tokenizer's dictionary.

2. **Locker / Address Analogy:**
   Think of the embedding table as a huge cabinet with 50,000 lockers. Token ID 4812 is simply the number on the locker door. When the model sees ID 4812, it opens locker #4812 and extracts the continuous vector stored inside:
   $$\mathbf{x} = E[4812, :].$$

3. **No Ordinal Meaning:**
   Locker #4812 is not "4,812 times bigger" or "4,812 times more important" than locker #1. The integer itself has zero geometric meaning before lookup.

**Memory hook:** ID = **I**ndex / Address, not **I**ntelligence. $\boxed{\text{B}}$

</details>

---

### Q7 — Why add positional information? (MCQ)

**Why is position information added to token embeddings?**

- ( ) It tells attention where each token occurs in the sequence.
- ( ) It converts probabilities into logits.
- ( ) It replaces the tokenizer.
- ( ) It removes the need for an embedding table.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A

#### Step-by-step solution

1. **Permutation Invariance of Attention:**
   Self-attention calculates pairwise dot products between token vectors. If you shuffle the tokens in a sentence, self-attention computes the exact same set of dot products! Without positional information, a Transformer behaves like a "bag of words"—it cannot distinguish:
   - `"Dog bites man"` from `"Man bites dog"`.

2. **Injecting Order:**
   Because word order conveys syntax and meaning, we add a unique positional vector $P_t$ to each token's embedding $X_t$:
   $$H_t^{(0)} = X_t + P_t.$$
   This gives each token vector a unique positional signature so the model knows *what* word it is and *where* it sits in the sequence.

**Memory hook:** **P**osition tells the model **P**lace. $\boxed{\text{A}}$

</details>

---

### Q8 — Adding position to content (Short Answer)

**For $d_{model}=6$ at position $0$, let a token embedding be $X=[1,0,1,0,1,0]$. With sinusoidal encoding ordered as sine/cosine pairs, what is the squared $L_2$ norm of $H^{(0)}=X+PE(0)$?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{6}$

#### Step-by-step solution

1. **Understand Sinusoidal Positional Encoding (Vaswani et al. 2017):**
   The standard sinusoidal encoding arranges coordinates in pairs $(\sin, \cos)$ for $i = 0, 1, \dots$:
   $$PE(pos, 2i) = \sin\left(\frac{pos}{10000^{2i/d_{model}}}\right), \quad PE(pos, 2i+1) = \cos\left(\frac{pos}{10000^{2i/d_{model}}}\right).$$

2. **Evaluate at position $pos = 0$:**
   - For every sine term: $\sin(0) = 0$.
   - For every cosine term: $\cos(0) = 1$.
   With $d_{model}=6$, there are $6/2 = 3$ pairs:
   $$PE(0) = [\sin(0), \cos(0), \sin(0), \cos(0), \sin(0), \cos(0)] = [0, 1, 0, 1, 0, 1].$$

3. **Add token embedding $X$ and positional vector $PE(0)$ element-by-element:**
   $$X = [1, 0, 1, 0, 1, 0]$$
   $$PE(0) = [0, 1, 0, 1, 0, 1]$$
   $$H^{(0)} = X + PE(0) = [1+0, 0+1, 1+0, 0+1, 1+0, 0+1] = [1, 1, 1, 1, 1, 1].$$

4. **Calculate the squared $L_2$ norm ($\|v\|_2^2 = \sum v_k^2$):**
   $$\|H^{(0)}\|_2^2 = 1^2 + 1^2 + 1^2 + 1^2 + 1^2 + 1^2 = 6 \times 1 = \boxed{6}.$$

*(Insight: At any position $pos$, each sine/cosine pair satisfies $\sin^2(\theta) + \cos^2(\theta) = 1$ by the Pythagorean identity, ensuring stable norm scales across positions).*

**Memory hook:** Input vector = **Content + Place**, added coordinate-by-coordinate.

</details>

---

### Q9 — Padding and masks (MSQ)

**Which statements about padding are true? (Select all that apply.)**

- ( ) Padding gives batch sequences a common tensor shape.
- ( ) An attention mask should stop useful tokens from attending to padding.
- ( ) Padding makes the longest sequence shorter.
- ( ) Padding removes the need to choose a context length.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A and B

#### Step-by-step solution

1. **Analyzing each statement:**
   - **A is TRUE:** Batch matrix multiplication requires rectangular tensors. Padding appends dummy tokens to shorter sequences so all examples match the context length $T$.
   - **B is TRUE:** Real words should not attend to artificial `<pad>` tokens. An attention mask sets the attention logits for pad positions to $-\infty$, ensuring their softmax weight becomes $e^{-\infty} = 0$.
   - **C is FALSE:** Padding lengthens shorter sequences; it never shortens the longest sequence. (Truncation is what cuts long sequences).
   - **D is FALSE:** You must still choose or compute a context length $T$ (such as the batch maximum or model limit).

**Memory hook:** **Pad for shape; mask for meaning.** $\boxed{\text{A, B}}$

</details>

---

### Q10 — Static versus contextual vectors (MCQ)

**Which representation can make `bank` differ in “river bank” and “money bank”?**

- ( ) Its token ID
- ( ) A static lookup vector alone
- ( ) A contextual hidden state after Transformer layers
- ( ) The position index alone

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** C

#### Step-by-step solution

1. **The problem of Polysemy (multiple meanings):**
   The word `"bank"` can mean a financial institution or the side of a river.

2. **Static vs Contextual Representations:**
   - **Token ID:** Always the same integer (e.g., ID 321).
   - **Static Embedding (Word2Vec / Initial Table lookup):** Selects the exact same row vector every time `"bank"` appears, completely unaware of surrounding words.
   - **Position index:** Only tells where the word is (e.g., word #3), not what the neighbors mean.
   - **Contextual Hidden State (Transformer):** Through self-attention layers, `"bank"` attends to surrounding tokens (`"river"` or `"money"`). By blending value vectors from its context, the output hidden state dynamically reflects financial concepts in one sentence and geographic concepts in another!

**Memory hook:** Lookup is the **word alone**; hidden state is the **word in its story**. $\boxed{\text{C}}$

</details>

---

### Q11 — Same dimensions for addition (MSQ)

**Which conditions must hold to add token embeddings $X$ and positional vectors $P$? (Select all that apply.)**

- ( ) They need matching sequence positions.
- ( ) They need the same final vector width.
- ( ) Their vocabulary sizes must be identical.
- ( ) Their number of attention heads must be identical.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A and B

#### Step-by-step solution

1. **Linear algebra requirement for matrix addition:**
   To perform elementwise addition $H = X + P$, the matrices must have identical dimensions:
   $$X, P \in \mathbb{R}^{T \times d_{model}}.$$

2. **Evaluating the conditions:**
   - **Condition A (Matching sequence positions):** The positional encoding for position $t$ must be added to the token located at position $t$.
   - **Condition B (Same final vector width):** Both vectors must have width $d_{model}$ so that coordinate $k$ of content adds to coordinate $k$ of position.
   - **Condition C is FALSE:** Positional encodings depend on sequence length $T$, not vocabulary size $|V|$.
   - **Condition D is FALSE:** Attention head splitting happens inside later multi-head attention sublayers, long after input addition.

**Memory hook:** To add, align **where** ($T$) and **how wide** ($d_{model}$). $\boxed{\text{A, B}}$

</details>

---

### Q12 — How much attention is real? (Short Answer)

**A batch has real sequence lengths $[6,4,2,1]$ and is padded to $T=6$. If the padding mask blocks every pad query/key interaction, how many self-attention score cells are valid across the batch for one head?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{57}$

#### Step-by-step solution

1. **Self-Attention pairwise interactions:**
   In self-attention, every real query token can attend to every real key token in the same sequence.
   A sequence with $L$ real tokens forms a valid attention block of size $L \times L = L^2$ scores.

2. **Calculate valid cells per sequence:**
   - Sequence 1 ($L=6$): $6^2 = 36$ valid interaction cells.
   - Sequence 2 ($L=4$): $4^2 = 16$ valid interaction cells.
   - Sequence 3 ($L=2$): $2^2 = 4$ valid interaction cells.
   - Sequence 4 ($L=1$): $1^2 = 1$ valid interaction cell.

3. **Sum all valid cells across the batch:**
   $$\text{Total valid cells} = 36 + 16 + 4 + 1 = \boxed{57}.$$

4. **Comparison with padded tensor volume:**
   The full allocated score tensor has shape $B \times T \times T = 4 \times 6 \times 6 = 144$ cells.
   Only $57$ cells contain real information; the remaining $144 - 57 = 87$ cells are padded placeholders that the attention mask sets to $-\infty$.

**Memory hook:** In attention, a sequence of length $L$ forms an $L \times L = L^2$ square of real scores.

</details>

---

### Q13 — Read the input side of an architecture diagram (MSQ)

The lettered diagram below illustrates the complete Transformer architecture. Which statements about its input paths are correct? (Select all that apply.)

![Lettered Transformer encoder-decoder architecture](assets/transformer-lettered-architecture.mmd)

- ( ) A is the source-token embedding path and B supplies source positional information.
- ( ) C is the shifted-right target embedding path and D supplies target positional information.
- ( ) The two circular `+` nodes are causal masks that erase future tokens.
- ( ) E and L begin the encoder and decoder's learned attention processing after their input additions.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A, B and D

#### Step-by-step solution

1. **Tracing the Encoder side (left subgraph):**
   - Source text inputs enter at `Inputs`.
   - Box **A** is the **Input Embedding** lookup table.
   - Box **B** supplies the **Positional Encoding**.
   - The circular `+` node `AddE` performs vector addition: $H_{\text{enc}}^{(0)} = X + PE$.
   - The result enters box **E**, which is the encoder's **Multi-Head Self-Attention** sublayer.
   - Therefore, statements **A** and **D** are TRUE.

2. **Tracing the Decoder side (right subgraph):**
   - Previously generated target tokens enter at `Outputs shifted right`.
   - Box **C** is the **Output (Target) Embedding** lookup table.
   - Box **D** supplies the **Target Positional Encoding**.
   - The circular `+` node `AddD` performs vector addition.
   - The result enters box **L**, which is the decoder's **Masked Multi-Head Self-Attention** sublayer.
   - Therefore, statement **B** is TRUE.

3. **Why statement C is FALSE:**
   The circular `+` nodes represent standard elementwise vector additions ($X + P$). Causal masking does NOT happen at the embedding addition; it occurs later inside decoder self-attention (box **L**).

**Memory hook:** The input `+` circle means **what word + where word**, not a mask! $\boxed{\text{A, B, D}}$

</details>

---

### Q14 — What becomes contextual? (MSQ)

**After Transformer blocks process a sentence, which statements are true? (Select all that apply.)**

- ( ) Each token's hidden state may contain information from other tokens.
- ( ) The same token string can have different hidden states in different sentences.
- ( ) Token IDs are changed into larger IDs.
- ( ) Word order is irrelevant once positions are added.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A and B

#### Step-by-step solution

1. **Analyzing each statement:**
   - **A is TRUE:** Self-attention allows each token to compute attention weights over all other tokens, forming a weighted mixture of their value vectors. Thus, each token's hidden state incorporates information from the entire sentence.
   - **B is TRUE:** Because the surrounding context differs across sentences, the attention weights and resulting mixtures change, yielding distinct contextual vectors for the same token word.
   - **C is FALSE:** Token IDs are fixed dictionary integers (e.g., ID 42 is always ID 42); they never mutate into "larger IDs".
   - **D is FALSE:** Word order remains critical throughout the entire network—positional information is carried forward in every hidden state to preserve sequence syntax.

**Memory hook:** Context changes the **continuous vector**, never the discrete dictionary ID. $\boxed{\text{A, B}}$

</details>

---

### Q15 — Foundations checkpoint: special tokens, padding, and B-T-D (Short Answer)

**Two raw texts have 3 and 5 tokens. Each is wrapped as `[CLS] text [SEP]`, then padded together. With $d_{model}=12$, how many hidden-state elements correspond to *real* (non-padding) positions?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{144}$

#### Step-by-step solution

1. **Step 1: Account for special delimiter tokens:**
   In architectures like BERT, `[CLS]` (classification token) and `[SEP]` (sentence separator) are real tokens: they have their own embedding rows and interact in self-attention:
   - Text 1: 3 raw tokens $+ 2 \text{ special tokens} = 5$ real tokens.
   - Text 2: 5 raw tokens $+ 2 \text{ special tokens} = 7$ real tokens.

2. **Step 2: Sum real token positions:**
   $$\text{Total real positions} = 5 + 7 = 12 \text{ tokens.}$$

3. **Step 3: Multiply by hidden dimension $d_{model} = 12$:**
   $$\text{Real hidden-state elements} = 12 \text{ tokens} \times 12 \text{ features} = \boxed{144}.$$

4. **Step 4: Check against total tensor allocation:**
   - Batch context length: $T = \max(5, 7) = 7$.
   - Total batch tensor shape: $(B=2, T=7, d_{model}=12)$.
   - Total allocated elements: $2 \times 7 \times 12 = 168$.
   - Padded elements: $168 - 144 = 24$ (which matches Text 1's $7 - 5 = 2$ pad tokens $\times 12 = 24$).

**Memory hook:** Separate **allocated space** ($B \cdot T \cdot d$) from **meaningful real space** ($\text{real tokens} \cdot d$).

</details>

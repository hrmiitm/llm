# Learning 01 — From Text to Transformer Inputs

> **Goal:** learn the input pipeline from zero: text → tokens → IDs → vectors → positions → a batch tensor.
> **How to use this assignment:** attempt a question, then open its solution. Every solution ends with a short memory hook.

## Context for Q1–Q15

Keep this input pipeline in mind throughout the assignment:

```text
text → tokenizer → token IDs → embedding lookup → add position information → hidden-state tensor
```

![Attention pipeline, beginning with token embeddings](assets/attention-pipeline.svg)

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

1. A tokenizer splits text into units from its vocabulary.
2. Those units can be whole words, pieces such as `learn` + `ing`, or punctuation.
3. A token ID is only an index used to look up a vector; it is not a numeric meaning.

**Memory hook:** **T**oken = a **T**ext piece, not necessarily a whole word. $\boxed{\text{C}}$

</details>

### Q2 — Minimum context length (Short Answer)

**A batch contains sequences of 3, 5, and 4 tokens. What is the smallest context length $T$ that avoids truncating any sequence?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{5}$

#### Step-by-step solution

1. Context length is the number of token slots available per sequence.
2. It must cover the longest sequence, not the average sequence.

$$T=\max(3,5,4)=\boxed{5}.$$

Shorter sequences receive padding until they also have five slots.

**Memory hook:** **T = Tallest token row**.

</details>

### Q3 — Padding cost in a hidden-state tensor (Short Answer)

**Three examples contain 4, 7, and 2 real tokens and are padded to their batch maximum. With $d_{model}=12$, how many hidden-state *elements* belong to padded positions?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{96}$

#### Step-by-step solution

1. The maximum real length is $T=7$.
2. Padding counts are $7-4=3$, $7-7=0$, and $7-2=5$.
3. There are $3+0+5=8$ padded **token positions**.
4. Every token position carries a 12-dimensional hidden state, so

$$8\times12=\boxed{96}.$$

This is why a padding mask is necessary: those 96 placeholder values have the right shape but no linguistic meaning.

**Memory hook:** first count **pad slots**, then multiply by **depth**.

</details>

### Q4 — Input/output vocabulary parameters (Short Answer)

**A language model has vocabulary size $V=500$ and $d_{model}=16$. It uses an input embedding table and a separate output projection with a bias. How many vocabulary-related trainable parameters are there in total?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{16500}$

#### Step-by-step solution

1. The input embedding table stores one vector per vocabulary item:

$$E\in\mathbb{R}^{|V|\times d_{model}}.$$

So it has $500\times16=8000$ parameters.

2. The output layer maps 16 hidden features to 500 vocabulary logits and has one bias per logit:

$$16\times500+500=8500.$$

3. Because the question says the tables are **separate**, add both parts:

$$8000+8500=\boxed{16500}.$$

If input/output weights were tied, the $500\times16$ matrix would be shared rather than counted twice; the output bias would still be separate.

**Memory hook:** vocabulary parameters have an **in** table and an **out** table—ask whether they are tied.

</details>

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

Read the axes in order:

$$\underbrace{2}_{B}\times\underbrace{7}_{T}\times\underbrace{32}_{d_{model}}.$$

The question asks for the common **batch-first** convention, so the correct shape is $2\times7\times32$.

**Memory hook:** say **“batch, time, depth”** before substituting numbers. $\boxed{\text{B}}$

</details>

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

An ID is a categorical label. Embedding lookup selects row $E_{4812}$ from $E\in\mathbb{R}^{|V|\times d_{model}}$.

The number itself has no ordered geometric meaning; ID 4812 is not “larger in meaning” than ID 1.

**Memory hook:** ID = **I**ndex, not **I**ntelligence. $\boxed{\text{B}}$

</details>

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

Self-attention compares token content, but token order matters: `dog bites man` differs from `man bites dog`.

The input is formed by compatible vectors:

$$H^{(0)}=X+P,$$

where $X$ is the token embedding and $P$ gives each position a signature.

**Memory hook:** **P**osition tells the model **P**lace. $\boxed{\text{A}}$

</details>

### Q8 — Adding position to content (Short Answer)

**For $d_{model}=6$ at position $0$, let a token embedding be $X=[1,0,1,0,1,0]$. With sinusoidal encoding ordered as sine/cosine pairs, what is the squared $L_2$ norm of $H^{(0)}=X+PE(0)$?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{6}$

#### Step-by-step solution

1. At position zero, every sine coordinate is 0 and every cosine coordinate is 1. With three sine/cosine pairs,

$$PE(0)=[0,1,0,1,0,1].$$

2. Add position information coordinate by coordinate:

$$H^{(0)}=[1,1,1,1,1,1].$$

3. Square and sum its six coordinates:

$$\|H^{(0)}\|_2^2=6\times1^2=\boxed{6}.$$

**Memory hook:** input representation = **content + place**, coordinate by coordinate.

</details>

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

Padding adds placeholder slots to short sequences so every row has length $T$. A padding mask ensures those artificial slots do not contribute information during attention.

- A is true: shapes can be batched.
- B is true: pad tokens are ignored.
- C and D are false: the longest real sequence determines the needed $T$.

**Memory hook:** **Pad for shape; mask for meaning.** $\boxed{\text{A, B}}$

</details>

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

The starting lookup vector for the token can be the same, but attention mixes surrounding words into its hidden state. The final representation can therefore encode river-related context in one sentence and finance-related context in another.

**Memory hook:** lookup is **same word**; hidden state is **same word in a story**. $\boxed{\text{C}}$

</details>

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

Element-wise addition requires the same shape. For one sequence,

$$X,P\in\mathbb{R}^{T\times d_{model}}.$$

Vocabulary size and head count do not appear in this addition.

**Memory hook:** to add, align **where** ($T$) and **how wide** ($d_{model}$). $\boxed{\text{A, B}}$

</details>

### Q12 — How much attention is real? (Short Answer)

**A batch has real sequence lengths $[6,4,2,1]$ and is padded to $T=6$. If the padding mask blocks every pad query/key interaction, how many self-attention score cells are valid across the batch for one head?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{57}$

#### Step-by-step solution

For one sequence with $L$ real tokens, the valid self-attention block is $L\times L$, not $6\times6$.

$$6^2+4^2+2^2+1^2=36+16+4+1=\boxed{57}.$$

The dense padded tensor still allocates $4\times6^2=144$ score locations, but the mask says only 57 correspond to real-token pairs.

**Memory hook:** for attention, a length $L$ contributes an $L\times L$ square.

</details>

### Q13 — Name the three axes (Short Answer)

**Write the standard batch-first hidden-state axes in order, separated by commas.**

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** `B, T, d_model`

#### Step-by-step solution

$$\text{hidden states}\in\mathbb{R}^{B\times T\times d_{model}}.$$

$B$ counts sequences, $T$ counts positions per padded sequence, and $d_{model}$ counts features per token.

**Memory hook:** **B-T-D = Batch, Tokens, Dimensions.**

</details>

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

Attention lets a position read weighted information from other positions, so its hidden state becomes contextual. This is why `bank` can represent different senses in different contexts.

IDs remain vocabulary indexes, and order remains important even after position vectors are added.

**Memory hook:** context changes the **vector**, not the dictionary ID. $\boxed{\text{A, B}}$

</details>

### Q15 — Foundations checkpoint: special tokens, padding, and B-T-D (Short Answer)

**Two raw texts have 3 and 5 tokens. Each is wrapped as `[CLS] text [SEP]`, then padded together. With $d_{model}=12$, how many hidden-state elements correspond to *real* (non-padding) positions?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{144}$

#### Step-by-step solution

1. `[CLS]` and `[SEP]` add two real tokens to each text, giving lengths $3+2=5$ and $5+2=7$.
2. The batch is padded to $T=7$, but only $5+7=12$ positions are real.
3. Each real position has 12 hidden features:

$$12\times12=\boxed{144}.$$

For comparison, the allocated tensor has $2\times7\times12=168$ elements; the remaining 24 are padding representations and must be masked.

**Memory hook:** separate **allocated** B-T-D space from **meaningful** non-pad space.

</details>

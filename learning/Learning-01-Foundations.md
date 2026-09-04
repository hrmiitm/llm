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

### Q3 — Batch-output volume (Short Answer)

**A batch has $B=3$ sequences, context length $T=5$, and hidden width $d_{model}=8$. How many elements are in the encoder output tensor?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{120}$

#### Step-by-step solution

The standard batch-first hidden-state shape is

$$B\times T\times d_{model}.$$

Substitute the values:

$$3\times5\times8=\boxed{120}.$$

**Memory hook:** **B-T-D** = batches, tokens, dimensions.

</details>

### Q4 — Embedding-table parameters (Short Answer)

**A vocabulary has 500 tokens and embedding dimension 16. How many parameters are in the embedding table?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{8000}$

#### Step-by-step solution

One embedding vector is stored for every vocabulary entry:

$$E\in\mathbb{R}^{|V|\times d_{model}}.$$

Therefore

$$500\times16=\boxed{8000}.$$

**Memory hook:** embedding table = **vocabulary rows × vector columns**.

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

### Q8 — Positional-encoding norm at position zero (Short Answer)

**For sinusoidal positional encoding with $d_{model}=4$ and $pos=0$, what is the squared Euclidean norm of the positional vector?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{2}$

#### Step-by-step solution

There are two sine/cosine pairs. At position zero, each pair is

$$[\sin(0),\cos(0)]=[0,1].$$

So $PE(0)=[0,1,0,1]$, and

$$0^2+1^2+0^2+1^2=\boxed{2}.$$

**Memory hook:** each sine/cosine pair contributes $\sin^2\theta+\cos^2\theta=1$.

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

### Q12 — Output volume after padding (Short Answer)

**Four sequences are padded to $T=6$. If $d_{model}=10$, how many values are in the final encoder output for the batch?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{240}$

#### Step-by-step solution

The final encoder preserves the batch, token, and hidden axes:

$$4\times6\times10=\boxed{240}.$$

The number of layers changes the computation, not this final shape.

**Memory hook:** layers change **content**, not the usual B-T-D layout.

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

### Q15 — Foundations checkpoint (Short Answer)

**A batch has $B=4$, padded length $T=6$, and $d_{model}=12$. How many elements are in its hidden-state tensor?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{288}$

#### Step-by-step solution

Use the complete input-to-hidden-state shape:

$$\mathbb{R}^{B\times T\times d_{model}}=\mathbb{R}^{4\times6\times12}.$$

Therefore,

$$4\times6\times12=\boxed{288}.$$

**Memory hook:** when stuck, write **B-T-D** before doing any multiplication.

</details>

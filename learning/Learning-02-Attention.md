# Learning 02 — Attention: Find What Matters

## Goal

Learn scaled dot-product attention from first principles: queries ask, keys advertise, values carry information. Work through the score, softmax, and weighted-sum calculations yourself.

![Attention pipeline](assets/attention-pipeline.svg)

For Questions 1–6, use this tiny self-attention example. The two token states are

\[
H=\begin{bmatrix}1&0\\0&1\end{bmatrix},\qquad
W_Q=W_K=I,\qquad
W_V=\begin{bmatrix}2&0\\0&1\end{bmatrix}.
\]

Ignore scaling by \(\sqrt{d_k}\) in this mini-example. Thus \(Q=K=H\), \(V=HW_V\), and the first query's score row is \([1,0]\).

### Q1 — Score matrix shape (Numeric Input)

What is the number of entries in \(QK^\top\) for the two-token example?

*(Numeric input)*

<details>
<summary>Solution</summary>

1. \(Q\) has one row per query token: \(2\times2\).
2. \(K^\top\) is \(2\times2\).
3. Therefore \(QK^\top\) is \(2\times2\), with \(2\cdot2=4\) entries.

\[
QK^\top=\begin{bmatrix}1&0\\0&1\end{bmatrix}.
\]

**Memory hook:** a score table compares every **query row** with every **key column**: \(T\times T\).

**Answer:** \(\boxed{4}\)
</details>

### Q2 — Reading a score (MCQ)

For the first query, which key receives the smaller raw score?

- ( ) Key 1
- ( ) Both keys receive the same score
- ( ) Key 2
- ( ) There is not enough information

<details>
<summary>Solution</summary>

The first score row is \([1,0]\). The second entry belongs to Key 2, and \(0<1\).

The score is a dot product: aligned directions get a larger score.

**Answer:** C
</details>

### Q3 — Softmax weight (Numeric Input)

The first score row is \([1,0]\). What is the attention weight on Key 1, rounded to three decimals?

*(Numeric input)*

<details>
<summary>Solution</summary>

Apply softmax across the row:

\[
\alpha_1=\frac{e^1}{e^1+e^0}=\frac{e}{e+1}\approx\frac{2.718}{3.718}=0.731.
\]

**Intuition:** softmax turns scores into a probability distribution, so the larger score gets more, but not all, of the attention.

**Answer:** \(\boxed{0.731}\)
</details>

### Q4 — Probability check (Numeric Input)

What must the two attention weights in any one softmax row add up to?

*(Numeric input)*

<details>
<summary>Solution</summary>

If \(\alpha_j=\frac{e^{s_j}}{\sum_m e^{s_m}}\), then

\[
\sum_j\alpha_j=\frac{\sum_j e^{s_j}}{\sum_m e^{s_m}}=1.
\]

**Memory hook:** softmax makes a *spotlight budget*: all of the light totals 1.

**Answer:** \(\boxed{1}\)
</details>

### Q5 — Weighted value sum (Numeric Input)

For the first query, \(V=\begin{bmatrix}2&0\\0&1\end{bmatrix}\). What is the first coordinate of the attention output, rounded to three decimals?

*(Numeric input)*

<details>
<summary>Solution</summary>

From Q3, the weights are approximately \([0.731,0.269]\). Attention returns a weighted mixture of **values**:

\[
z_1=0.731[2,0]+0.269[0,1]=[1.462,0.269].
\]

So its first coordinate is \(1.462\).

**Mnemonic:** **Q asks, K keys in, V voices out.** Scores use Q and K; the returned content comes from V.

**Answer:** \(\boxed{1.462}\)
</details>

### Q6 — The complete formula (MCQ)

Which expression is scaled dot-product attention?

- ( ) \(\operatorname{softmax}(QV^\top)K\)
- ( ) \(\operatorname{softmax}(QK^\top/\sqrt{d_k})V\)
- ( ) \(Q+K+V\)
- ( ) \(\operatorname{softmax}(KQ^\top)V^\top\)

<details>
<summary>Solution</summary>

1. Compare each query with keys: \(QK^\top\).
2. Stabilize score magnitudes: divide by \(\sqrt{d_k}\).
3. Turn each score row into weights: softmax.
4. Mix the values using those weights: multiply by \(V\).

**Answer:** B
</details>

### Q7 — Why scale scores? (MCQ)

Why divide \(QK^\top\) by \(\sqrt{d_k}\) in scaled dot-product attention?

- ( ) To make every attention row exactly uniform
- ( ) To prevent large dot products from making softmax overly sharp
- ( ) To reduce the number of tokens
- ( ) To remove positional information

<details>
<summary>Solution</summary>

With more key dimensions, dot products tend to grow in magnitude. Very large positive/negative logits make softmax near one-hot, where gradients can become less useful. Dividing by \(\sqrt{d_k}\) keeps the score scale more manageable.

**Intuition:** scaling turns down an over-sensitive microphone before it clips.

**Answer:** B
</details>

### Q8 — What softmax guarantees (MSQ)

Which statements about a softmax attention row are always true?

- ( ) Every weight is positive.
- ( ) The weights sum to 1.
- ( ) The largest score has the largest weight.
- ( ) Every weight is exactly 0 or 1.

<details>
<summary>Solution</summary>

For finite scores, exponentials are positive, so every softmax weight is positive. Normalization makes the row sum to 1. Since the exponential is increasing, a larger score yields a larger weight. Softmax is usually *soft*, not exactly one-hot.

**Answer:** A, B and C
</details>

### Q9 — Equal scores (Numeric Input)

If a query has two unmasked keys with equal scores \([3,3]\), what attention weight does each key receive?

*(Numeric input)*

<details>
<summary>Solution</summary>

\[
\frac{e^3}{e^3+e^3}=\frac12=0.5.
\]

The absolute score does not matter here; equality makes the split even.

**Answer:** \(\boxed{0.5}\)
</details>

### Q10 — Self-attention or cross-attention? (MCQ)

In an encoder-decoder transformer, decoder cross-attention uses decoder states for \(Q\) and encoder states for \(K,V\). What does this let a target token do?

- ( ) Look at relevant source tokens while it is being generated
- ( ) Read future target tokens
- ( ) Eliminate the output softmax
- ( ) Avoid learning embeddings

<details>
<summary>Solution</summary>

The decoder's current state asks a question; source-side keys locate useful input words; source-side values supply their information. This is how a translation decoder can focus on the relevant part of the source sentence.

**Answer:** A
</details>

### Q11 — Attention shapes (MSQ)

Suppose target length is \(T_t\) and source length is \(T_s\). Which statements are correct for one cross-attention head?

- ( ) \(Q\) has \(T_t\) rows.
- ( ) \(K\) has \(T_s\) rows.
- ( ) The score matrix has shape \(T_t\times T_s\).
- ( ) The score matrix must be square.

<details>
<summary>Solution</summary>

Each target position asks one query, so \(Q\) has \(T_t\) rows. Each source position provides a key, so \(K\) has \(T_s\) rows. Their comparison table is \(T_t\times T_s\), which is only square when the lengths happen to match.

**Answer:** A, B and C
</details>

### Q12 — Highest dot product (MCQ)

A query is \([1,1]\). Its two keys are \([1,0]\) and \([0,2]\). Which key gets the higher raw score?

- ( ) The first key
- ( ) The second key
- ( ) They tie
- ( ) Neither; dot products cannot be used as attention scores

<details>
<summary>Solution</summary>

\[
[1,1]\cdot[1,0]=1,\qquad [1,1]\cdot[0,2]=2.
\]

The second key is more aligned with this query.

**Answer:** B
</details>

### Q13 — The attention recipe (Short Answer)

Write the four-part matrix formula for scaled dot-product attention, including the scale factor.

<details>
<summary>Solution</summary>

\[
\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V.
\]

Read it left to right: **ask** with \(Q\), **match** against \(K\), **normalize**, then **retrieve** from \(V\).

**Answer:** `softmax(QK^T / sqrt(d_k)) V`
</details>

### Q14 — Which object is mixed? (MCQ)

After the attention weights have been computed, which vectors are averaged to form the output?

- ( ) Query vectors
- ( ) Key vectors
- ( ) Value vectors
- ( ) Positional vectors only

<details>
<summary>Solution</summary>

Queries and keys decide *where* to look. Values are the payload that gets combined according to those attention weights.

**Answer:** C
</details>

### Q15 — Attention checkpoint (MSQ)

Choose every correct statement.

- ( ) Each attention row belongs to one query position.
- ( ) A causal mask may remove some keys before softmax.
- ( ) Attention weights tell us how the value vectors are mixed.
- ( ) Attention changes the sequence length by definition.

<details>
<summary>Solution</summary>

Attention preserves the number of query rows: a self-attention layer with \(T\) queries produces \(T\) output rows. A mask can make forbidden scores effectively \(-\infty\), giving them zero probability after softmax. The remaining weights mix values.

**Answer:** A, B and C
</details>

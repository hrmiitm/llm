# Learning 02 — Attention: Find What Matters

> **Goal:** Learn scaled dot-product attention from first principles: queries ask, keys advertise, values carry information. Work through the score, softmax, and weighted-sum calculations yourself.
> **How to use this assignment:** Attempt a question, then open its solution. Every solution ends with a short memory hook.

## Context for Q1–Q15

Keep the **Search Engine / Library Catalog** analogy in mind:
- **Query ($Q$):** What you are searching for (the question or topic of interest).
- **Key ($K$):** The index tags or labels on library books (how each token advertises itself).
- **Value ($V$):** The actual text or content inside the book (the payload retrieved).

```text
Tokens X → Compute Q, K, V → Similarity Scores (Q K^T / √d_k) → Softmax Weights → Weighted Sum of Values
```

![Attention pipeline](assets/attention-pipeline.mmd)

For Questions 1–6, consider this minimal two-token self-attention example:

Two input token representations:
$$H = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}, \qquad W_Q = W_K = I = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}, \qquad W_V = \begin{bmatrix} 2 & 0 \\ 0 & 1 \end{bmatrix}.$$

Ignore scaling by $\sqrt{d_k}$ in Questions 1–5 for simplicity.
Thus:
- $Q = H W_Q = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}$ (Query 1: $[1, 0]$, Query 2: $[0, 1]$).
- $K = H W_K = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}$ (Key 1: $[1, 0]$, Key 2: $[0, 1]$).
- $V = H W_V = \begin{bmatrix} 2 & 0 \\ 0 & 1 \end{bmatrix}$ (Value 1: $[2, 0]$, Value 2: $[0, 1]$).

---

### Q1 — Score matrix shape (Numeric Input)

**What is the number of entries in $QK^\top$ for the two-token example?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{4}$

#### Step-by-step solution

1. **Understand matrix shapes:**
   - There are $T=2$ tokens, each with key/query dimension $d_k=2$.
   - The Query matrix $Q$ has shape $T \times d_k = 2 \times 2$.
   - The Key matrix $K$ has shape $T \times d_k = 2 \times 2$, so its transpose $K^\top$ has shape $d_k \times T = 2 \times 2$.

2. **Compute matrix multiplication shape:**
   $$QK^\top \in \mathbb{R}^{(2 \times 2) \times (2 \times 2)} = \mathbb{R}^{2 \times 2}.$$

3. **Count the entries:**
   A $2 \times 2$ matrix has $2 \times 2 = \boxed{4}$ scalar score entries:
   $$QK^\top = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix} \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix} = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}.$$
   - Entry $(1, 1) = 1$: Query 1 attending to Key 1.
   - Entry $(1, 2) = 0$: Query 1 attending to Key 2.
   - Entry $(2, 1) = 0$: Query 2 attending to Key 1.
   - Entry $(2, 2) = 1$: Query 2 attending to Key 2.

**Memory hook:** A score table compares every **query row** with every **key column**: sequence length squared ($T \times T$).

</details>

---

### Q2 — Reading a score (MCQ)

**For the first query, which key receives the smaller raw score?**

- ( ) Key 1
- ( ) Both keys receive the same score
- ( ) Key 2
- ( ) There is not enough information

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** C

#### Step-by-step solution

1. **Extract Query 1 and both Keys:**
   - First Query: $q_1 = [1, 0]$.
   - Key 1: $k_1 = [1, 0]$.
   - Key 2: $k_2 = [0, 1]$.

2. **Calculate dot-product similarities:**
   - Score for Key 1: $q_1 \cdot k_1 = 1 \times 1 + 0 \times 0 = 1$.
   - Score for Key 2: $q_1 \cdot k_2 = 1 \times 0 + 0 \times 1 = 0$.

3. **Compare scores:**
   The raw score row is $[1, 0]$. Since $0 < 1$, **Key 2** receives the smaller raw score ($0$).

A dot product measures vector alignment: $q_1$ and $k_1$ point in the exact same direction (score 1), whereas $q_1$ and $k_2$ are orthogonal/perpendicular (score 0).

**Memory hook:** Dot product = **directional alignment**; orthogonal vectors score zero. $\boxed{\text{C}}$

</details>

---

### Q3 — Softmax weight (Numeric Input)

**The first score row is $[1,0]$. What is the attention weight on Key 1, rounded to three decimals?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{0.731}$

#### Step-by-step solution

1. **What is Softmax?**
   Softmax converts arbitrary real-valued scores $[s_1, s_2, \dots, s_n]$ into a normalized probability distribution where each weight is positive and all weights sum to $1$:
   $$\alpha_i = \frac{e^{s_i}}{\sum_{j} e^{s_j}}.$$

2. **Apply Softmax to score row $[s_1=1, s_2=0]$:**
   - Exponentiate score 1: $e^1 \approx 2.71828$.
   - Exponentiate score 2: $e^0 = 1$.
   - Sum of exponentials: $e^1 + e^0 \approx 2.71828 + 1 = 3.71828$.

3. **Compute the attention weight for Key 1:**
   $$\alpha_1 = \frac{e^1}{e^1 + e^0} = \frac{e}{e + 1} \approx \frac{2.71828}{3.71828} \approx 0.73106 \approx \boxed{0.731}.$$

*(Notice that the weight on Key 2 is $\alpha_2 = \frac{1}{3.71828} \approx 0.269$, and $0.731 + 0.269 = 1.000$).*

**Memory hook:** Softmax turns raw scores into probabilities: $\frac{e^s}{\sum e^s}$.

</details>

---

### Q4 — A mask changes the softmax support (Numeric Input)

**A query has raw scores $[2,1,-3]$. The third key is a forbidden future token and is replaced by $-\infty$ before softmax. What attention weight does that third key receive?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{0}$

#### Step-by-step solution

1. **Why do we mask future tokens?**
   In autoregressive language models (like GPT), a word being generated at position $t$ must not peek into words at positions $t+1, t+2, \dots$. To enforce this causal constraint without altering the tensor shape, we overwrite future positions with $-\infty$.

2. **Calculate the exponent of $-\infty$:**
   Recall the limit of the exponential function as $x \to -\infty$:
   $$\lim_{x \to -\infty} e^x = 0.$$
   So $e^{-\infty} = 0$.

3. **Compute the softmax for Key 3:**
   $$\alpha_3 = \frac{e^{-\infty}}{e^2 + e^1 + e^{-\infty}} = \frac{0}{7.389 + 2.718 + 0} = \frac{0}{10.107} = \boxed{0}.$$

Because its numerator is exactly $0$ while the denominator is strictly positive, the third key receives an attention weight of **$0$**.

**Memory hook:** Mask **before** softmax: $-\infty \to e^{-\infty} = 0$ attention weight.

</details>

---

### Q5 — Weighted value sum (Numeric Input)

**For the first query, $V=\begin{bmatrix}2&0\\0&1\end{bmatrix}$. What is the first coordinate of the attention output, rounded to three decimals?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{1.462}$

#### Step-by-step solution

1. **Understand what Attention returns:**
   Queries ($Q$) and Keys ($K$) decide **how much to look** ($\alpha_1, \alpha_2$).
   Values ($V$) are the **actual information extracted**:
   $$z_1 = \alpha_1 v_1 + \alpha_2 v_2.$$

2. **Retrieve the components:**
   - From Q3, the attention weights are:
     $$\alpha_1 = \frac{e}{e+1} \approx 0.73106, \quad \alpha_2 = \frac{1}{e+1} \approx 0.26894.$$
   - Value vectors from $V$:
     $$v_1 = [2, 0], \quad v_2 = [0, 1].$$

3. **Compute the weighted vector sum:**
   $$z_1 = 0.73106 \begin{bmatrix} 2 \\ 0 \end{bmatrix} + 0.26894 \begin{bmatrix} 0 \\ 1 \end{bmatrix} = \begin{bmatrix} 2 \times 0.73106 \\ 0.26894 \end{bmatrix} = \begin{bmatrix} 1.46212 \\ 0.26894 \end{bmatrix}.$$

4. **Identify the first coordinate:**
   The first coordinate is $1.46212 \approx \boxed{1.462}$.

**Memory hook:** **Q asks, K advertises, V provides content.** Output is a weighted sum of **Values**.

</details>

---

### Q6 — The complete formula (MCQ)

**Which expression is scaled dot-product attention?**

- ( ) $\operatorname{softmax}(QV^\top)K$
- ( ) $\operatorname{softmax}(QK^\top/\sqrt{d_k})V$
- ( ) $Q+K+V$
- ( ) $\operatorname{softmax}(KQ^\top)V^\top$

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B

#### Step-by-step solution

1. **Breaking down the formula step-by-step (Vaswani et al. 2017):**
   $$\operatorname{Attention}(Q, K, V) = \operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V.$$

2. **Step 1: Compare Queries with Keys ($QK^\top$):**
   Multiplies queries by transposed keys to compute raw pairwise similarity scores.

3. **Step 2: Scale by $\frac{1}{\sqrt{d_k}}$:**
   Divides scores by the square root of the key dimension $d_k$ to stabilize score magnitudes and avoid vanishing gradients.

4. **Step 3: Normalize with Softmax:**
   Transforms score rows into probabilities that sum to $1$.

5. **Step 4: Multiply by Values ($V$):**
   Blends the value vectors using the computed attention weights.

**Memory hook:** Match with $QK^\top$, scale by $\sqrt{d_k}$, softmax to get weights, retrieve $V$. $\boxed{\text{B}}$

</details>

---

### Q7 — Why scale scores? (MCQ)

**Why divide $QK^\top$ by $\sqrt{d_k}$ in scaled dot-product attention?**

- ( ) To make every attention row exactly uniform
- ( ) To prevent large dot products from making softmax overly sharp
- ( ) To reduce the number of tokens
- ( ) To remove positional information

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B

#### Step-by-step solution

1. **Mathematical origin of score growth:**
   Assume $q$ and $k$ are $d_k$-dimensional vectors whose components are independent random variables with mean $0$ and variance $1$.
   Their dot product is:
   $$q \cdot k = \sum_{i=1}^{d_k} q_i k_i.$$
   - The mean of the dot product is $0$.
   - The variance of the dot product is:
     $$\operatorname{Var}(q \cdot k) = \sum_{i=1}^{d_k} \operatorname{Var}(q_i k_i) = d_k \times (1 \times 1) = d_k.$$
   - The standard deviation is therefore $\sqrt{d_k}$.

2. **The Softmax Saturation problem:**
   As $d_k$ grows large (e.g., $d_k=64$ or $128$), the dot products grow very large in magnitude.
   When large numbers enter the softmax function, the largest score gets an exponential that dwarfs all others, producing an almost one-hot distribution ($[0.9999, 0.0001, \dots]$).
   In this saturated region, the softmax gradient is virtually **zero** ($\frac{\partial \text{softmax}_i}{\partial z_j} \approx 0$). The network suffers from severe **vanishing gradients** and stops learning!

3. **The fix:**
   Dividing by $\sqrt{d_k}$ rescales the variance back to $\frac{d_k}{(\sqrt{d_k})^2} = 1$, keeping logits in a well-behaved range where softmax retains healthy gradients.

**Memory hook:** Scaling turns down the volume so softmax doesn't peak and clip gradients. $\boxed{\text{B}}$

</details>

---

### Q8 — What softmax guarantees (MSQ)

**Which statements about a softmax attention row are always true? (Select all that apply.)**

- ( ) Every weight is positive.
- ( ) The weights sum to 1.
- ( ) The largest score has the largest weight.
- ( ) Every weight is exactly 0 or 1.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A, B and C

#### Step-by-step solution

1. **Evaluating each property of $\operatorname{softmax}(\mathbf{s})_i = \frac{e^{s_i}}{\sum_{j} e^{s_j}}$:**
   - **Statement A is TRUE:** For any finite real score $s_i$, the exponential $e^{s_i} > 0$ is strictly positive. Since both numerator and denominator are positive, $\alpha_i > 0$ for all finite inputs.
   - **Statement B is TRUE:** The denominator is the sum of all numerators, guaranteeing that $\sum_{i} \alpha_i = \frac{\sum e^{s_i}}{\sum e^{s_j}} = 1$. It forms a valid probability distribution.
   - **Statement C is TRUE:** The exponential function $e^x$ is strictly monotonically increasing. If $s_a > s_b$, then $e^{s_a} > e^{s_b}$, so $\alpha_a > \alpha_b$. The highest score always gets the greatest attention weight.
   - **Statement D is FALSE:** Softmax is a continuous, *soft* approximation of the argmax function. Weights are real numbers strictly between $0$ and $1$ (e.g., $0.731$ and $0.269$), not discrete integers $\{0, 1\}$.

**Memory hook:** Softmax is **positive, sums to 1, and preserves ranking.** $\boxed{\text{A, B, C}}$

</details>

---

### Q9 — Stable softmax and score shifts (Numeric Input)

**A three-key attention row has raw scores $[9,7,5]$. A stable implementation subtracts the maximum, giving $[0,-2,-4]$, before softmax. What is the first key's attention weight, rounded to three decimals?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{0.867}$

#### Step-by-step solution

1. **Why subtract the maximum ($C = \max(s)$)?**
   In floating-point hardware (like 32-bit or 16-bit floats), calculating $e^x$ for large scores (e.g., $e^{100}$ or $e^{1000}$) results in numerical overflow (`inf`), which causes division by `inf` resulting in `NaN` (Not a Number).
   Subtracting $C = 9$ ensures the largest exponent is $e^{9-9} = e^0 = 1$, completely eliminating overflow!

2. **Proof of mathematical equivalence:**
   $$\frac{e^{s_i - C}}{\sum_{j} e^{s_j - C}} = \frac{e^{s_i} \cdot e^{-C}}{\sum_{j} (e^{s_j} \cdot e^{-C})} = \frac{e^{-C} \cdot e^{s_i}}{e^{-C} \cdot \sum_{j} e^{s_j}} = \frac{e^{s_i}}{\sum_{j} e^{s_j}}.$$
   Subtracting any constant $C$ from all scores produces the **exact same** probabilities!

3. **Compute using shifted scores $[0, -2, -4]$:**
   - $e^0 = 1$
   - $e^{-2} \approx 0.135335$
   - $e^{-4} \approx 0.018316$
   - Sum $= 1 + 0.135335 + 0.018316 = 1.153651$

4. **Compute weight for Key 1:**
   $$\alpha_1 = \frac{e^0}{\text{Sum}} = \frac{1}{1.153651} \approx 0.86681 \approx \boxed{0.867}.$$

**Memory hook:** Shift scores by $-\max(s)$ for **numerical safety** without altering probabilities.

</details>

---

### Q10 — Self-attention or cross-attention? (MCQ)

**In an encoder-decoder transformer, decoder cross-attention uses decoder states for $Q$ and encoder states for $K,V$. What does this let a target token do?**

- ( ) Look at relevant source tokens while it is being generated
- ( ) Read future target tokens
- ( ) Eliminate the output softmax
- ( ) Avoid learning embeddings

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A

#### Step-by-step solution

1. **Understand Self-Attention vs Cross-Attention:**
   - **Self-Attention:** $Q, K, V$ all come from the same sequence. Tokens in sentence A look at other tokens in sentence A.
   - **Cross-Attention (Encoder-Decoder Attention):**
     - **Queries ($Q$):** Come from the decoder (representing the target sequence being generated, e.g., French words).
     - **Keys ($K$) & Values ($V$):** Come from the encoder output (representing the input source sentence, e.g., English words).

2. **Linguistic Intuition:**
   When translating *"The black cat"* to French, as the decoder generates *"chat"* (cat), its query asks: *"Which English words in the source sentence correspond to what I am translating right now?"*
   Keys from the encoder match *"cat"*, and the encoder's values provide the rich contextual representation of *"cat"*.

3. **Why other options are incorrect:**
   - Option B is false: Future target tokens are in the decoder and masked out by causal masking; cross-attention looks at the *source* sentence.
   - Options C & D are false: Cross-attention does not eliminate softmax or embeddings.

**Memory hook:** In cross-attention, the **decoder asks ($Q$)** and the **encoder answers ($K, V$)**. $\boxed{\text{A}}$

</details>

---

### Q11 — Attention shapes (MSQ)

**Suppose target length is $T_t$ and source length is $T_s$. Which statements are correct for one cross-attention head? (Select all that apply.)**

- ( ) $Q$ has $T_t$ rows.
- ( ) $K$ has $T_s$ rows.
- ( ) The score matrix has shape $T_t\times T_s$.
- ( ) The score matrix must be square.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A, B and C

#### Step-by-step solution

1. **Analyzing tensor dimensions in cross-attention:**
   - Each target token generates one query vector $\implies Q \in \mathbb{R}^{T_t \times d_k}$ has $T_t$ rows. (Statement A is TRUE).
   - Each source token generates one key vector $\implies K \in \mathbb{R}^{T_s \times d_k}$ has $T_s$ rows. (Statement B is TRUE).
   - The score matrix is formed by multiplying queries by transposed keys:
     $$S = Q K^\top \in \mathbb{R}^{(T_t \times d_k) \times (d_k \times T_s)} = \mathbb{R}^{T_t \times T_s}.$$
     Hence, $S$ has shape $T_t \times T_s$. (Statement C is TRUE).

2. **Why statement D is FALSE:**
   In translation or summarization, the source sentence length ($T_s$) and target sentence length ($T_t$) are almost never identical (e.g., an English sentence of 12 tokens translated to a German sentence of 8 tokens).
   Thus, $T_t \ne T_s$ in general, so the cross-attention score matrix is **rectangular**, not square.

**Memory hook:** Cross-attention score shape is **Target $\times$ Source** ($T_t \times T_s$). $\boxed{\text{A, B, C}}$

</details>

---

### Q12 — Masked scaled-attention forward pass (Numeric Input)

**Let $q=[1,2]$, $k_1=[2,0]$, $k_2=[0,1]$, $k_3=[1,1]$, and $v_1=[2,0]$, $v_2=[0,4]$, $v_3=[9,9]$. Use $d_k=2$, but mask $k_3,v_3$ as a future token. What is the second coordinate of the attention output?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{2}$

#### Step-by-step solution

1. **Step 1: Compute raw dot-product scores ($q \cdot k_i$):**
   - $s_1 = q \cdot k_1 = 1(2) + 2(0) = 2$.
   - $s_2 = q \cdot k_2 = 1(0) + 2(1) = 2$.
   - $s_3 = q \cdot k_3 = 1(1) + 2(1) = 3$.

2. **Step 2: Scale by $\sqrt{d_k} = \sqrt{2}$:**
   - Scaled $s_1 = 2 / \sqrt{2} = \sqrt{2} \approx 1.414$.
   - Scaled $s_2 = 2 / \sqrt{2} = \sqrt{2} \approx 1.414$.
   - Scaled $s_3 = 3 / \sqrt{2} \approx 2.121$.

3. **Step 3: Apply causal mask to forbidden future position 3:**
   The causal mask sets position 3 to $-\infty$:
   $$\text{Scores} = [\sqrt{2}, \sqrt{2}, -\infty].$$

4. **Step 4: Compute softmax weights:**
   Since $s_1 = s_2 = \sqrt{2}$, both unmasked keys have identical scores, while position 3 has $e^{-\infty} = 0$:
   $$\alpha_1 = \frac{e^{\sqrt{2}}}{e^{\sqrt{2}} + e^{\sqrt{2}} + 0} = 0.5, \quad \alpha_2 = 0.5, \quad \alpha_3 = 0.$$

5. **Step 5: Compute weighted sum of values:**
   $$z = 0.5 v_1 + 0.5 v_2 + 0 v_3$$
   $$z = 0.5 \begin{bmatrix} 2 \\ 0 \end{bmatrix} + 0.5 \begin{bmatrix} 0 \\ 4 \end{bmatrix} + 0 \begin{bmatrix} 9 \\ 9 \end{bmatrix} = \begin{bmatrix} 1 \\ 0 \end{bmatrix} + \begin{bmatrix} 0 \\ 2 \end{bmatrix} = \begin{bmatrix} 1 \\ 2 \end{bmatrix}.$$

6. **Extract the second coordinate:**
   The output vector is $[1, 2]$, so its second coordinate is $\boxed{2}$.

**Memory hook:** Mask out future positions ($-\infty$), normalize allowed keys, blend values.

</details>

---

### Q13 — The attention recipe (Short Answer)

**Write the four-part matrix formula for scaled dot-product attention, including the scale factor.**

*(Enter in standard format, e.g.: `softmax(QK^T / sqrt(d_k)) V`)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** `softmax(QK^T / sqrt(d_k)) V`

#### Step-by-step solution

The canonical formula introduced in *“Attention Is All You Need”* (Vaswani et al. 2017) is:

$$\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V$$

Read it step-by-step from inside out:
1. **Query-Key Interaction ($QK^\top$):** Dot product between each query token and all key tokens.
2. **Scaling ($/ \sqrt{d_k}$):** Divides by the square root of key dimensionality to maintain variance $= 1$ and prevent gradient vanishing.
3. **Softmax Normalization:** Converts score rows into non-negative attention weights that sum to $1$.
4. **Value Multiplication ($\times V$):** Computes the final contextual vectors as a weighted mixture of the values.

**Memory hook:** Ask with $Q$, match with $K$, normalize with $\text{softmax}$, retrieve from $V$.

</details>

---

### Q14 — Which object is mixed? (MCQ)

**After the attention weights have been computed, which vectors are averaged to form the output?**

- ( ) Query vectors
- ( ) Key vectors
- ( ) Value vectors
- ( ) Positional vectors only

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** C

#### Step-by-step solution

1. **Roles of Q, K, and V:**
   - **Query ($Q$) & Key ($K$):** Their sole purpose is to compute the similarity weights ($\alpha_{ij}$). Once the attention weight matrix $A = \operatorname{softmax}(QK^\top / \sqrt{d_k})$ is produced, $Q$ and $K$ have finished their job.
   - **Value ($V$):** Contains the actual semantic information (the payload). The output is formed by multiplying the weight matrix by the Value matrix:
     $$Z = A V.$$

2. **Vector summation view:**
   For each token $i$:
   $$z_i = \sum_{j} \alpha_{ij} v_j.$$
   It is a weighted linear combination of the **Value vectors**.

**Memory hook:** $Q$ and $K$ decide **how much** to look; $V$ is **what** is taken. $\boxed{\text{C}}$

</details>

---

### Q15 — Shape-and-mask checkpoint (MSQ)

**For causal self-attention with $B=2$, $h=3$, $T=4$, and $d_h=8$, choose every correct statement. (Select all that apply.)**

- ( ) The score tensor has shape $2\times3\times4\times4$.
- ( ) After concatenating all heads, the attention output has shape $2\times4\times24$ before the output projection.
- ( ) The causal mask blocks $2\times3\times\frac{4(4-1)}2=36$ score cells.
- ( ) Causal attention must reduce the query sequence length from 4 to 3.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A, B and C

#### Step-by-step solution

1. **Analyzing tensor shapes and properties:**
   - **Batch size $B=2$, Number of heads $h=3$, Sequence length $T=4$, Head dimension $d_h=8$.**

2. **Statement A:**
   Each head in each batch example creates a pairwise score matrix between all query positions and all key positions ($T \times T = 4 \times 4$).
   Across all batch items and heads, the score tensor shape is:
   $$(B, h, T, T) = 2 \times 3 \times 4 \times 4.$$
   $\implies$ **Statement A is TRUE.**

3. **Statement B:**
   Each head outputs a tensor of shape $(B, T, d_h) = (2, 4, 8)$.
   Concatenating all $h=3$ heads along the feature axis yields:
   $$(B, T, h \times d_h) = (2, 4, 3 \times 8) = 2 \times 4 \times 24.$$
   $\implies$ **Statement B is TRUE.**

4. **Statement C:**
   In a causal mask, token $i$ can only attend to tokens $j \le i$.
   For a $4 \times 4$ attention grid, the strictly upper triangular entries ($j > i$) are forbidden future tokens:
   $$\text{Masked cells per head} = \frac{T(T-1)}{2} = \frac{4(3)}{2} = 6 \text{ cells.}$$
   Across $B=2$ examples and $h=3$ heads:
   $$\text{Total masked cells} = 2 \times 3 \times 6 = 36.$$
   $\implies$ **Statement C is TRUE.**

5. **Statement D:**
   Attention computes one output vector for every query token. The sequence length remains $T=4$; tokens are never dropped.
   $\implies$ **Statement D is FALSE.**

**Memory hook:** Multi-head causal attention preserves sequence length while strictly masking the upper triangle. $\boxed{\text{A, B, C}}$

</details>

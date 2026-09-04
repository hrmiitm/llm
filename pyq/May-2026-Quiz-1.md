# May-2026-Quiz-1 — Previous Year Question Paper

> **Paper type:** Previous Year Question (PYQ)
> **Source:** Extracted from `llm_question_papers.tex`
> **Coverage:** attention, Transformer tensor shapes, positional encoding, teacher forcing, language-model probabilities, and decoding strategies.

This paper is presented in the same learning-oriented format as the graded assignments. Attempt each question first, then open **Answer & Solution** for the derivation.

---

### Q2 — Traditional Attention (MSQ)

**Which statements are true about traditional attention used in sequence-to-sequence models? (Select all that apply.)**

- ( ) The decoder decides which encoder states are important.
- ( ) Attention weights are computed over all decoder hidden states.
- ( ) The context vector is a weighted sum of encoder states.
- ( ) Encoder hidden states are ignored after encoding.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A and C

#### Step-by-step solution

**Step 1 — Identify the objects in encoder-decoder attention.**

The encoder produces hidden states $h_1,h_2,\ldots,h_T$. At decoder step $t$, the decoder state supplies a query that scores how relevant each encoder state is:

$$e_{t,j} = \operatorname{score}(s_{t-1},h_j),\qquad a_{t,j}=\operatorname{softmax}(e_{t,j}).$$

**Step 2 — Form the context vector.**

The context passed to the decoder is the weighted sum

$$c_t=\sum_{j=1}^{T}a_{t,j}h_j.$$

So the decoder does decide which encoder states matter, and the context vector is a weighted sum of them.

![Attention pipeline](assets/attention-pipeline.mmd)

**Step 3 — Eliminate the false statements.**

- **B is false:** attention weights are computed over encoder states (the keys/values), not over all decoder hidden states.
- **D is false:** encoder states are precisely what attention uses after the encoder has finished.

Therefore, the correct selections are $\boxed{\text{A, C}}$.

</details>

---

## Context for Q3–Q4

Consider the text **“learn easy math”**, consisting of three tokens: `{learn, easy, math}`. The token embeddings are columns of

$$X=\begin{bmatrix}1&0&1\\0&1&1\end{bmatrix}.$$

The projection matrices are

$$W_Q=\begin{bmatrix}1&0\\0&1\end{bmatrix},\qquad W_K=\begin{bmatrix}1&0\\0&1\end{bmatrix},\qquad W_V=\begin{bmatrix}0&1\\1&0\end{bmatrix}.$$

The scaled dot-product attention is

$$\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\left(\frac{Q^{T}K}{\sqrt{d_k}}\right)V^{T}.$$

Based on these data, answer Q3 and Q4.

### Q3 — Diagonal sum of $Q^T K$ (Short Answer)

**Compute $Q^T K$ for the final scaled dot-product attention and submit the sum of the diagonal elements of the $Q^T K$ matrix.**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{4}$

#### Step-by-step solution

**Step 1 — Compute $Q$ and $K$.**

Because both projection matrices are identity matrices,

$$Q=W_QX=X,\qquad K=W_KX=X.$$

Written token-by-token, the vectors are

$$q_{\text{learn}}=k_{\text{learn}}=\begin{bmatrix}1\\0\end{bmatrix},\quad
q_{\text{easy}}=k_{\text{easy}}=\begin{bmatrix}0\\1\end{bmatrix},\quad
q_{\text{math}}=k_{\text{math}}=\begin{bmatrix}1\\1\end{bmatrix}.$$

**Step 2 — Take all query-key dot products.**

The entry in row $i$, column $j$ is $q_i^Tk_j$:

$$Q^TK=X^TX
=\begin{bmatrix}1&0&1\\0&1&1\\1&1&2\end{bmatrix}.$$

**Step 3 — Add the diagonal entries.**

$$\operatorname{tr}(Q^TK)=1+1+2=\boxed{4}.$$

The factor $1/\sqrt{d_k}$ is applied later to scale the scores; it does not change the requested unscaled $Q^TK$ matrix.

</details>

### Q4 — Least attention-score token pair (MCQ)

**Choose the token pair with the least attention score.**

- ( ) `{learn, easy}`
- ( ) `{learn, math}`
- ( ) `{easy, math}`
- ( ) `{learn, learn}`
- ( ) `{easy, easy}`

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A — `{learn, easy}`

#### Step-by-step solution

**Step 1 — Read the relevant dot products.**

From

$$Q^TK=\begin{bmatrix}1&0&1\\0&1&1\\1&1&2\end{bmatrix},$$

the candidate pair scores are:

| Pair | Dot product |
|---|---:|
| learn, easy | $0$ |
| learn, math | $1$ |
| easy, math | $1$ |
| learn, learn | $1$ |
| easy, easy | $1$ |

**Step 2 — Compare the scores.**

The smallest score is $0$, for the pair **learn/easy**. Scaling by the positive number $\sqrt{d_k}$ preserves this ordering, and softmax is monotonic in each score when comparing the same row.

$$\boxed{\text{learn, easy}}$$

</details>

---

### Q5 — Additional attention scores (Short Answer)

**A Transformer processes a sequence containing 6 tokens using Multi-Head Attention. It initially uses 4 heads. If the number of heads is doubled to 8 while the sequence length remains unchanged, how many additional attention scores are computed across all heads?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{144}$

#### Step-by-step solution

**Step 1 — Count scores in one head.**

Self-attention compares every query position with every key position. For sequence length $T=6$, one head forms a $6\times6$ score matrix:

$$6^2=36\text{ scores per head}.$$

**Step 2 — Count the newly added heads.**

The number of heads increases from 4 to 8, so

$$8-4=4\text{ additional heads}.$$

**Step 3 — Multiply.**

$$4\times36=\boxed{144}\text{ additional scores}.$$

The query/key projection size can change the cost of computing each score, but it does not change the number of entries in the score matrices for a fixed $T$.

</details>

---

### Q6 — Output tensor volume (Short Answer)

**A batch of 8 sentences passes through a 6-layer Transformer Encoder with 8 attention heads. After padding, each sentence has maximum length 32 and $d_{model}=128$. What is the total number of elements in the output tensor produced by the final encoder layer for the entire batch?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{32768}$

#### Step-by-step solution

**Step 1 — Write the output shape.**

The final encoder layer returns one $d_{model}$-dimensional vector for each token in each sentence. Thus the batch output shape is

$$B\times T\times d_{model}=8\times32\times128.$$

**Step 2 — Compute the volume.**

$$8\times32=256,\qquad 256\times128=\boxed{32768}.$$

The 6 layers and 8 heads affect the computation used to produce the output, but not the final tensor shape.

</details>

---

### Q7 — Entries masked by a causal mask (Short Answer)

**A masked multi-head attention layer uses context length $T=128$. How many entries in the causal mask are set to $-\infty$?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{8128}$

#### Step-by-step solution

**Step 1 — Identify future positions.**

At row $i$, the query at position $i$ must not attend to positions $j>i$. The masked entries form the strict upper triangle of a $T\times T$ matrix.

**Step 2 — Count the triangle.**

The first row has $127$ future positions, the next has $126$, and so on down to $0$:

$$127+126+\cdots+1+0=\frac{128\times127}{2}.$$

**Step 3 — Evaluate.**

$$\frac{128\times127}{2}=64\times127=\boxed{8128}.$$

The vocabulary size and $d_{model}$ do not affect the number of entries in the $T\times T$ causal mask.

</details>

---

### Q8 — Positional-encoding norm (Short Answer)

**For $d_{model}=512$, compute the squared Euclidean norm of the sinusoidal positional-encoding vector for $pos=3$.**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{256}$

#### Step-by-step solution

**Step 1 — Pair the dimensions.**

Since $d_{model}=512$, there are $512/2=256$ sine/cosine pairs. For each $i$ define

$$\theta_i=\frac{3}{10000^{2i/512}}.$$

The two coordinates in that pair are $\sin(\theta_i)$ and $\cos(\theta_i)$.

**Step 2 — Use the Pythagorean identity.**

Each pair contributes

$$\sin^2(\theta_i)+\cos^2(\theta_i)=1.$$

**Step 3 — Sum all pairs.**

$$\lVert PE(3)\rVert_2^2=256\times1=\boxed{256}.$$

The actual value of $pos$ changes the coordinates, but not this squared norm.

</details>

---

### Q9 — Teacher forcing (MCQ)

**Consider the following statements about teacher forcing in autoregressive sequence-to-sequence training.**

**Statement 1:** Teacher forcing passes the input token to a larger Teacher model whose output becomes the next token.
**Statement 2:** Teacher forcing helps prevent compounding early incorrect predictions that can destabilize training.

- ( ) Statement 1 is true but Statement 2 is false.
- ( ) Statement 1 is false but Statement 2 is true.
- ( ) Both statements are true.
- ( ) Both statements are false.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B — Statement 1 is false but Statement 2 is true.

#### Step-by-step solution

**Step 1 — Define teacher forcing correctly.**

During training, the decoder receives the **ground-truth previous target token**, even if its own previous prediction would have been wrong:

$$y_{t-1}^{\text{input}}=y_{t-1}^{\text{true}}.$$

There is no requirement for a separate, larger “Teacher” model. Thus Statement 1 is false.

**Step 2 — Explain the stabilizing effect.**

If the model fed its own prediction back during early training, one error could become the input to the next step, producing a chain of increasingly unreliable inputs. Ground-truth prefixes prevent this compounding during training, so Statement 2 is true.

$$\boxed{\text{Statement 1: False; Statement 2: True}}$$

</details>

---

## Context for Q10–Q12

The language model generates three word tokens after `<START>`. The table shows the relevant conditional probabilities; the actual vocabulary may be larger.

| From | To | Probability |
|---|---|---:|
| `<START>` | i | 0.5 |
| `<START>` | you | 0.4 |
| i | like | 0.6 |
| i | eat | 0.3 |
| you | like | 0.4 |
| you | eat | 0.5 |
| i like | apples | 0.7 |
| i like | bananas | 0.2 |
| i eat | apples | 0.4 |
| i eat | bananas | 0.6 |
| you like | apples | 0.4 |
| you like | bananas | 0.5 |
| you eat | apples | 0.9 |
| you eat | bananas | 0.1 |

![Language-model probability tree](assets/decoder-search.mmd)

### Q10 — Probability of “you eat apples” (Short Answer)

**Compute the joint probability of the sentence “you eat apples”. Give the answer to two digits after the decimal.**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{0.18}$

#### Step-by-step solution

**Step 1 — Apply the chain rule.**

For a three-token sequence,

$$P(y_1,y_2,y_3)=P(y_1\mid\text{START})P(y_2\mid y_1)P(y_3\mid y_1,y_2).$$

**Step 2 — Substitute the table values.**

For `you eat apples`:

$$P(\text{you})=0.4,\quad P(\text{eat}\mid\text{you})=0.5,\quad P(\text{apples}\mid\text{you eat})=0.9.$$

**Step 3 — Multiply the factors.**

$$0.4\times0.5\times0.9=0.20\times0.9=\boxed{0.18}.$$

</details>

### Q11 — Most probable listed sentence (MCQ)

**Choose the option corresponding to the sentence with the highest joint probability.**

- ( ) `i eat apples`
- ( ) `apples like you`
- ( ) `i eat bananas`
- ( ) `you like bananas`
- ( ) `you like apples`

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** C — `i eat bananas`

#### Step-by-step solution

Compute each listed valid path using the chain rule:

| Sentence | Product | Joint probability |
|---|---|---:|
| `i eat apples` | $0.5\times0.3\times0.4$ | 0.060 |
| `i eat bananas` | $0.5\times0.3\times0.6$ | **0.090** |
| `you like bananas` | $0.4\times0.4\times0.5$ | 0.080 |
| `you like apples` | $0.4\times0.4\times0.4$ | 0.064 |

`apples like you` is not represented as a valid path in the supplied tree. Among the listed valid sentences, $0.090$ is the largest.

$$\boxed{\text{C — i eat bananas}}$$

</details>

### Q12 — $P(\text{apples}\mid\text{like})$ (Short Answer)

**Using the probability tree, calculate $P(\text{apples}\mid\text{like})$. Submit $-1$ if the information is insufficient.**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{-1}$

#### Step-by-step solution

**Step 1 — Inspect the conditioning history.**

The table gives two different `like` histories:

$$P(\text{apples}\mid\text{i like})=0.7,
\qquad P(\text{apples}\mid\text{you like})=0.4.$$

**Step 2 — Notice the missing condition.**

The probability $P(\text{apples}\mid\text{like})$ does not specify whether the previous subject was `i` or `you`. These two histories have different values, so a unique conditional probability cannot be recovered.

**Step 3 — Return the specified sentinel value.**

Because the supplied information is insufficient,

$$\boxed{-1}.$$

</details>

---

### Q13 — GPT decoder-layer components (MSQ)

**Which components are found within a GPT decoder layer? (Select all that apply.)**

- ( ) Causal (masked) multi-head self-attention
- ( ) Position-wise feed-forward network
- ( ) Multi-head cross-attention
- ( ) Recurrent neural network (RNN) layer
- ( ) Add & Norm layer

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A, B, and E

#### Step-by-step solution

**Step 1 — Recall the GPT block.**

GPT is decoder-only. A standard block contains causal self-attention followed by a position-wise feed-forward network, with residual connections and layer normalization around the sublayers.

**Step 2 — Check each option.**

| Option | Present? | Reason |
|---|:---:|---|
| A | ✓ | Causal masking prevents a token from seeing future tokens. |
| B | ✓ | The FFN transforms each position after attention. |
| C | ✗ | Cross-attention needs a separate encoder and is not part of GPT's decoder-only block. |
| D | ✗ | GPT uses Transformer sublayers, not an RNN layer. |
| E | ✓ | Residual addition and normalization stabilize each sublayer. |

$$\boxed{\text{A, B, E}}$$

</details>

---

## Context for Q14–Q17

The table gives the conditional probability of each vocabulary token at each decoding timestep. For all calculations, use only the seven listed tokens as the vocabulary.

| Token | $t=1$ | $t=2$ | $t=3$ | $t=4$ | $t=5$ | $t=6$ |
|---|---:|---:|---:|---:|---:|---:|
| abandoned | 0.12 | 0.05 | 0.05 | 0.30 | 0.10 | 0.40 |
| but | 0.05 | 0.05 | 0.10 | 0.07 | 0.45 | 0.20 |
| castle | 0.05 | 0.40 | 0.10 | 0.02 | 0.05 | 0.05 |
| historic | 0.38 | 0.30 | 0.10 | 0.20 | 0.15 | 0.15 |
| majestic | 0.05 | 0.05 | 0.10 | 0.35 | 0.10 | 0.10 |
| the | 0.30 | 0.05 | 0.05 | 0.03 | 0.05 | 0.05 |
| was | 0.05 | 0.10 | 0.50 | 0.03 | 0.10 | 0.05 |

### Q14 — Greedy sequence probability (Short Answer)

**Use greedy decoding to determine the most likely sequence of six tokens and compute its probability. Round to three decimal places.**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{0.005}$

#### Step-by-step solution

**Step 1 — Choose the largest probability in each column.**

| Timestep | Largest probability | Greedy token |
|---:|---:|---|
| 1 | 0.38 | historic |
| 2 | 0.40 | castle |
| 3 | 0.50 | was |
| 4 | 0.35 | majestic |
| 5 | 0.45 | but |
| 6 | 0.40 | abandoned |

Thus the greedy sequence is **historic castle was majestic but abandoned**.

**Step 2 — Multiply the selected probabilities.**

$$P=0.38\times0.40\times0.50\times0.35\times0.45\times0.40.$$

Progressively,

$$0.38\times0.40=0.152,\quad 0.152\times0.50=0.076,$$
$$0.076\times0.35=0.0266,\quad 0.0266\times0.45=0.01197,$$
$$0.01197\times0.40=0.004788.$$

Rounded to three decimal places,

$$\boxed{0.005}.$$

</details>

### Q15 — Exhaustive-search decoder runs (Short Answer)

**Use exhaustive search to identify the most probable sequence of four tokens. How many decoder runs are required in total?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{2800}$

#### Step-by-step solution

**Step 1 — Count the choices at each depth.**

The vocabulary contains $V=7$ tokens. An exhaustive decoder tree has:

- $7$ one-token prefixes;
- $7^2=49$ two-token prefixes;
- $7^3=343$ three-token prefixes;
- $7^4=2401$ complete four-token sequences.

**Step 2 — Count one decoder run per generated prefix.**

Each node is produced by one autoregressive decoder forward pass. Therefore the total number of runs is

$$\sum_{t=1}^{4}V^t=7+49+343+2401.$$

**Step 3 — Add the levels.**

$$7+49=56,\quad 343+2401=2744,\quad 56+2744=\boxed{2800}.$$

The $2401$ figure is only the number of complete sequences; the question asks for the total decoder runs across all prefix levels.

</details>

### Q16 — Top-$k$ probability at $t=4$ (Short Answer)

**Use top-$k$ sampling at timestep $t=4$ with $k=3$. Compute the renormalized probability of the most probable candidate. Round to three decimal places.**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{0.412}$

#### Step-by-step solution

**Step 1 — Rank the $t=4$ probabilities.**

At $t=4$ the largest three values are:

| Candidate | Original probability |
|---|---:|
| majestic | 0.35 |
| abandoned | 0.30 |
| historic | 0.20 |

**Step 2 — Compute the retained probability mass.**

$$Z_{top-3}=0.35+0.30+0.20=0.85.$$

**Step 3 — Renormalize the most probable token.**

$$P_{top-3}(\text{majestic})=\frac{0.35}{0.85}=0.411764\ldots\approx\boxed{0.412}.$$

Do not divide by $k$; top-$k$ renormalizes by the sum of the retained probabilities.

</details>

### Q17 — Beam width for a target sequence (Short Answer)

**For the sequence “the castle was abandoned”, what is the minimum beam width required to guarantee that the sequence is retained during beam search at timestep $t=4$?**

*(Numeric input)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{5}$

#### Step-by-step solution

**Step 1 — Rank prefixes, not individual next tokens.**

Beam search keeps complete *prefixes* by their joint probability. Looking only at the rank of `the`, `castle`, `was`, or `abandoned` in its own column is not enough, because a stronger earlier prefix can combine with another high-probability next token.

The target prefix probabilities are

$$
P(\texttt{the})=0.30,\quad
P(\texttt{the castle})=0.30(0.40)=0.12,
$$
$$
P(\texttt{the castle was})=0.12(0.50)=0.06,\quad
P(\texttt{the castle was abandoned})=0.06(0.30)=0.018.
$$

**Step 2 — Check the target prefix's rank at every depth.**

| Depth | Target prefix probability | Rank among all prefixes at that depth |
|---:|---:|---:|
| 1 | 0.300 | 2 |
| 2 | 0.120 | 2 |
| 3 | 0.060 | 2 |
| 4 | 0.018 | 5 |

At depth 4, four prefixes outrank the target: `historic castle was majestic` (0.0266), `historic castle was abandoned` (0.0228), `the castle was majestic` (0.0210), and `historic historic was majestic` (0.01995).

**Step 3 — Use the worst prefix rank.**

A width-4 beam drops the target at depth 4; a width-5 beam retains it. Therefore the minimum width that guarantees this target remains in the beam is

$$\boxed{5}.$$

</details>

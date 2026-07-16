# Weeks 3–4 Learning Notes — GPT, Decoding, and BERT

These notes explain the ideas used in [Graded Assignment 3](ga3.md) and [Graded Assignment 4](ga4.md). They assume you know the basic attention mechanism from the [Weeks 1–2 learning notes](week1-week2-learning-notes.md).

> **Best study order:** Begin with positional information and causal masking, then learn GPT training and generation. Finish with BERT's masked-language objective and classification workflow.

## Start here — GPT and BERT solve different learning problems

| Model | Attention direction | Main pre-training objective | Typical strength |
|---|---|---|---|
| GPT | Causal: earlier tokens only | Predict the next token | Text generation |
| BERT | Bidirectional: both sides | Predict masked tokens | Understanding and classification |

GPT asks, “Given everything before this position, what comes next?” BERT asks, “Given the surrounding context on both sides, what belongs in this masked position?”

## 1. Why transformers need positional information

Self-attention alone compares token content. Without positional information, it does not inherently know whether a token came first, second, or last.

Transformers therefore combine a word embedding $x_{\text{pos}}$ with a positional vector $p_{\text{pos}}$:

$\displaystyle h_{\text{pos}}=x_{\text{pos}}+p_{\text{pos}}.$

The two vectors must have the same dimension $d_{\text{model}}$.

## 2. Sinusoidal positional encoding

The original transformer uses fixed sine and cosine waves:

$\displaystyle PE(\text{pos},2i)=\sin\!\left(\frac{\text{pos}}{10000^{2i/d_{\text{model}}}}\right),$

$\displaystyle PE(\text{pos},2i+1)=\cos\!\left(\frac{\text{pos}}{10000^{2i/d_{\text{model}}}}\right).$

### 2.1 How to calculate it

For $d_{\text{model}}=6$, the dimensions form three sine/cosine pairs:

- dimensions 0 and 1 use $i=0$;
- dimensions 2 and 3 use $i=1$;
- dimensions 4 and 5 use $i=2$.

For position 4:

$\displaystyle p=[\sin(4),\cos(4),\sin(4/10000^{1/3}),\cos(4/10000^{1/3}),\sin(4/10000^{2/3}),\cos(4/10000^{2/3})].$

### 2.2 Intuition

Different dimensions oscillate at different speeds:

- low-index dimensions change quickly and distinguish nearby positions;
- high-index dimensions change slowly and preserve information across longer distances.

Together they create a unique, smooth positional signature. Relative position information can also be inferred from relationships between sine and cosine values.

### 2.3 Practical calculation checklist

1. Obtain $d_{\text{model}}$ from the embedding length.
2. Pair even and odd dimensions using the same $i$.
3. Use radians, not degrees.
4. Add $p$ element-wise to $x$.
5. Round only after the final sum.

## 3. Learned positional embeddings and their shape

Some models learn a table instead of using sine and cosine:

$\displaystyle P\in\mathbb{R}^{T\times d_{\text{model}}}.$

There is one row for each possible position and one column for each hidden feature. If $T=64$ and $d_{\text{model}}=128$, the shape is $64\times128$.

Do not confuse this with:

- vocabulary embedding shape $|V|\times d_{\text{model}}$;
- attention-head projection shape $d_{\text{model}}\times d_k$;
- causal-mask shape $T\times T$.

## 4. Causal attention masks

GPT must not see future tokens while predicting the next token. Before softmax, it adds a causal mask $M$ to the attention scores:

$\displaystyle \operatorname{Attention}(Q,K,V)=\operatorname{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}+M\right)V.$

For positions indexed from 0:

$\displaystyle M_{ij}=\begin{cases}0,&j\le i,\\-\infty,&j>i.\end{cases}$

The $-\infty$ entries become zero probability after softmax.

### 4.1 Mask shape

For one head,

$\displaystyle Q\in\mathbb{R}^{T\times d_k},\qquad K^{\top}\in\mathbb{R}^{d_k\times T}.$

Therefore,

$\displaystyle QK^{\top}\in\mathbb{R}^{T\times T},$

so the mask must also be $T\times T$. Batch and head dimensions may be added in implementations and broadcast over this base mask.

### 4.2 Right-to-left languages

The causal mask depends on **sequence index order**, not the visual writing direction of a language. Tokenize an RTL sentence in its natural generation order and assign positions $0,1,2,\ldots$. Position $i$ still attends only to earlier indices.

Therefore, the ordinary causal mask does not need horizontal or vertical flipping merely because the text is displayed right to left.

## 5. GPT pre-training and fine-tuning

### 5.1 Causal language modelling

GPT pre-training minimizes next-token negative log-likelihood:

$\displaystyle \mathcal{L}_{\text{CLM}}=-\sum_{t=1}^{T}\log P(x_t\mid x_0,\ldots,x_{t-1}).$

Training text supplies its own targets: the next token is the label. This makes large-scale pre-training possible without manually labelled examples.

### 5.2 Pre-training

- Model weights normally begin from random initialization.
- The model sees a very large general text corpus.
- It learns language patterns, facts, syntax, and useful internal features.

### 5.3 Fine-tuning

- Initialization comes from pre-trained weights, not random weights.
- A smaller task-specific dataset is used.
- The loss depends on the task, such as classification cross-entropy.

In modern practice, some fine-tuning is also generative or self-supervised. For course questions, follow the stated supervised downstream-task setting.

## 6. Weight tying and rare-word updates

With weight tying, the input embedding and output projection share a matrix $E$:

$\displaystyle \text{logits}=hE^{\top}.$

An absent word receives no gradient through an input lookup because its row was not selected. However, the same row participates in the output softmax as a candidate vocabulary word.

For vocabulary word $w$:

$\displaystyle \frac{\partial L}{\partial E_w}\supseteq (P(w)-\mathbf{1}[w=y])h.$

Because full softmax assigns positive probability to every finite logit, the output-projection gradient is generally dense. Thus a rare word can be updated even when it never appears as an input token in the current batch.

> **Key distinction:** sparse input lookup does not imply sparse output-softmax gradients when the weights are tied.

## 7. Per-head projection shapes

If $d_{\text{model}}=128$ and there are 4 equal heads, then

$\displaystyle d_k=d_v=\frac{128}{4}=32.$

Each per-head query projection maps the full model vector to one head:

$\displaystyle W_Q^i\in\mathbb{R}^{128\times32}.$

Shape verification:

$\displaystyle X_{64\times128}W_{Q,128\times32}^i=Q_{64\times32}^i.$

The middle dimensions match, and the output has one 32-dimensional query per position.

## 8. Autoregressive sequence probability

The chain rule factors a token sequence probability as

$\displaystyle P(y_1,\ldots,y_T\mid y_0)=\prod_{t=1}^{T}P(y_t\mid y_0,\ldots,y_{t-1}).$

To calculate it from a probability table:

1. map each target token to its vocabulary index;
2. select the correct row for each conditional context;
3. read each token probability;
4. multiply all factors.

Long sequences have small raw probabilities because many numbers below 1 are multiplied. In real systems, log probabilities are preferred:

$\displaystyle \log P(\text{sequence})=\sum_t\log P(y_t\mid y_{<t}).$

### 8.1 Greedy-path tables

Some coursework tables provide distributions only along the greedily generated path. In that setup, later rows are conditioned on earlier greedy choices. If a proposed sequence deviates, later conditional rows for that alternative history are unavailable.

Follow the question's convention: it may treat a non-greedy path as impossible under the displayed greedy decoding procedure, even though the underlying language model could assign it nonzero probability if recomputed with that history.

## 9. Decoding strategies

### 9.1 Greedy search

$\displaystyle y_t=\arg\max_wP(w\mid y_{<t}).$

Greedy search is fast and deterministic but can choose repetitive or locally attractive continuations.

### 9.2 Top-$k$ sampling

Keep only the $k$ tokens with highest probability and renormalize them. If $S_k$ is that set:

$\displaystyle P_k(w)=\begin{cases}\dfrac{P(w)}{\sum_{u\in S_k}P(u)},&w\in S_k,\\0,&w\notin S_k.\end{cases}$

Example: top-3 probabilities $0.41,0.14,0.09$ sum to $0.64$. The renormalized probability of the first token is

$\displaystyle 0.41/0.64=0.640625.$

The denominator is the **sum of the retained probabilities**, not the number $k$.

### 9.3 Top-$p$ or nucleus sampling

Top-$p$ keeps the smallest ranked set whose cumulative probability reaches a threshold $p$. The candidate count adapts to the model's uncertainty.

### 9.4 Degeneration

Degenerative output may be:

- repetitive: “like like like”;
- stuck in a loop;
- grammatically broken;
- semantically incoherent.

Sampling, repetition penalties, and carefully chosen decoding settings can reduce—but not completely eliminate—degeneration.

## 10. BERT and masked language modelling

BERT uses bidirectional self-attention. A masked position can use context on both its left and right.

### 10.1 Masked language modelling objective

Selected tokens are replaced or otherwise corrupted, and BERT predicts their original identities. Only selected prediction positions contribute to the MLM loss:

$\displaystyle \mathcal{L}_{\text{MLM}}=-\sum_{m\in\mathcal{M}}\log P(x_m\mid x_{\setminus\mathcal{M}}).$

Here $\mathcal{M}$ is the set of masked positions.

### 10.2 Worked loss calculation

If the true-token probabilities at two masked positions are $0.14$ and $0.23$:

$\displaystyle \mathcal{L}=-\ln(0.14)-\ln(0.23).$

$\displaystyle \mathcal{L}\approx1.9661+1.4697=3.4358\approx3.44.$

Do not include loss from visible, unmasked tokens unless the question explicitly defines a different objective. Also check whether the requested loss is a **sum** or an **average**.

## 11. BERT special tokens and classification

### 11.1 [CLS]

[CLS] is placed at the beginning of a sequence. Through bidirectional attention, its final hidden state can collect information from the whole input.

The standard BERT sentence-classification pipeline is

`input tokens → BERT → final [CLS] representation → classifier → label probabilities`.

### 11.2 [SEP]

[SEP] marks sequence boundaries or separates sentence pairs. It is not the conventional pooled representation for sentence-level classification.

### 11.3 A practical nuance

Other pooling methods—mean pooling or task-specific attention pooling—are technically possible. When a course question asks for the standard original-BERT feature used for classification, choose the final [CLS] representation.

## 12. Question-solving checklists

### For positional encoding

1. Find position and $d_{\text{model}}$.
2. Pair dimensions $(0,1),(2,3),\ldots$.
3. Use one $i$ per pair.
4. Evaluate sine/cosine in radians.
5. Add element-wise and round at the end.

### For mask or projection shape

1. Write the multiplication symbolically.
2. Match inner dimensions.
3. Use $T\times T$ for the base causal mask.
4. Use $d_{\text{model}}\times d_k$ for a per-head query/key projection.

### For sequence probability

1. Confirm the exact conditioning history for each row.
2. Map tokens to vocabulary columns.
3. Multiply conditional probabilities or sum log probabilities.
4. Do not use a row conditioned on a different history.

### For top-$k$

1. Sort or identify the $k$ largest probabilities.
2. Add those $k$ values to obtain $Z$.
3. Divide each retained probability by $Z$.
4. Assign zero to excluded tokens.

### For MLM loss

1. Locate masked positions.
2. Identify each original true token.
3. Read its predicted probability from the correct row and column.
4. Compute $-\ln p$ for each.
5. Sum or average as requested.

## 13. Common mistakes

- Using degrees instead of radians in sinusoidal embeddings.
- Giving a positional table shape of $T\times n_h$ instead of $T\times d_{\text{model}}$.
- Flipping a causal mask because the language is visually right-to-left.
- Randomly reinitializing pre-trained weights during ordinary fine-tuning.
- Assuming absent input words cannot receive a tied output-layer gradient.
- Treating $d_k$ as the causal-mask dimension.
- Dividing a top-$k$ probability by $k$ instead of renormalizing by retained mass.
- Adding MLM loss for every input position.
- Treating [SEP] as the standard sentence-classification representation.

## 14. You are ready when you can explain these aloud

- Why positional information is necessary.
- Why a causal mask is $T\times T$ and independent of writing direction.
- How pre-training differs from fine-tuning.
- How tied embeddings let absent input words receive output gradients.
- How greedy, top-$k$, and top-$p$ decoding differ.
- How to factor a sequence probability.
- Why BERT computes MLM loss only at selected positions.
- Why [CLS] is used for standard sentence-level classification.

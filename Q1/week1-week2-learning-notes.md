# Weeks 1–2 Learning Notes — Transformers from the Beginning

These notes explain the ideas used in [Graded Assignment 1](ga1.md) and [Graded Assignment 2](ga2.md). Read them in order the first time. The goal is not only to remember formulas, but to understand what every matrix and number represents.

> **Best study order:** Sections 1–5 build the transformer forward pass. Sections 6–9 cover parameter counting, probabilities, decoding, gradients, and hyperparameters. Finish with the checklists in Sections 10–11.

## Start here — the central picture

A transformer repeatedly performs the following operations:

1. Convert token IDs into embedding vectors.
2. Add position information.
3. Create query, key, and value vectors.
4. Use query–key similarity to decide what each token should attend to.
5. Mix value vectors using those attention weights.
6. Pass the result through an FFN, residual connection, and LayerNorm.

For machine translation, an **encoder** builds representations of the source sentence. A **decoder** then generates the target sentence one token at a time while attending to both its earlier outputs and the encoder representations.

## 1. Tokens, context length, batches, and embeddings

### 1.1 Tokens are the model's basic input units

A model does not directly read a sentence as human-readable text. A tokenizer breaks it into tokens and gives each token an integer ID.

For example, a word-level tokenizer might produce:

`They | have | much | to | learn`

This sequence has 5 tokens. A subword tokenizer may split the same sentence differently, so always use the tokenization shown or implied by the question.

### 1.2 Context length

The context length $T$ is the maximum number of token positions processed together.

If a batch contains sequences of lengths $5,6,5,$ and $8$, then the minimum context length that avoids truncation is

```math
T=\max(5,6,5,8)=8.
```

Shorter sequences are normally padded to length 8. Padding creates equal tensor sizes; an attention mask prevents padding tokens from affecting useful tokens.

### 1.3 Embedding lookup

An embedding matrix stores one learned vector for every vocabulary item:

```math
E\in\mathbb{R}^{|V|\times d_{\text{model}}}.
```

Here:

- $|V|$ is the vocabulary size;
- $d_{\text{model}}$ is the embedding or hidden dimension;
- row $E_i$ is the vector for token ID $i$.

For a vocabulary of 1000 words and embedding dimension 64, the source embedding contains

```math
1000\times64=64{,}000
```

trainable parameters.

### 1.4 Batch tensor shape

The usual batch-first encoder input shape is

```math
(B,T,d_{\text{model}}),
```

where $B$ is batch size. With 4 sequences, context length 8, and embeddings of dimension 256, the shape is

```math
(4,8,256).
```

> **Shape habit:** say the meaning of every axis before inserting numbers. This prevents mixing up sequence length, embedding size, and head size.

## 2. Query, key, and value — an intuitive view

Every token creates three different representations:

- **Query $q$:** what information is this token looking for?
- **Key $k$:** what information does this token offer?
- **Value $v$:** what content should be passed forward if this token is selected?

For input matrix $H\in\mathbb{R}^{T\times d_{\text{model}}}$:

```math
Q=HW_Q,\qquad K=HW_K,\qquad V=HW_V.
```

For one head, the projection shapes are commonly

```math
W_Q,W_K\in\mathbb{R}^{d_{\text{model}}\times d_k},\qquad W_V\in\mathbb{R}^{d_{\text{model}}\times d_v}.
```

Therefore,

```math
Q,K\in\mathbb{R}^{T\times d_k},\qquad V\in\mathbb{R}^{T\times d_v}.
```

## 3. Self-attention calculation, step by step

### 3.1 Similarity scores

Token $i$ compares its query $q_i$ with every key $k_j$ using a dot product:

```math
e_{ij}=\frac{q_i k_j^{\top}}{\sqrt{d_k}}.
```

A larger score means key $j$ is more relevant to query $i$. Some assignment questions explicitly say to ignore the $\sqrt{d_k}$ scaling; follow the question.

### 3.2 Softmax turns scores into weights

For a fixed query $i$:

```math
a_{ij}=\frac{e^{e_{ij}}}{\sum_{r=1}^{T}e^{e_{ir}}}.
```

The weights satisfy

```math
a_{ij}>0,\qquad \sum_j a_{ij}=1.
```

Softmax preserves score order: if $e_{i1}>e_{i3}>e_{i2}$, then $a_{i1}>a_{i3}>a_{i2}$. Therefore, if a question asks only which token receives the most attention, comparing raw scores is enough.

### 3.3 Weighted sum of values

The output for query position $i$ is

```math
z_i=\sum_{j=1}^{T}a_{ij}v_j.
```

This is a weighted average of information from all value vectors. A token with a high attention weight contributes more strongly to $z_i$.

### 3.4 Worked interpretation

Suppose the scores for a query are

```math
e_i=[2.6875,0.2375,1.775].
```

Softmax gives approximately

```math
a_i=[0.672,0.058,0.270].
```

The first token receives the greatest attention because it has the largest score and weight. Equal attention would require equal scores, which would produce $[1/3,1/3,1/3]$.

## 4. Multi-head attention

A single attention head learns one pattern. Multiple heads let the model learn several relationships at once—for example, syntax, nearby words, and long-distance coreference.

For $n_h$ heads:

```math
\text{head}_i=\text{Attention}(Q_i,K_i,V_i).
```

The heads are concatenated and projected:

```math
\text{MHA}(H)=\text{Concat}(\text{head}_1,\ldots,\text{head}_{n_h})W_O.
```

Usually $n_h d_v=d_{\text{model}}$, so

```math
W_O\in\mathbb{R}^{(n_h d_v)\times d_{\text{model}}}.
```

If $d_{\text{model}}=256$, $n_h=4$, and each head has $d_k=d_v=64$, concatenation returns $4\times64=256$ features.

## 5. Encoder and decoder blocks

### 5.1 Encoder layer

A standard encoder layer contains:

1. multi-head self-attention;
2. residual connection and LayerNorm;
3. position-wise FFN;
4. another residual connection and LayerNorm.

Encoder self-attention is normally bidirectional: every real token may attend to every other real token.

### 5.2 Decoder layer

A standard encoder–decoder transformer decoder layer contains:

1. masked self-attention over earlier target tokens;
2. cross-attention to encoder outputs;
3. an FFN;
4. one residual/LayerNorm stage after each sub-layer.

The decoder therefore has two attention modules per layer, while the encoder has one.

### 5.3 Cross-attention shapes

In cross-attention:

- queries come from decoder states;
- keys and values come from encoder outputs.

If the target length is $T_t$ and source length is $T_s$, the score matrix has shape

```math
T_t\times T_s.
```

It need not be square. A self-attention matrix is square only because queries and keys come from the same sequence length.

## 6. Parameter counting without confusion

Parameter questions become easy when every matrix is listed once.

### 6.1 One multi-head attention module

If each head has separate projections and biases are excluded:

```math
P_{QKV}=n_h\bigl(d_{\text{model}}d_q+d_{\text{model}}d_k+d_{\text{model}}d_v\bigr).
```

The output projection contributes

```math
P_O=(n_h d_v)d_{\text{model}}.
```

When $d_q=d_k=d_v=d_h$:

```math
P_{\text{MHA}}=3n_hd_{\text{model}}d_h+n_hd_hd_{\text{model}}.
```

With $d_{\text{model}}=64$, $n_h=4$, and $d_h=16$:

```math
P_{\text{MHA}}=3(4)(64)(16)+(64)(64)=16{,}384.
```

### 6.2 Feed-forward network

The transformer FFN expands and then contracts each token independently:

```math
d_{\text{model}}\rightarrow d_{ff}\rightarrow d_{\text{model}}.
```

Without biases:

```math
P_{\text{FFN}}=d_{\text{model}}d_{ff}+d_{ff}d_{\text{model}}=2d_{\text{model}}d_{ff}.
```

For $64\rightarrow256\rightarrow64$:

```math
P_{\text{FFN}}=2(64)(256)=32{,}768.
```

### 6.3 LayerNorm

LayerNorm usually has a learned scale $\gamma$ and shift $\beta$, each with $d_{\text{model}}$ elements:

```math
P_{\text{LN}}=2d_{\text{model}}.
```

For $d_{\text{model}}=64$, one LayerNorm has 128 parameters.

### 6.4 Layer totals

Without projection or FFN biases:

```math
P_{\text{encoder layer}}=P_{\text{MHA}}+P_{\text{FFN}}+2P_{\text{LN}},
```

```math
P_{\text{decoder layer}}=2P_{\text{MHA}}+P_{\text{FFN}}+3P_{\text{LN}}.
```

Multiply each by the number of corresponding layers only after finding the one-layer total.

### 6.5 Embedding and output layers

Source embedding:

```math
P_{\text{src embed}}=|V_s|d_{\text{model}}.
```

Target output projection without bias:

```math
P_{\text{output}}=d_{\text{model}}|V_t|.
```

Read the question carefully: it may exclude embeddings, output layers, or biases.

## 7. Probabilities and insufficient information

A softmax distribution over the entire vocabulary sums to 1:

```math
\sum_{w\in V}P(w)=1.
```

Suppose three named words have probabilities $0.55$, $0.15$, and $0.20$. Their sum is $0.90$, leaving $0.10$ for every other vocabulary item together.

You cannot assign that entire $0.10$ to one particular missing word unless the question states that it is the only remaining word. If the vocabulary has many other tokens, the individual probability is insufficiently specified.

> **Practical test:** ask whether the unknown is the only missing category. If several categories share the remaining mass, one token's probability cannot be recovered.

## 8. Autoregressive decoding and teacher forcing

### 8.1 Autoregressive generation

At inference time, the decoder produces one new token per run:

```math
P(y_t\mid y_0,y_1,\ldots,y_{t-1}).
```

To generate 4 target tokens while ignoring the end token, at least 4 decoder runs are required.

### 8.2 Teacher forcing

During training, teacher forcing supplies the true earlier target tokens to the decoder. This allows all target positions to be trained in parallel under a causal mask.

At inference time, the true future target is unavailable, so the decoder feeds back its own generated tokens and runs repeatedly.

### 8.3 Greedy decoding

Greedy decoding chooses

```math
y_t=\arg\max_w P(w\mid y_{\lt t}).
```

It is fast and deterministic, but a locally best token is not guaranteed to produce the globally best sequence.

## 9. Gradients through softmax attention

For $a=\text{softmax}(e)$, the Jacobian is

```math
\frac{\partial a_j}{\partial e_i}=a_j(\delta_{ij}-a_i).
```

If $g_j=\partial L/\partial a_j$, then

```math
\frac{\partial L}{\partial e_i}=a_i\left(g_i-\sum_j a_jg_j\right).
```

An important property is

```math
\sum_i\frac{\partial L}{\partial e_i}=0.
```

Why? Adding the same constant to every logit does not change softmax. Therefore, the loss has no gradient in the all-ones direction.

For attention output $z_i=\sum_j a_{ij}v_j$ and upstream gradient $\partial L/\partial z_i$:

```math
\frac{\partial L}{\partial a_{ij}}=\frac{\partial L}{\partial z_i}\cdot v_j^{\top}.
```

The reliable chain is:

`loss → attention output z → weights a → scores e`

## 10. Hyperparameters versus derived quantities

A **parameter** is learned during training, such as an embedding value or weight matrix entry.

A **hyperparameter** is chosen before training, such as:

- vocabulary construction and size;
- $d_{\text{model}}$, $d_k$, $d_v$, and $d_q$;
- number of heads and layers;
- FFN hidden size;
- learning rate and warm-up steps.

A **derived quantity** follows from other choices. For example, an attention mask has shape $T\times T$ because the context length is $T$; its size is not an independent model choice.

## 11. Question-solving checklists

### For a tensor-shape question

1. Write what each axis means.
2. Write symbolic shapes first.
3. Verify adjacent dimensions in matrix multiplication.
4. Insert numbers last.

### For attention weights

1. Compute $Q=HW_Q$ and $K=HW_K$.
2. Select the query row requested.
3. Dot it with every key row.
4. Apply scaling only if required.
5. Apply softmax if actual weights are requested.
6. Compare weights and interpret the result.

### For parameter counting

1. State whether biases are included.
2. Count $Q$, $K$, and $V$ projections.
3. Count $W_O$.
4. Count both FFN matrices.
5. Count every LayerNorm's $\gamma$ and $\beta$.
6. Multiply by the number of encoder and decoder layers.
7. Add embeddings or output projection only when requested.

### Common mistakes

- Using $d_k$ where the encoder input requires $d_{\text{model}}$.
- Forgetting that a decoder layer has two attention modules.
- Forgetting $W_O$ in MHA parameter counts.
- Counting residual connections as parameters; addition has no learned weights.
- Assuming leftover probability belongs to one word when many words remain.
- Counting the start token as a generated decoder output.
- Rounding attention weights too early and obtaining a nonzero softmax-gradient sum.

## 12. You are ready when you can explain these aloud

- Why the input shape is $(B,T,d_{\text{model}})$.
- What query, key, and value mean.
- Why softmax attention weights sum to 1.
- Why multiple heads can learn different relations.
- Why encoder and decoder parameter counts differ.
- Why a target of length $n$ needs at least $n$ autoregressive decoder runs.
- Why the components of the gradient through softmax sum to zero.

# Transformer study guide

Read alongside the [interactive lab instructions and architecture diagram](README.md). Follow each lesson with its exercises. This file is a reading companion; calculators and visual controls are in the portal.

## 1. Start with the objects

What is stored, what flows, what is counted?

Course links: GA 1 Q1–3 · GA 2 Q6 · Quiz 1 Q5–6

A **token** is a vocabulary item (often a subword, not a whole word). A tokenizer turns text into integer IDs. Padding makes sequences the same length inside a batch; a padding mask prevents attending to filler tokens.

| Symbol | Meaning | Example |
|---|---|---|
| $B$ | Number of sequences in a batch | 4 sentences |
| $T_s,T_t$ | Source / target sequence length | 8 / 6 tokens |
| $C$ | Maximum supported context length | 128 positions |
| $V_s,V_t$ | Source / target vocabulary size | 1000 / 1500 IDs |
| $d$ | Model width; numbers per token vector | 64 |
| $h$ | Number of attention heads | 4 |
| $d_k,d_v$ | Key / value width per head | 16 |
| $f,N$ | FFN hidden width / stack depth | 256 / 2 |

**Parameters** are learned stored numbers: $W_Q$, embedding tables, biases, LayerNorm scales. **Activations** are values computed for this input: $X,Q,K,V,A,Z$. **Hyperparameters** configure the model: width, heads, depth, learning rate. A mask is usually constructed from sequence lengths and the attention rule.

For row-token notation, $X$ has shape $B\times T\times d$. A matrix $(a\times b)(b\times c)$ produces $a\times c$: the inner dimensions must match. A $d\times d_k$ weight contains $dd_k$ parameters regardless of batch size.

**Worked:** $B=4,T=8,d=256$ gives $4\times8\times256=8192$ input values. Doubling the batch doubles activations, not parameters. Padding and special tokens count toward context length if included in the stated sequence.

**Solve in this order:** identify the object → write its shape → multiply dimensions → check exclusions (biases, embeddings, heads, layers).

### Check your understanding

**Exercise 1.** B=4, T=8, d=256. How many values are in the encoder input?

<details><summary>Hint</summary>

Multiply the three axes.

</details>

<details><summary>Answer and explanation</summary>

**8192** — 4 × 8 × 256 = 8192 activation values. These are not learned parameters.

</details>

**Exercise 2.** A weight matrix has shape 256 × 64. How many weights?

<details><summary>Hint</summary>

Count its cells.

</details>

<details><summary>Answer and explanation</summary>

**16384** — 256 × 64 = 16384. Neither the batch nor the sentence length multiplies this count.

</details>

**Exercise 3.** Sequences have 3, 8, 5 and 6 tokens, including any special tokens. Minimum context capacity?

<details><summary>Hint</summary>

Every full sequence must fit.

</details>

<details><summary>Answer and explanation</summary>

**8** — max(3,8,5,6) = 8. Shorter sequences may be padded to 8 in this batch.

</details>

## 2. Read the architecture

Follow one token through your A–U diagram

Course links: Attached architecture questions · GA 2 Q1 · Quiz 1 Q13

The **encoder** reads the source and returns one contextual vector per source position. The **decoder** reads the target prefix and predicts the next target token. The encoder does not generate the translated sentence by itself.

Read the diagram **bottom to top**. Click a box below to see its operation, shape and parameter rule. The $N\times$ bracket repeats the block, with separate weights in each layer by default. Embeddings and output projection sit outside this bracket.

**Self-attention:** queries, keys and values come from the same sequence representation. **Cross-attention:** queries come from the decoder; keys and values come from the encoder output. Thus its score matrix is $T_t\times T_s$, which need not be square.

**Residual + LayerNorm:** $y=\operatorname{LN}(x+\operatorname{Sublayer}(x))$ in the pictured post-norm Transformer. The bypass carries $x$ around a sublayer, and addition requires matching shapes. LayerNorm normalizes the $d$ features of each token, then applies learned $\gamma,\beta\in\mathbb R^d$: $2d$ parameters. Residual addition has zero.

**FFN:** $\operatorname{FFN}(x)=\sigma(xW_1+b_1)W_2+b_2$. It expands $d\to f$, applies a nonlinearity, then contracts $f\to d$. The same FFN weights are applied independently at every token position.

**Three families:** BERT uses bidirectional encoder blocks; GPT uses causal self-attention + FFN, without encoder cross-attention; translation uses both stacks. GPT often uses pre-norm and an extra final norm; use the stated architecture when counting.

### Check your understanding

**Exercise 4.** Your image: all Add & Norm letters, in ascending order, with no spaces?

<details><summary>Hint</summary>

Two in the encoder; three in the decoder.

</details>

<details><summary>Answer and explanation</summary>

**FHMPR** — F follows E, H follows G, M follows L, P follows O, R follows Q. Each combines a residual path with a sublayer output.

</details>

**Exercise 5.** Your image: which letter is masked multi-head self-attention?

<details><summary>Hint</summary>

First attention operation above target embeddings.

</details>

<details><summary>Answer and explanation</summary>

**L** — L. O is cross-attention; E is encoder self-attention.

</details>

**Exercise 6.** Your image: which letter receives decoder queries and encoder keys/values?

<details><summary>Hint</summary>

Look for the connection between the two stacks.

</details>

<details><summary>Answer and explanation</summary>

**O** — O is cross-attention. Its output has target sequence length, because there is one output per query.

</details>

**Exercise 7.** How many attention sublayers are in one standard encoder-decoder decoder block?

<details><summary>Hint</summary>

One reads the target prefix; one reads the source.

</details>

<details><summary>Answer and explanation</summary>

**2** — 2: masked self-attention and cross-attention. A standard GPT block has only the first.

</details>

## 3. Embeddings & position

Token identity + position → contextual meaning

Course links: GA 1 Q2 · GA 3 Q1, Q4–5 · Quiz 1 Q8

| Representation | Where it comes from | Trainable parameters |
|---|---|---|
| Token embedding | Look up row $E[\mathrm{id}]$ in $E\in\mathbb R^{V\times d}$ | $Vd$ |
| Learned absolute position | Look up row $P[p]$, $P\in\mathbb R^{C\times d}$ | $Cd$ |
| Sinusoidal position | Calculate sine/cosine coordinates | 0 |
| Segment / token-type embedding | BERT sentence-A/B lookup | $2d$ for two types |
| Contextual representation | Hidden vector after processing surrounding tokens | No separate lookup table; computed using block weights |

The same token ID “bank” has the same input lookup vector in “river bank” and “bank loan”. Attention produces different contextual vectors because the surrounding tokens differ. A contextual vector still has width $d$.

Input is usually a **sum**, not concatenation: $x_p=E[\mathrm{id}_p]+P[p]$ (plus segment embedding where applicable). Shape stays $T\times d$. The original Transformer scales token embeddings by $\sqrt d$ before adding position; use the formula given in the question. GA 3 explicitly uses $x+p$.

For zero-based coordinate pairs $i=0,\ldots,d/2-1$:
$$PE(p,2i)=\sin(p/10000^{2i/d}),\quad PE(p,2i+1)=\cos(p/10000^{2i/d}).$$
Use **radians**. Position numbering is specified by the question: position 4 means $p=4$ here, not automatically 3. For even $d$, every sine/cosine pair contributes 1, so $\|PE(p)\|^2=d/2$ and $\|PE(p)\|=\sqrt{d/2}$.

**Weight tying:** reuse target embedding $E$ as output weight $E^T$. Count its stored parameters once. Under full softmax, an absent token can still get an output gradient, so its tied embedding can change. Without tying, absent input rows receive no lookup gradient (optimizer effects are a separate issue).

### Check your understanding

**Exercise 8.** V=1000, d=64. Token embedding parameters?

<details><summary>Hint</summary>

One vector per vocabulary ID.

</details>

<details><summary>Answer and explanation</summary>

**64000** — 1000 × 64 = 64000. Sequence length does not change the lookup-table size.

</details>

**Exercise 9.** Learned positional table: capacity 64, width 128. Parameters?

<details><summary>Hint</summary>

One vector per supported position.

</details>

<details><summary>Answer and explanation</summary>

**8192** — 64 × 128 = 8192. A sinusoidal table of the same shape has zero learned parameters.

</details>

**Exercise 10.** Sinusoidal PE, even d=512, position 3: squared norm?

<details><summary>Hint</summary>

Each sine/cosine pair contributes one.

</details>

<details><summary>Answer and explanation</summary>

**256** — 512/2 = 256. The norm itself is 16; the squared norm is 256.

</details>

**Exercise 11.** GA 3: x=[0.1,0,0.23,0.4,-0.75,1], p=4. Sum of x+PE, to 2 decimals?

<details><summary>Hint</summary>

Use radians and d=6; sum x is 0.98.

</details>

<details><summary>Answer and explanation</summary>

**1.75** — PE ≈ [−0.756802,−0.653644,0.184599,0.982814,0.008618,0.999963]. Add sum(x)=0.98 → 1.745547 → 1.75.

</details>

**Exercise 12.** Tied token/output weights, V=1000,d=64, no output bias: total unique parameters in these two uses?

<details><summary>Hint</summary>

Count stored numbers, not uses.

</details>

<details><summary>Answer and explanation</summary>

**64000** — One shared table: 1000 × 64 = 64000, rather than 128000.

</details>

## 4. Attention, one calculation

Project → compare → scale → mask → normalize → mix

Course links: GA 1 Q4–8 · GA 2 Q5 · Quiz 1 Q2–4

A **query** asks what this position needs. A **key** describes what a position can match. A **value** carries the information to mix. These are projections, not three independent token dictionaries.

$$Q=XW_Q,\quad K=XW_K,\quad V=XW_V,$$
$$S=QK^T/\sqrt{d_k}+M,\qquad A=\operatorname{softmax}_{\mathrm{row}}(S),\qquad Z=AV.$$

| Stage (one head, batch omitted) | Shape |
|---|---|
| $X$ | $T\times d$ |
| $W_Q,W_K; W_V$ | $d\times d_k;\ d\times d_v$ |
| $Q,K;V$ | $T\times d_k;\ T\times d_v$ |
| $QK^T,A$ | $T\times T$ |
| $Z$ | $T\times d_v$ |

Row $i$ means **construct output for query token $i$**. Column $j$ means read key/value token $j$. Softmax rows sum to 1; columns need not. Large weights show strong attention in that head, not a guaranteed linguistic explanation.

**Multi-head:** concatenate $h$ outputs to $T\times(hd_v)$; multiply by $W_O\in\mathbb R^{hd_v\times d}$ to return $T\times d$. In the standard split, $hd_k=hd_v=d$.

**Notation trap:** Quiz 1 stores tokens in columns: $X$ is $d\times T$, $Q=W_QX$, and scores are $Q^TK$. Our lab transposes the example into rows. Both yield the same $T\times T$ scores; never blindly copy a transpose.

**Gradient shortcut (GA 2):** if $g_j=\partial L/\partial a_j$, then $\partial L/\partial s_j=a_j(g_j-\sum_k a_kg_k)$. Summing over $j$ gives 0. This is a softmax-logit gradient identity, not a statement that every parameter gradient is zero.

### Check your understanding

**Exercise 13.** Quiz 1 toy example: diagonal sum of the unscaled query-key score matrix?

<details><summary>Hint</summary>

The diagonal is 1, 1, 2.

</details>

<details><summary>Answer and explanation</summary>

**4** — 1 + 1 + 2 = 4. Do not apply √2 scaling to a question about the unscaled matrix.

</details>

**Exercise 14.** How much does each complete softmax row sum to?

<details><summary>Hint</summary>

It is a distribution over keys.

</details>

<details><summary>Answer and explanation</summary>

**1** — 1, including zeros at masked positions. Columns need not sum to 1.

</details>

**Exercise 15.** d=128, h=4, standard equal-width heads. Per-head key width?

<details><summary>Hint</summary>

Split the model width.

</details>

<details><summary>Answer and explanation</summary>

**32** — 128/4 = 32. WQ per head is 128 × 32; Q for T tokens is T × 32.

</details>

**Exercise 16.** A=[0.25,0.75], values v1=[2,0], v2=[0,4]. Second coordinate of the weighted output?

<details><summary>Hint</summary>

Weight the values, not the keys.

</details>

<details><summary>Answer and explanation</summary>

**3** — z=0.25[2,0]+0.75[0,4]=[0.5,3].

</details>

**Exercise 17.** For a softmax row, what is the sum of gradients with respect to its logits?

<details><summary>Hint</summary>

Use a_j(g_j − weighted average of g).

</details>

<details><summary>Answer and explanation</summary>

**0** — Σ a_j g_j − (Σ a_j)(Σ a_k g_k) = 0 because Σ a_j = 1. Individual entries can be nonzero.

</details>

## 5. Masks & tensor shapes

Which token can see which token?

Course links: GA 1 Q1–2 · GA 3 Q2, Q6–7 · Quiz 1 Q5–7, Q9

A causal mask adds $-\infty$ at $j>i$ **before softmax**. Exponentiating gives zero probability for future positions. The diagonal is allowed: the shifted input at position $i$ is a previous token, not the label being predicted there.

**Teacher forcing:** target labels “I like tea [EOS]” correspond to decoder input “[BOS] I like tea”. Training uses the true prefix; all positions can be evaluated together with a causal mask. Inference feeds back generated tokens and is sequential. There is no separate teacher model.

Right-to-left writing does not reverse the mask: causality follows token order in the input array. A padding mask and a causal mask solve different problems and can be combined.

| Requested quantity | Count / shape |
|---|---|
| One head's self-attention scores | $T^2$ |
| All score entries, one layer and batch | $BhT^2$ |
| Cross-attention scores | $BhT_tT_s$ |
| Forbidden future entries per mask | $T(T-1)/2$ |
| Allowed entries including diagonal | $T(T+1)/2$ |
| Final encoder output | $B\times T\times d$ |

A shared mask may be stored once and broadcast over batches and heads. Multiply by $Bh$ only when counting conceptual masked score entries across those axes. Dense implementations may still compute all $T^2$ scores before masking.

**Worked:** 6 tokens, heads 4→8: $(8-4)6^2=144$ extra scores. Final output for $B=8,T=32,d=128$ has 32768 elements, regardless of 6 layers and 8 heads. For $T=128$, the strict upper triangle has 8128 entries.

### Check your understanding

**Exercise 18.** T=128. Number of future entries forbidden in one causal mask?

<details><summary>Hint</summary>

Strict upper triangle; diagonal is allowed.

</details>

<details><summary>Answer and explanation</summary>

**8128** — 128 × 127 / 2 = 8128. Do not use 128² or include the diagonal.

</details>

**Exercise 19.** T=6, heads increase from 4 to 8. Additional scores for one sequence, one layer?

<details><summary>Hint</summary>

Only count the new heads.

</details>

<details><summary>Answer and explanation</summary>

**144** — (8−4) × 6² = 144.

</details>

**Exercise 20.** B=8,T=32,d=128, six encoder layers, eight heads: final output element count?

<details><summary>Hint</summary>

The final output shape has only B,T,d.

</details>

<details><summary>Answer and explanation</summary>

**32768** — 8 × 32 × 128 = 32768. Do not multiply by layers or heads.

</details>

**Exercise 21.** Cross-attention: target length 6, source length 9, four heads, batch 2. Total score entries?

<details><summary>Hint</summary>

Rows follow queries; columns follow keys.

</details>

<details><summary>Answer and explanation</summary>

**432** — 2 × 4 × 6 × 9 = 432. Cross-attention is not necessarily square.

</details>

**Exercise 22.** T=5. How many positions are allowed across one causal attention matrix?

<details><summary>Hint</summary>

Include the diagonal.

</details>

<details><summary>Answer and explanation</summary>

**15** — 5 × 6 / 2 = 15 allowed; 5 × 4 / 2 = 10 forbidden.

</details>

## 6. Count every parameter

Build a ledger; do not memorize one mysterious total

Course links: GA 1 Q3 · GA 2 Q1–3 · GA 3 Q4–6

**General attention weights:** $h(dd_k+dd_k+dd_v)+(hd_v)d$. Query and key widths must match. If all per-head widths equal $d/h$, this simplifies to $4d^2$. The head count cancels only under this assumption.

| Component | Weights | Optional biases |
|---|---|---|
| Standard MHA | $4d^2$ | $4d$ |
| Two-linear-layer FFN | $2df$ | $f+d$ |
| One affine LayerNorm | $2d$ | Already includes scale and shift |
| Encoder block | MHA + FFN + 2 LayerNorms | As chosen |
| Encoder-decoder's decoder block | 2 MHA + FFN + 3 LayerNorms | As chosen |
| GPT-style block | MHA + FFN + 2 LayerNorms | Extra final norm if specified |
| Output projection | $dV_t$ | $V_t$ |

**Zero learned parameters:** residual addition, softmax, masks, concatenation, standard activation functions, sinusoidal position calculation. Their outputs can have many elements nonetheless.

**GA 2 worked ledger:** $d=64,f=256,N=2$; omit projection and FFN biases as in the supplied solution. MHA = 16384, FFN = 32768, LayerNorm = 128. Encoder block = 49408; decoder block = 65920. Both stacks = $2(49408+65920)=230656$. Source lookup = 64000, target lookup = 96000, untied output = 96000. Complete model under these assumptions = 486656.

Never multiply shared weights by $B$ or $T$. $N$ means **N layers in each stack** here. If a question specifies different widths, shared layers, gated FFNs, bias choices or final norms, rebuild the ledger from shapes.

### Check your understanding

**Exercise 23.** Standard MHA, d=256,h=4, no biases. Total parameters including WO?

<details><summary>Hint</summary>

Three projections plus the output projection.

</details>

<details><summary>Answer and explanation</summary>

**262144** — 4 × 256² = 262144. Equivalently: 4 heads × 3 × 256 × 64 + 256².

</details>

**Exercise 24.** FFN d=64,f=256, no bias. Parameters?

<details><summary>Hint</summary>

Expansion and contraction both count.

</details>

<details><summary>Answer and explanation</summary>

**32768** — 64 × 256 + 256 × 64 = 32768. With biases add 256+64=320.

</details>

**Exercise 25.** One affine LayerNorm at width 64. Parameters?

<details><summary>Hint</summary>

Scale and shift.

</details>

<details><summary>Answer and explanation</summary>

**128** — 64 gamma + 64 beta = 128. Residual addition adds zero parameters.

</details>

**Exercise 26.** GA 2: both stacks, N=2 each, d=64,f=256, no linear biases; exclude embeddings/output. Parameters?

<details><summary>Hint</summary>

Encoder 49408; decoder 65920.

</details>

<details><summary>Answer and explanation</summary>

**230656** — 2 × (49408 + 65920) = 230656. The decoder contains a second attention sublayer.

</details>

**Exercise 27.** Output projection d=64,Vt=1500, untied and without bias. Parameters?

<details><summary>Hint</summary>

Map one hidden vector to vocabulary logits.

</details>

<details><summary>Answer and explanation</summary>

**96000** — 64 × 1500 = 96000. With an output bias add 1500.

</details>

**Exercise 28.** Standard MHA d=64, change h=4 to h=8 while keeping hd_k=hd_v=d. Change in parameter count?

<details><summary>Hint</summary>

More heads, narrower projections per head.

</details>

<details><summary>Answer and explanation</summary>

**0** — 4d² remains 16384. The number of score entries doubles, but stored MHA weights do not.

</details>

## 7. Generation & training

A model probability is different from a decoding decision

Course links: GA 2 Q4, Q7 · GA 3 Q3, Q8 · GA 4 Q1–6 · Quiz 1 Q9–17

The output linear map produces **logits**, one score per vocabulary token. Softmax turns these into probabilities. Cross-entropy trains the model to increase the true label's probability.

$$P(y_1,\ldots,y_T)=\prod_t P(y_t\mid y_{<t},x),\qquad L=-\sum_{t\in\mathcal M}\ln P(y_t\mid\mathrm{context}).$$
For causal LM, $\mathcal M$ contains prediction positions. For BERT MLM, use only the selected prediction positions. Sum versus mean loss must be stated. With correct-token probabilities 0.2 and 0.16, summed loss is $-\ln(0.2)-\ln(0.16)=3.442$; mean is 1.721.

**Greedy:** take the largest probability now; this does not guarantee the best whole sequence. **Top-k:** retain k largest probabilities and divide each by their retained sum, then sample. **Top-p:** retain the smallest sorted prefix whose cumulative probability reaches p. **Beam search:** expand retained prefixes and keep the best b by joint score (often log-probability); rank prefixes, not just next tokens.

**Probability trap:** an alternative to the greedy output has zero chance under the deterministic greedy procedure, but can have positive model probability. If supplied rows describe only the greedy history, they may not tell you the probabilities after an alternative prefix. This distinction matters for GA 4 Q3.

**Counting trap:** $V^T$ counts full sequences. $\sum_{t=1}^T V^t$ counts non-root tree nodes (Quiz 1 Q15's convention: 2800). If one forward evaluation produces all next-token logits for a prefix, exhaustive expansion needs $\sum_{t=0}^{T-1}V^t$ distinct prefix evaluations (400 for V=7,T=4), before batching/caching details. State which unit is requested.

**Missing histories:** $P(\mathrm{apples}\mid\mathrm{like})$ needs a distribution over preceding histories. In a complete specified two-subject tree it can be marginalized; Quiz 1's partial tree does not establish that completeness. Do not assume missing paths have probability zero.

**BERT / GPT:** BERT uses bidirectional context and MLM; final [CLS] is a conventional classification input, not the only possible pooling method. GPT uses a causal next-token objective. Pretraining from scratch initializes weights; fine-tuning starts from pretrained weights and its objective depends on the task. Degenerate outputs can repeat or become incoherent; changing decoding does not guarantee correctness.

### Check your understanding

**Exercise 29.** P(you)=0.4, P(eat|you)=0.5, P(apples|you eat)=0.9. Joint probability?

<details><summary>Hint</summary>

Follow the full prefix at each step.

</details>

<details><summary>Answer and explanation</summary>

**0.18** — 0.4 × 0.5 × 0.9 = 0.18. Add logs only if working in log-space.

</details>

**Exercise 30.** Top-3 retains probabilities 0.35,0.30,0.20. New probability of the first token, to 3 decimals?

<details><summary>Hint</summary>

Divide by retained probability mass.

</details>

<details><summary>Answer and explanation</summary>

**0.412** — 0.35/(0.35+0.30+0.20) = 0.411765 → 0.412. Do not divide by 3.

</details>

**Exercise 31.** MLM correct-token probabilities at two selected positions: 0.2 and 0.16. Summed natural-log loss to 2 decimals?

<details><summary>Hint</summary>

Negative log of each correct label.

</details>

<details><summary>Answer and explanation</summary>

**3.44** — −ln(0.2)−ln(0.16)=3.442019 → 3.44. Mean loss would be 1.721.

</details>

**Exercise 32.** Seven tokens, four generation steps. How many full-length sequences?

<details><summary>Hint</summary>

Choices multiply across steps.

</details>

<details><summary>Answer and explanation</summary>

**2401** — 7⁴ = 2401. Counting all non-root prefixes instead gives 7+49+343+2401=2800.

</details>

**Exercise 33.** Vocabulary size 1500; three known token probabilities sum to 0.9. Is a particular fourth token necessarily 0.1? Answer yes/no.

<details><summary>Hint</summary>

Who shares the remaining mass?

</details>

<details><summary>Answer and explanation</summary>

**no** — No. The remaining 1497 vocabulary entries collectively get 0.1; a particular one is undetermined.

</details>

**Exercise 34.** Autoregressive inference: four generated tokens, ignore EOS. Minimum sequential token-generation steps?

<details><summary>Hint</summary>

One new token per step under ordinary autoregressive decoding.

</details>

<details><summary>Answer and explanation</summary>

**4** — 4. Teacher-forced training can evaluate the known shifted sequence together; inference must build the prefix.

</details>

## 8. Exam toolkit & practice

Recognize the question before reaching for a formula

Course links: All first-four assignments + Quiz 1 + your image

**1. Identify a box:** trace its incoming arrows. Three inputs from one sequence → self-attention. Decoder query plus two encoder connections → cross-attention. Bypass meeting a sublayer output → Add & Norm.

**2. Find a shape:** name every axis. Token rows × feature columns. Cancel inner axes in multiplication. Keep batch as an outer axis.

**3. Count parameters:** list unique weight matrices and learned vectors. Write each shape, multiply, add, then multiply by independent layers. Check tying, biases, learned position and final norms.

**4. Calculate attention:** project Q/K/V → dot products → divide by $\sqrt{d_k}$ if specified → mask → row softmax → weighted sum of V. Round only at the end.

**5. Decode / compute loss:** follow the exact conditioning history. Multiply probabilities; sum log losses. Top-k divides by retained mass. A missing probability is not automatically zero.

Use the exercises below without opening the solution first. A correct answer is most useful when you can explain why the tempting alternative is wrong. After these drills, retry the original assignments through the links at the bottom.

### Check your understanding

**Exercise 35.** Your image: FFN letters in alphabetical order?

<details><summary>Hint</summary>

Each is followed by the final Add & Norm of its block.

</details>

<details><summary>Answer and explanation</summary>

**GQ** — G is encoder FFN; Q is decoder FFN. F,H,M,P,R are Add & Norm.

</details>

**Exercise 36.** d=32,f=128: one encoder block with no linear biases, affine LayerNorm. Parameters?

<details><summary>Hint</summary>

4d² + 2df + 4d.

</details>

<details><summary>Answer and explanation</summary>

**12416** — 4096 + 8192 + 128 = 12416. A decoder block with cross-attention would need another MHA and norm.

</details>

**Exercise 37.** Learned positions C=100,d=32. Increase actual sequence length from 10 to 20 within capacity. Added positional parameters?

<details><summary>Hint</summary>

The capacity table already exists.

</details>

<details><summary>Answer and explanation</summary>

**0** — Zero. You use more rows of the existing 100 × 32 table; you do not allocate a new learned table per sentence.

</details>

**Exercise 38.** Can a non-greedy sentence have positive model probability? Answer yes/no.

<details><summary>Hint</summary>

Model distribution versus deterministic choice.

</details>

<details><summary>Answer and explanation</summary>

**yes** — Yes. Greedy selects one path; other paths may still have nonzero model probability. Their conditional probabilities must be known to calculate it.

</details>

# December-2025-ET - Previous Year Question Paper

> **Exam:** End Term, Large Language Models | **Date:** 18 December 2025
> **Source:** [December-2025-ET.pdf](December-2025-ET.pdf), saved QuizPractice question paper.
> **Original total:** 50 marks | **Scored questions:** 25
> **Verification:** Question text, options, equations, tables and diagrams checked against rendered PDF pages. Solutions are independently derived; the PDFs do not display an official answer key.

Original question numbers and option order are retained. Page references mean PDF pages, including the blank first page. Only whitespace and mathematical typesetting have been normalized. Source Q22 is a zero-mark shared context for Q23-Q26, reproduced below. The printed inequality “beam width < 1” in Q14 is retained. Conceptual overstatements and ambiguous counting conventions are discussed inside the relevant solutions.

## Original zero-mark context item

This item is preserved for an exact transcription of the paper. It is not included as a scored interactive question because the source uses it only as a shared passage for Q23–Q26.

## Beginner study guide

For every solution, use the same four moves: (1) underline what is given and what is asked, (2) write the definition or governing formula before substituting numbers, (3) calculate one small step at a time, and (4) sanity-check the answer using units, tensor shapes, limits, or the wording of the option. The memory hook under each solution is a compact cue for the rule to recall during revision.

#### Original Q22 — Shared source context (0 marks)

The Transformer block diagram and the accompanying statements are reproduced in the dedicated context section below, immediately before Q23–Q26.

---
### Q1 - Temperature followed by top-k (MCQ)

A language model produces the following logits for the next token:

$$\{\text{apple}:2.1,\ \text{banana}:1.8,\ \text{grape}:0.4,\ \text{orange}:0.3,\ \text{melon}:-1.0\}.$$

Before sampling, the model applies:

- Temperature scaling with $T=0.5$
- Top-K sampling with $K=2$

Which tokens are eligible to be sampled?

- ( ) Only “apple”
- ( ) “apple” or “banana”
- ( ) “apple”, “banana” or “grape”
- ( ) “apple” or “grape”

> **Source:** PDF p. 2 | **Marks:** 2

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B

#### Step-by-step solution

1. Temperature scaling divides logits by $T$: $[2.1,1.8,0.4,0.3,-1]/0.5=[4.2,3.6,0.8,0.6,-2]$.
2. Dividing by a positive temperature changes probability concentration but preserves ordering. Apple and banana remain the top two.
3. Top-$K$ with $K=2$ keeps only those tokens and renormalizes their probabilities. Both remain possible (approximately 0.646 and 0.354), so B is correct. Low positive temperature does not automatically make sampling greedy.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q2 - Normalization parameters (MCQ)

A neural network layer produces activations of hidden dimension $H=512$. You consider two normalization strategies: 1. Batch Normalization 2. Layer Normalization. Which option correctly states the number of trainable parameters added by each normalization method?

- ( ) BatchNorm adds 512 parameters, LayerNorm adds 512 parameters
- ( ) BatchNorm adds 1024 parameters, LayerNorm adds 1024 parameters
- ( ) BatchNorm adds 1024 parameters, LayerNorm adds 512 parameters
- ( ) BatchNorm adds 512 parameters, LayerNorm adds 1024 parameters
- ( ) Both add 0 trainable parameters

> **Source:** PDF p. 2-3 | **Marks:** 2

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B

#### Step-by-step solution

1. With their standard affine transformations enabled, both normalizations have a learned scale $\gamma$ and learned shift $\beta$ for each hidden feature.
2. Each therefore has $H+H=2H=2\cdot512=1024$ trainable scalars.
3. BatchNorm also tracks running mean and variance, but these are statistics/buffers rather than gradient-trained parameters. LayerNorm computes its statistics from each example. Their different normalization axes do not change this affine parameter count.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q3 - WordPiece candidate comparison (MCQ)

A sub-word vocabulary is being constructed using the WordPiece algorithm. The following tokens and their frequencies are extracted:

- replay (frequency = 100)
- replus (frequency = 3)

The current vocabulary includes the tokens: `{re, play, plus, #play, #plus}`.

Two candidate merges are under consideration:

- Merge A: `re + play → replay`
- Merge B: `re + plus → replus`

Which of the above merges are most possible based on the WordPiece tokenizer?

- ( ) Merge `re + play`
- ( ) Merge `re + plus`
- ( ) Insufficient information to determine

> **Source:** PDF p. 3 | **Marks:** 2

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** C

#### Step-by-step solution

1. A WordPiece merge is ranked by normalized association $s(a,b)=f(ab)/(f(a)f(b))$, not simply by the frequency of the complete word.
2. The frequencies of the individual currently segmented tokens across the whole corpus are not specified. The vocabulary also includes continuation variants (`#play`, `#plus`), but membership alone gives no frequency or segmentation information.
3. Even if these two words form the entire corpus and split exactly as the proposed pairs, $f(re)=103$, $f(play)=100$, $f(plus)=3$. Then

$$s(re,play)=\frac{100}{103\cdot100}=\frac1{103},\qquad s(re,plus)=\frac3{103\cdot3}=\frac1{103}.$$

4. They tie under that restrictive assumption, and no tie-breaking policy is supplied. With other occurrences the ordering could change. Thus C is the only justified choice; choosing replay just because 100 exceeds 3 confuses WordPiece with raw pair-frequency merging.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q4 - BERT classification output (MCQ)

For a 4-category classification task, how would you use BERT's output?

- ( ) Use all token embeddings and average them.
- ( ) Use the [CLS] token embedding as input to a classification layer.
- ( ) Use only the [SEP] token
- ( ) Use the [MASK] token predictions.

> **Source:** PDF p. 3 | **Marks:** 2

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B

#### Step-by-step solution

1. Standard BERT sequence classification uses the final [CLS] representation, optionally through BERT's pooler, as the summary feature vector.
2. Attach a learned four-output classifier: $z=Wh_{CLS}+b$ with $W\in\mathbb R^{4\times H}$. Apply softmax and train with the category labels.
3. [SEP] marks segment boundaries; [MASK] predictions serve masked-token reconstruction. Mean pooling can be a valid alternative architecture, but B is the conventional BERT classification construction requested here.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q5 - Disease mention extraction (MCQ)

A hospital wants to extract disease mentions and treatment plans from unstructured clinical notes. Notes use heavy abbreviations like “pt dx w/ CAD, rx aspirin”. For extracting specific disease names from text, which task should you fine-tune BERT for?

- ( ) Masked Language Modeling
- ( ) Next Sentence Prediction
- ( ) Named Entity Recognition
- ( ) Text generation

> **Source:** PDF p. 3-4 | **Marks:** 2

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** C

#### Step-by-step solution

1. The requested output identifies spans in existing text, such as the disease mention “CAD”.
2. Named Entity Recognition trains a classifier on token representations, often using BIO labels such as B-DISEASE, I-DISEASE and O. Subword predictions are aligned back to the original text spans.
3. MLM predicts missing tokens; NSP classifies sentence relationships; text generation produces a new sequence. None directly expresses the requested entity-span extraction task as well as NER.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q6 - Diagonal block attention complexity (MCQ)

Consider a sequence of length $T$ and a local block attention mechanism with $n$ blocks. If the attention matrix is restricted to only the main diagonal blocks (non-overlapping), what is the computational complexity of the self-attention operation for one layer (ignoring linear projections)? Assume $d$ be the model dimension.

- ( ) $O((T/n)^2\cdot d)$
- ( ) $O(T\cdot d^2)$
- ( ) $O(T^2\cdot d)$
- ( ) $O((T^2/n)\cdot d)$

> **Source:** PDF p. 4 | **Marks:** 2

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** D

#### Step-by-step solution

1. For equal blocks, each block has $b=T/n$ tokens. One dense block attention costs $O(b^2d)$ for score formation and weighted-value aggregation.
2. There are $n$ diagonal blocks, giving $n\,O((T/n)^2d)=O(T^2d/n)$.
3. A counts only one block. B describes a projection-like cost that the question excludes. C is the full dense-attention cost. D includes all selected blocks and their feature dimension.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q7 - Match positional methods (MCQ)

Match the positional encoding method (Column A) with its property/behavior (Column B).

**Column A (Methods):** 1. APE 2. RPE 3. RoPE 4. ALiBi 5. NoPE

**Column B (Properties / Observations):**

A. Works even on sequence lengths far beyond training length without retraining, because attention bias grows proportionally to token distance.

B. Even if the model sees sequences only up to length 512 during training, it fails badly at length 1024, because positions above 512 have never had embeddings learned.

C. Creates an implicit rotation such that the attention score between positions $i$ and $j$ depends only on the difference $i-j$, not the positions themselves.

D. Uses a fixed-size bank of distance embeddings such that two attention pairs $(i,j)$ and $(k,l)$ with the same distance use the same embedding.

E. The model becomes permutation-invariant, meaning it treats “cat sat mat” the same as “mat cat sat”.

- ( ) $1\to B,\ 2\to D,\ 3\to C,\ 4\to A,\ 5\to E$
- ( ) $1\to D,\ 2\to A,\ 3\to B,\ 4\to C,\ 5\to E$
- ( ) $1\to B,\ 2\to C,\ 3\to A,\ 4\to D,\ 5\to E$
- ( ) $1\to E,\ 2\to D,\ 3\to A,\ 4\to C,\ 5\to B$

> **Source:** PDF p. 4-5 | **Marks:** 3

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A

#### Step-by-step solution

1. **Learned APE → B:** a learned position table has no trained entries beyond its supported maximum.
2. **RPE → D:** pairs with equal signed distance reuse the same relative entry (possibly through clipping or bucketing).
3. **RoPE → C:** rotating queries and keys makes the positional contribution to their dot product depend on relative rotation. The score still depends on token content.
4. **ALiBi → A:** a distance-dependent linear bias can be evaluated at longer lengths without adding learned position rows. This enables extrapolation but does not guarantee arbitrary-length accuracy. See [the ALiBi paper](https://arxiv.org/html/2108.12409v2).
5. **NoPE → E** is the intended matching, with a qualification: unmasked self-attention without position information is **permutation-equivariant**, not inherently invariant. Permuting input tokens permutes token outputs; invariant pooling can then produce the same sequence summary. A causal mask also supplies order structure, so the claim does not hold generally for every NoPE model.

Only A matches the intended associations. “APE” in B means learned APE, not fixed sinusoidal APE.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q8 - RoPE rotation (MCQ)

A 2D vector $[4,0]$ is rotated by $90^\circ$ using RoPE. What is the resulting vector?

- ( ) $[0,4]$
- ( ) $[4,0]$
- ( ) $[0,-4]$
- ( ) $[-4,0]$

> **Source:** PDF p. 5 | **Marks:** 2

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A

#### Step-by-step solution

1. Use the standard positive-angle (counterclockwise) rotation:

$$R(\theta)=\begin{bmatrix}\cos\theta&-\sin\theta\\\sin\theta&\cos\theta\end{bmatrix}.$$

2. At $90^\circ$, $\cos\theta=0$ and $\sin\theta=1$, so $R[4,0]^T=[0,4]^T$.
3. The norm stays 4, as rotations preserve length. Option C would describe a clockwise rotation, while D would be a half-turn.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q9 - RoPE at longer lengths (MCQ)

If a model uses RoPE, increasing the sequence length from 100 to 1000 requires:

- ( ) 900 more positional vectors
- ( ) $2\times1000-1$ RPE matrices
- ( ) No new parameters
- ( ) A new embedding matrix

> **Source:** PDF p. 5 | **Marks:** 2

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** C

#### Step-by-step solution

1. Standard RoPE obtains each rotation angle from the token position and a fixed frequency schedule.
2. Positions 100 through 999 therefore use the same formula and frequencies; they do not require learned position rows or new trainable parameters.
3. Additional rotation values may be computed or cached, and longer sequences use more runtime memory. Those are not new model parameters. The absence of new parameters also does not guarantee unchanged extrapolation quality.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q10 - Pairs at distance one (MCQ)

In a sequence of length $T=6$, how many different attention pairs produce a distance of $+1$?

- ( ) 1
- ( ) 3
- ( ) 5
- ( ) 6

> **Source:** PDF p. 5-6 | **Marks:** 2

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** C

#### Step-by-step solution

1. Using distance $j-i$, distance $+1$ means $j=i+1$.
2. Valid zero-based pairs are $(0,1),(1,2),(2,3),(3,4),(4,5)$: 5 pairs.
3. Equivalently, the distance-$r$ diagonal has $T-|r|$ entries, so $6-1=5$. Reversing the distance sign convention reverses the pairs but leaves their count unchanged. This counts geometric pairs, not a causal mask's allowed future connections.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q11 - Absolute and relative vector counts (MCQ)

For a sequence of length $T=6$, how many Absolute Positional Encoding (APE) vectors are needed, and how many Relative Positional Encoding (RPE) vectors are required?

- ( ) APE = 6, RPE = 11
- ( ) APE = 6, RPE = 6
- ( ) APE = 12, RPE = 11
- ( ) APE = 5, RPE = 12

> **Source:** PDF p. 6 | **Marks:** 2

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A

#### Step-by-step solution

1. Absolute encoding assigns one vector to each of six token positions: 6 vectors.
2. For unbucketed signed RPE with all position pairs, offsets range from $-(T-1)$ to $T-1$, here $-5,-4,\ldots,0,\ldots,4,5$.
3. Their count is $2T-1=11$, so A is correct. This counts distinct distance vectors, not the $T^2=36$ pairwise lookups. Clipping, bucketing or one-sided restrictions would change the table size.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q12 - Position-table length failure (MCQ)

A model with positional encoding crashes when the input length exceeds the training max length. Which encoding is it most likely using?

- ( ) ALiBi
- ( ) APE
- ( ) RoPE
- ( ) RPE

> **Source:** PDF p. 6 | **Marks:** 2

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B

#### Step-by-step solution

1. A learned absolute-position table allocated for $L$ positions has valid indices only from 0 through $L-1$.
2. Looking up an unallocated position can trigger an out-of-range error when the input exceeds that length. This makes learned APE the intended choice.
3. Formula-generated rotations/biases do not intrinsically require extra learned rows. Fixed sinusoidal APE is also extendable. Any implementation can impose a separate hard limit, so the symptom is suggestive rather than proof of a particular positional method.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q13 - ALiBi score modification (MCQ)

If the unmodified attention score is $Q_iK_j^T$, then ALiBi changes it to:

- ( ) $Q_iK_j^T+\mathrm{bias}_i$ where bias is a learnable parameter.
- ( ) $Q_iK_j^T+\beta(i+j)$
- ( ) $Q_iK_j^T\cdot\gamma^{|i-j|}$
- ( ) $Q_iK_j^T-\alpha|i-j|$

> **Source:** PDF p. 6-7 | **Marks:** 3

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** D

#### Step-by-step solution

1. ALiBi adds a scalar bias to each attention logit that penalizes distance with a positive head-specific slope.
2. With slope $\alpha>0$, the score is $Q_iK_j^T-\alpha|i-j|$, option D. For causal attention $j\le i$, the bias can equivalently be written $\alpha(j-i)$.
3. The original slopes are fixed rather than learned. A's query-only additive constant would also cancel within a row's softmax. B depends on absolute position sum rather than separation, and C multiplies rather than adding a linear bias.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q14 - Stochastic decoding (MSQ)

Which of the following decoding method(s) can generate a different output every time you run the model with the same prompt?

- ( ) Greedy decoding
- ( ) Beam search with beam width = 1
- ( ) Top-p sampling with temperature $T=1$
- ( ) Top-p sampling with temperature $T>1$
- ( ) Beam search with beam width $<1$

> **Source:** PDF p. 7 | **Marks:** 3

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** C, D

#### Step-by-step solution

1. Greedy decoding deterministically chooses the maximum-probability token (assuming fixed computation and tie handling). Beam search with width 1 reduces to greedy decoding.
2. Top-p sampling draws randomly from its nucleus. This can vary at $T=1$ and at $T>1$; a temperature above 1 flattens the distribution but is not required for randomness.
3. “Can” does not mean a different output is guaranteed on every run: outputs may coincide, and a singleton nucleus or reset random seed can make runs identical.
4. The source really prints **beam width < 1**. Ordinary beam search requires a positive integer width, so that option is invalid as written. Even if it were a typo for width > 1, standard deterministic beam search would not become random.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q15 - Position methods after QK (MSQ)

Which of the following methods modifies/modify the attention scores AFTER computing $QK^T$?

- ( ) RoPE
- ( ) APE
- ( ) ALiBi
- ( ) None of these

> **Source:** PDF p. 7 | **Marks:** 2

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** C

#### Step-by-step solution

1. APE is added to the input representation before the query and key projections.
2. RoPE rotates queries and keys before taking their dot products.
3. ALiBi adds its distance bias to the computed score matrix, before softmax. Therefore only C acts at the requested stage. All three may affect final attention, but they intervene at different points in the computation.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q16 - Doubling sequence length (MSQ)

Consider a BART encoder with sequence length $L$ and hidden size $d_{model}$ (fixed). Now suppose the sequence length is doubled from $L$ to $2L$, keeping all other parameters unchanged. Which of the following statements are true?

- ( ) Self-attention FLOPs increase by a factor of 2.
- ( ) Self-attention FLOPs increase by a factor of 4.
- ( ) FFN FLOPs increase by a factor of 2.
- ( ) FFN FLOPs increase by a factor of 4.

> **Source:** PDF p. 7 | **Marks:** 3

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B, C

#### Step-by-step solution

1. The pairwise attention products $QK^T$ and $AV$ cost $O(L^2d_{model})$. Replacing $L$ by $2L$ multiplies this part by $(2L)^2/L^2=4$.
2. The FFN processes tokens independently. With fixed hidden and intermediate widths its cost is proportional to $L$, so doubling the number of tokens multiplies its FLOPs by 2.
3. Thus B and C are the intended answers.

**Counting convention:** If “self-attention FLOPs” includes the query/key/value/output projections, its cost has both $aL^2$ and $bL$ terms. The exact total ratio is $(4aL^2+2bL)/(aL^2+bL)$, between 2 and 4. Exactly fourfold applies to the quadratic attention part, not generally the whole multi-head sublayer.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q17 - Number of sparse block computations (Short Answer)

You are implementing a custom Block Sparse Attention kernel. Given a sequence length $T=1024$ and block size $B=64$, you decide to compute the main diagonal blocks plus one random off-diagonal block for each block-row. How many total $B\times B$ block computations are performed?

*(Numeric input)*



> **Source:** PDF p. 8 | **Marks:** 2

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{32}$

#### Step-by-step solution

1. There are $T/B=1024/64=16$ block rows.
2. Each row computes its diagonal block plus one distinct off-diagonal block, for 2 blocks per row.
3. Total block computations are $16\cdot2=32$. Different rows may choose the same column without duplicating the same matrix block, since their row indices differ. Each selected block contains $64^2=4096$ token pairs, but the question asks for blocks, not scalar entries.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q18 - Sparse attention properties (MSQ)

Which of the following statements accurately describes the properties and computational complexities of the various sparse and block attention mechanisms?

- ( ) Strided Local Attention reduces the computational complexity from quadratic to linear, specifically $O(cTd)$ where $c$ is the window size.
- ( ) Dilated Attention increases the computational complexity significantly compared to standard Strided Local Attention because it covers a wider receptive field.
- ( ) Global, Random, and Local Window attention patterns handle long sequences well.
- ( ) Empirical observations suggest that random permutations of blocks are significantly more important for performance than the identity permutation.

> **Source:** PDF p. 8 | **Marks:** 2

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A, C

#### Step-by-step solution

1. With $c$ selected keys per query, attention work is $O(Tcd)$. For fixed $c$ and $d$ it is linear in $T$, so A is correct under the course's window convention.
2. Dilation spaces selected keys farther apart. At a fixed number of selected keys it increases receptive field without increasing the number of dot products, so B's claimed necessary cost increase is false.
3. Sparse combinations of local, random and global connections provide useful long-range paths while limiting pair counts. C is the intended efficiency statement; global-token counts must remain controlled.
4. D reverses the relevant empirical lesson. The [BlockBERT ablation (section 4.3)](https://aclanthology.org/2020.findings-emnlp.232.pdf) finds identity permutations important, while using only identity permutations also harms performance because cross-block dependencies are lost. Random/non-identity links complement the local connections; the study does not support D’s claim that they are significantly more important.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q19 - Projection matrix sets (Short Answer)

In the standard Transformer with 6 Encoder Layers, how many distinct sets of transformation weight matrices $(W_Q,W_K,W_V)$ are learned in the entire Encoder stack, assuming 8 heads per layer?

*(Numeric input)*



> **Source:** PDF p. 8 | **Marks:** 2

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{48}$

#### Step-by-step solution

1. Each attention head has its own query, key and value projections, collectively one set $(W_Q,W_K,W_V)$.
2. With 8 heads in each of 6 layers, the number of distinct **sets** is $6\cdot8=48$.
3. Each set contains 3 matrices, so the number of individual per-head matrices is $48\cdot3=144$. This is not the requested number of sets.

An implementation may pack all heads into three large matrices per layer (18 packed matrices in total). That storage choice does not change the 48 conceptual per-head sets. The wording distinction between sets and individual matrices is essential.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q20 - Prefix-LM mask entries (Short Answer)

Suppose you are working on prefix language modeling. The sequence length is 10 and the first two tokens represent the task-specific prefix. How many non-infinity elements are there in the mask for computing attention scores?

*(Numeric input)*



> **Source:** PDF p. 8 | **Marks:** 2

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{56}$

#### Step-by-step solution

1. In a prefix-LM mask, the first two tokens attend bidirectionally within the prefix, giving $2\times2=4$ finite entries. They cannot attend to the suffix.
2. Each of the 8 suffix tokens attends to both prefix tokens and to its causal suffix history including itself. Its row therefore has $3,4,5,6,7,8,9,10$ finite entries.
3. Their sum is $(3+10)\cdot8/2=52$. Add the prefix block: $4+52=56$.
4. Cross-check: a fully causal $10\times10$ mask has $10\cdot11/2=55$ finite entries. Making the two-token prefix bidirectional adds exactly the first-to-second-token entry, yielding 56.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q21 - KV cache bytes per token (Short Answer)

You are configuring a Large Language Model (LLM) for inference and need to estimate the memory footprint of the KV Cache. Calculate the KV cache memory required per token (in Bytes) given the following model architecture:

- Number of Layers ($L$): 32
- Number of Heads ($H$): 16
- Head Dimension ($d_{head}$): 128
- Precision: 2 Bytes (FP16)

*(Numeric input)*



> **Source:** PDF p. 9 | **Marks:** 2

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** $\boxed{262144}$

#### Step-by-step solution

1. Each token stores a key and a value for every head of every layer, introducing a factor of 2 for K and V.
2. Scalar count per token is $2LHd_{head}=2\cdot32\cdot16\cdot128=131072$.
3. At 2 bytes per scalar, storage is $131072\cdot2=262144$ bytes, or 256 KiB per token.
4. This assumes standard multi-head attention with 16 KV heads, one sequence, and no allocation overhead. GQA/MQA would use the number of KV heads instead of the query-head count. The FP16 factor is separate from the K-and-V factor.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

## Context for Q23–Q26

**Source Q22, PDF p. 9 (0 marks).** A team is developing a new large language model (LLM) for code generation, focusing on an autoregressive (AR) approach using the Causal Language Modeling (CLM) objective. They implement a standard Transformer decoder-only architecture. The team is training the model on a sequence of tokens $\mathbf x=(x_1,x_2,\ldots,x_T)$, where $T$ is the total length. The CLM objective aims to maximize the following log-likelihood:

$$\mathcal L(\theta)=\sum_{t=1}^{T-1}\log P(x_{t+1}\mid x_1,\ldots,x_t;\theta).$$

During training, they strictly enforce teacher forcing, meaning the ground-truth previous tokens are always provided as input to predict the current token. Based on the above setup, answer the given subquestions.

### Q23 - CLM training mechanism (MCQ)

Which of the following describes the fundamental training mechanism of this model?

- ( ) The model predicts the entire sequence $\mathbf x$ simultaneously without considering dependencies.
- ( ) The model predicts the token $x_{t+1}$ based only on the tokens $x_1$ up to $x_t$.
- ( ) The model predicts a masked token $x_t$ based on both the left and right context tokens.

> **Source:** PDF p. 9 | **Marks:** 1

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B

#### Step-by-step solution

1. Inspect a term in the objective: $\log P(x_{t+1}\mid x_1,\ldots,x_t;\theta)$. The target is the next token and the conditioning information is its left prefix.
2. This is exactly B. The causal mask prevents later positions from leaking into that prediction.
3. Teacher-forced computation can evaluate all such conditional predictions in parallel, but that does not make the tokens statistically independent as A claims. C describes bidirectional masked language modeling.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q24 - Teacher forcing and the objective (MCQ)

During the training phase on a sequence $\mathbf x$ of length $T$, how does the teacher forcing mechanism specifically relate to the calculation of the loss function $\mathcal L(\theta)$?

- ( ) It means the model uses its own previous predictions $(\hat x_1,\ldots,\hat x_t)$ as input to predict $x_{t+1}$.
- ( ) It dictates that the loss is only calculated for tokens that were incorrectly predicted.
- ( ) It ensures that for every prediction $P(x_{t+1}\mid\ldots)$, the model is conditioned on the ground-truth sequence $(x_1,\ldots,x_t)$.
- ( ) It allows the model to see future tokens $(x_{t+2},\ldots,x_T)$ when predicting $x_{t+1}$.

> **Source:** PDF p. 9-10 | **Marks:** 1

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** C

#### Step-by-step solution

1. Teacher forcing substitutes the actual training prefix as the input history, regardless of what the model would have generated.
2. Each term therefore evaluates the probability assigned to the true next token given the true preceding tokens, as C says.
3. A describes feedback of generated predictions. B is false because cross-entropy is computed for every included target, including correctly predicted ones. D violates causality.
4. The context defines $\mathcal L$ as a log-likelihood to maximize; a conventional minimized loss is its negative (possibly averaged). This sign convention does not alter the teacher-forcing condition.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q25 - Inference and exposure bias (MCQ)

In the inference phase (when the model is used for generation), why is the teacher forcing technique not used, and what is the primary challenge this introduces?

- ( ) Teacher forcing is used, but only with a small probability.
- ( ) It's not used because the ground-truth sequence is unknown; this introduces the exposure bias problem, where the model is unfamiliar with its own prediction errors.
- ( ) It's not used because it drastically slows down the inference speed.
- ( ) It's not used; the challenge is the need for a separate encoder-decoder architecture.

> **Source:** PDF p. 10 | **Marks:** 1

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B

#### Step-by-step solution

1. In open-ended generation, the prompt is available but the correct continuation is not. The model must append its own selected tokens.
2. Those generated prefixes may contain mistakes or combinations less represented in the ground-truth training histories.
3. This mismatch between teacher-forced training and self-conditioned generation is exposure bias; an error can affect later predictions. B identifies both the reason and the challenge. It does not require changing to an encoder-decoder architecture.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

### Q26 - Enforcing causality (MCQ)

Which component of the Transformer decoder is essential for enforcing the Causal Language Modeling constraint?

- ( ) The Feed-Forward Network layer.
- ( ) The Positional Encoding layer.
- ( ) The masked Self-Attention layer.
- ( ) The Cross-Attention layer.

> **Source:** PDF p. 10 | **Marks:** 1

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** C

#### Step-by-step solution

1. Causal language modeling requires each prediction to depend only on permitted prefix tokens.
2. Masked self-attention applies $-\infty$ to future-position logits, making their softmax probabilities zero. Thus future information cannot enter through attention.
3. FFNs transform each position independently and do not specify which other tokens are visible. Positional encoding supplies order but does not block future tokens. A decoder-only model has no encoder cross-attention to enforce this constraint. Hence C is correct.

**Memory hook:** Name the governing rule first, write its formula or table, substitute only the given values, and then check the result against the wording and units.

</details>

---

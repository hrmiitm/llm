export interface Lesson { title: string; subtitle: string; source: string; reading: string; }
export const lessons: Lesson[] = [
{ title: 'Start with the objects', subtitle: 'What is stored, what flows, what is counted?', source: 'GA 1 Q1–3 · GA 2 Q6 · Quiz 1 Q5–6', reading: String.raw`
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
` },
{ title: 'Read the architecture', subtitle: 'Follow one token through your A–U diagram', source: 'Attached architecture questions · GA 2 Q1 · Quiz 1 Q13', reading: String.raw`
The **encoder** reads the source and returns one contextual vector per source position. The **decoder** reads the target prefix and predicts the next target token. The encoder does not generate the translated sentence by itself.

Read the diagram **bottom to top**. Click a box below to see its operation, shape and parameter rule. The $N\times$ bracket repeats the block, with separate weights in each layer by default. Embeddings and output projection sit outside this bracket.

**Self-attention:** queries, keys and values come from the same sequence representation. **Cross-attention:** queries come from the decoder; keys and values come from the encoder output. Thus its score matrix is $T_t\times T_s$, which need not be square.

**Residual + LayerNorm:** $y=\operatorname{LN}(x+\operatorname{Sublayer}(x))$ in the pictured post-norm Transformer. The bypass carries $x$ around a sublayer, and addition requires matching shapes. LayerNorm normalizes the $d$ features of each token, then applies learned $\gamma,\beta\in\mathbb R^d$: $2d$ parameters. Residual addition has zero.

**FFN:** $\operatorname{FFN}(x)=\sigma(xW_1+b_1)W_2+b_2$. It expands $d\to f$, applies a nonlinearity, then contracts $f\to d$. The same FFN weights are applied independently at every token position.

**Three families:** BERT uses bidirectional encoder blocks; GPT uses causal self-attention + FFN, without encoder cross-attention; translation uses both stacks. GPT often uses pre-norm and an extra final norm; use the stated architecture when counting.
` },
{ title: 'Embeddings & position', subtitle: 'Token identity + position → contextual meaning', source: 'GA 1 Q2 · GA 3 Q1, Q4–5 · Quiz 1 Q8', reading: String.raw`
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
` },
{ title: 'Attention, one calculation', subtitle: 'Project → compare → scale → mask → normalize → mix', source: 'GA 1 Q4–8 · GA 2 Q5 · Quiz 1 Q2–4', reading: String.raw`
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
` },
{ title: 'Masks & tensor shapes', subtitle: 'Which token can see which token?', source: 'GA 1 Q1–2 · GA 3 Q2, Q6–7 · Quiz 1 Q5–7, Q9', reading: String.raw`
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
` },
{ title: 'Count every parameter', subtitle: 'Build a ledger; do not memorize one mysterious total', source: 'GA 1 Q3 · GA 2 Q1–3 · GA 3 Q4–6', reading: String.raw`
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
` },
{ title: 'Generation & training', subtitle: 'A model probability is different from a decoding decision', source: 'GA 2 Q4, Q7 · GA 3 Q3, Q8 · GA 4 Q1–6 · Quiz 1 Q9–17', reading: String.raw`
The output linear map produces **logits**, one score per vocabulary token. Softmax turns these into probabilities. Cross-entropy trains the model to increase the true label's probability.

$$P(y_1,\ldots,y_T)=\prod_t P(y_t\mid y_{<t},x),\qquad L=-\sum_{t\in\mathcal M}\ln P(y_t\mid\mathrm{context}).$$
For causal LM, $\mathcal M$ contains prediction positions. For BERT MLM, use only the selected prediction positions. Sum versus mean loss must be stated. With correct-token probabilities 0.2 and 0.16, summed loss is $-\ln(0.2)-\ln(0.16)=3.442$; mean is 1.721.

**Greedy:** take the largest probability now; this does not guarantee the best whole sequence. **Top-k:** retain k largest probabilities and divide each by their retained sum, then sample. **Top-p:** retain the smallest sorted prefix whose cumulative probability reaches p. **Beam search:** expand retained prefixes and keep the best b by joint score (often log-probability); rank prefixes, not just next tokens.

**Probability trap:** an alternative to the greedy output has zero chance under the deterministic greedy procedure, but can have positive model probability. If supplied rows describe only the greedy history, they may not tell you the probabilities after an alternative prefix. This distinction matters for GA 4 Q3.

**Counting trap:** $V^T$ counts full sequences. $\sum_{t=1}^T V^t$ counts non-root tree nodes (Quiz 1 Q15's convention: 2800). If one forward evaluation produces all next-token logits for a prefix, exhaustive expansion needs $\sum_{t=0}^{T-1}V^t$ distinct prefix evaluations (400 for V=7,T=4), before batching/caching details. State which unit is requested.

**Missing histories:** $P(\mathrm{apples}\mid\mathrm{like})$ needs a distribution over preceding histories. In a complete specified two-subject tree it can be marginalized; Quiz 1's partial tree does not establish that completeness. Do not assume missing paths have probability zero.

**BERT / GPT:** BERT uses bidirectional context and MLM; final [CLS] is a conventional classification input, not the only possible pooling method. GPT uses a causal next-token objective. Pretraining from scratch initializes weights; fine-tuning starts from pretrained weights and its objective depends on the task. Degenerate outputs can repeat or become incoherent; changing decoding does not guarantee correctness.
` },
{ title: 'Exam toolkit & practice', subtitle: 'Recognize the question before reaching for a formula', source: 'All first-four assignments + Quiz 1 + your image', reading: String.raw`
**1. Identify a box:** trace its incoming arrows. Three inputs from one sequence → self-attention. Decoder query plus two encoder connections → cross-attention. Bypass meeting a sublayer output → Add & Norm.

**2. Find a shape:** name every axis. Token rows × feature columns. Cancel inner axes in multiplication. Keep batch as an outer axis.

**3. Count parameters:** list unique weight matrices and learned vectors. Write each shape, multiply, add, then multiply by independent layers. Check tying, biases, learned position and final norms.

**4. Calculate attention:** project Q/K/V → dot products → divide by $\sqrt{d_k}$ if specified → mask → row softmax → weighted sum of V. Round only at the end.

**5. Decode / compute loss:** follow the exact conditioning history. Multiply probabilities; sum log losses. Top-k divides by retained mass. A missing probability is not automatically zero.

Use the exercises below without opening the solution first. A correct answer is most useful when you can explain why the tempting alternative is wrong. After these drills, retry the original assignments through the links at the bottom.
` }
];
export interface Exercise { topic: number; question: string; answer: string; hint: string; solution: string; tolerance?: number; }
export const exercises: Exercise[] = [
{topic:0,question:'B=4, T=8, d=256. How many values are in the encoder input?',answer:'8192',hint:'Multiply the three axes.',solution:'4 × 8 × 256 = 8192 activation values. These are not learned parameters.'},
{topic:0,question:'A weight matrix has shape 256 × 64. How many weights?',answer:'16384',hint:'Count its cells.',solution:'256 × 64 = 16384. Neither the batch nor the sentence length multiplies this count.'},
{topic:0,question:'Sequences have 3, 8, 5 and 6 tokens, including any special tokens. Minimum context capacity?',answer:'8',hint:'Every full sequence must fit.',solution:'max(3,8,5,6) = 8. Shorter sequences may be padded to 8 in this batch.'},
{topic:1,question:'Your image: all Add & Norm letters, in ascending order, with no spaces?',answer:'FHMPR',hint:'Two in the encoder; three in the decoder.',solution:'F follows E, H follows G, M follows L, P follows O, R follows Q. Each combines a residual path with a sublayer output.'},
{topic:1,question:'Your image: which letter is masked multi-head self-attention?',answer:'L',hint:'First attention operation above target embeddings.',solution:'L. O is cross-attention; E is encoder self-attention.'},
{topic:1,question:'Your image: which letter receives decoder queries and encoder keys/values?',answer:'O',hint:'Look for the connection between the two stacks.',solution:'O is cross-attention. Its output has target sequence length, because there is one output per query.'},
{topic:1,question:'How many attention sublayers are in one standard encoder-decoder decoder block?',answer:'2',hint:'One reads the target prefix; one reads the source.',solution:'2: masked self-attention and cross-attention. A standard GPT block has only the first.'},
{topic:2,question:'V=1000, d=64. Token embedding parameters?',answer:'64000',hint:'One vector per vocabulary ID.',solution:'1000 × 64 = 64000. Sequence length does not change the lookup-table size.'},
{topic:2,question:'Learned positional table: capacity 64, width 128. Parameters?',answer:'8192',hint:'One vector per supported position.',solution:'64 × 128 = 8192. A sinusoidal table of the same shape has zero learned parameters.'},
{topic:2,question:'Sinusoidal PE, even d=512, position 3: squared norm?',answer:'256',hint:'Each sine/cosine pair contributes one.',solution:'512/2 = 256. The norm itself is 16; the squared norm is 256.'},
{topic:2,question:'GA 3: x=[0.1,0,0.23,0.4,-0.75,1], p=4. Sum of x+PE, to 2 decimals?',answer:'1.75',tolerance:0.01,hint:'Use radians and d=6; sum x is 0.98.',solution:'PE ≈ [−0.756802,−0.653644,0.184599,0.982814,0.008618,0.999963]. Add sum(x)=0.98 → 1.745547 → 1.75.'},
{topic:2,question:'Tied token/output weights, V=1000,d=64, no output bias: total unique parameters in these two uses?',answer:'64000',hint:'Count stored numbers, not uses.',solution:'One shared table: 1000 × 64 = 64000, rather than 128000.'},
{topic:3,question:'Quiz 1 toy example: diagonal sum of the unscaled query-key score matrix?',answer:'4',hint:'The diagonal is 1, 1, 2.',solution:'1 + 1 + 2 = 4. Do not apply √2 scaling to a question about the unscaled matrix.'},
{topic:3,question:'How much does each complete softmax row sum to?',answer:'1',hint:'It is a distribution over keys.',solution:'1, including zeros at masked positions. Columns need not sum to 1.'},
{topic:3,question:'d=128, h=4, standard equal-width heads. Per-head key width?',answer:'32',hint:'Split the model width.',solution:'128/4 = 32. WQ per head is 128 × 32; Q for T tokens is T × 32.'},
{topic:3,question:'A=[0.25,0.75], values v1=[2,0], v2=[0,4]. Second coordinate of the weighted output?',answer:'3',hint:'Weight the values, not the keys.',solution:'z=0.25[2,0]+0.75[0,4]=[0.5,3].'},
{topic:3,question:'For a softmax row, what is the sum of gradients with respect to its logits?',answer:'0',hint:'Use a_j(g_j − weighted average of g).',solution:'Σ a_j g_j − (Σ a_j)(Σ a_k g_k) = 0 because Σ a_j = 1. Individual entries can be nonzero.'},
{topic:4,question:'T=128. Number of future entries forbidden in one causal mask?',answer:'8128',hint:'Strict upper triangle; diagonal is allowed.',solution:'128 × 127 / 2 = 8128. Do not use 128² or include the diagonal.'},
{topic:4,question:'T=6, heads increase from 4 to 8. Additional scores for one sequence, one layer?',answer:'144',hint:'Only count the new heads.',solution:'(8−4) × 6² = 144.'},
{topic:4,question:'B=8,T=32,d=128, six encoder layers, eight heads: final output element count?',answer:'32768',hint:'The final output shape has only B,T,d.',solution:'8 × 32 × 128 = 32768. Do not multiply by layers or heads.'},
{topic:4,question:'Cross-attention: target length 6, source length 9, four heads, batch 2. Total score entries?',answer:'432',hint:'Rows follow queries; columns follow keys.',solution:'2 × 4 × 6 × 9 = 432. Cross-attention is not necessarily square.'},
{topic:4,question:'T=5. How many positions are allowed across one causal attention matrix?',answer:'15',hint:'Include the diagonal.',solution:'5 × 6 / 2 = 15 allowed; 5 × 4 / 2 = 10 forbidden.'},
{topic:5,question:'Standard MHA, d=256,h=4, no biases. Total parameters including WO?',answer:'262144',hint:'Three projections plus the output projection.',solution:'4 × 256² = 262144. Equivalently: 4 heads × 3 × 256 × 64 + 256².'},
{topic:5,question:'FFN d=64,f=256, no bias. Parameters?',answer:'32768',hint:'Expansion and contraction both count.',solution:'64 × 256 + 256 × 64 = 32768. With biases add 256+64=320.'},
{topic:5,question:'One affine LayerNorm at width 64. Parameters?',answer:'128',hint:'Scale and shift.',solution:'64 gamma + 64 beta = 128. Residual addition adds zero parameters.'},
{topic:5,question:'GA 2: both stacks, N=2 each, d=64,f=256, no linear biases; exclude embeddings/output. Parameters?',answer:'230656',hint:'Encoder 49408; decoder 65920.',solution:'2 × (49408 + 65920) = 230656. The decoder contains a second attention sublayer.'},
{topic:5,question:'Output projection d=64,Vt=1500, untied and without bias. Parameters?',answer:'96000',hint:'Map one hidden vector to vocabulary logits.',solution:'64 × 1500 = 96000. With an output bias add 1500.'},
{topic:5,question:'Standard MHA d=64, change h=4 to h=8 while keeping hd_k=hd_v=d. Change in parameter count?',answer:'0',hint:'More heads, narrower projections per head.',solution:'4d² remains 16384. The number of score entries doubles, but stored MHA weights do not.'},
{topic:6,question:'P(you)=0.4, P(eat|you)=0.5, P(apples|you eat)=0.9. Joint probability?',answer:'0.18',tolerance:0.0001,hint:'Follow the full prefix at each step.',solution:'0.4 × 0.5 × 0.9 = 0.18. Add logs only if working in log-space.'},
{topic:6,question:'Top-3 retains probabilities 0.35,0.30,0.20. New probability of the first token, to 3 decimals?',answer:'0.412',tolerance:0.001,hint:'Divide by retained probability mass.',solution:'0.35/(0.35+0.30+0.20) = 0.411765 → 0.412. Do not divide by 3.'},
{topic:6,question:'MLM correct-token probabilities at two selected positions: 0.2 and 0.16. Summed natural-log loss to 2 decimals?',answer:'3.44',tolerance:0.01,hint:'Negative log of each correct label.',solution:'−ln(0.2)−ln(0.16)=3.442019 → 3.44. Mean loss would be 1.721.'},
{topic:6,question:'Seven tokens, four generation steps. How many full-length sequences?',answer:'2401',hint:'Choices multiply across steps.',solution:'7⁴ = 2401. Counting all non-root prefixes instead gives 7+49+343+2401=2800.'},
{topic:6,question:'Vocabulary size 1500; three known token probabilities sum to 0.9. Is a particular fourth token necessarily 0.1? Answer yes/no.',answer:'no',hint:'Who shares the remaining mass?',solution:'No. The remaining 1497 vocabulary entries collectively get 0.1; a particular one is undetermined.'},
{topic:6,question:'Autoregressive inference: four generated tokens, ignore EOS. Minimum sequential token-generation steps?',answer:'4',hint:'One new token per step under ordinary autoregressive decoding.',solution:'4. Teacher-forced training can evaluate the known shifted sequence together; inference must build the prefix.'},
{topic:7,question:'Your image: FFN letters in alphabetical order?',answer:'GQ',hint:'Each is followed by the final Add & Norm of its block.',solution:'G is encoder FFN; Q is decoder FFN. F,H,M,P,R are Add & Norm.'},
{topic:7,question:'d=32,f=128: one encoder block with no linear biases, affine LayerNorm. Parameters?',answer:'12416',hint:'4d² + 2df + 4d.',solution:'4096 + 8192 + 128 = 12416. A decoder block with cross-attention would need another MHA and norm.'},
{topic:7,question:'Learned positions C=100,d=32. Increase actual sequence length from 10 to 20 within capacity. Added positional parameters?',answer:'0',hint:'The capacity table already exists.',solution:'Zero. You use more rows of the existing 100 × 32 table; you do not allocate a new learned table per sentence.'},
{topic:7,question:'Can a non-greedy sentence have positive model probability? Answer yes/no.',answer:'yes',hint:'Model distribution versus deterministic choice.',solution:'Yes. Greedy selects one path; other paths may still have nonzero model probability. Their conditional probabilities must be known to calculate it.'}
];

# May-2026-Quiz-2 — Previous Year Question Paper

> **Paper type:** Previous Year Question (PYQ)
> **Source:** Extracted from `llm_question_papers.tex`
> **Coverage:** encoder-decoder architecture, causal masking, BPE, T5, GPT, BART, WordPiece, data quality, scaling laws, and unigram tokenization.

Attempt each question before opening the solution. The explanations emphasize the reusable rule behind each answer, not just the option letter.

---

## Context for Q2–Q4

The reference diagram below is a faithful rendering of the lettered architecture in the source `.tex` for one ($N=1$) Transformer encoder-decoder block. The component letters are intentionally left as letters; infer each function from its position and connections.

![Lettered Transformer encoder-decoder architecture from the source paper](assets/transformer-lettered-architecture.mmd)

### Q2 — Identify every Add & Norm layer (Short Answer)

**Identify every Add & Norm layer in the labeled architecture. Submit the component letters in alphabetical order as one uppercase string without spaces or punctuation.**

*(Example: if the components are Q, G, and S, answer `GQS`.)*

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** `FHMPR`

#### Step-by-step solution

**Step 1 — Recall the encoder pattern.**

An encoder block has two sublayers:

1. self-attention;
2. feed-forward network.

Each sublayer is followed by a residual addition and layer normalization. In the diagram, those two Add & Norm components are **F** and **H**.

**Step 2 — Recall the decoder pattern.**

A decoder block has three sublayers:

1. masked self-attention;
2. encoder-decoder cross-attention;
3. feed-forward network.

Their Add & Norm components are **M**, **P**, and **R**, respectively.

**Step 3 — Sort the letters.**

$$\{F,H,M,P,R\}\longrightarrow\boxed{\texttt{FHMPR}}.$$

The residual “$+$” nodes themselves are operations, but the question asks for the labeled Add & Norm components, which are the blocks after each sublayer.

</details>

### Q3 — Function of component L (MCQ)

**Identify the function of component `L`.**

- ( ) Positional encoding
- ( ) Feed-forward network
- ( ) Masked multi-head self-attention
- ( ) Multi-head cross-attention
- ( ) Linear output projection

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** C — Masked multi-head self-attention

#### Step-by-step solution

**Step 1 — Locate L in the decoder.**

Component L is the first learned sublayer after the decoder's shifted-right input plus positional encoding.

**Step 2 — Match the standard decoder order.**

The first decoder sublayer is masked self-attention. It lets position $t$ use positions $\leq t$ while blocking future target tokens. Cross-attention comes later, after this masked self-attention, and uses encoder outputs as keys and values.

Therefore,

$$\boxed{\text{L = masked multi-head self-attention}}.$$

</details>

### Q4 — Components appearing more than once (MSQ)

**Assume exactly one encoder block and one decoder block. Identify all listed components that appear more than once. (Select all that apply.)**

- ( ) Positional encoding
- ( ) Feed-forward network
- ( ) Masked multi-head self-attention
- ( ) Multi-head cross-attention
- ( ) Tokenizer
- ( ) Add & Norm

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A, B, and F

#### Step-by-step solution

**Step 1 — Count the encoder and decoder sublayers.**

| Component | Encoder | Decoder | Total |
|---|---:|---:|---:|
| Positional encoding | 1 | 1 | 2 |
| Feed-forward network | 1 | 1 | 2 |
| Masked self-attention | 0 | 1 | 1 |
| Cross-attention | 0 | 1 | 1 |
| Add & Norm | 2 | 3 | 5 |

**Step 2 — Select totals greater than one.**

Positional encoding, feed-forward network, and Add & Norm appear more than once. The tokenizer is not a repeated labeled block in the shown Transformer stack.

$$\boxed{\text{A, B, F}}.$$

</details>

---

### Q5 — Applying a causal mask after softmax (MSQ)

A binary lower-triangular mask $M$ has $M_{ij}=1$ for $j\leq i$ and $0$ otherwise. It is applied **after** softmax as

$$\operatorname{softmax}(A)\odot M.$$

**Identify the correct statements. (Select all that apply.)**

- ( ) The approach violates the autoregressive property.
- ( ) The approach preserves the autoregressive property by making final attention weights for future tokens zero.
- ( ) The final attention weights in the new approach will be greater than or equal to those of the original approach.
- ( ) The attention weights for the final token will always be the same for both approaches.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B and D

#### Step-by-step solution

![Causal masking flow](assets/causal-mask.mmd)

**Step 1 — Compare the two masking locations.**

In the standard method, future logits receive $-\infty$ **before** softmax:

$$a_j^{\text{before}}=\frac{\exp(A_j)\,\mathbf{1}[j\leq i]}{\sum_{k\leq i}\exp(A_k)}.$$

In the proposed method, softmax is computed over every position first and then future entries are zeroed:

$$a_j^{\text{after}}=\frac{\exp(A_j)}{\sum_k\exp(A_k)}\mathbf{1}[j\leq i].$$

**Step 2 — Check autoregressive visibility.**

For $j>i$, the final value is exactly zero. Thus the query cannot use future tokens, so the autoregressive property is not violated. Statement B is true.

**Step 3 — Compare allowed weights.**

The after-softmax method leaves probability mass on masked positions before deleting it, so its surviving weights are generally **smaller** than the renormalized before-softmax weights. Also, the new row may sum to less than 1. Statement C is false.

**Step 4 — Check the final row.**

For the final token, there are no future positions. Its mask row contains only ones, so both methods apply the same softmax to that row. Statement D is true.

$$\boxed{\text{B, D}}.$$

</details>

---

### Q6 — BPE training-iteration updates (MSQ)

**Which statements correctly describe internal state updates during a Byte Pair Encoding (BPE) training iteration? (Select all that apply.)**

- ( ) After a pair is chosen for merging, it is permanently added to the active vocabulary list.
- ( ) The algorithm recalculates the log probability of the entire corpus before the next iteration.
- ( ) The independent frequencies of the two constituent tokens are reduced by the frequency of the merged token.
- ( ) The original constituent tokens are removed from the vocabulary to optimize dictionary size.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A and C

#### Step-by-step solution

**Step 1 — Identify what BPE stores.**

BPE repeatedly stores a merge rule and updates token counts. If the pair $(a,b)$ is replaced by a new token $ab$ with frequency $f_{ab}$, then the count of the merged token is added to the active vocabulary.

**Step 2 — Update constituent counts.**

The occurrences used in the merge are no longer independent occurrences at those positions:

$$f_a\leftarrow f_a-f_{ab},\qquad f_b\leftarrow f_b-f_{ab}.$$

So C is true.

**Step 3 — Reject the incorrect updates.**

- B is false: ordinary BPE does not recompute a full-corpus log-probability objective after every merge; it updates pair frequencies efficiently.
- D is false: the constituent tokens remain valid vocabulary symbols because they can occur elsewhere and are needed by the merge rules.

$$\boxed{\text{A, C}}.$$

</details>

---

### Q7 — T5 span-corruption training (MSQ)

The phrase is **“life is like a box of chocolates”**. The word `life` and the span `box of chocolates` are corrupted.

**Which statements correctly describe training? (Select all that apply.)**

- ( ) The input becomes `<X> is like a <Y>` using unique sentinel tokens.
- ( ) The target is `<X> life <Y> box of chocolates <Z>`, where the final sentinel marks completion.
- ( ) Loss is calculated over the generated sentinel tokens and missing text.
- ( ) The decoder reconstructs the entire original sequence autoregressively and calculates loss over every original position.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A, B, and C

#### Step-by-step solution

**Step 1 — Replace each corrupted span once.**

The first removed span is replaced by `<X>` and the second by `<Y>`:

$$\text{Input: }\boxed{\texttt{<X> is like a <Y>}}.$$

The uncorrupted words stay in the encoder input.

**Step 2 — Build the compact target.**

The decoder target lists each sentinel followed by the text removed at that sentinel:

$$\text{Target: }\boxed{\texttt{<X> life <Y> box of chocolates <Z>}}.$$

`<Z>` is an end sentinel in the question's notation.

**Step 3 — Locate the loss.**

The denoising target contains the sentinels and the missing spans, so the sequence-to-sequence cross-entropy is evaluated over those target positions. The decoder does not reproduce visible input words such as `is`, `like`, or `a` in the target.

Therefore D is false and

$$\boxed{\text{A, B, C}}.$$

</details>

---

### Q8 — GPT-1 textual-entailment delimiter (MCQ)

**During GPT-1 fine-tuning for textual entailment, what is the purpose of the delimiter token `$`?**

- ( ) Trigger the softmax function
- ( ) Separate the premise and hypothesis
- ( ) Mark the end of the sentence
- ( ) Initialize the linear head

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B — Separate the premise and hypothesis

#### Step-by-step solution

Textual entailment supplies two pieces of text: a premise and a hypothesis. GPT-1 concatenates them with a learned delimiter so the model can tell where one segment ends and the other begins. The delimiter is an input marker; it does not itself trigger softmax or initialize a classifier.

$$\boxed{\text{B}}$$

</details>

---

### Q9 — Why use the final decoder token for classification? (MCQ)

**Why is the hidden representation of the final input token used as input to the classification layer in a decoder-only Transformer?**

- ( ) The first token only has positional information and lacks semantic context.
- ( ) The final token is computed independently of self-attention, giving more stable gradients.
- ( ) It aligns with autoregressive training and eliminates teacher forcing.
- ( ) Causal self-attention lets the final token aggregate information from all preceding tokens.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** D

#### Step-by-step solution

**Step 1 — Apply the causal-attention rule.**

At position $t$, causal self-attention can use positions $1,2,\ldots,t$. The final position is therefore allowed to attend to the entire input prefix.

**Step 2 — Use the final hidden state as a summary.**

The final representation can contain information from all earlier tokens, so it is a natural fixed-size summary for a classification head.

The other statements incorrectly claim that the final token is independent of attention, or confuse representation pooling with teacher forcing.

$$\boxed{\text{D}}$$

</details>

---

### Q10 — Temperature before top-$p$ sampling (MCQ)

**With temperature $\tau=5$ applied to logits before top-$p$ sampling, what is the impact on the subsequent sampling step?**

- ( ) It increases the required number of candidate tokens and expands the nucleus.
- ( ) It decreases the required number of candidate tokens and shrinks the nucleus.
- ( ) It truncates the tail, making sampling similar to top-$k$.
- ( ) Nucleus size is unaffected because temperature changes only token order.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** A

#### Step-by-step solution

**Step 1 — Recall temperature scaling.**

If logits are $z_i$, temperature produces

$$p_i=\operatorname{softmax}(z_i/\tau).$$

For $\tau>1$, logit differences are compressed and the probability distribution becomes flatter.

**Step 2 — Apply the top-$p$ rule.**

Top-$p$ chooses the smallest set of highest-probability tokens whose cumulative probability reaches $p$. A flatter distribution needs more tokens to collect the same cumulative mass.

Thus the nucleus expands, so

$$\boxed{\text{A}}.$$

</details>

---

### Q11 — WordPiece merge scoring (MCQ)

**How does the WordPiece scoring formula prioritize token merges?**

- ( ) It evaluates the log-probability of the pair and chooses the highest transition.
- ( ) It merges the pair with the highest absolute frequency.
- ( ) It prioritizes pairs that occur together frequently but rarely appear independently.
- ( ) None of these.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** C

#### Step-by-step solution

A common WordPiece score for a pair $(x,y)$ is proportional to

$$\operatorname{score}(x,y)=\frac{\operatorname{count}(xy)}{\operatorname{count}(x)\operatorname{count}(y)}.$$

The numerator rewards frequent co-occurrence. The denominator reduces the score for tokens that are individually common, so the algorithm favors pairs whose joint occurrence is especially informative relative to their independent frequencies.

That is exactly option C:

$$\boxed{\text{C}}.$$

</details>

---

### Q12 — T5 for regression and classification (MCQ)

**How does T5 process tasks such as semantic similarity regression and sentiment classification during fine-tuning?**

- ( ) Encoder outputs regression and decoder outputs classification tokens, selected by prompt.
- ( ) Separate regression and classification heads are appended to the decoder.
- ( ) Both tasks are treated as sequence generation with task-specific prefixes and string outputs.
- ( ) None of these.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** C

#### Step-by-step solution

**Step 1 — Use the text-to-text formulation.**

T5 expresses each task as text generation. A task prefix tells the model what to do, for example:

$$\texttt{"stsb sentence1: ... sentence2: ..."}\longrightarrow\texttt{"4.2"},$$
$$\texttt{"sentiment: ..."}\longrightarrow\texttt{"positive"}.$$

**Step 2 — Keep one output interface.**

Continuous values can be generated as decimal strings and class labels as words or other text strings. The standard T5 setup therefore does not require separate task-specific classifier heads.

$$\boxed{\text{C}}$$

</details>

---

### Q13 — BART denoising architecture (MCQ)

**How does BART handle corrupted inputs compared with its output?**

- ( ) The decoder ignores the encoder and performs standard causal language modeling.
- ( ) The encoder processes the original sequence and the decoder predicts corrupted tokens.
- ( ) The encoder processes the corrupted sequence and the decoder predicts the entire original sequence.
- ( ) Both encoder and decoder process the corrupted sequence to calculate masked loss.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** C

#### Step-by-step solution

BART is an encoder-decoder denoising autoencoder:

1. corrupt the original text;
2. give the corrupted text to the bidirectional encoder;
3. ask the autoregressive decoder to reconstruct the complete original text.

$$\text{corrupted input}\xrightarrow{\text{encoder}}h
\xrightarrow{\text{decoder}}\text{original sequence}.$$

The target is not only the missing spans; it is the full original sequence. Hence

$$\boxed{\text{C}}.$$

</details>

---

### Q14 — C4 versus Unfiltered-C4 (MCQ)

**When comparing C4 with an “Unfiltered-C4” dataset about eight times larger, what was the observed effect on downstream performance?**

- ( ) Performance remained identical, showing saturation.
- ( ) Performance improved only for high-resource translation tasks.
- ( ) Performance improved significantly because of increased data diversity.
- ( ) Performance degraded across tasks despite the larger scale.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** D

#### Step-by-step solution

**Step 1 — Distinguish quantity from quality.**

Unfiltered-C4 has more raw text, but it retains noise that C4's heuristic filtering removes: duplicated pages, boilerplate, malformed text, and undesirable content.

**Step 2 — Interpret the experiment.**

The larger raw corpus did not compensate for its poorer data quality. The filtered C4 model obtained better downstream results; the unfiltered version underperformed despite being much larger.

The intended lesson is that useful, diverse, clean tokens are more valuable than raw token count alone:

$$\boxed{\text{D}}.$$

</details>

---

### Q15 — Adapter Layers (MCQ)

**Which description matches the Adapter Layers fine-tuning strategy?**

- ( ) Randomly freeze half of the attention heads.
- ( ) Add small dense-ReLU-dense blocks after FFN layers and update only them and Layer Norm parameters.
- ( ) Update all parameters with a much smaller learning rate.
- ( ) Increase $d_{model}$ of existing feed-forward networks.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B

#### Step-by-step solution

Adapters are small trainable modules inserted into a frozen pre-trained network. A typical adapter is a bottleneck projection, nonlinearity, and expansion:

$$h\longrightarrow W_{up}\,\sigma(W_{down}h).$$

Only the adapter parameters—and commonly layer-normalization parameters—are updated. The large pre-trained Transformer remains frozen, reducing memory and trainable-parameter cost.

$$\boxed{\text{B}}$$

</details>

---

### Q16 — Effect of duplicated training data (MCQ)

**Which is a reported negative effect of significantly duplicated content in LLM training data?**

- ( ) It decreases inference speed during deployment.
- ( ) It causes repeated sequences to be generated much more frequently.
- ( ) It permanently reduces the maximum context window.
- ( ) It removes the ability to process multilingual input.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B

#### Step-by-step solution

Duplicate examples overrepresent the same strings and patterns. The model can overfit or memorize those patterns, reducing data efficiency and increasing the chance that decoding falls into repetitive continuations.

This is a training-data quality problem; it does not directly change the deployed model's context-window limit or hardware inference speed.

$$\boxed{\text{B}}$$

</details>

---

### Q17 — Scaling laws with a large model and small dataset (MCQ)

**With fixed compute $C$, what is likely if an extraordinarily large model (large $N$) is trained on a relatively small dataset (small $D$)?**

- ( ) The model is over-trained and memorizes the dataset.
- ( ) The model is under-trained and less capable than a smaller model trained on more data with the same compute.
- ( ) The model perfectly memorizes and generalizes flawlessly.
- ( ) Inference speed increases dramatically.

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B

#### Step-by-step solution

**Step 1 — Relate compute to model size and training tokens.**

Increasing $N$ consumes more compute per training token. Under a fixed budget, an extremely large model therefore receives fewer effective training tokens or fewer updates.

**Step 2 — Identify the imbalance.**

The model is parameter-rich but data-poor. It is under-trained relative to its capacity, so it can be less capable than a smaller, more compute-efficient model trained on a better-sized dataset.

This is why scaling-law analyses seek a balanced allocation between model parameters and data:

$$\boxed{\text{B}}.$$

</details>

---

## Context for Q18–Q19

Consider the corpus **“there is no spoon”**, ignoring spaces and punctuation. Build a vocabulary from the four whole-word tokens and all distinct individual characters. The resulting vocabulary has 13 tokens.

Whole words: `there`, `is`, `no`, `spoon`
Character tokens: `t`, `h`, `e`, `r`, `i`, `s`, `n`, `o`, `p`

### Q18 — Valid segmentations (MSQ)

**Using this vocabulary, which proposed segmentations of `prison` and `rhino` are valid? (Select all that apply.)**

- ( ) `prison`
- ( ) `p, r, is, o, n`
- ( ) `p, r, is, on`
- ( ) `r, h, i, n, o`
- ( ) `r, h, i, no`

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B, D, and E

#### Step-by-step solution

**Step 1 — List the usable symbols.**

The vocabulary contains whole words `there`, `is`, `no`, `spoon` and individual characters `t,h,e,r,i,s,n,o,p`. It does **not** contain arbitrary multi-character strings such as `prison`, `on`, or `nois`.

**Step 2 — Check `prison`.**

$$\texttt{p | r | is | o | n}$$

uses only vocabulary tokens, so B is valid. `prison` is not itself a token, and `on` is not a token, so A and C are invalid.

**Step 3 — Check `rhino`.**

Both

$$\texttt{r | h | i | n | o}$$

and

$$\texttt{r | h | i | no}$$

use valid character/whole-word tokens. Therefore D and E are valid.

$$\boxed{\text{B, D, E}}$$

</details>

### Q19 — Highest-probability unigram segmentation (MCQ)

**Using a unigram language model, identify the segment with the highest probability.**

- ( ) `n, o, i, s, e, s`
- ( ) `no, is, e, s`
- ( ) `nois, e, s`
- ( ) `no, i, s, e, s`

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** B — `no, is, e, s`

#### Step-by-step solution

**Step 1 — Count token occurrences in the corpus.**

There are 4 whole-word occurrences and 14 character occurrences, so the combined token count is $18$. Relevant counts are:

| Token | Count |
|---|---:|
| `no` | 1 |
| `is` | 1 |
| `n` | 2 |
| `o` | 3 |
| `i` | 1 |
| `s` | 2 |
| `e` | 2 |

Thus $P(w)=\operatorname{count}(w)/18$ and the probability of a segmentation is the product of its token probabilities.

**Step 2 — Compare the valid candidates.**

Ignoring the common denominator powers for a moment:

$$P(\texttt{n,o,i,s,e,s})=\frac{2\cdot3\cdot1\cdot2\cdot2\cdot2}{18^6},$$
$$P(\texttt{no,is,e,s})=\frac{1\cdot1\cdot2\cdot2}{18^4},$$
$$P(\texttt{no,i,s,e,s})=\frac{1\cdot1\cdot2\cdot2\cdot2}{18^5}.$$

`nois` is not in the constructed vocabulary, so option C is invalid.

**Step 3 — Compare B and D directly.**

$$\frac{P(\texttt{no,is,e,s})}{P(\texttt{no,i,s,e,s})}
=\frac{4/18^4}{8/18^5}=\frac{4\times18}{8}=9>1.$$

The two-token-shorter segmentation in B has the greater probability, and it also beats A. Therefore

$$\boxed{\text{B — no, is, e, s}}.$$

</details>

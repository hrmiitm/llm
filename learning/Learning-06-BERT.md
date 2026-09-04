# Learning 06 — BERT and Masked Language Modeling

## Goal

Learn how BERT uses an encoder and bidirectional context to predict deliberately hidden tokens, then use its special representations for classification.

![BERT versus GPT](assets/bert-gpt.mmd)

### Q1 — BERT's core stack (MCQ)

What is BERT fundamentally built from?

- ( ) A decoder-only causal stack
- ( ) An encoder-only stack with bidirectional self-attention
- ( ) A no-attention recurrent stack
- ( ) An encoder-decoder translation stack only

<details>
<summary>Solution</summary>

BERT uses transformer encoder blocks. In ordinary self-attention, a token can attend to contextual tokens on both its left and right.

**Mnemonic:** **B**ERT looks **B**oth ways; **G**PT **G**oes forward.

**Answer:** B
</details>

### Q2 — MLM target (MCQ)

In masked language modeling (MLM), what is the model trained to predict?

- ( ) The next token at every position only
- ( ) The original identities of selected hidden/corrupted tokens
- ( ) The number of transformer layers
- ( ) A fixed answer regardless of input

<details>
<summary>Solution</summary>

Some input tokens are selected and replaced/corrupted during training. BERT uses surrounding context to recover their original token identities.

**Answer:** B
</details>

### Q3 — One masked-token loss (Numeric Input)

The correct original token has predicted probability \(0.7\). What is its MLM cross-entropy contribution \(-\ln(0.7)\), rounded to three decimals?

*(Numeric input)*

<details>
<summary>Solution</summary>

\[
-\ln(0.7)=0.356675\ldots\approx0.357.
\]

The loss rewards placing high probability on the true hidden token.

**Answer:** \(\boxed{0.357}\)
</details>

### Q4 — Two masked tokens (Numeric Input)

Two selected tokens have correct-token probabilities \(0.5\) and \(0.25\). If the MLM loss is the **sum** over selected positions, what is the total loss, rounded to three decimals?

*(Numeric input)*

<details>
<summary>Solution</summary>

\[
-\ln(0.5)-\ln(0.25)=0.693147+1.386294=2.079441.
\]

So the summed loss is about \(2.079\). If an objective asks for a mean, divide by the number of selected positions afterward.

**Answer:** \(\boxed{2.079}\)
</details>

### Q5 — MLM context versus MLM targets (MSQ)

The corrupted input is `[CLS] the [MASK] sat [MASK] [SEP]`; the two selected original targets are `cat` and `down`. Under the standard simplified MLM loss, which statements are correct?

- ( ) There are two direct token-prediction loss terms.
- ( ) `the` and `sat` can influence the predictions through encoder attention even though they are not direct targets.
- ( ) The `[CLS]` position receives an MLM loss term merely because it exists in the input.
- ( ) The model should predict the literal token `[MASK]` as the target at both selected positions.

<details>
<summary>Solution</summary>

The model processes every input position, so unmasked context words can provide evidence to the masked positions. But the simplified MLM objective sums only over the two selected locations:

\[
\mathcal L=-\log P(\texttt{cat}\mid\tilde x)-\log P(\texttt{down}\mid\tilde x).
\]

`[MASK]` is an input corruption marker, not the label the model is supposed to recover.

**Answer:** A and B
</details>

### Q6 — `[CLS]` representation (MCQ)

For single-sentence sequence classification, how is BERT's `[CLS]` representation commonly used?

- ( ) It is discarded before training
- ( ) It is fed to a task-specific classifier head
- ( ) It is used only as a padding symbol
- ( ) It blocks all attention scores

<details>
<summary>Solution</summary>

`[CLS]` is placed at the beginning of the input. Its final contextual vector can be passed to a learned classifier for tasks such as sentiment or topic classification.

**Answer:** B
</details>

### Q7 — `[SEP]` role (MCQ)

What does `[SEP]` commonly mark in BERT-style inputs?

- ( ) The end of one segment and/or separation between segments
- ( ) The only token that may be masked
- ( ) The vocabulary softmax denominator
- ( ) A causal future boundary for generation

<details>
<summary>Solution</summary>

`[SEP]` separates segments such as sentence A and sentence B, and can mark the end of the input sequence. Segment/type embeddings can additionally tell the model which segment each token belongs to.

**Answer:** A
</details>

### Q8 — Sentence-pair representation size (Numeric Input)

Segment A has 3 wordpiece tokens and segment B has 2. Using `[CLS] A [SEP] B [SEP]` with \(d_{\text{model}}=16\), how many scalar values are in the one-example input representation before the first encoder layer?

*(Numeric input)*

<details>
<summary>Solution</summary>

First count positions: one `[CLS]`, 3 A tokens, one separator, 2 B tokens, and a final separator:

\[
1+3+1+2+1=8.
\]

Each position has 16 features after token, position, and segment/type signals are combined:

\[
8\times16=\boxed{128}.
\]

The segment embedding tells A and B apart; it does not add another tensor axis.

**Answer:** \(\boxed{128}\)
</details>

### Q9 — BERT versus GPT (MSQ)

Which comparisons are correct?

- ( ) BERT MLM can use left and right context around a selected token.
- ( ) GPT causal language modeling blocks future tokens at a position.
- ( ) BERT is naturally used as a left-to-right free-running generator without changing the objective.
- ( ) Both BERT and GPT use token embeddings and transformer attention.

<details>
<summary>Solution</summary>

BERT's encoder attention is bidirectional in its MLM setup, while GPT's causal mask supports next-token generation. Both are transformer architectures with learned representations, but their pretraining objectives create different strengths.

**Answer:** A, B and D
</details>

### Q10 — Bidirectional intuition (MCQ)

Why can BERT be useful for understanding a token in a sentence?

- ( ) Its ordinary encoder attention can incorporate context on both sides
- ( ) It predicts only from tokens that come after it
- ( ) It forbids all token-to-token interaction
- ( ) It removes words before making embeddings

<details>
<summary>Solution</summary>

For a masked word in “The bank of the river,” context on both sides helps resolve meaning. BERT learns to exploit such two-sided context during MLM pretraining.

**Answer:** A
</details>

### Q11 — Classification-head parameters (Numeric Input)

Suppose the final `[CLS]` vector has width \(d_{\text{model}}=16\) and a classifier predicts 3 classes. How many trainable parameters are in its linear classifier head, including bias?

*(Numeric input)*

<details>
<summary>Solution</summary>

The classifier maps 16 features to 3 logits:

\[
W_{\text{cls}}\in\mathbb{R}^{16\times3}.
\]

That gives \(16\times3=48\) weights and 3 bias values:

\[
48+3=\boxed{51}.
\]

The head emits 3 logits per example, but the question asks for its parameter count.

**Answer:** \(\boxed{51}\)
</details>

### Q12 — Special-input information (MSQ)

Which information can a BERT-style input representation include before entering encoder layers?

- ( ) Token embeddings
- ( ) Positional embeddings
- ( ) Segment/type embeddings for sentence pairs
- ( ) The future ground-truth label as an input feature

<details>
<summary>Solution</summary>

BERT commonly combines token, position, and token-type/segment information. The supervised label is a target used for loss, not an input that the model should receive.

**Answer:** A, B and C
</details>

### Q13 — Choose the objective (MCQ)

You want a model to fill in a deliberately hidden word using both neighboring words. Which pretraining objective most directly matches this goal?

- ( ) Masked language modeling
- ( ) Greedy decoding
- ( ) Causal next-token prediction only
- ( ) Top-\(k\) sampling

<details>
<summary>Solution</summary>

MLM explicitly trains the model to recover selected hidden tokens from their surrounding context. Greedy/top-\(k\) are decoding methods, not pretraining objectives.

**Answer:** A
</details>

### Q14 — MLM loss form (Short Answer)

Write a simplified MLM loss for selected mask positions \(M\), where \(x_i\) is the original token and \(\tilde{x}\) is the corrupted input.

<details>
<summary>Solution</summary>

\[
\mathcal{L}_{\text{MLM}}=-\sum_{i\in M}\log P(x_i\mid\tilde{x}).
\]

The conditioning sequence \(\tilde{x}\) includes the corrupted input; the target remains the original token \(x_i\).

**Answer:** `-sum_{i in M} log P(x_i | x_tilde)`
</details>

### Q15 — Design a review classifier (MSQ)

You are building a three-class review classifier with a BERT-style encoder. Which design choices are appropriate?

- ( ) Start the input with `[CLS]` and feed its final contextual vector to a 3-logit classifier head.
- ( ) During supervised classification fine-tuning, compare the 3 logits with the review's class label using a classification loss.
- ( ) Sample a free-form continuation from the vocabulary as the only way to obtain the class.
- ( ) Keep positional information so the encoder can distinguish different word orders.

<details>
<summary>Solution</summary>

A BERT-style encoder gives every token, including `[CLS]`, bidirectional contextual information. The classifier head converts the final `[CLS]` vector to class logits; a supervised classification loss teaches which logit should be largest. Positions remain necessary because “not good” and “good, not …” are not interchangeable word orders.

**Answer:** A, B and D
</details>

# Learning 04 — GPT, Position, and Causal Masks

## Goal

Understand why a decoder-only model needs positions and a causal mask, then connect next-token training to autoregressive generation.

![Causal-mask pattern](assets/causal-mask.svg)

For numerical questions, use a GPT-style layer with sequence length \(T=5\), \(d_{\text{model}}=128\), and \(h=4\) heads. When stated, use batch size \(B=2\).

### Q1 — Why positions? (MCQ)

Why are positional embeddings or positional encodings needed in a transformer?

- ( ) Self-attention alone has no inherent notion of token order
- ( ) They make all vocabulary items share one embedding
- ( ) They remove the need for a causal mask
- ( ) They directly choose the next token

<details>
<summary>Solution</summary>

Without position information, reordering the input rows merely reorders the same attention computation. The model needs a location signal to distinguish “dog bites man” from “man bites dog.”

**Mnemonic:** embeddings say **what**; positions say **where**.

**Answer:** A
</details>

### Q2 — Position table shape (MCQ)

If one sequence has five positions and \(d_{\text{model}}=128\), what is the shape of its position-embedding matrix before adding it to token embeddings?

- ( ) \(5\times128\)
- ( ) \(128\times5\times5\)
- ( ) \(5\times5\)
- ( ) \(128\times128\)

<details>
<summary>Solution</summary>

There is one 128-dimensional position vector for every one of the 5 slots, so the shape matches the per-example token embedding matrix: \(5\times128\).

**Answer:** A
</details>

### Q3 — Sinusoidal position zero (Numeric Input)

For sinusoidal encodings, every sine coordinate at position \(p=0\) is \(\sin(0)=0\) and every cosine coordinate is \(\cos(0)=1\). If \(d_{\text{model}}=128\), what is the squared \(L_2\) norm of the position-0 encoding?

*(Numeric input)*

<details>
<summary>Solution</summary>

There are 64 sine coordinates equal to 0 and 64 cosine coordinates equal to 1:

\[
\|PE_0\|_2^2=64(0^2)+64(1^2)=64.
\]

**Answer:** \(\boxed{64}\)
</details>

### Q4 — Masked scores across a real layer (Numeric Input)

For \(B=2\), \(h=4\), and \(T=5\), how many raw self-attention score cells are blocked because they point strictly into the future?

*(Numeric input)*

<details>
<summary>Solution</summary>

For one head and one sequence, the blocked future cells are

\[
1+2+3+4=\frac{5(5-1)}2=10.
\]

That triangular mask is repeated for each of 2 batch items and 4 heads:

\[
2\times4\times10=\boxed{80}.
\]

The diagonal remains visible: a token may attend to itself. Do not count a masked location once per feature dimension—the mask acts on score cells, not on \(d_h\) coordinates.

**Answer:** \(\boxed{80}\)
</details>

### Q5 — Mask shape (MCQ)

What is the attention-mask shape for one five-token self-attention sequence before broadcasting over batch and heads?

- ( ) \(5\times128\)
- ( ) \(5\times5\)
- ( ) \(4\times32\)
- ( ) \(128\times128\)

<details>
<summary>Solution</summary>

Every query position needs a permission decision for every key position, producing a \(T\times T\) table.

**Answer:** B
</details>

### Q6 — Total visible causal history (Numeric Input)

Across all 5 query positions, 4 heads, and 2 batch items, how many causal self-attention score cells remain **allowed** (including the diagonal)?

*(Numeric input)*

<details>
<summary>Solution</summary>

For one sequence and one head, query positions may see \(1,2,3,4,5\) keys respectively. The lower triangle therefore contains

\[
1+2+3+4+5=\frac{5(5+1)}2=15
\]

allowed cells. Multiply by 4 heads and 2 examples:

\[
2\times4\times15=\boxed{120}.
\]

As a check, allowed plus blocked is \(120+80=200=2\times4\times5^2\), the full score-tensor size.

**Answer:** \(\boxed{120}\)
</details>

### Q7 — Right-to-left text (MCQ)

If the written language is right-to-left but tokens are stored in their natural generation order, what happens to the causal-mask rule?

- ( ) The mask must always be flipped visually
- ( ) The rule is still “allow earlier generated positions, block later ones”
- ( ) Causal masking is unnecessary
- ( ) The model must use an encoder only

<details>
<summary>Solution</summary>

The mask follows the *token-index/generation order*, not the page's visual direction. If the sequence is indexed in generation order, position \(i\) may attend to \(j\le i\).

**Answer:** B
</details>

### Q8 — GPT architecture (MCQ)

Which transformer stack is GPT fundamentally based on?

- ( ) Encoder-only, bidirectional attention
- ( ) Decoder-only, masked self-attention
- ( ) Encoder followed by a separate decoder for every token
- ( ) A recurrent network with no attention

<details>
<summary>Solution</summary>

GPT is a decoder-only transformer. Its self-attention is masked so each position predicts from its preceding context rather than peeking at future tokens.

**Answer:** B
</details>

### Q9 — Shifted labels with special tokens (MCQ)

Teacher-forced input is \([\text{BOS},x_1,x_2,x_3]\) and the desired continuation is \([x_1,x_2,x_3,\text{EOS}]\). What is the training target for the state at the input position containing \(x_3\)?

- ( ) \(x_2\)
- ( ) \(x_3\)
- ( ) \(\text{BOS}\)
- ( ) \(\text{EOS}\)

<details>
<summary>Solution</summary>

Causal language modeling shifts the labels by one place:

\[
\text{input: }[\text{BOS},x_1,x_2,x_3]
\quad\longrightarrow\quad
\text{labels: }[x_1,x_2,x_3,\text{EOS}].
\]

The final content-token state is trained to predict the stop token, \(\text{EOS}\). Including EOS teaches the model when a sequence should end.

**Answer:** D
</details>

### Q10 — Training and inference (MSQ)

Which statements correctly compare teacher-forced training with inference?

- ( ) During training, the true previous tokens can be supplied as context.
- ( ) During inference, a generated token becomes context for the next step.
- ( ) During inference, the model sees all future ground-truth tokens.
- ( ) Exposure to its own earlier errors is an inference challenge.

<details>
<summary>Solution</summary>

Training can score all shifted next-token targets in parallel while conditioning on true prefixes. At inference, no future ground truth exists; generated history is fed back, so an early mistake can affect later choices.

**Answer:** A, B and D
</details>

### Q11 — Weight tying intuition (MCQ)

If the input embedding matrix and output vocabulary classifier are tied, why can a rare token receive a useful gradient even when it is not the correct next token?

- ( ) Tying creates an extra vocabulary
- ( ) It appears in the softmax denominator as a competing output class
- ( ) It turns attention into convolution
- ( ) It prevents any gradients from reaching embeddings

<details>
<summary>Solution</summary>

Every vocabulary logit participates in softmax normalization. With tied weights, the output-side gradient also updates the corresponding input embedding vector. This can give rare tokens learning signal beyond their few input occurrences.

**Answer:** B
</details>

### Q12 — Attention scale (Numeric Input)

For \(d_{\text{model}}=128\) and \(h=4\), what is the scale divisor \(\sqrt{d_h}\) in scaled dot-product attention, rounded to three decimals?

*(Numeric input)*

<details>
<summary>Solution</summary>

First find a head's width:

\[
d_h=\frac{128}{4}=32.
\]

Then use the score scale:

\[
\sqrt{d_h}=\sqrt{32}\approx5.657.
\]

This division regulates the magnitude of QK scores before softmax; it does not change the number of heads or tokens.

**Answer:** \(\boxed{5.657}\)
</details>

### Q13 — Pretraining and fine-tuning (MSQ)

Which statements are correct?

- ( ) GPT-style pretraining can learn next-token prediction from raw text.
- ( ) Fine-tuning adapts pretrained parameters to a downstream task or instruction behavior.
- ( ) Fine-tuning means discarding the pretrained model and starting with random weights.
- ( ) Both stages can use gradients to update parameters.

<details>
<summary>Solution</summary>

Pretraining learns broad language patterns from a self-supervised next-token objective. Fine-tuning begins from those learned weights and adjusts them using more specific data/objectives. It is not a restart.

**Answer:** A, B and D
</details>

### Q14 — The causal permission rule (Short Answer)

Using query index \(i\) and key index \(j\), state the rule for an allowed entry in a standard left-to-right causal mask.

<details>
<summary>Solution</summary>

An entry is allowed when the key is not from the future:

\[
j\le i.
\]

All entries with \(j>i\) receive a very negative score before softmax, making their probability effectively zero.

**Answer:** `j ≤ i`
</details>

### Q15 — Debug a generation claim (MSQ)

A student says: “At generation step 4, GPT can use the true step-5 word because it saw it during teacher-forced training.” Which corrections are valid?

- ( ) At inference, there is no true future word available to provide.
- ( ) The causal mask prevents step 4 from reading a later token even if a full training sequence is present.
- ( ) The token generated at step 4 becomes part of the prefix used at step 5.
- ( ) Teacher forcing makes a future-token leak correct at inference.

<details>
<summary>Solution</summary>

Teacher forcing is a training convenience: it supplies known earlier ground-truth tokens and scores shifted labels in parallel. The causal mask still blocks future positions. At inference, the model has only the prompt and its own earlier generated tokens.

**Memory hook:** training can be parallel; generation is a **prefix loop**.

**Answer:** A, B and C
</details>

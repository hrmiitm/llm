# Learning 04 — GPT, Position, and Causal Masks

## Goal

Understand why a decoder-only model needs positions and a causal mask, then connect next-token training to autoregressive generation.

![Causal-mask pattern](assets/causal-mask.svg)

For numerical questions, use a GPT-style layer with sequence length \(T=5\), \(d_{\text{model}}=128\), and \(h=4\) heads.

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

### Q4 — Future cells in a causal mask (Numeric Input)

For \(T=5\), how many entries lie strictly above the main diagonal and must be blocked in a left-to-right causal attention mask?

*(Numeric input)*

<details>
<summary>Solution</summary>

The blocked future cells are

\[
1+2+3+4=\frac{5(5-1)}2=10.
\]

The diagonal remains visible: a token may attend to itself.

**Answer:** \(\boxed{10}\)
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

### Q6 — Visible history (Numeric Input)

Using zero-based positions \(0,1,2,3,4\), how many key positions may query position \(3\) attend to in standard left-to-right causal attention?

*(Numeric input)*

<details>
<summary>Solution</summary>

It may see positions \(0,1,2,3\): all past tokens plus itself.

\[
3+1=4.
\]

**Answer:** \(\boxed{4}\)
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

### Q9 — Causal-language-model target (MCQ)

For the token sequence \([x_1,x_2,x_3,x_4]\), what is the usual next-token prediction target at the position containing \(x_2\)?

- ( ) \(x_1\)
- ( ) \(x_2\)
- ( ) \(x_3\)
- ( ) All vocabulary tokens at once

<details>
<summary>Solution</summary>

Causal language modeling shifts the labels one step left:

\[
P(x_1,x_2,x_3,x_4)=\prod_t P(x_t\mid x_{<t}).
\]

The state at \(x_2\)'s position is trained to predict the next token \(x_3\).

**Answer:** C
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

### Q12 — Per-head width (Numeric Input)

What is \(d_h\) for \(d_{\text{model}}=128\) and \(h=4\)?

*(Numeric input)*

<details>
<summary>Solution</summary>

\[
d_h=\frac{128}{4}=32.
\]

**Answer:** \(\boxed{32}\)
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

### Q15 — One-sentence checkpoint (MCQ)

Which statement best summarizes the GPT learning loop?

- ( ) Read every future token, then classify the first token
- ( ) Use a causal prefix to predict the next token, then append the chosen token at generation time
- ( ) Encode source tokens with unrestricted attention only
- ( ) Replace all probabilities with a fixed lookup table

<details>
<summary>Solution</summary>

GPT learns a probability distribution for the next token from a causal prefix. At generation time, it selects or samples a token and extends the prefix, repeating the same operation.

**Answer:** B
</details>

# Learning 08 — Read a Transformer Diagram Like an Engineer

## Goal

Turn a lettered Transformer diagram into a mental execution trace. You will identify operations from their position, residual connections, and arrows—not from memorizing a coloured block diagram.

## Context for Q1–Q15

This is the faithful A–U diagram used in the PYQ source. It shows one encoder and one decoder block; the rounded frames marked \(N\times\) mean that each block can be repeated.

![Lettered Transformer encoder-decoder architecture](assets/transformer-lettered-architecture.svg)

### Q1 — Source-side input addition (MCQ)

What does the lower-left addition node combine before information enters component E?

- ( ) Source token embeddings and positional encoding
- ( ) Encoder states and decoder states
- ( ) Vocabulary logits and softmax probabilities
- ( ) The causal mask and attention weights

<details>
<summary>Solution</summary>

Trace the arrows: `Inputs → A → + → E`, while `B → +`. Before any encoder sublayer, a Transformer combines source-token content with a position signal:

\[
H_s^{(0)}=\operatorname{Embed}_{source}(x)+PE.
\]

The two inputs must have the same width so addition is defined.

**Memory hook:** at the bottom of each stack, **content + place** comes first.

**Answer:** A
</details>

### Q2 — Decoder-side input addition (MCQ)

What does the lower-right addition node combine before component L?

- ( ) Raw source tokens and encoder logits
- ( ) Shifted-right target embeddings and positional encoding
- ( ) Final decoder probabilities and a causal mask
- ( ) Encoder keys, encoder values, and decoder queries

<details>
<summary>Solution</summary>

The caption says `Outputs (shifted right) → C → + → L`, and D also enters the plus node. In a standard decoder, C is the shifted target-token embedding path and D supplies positional information.

The right shift makes the input at a position contain only earlier target tokens while the label is the next token.

**Answer:** B
</details>

### Q3 — First encoder sublayer (MCQ)

Which operation is component E?

- ( ) Encoder self-attention
- ( ) Encoder-decoder cross-attention
- ( ) Feed-forward network
- ( ) Vocabulary softmax

<details>
<summary>Solution</summary>

The encoder order is

\[
\text{input} \to \text{self-attention} \to \text{Add \& Norm} \to \text{FFN} \to \text{Add \& Norm}.
\]

E is the first learned box after source input addition, so it is encoder self-attention. Its residual bypass joins at F.

**Answer:** A
</details>

### Q4 — Find every Add & Norm layer (Short Answer)

Submit the letters of every Add & Norm block in alphabetical order, with no spaces.

<details>
<summary>Solution</summary>

An encoder has two sublayers, so its post-sublayer Add & Norm blocks are F and H. A decoder has three sublayers, so its Add & Norm blocks are M, P, and R.

\[
\{F,H,M,P,R\}\longrightarrow\texttt{FHMPR}.
\]

Do not include the circular \(+\) nodes: they are the raw residual additions before the labelled normalization blocks.

**Answer:** `FHMPR`
</details>

### Q5 — First decoder sublayer (MCQ)

Which operation is component L?

- ( ) Encoder self-attention
- ( ) Masked decoder self-attention
- ( ) Cross-attention over source states
- ( ) Linear output projection

<details>
<summary>Solution</summary>

L is the first decoder sublayer after shifted-right target input. It must be masked self-attention so a target position cannot read future target tokens. The residual bypass from the decoder input joins after L at M.

**Answer:** B
</details>

### Q6 — Find cross-attention from the arrows (MCQ)

Which component is encoder-decoder cross-attention?

- ( ) G
- ( ) L
- ( ) O
- ( ) T

<details>
<summary>Solution</summary>

The arrow from encoder output H enters O. That extra source-side input is the signature of cross-attention:

\[
Q\text{ from decoder},\qquad K,V\text{ from encoder states }H.
\]

G is the encoder FFN, L is masked decoder self-attention, and T is after the decoder block.

**Answer:** C
</details>

### Q7 — Decoder feed-forward component (MCQ)

Which labelled component is the decoder's position-wise feed-forward network?

- ( ) L
- ( ) O
- ( ) Q
- ( ) R

<details>
<summary>Solution</summary>

The decoder sequence is

\[
L\,(\text{masked self-attention})\to M\,(\text{Add \& Norm})
\to O\,(\text{cross-attention})\to P\,(\text{Add \& Norm})
\to Q\,(\text{FFN})\to R\,(\text{Add \& Norm}).
\]

The FFN transforms each target position independently after attention has communicated across positions/source tokens.

**Answer:** C
</details>

### Q8 — Output head order (MCQ)

After the decoder block, the diagram has R → S → T → U. Which interpretation is correct?

- ( ) S is linear vocabulary projection, T is softmax, U is the output distribution
- ( ) S is cross-attention, T is FFN, U is layer norm
- ( ) S is positional encoding, T is causal masking, U is a source embedding
- ( ) S is a residual addition, T is a decoder state, U is an encoder state

<details>
<summary>Solution</summary>

Once the decoder stack has produced a contextual state, a linear map creates one logit per vocabulary item, then softmax turns logits into probabilities:

\[
h_t\xrightarrow{\text{linear}}z_t\xrightarrow{\text{softmax}}P(y_t\mid y_{<t},x).
\]

The upward U arrow denotes the resulting output distribution/token decision.

**Answer:** A
</details>

### Q9 — Count Add & Norm blocks (Numeric Input)

For one encoder block and one decoder block, how many labelled Add & Norm blocks are present?

*(Numeric input)*

<details>
<summary>Solution</summary>

The encoder has two: F and H. The decoder has three: M, P, and R.

\[
2+3=\boxed{5}.
\]

The five count follows the number of attention/FFN sublayers, not the number of input-position additions.

**Answer:** \(\boxed{5}\)
</details>

### Q10 — Repeated-stack count (Numeric Input)

If both rounded frames are repeated \(N=4\) times with independent parameters, how many Add & Norm blocks are executed along one source-to-target pass through all encoder and decoder layers?

*(Numeric input)*

<details>
<summary>Solution</summary>

Each encoder-decoder layer pair contributes 5 Add & Norm blocks from Q9. Repeating each stack four times gives

\[
4(2)+4(3)=4(5)=\boxed{20}.
\]

This counts the labelled normalization blocks in the repeated stacks; it does not count the two embedding-plus-position additions at the bottom.

**Answer:** \(\boxed{20}\)
</details>

### Q11 — Residual-path reasoning (MSQ)

Which statements correctly interpret the curved bypass arrows?

- ( ) The source input representation bypasses E and joins E's output before F.
- ( ) The output of F bypasses G and joins G's output before H.
- ( ) The encoder output H directly bypasses every decoder sublayer.
- ( ) The decoder has one residual bypass around each of L, O, and Q.

<details>
<summary>Solution</summary>

Residual paths preserve the input to a sublayer and add it back to that sublayer's result. The diagram shows two encoder bypasses (into F and H) and three decoder bypasses (into M, P, and R). The arrow from H to O is **cross-attention memory**, not a residual bypass through the decoder.

**Memory hook:** residual arrows go around a local sublayer; cross-attention arrows cross stacks.

**Answer:** A, B and D
</details>

### Q12 — Components appearing more than once (MSQ)

For one encoder and one decoder block, which component types appear more than once?

- ( ) Positional encoding
- ( ) Feed-forward network
- ( ) Masked self-attention
- ( ) Cross-attention
- ( ) Add & Norm

<details>
<summary>Solution</summary>

There is a source positional signal and a target positional signal, so positional encoding appears twice. There is one FFN in each stack, so FFN appears twice. Add & Norm appears five times. Masked self-attention and cross-attention occur only once each in this one-block architecture.

**Answer:** A, B and E
</details>

### Q13 — Where source information enters the decoder (MCQ)

At which labelled component does the decoder first receive the encoder's final state H as keys and values?

- ( ) L
- ( ) M
- ( ) O
- ( ) Q

<details>
<summary>Solution</summary>

The cross-stack arrow terminates at O. In cross-attention, each decoder state asks a question (Q), while H supplies the source-side keys and values. This lets the target representation focus on source tokens relevant to its current generation step.

**Answer:** C
</details>

### Q14 — Decoder execution trace (Short Answer)

Write the labelled decoder path from the shifted-right output input C through the final output U. Include D at the input addition and use arrows between labels.

<details>
<summary>Solution</summary>

Follow the arrows from bottom to top. C and D meet at the input addition, then the decoder sublayers and output head proceed in order:

\[
C + D \to L \to M \to O \to P \to Q \to R \to S \to T \to U.
\]

This trace is a powerful debugging tool: a causal mask belongs at L, encoder memory enters O, and vocabulary probabilities appear only after S and T.

**Answer:** `C + D -> L -> M -> O -> P -> Q -> R -> S -> T -> U`
</details>

### Q15 — Diagram-debugging checkpoint (MSQ)

A learner makes the following claims about the diagram. Which claims should be corrected?

- ( ) “Q receives encoder states H directly as keys and values.”
- ( ) “L needs a causal mask because it is decoder self-attention.”
- ( ) “F and H are the two encoder Add & Norm blocks.”
- ( ) “T produces vocabulary logits before S applies softmax.”

<details>
<summary>Solution</summary>

O—not Q—receives encoder states for cross-attention, so the first claim is incorrect. L is indeed the masked self-attention sublayer, and F/H are correctly identified. The output order is S (linear logits) then T (softmax), so the final claim reverses them.

**Answer:** A and D
</details>

# Learning 05 — Sequence Probability and Decoding

## Goal

Learn the difference between a model's probabilities and the procedure used to turn them into text. Compare greedy decoding, exhaustive search, top-\(k\), and nucleus sampling.

![Decoder search](assets/decoder-search.svg)

For Questions 1–6, use the following tiny autoregressive model. It starts with `<s>` and generates two tokens. At step 1:

\[
P(A\mid<s>)=0.6,\qquad P(B\mid<s>)=0.4.
\]

At step 2:

\[
P(C\mid A)=0.5,\quad P(D\mid A)=0.5,\qquad
P(C\mid B)=0.9,\quad P(D\mid B)=0.1.
\]

Break ties in favor of the alphabetically earlier token.

### Q1 — A sequence probability (Numeric Input)

What is \(P(A,C\mid<s>)\)?

*(Numeric input)*

<details>
<summary>Solution</summary>

Autoregressive sequence probability multiplies conditional probabilities:

\[
P(A,C\mid<s>)=P(A\mid<s>)P(C\mid A)=0.6\times0.5=0.30.
\]

**Mnemonic:** a sequence is a probability **chain**, so multiply its links.

**Answer:** \(\boxed{0.3}\)
</details>

### Q2 — Compare a second path (Numeric Input)

What is \(P(B,C\mid<s>)\)?

*(Numeric input)*

<details>
<summary>Solution</summary>

\[
P(B,C\mid<s>)=P(B\mid<s>)P(C\mid B)=0.4\times0.9=0.36.
\]

Although \(B\) is not the most likely first token, its continuation is much stronger.

**Answer:** \(\boxed{0.36}\)
</details>

### Q3 — Greedy's first move (MCQ)

Which token does greedy decoding choose at the first step?

- ( ) A
- ( ) B
- ( ) C
- ( ) It must enumerate both complete paths first

<details>
<summary>Solution</summary>

Greedy decoding chooses the locally largest probability at each step. Since \(0.6>0.4\), it chooses \(A\) first.

**Answer:** A
</details>

### Q4 — Greedy sequence (MCQ)

What full two-token sequence does greedy decoding produce under the stated tie rule?

- ( ) \(A,C\)
- ( ) \(A,D\)
- ( ) \(B,C\)
- ( ) \(B,D\)

<details>
<summary>Solution</summary>

Greedy first chooses \(A\). After \(A\), \(C\) and \(D\) tie at \(0.5\); the rule chooses alphabetically earlier \(C\). Hence the output is \((A,C)\).

**Answer:** A
</details>

### Q5 — Best complete sequence (MCQ)

Which two-token sequence has the highest joint probability?

- ( ) \(A,C\)
- ( ) \(A,D\)
- ( ) \(B,C\)
- ( ) \(B,D\)

<details>
<summary>Solution</summary>

\[
P(A,C)=P(A,D)=0.30,\quad P(B,C)=0.36,\quad P(B,D)=0.04.
\]

So \((B,C)\) is globally best. Greedy missed it because it committed to the locally best first step.

**Intuition:** local best does not always mean route best.

**Answer:** C
</details>

### Q6 — Decoding distinctions (MSQ)

Which statements are correct?

- ( ) Greedy decoding makes a local choice at each step.
- ( ) Exhaustive search can compare all complete candidate sequences in a finite toy problem.
- ( ) Greedy decoding is guaranteed to find the maximum-probability full sequence.
- ( ) A decoding algorithm operates on probabilities produced by the model.

<details>
<summary>Solution</summary>

Greedy is fast because it makes no backtracking. Exhaustive search can find the global best by evaluating all paths, but the number of paths grows quickly. The model supplies conditional probabilities; the decoder decides how to use them.

**Answer:** A, B and D
</details>

### Q7 — Top-\(k\) renormalization (Numeric Input)

A next-token distribution is \([0.5,0.3,0.2]\). With top-\(k\) sampling and \(k=2\), what is the renormalized probability of the originally most likely token?

*(Numeric input)*

<details>
<summary>Solution</summary>

Keep the top two tokens, whose retained mass is \(0.5+0.3=0.8\). Then renormalize:

\[
\frac{0.5}{0.8}=0.625.
\]

The discarded token receives probability 0 for this sampling step.

**Answer:** \(\boxed{0.625}\)
</details>

### Q8 — Nucleus sampling with changing candidate size (Numeric Input)

A next-token distribution in descending order is \([0.45,0.25,0.12,0.10,0.08]\). Under nucleus sampling with \(p=0.80\), what is the renormalized probability of the first token, rounded to three decimals?

*(Numeric input)*

<details>
<summary>Solution</summary>

1. Accumulate descending probabilities: \(0.45\), then \(0.70\), then \(0.82\).
2. The smallest retained nucleus has the first three tokens because \(0.82\ge0.80\).
3. Renormalize within that set:

\[
\frac{0.45}{0.82}=0.54878\ldots\approx0.549.
\]

Unlike top-\(k\), top-\(p\) adapts its candidate-set size to the distribution's shape. The final two tokens receive probability 0 for this draw.

**Answer:** \(\boxed{0.549}\)
</details>

### Q9 — Mean sequence negative log-likelihood (Numeric Input)

For a three-token target continuation, the correct-token probabilities are \(0.8\), \(0.5\), and \(0.25\). What is the **mean** negative log-likelihood per token, rounded to three decimals?

*(Numeric input)*

<details>
<summary>Solution</summary>

First obtain the sequence probability:

\[
0.8\times0.5\times0.25=0.1.
\]

The summed negative log-likelihood is \(-\ln(0.1)=2.302585\ldots\). The question asks for the **mean** across three predicted tokens:

\[
\frac{2.302585}{3}=0.767528\ldots\approx0.768.
\]

Higher correct-token probability gives lower loss; always check whether a prompt wants a sum or a mean.

**Answer:** \(\boxed{0.768}\)
</details>

### Q10 — Why use log probabilities? (MCQ)

Why are log probabilities commonly added during search instead of multiplying raw probabilities?

- ( ) Logarithms reverse the ranking of sequences
- ( ) Products become sums and very small products are numerically easier to handle
- ( ) They make every sequence probability equal to 1
- ( ) They eliminate the vocabulary softmax

<details>
<summary>Solution</summary>

\[
\log\prod_t p_t=\sum_t\log p_t.
\]

Because log is increasing, maximizing a product is equivalent to maximizing the sum of its log probabilities. The sum is more stable than multiplying many tiny numbers.

**Answer:** B
</details>

### Q11 — Exhaustive-search growth (Numeric Input)

With vocabulary size \(V=4\), how many distinct nonempty prefixes exist through generation length 4: all length-1 through length-4 candidates combined?

*(Numeric input)*

<details>
<summary>Solution</summary>

There are \(4\) length-1 prefixes, \(4^2=16\) length-2 prefixes, \(4^3=64\) length-3 prefixes, and \(4^4=256\) length-4 prefixes:

\[
4+16+64+256=340.
\]

This exponential growth is why exact search becomes impractical for realistic vocabularies and lengths.

**Answer:** \(\boxed{340}\)
</details>

### Q12 — Sampling trade-offs (MSQ)

Which statements are true?

- ( ) Greedy decoding is deterministic when ties are resolved consistently.
- ( ) Sampling can produce different outputs from the same prompt.
- ( ) Top-\(k\) always keeps a fixed number of candidates before sampling.
- ( ) Sampling guarantees factually correct text.

<details>
<summary>Solution</summary>

Sampling introduces randomness, which can improve variety but cannot guarantee truth. Top-\(k\) fixes the number of retained candidates; greedy is repeatable under a fixed tie rule.

**Answer:** A, B and C
</details>

### Q13 — Repetition degeneration (MCQ)

A model repeatedly emits a high-probability phrase. Which interpretation is best?

- ( ) The model has proven the phrase is true
- ( ) A locally attractive loop can dominate generation, causing repetitive degeneration
- ( ) The causal mask has become bidirectional
- ( ) The vocabulary contains only one token

<details>
<summary>Solution</summary>

Autoregressive generation feeds earlier output back as input. A repetition can reinforce its own probability and become a loop. Decoding choices and repetition penalties are often used to manage this behavior, not to establish factuality.

**Answer:** B
</details>

### Q14 — Chain rule (Short Answer)

Write the chain-rule factorization of a three-token sequence \((x_1,x_2,x_3)\).

<details>
<summary>Solution</summary>

\[
P(x_1,x_2,x_3)=P(x_1)P(x_2\mid x_1)P(x_3\mid x_1,x_2).
\]

Each new token conditions on the prefix already generated.

**Answer:** `P(x1) P(x2 | x1) P(x3 | x1, x2)`
</details>

### Q15 — Beam-search checkpoint (MSQ)

Use the two-step model from Q1–Q5. A beam search has width 2 and ranks candidates by joint probability without length normalization. Which statements are correct?

- ( ) After step 1, the beam keeps both prefixes \(A\) and \(B\).
- ( ) After expanding step 2, \((B,C)\) is retained because its joint probability is \(0.36\).
- ( ) Greedy's sequence \((A,C)\) is guaranteed to be the only sequence retained by this beam.
- ( ) A finite-width beam is more exploratory than greedy but is not a universal guarantee of the global optimum for arbitrary problems.

<details>
<summary>Solution</summary>

At step 1, width 2 keeps both available prefixes. At step 2, the four joint probabilities are \(0.30,0.30,0.36,0.04\), so \((B,C)\) is retained and one of the tied \(A\) continuations occupies the other slot. Greedy's output is therefore not the only retained candidate.

A beam can recover paths that greedy prunes, but a narrow beam can still discard a future-winning prefix in a larger search tree.

**Answer:** A, B and D
</details>

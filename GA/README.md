# Large Language Models (LLM) — Graded Assignments & Learning Notes

This unified directory contains all **Graded Assignments (GAs)**, their corresponding **step-by-step beginner learning notes**, and shared image assets.

---

## 📚 Course Overview & Contents

| Week / Topic | Assignment | Learning Notes | Key Topics Covered |
|:---:|:---:|:---:|---|
| **Week 1** | [GA 1](ga1.md) | [Weeks 1–2 Notes](week1-week2-learning-notes.md) | Context length $T$, embedding tensors, self-attention dot product, attention matrix dimensions |
| **Week 2** | [GA 2](ga2.md) | [Weeks 1–2 Notes](week1-week2-learning-notes.md) | Multi-Head Attention (MHA), parameter counting, projection matrices, encoder-decoder cross-attention |
| **Week 3** | [GA 3](ga3.md) | [Weeks 3–4 Notes](week3-week4-learning-notes.md) | GPT architecture, Causal Language Modeling (CLM), decoding strategies (Greedy, Beam Search, Top-$k$, Top-$p$) |
| **Week 4** | [GA 4](ga4.md) | [Weeks 3–4 Notes](week3-week4-learning-notes.md) | BERT architecture, Masked Language Modeling (MLM), Next Sentence Prediction (NSP), bidirectional encoder |
| **Week 5** | [GA 5](ga5.md) | [Week 5 Notes](week5-learning-notes.md) | Vocabulary construction, Word-level vs Char-level vs Subword, Byte-Pair Encoding (BPE), WordPiece |
| **Week 7** | [GA 7](ga7.md) | [Week 7 Notes](week7-learning-notes.md) | BART denoising objective, greedy search loss trace ($0.95$), T5 span corruption, sentinel tokens, token budgets ($B \times T$) |
| **Week 8** | [GA 8](ga8.md) | [Week 8 Notes](week8-learning-notes.md) | 10 LLM architecture taxonomy, pre-training data triad, Kaplan scaling law ($2.857$), RefinedWeb pipeline (`63452187`), dataset sizing (`2341`), Sangrah |
| **Week 11** | [GA 11](ga11.md) | [Week 11 Notes](week11-learning-notes.md) | Attention complexity ($O(T^2)$), exact FLOP counting ($1072.69$ MFLOPs), RAM sizing ($2097.15$ KB), local window attention, block permutations, KV caching ($25.17$ MB) |
| **Week 12** | [GA 12](ga12.md) | [Week 12 Notes](week12-learning-notes.md) | Positional encodings (APE, RPE, RoPE, ALiBi), length extrapolation, sinusoidal relative encoding proof, Shaw RPE tensor ($T \times T \times d_{\text{model}}$), NoPos causal masking |

---

## 🖼️ Assets Directory (`assets/`)

Shared media and figures used across the assignments and notes:
- `LLM.png` — Standard Transformer encoder-decoder architecture diagram
- `W1-F1.PNG` — Multi-head attention visualization across 3 attention heads
- `W2_data.JPG` — Source-to-Tamil parallel translation dataset table
- `japanese_sample.png` — Japanese text tokenization sample (unsegmented script without whitespace)
- `LLM_11.png` — 4-head block permutation masking matrices for sparse block-wise attention

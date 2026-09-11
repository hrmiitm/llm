# IIT Madras NPTEL — Large Language Models (LLM) Exam Portal

> **New: [Transformer Visual Lab](transformer-lab/README.md)** — eight guided lessons, interactive architecture and calculations, and 38 explained exercises covering GA 1–4 and Quiz 1. Open **Visual Lab** in the portal navigation.

[![Deploy LLM Exam Portal to GitHub Pages](https://github.com/hrmiitm/llm/actions/workflows/deploy.yml/badge.svg)](https://github.com/hrmiitm/llm/actions/workflows/deploy.yml)
[![Live Site](https://img.shields.io/badge/Live%20Portal-GitHub%20Pages-blue?style=flat&logo=github)](https://hrmiitm.github.io/llm/)

Interactive, TCS-iON CBT-style exam portal and practice platform for the **IIT Madras NPTEL Large Language Models** course graded assignments.

🚀 **Live Portal**: [https://hrmiitm.github.io/llm/](https://hrmiitm.github.io/llm/)

---

## 🌟 Key Features

- **TCS-iON Style CBT Interface**:
  - Top header with exam title, countdown timer, question palette, and submit action.
  - Authentic color-coded question palette:
    - 🟩 **Green**: Answered
    - 🟥 **Red**: Not Answered
    - ⬜ **Gray**: Not Visited
    - 🟪 **Purple**: Marked for Review
    - 🟪🟢 **Purple with green badge**: Answered & Marked for Review
  - Action controls: *Previous*, *Save & Next*, *Mark for Review & Next*, *Clear Response*, *Submit Test*.
- **Exam & Practice Modes**:
  - **Exam Mode**: Timed, real-time question palette tracking, confirmation modal showing question status counts, auto-submit on timer expiry.
  - **Practice Mode**: Untimed self-paced study with instant feedback, option verification, and complete step-by-step worked solutions.
- **Rich LaTeX & Image Rendering**:
  - Fast math rendering using [KaTeX](https://katex.org/) supporting inline (`$..$`, $`...`$) and display (`$$...$$`, ` ```math `) formulas.
  - Markdown tables, tokenization visualizations, and attention matrix diagrams.
- **Question Types Supported**:
  - Single-choice (Radio buttons)
  - Multiple-select (Checkboxes with validation)
  - Numeric input (Tolerant evaluation)
- **Local Persistence & Privacy**:
  - State autosaved in browser [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (`idb`).
  - Resume in-progress exams anytime after page refresh or crash.
  - Complete attempt history and score analytics stored on-device.
- **Zero-Backend Static Site**:
  - 100% client-side React 19 + TypeScript + Vite SPA.
  - Deployed automatically to GitHub Pages via GitHub Actions.

---

## 📚 Included Assignments

| Week | Assignment | Topics | Questions | Score |
|:---:|:---|:---|:---:|:---:|
| **1** | [GA 1](https://hrmiitm.github.io/llm/#/exam/ga1) | Context Length, Embedding Tensors, Self-Attention, Attention Matrix | 8 | 100 / 100 |
| **2** | [GA 2](https://hrmiitm.github.io/llm/#/exam/ga2) | Multi-Head Attention, Parameter Counting, Projection Matrices, Cross-Attention | 7 | 100 / 100 |
| **3** | [GA 3](https://hrmiitm.github.io/llm/#/exam/ga3) | GPT Architecture, Causal LM, Decoding Strategies, Positional Encoding | 8 | 100 / 100 |
| **4** | [GA 4](https://hrmiitm.github.io/llm/#/exam/ga4) | BERT Architecture, Masked LM, NSP, Bidirectional Encoder | 6 | 100 / 100 |
| **5** | [GA 5](https://hrmiitm.github.io/llm/#/exam/ga5) | Vocabulary Construction, BPE, WordPiece, Tokenization | 12 | 100 / 100 |
| **7** | [GA 7](https://hrmiitm.github.io/llm/#/exam/ga7) | BART, T5, Span Corruption, Sentinel Tokens | 7 | 100 / 100 |
| **8** | [GA 8](https://hrmiitm.github.io/llm/#/exam/ga8) | LLM Taxonomy, Pre-training Data, Kaplan Scaling Law, Dataset Sizing | 10 | 100 / 100 |
| **11** | [GA 11](https://hrmiitm.github.io/llm/#/exam/ga11) | Attention Complexity, FLOP Counting, KV Caching, Local Window Attention | 8 | 100 / 100 |
| **12** | [GA 12](https://hrmiitm.github.io/llm/#/exam/ga12) | Positional Encodings, RoPE, ALiBi, Length Extrapolation | 6 | 100 / 100 |
| **Total** | **9 Assignments** | | **72 Questions** | **100% Avg** |

---

## Previous Year End-Term Papers

Start with the [2025 End-Term Learning Notes](pyq/2025-ET-learning-notes.md): a beginner guide to all three papers with worked examples, diagrams, a formula sheet, transfer exercises, and a complete question-to-lesson map.

Each paper preserves the source question numbers, options, shared contexts and original marks, with visually checked extraction and step-by-step solutions. Source ambiguities and answer assumptions are identified in the solutions; the saved PDFs do not show official answer keys.

| Paper | Questions | Original marks | Source PDF |
|---|---:|---:|---|
| [April-2025-ET](pyq/April-2025-ET.md) | 22 | 50 | [PDF](pyq/April-2025-ET.pdf) |
| [August-2025-ET](pyq/August-2025-ET.md) | 17 | 40 | [PDF](pyq/August-2025-ET.pdf) |
| [December-2025-ET](pyq/December-2025-ET.md) | 25 | 50 | [PDF](pyq/December-2025-ET.pdf) |

---

## 📁 Repository Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions workflow for GitHub Pages
├── GA/                       # Markdown source files for Graded Assignments & notes
│   ├── assets/               # Image diagrams referenced in questions
│   ├── ga1.md ... ga12.md    # Assignment questions and solutions
│   └── week*-notes.md        # Learning notes per week
├── portal/                   # Vite + React + TypeScript Web Application
│   ├── public/
│   │   ├── 404.html          # SPA redirect for GitHub Pages
│   │   ├── assets/           # Synchronized diagram images
│   │   └── content/          # Compiled JSON question packs & catalog
│   ├── scripts/
│   │   └── compile-content.js # Content compiler (parses GA/*.md → JSON)
│   ├── src/
│   │   ├── components/       # UI components (Palette, QuestionRenderer, Timer, Modal)
│   │   ├── features/         # Pages (home, exam, practice, results, history)
│   │   ├── lib/              # Markdown/LaTeX renderer, scoring, content loader
│   │   ├── storage/          # IndexedDB persistence layer
│   │   └── store/            # Zustand exam state management
│   ├── package.json
│   └── vite.config.ts
└── SPEC.md                   # System and technical specification
```

---

## 💻 Local Development

1. **Clone the repository**:
   ```bash
   git clone git@github.com:hrmiitm/llm.git
   cd llm/portal
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Compile content & start the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Preview production build locally**:
   ```bash
   npm run preview
   ```

---

## 🚢 Deployment (GitHub Pages)

Deployment is automated via [GitHub Actions](.github/workflows/deploy.yml).

Every push to `main`:
1. Checks out the repository.
2. Installs dependencies and runs `npm run build` in `portal/`.
3. Compiles all `GA/*.md` markdown files and synchronizes image assets.
4. Emits the production bundle to `portal/dist`.
5. Uploads and deploys the artifact to GitHub Pages.

> **Note**: To enable GitHub Pages for this repository:
> Go to **Repository Settings** → **Pages** → **Build and deployment** → Set **Source** to **GitHub Actions**.

---

## 📄 License

Educational materials and learning notes for IIT Madras NPTEL course on Large Language Models.

## Computer System Design

The [CSD section](csd-pyq/README.md) contains two previous-year papers with all original questions, options, diagrams, marks, and step-by-step solutions. Printed-key disagreements and ambiguous wording are documented beside each solution. Both papers are available in the portal under **Computer System Design**.

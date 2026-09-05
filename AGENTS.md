# Agent Guidelines & Repository Architecture

This document provides architectural context, development rules, content authoring contracts, and operational workflows for AI agents working in the **IIT Madras NPTEL Large Language Models (LLM)** repository.

---

## 1. Repository Identity & Scope

This repository serves two core purposes:
1. **Course Knowledge Base**: Complete learning notes, graded assignments (`GA/`), previous year examination papers (`pyq/`), conceptual study modules (`learning/`), video lecture transcripts (`vid/`), and architectural diagrams (`.mmd`).
2. **Static CBT Exam Portal (`portal/`)**: A modern, responsive, computer-based test (CBT) portal inspired by TCS-iON / NPTEL examination interfaces, built as a zero-backend Single Page Application (SPA) deployed to GitHub Pages at `https://hrmiitm.github.io/llm/`.

---

## 2. Directory Layout & Roles

```
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow deploying portal/dist to GitHub Pages
├── .gitignore                  # Root ignore (node_modules, dist, logs, cache)
├── AGENTS.md                   # Agent guidelines, rules, and system documentation (this file)
├── README.md                   # Human-facing project overview, topics table, and quickstart
├── SPEC.md                     # Product and technical specifications for the exam portal
├── GA/                         # Graded Assignments (Weeks 1–12)
│   ├── assets/                 # Image diagrams referenced in GA questions
│   ├── ga1.md ... ga12.md      # Graded assignment questions and verified answers
│   └── week*-learning-notes.md # Subject notes per week
├── pyq/                        # Previous Year Exam Questions
│   ├── assets/                 # Mermaid diagram sources (.mmd)
│   ├── llm_question_papers.tex # Raw LaTeX examination papers
│   ├── May-2026-Quiz-1.md      # Structured quiz 1 questions and derivations
│   └── May-2026-Quiz-2.md      # Structured quiz 2 questions and derivations
├── learning/                   # Conceptual Learning Modules
│   ├── assets/                 # Architecture diagram sources (.mmd)
│   └── Learning-01-*.md ...    # 9 modules (Foundations, Attention, GPT, BERT, etc.)
├── vid/                        # Lecture transcripts and study notes
│   ├── transformer-notes.md    # In-depth Transformer mechanics breakdown
│   └── transformer.txt         # Raw video subtitles / transcript
└── portal/                     # Vite + React 19 + TypeScript Web Application
    ├── public/
    │   ├── 404.html            # SPA fallback redirect for GitHub Pages
    │   ├── favicon.svg         # SVG favicon
    │   ├── assets/             # Synchronized static images and diagrams
    │   └── content/            # Build-time compiled JSON packs and catalog.json
    ├── scripts/
    │   └── compile-content.js  # Build-time parser (GA + PYQ + Learning → JSON packs)
    ├── src/
    │   ├── components/         # Reusable UI components (Timer, Palette, Modal, QuestionRenderer)
    │   ├── features/           # Pages (HomePage, ExamPage, PracticePage, ResultsPage, HistoryPage, CustomExamPage)
    │   ├── lib/                # KaTeX/Markdown renderer, scoring engine, content loaders
    │   ├── storage/            # IndexedDB persistence layer (idb)
    │   ├── store/              # Zustand exam session and state store
    │   ├── styles/             # TCS-iON palette design system and variables
    │   └── types.ts            # Domain TypeScript interfaces
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts          # Vite configuration with base path handling
```

---

## 3. Technology Stack & Design Conventions

### Core Stack
- **Framework**: React 19 + TypeScript 6 + Vite 8
- **Routing**: `HashRouter` from `react-router-dom` (essential for static GitHub Pages hosting without 404 reload issues)
- **Styling**: Vanilla CSS (`portal/src/styles/index.css`). **Do NOT use TailwindCSS unless explicitly requested by the user.**
- **State Management**: `zustand` for in-memory exam state, timer synchronization, and question navigation
- **Offline Storage**: `idb` (IndexedDB) for storing active attempts, practice stats, and completed history
- **Rendering Pipeline**:
  - `marked` (Markdown parsing)
  - `katex` (Fast LaTeX math rendering: `$..$`, $`...`$, `$$...$$`, and ` ```math `)
  - `mermaid` (Architecture and flow diagrams rendered via `MarkdownContent.tsx`)
  - `dompurify` (Sanitization of all rendered HTML)
- **Linter**: `oxlint`

### Design Guidelines (TCS-iON Exam Theme)
- Palette status codes:
  - 🟩 **Green** (`#22c55e`): Answered
  - 🟥 **Red** (`#ef4444`): Not Answered (visited, but unanswered)
  - ⬜ **Gray** (`#94a3b8`): Not Visited
  - 🟪 **Purple** (`#a855f7`): Marked for Review
  - 🟪🟢 **Purple with Green dot** (`#3b82f6`): Answered & Marked for Review
- Clean typography with system fonts and Google Fonts (`Inter`). High-contrast readability, accessible keyboard navigation, and responsive drawer support for mobile exam screens.

---

## 4. Invariant Rules for Agents

1. **Static-Only Boundary**:
   - The application has **NO backend server** and **NO database server**.
   - Do NOT introduce cookies, server actions, dynamic server endpoints, or authentication backends.
   - All scoring, attempt history, and autosave state must run 100% client-side.

2. **Content Re-compilation Requirement**:
   - Whenever any markdown file or diagram in `GA/`, `pyq/`, or `learning/` is added, edited, or deleted, you **MUST run `npm run compile`** inside `portal/`.
   - `scripts/compile-content.js` parses the Markdown questions, copies image and `.mmd` assets into `portal/public/assets/`, and generates updated JSON files in `portal/public/content/`.

3. **Routing Must Remain `HashRouter`**:
   - GitHub Pages serves static files from a single repository path (`/llm/`).
   - Using `BrowserRouter` causes HTTP 404s when users refresh subpaths like `/exam/ga1`.
   - Always keep `HashRouter` (`#/exam/ga1`, `#/practice/ga1`, `#/history`) unless full SPA redirection infrastructure is verified.

4. **Base URL and Asset Paths**:
   - Vite is configured with `base: process.env.BASE_URL || (process.env.NODE_ENV === 'production' ? '/llm/' : '/')`.
   - Image assets in Markdown should be referenced as `assets/filename.png` or `assets/filename.mmd`.
   - `portal/src/lib/renderer.ts` rewrites asset paths using `import.meta.env.BASE_URL` to ensure diagrams and images load correctly across both local development and GitHub Pages.

5. **Existing Libraries Over Reinventing Wheels**:
   - As stated in `SPEC.md`: *"Instead of inventing new things use the library available for any features with minimal code maximum possible output with design and existing library uses."*
   - Use `katex` for math, `mermaid` for diagrams, `idb` for IndexedDB, `zustand` for state, and `marked` for markdown.

6. **Documentation & Comments Integrity**:
   - Preserve existing comments, docstrings, and learning explanations unless specifically asked to edit them.

---

## 5. Development & Build Commands

All commands for the web application should be executed in the `portal/` directory:

```bash
# Working directory
cd portal

# 1. Compile all question packs (GA, PYQ, Learning) and sync assets
npm run compile

# 2. Start local development server (http://localhost:5173/)
npm run dev

# 3. Typecheck and build static production bundle (output to portal/dist/)
npm run build

# 4. Run linter
npm run lint

# 5. Preview production build locally (http://localhost:4173/llm/)
npm run preview
```

---

## 6. Question Authoring & Markdown Contract

When creating or modifying question banks in `GA/*.md`, `pyq/*.md`, or `learning/*.md`, adhere to this structure so `scripts/compile-content.js` parses questions accurately:

### Question Types
- **Single Choice (`single_choice`)**: Options formatted with `- ( ) Option text` or `- [ ] Option text`.
- **Multiple Select (`multiple_select`)**: Indicated by question text containing `(Select all that apply)` or `(MSQ)`.
- **Numeric (`numeric`)**: Indicated by `*(Numeric input)*` or `(Short Answer)`.

### Question Anatomy Template
```markdown
## Context for Q1–Q3 (Optional shared context)

Diagram or common problem statement shared across questions.
![Diagram Caption](assets/example-diagram.mmd)

---

### Q1 — Title of Question (MCQ)

**Question statement with LaTeX math such as $d_{\text{model}} = 64$:**

- ( ) Option A
- ( ) Option B
- (x) Option C (or marked with x if providing answer key directly)
- ( ) Option D

<details>
<summary><b>Answer & Solution</b></summary>

**Answer:** C

#### Step-by-step solution

1. Explanation step 1 with derivation.
2. Explanation step 2 with formula:
   $$\text{Attention}(Q,K,V) = \operatorname{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$

**Memory hook:** Short one-sentence retention tip. $\boxed{\text{C}}$

</details>
```

---

## 7. CI/CD & Deployment Pipeline

- **Platform**: GitHub Pages via GitHub Actions.
- **Workflow File**: `.github/workflows/deploy.yml`.
- **Trigger**: Automatically executes on pushes to branch `main`, or manually via `workflow_dispatch`.
- **Deployment Process**:
  1. Installs Node 20 with `package-lock.json` caching.
  2. Runs `npm ci` in `portal/`.
  3. Executes `npm run build` with `BASE_URL=/llm/`.
  4. Uploads `portal/dist/` as the GitHub Pages artifact.
  5. Deploys live to `https://hrmiitm.github.io/llm/`.

---

## 8. State Management & Offline Persistence (`portal/src/`)

- **Active Session Store** (`portal/src/store/examStore.ts`):
  - Tracks candidate answers: `Record<string, string | string[]>`
  - Tracks question state: `visited`, `markedForReview`, `answered`
  - Manages countdown timer, remaining seconds, and auto-submission on expiration
- **Storage Layer** (`portal/src/storage/db.ts`):
  - Database: `llm-exam-portal-db` (IndexedDB via `idb`)
  - Stores:
    - `activeAttempts`: In-progress exam snapshots saved after every user interaction
    - `results`: Completed attempt records with score, accuracy, timestamp, and review data
    - `practiceStats`: Practice mode metrics (times attempted, correct count, last seen)
- **Scoring Engine** (`portal/src/lib/scoring.ts`):
  - Normalizes string options, trimmed numeric comparisons within tolerance, and array-based multi-select evaluation.

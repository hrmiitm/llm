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
   - Image assets in Markdown should be referenced as `assets/filename.png` (or another browser-renderable image format). For GitHub-readable diagrams, use fenced Mermaid blocks; `.mmd` image links work through the portal compiler but are broken images in GitHub preview.
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
![Diagram Caption](assets/example-diagram.png)

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

   $$\text{Attention}(Q,K,V) = \mathrm{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$

**Memory hook:** Short one-sentence retention tip. $\boxed{\text{C}}$

</details>
```

### Rendering lessons and required verification

Content is read in **two different renderers**: GitHub Markdown preview and the portal's Markdown/KaTeX pipeline. A successful build or a direct KaTeX parse does not prove that GitHub displays the same formula correctly. Previous checks missed red tokens, raw formulas, and errors inside collapsed solutions; do not repeat those checks as evidence of full success.

#### Authoring rules

- Use `\mathrm{softmax}`, `\mathrm{FFN}`, and similar simple labels instead of `\operatorname{...}` in GitHub-facing content. GitHub rejected the latter in this repository even though KaTeX accepted it.
- Preserve matrix rows and columns. In the existing PYQ dollar-delimited math convention, GitHub consumes backslashes before math rendering: four literal source backslashes (`\\\\`) are used for a row break, and `normalizeLatex` in `portal/src/lib/renderer.ts` converts them to the two required by KaTeX. Do not blindly double all backslashes or extend this convention to fenced math; commands and different delimiters need separate verification. Check actual matrix dimensions, including accidental empty rows, in both renderers.
- Prefer a separate display block for a matrix instead of an inline matrix in prose. For matrix options, preserve the original entries, row order, option order, and readable two-dimensional layout. If using row tuples as a fallback, explicitly explain that semicolons separate rows and retain column-vector orientation with a transpose where required. Do not sacrifice mathematical meaning to remove a rendering error.
- Avoid literal `<` in sensitive math contexts such as summation subscripts: use `\lt`, for example `\sum_{j\lt r}P_j`. GitHub previously produced a brace error for `\sum_{j<r}`.
- Escaped percent signs have also lost their escape during GitHub parsing. Prefer a percentage written outside math, such as `$720/900=0.8$`, hence **80%**, or use `\text{ percent}` inside math. Do not add backslashes without checking the portal too.
- Protect expressions that resemble Markdown links, such as `[1,1,1,1](2I)`, using the supported inline form ``$`...`$`` or unambiguous mathematical notation. Verify that no part becomes an unintended link. Plain terms such as “top-p”, “top-k”, and “+” do not need dollar delimiters.
- Put blank lines around display equations, fenced diagrams, and the Markdown body following `<summary>`. Separate consecutive display blocks with a blank line. Split long derivations into readable equations rather than joining them into one overflowing line.
- Use fenced `mermaid` blocks for diagrams that must appear on GitHub. The compiler supports these fences for the portal. Do not introduce `![...](assets/diagram.mmd)` into GitHub-facing notes or questions. Retain source assets if other content still references them.
- Do not assume all math inside `<details>` is unsupported. Inspect the specific failing block and try a supported math fence or corrected block spacing before changing notation. Preserve explanations and avoid artifacts such as duplicate “From” paragraphs.

#### Verification and completion criteria

1. Audit all files in the requested scope for the same failure pattern, including question options, shared contexts, tables, headings, and solutions. Preserve question counts, option counts/order, answer keys, and mathematical values when changing formatting.
2. Run `npm run compile` for content changes. Run the appropriate build and lint checks when changing the compiler or renderer. Verify generated question packs still contain all questions/options and the intended answer keys.
3. Exercise the **actual portal renderer**, including its normalization and sanitization. A standalone script that bypasses those steps is only a syntax check. For changed matrices, verify row/column counts and absence of empty rows; inspect long formulas at desktop and mobile widths.
4. Inspect GitHub preview as well. Expand **every** solution `<details>` in affected pages and wait for math and diagrams to finish rendering. Check `.markdown-body math-renderer`, `.flash-error`, `[mathcolor="red"]`, `merror`, and raw dollar-delimited text outside rendered math/code. Previous selectors `.math-inline` and `.math-display` were portal selectors and missed GitHub's `math-renderer` elements. Do not restrict detection to one error-message string or only visible text.
5. Inspect images for `complete` and nonzero `naturalWidth`, and confirm Mermaid diagrams actually render. Take readable screenshots of affected sections in light/dark themes and at narrow widths where relevant. A whole-document screenshot shrunk to a few hundred pixels is not sufficient visual verification.
6. Inspect each tool result and ensure long-running audits actually finish; partial output is not a pass for files that were never reported. If publication is already authorized, verify the pushed revision on GitHub after local checks. Otherwise report the limits of local verification without publishing merely to test.
7. Report exactly what passed and what remains unverified. Build success, absence of one known error, or a KaTeX expression count must never be described as proof that every page renders correctly. Distinguish existing lint warnings from a warning-free run.

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

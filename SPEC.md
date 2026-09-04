# Static Exam Practice Portal — Product and Technical Specification

## 1. Decision

Build this as a **Vite + React + TypeScript single-page application (SPA)**,
published as static files. Use Markdown as the author-friendly source format,
with a build-time content compiler that validates it and emits versioned JSON
question packs for the browser.

This is the best fit because the primary experience is an interactive,
stateful exam screen—not a document site. Vite produces a compact static
bundle and has a straightforward PWA path. React has a mature ecosystem for
accessible interactive controls, math rendering, charts, routing, and testing.

Astro + React is a sound alternative if the project later becomes mostly an
SEO/content site with a small practice widget. Next.js static export is also
possible, but adds framework complexity and tempting server-only features
(accounts, cookies, server actions, dynamic results) that do not work in a
strict static deployment. SvelteKit static export is a reasonable alternative
only if the implementing team already prefers Svelte.

### Static-only boundary

The browser receives all content required to score a test. Therefore answer
keys cannot be kept secret, attempts cannot be trusted for rankings, and
progress is only available in the same browser/profile unless users manually
export it. The site can give results instantly on submission. Accounts,
central leaderboards, proctoring, verified certificates, cross-device sync,
or securely delayed result release are explicitly out of scope until a backend
is introduced.

## 2. Goals and non-goals

### Goals

- Familiar computer-based-test interface for GATE Data Science & Artificial
  Intelligence practice exams.
- Fast, mobile-friendly, keyboard-accessible, static deployment.
- Question authors work in Git-managed Markdown and assets; invalid content
  fails the build before publishing.
- Practice individual questions, official-style mock tests, and build random
  custom tests from filters.
- Autosave in-progress exams and show immediate, transparent results.
- Work after initial download when offline (progressive enhancement).
- Inisted of inventing new things use the libary available for any features
- with minimal code maximum possible outuput with desing and existing library uses

### Non-goals for v1

- Login, payment, leaderboard, collaboration, instructor dashboard, or live
  content editing.
- Security-sensitive/official examination use.
- AI-generated questions or remote content APIs.
- Full support for every exotic exam question type at launch.

## 3. User roles and main flows

There are no authenticated roles in the product. A visitor is a learner; a
Git contributor is an out-of-band content author.

1. **Browse and practice:** choose exam/subject/topic; open one question;
   answer; see explanation either immediately or after self-check.
2. **Take a published mock:** choose a predefined test; view instructions;
   start; answer, mark for review, navigate from the palette; submit; get
   results and full review.
3. **Create a custom test:** filter the available bank; choose a randomized
   count or manually pick questions; choose timed/untimed; start a frozen,
   reproducible selection.
4. **Resume:** reopening the site offers unfinished locally saved sessions.
5. **Review history:** view prior local attempts and reopen their result
   review. A content-version warning is displayed if the bank changed.

## 4. Functional requirements

### 4.1 Home and catalog

- Show available exams, subjects, topic counts, published tests, and continue
  cards for unfinished attempts.
- Filter/search questions and tests by exam, subject, topic, difficulty,
  question type, tags, and year/source.
- Never claim that a count includes questions which are unavailable in the
  selected filters.

### 4.2 Practice mode

- One-question view, optional random-next mode, and topic queue mode.
- Answer controls appropriate to the question type; Clear response and Check
  answer actions.
- Reveal answer, worked solution, hints, references, and reporting metadata
  only according to the question's `revealPolicy`.
- Record local practice analytics: attempts, correct count, and last seen;
  do not use it to label a learner's skill as fact.

### 4.3 Published mock test mode

- Instructions page states duration, sections, marks, negative marking, and
  question count before starting.
- Exam shell: sticky timer, section selector, current question number,
  question palette, Save & Next, Previous, Mark for Review & Next, Clear
  Response, and Submit Test.
- Palette state: not visited, not answered, answered, marked for review, and
  answered + marked for review. It must not rely on color alone.
- One active question at a time; answers and navigation state autosave after
  every meaningful action. Restore after refresh, tab close, crash, or offline
  return on the same browser.
- Submit requires a confirmation that reports unanswered and marked questions.
  On time expiry, automatically submit the current persisted state.
- A warning at 10/5/1 minutes is configurable per test and accessible without
  audio; audio is opt-in.
- Result is calculated entirely in the browser at submission and is immutable
  as an attempt snapshot.

### 4.4 Custom-test builder

- Filter by one or many: exam, subject, topic, subtopic, difficulty, type,
  tags, and source/year.
- Selection method: `random N`, `manual selected questions`, or `all matched`
  (with a safety confirmation for large banks).
- Display eligible count and prevent starting if N exceeds it.
- Optional per-topic quotas, if specified. If the bank cannot satisfy them,
  explain which quota failed and do not silently substitute questions.
- Set duration: recommended default calculated from selected questions, a
  preset, or untimed. Scoring defaults to each question's policy; a clearly
  labelled override is allowed only for custom tests.
- On start, generate a seed, select and shuffle once, and store the exact
  ordered question IDs plus content-pack version. The same attempt never
  changes because the user refreshes or filters later.
- Show a shareable "recipe" (filters, count, seed, duration), not an attempt
  URL containing a learner's answers.

### 4.5 Results and review

- Summary: total, maximum, correct/incorrect/unattempted, accuracy, elapsed
  time, score, and percentile only if it is clearly an on-device heuristic
  (recommended: do not show percentile in v1).
- Breakdowns by section, subject, topic, difficulty, and question type where
  enough metadata exists.
- Question-by-question review: submitted answer, correct answer, marking
  policy, awarded marks, explanation, and filters for wrong/unattempted/marked.
- Export a privacy-safe JSON/CSV summary and offer a print-friendly result
  page. Import/export of local history is a post-MVP feature.

## 5. Question model and authoring contract

### 5.1 Supported question types

Launch with `single_choice`, `multiple_select`, and `numeric`. Numeric answers
use a required numeric tolerance and optional unit. This covers a useful core
without weak grading rules. Reserve schema discriminators for `true_false`,
`assertion_reason`, `matching`, and `passage` but do not publish them until
their renderer, keyboard interactions, and scoring tests exist.

### 5.2 Markdown source

One source file per question keeps reviews, ownership, and reuse simple:

```text
content/questions/gate/machine-learning/linear-regression/gate-da-ml-wq1-q01.md
content/assets/gate-da-ml-wq1-q01-diagram.svg
```

The source is Markdown with YAML front matter for machine-readable metadata.
The body has required `## Question`, `## Solution`, and `## Concept to remember`
headings, with optional `## Hint` and `## References` headings. Rich text in the body and option text supports GFM,
LaTeX/KaTeX, tables, and locally hosted images. Remote images are prohibited
to preserve reliability and privacy.

Required front matter:

```yaml
id: gate-da-ml-wq1-q01
type: single_choice
exam: [gate-da]
subject: machine-learning
topics: [linear-regression]
difficulty: 2                 # 1–5
language: en
estimatedSeconds: 90
marks: { correct: 4, incorrect: -1, unanswered: 0 }
options:
  - { id: A, text: "...Markdown..." }
  - { id: B, text: "...Markdown..." }
  - { id: C, text: "...Markdown..." }
  - { id: D, text: "...Markdown..." }
answer: [B]
revealPolicy: after_check
status: published
```

For `multiple_select`, `answer` is a non-empty array and scoring must state
whether partial marks are allowed. For `numeric`, `answer` is a numeric value,
with `tolerance` and `unit` required. The compiler rejects duplicate IDs,
missing asset files, invalid topic references, impossible marks, unsupported
Markdown, malformed LaTeX, answer IDs that do not exist, and unpublished
question references in a test.

### 5.3 Generated runtime content

Do not make the app parse hundreds of source Markdown files while a learner
starts a test. A build command reads and validates source content, renders
safe Markdown to HTML (or stores sanitized Markdown), then generates:

```text
public/content/v2/manifest.json
public/content/v2/catalog.json
public/content/v2/packs/gate-da-machine-learning.json
public/content/v2/tests/gate-da-ml-weekly-quiz-1.json
public/content/v2/assets/*
```

`manifest.json` contains the schema version, content version/hash, generated
time, pack URLs and hashes. `catalog.json` contains only search/filter metadata
needed for the catalog. A pack includes render-ready question data and answer
keys; it is lazy-loaded only when required. A published test includes ordered
question IDs, section definitions, duration, and its marking policy.

Question data must use stable IDs; authors must never renumber IDs to reorder
content. Deprecate an old ID rather than reusing it for a new question.

## 6. Scoring rules

- Each question declares correct, incorrect, and unanswered marks. Published
  tests may override only by explicitly declaring a test-wide policy.
- A response is evaluated only after Submit (except practice self-check).
- `single_choice`: one selected option must equal the answer.
- `multiple_select`: choose one documented policy per question: all-or-nothing
  for v1; partial-credit support is a later explicitly tested extension.
- `numeric`: accept values within inclusive absolute tolerance; define how
  accepted units and significant figures are normalized before publishing.
- The result stores per-question evaluation facts and a copy of scoring inputs,
  so later content edits do not alter an old attempt's score.

## 7. Information architecture and UI

Static routes: `/`, `/practice`, `/custom`, `/tests`, `/tests/:testId`,
`/attempt/:attemptId`, `/results/:attemptId`, `/history`, `/about`, and
`/privacy`. Configure the static host to fall back unknown application routes
to `index.html`; use hash routing only for hosts that cannot do this.

Use an application shell with minimal visual chrome. The exam screen is a
focused three-region layout: question/answer centre, compact actions below,
and collapsible palette to the right (a slide-over on small screens). Do not
copy any examination brand, logo, or proprietary question styling.

Requirements: responsive from 320px upward; a light/dark/system theme;
visible focus; semantic form controls; full keyboard operation; 44px minimum
touch targets; timer announcements through an ARIA live region; reduced-motion
respect; and no essential action that depends only on drag, hover, colour, or
sound. Include an accessible question palette text label for every state.

## 8. Client architecture and persistence

Use React Router, a small predictable attempt-state store, and feature modules:

```text
src/
  app/                 # routes, app shell, providers
  features/catalog/
  features/practice/
  features/exam/
  features/results/
  features/history/
  components/          # shared accessible UI primitives
  content/             # manifest client, pack loader, validators
  lib/                 # RNG, timer, scoring, markdown/math utilities
  storage/              # IndexedDB repositories and migrations
  styles/
content/               # authoring source (not app source)
scripts/               # validate/compile content
public/content/        # build output; never hand-edit
```

Use IndexedDB for attempts, answer snapshots, progress, and preferences;
use localStorage only for small non-critical settings such as theme. Store a
schema version and migrate records deliberately. Persist timestamps as UTC ISO
strings and calculate elapsed test time from a monotonic session model plus
wall-clock recovery logic. On a backward/forward system-clock jump, warn the
learner and preserve the attempt rather than silently changing its score.

## 9. Offline, privacy, and security

Add a PWA manifest and service worker after core functionality is stable.
Precache the application shell; cache catalog and content packs on demand;
keep completed and active attempts in IndexedDB. Show content last-updated and
an update prompt when a new service worker is ready—never replace an active
attempt's content in the background.

No analytics, trackers, third-party fonts, remote image hosts, or ad scripts in
the baseline. If privacy-respecting analytics is later added, make it opt-in
and document it. Publish a concise privacy page saying all attempt data stays
on the device and can disappear if browser data is cleared.

Treat authored Markdown as untrusted input: sanitize rendered HTML, allowlist
tags/attributes/protocols, forbid scripts/iframes/event handlers, and apply a
strict Content Security Policy compatible with static hosting. This prevents a
malicious content contribution from becoming an XSS issue.

## 10. Build, quality gates, and deployment

Build pipeline:

1. Lint and type-check application code.
2. Validate all content source against the question/test schemas.
3. Verify referenced local assets and produce versioned content packs.
4. Run unit, integration, and browser end-to-end tests.
5. Produce `dist/` static assets; deploy only this directory.

Content CI must fail on any schema, link, asset, duplicate-ID, invalid-answer,
or test-composition error. Unit test deterministic random selection, scoring,
numeric tolerance, duration expiry, persistence migration, and pack integrity.
End-to-end test the whole exam flow: resume after reload, submit confirmation,
auto-submit, results calculation, custom filters/quotas, mobile palette, and
keyboard-only completion. Add automated accessibility checks and a manual
screen-reader smoke test.

Preferred hosting is Cloudflare Pages or Netlify for static CDN delivery and
SPA fallback. GitHub Pages also works but needs a base-path build setting and
either a route fallback workaround or hash URLs. Any S3/object-storage + CDN
host is valid if it serves static assets with correct cache headers.

Cache immutable hashed JS/CSS aggressively. Cache `manifest.json` briefly or
with revalidation so new content appears quickly. Version content packs by
hash and retain older packs long enough for active local attempts to review.

## 11. Delivery plan

### MVP (first usable release)

- Vite/React shell; catalog; Markdown-to-JSON content compiler; schema checks.
- `single_choice`, `multiple_select` (all-or-nothing), and `numeric` questions.
- Practice, published mock, randomized custom test, exam palette/timer,
  immediate results/review, and local resume/history.
- Accessible responsive UI, content and scoring test suite, static deployment.

### Next release

- PWA offline install, manual custom selection, topic quotas, JSON/CSV export,
  question report link, dark theme, and simple virtual calculator if demanded
  by the intended exam format.

### Later only if needed

- Optional backend for sign-in, encrypted/cloud attempt sync, author CMS,
  moderated reporting, and aggregate analytics. Keep the current content-pack
  and scoring interfaces so this is an additive change, not a rewrite.

## 12. Acceptance criteria

The specification is met when a contributor can add a valid Markdown question
and local image, the build produces a content pack, a learner can select a
topic and complete a deterministic randomized test, refresh midway and resume
without losing answers, submit or time out and immediately see an accurate
question-level result, and use the core flow on keyboard and mobile without a
server or login.

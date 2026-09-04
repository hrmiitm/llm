# LLM Exam Portal — Web Application

This directory contains the Vite + React + TypeScript single-page application for the IIT Madras NPTEL LLM Exam Portal.

## Commands

```bash
# Compile content from ../GA/*.md, ../pyq/*.md, and ../learning/*.md into public/content/*.json
npm run compile

# Run local development server
npm run dev

# Typecheck and build for production
npm run build

# Preview production build locally
npm run preview
```

## Structure

- `public/content/`: Pre-compiled JSON question packs (`catalog.json`, `ga1.json`, etc.)
- `public/assets/`: Image diagrams referenced in questions
- `public/404.html`: Single-page app redirect handler for GitHub Pages
- `scripts/compile-content.js`: Build-time markdown parser and question extractor
- `src/components/`: Reusable UI components (Timer, Palette, Modal, QuestionRenderer)
- `src/features/`: Top-level route pages (HomePage, ExamPage, PracticePage, ResultsPage, HistoryPage)
- `src/lib/`: Math rendering (KaTeX), scoring engine, and content fetchers
- `src/storage/`: IndexedDB wrapper for offline attempt autosave
- `src/store/`: Zustand state management for active exams

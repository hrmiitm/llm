#!/usr/bin/env node
/**
 * compile-content.js
 * Parses GA/*.md files and emits public/content/catalog.json + public/content/ga-{n}.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const GA_DIR = join(ROOT, '..', 'GA');
const OUT_DIR = join(ROOT, 'public', 'content');
const GA_ASSETS = join(GA_DIR, 'assets');
const OUT_ASSETS = join(ROOT, 'public', 'assets');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// Synchronize static image assets
if (existsSync(GA_ASSETS)) {
  if (!existsSync(OUT_ASSETS)) mkdirSync(OUT_ASSETS, { recursive: true });
  cpSync(GA_ASSETS, OUT_ASSETS, { recursive: true });
  console.log(`✓ Synchronized assets from ${GA_ASSETS} to ${OUT_ASSETS}`);
}

// ──────────────────────────────────────────────
// GA file metadata (from README)
// ──────────────────────────────────────────────
const GA_META = {
  ga1:  { week: 1,  topics: ['Context Length', 'Embedding Tensors', 'Self-Attention', 'Attention Matrix'], notesFile: 'week1-week2-learning-notes.md' },
  ga2:  { week: 2,  topics: ['Multi-Head Attention', 'Parameter Counting', 'Projection Matrices', 'Cross-Attention'], notesFile: 'week1-week2-learning-notes.md' },
  ga3:  { week: 3,  topics: ['GPT Architecture', 'Causal LM', 'Decoding Strategies', 'Positional Encoding'], notesFile: 'week3-week4-learning-notes.md' },
  ga4:  { week: 4,  topics: ['BERT Architecture', 'MLM', 'NSP', 'Bidirectional Encoder'], notesFile: 'week3-week4-learning-notes.md' },
  ga5:  { week: 5,  topics: ['Vocabulary Construction', 'BPE', 'WordPiece', 'Tokenization'], notesFile: 'week5-learning-notes.md' },
  ga7:  { week: 7,  topics: ['BART', 'T5', 'Span Corruption', 'Sentinel Tokens'], notesFile: 'week7-learning-notes.md' },
  ga8:  { week: 8,  topics: ['LLM Taxonomy', 'Pre-training Data', 'Kaplan Scaling Law', 'Dataset Sizing'], notesFile: 'week8-learning-notes.md' },
  ga11: { week: 11, topics: ['Attention Complexity', 'FLOP Counting', 'KV Caching', 'Local Window Attention'], notesFile: 'week11-learning-notes.md' },
  ga12: { week: 12, topics: ['Positional Encodings', 'RoPE', 'ALiBi', 'Length Extrapolation'], notesFile: 'week12-learning-notes.md' },
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function parseHeader(lines) {
  // Extract score and date from lines like:
  // > **Score: 100 / 100** | Submitted: Sun, 21 Jun 2026
  let score = null, maxScore = null, submittedDate = null;
  for (const line of lines.slice(0, 10)) {
    const scoreMatch = line.match(/Score:\s*(\d+)\s*\/\s*(\d+)/);
    if (scoreMatch) { score = parseInt(scoreMatch[1]); maxScore = parseInt(scoreMatch[2]); }
    const dateMatch = line.match(/Submitted:\s*(.+)/);
    if (dateMatch) submittedDate = dateMatch[1].trim();
  }
  return { score, maxScore, submittedDate };
}

function parseQType(text) {
  const t = text.toLowerCase();
  if (t.includes('numeric input') || t.includes('*(numeric')) return 'numeric';
  if (t.includes('select all') || t.includes('(select all') || t.includes('which of the following is (are)') || t.includes('select all that apply')) return 'multiple_select';
  return 'single_choice';
}

function extractOptions(lines) {
  const opts = [];
  const optRe = /^-\s+\(\s*[xX]?\s*\)\s+(.+)/;
  for (const line of lines) {
    const m = line.match(optRe);
    if (m) {
      const id = String.fromCharCode(65 + opts.length); // A, B, C, ...
      opts.push({ id, text: m[1].trim() });
    }
  }
  return opts;
}

function extractAnswer(detailsContent, options) {
  // Look for **Answer:** line
  const ansLine = detailsContent.find(l => l.match(/\*\*Answer:\*\*/i) || l.match(/^\*\*Answer\*\*/i));
  if (!ansLine) return null;

  const ansText = ansLine.replace(/\*\*Answer.*?:\*\*\s*/i, '').trim();

  // Numeric
  const numMatch = ansText.match(/\\boxed\{([^}]+)\}/);
  if (numMatch) return { type: 'numeric', value: numMatch[1].replace(/[{,\\]/g, '').trim() };

  // True/False
  if (/^true$/i.test(ansText)) return { type: 'boolean', value: 'True' };
  if (/^false$/i.test(ansText)) return { type: 'boolean', value: 'False' };

  // Option letters (A, B, C, D or option text)
  if (options.length > 0) {
    // Try to match by option letter
    for (const opt of options) {
      if (ansText.toLowerCase().includes(`$${opt.id.toLowerCase()}$`) || 
          ansText.toLowerCase().includes(`${opt.id.toLowerCase()}$`) ||
          ansText.startsWith(opt.id) ||
          ansText.toLowerCase() === opt.id.toLowerCase()) {
        return { type: 'option', value: [opt.id] };
      }
    }
    // Try to match option text
    const matched = options.filter(opt => {
      const stripped = opt.text.replace(/[$\\]/g, '').toLowerCase().slice(0, 20);
      return ansText.toLowerCase().includes(stripped.slice(0, 10));
    });
    if (matched.length > 0) return { type: 'option', value: matched.map(o => o.id) };
    // Fallback: "All except..." pattern
    if (ansText.toLowerCase().includes('all except')) {
      const exceptMatch = ansText.match(/all except "?([^"]+)"?/i);
      if (exceptMatch) {
        const exceptText = exceptMatch[1].toLowerCase().trim();
        const ids = options.filter(o => !o.text.toLowerCase().includes(exceptText.slice(0, 10))).map(o => o.id);
        return { type: 'option', value: ids };
      }
    }
  }
  return { type: 'text', value: ansText };
}

// ──────────────────────────────────────────────
// Main parser
// ──────────────────────────────────────────────

function parseGAFile(gaId) {
  const filePath = join(GA_DIR, `${gaId}.md`);
  let raw;
  try { raw = readFileSync(filePath, 'utf-8'); } catch { return null; }

  const lines = raw.split('\n');
  const meta = GA_META[gaId];
  const header = parseHeader(lines);

  const questions = [];
  let currentContext = null;
  let i = 0;
  let qIndex = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Detect context block header (## Context for Q...)
    const ctxMatch = line.match(/^##\s+Context for (Q[\d\s,–-]+)/i);
    if (ctxMatch) {
      // Collect context lines until next heading
      const ctxLines = [];
      i++;
      while (i < lines.length && !lines[i].match(/^#{2,3}\s+Q\d/)) {
        ctxLines.push(lines[i]);
        i++;
      }
      currentContext = ctxLines.join('\n').trim();
      continue;
    }

    // Detect question heading (### Q1 — ...) or (## Q1 — ...)
    const qHeadMatch = line.match(/^#{2,3}\s+(Q\d+)\s*[—–-]\s*(.+)/);
    if (qHeadMatch) {
      const qNum = qHeadMatch[1];
      const qTitle = qHeadMatch[2].trim();

      // Collect question body until <details>
      const bodyLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('<details>') && !lines[i].match(/^#{2,3}\s+Q\d/)) {
        bodyLines.push(lines[i]);
        i++;
      }

      const bodyText = bodyLines.join('\n').trim();
      const options = extractOptions(bodyLines);
      const qType = parseQType(bodyText);

      // Find the bold question (first bold line or first non-empty line)
      let questionText = '';
      for (const bl of bodyLines) {
        const stripped = bl.trim();
        if (stripped && !stripped.startsWith('-') && !stripped.startsWith('*(') && !stripped.startsWith('```')) {
          questionText = stripped.replace(/^\*\*/, '').replace(/\*\*$/, '');
          break;
        }
      }

      // Collect <details> block
      let detailsLines = [];
      if (i < lines.length && lines[i].trim().startsWith('<details>')) {
        i++; // skip <details>
        while (i < lines.length && !lines[i].trim().startsWith('</details>')) {
          detailsLines.push(lines[i]);
          i++;
        }
        i++; // skip </details>
      }

      // Extract solution text (everything after the answer line)
      const summaryEnd = detailsLines.findIndex(l => l.includes('</summary>'));
      const solutionLines = summaryEnd >= 0 ? detailsLines.slice(summaryEnd + 1) : detailsLines;
      const solutionText = solutionLines.join('\n').trim();

      const answer = extractAnswer(detailsLines, options);

      qIndex++;
      questions.push({
        id: `${gaId}-q${qIndex}`,
        num: qNum,
        title: qTitle,
        type: qType,
        context: currentContext,
        questionText: questionText,
        bodyMd: bodyText,
        options,
        answer,
        solutionMd: solutionText,
        marks: { correct: 1, incorrect: 0, unanswered: 0 },
      });
      continue;
    }

    i++;
  }

  return {
    id: gaId,
    week: meta.week,
    title: `Week ${meta.week} — Graded Assignment ${meta.week === 11 ? 11 : meta.week === 12 ? 12 : meta.week}`,
    topics: meta.topics,
    notesFile: meta.notesFile,
    score: header.score,
    maxScore: header.maxScore,
    submittedDate: header.submittedDate,
    questionCount: questions.length,
    durationMinutes: Math.max(30, questions.length * 3),
    questions,
  };
}

// ──────────────────────────────────────────────
// Execute
// ──────────────────────────────────────────────

const gaIds = Object.keys(GA_META);
const catalog = [];

for (const gaId of gaIds) {
  const data = parseGAFile(gaId);
  if (!data) { console.warn(`Skipping ${gaId} — file not found`); continue; }

  const packPath = join(OUT_DIR, `${gaId}.json`);
  writeFileSync(packPath, JSON.stringify(data, null, 2));
  console.log(`✓ ${gaId}: ${data.questionCount} questions → ${packPath}`);

  catalog.push({
    id: data.id,
    week: data.week,
    title: data.title,
    topics: data.topics,
    score: data.score,
    maxScore: data.maxScore,
    submittedDate: data.submittedDate,
    questionCount: data.questionCount,
    durationMinutes: data.durationMinutes,
  });
}

const catalogPath = join(OUT_DIR, 'catalog.json');
writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
console.log(`\n✓ catalog.json → ${catalogPath}`);
console.log(`\nDone! ${catalog.length} GAs compiled.`);

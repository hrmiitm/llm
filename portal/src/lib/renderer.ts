import { marked } from 'marked';
import katex from 'katex';
import DOMPurify from 'dompurify';

// Configure marked
marked.setOptions({ breaks: true });

// GitHub Markdown consumes one backslash from a literal row separator in a
// matrix. PYQ files therefore use four source backslashes so GitHub receives
// two; collapse that source-only doubling before KaTeX renders the portal.
function normalizeLatex(expr: string): string {
  return expr.trim().replace(/\\\\\\\\/g, '\\\\');
}

// Process LaTeX blocks before markdown
function processLatex(src: string): string {
  // Display math: $$...$$ or ```math\n...\n```
  src = src.replace(/```math\s*\n([\s\S]*?)```/g, (_match, expr) => {
    try {
      return '<div class="math-display">' + katex.renderToString(normalizeLatex(expr), { displayMode: true, throwOnError: false }) + '</div>';
    } catch {
      return `<div class="math-display"><code>${expr}</code></div>`;
    }
  });

  // $`...`$ (inline display math used in the GAs)
  src = src.replace(/\$`([\s\S]*?)`\$/g, (_match, expr) => {
    try {
      return '<span class="math-inline">' + katex.renderToString(normalizeLatex(expr), { displayMode: false, throwOnError: false }) + '</span>';
    } catch {
      return `<code>${expr}</code>`;
    }
  });

  // $$...$$
  src = src.replace(/\$\$([\s\S]*?)\$\$/g, (_match, expr) => {
    try {
      return '<span class="math-display">' + katex.renderToString(normalizeLatex(expr), { displayMode: true, throwOnError: false }) + '</span>';
    } catch {
      return `<code>${expr}</code>`;
    }
  });

  // $...$ (inline)
  src = src.replace(/\$([^$\n]{1,200}?)\$/g, (_match, expr) => {
    try {
      return '<span class="math-inline">' + katex.renderToString(normalizeLatex(expr), { displayMode: false, throwOnError: false }) + '</span>';
    } catch {
      return `<code>${expr}</code>`;
    }
  });

  return src;
}

const rawBase = import.meta.env.BASE_URL || '/';
const BASE = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
const ASSETS_PREFIX = `${BASE}assets/`.replace(/\/\/+/g, '/');

// Fix asset paths in markdown
function fixAssetPaths(src: string): string {
  // Convert assets/filename.ext, ./assets/filename.ext, or /assets/filename.ext -> ASSETS_PREFIX + filename.ext
  return src.replace(/!\[([^\]]*)\]\((?:\.?\/)?assets\/([^)]+)\)/g, `![$1](${ASSETS_PREFIX}$2)`);
}

export function renderMarkdown(src: string): string {
  if (!src) return '';
  let processed = fixAssetPaths(src);
  processed = processLatex(processed);
  const html = marked.parse(processed) as string;
  return DOMPurify.sanitize(html, {
    // Allow SVG tags that KaTeX and mermaid-compiled diagram placeholders use
    ADD_TAGS: ['mjx-container', 'svg', 'use', 'marker', 'defs', 'path', 'g', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect', 'text', 'tspan', 'foreignObject'],
    // Allow all attributes needed by KaTeX, mermaid SVGs, and the kroki diagram placeholder
    ADD_ATTR: [
      'class', 'style', 'xmlns', 'xmlns:xlink',
      'viewBox', 'width', 'height',
      'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin',
      'transform', 'transform-origin', 'd', 'points', 'r', 'rx', 'ry', 'cx', 'cy',
      'x', 'y', 'x1', 'x2', 'y1', 'y2',
      'text-anchor', 'dominant-baseline', 'font-size', 'font-family', 'font-weight',
      'marker-end', 'marker-start', 'marker-mid',
      'refX', 'refY', 'markerWidth', 'markerHeight', 'markerUnits', 'orient',
      'aria-hidden', 'role', 'aria-label',
      // kroki diagram placeholder data attribute
      'data-kroki-source',
    ],
    // Keep data-* attributes (they are allowed by default but explicit here for clarity)
    ALLOW_DATA_ATTR: true,
  });
}

export function renderInlineText(src: string): string {
  if (!src) return '';
  let processed = fixAssetPaths(src);
  processed = processLatex(processed);
  // Use inline markdown (no block-level wrapping)
  const html = marked.parseInline(processed) as string;
  return DOMPurify.sanitize(html);
}

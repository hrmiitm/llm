import { marked } from 'marked';
import katex from 'katex';
import DOMPurify from 'dompurify';

// Configure marked
marked.setOptions({ breaks: true });

// Process LaTeX blocks before markdown
function processLatex(src: string): string {
  // Display math: $$...$$ or ```math\n...\n```
  src = src.replace(/```math\s*\n([\s\S]*?)```/g, (_match, expr) => {
    try {
      return '<div class="math-display">' + katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false }) + '</div>';
    } catch {
      return `<div class="math-display"><code>${expr}</code></div>`;
    }
  });

  // $`...`$ (inline display math used in the GAs)
  src = src.replace(/\$`([\s\S]*?)`\$/g, (_match, expr) => {
    try {
      return '<span class="math-inline">' + katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false }) + '</span>';
    } catch {
      return `<code>${expr}</code>`;
    }
  });

  // $$...$$
  src = src.replace(/\$\$([\s\S]*?)\$\$/g, (_match, expr) => {
    try {
      return '<span class="math-display">' + katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false }) + '</span>';
    } catch {
      return `<code>${expr}</code>`;
    }
  });

  // $...$ (inline)
  src = src.replace(/\$([^$\n]{1,200}?)\$/g, (_match, expr) => {
    try {
      return '<span class="math-inline">' + katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false }) + '</span>';
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

function replaceKrokiDiagramRefs(src: string): string {
  // A .mmd file is Kroki-compatible Mermaid source. MarkdownContent renders it
  // locally, so course diagrams do not rely on a remote renderer or static SVG.
  return src.replace(
    /!\[([^\]]*)\]\((?:\.?\/)?assets\/([^)]+\.mmd)\)/g,
    (_match, alt: string, file: string) => (
      `<div class="kroki-diagram" data-kroki-src="${ASSETS_PREFIX}${file}" role="img" aria-label="${alt}"></div>`
    ),
  );
}

export function renderMarkdown(src: string): string {
  if (!src) return '';
  let processed = replaceKrokiDiagramRefs(src);
  processed = fixAssetPaths(processed);
  processed = processLatex(processed);
  const html = marked.parse(processed) as string;
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['mjx-container', 'svg', 'use'],
    ADD_ATTR: ['class', 'style', 'xmlns', 'viewBox', 'fill', 'stroke', 'stroke-width', 'aria-hidden'],
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

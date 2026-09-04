import { useEffect, useRef } from 'react';
import { renderMarkdown } from '../lib/renderer';

interface Props {
  markdown: string;
  className?: string;
}

let diagramNumber = 0;
type MermaidApi = typeof import('mermaid').default;
let mermaidLoader: Promise<MermaidApi> | null = null;

function loadMermaid(): Promise<MermaidApi> {
  if (!mermaidLoader) {
    mermaidLoader = import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        flowchart: { htmlLabels: false, useMaxWidth: true },
        themeVariables: {
          background: '#fffef8',
          primaryColor: '#e8f1ff',
          primaryBorderColor: '#1355a6',
          primaryTextColor: '#102a43',
          secondaryColor: '#fff4e5',
          secondaryBorderColor: '#d97706',
          tertiaryColor: '#ecfdf5',
          lineColor: '#64748b',
          textColor: '#102a43',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
      });
      return mermaid;
    });
  }
  return mermaidLoader;
}

/** Renders Markdown and hydrates Kroki-compatible Mermaid source blocks. */
export function MarkdownContent({ markdown, className }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const html = renderMarkdown(markdown);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const containerRoot = root;

    let cancelled = false;
    async function renderDiagrams() {
      const slots = Array.from(containerRoot.querySelectorAll<HTMLElement>('.kroki-diagram[data-kroki-src]'));
      if (slots.length === 0) return;
      const mermaid = await loadMermaid();
      if (cancelled) return;

      for (const slot of slots) {
        const sourceUrl = slot.dataset.krokiSrc;
        if (!sourceUrl) continue;

        slot.setAttribute('aria-busy', 'true');
        slot.textContent = 'Loading diagram…';

        try {
          const response = await fetch(sourceUrl);
          if (!response.ok) throw new Error(`Diagram source unavailable (${response.status})`);
          const source = await response.text();
          const id = `kroki-mermaid-${diagramNumber++}`;
          const { svg, bindFunctions } = await mermaid.render(id, source);
          if (cancelled) return;

          slot.innerHTML = svg;
          slot.querySelector('svg')?.setAttribute('role', 'img');
          slot.querySelector('svg')?.setAttribute('aria-label', slot.getAttribute('aria-label') ?? 'Course diagram');
          bindFunctions?.(slot);
        } catch {
          if (!cancelled) {
            slot.classList.add('kroki-diagram-error');
            slot.textContent = 'The diagram could not be rendered. Reload the page to retry.';
          }
        } finally {
          slot.removeAttribute('aria-busy');
        }
      }
    }

    void renderDiagrams();
    return () => { cancelled = true; };
  }, [html]);

  return <div ref={rootRef} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

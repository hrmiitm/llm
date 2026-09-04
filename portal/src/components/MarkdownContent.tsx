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
        // 'loose' allows mermaid to skip its internal DOMPurify pass on the SVG
        // output, which can strip SVG attributes we need. Our content is from
        // our own controlled source so this is safe.
        securityLevel: 'loose',
        theme: 'base',
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

function decodeDiagramSource(encodedSource: string): string {
  try {
    // Standard base64 → UTF-8 decode
    const binary = window.atob(encodedSource);
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    // Fallback: try direct atob (works when content is ASCII-only)
    return window.atob(encodedSource);
  }
}

/** Renders Markdown and hydrates Kroki-compatible Mermaid source blocks. */
export function MarkdownContent({ markdown, className }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const html = renderMarkdown(markdown);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    let cancelled = false;

    async function renderDiagrams() {
      const slots = Array.from(root!.querySelectorAll<HTMLElement>('.kroki-diagram[data-kroki-source]'));
      if (slots.length === 0) return;

      let mermaid: MermaidApi;
      try {
        mermaid = await loadMermaid();
      } catch (err) {
        console.error('Failed to load mermaid library.', err);
        return;
      }
      if (cancelled) return;

      for (const slot of slots) {
        if (cancelled) return;

        const encodedSource = slot.dataset.krokiSource;
        if (!encodedSource) continue;

        slot.setAttribute('aria-busy', 'true');
        slot.textContent = 'Loading diagram…';

        try {
          const source = decodeDiagramSource(encodedSource);
          const id = `kroki-mermaid-${diagramNumber++}`;

          // Pass the slot itself as the render container so mermaid places the
          // temp SVG element adjacent to our slot rather than appending to body.
          // We then extract the innerHTML (the rendered SVG string).
          const renderContainer = document.createElement('div');
          renderContainer.style.position = 'absolute';
          renderContainer.style.visibility = 'hidden';
          renderContainer.style.pointerEvents = 'none';
          document.body.appendChild(renderContainer);

          let svg: string;
          let bindFunctions: ((el: Element) => void) | undefined;
          try {
            const result = await mermaid.render(id, source, renderContainer);
            svg = result.svg;
            bindFunctions = result.bindFunctions ?? undefined;
          } finally {
            // Always remove the temp container
            renderContainer.remove();
          }

          if (cancelled) return;

          slot.innerHTML = svg;
          const svgEl = slot.querySelector('svg');
          if (svgEl) {
            svgEl.setAttribute('role', 'img');
            const label = slot.getAttribute('aria-label') ?? 'Course diagram';
            svgEl.setAttribute('aria-label', label);
          }
          bindFunctions?.(slot);
        } catch (error) {
          // Retain the error in developer tools while keeping learner-facing UI concise.
          console.error('Could not render course diagram.', error);
          if (!cancelled) {
            slot.classList.add('kroki-diagram-error');
            slot.setAttribute('role', 'alert');
            slot.textContent = '⚠ This diagram could not be rendered.';
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

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
    let cancelled = false;

    async function renderDiagrams() {
      const root = rootRef.current;
      if (!root) return;

      const initialSlots = Array.from(root.querySelectorAll<HTMLElement>('.kroki-diagram[data-kroki-source]'));
      if (initialSlots.length === 0) return;

      let mermaid: MermaidApi;
      try {
        mermaid = await loadMermaid();
      } catch (err) {
        console.error('Failed to load mermaid library.', err);
        return;
      }
      if (cancelled) return;

      const currentRoot = rootRef.current;
      if (!currentRoot) return;

      // Re-query slots on current root after asynchronous mermaid load
      const slots = Array.from(currentRoot.querySelectorAll<HTMLElement>('.kroki-diagram[data-kroki-source]'));

      for (let i = 0; i < slots.length; i++) {
        if (cancelled) return;

        let slot = slots[i];
        if (!currentRoot.contains(slot)) {
          const freshSlots = Array.from(currentRoot.querySelectorAll<HTMLElement>('.kroki-diagram[data-kroki-source]'));
          if (freshSlots[i]) {
            slot = freshSlots[i];
          } else {
            continue;
          }
        }

        const encodedSource = slot.dataset.krokiSource;
        if (!encodedSource) continue;

        if (slot.dataset.rendered === 'true' && slot.querySelector('svg')) {
          continue;
        }

        slot.setAttribute('aria-busy', 'true');
        slot.textContent = 'Loading diagram…';

        try {
          const source = decodeDiagramSource(encodedSource);
          const id = `kroki-mermaid-${diagramNumber++}`;

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
            renderContainer.remove();
          }

          if (cancelled) return;

          const liveRoot = rootRef.current;
          let liveSlot = slot;
          if (liveRoot && !liveRoot.contains(liveSlot)) {
            const fresh = Array.from(liveRoot.querySelectorAll<HTMLElement>('.kroki-diagram[data-kroki-source]'));
            if (fresh[i]) liveSlot = fresh[i];
          }

          liveSlot.innerHTML = svg;
          liveSlot.dataset.rendered = 'true';
          const svgEl = liveSlot.querySelector('svg');
          if (svgEl) {
            svgEl.setAttribute('role', 'img');
            const label = liveSlot.getAttribute('aria-label') ?? 'Course diagram';
            svgEl.setAttribute('aria-label', label);
          }
          bindFunctions?.(liveSlot);
        } catch (error) {
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

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { renderMarkdown } from '../lib/renderer';

interface Props {
  markdown: string;
  className?: string;
}

type MermaidApi = typeof import('mermaid').default;
type RenderedDiagram = {
  svg: string;
  bindFunctions?: (element: Element) => void;
};

type ContentSegment =
  | { kind: 'markdown'; html: string }
  | { kind: 'diagram'; source: string; label: string };

let diagramNumber = 0;
let mermaidLoader: Promise<MermaidApi> | null = null;

// Diagram blocks are emitted by compile-content.js. Keep them out of the
// dangerouslySetInnerHTML tree so React never has to reconcile over an SVG
// that Mermaid has rendered.
const DIAGRAM_BLOCK = /<div class="kroki-diagram" data-kroki-source="([^"]+)" role="img" aria-label="([^"]*)"><\/div>/g;

function loadMermaid(): Promise<MermaidApi> {
  if (!mermaidLoader) {
    mermaidLoader = import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        // The course content is authored in this repository. Mermaid's SVG is
        // inserted by this component, rather than being accepted from users.
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
    const binary = window.atob(encodedSource);
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return window.atob(encodedSource);
  }
}

function decodeHtmlAttribute(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function splitContent(markdown: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  let cursor = 0;

  for (const match of markdown.matchAll(DIAGRAM_BLOCK)) {
    const start = match.index ?? cursor;
    const before = markdown.slice(cursor, start);
    if (before.trim()) {
      segments.push({ kind: 'markdown', html: renderMarkdown(before) });
    }

    segments.push({
      kind: 'diagram',
      source: match[1],
      label: decodeHtmlAttribute(match[2]),
    });
    cursor = start + match[0].length;
  }

  const after = markdown.slice(cursor);
  if (after.trim() || segments.length === 0) {
    segments.push({ kind: 'markdown', html: renderMarkdown(after) });
  }

  return segments;
}

const StaticMarkdown = memo(function StaticMarkdown({ html }: { html: string }) {
  const innerHtml = useMemo(() => ({ __html: html }), [html]);
  return <div dangerouslySetInnerHTML={innerHtml} />;
});

const MermaidDiagram = memo(function MermaidDiagram({ source, label }: { source: string; label: string }) {
  const [rendered, setRendered] = useState<RenderedDiagram | null>(null);
  const [error, setError] = useState(false);
  const [diagramId] = useState(() => `kroki-mermaid-${diagramNumber++}`);
  const svgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      let renderHost: HTMLDivElement | null = null;
      try {
        const mermaid = await loadMermaid();
        if (cancelled) return;

        // Mermaid needs a live, measurable DOM node while it calculates its
        // SVG. Position it outside the viewport instead of hiding it so every
        // browser can measure the diagram correctly.
        renderHost = document.createElement('div');
        renderHost.style.cssText = 'position:fixed;left:-10000px;top:-10000px;pointer-events:none;';
        document.body.appendChild(renderHost);

        const result = await mermaid.render(diagramId, decodeDiagramSource(source), renderHost);
        if (!cancelled) {
          setRendered({ svg: result.svg, bindFunctions: result.bindFunctions ?? undefined });
        }
      } catch (renderError) {
        console.error('Could not render course diagram.', renderError);
        if (!cancelled) setError(true);
      } finally {
        renderHost?.remove();
      }
    }

    void renderDiagram();
    return () => { cancelled = true; };
  }, [diagramId, source]);

  const svgMarkup = useMemo(() => rendered ? ({ __html: rendered.svg }) : null, [rendered]);

  useEffect(() => {
    if (!rendered || !svgRef.current) return;
    const svg = svgRef.current.querySelector('svg');
    if (svg) {
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', label);
    }
    rendered.bindFunctions?.(svgRef.current);
  }, [label, rendered]);

  if (error) {
    return <div className="kroki-diagram kroki-diagram-error" role="alert">⚠ This diagram could not be rendered.</div>;
  }

  return (
    <div className="kroki-diagram" role="img" aria-label={label} aria-busy={rendered ? undefined : true}>
      {svgMarkup
        ? <div ref={svgRef} dangerouslySetInnerHTML={svgMarkup} />
        : 'Loading diagram…'}
    </div>
  );
});

/** Renders Markdown and Mermaid course diagrams without React overwriting SVGs. */
export function MarkdownContent({ markdown, className }: Props) {
  const segments = useMemo(() => splitContent(markdown), [markdown]);

  return (
    <div className={className}>
      {segments.map((segment, index) => (
        segment.kind === 'diagram'
          ? <MermaidDiagram key={`diagram-${index}-${segment.source}`} source={segment.source} label={segment.label} />
          : <StaticMarkdown key={`markdown-${index}`} html={segment.html} />
      ))}
    </div>
  );
}

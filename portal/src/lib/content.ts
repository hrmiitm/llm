import type { GACatalogItem, GAPack } from '../types';

const rawBase = import.meta.env.BASE_URL || '/';
const BASE = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
const CONTENT = `${BASE}content`.replace(/\/\/+/g, '/');
const CUSTOM_PACK_PREFIX = 'llm-exam-custom:';

export async function fetchCatalog(): Promise<GACatalogItem[]> {
  const res = await fetch(`${CONTENT}/catalog.json`);
  if (!res.ok) throw new Error('Failed to load catalog');
  return res.json();
}

export async function fetchPack(gaId: string): Promise<GAPack> {
  if (gaId.startsWith('custom-')) {
    const customPack = loadCustomPack(gaId);
    if (customPack) return customPack;
  }
  const res = await fetch(`${CONTENT}/${gaId}.json`);
  if (!res.ok) throw new Error(`Failed to load pack for ${gaId}`);
  return res.json();
}

/** Store generated question sets locally so custom attempts survive a refresh. */
export function saveCustomPack(pack: GAPack): void {
  localStorage.setItem(`${CUSTOM_PACK_PREFIX}${pack.id}`, JSON.stringify(pack));
}

export function loadCustomPack(gaId: string): GAPack | undefined {
  try {
    const raw = localStorage.getItem(`${CUSTOM_PACK_PREFIX}${gaId}`);
    return raw ? JSON.parse(raw) as GAPack : undefined;
  } catch {
    return undefined;
  }
}

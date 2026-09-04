import type { GACatalogItem, GAPack } from '../types';

const rawBase = import.meta.env.BASE_URL || '/';
const BASE = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
const CONTENT = `${BASE}content`.replace(/\/\/+/g, '/');

export async function fetchCatalog(): Promise<GACatalogItem[]> {
  const res = await fetch(`${CONTENT}/catalog.json`);
  if (!res.ok) throw new Error('Failed to load catalog');
  return res.json();
}

export async function fetchPack(gaId: string): Promise<GAPack> {
  const res = await fetch(`${CONTENT}/${gaId}.json`);
  if (!res.ok) throw new Error(`Failed to load pack for ${gaId}`);
  return res.json();
}

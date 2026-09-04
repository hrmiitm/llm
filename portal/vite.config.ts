import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base URL for GitHub Pages (https://hrmiitm.github.io/llm/)
const rawBase = process.env.BASE_URL || (process.env.NODE_ENV === 'production' ? '/llm/' : '/');
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
});

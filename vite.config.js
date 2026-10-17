import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  // GitHub Pages serves the site from /<repo-name>/
  base: command === 'build' ? '/Girlhoocode_2026Fall/' : '/',
}));

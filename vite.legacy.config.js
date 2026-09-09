import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import tailwindcss from 'tailwindcss-legacy';
import autoprefixer from 'autoprefixer';
import tailwindConfig from './tailwind.config.js';

// Keep tracking and admin on their existing client integrations.
export default defineConfig({
  base: '/legacy/',
  publicDir: false,
  css: { postcss: { plugins: [tailwindcss(tailwindConfig), autoprefixer()] } },
  build: {
    outDir: 'public/legacy', emptyOutDir: true,
    rollupOptions: { input: {
      tracking: resolve('rastreio/index.html'),
      admin: resolve('admin/index.html'),
      adminLogin: resolve('admin/login/index.html'),
    } },
  },
});

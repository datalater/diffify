import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** GitHub Pages project site: https://datalater.github.io/diffify/ */
export default defineConfig({
  base: '/diffify/',
  plugins: [react(), tailwindcss()],
});

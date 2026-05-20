import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { diffifyDevPlugin } from './vite-plugin-diffify-dev';

/** GitHub Pages project site: https://datalater.github.io/diffify/ */
export default defineConfig(({ command }) => ({
  base: '/diffify/',
  plugins: [
    react(),
    tailwindcss(),
    ...(command === 'serve' ? [diffifyDevPlugin()] : []),
  ],
}));

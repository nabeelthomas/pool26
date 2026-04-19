import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://nabeelthomas.github.io/pool26/ on GitHub Pages,
// so all asset URLs need to be prefixed with /pool26/.
export default defineConfig({
  base: '/pool26/',
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});

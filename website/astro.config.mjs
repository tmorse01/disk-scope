import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Update when a custom domain is connected in Netlify. */
const SITE_URL = process.env.SITE_URL ?? 'https://diskscope.netlify.app';

export default defineConfig({
  site: SITE_URL,
  integrations: [react(), sitemap()],
  vite: {
    resolve: {
      alias: {
        '@app-theme': path.resolve(__dirname, '../src/renderer/theme'),
      },
    },
    ssr: {
      noExternal: ['@mui/material', '@mui/system', '@mui/utils', '@emotion/react', '@emotion/styled'],
    },
  },
});

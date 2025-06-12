// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // Replace with your website URL (required for sitemap generation)
  site: 'https://example.com',

  // URL configuration
  trailingSlash: 'never', // Removes trailing slashes from URLs

  // Vite configuration
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@config': path.resolve(__dirname, './src/config'),
      },
    },
  },

  // Required integrations
  integrations: [
    react(), // Enables React components
    sitemap({
      // Generates sitemap
      serialize: (item) => {
        const url = item.url.endsWith('/') ? item.url.slice(0, -1) : item.url;
        return { ...item, url };
      },
    }),
  ],

  // Deployment configuration
  output: 'server', // Server-side rendering - required for OpenAI API usage
  adapter: vercel(), // Deploy to Vercel - optional
  devToolbar: {
    enabled: false,
  },
});

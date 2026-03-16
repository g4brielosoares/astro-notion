import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: process.env.SITE_URL || "http://localhost:4321",
  integrations: [sitemap()],
  output: "static",
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
});
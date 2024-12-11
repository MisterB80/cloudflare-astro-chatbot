// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';
import clerk from "@clerk/astro";
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  }),

  integrations: [tailwind(), react(), clerk()],
  vite: {
    ssr: {
      external: ['pdf-parse'], // Exclude pdf-parse from the build
    },
  },
});
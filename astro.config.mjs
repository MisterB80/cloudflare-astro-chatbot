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
      enabled: true,
      configPath: "wrangler.toml",
    }
  }),

  integrations: [tailwind(), react(), clerk()],
  vite: {
    ssr: {
      external: ['pdf-parse', 'node:async_hooks'], // Exclude pdf-parse from the build
    },
  },
});
// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Fonts are self-hosted from the @fontsource packages in node_modules (latin
// subset only), so the build never depends on a font CDN and the page makes no
// third-party font requests.
/** @param {string} pkg @param {string} file */
const fontsource = (pkg, file) => `./node_modules/${pkg}/files/${file}`;

export default defineConfig({
  site: 'https://jamalamer.com',
  integrations: [sitemap()],
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Archivo',
      cssVariable: '--font-display',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {
            src: [fontsource('@fontsource-variable/archivo', 'archivo-latin-wght-normal.woff2')],
            weight: '400 900',
            style: 'normal',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'JetBrains Mono',
      cssVariable: '--font-mono',
      fallbacks: ['monospace'],
      options: {
        variants: [
          {
            src: [fontsource('@fontsource/jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff2')],
            weight: 400,
            style: 'normal',
          },
          {
            src: [fontsource('@fontsource/jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2')],
            weight: 500,
            style: 'normal',
          },
        ],
      },
    },
  ],
});

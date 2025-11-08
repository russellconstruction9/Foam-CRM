import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'html-env-replacer',
          transformIndexHtml(html, context) {
            return html
              .replace(/%VITE_GOOGLE_MAPS_API_KEY%/g, env.VITE_GOOGLE_MAPS_API_KEY || '')
              .replace(/%VITE_GOOGLE_CLIENT_ID%/g, env.VITE_GOOGLE_CLIENT_ID || '');
          },
        },
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

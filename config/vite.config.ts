import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import themePlugin from '@replit/vite-plugin-shadcn-theme-json';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export default defineConfig(async ({ mode }) => {
  // Conditionally import the cartographer plugin
  const cartographerPlugin =
    process.env.NODE_ENV !== 'production' && process.env.REPL_ID !== undefined
      ? [(await import('@replit/vite-plugin-cartographer')).cartographer()]
      : [];

  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
      themePlugin(),
      ...cartographerPlugin,
      mode === 'analyze' &&
        visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, 'client', 'src'),
        '@shared': path.resolve(rootDir, 'shared'),
        '@server': path.resolve(rootDir, 'server'),
      },
    },
    root: path.resolve(rootDir, 'client'),
    build: {
      outDir: path.resolve(rootDir, 'dist/public'),
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(rootDir, 'client/index.html'),
        },
        output: {
          manualChunks: {
            vendor: [
              'react',
              'react-dom',
              'framer-motion',
              'tailwind-merge',
              'clsx',
            ],
            ui: [
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-toast',
            ],
            form: ['react-hook-form', '@hookform/resolvers', 'zod'],
            charts: ['recharts'],
          },
        },
      },
      target: 'es2020',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: process.env.NODE_ENV === 'production',
        },
      },
    },
  };
});

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 2048,
        deleteOriginFile: false
      })
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['**/*.{test,spec}.{ts,tsx}'],
      exclude: ['node_modules', 'dist'],
    },
    // Server configuration for AI Studio
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
      hmr: {
        overlay: false // Disable error overlay for better performance
      }
    },
    define: {
      'process.env': {},
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
      legalComments: 'none',
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      cssMinify: true,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Vendor core - split by package for better caching
            if (id.includes('node_modules')) {
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('react-dom')) return 'vendor-react-dom';
              if (id.includes('react/') || id === '\x00commonjsHelpers.js' || id.includes('node_modules/react/')) return 'vendor-react';
              if (id.includes('lucide-react')) return 'vendor-lucide';
              if (id.includes('html2pdf.js')) return 'vendor-html2pdf';
              if (id.includes('@tanstack')) return 'vendor-react-query';
              if (id.includes('zustand')) return 'vendor-zustand';
              if (id.includes('@capacitor')) return 'vendor-capacitor';
              if (id.includes('qrcode.react')) return 'vendor-qrcode';
              return 'vendor-others';
            }
            // Don't split types.ts or constants.tsx - keep them in main bundle to avoid circular deps
            if (id.includes('/types.ts') || id.includes('/constants.tsx')) {
              return undefined; // Keep in main bundle
            }
            // Let Rollup handle dynamic imports for pages automatically to prevent circular chunks
            return undefined;
          }
        }
      }
    }
  };
});

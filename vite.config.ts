/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // esbuild minification options (applies to both dev and build)
  esbuild: {
    drop: ['console', 'debugger'], // Remove console.log and debugger in production
    legalComments: 'none' // Remove all comments
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
    exclude: ['firebase/analytics']
  },
  build: {
    commonjsOptions: {
      include: [/firebase/, /node_modules/]
    },
    // Performance optimizations
    target: 'es2020', // Modern target for better tree-shaking
    minify: 'esbuild', // Fast and effective minification
    cssMinify: true,
    cssCodeSplit: true, // Split CSS by route for better caching
    reportCompressedSize: false,
    // Inline small CSS to reduce render-blocking requests
    assetsInlineLimit: 4096, // Inline assets < 4KB (default)
    // Optimize module preloading for critical path
    modulePreload: {
      polyfill: false,
      resolveDependencies: (filename, deps) => {
        // Only preload dependencies for entry point and critical routes
        // Avoid preloading for lazy-loaded routes to reduce initial payload
        if (filename.includes('index')) {
          // For main entry, preload only core dependencies
          return deps.filter(dep =>
            dep.includes('firebase-core') ||
            dep.includes('react-vendor') ||
            dep.includes('router')
          );
        }
        // For other routes, don't preload to avoid network congestion
        return [];
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split Firebase into smaller chunks
          if (id.includes('node_modules/firebase/auth')) return 'firebase-auth';
          if (id.includes('node_modules/firebase/firestore') ||
              id.includes('node_modules/@firebase/firestore')) return 'firebase-firestore';
          if (id.includes('node_modules/firebase') ||
              id.includes('node_modules/@firebase')) return 'firebase-core';

          // React ecosystem
          if (id.includes('react-dom')) return 'react-vendor';
          if (id.includes('react') && !id.includes('react-router')) return 'react-vendor';
          if (id.includes('react-router-dom')) return 'router';

          // UI libraries
          if (id.includes('lucide-react')) return 'ui-icons';
          if (id.includes('class-variance-authority') ||
              id.includes('clsx') ||
              id.includes('tailwind-merge')) return 'ui-utils';
          if (id.includes('@radix-ui')) return 'ui-components';

          // PDF library (large)
          if (id.includes('pdfjs-dist') || id.includes('pdf.worker')) return 'pdf';

          // Feature-based chunks
          if (id.includes('src/pages/Settings.tsx') ||
              id.includes('src/lib/userSettings.ts') ||
              id.includes('src/lib/backup.ts') ||
              id.includes('src/components/Settings/')) {
            return 'settings';
          }

          if (id.includes('src/components/AdminUserManagement.tsx') ||
              id.includes('src/components/AdminNotificationCreator.tsx') ||
              id.includes('src/lib/adminManagement.ts') ||
              id.includes('src/lib/adminNotifications.ts')) {
            return 'admin';
          }

          if (id.includes('src/components/Auth/') ||
              id.includes('src/pages/AuthActionPage.tsx') ||
              id.includes('src/pages/PasswordRecoveryPage.tsx') ||
              id.includes('src/pages/VerifyEmailPage.tsx') ||
              id.includes('src/pages/SimpleEmailVerification.tsx')) {
            return 'auth';
          }

          // Subscription and payment features
          if (id.includes('src/lib/stripe') ||
              id.includes('src/lib/subscription') ||
              id.includes('src/components/Subscription') ||
              id.includes('src/hooks/useStripeCheckout')) {
            return 'payments';
          }

          // Let smaller modules fall into main bundle
          return undefined;
        }
      }
    },
    // Increase chunk size warning limit since we're using manual chunks
    chunkSizeWarningLimit: 1000
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Content-Security-Policy': "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://www.gstatic.com https://www.google.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://recaptcha.google.com https://www.recaptcha.net; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://r2cdn.perplexity.ai; font-src 'self' https://fonts.gstatic.com https://r2cdn.perplexity.ai data: blob:; img-src 'self' data: https: blob:; connect-src 'self' https: wss:; frame-src 'self' https: https://www.google.com https://recaptcha.google.com https://www.recaptcha.net https://recaptcha.net; object-src 'none';"
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true
  }
})

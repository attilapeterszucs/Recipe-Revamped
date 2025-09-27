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
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
    exclude: ['firebase/analytics']
  },
  build: {
    commonjsOptions: {
      include: [/firebase/, /node_modules/]
    },
    // Reduce module preloading to prevent unused preload warnings
    modulePreload: {
      polyfill: false,
      resolveDependencies: (_filename, deps) => {
        // Only preload critical dependencies
        return deps.filter(dep =>
          dep.includes('firebase') ||
          dep.includes('react') ||
          dep.includes('router')
        );
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks for large libraries
          if (id.includes('firebase')) return 'firebase';
          if (id.includes('react') && !id.includes('react-router')) return 'react-vendor';
          if (id.includes('react-router-dom')) return 'router';
          if (id.includes('lucide-react')) return 'ui-vendor';
          if (id.includes('class-variance-authority')) return 'ui-vendor';

          // Keep Settings isolated but allow UI components to be in main bundle
          if (id.includes('src/pages/Settings.tsx') ||
              id.includes('src/lib/userSettings.ts') ||
              id.includes('src/lib/backup.ts')) {
            return 'settings';
          }

          // Other feature chunks
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

          // Let UI components and other modules fall into main bundle
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
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true
  }
})

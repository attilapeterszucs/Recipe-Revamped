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
        manualChunks: {
          // Vendor chunks for large libraries
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui-vendor': ['lucide-react'],

          // Feature-based chunks
          'admin': [
            'src/components/AdminUserManagement.tsx',
            'src/components/AdminNotificationCreator.tsx',
            'src/lib/adminManagement.ts',
            'src/lib/adminNotifications.ts'
          ],
          'auth': [
            'src/components/Auth/SignIn.tsx',
            'src/components/Auth/SignUp.tsx',
            'src/components/Auth/EmailVerificationPrompt.tsx',
            'src/pages/AuthActionPage.tsx',
            'src/pages/PasswordRecoveryPage.tsx',
            'src/pages/VerifyEmailPage.tsx',
            'src/pages/SimpleEmailVerification.tsx'
          ],
          'payment': [
            'src/components/PricingModal.tsx',
            'src/components/UserAccountDropdown.tsx',
            'src/hooks/useStripeCheckout.ts',
            'src/lib/subscriptionService.ts',
            'src/lib/subscriptionCancellationService.ts',
            'src/lib/subscriptionSyncService.ts',
            'src/lib/subscriptionExpiryService.ts'
          ],
          'recipe': [
            'src/components/RecipeInput.tsx',
            'src/components/RecipeEditor.tsx',
            'src/components/SavedRecipes.tsx',
            'src/lib/firestore.ts',
            'src/lib/ai.ts',
            'src/lib/imageService.ts',
            'src/lib/recipeImageService.ts'
          ],
          'meal-planning': [
            'src/components/MealPlannerCalendar.tsx',
            'src/lib/mealPlanService.ts'
          ],
          'settings': [
            'src/pages/Settings.tsx',
            'src/lib/userSettings.ts',
            'src/lib/backup.ts'
          ]
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

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // تحسينات للإنتاج
    minify: 'terser',
    terserOptions: {
      compress: {
        // إزالة جميع console statements في الإنتاج
        drop_console: true,
        drop_debugger: true,
        // إزالة التعليقات
        comments: false,
        // تحسينات إضافية
        dead_code: true,
        unused: true,
        // إزالة console.log, console.warn, console.error
        pure_funcs: ['console.log', 'console.warn', 'console.error', 'console.info', 'console.debug']
      },
      mangle: {
        // تشفير أسماء المتغيرات
        toplevel: true
      },
      format: {
        // إزالة التعليقات
        comments: false
      }
    },
    // تحسين حجم الـ bundle
    rollupOptions: {
      output: {
        manualChunks: {
          // فصل المكتبات الكبيرة
          vendor: ['react', 'react-dom'],
          utils: ['date-fns', 'zustand'],
          ui: ['@heroicons/react']
        }
      }
    },
    // ضغط إضافي
    cssCodeSplit: true,
    sourcemap: false, // إزالة source maps في الإنتاج
    // تحسين الأداء
    chunkSizeWarningLimit: 1000
  },
  // تحسينات التطوير
  server: {
    // تحسين سرعة التطوير
    hmr: {
      overlay: false
    }
  },
  // تحسين الاستيراد
  optimizeDeps: {
    include: ['react', 'react-dom', 'date-fns', 'zustand']
  }
})

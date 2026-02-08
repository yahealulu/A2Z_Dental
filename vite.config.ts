import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // تحسينات للإنتاج (استخدام esbuild الافتراضي - أسرع ولا يتطلب تثبيت terser)
    minify: 'esbuild',
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

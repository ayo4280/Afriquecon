import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) return 'react'
          if (id.includes('node_modules/@supabase')) return 'supabase'
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) return 'i18n'
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) return 'maps'
          if (id.includes('node_modules/react-paystack')) return 'payments'
          if (id.includes('node_modules/react-datepicker')) return 'datepicker'
        },
      },
    },
  },
})

import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        rastreio: resolve(__dirname, 'rastreio/index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
        adminLogin: resolve(__dirname, 'admin/login/index.html')
      }
    }
  }
})

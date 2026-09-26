/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Test-only support code (never imported by production code), kept
      // outside `src` so it is not part of any FSD slice public API.
      '@test': fileURLToPath(new URL('./test', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
    css: true,
  },
})

import {defineConfig} from "vite";
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: ['src/plugin.ts'],
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        "path",
        "node:fs/promises",
        "@qwery/server/middleware",
        /@sveltejs.*/,
        "@tailwindcss/vite",
        "@duckdb/node-api",
      ]
    }
  },
})
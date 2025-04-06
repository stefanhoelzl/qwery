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
        "@qwery/server/middleware",
        /@sveltejs.*/,
        "@tailwindcss/vite",
      ]
    }
  },
})
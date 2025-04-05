import {defineConfig} from "vite";
import dts from 'vite-plugin-dts'
import {builtinModules} from "node:module";

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: ['src/plugin.ts'],
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        "typescript",
        "vite",
        /@sveltejs.*/,
        "@duckdb/node-api",
        /node:.*/,
        /@tailwindcss.*/,
        ...builtinModules
      ]
    }
  },
})
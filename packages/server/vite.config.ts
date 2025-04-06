import {defineConfig} from "vite";
import dts from 'vite-plugin-dts'
import {builtinModules} from "node:module";

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: ['src/main.ts', "src/middleware.ts"],
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        "@duckdb/node-api",
        ...builtinModules
      ]
    }
  },
})
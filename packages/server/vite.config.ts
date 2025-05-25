import { builtinModules } from "node:module";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: ["src/main.ts", "src/middleware.ts"],
      formats: ["es"]
    },
    rollupOptions: {
      external: ["@duckdb/node-api", ...builtinModules]
    }
  }
});

import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [sveltekit(), tailwindcss()],
  css: {
    preprocessorOptions: {
      scss: {
        // tabulator uses these deprecated features in its sass files.
        silenceDeprecations: ["global-builtin", "color-functions", "import"]
      }
    }
  },
  build: {
    rollupOptions: {
      external: ["@duckdb/node-api"]
    }
  },
});

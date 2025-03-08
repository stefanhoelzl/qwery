import { svelteTesting } from "@testing-library/svelte/vite";
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

  test: {
    workspace: [
      {
        extends: "./vite.config.ts",
        plugins: [svelteTesting()],
        test: {
          name: "jsdom",
          environment: "jsdom",
          clearMocks: true,
          include: ["tests/**/*.svelte.test.ts", "tests/**/*.test.ts"],
          // exclude: ["tests/lib/server/**"],
          setupFiles: ["tests/client-setup.ts"]
        }
      },
      {
        extends: "./vite.config.ts",
        test: {
          name: "node",
          environment: "node",
          include: ["tests/**/*.svelte.test.ts", "tests/**/*.test.ts"]
          // exclude: ["tests/**/*.svelte.test.ts"]
        }
      }
    ]
  }
});

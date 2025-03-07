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
          name: "client",
          environment: "jsdom",
          clearMocks: true,
          include: ["src/**/*.svelte.test.ts"],
          exclude: ["src/lib/server/**"],
          setupFiles: ["tests/client-setup.ts"]
        }
      },
      {
        extends: "./vite.config.ts",

        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.svelte.test.ts"]
        }
      }
    ]
  }
});

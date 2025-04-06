import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from "@tailwindcss/vite";
import { type PreviewServer, type ViteDevServer } from "vite";
import {register} from "@qwery/server/middleware";

export function qwery(opts: {db: string}) {
  return [
    {
      name: 'qwery',
      async configureServer(server: ViteDevServer) {
        await register(server.middlewares, opts);
      },
      async configurePreviewServer(server: PreviewServer) {
        await register(server.middlewares, opts);
      },
    },
    svelte(),
    tailwindcss()
  ]
}

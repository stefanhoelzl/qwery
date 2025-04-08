import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from "@tailwindcss/vite";
import type { PreviewServer, ViteDevServer, ResolvedConfig, UserConfig } from "vite";
import {register} from "@qwery/server/middleware";
import {resolve} from "path";
import fs from "node:fs/promises";
import { DuckDBInstance } from "@duckdb/node-api";

const Containerfile = `
FROM node:23-bookworm-slim

COPY ui /site
COPY server /server
COPY data.ddb /data.ddb

RUN cd /server && npm install @duckdb/node-api@1.2.1-alpha.17

ENV SITE=/site
ENV DB=/data.ddb
ENV PORT=80
ENV NODE_ENV=production

CMD [ "node", "/server/main.js" ]
`

export function qwery() {
  let sqlFile: string;
  let dbFile: string;

  return [
    {
      name: 'qwery',
      config(config: UserConfig) {
        if(!config.build) config.build = {};
        config.build.outDir = "dist/ui";
      },
      configResolved(config: ResolvedConfig) {
        sqlFile = resolve(config.root, "src/data.sql");
        dbFile = resolve(config.root, "dist/data.ddb");
      },
      async configureServer(server: ViteDevServer) {
        await register(server.middlewares, { db: dbFile });
      },
      async configurePreviewServer(server: PreviewServer) {
        await register(server.middlewares, { db: dbFile });
      },
      async writeBundle() {
        await fs.unlink(dbFile).catch(() => {});
        const sql = await fs.readFile(sqlFile).then((b) => b.toString());

        const db = await DuckDBInstance.create(dbFile);
        const con = await db.connect();
        await con.run("PRAGMA enable_progress_bar");
        const statements = await con.extractStatements(sql.replaceAll("${env:DSN}", process.env["DSN"]!));
        for (let stmtIdx = 0; stmtIdx < statements.count; stmtIdx++) {
          console.log(`importing sql statement # ${stmtIdx}`);
          const prepared = await statements.prepare(stmtIdx);
          await prepared.run();
        }

        await fs.mkdir("dist/server", {recursive: true});
        await fs.cp(resolve(import.meta.dirname, "../../server/dist"), "dist/server", { recursive: true });
        await fs.writeFile("dist/Containerfile", Containerfile);
      }
    },
    svelte({
      preprocess: vitePreprocess(),
    }),
    tailwindcss()
  ]
}

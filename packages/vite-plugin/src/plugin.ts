import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from "@tailwindcss/vite";
import type { PreviewServer, ViteDevServer, UserConfig, ResolvedConfig } from "vite";
import {register} from "@qweri/server/middleware";
import {resolve, join} from "path";
import {cwd} from "process";
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
  let resolvedConfig: ResolvedConfig;

  let sqlFile = resolve(cwd(), "src/data.sql");
  let dbFile = resolve(cwd(), "dist/data.ddb");
  let schemaFile = resolve(cwd(), "src/schema.ts")

  return [
    {
      name: 'qwery',
      config(config: UserConfig) {
        config.root = join(import.meta.dirname, "../root");
        config.build = {
          outDir: resolve(cwd(), "dist/ui"),
          emptyOutDir: true,
        };

        if(config.resolve === undefined) config.resolve = {};
        config.resolve.alias = {"@project": resolve(cwd())}
      },
      configResolved(config: ResolvedConfig) {
        resolvedConfig = config;
      },
      async configureServer(server: ViteDevServer) {
        await register(server.middlewares, { db: dbFile });
      },
      async configurePreviewServer(server: PreviewServer) {
        await register(server.middlewares, { db: dbFile });
      },
      async buildStart() {
        if (resolvedConfig.mode == "production") {
          await importDatabase(sqlFile, dbFile);
        }
        await buildSchema(schemaFile, dbFile);
      },
      async writeBundle() {
        await fs.rm("dist/server", {force: true, recursive: true})
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

async function importDatabase(sqlFile: string, dbFile: string) {
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
}

async function buildSchema(schemaFile: string, dbFile: string) {
  const map: Record<string, "number" | "string" | "boolean" | "date"> = {
    "INTEGER": "number",
    "FLOAT": "number",
    "BIGINT": "number",
    "TIMESTAMP": "date",
    "BOOLEAN": "boolean",
  }

  const db = await DuckDBInstance.create(dbFile, {access_mode: "READ_ONLY"});
  const con = await db.connect();

  const tables = (await (await con.run("show tables")).getRows()).map(([t]) => t);

  if(tables.length === 0) throw "imported database has no tables";

  await fs.writeFile(schemaFile, `
import { FieldFactories, number, string, date, boolean } from '@qweri/dashboard';

export function buildSchema(ctx: FieldFactories) {
  return {
`);

  for(let table of tables) {
    await fs.appendFile(schemaFile, `    ${table}: {\n`);
    const columns = await (await con.run(`describe ${table}`)).getRows();
    for(let [name, dbtype, nullable] of columns.map(col => col as [string, string, "YES" | "NO"])) {
      const [_, mappedType] = Object.entries(map)
        .find(([db]) => dbtype.startsWith(db)) || [null, "string"];

      const type = `${mappedType}()` + (nullable == "YES" ? ".nullable()" : "")
      await fs.appendFile(schemaFile, `      ${name}: ctx.column("${table}", "${name}", ${type}),\n`);
    }
    await fs.appendFile(schemaFile, "    },\n")
  }

  await fs.appendFile(schemaFile, "  }\n}\n")
  await fs.appendFile(schemaFile, "export type Schema = ReturnType<typeof buildSchema>;")
}
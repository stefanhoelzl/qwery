import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { type PreviewServer, type ViteDevServer } from "vite";
import type { ServerResponse, IncomingMessage } from "node:http";
import { DuckDBInstance, DuckDBTimestampValue } from "@duckdb/node-api";

export function qwery(opts: {db: string}) {
  function parseDbValue(v: unknown) {
    if (typeof v === "bigint") return parseInt(v.toString());
    if (v instanceof DuckDBTimestampValue) return v.toString();
    return v;
  }

  async function queryMiddleware() {
    const db = await DuckDBInstance.create(opts.db, {
      access_mode: "READ_ONLY",
      // threads: "2",
      // memory_limit: "4GB",
    });

    return (
      req: IncomingMessage,
      res: ServerResponse<IncomingMessage>,
    ) => {
      const chunks: Buffer[] = []
      req
        .on("data", (chunk) => chunks.push(chunk))
        .on("end", async () => {
          const query = JSON.parse(Buffer.concat(chunks).toString());

          const conn = await db.connect();
          const prepared = await conn.prepare(query);
          const result = await prepared.run();
          const rows = await result.getRows();

          res.statusCode = 200;
          res.end(JSON.stringify(rows.map((row) => row.map(parseDbValue))))
        });
    }
  }

  return [
    {
      name: 'qwery',
      async configureServer(server: ViteDevServer) {
        const middleware = await queryMiddleware()
        return async () => {
          server.middlewares.use("/api/query", middleware);
        }
      },
      async configurePreviewServer(server: PreviewServer) {
        const middleware = await queryMiddleware()
        return async () => {
          server.middlewares.use("/api/query", middleware);
        }
      },
    },
    sveltekit(),
    tailwindcss()
  ]
}

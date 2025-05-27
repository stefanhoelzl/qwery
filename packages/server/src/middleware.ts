import type { IncomingMessage, ServerResponse } from "node:http";
import {
  DuckDBInstance,
  DuckDBIntervalValue,
  DuckDBTimestampTZValue,
  DuckDBTimestampValue,
  DuckDBUUIDValue
} from "@duckdb/node-api";
import { Server } from "connect";

interface QueryMiddlewareOpts {
  db: string;
}

function parseDbValue(v: unknown) {
  if (typeof v === "bigint") return parseInt(v.toString());
  if (v instanceof DuckDBTimestampValue) return v.toString();
  if (v instanceof DuckDBTimestampTZValue) return v.toString();
  if (v instanceof DuckDBIntervalValue) return v.toString();
  if (v instanceof DuckDBUUIDValue) return v.toString();
  return v;
}

async function query(opts: QueryMiddlewareOpts) {
  const db = await DuckDBInstance.fromCache(opts.db, {
    access_mode: "READ_ONLY"
    // threads: "2",
    // memory_limit: "4GB",
  });

  return (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => {
    const chunks: Buffer[] = [];
    req
      .on("data", (chunk) => chunks.push(chunk))
      .on("end", async () => {
        try {
          const raw = Buffer.concat(chunks).toString();
          const queries = JSON.parse(raw);

          const results = [];
          const conn = await db.connect();
          for (const query of queries) {
            const prepared = await conn.prepare(query);
            const result = await prepared.run();
            const rows = await result.getRows();
            results.push(rows.map((row) => row.map(parseDbValue)));
          }
          res.statusCode = 200;
          res.end(JSON.stringify(results));
        } catch (e: unknown) {
          res.statusCode = 500;
          res.end(`${e}`);
        }
      });
  };
}

export async function register(server: Server, opts: QueryMiddlewareOpts) {
  server.use("/api/query", await query(opts));
}

import type { ServerResponse, IncomingMessage } from "node:http";
import { DuckDBInstance, DuckDBTimestampValue } from "@duckdb/node-api";
import {Server} from "connect";

interface QueryMiddlewareOpts {
  db: string;
}

function parseDbValue(v: unknown) {
  if (typeof v === "bigint") return parseInt(v.toString());
  if (v instanceof DuckDBTimestampValue) return v.toString();
  return v;
}

async function query(opts: QueryMiddlewareOpts) {
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

export async function register(server: Server, opts: QueryMiddlewareOpts) {
  server.use("/api/query", await query(opts))
}
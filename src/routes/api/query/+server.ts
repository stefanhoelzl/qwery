import { DuckDBInstance } from "@duckdb/node-api";
import { json } from "@sveltejs/kit";

let db: DuckDBInstance | undefined = undefined;

export async function POST({ request }) {
  const query = await request.json();

  if (!db)
    db = await DuckDBInstance.create("src/project/data.ddb", {
      access_mode: "READ_ONLY",
      // threads: "2",
      // memory_limit: "4GB",
    });
  const conn = await db.connect();
  await conn.run("PRAGMA enable_progress_bar");

  const prepared = await conn.prepare(query);
  const result = await prepared.run();
  const rows = await result.getRows();

  conn.close();

  return json(
    rows.map((row) => row.map((v) => (typeof v === "bigint" ? parseInt(v.toString()) : v)))
  );
}

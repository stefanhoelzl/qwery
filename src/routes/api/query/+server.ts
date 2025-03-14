import { DuckDBInstance, DuckDBPendingResultState } from "@duckdb/node-api";
import { json } from "@sveltejs/kit";

let db: DuckDBInstance | undefined = undefined;

export async function POST({ request }) {
  const query = await request.json();

  if (!db)
    db = await DuckDBInstance.create("/var/home/stefan/Development/repos/digger/tb2logs/db.ddb", {
      access_mode: "READ_ONLY",
      threads: "2",
      memory_limit: "4GB"
    });
  const conn = await db.connect();
  await conn.run("PRAGMA enable_progress_bar");

  const prepared = await conn.prepare(query);
  const pending = prepared.start();
  while (pending.runTask() !== DuckDBPendingResultState.RESULT_READY) {
    await new Promise((r) => setTimeout(r, 10));
  }
  const result = await pending.getResult();
  const rows = await result.getRows();
  return json(
    rows.map((row) => row.map((v) => (typeof v === "bigint" ? parseInt(v.toString()) : v)))
  );
}

import { readFile, unlink } from "node:fs/promises";
import { DuckDBInstance } from "@duckdb/node-api";

const [sqlFile, dbFile] = process.argv.slice(2);

await unlink(dbFile).catch(() => {});

const sql = await readFile(sqlFile).then((b) => b.toString());

const db = await DuckDBInstance.create(dbFile);
const con = await db.connect();
await con.run("PRAGMA enable_progress_bar");

const statements = await con.extractStatements(sql.replaceAll("${env:DSN}", process.env["DSN"]!));

for (let stmtIdx = 0; stmtIdx < statements.count; stmtIdx++) {
  console.log(`# ${stmtIdx}`);
  const prepared = await statements.prepare(stmtIdx);
  await prepared.run();
}

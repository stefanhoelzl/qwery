import { mount } from "svelte";
import { Dashboard, DashboardManager, DatabaseSchema, fieldFactories } from "@qweri/dashboard";
import dashboard from "@project/src/main.ts";
import { buildSchema } from "@project/src/schema.ts";

let dbSchema: DatabaseSchema;
const ctx = fieldFactories();
const schema = buildSchema(ctx);
const { panel } = dashboard(schema, ctx, (s) => {
  dbSchema = s;
});

mount(Dashboard, {
  target: document.getElementById("dashboard")!,
  props: {
    manager: new DashboardManager(dbSchema),
    dashboard: panel
  }
});

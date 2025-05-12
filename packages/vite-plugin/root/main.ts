import { mount } from 'svelte'
import { Dashboard, DashboardManager } from "@qwery/dashboard";
import dashboard from "@project/src/main.ts";
import { DatabaseSchema } from "@project/src/schema.ts";


const db = new DatabaseSchema();
const {table, panel} = dashboard(db);

mount(Dashboard, {
  target: document.getElementById('dashboard')!,
  props: {
    manager: new DashboardManager(table),
    dashboard: panel
  }
});
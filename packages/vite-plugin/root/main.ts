import { mount } from 'svelte'
import { Dashboard, DashboardManager } from "@qwery/dashboard";
import dashboard from "@project/src/main.ts";
import { DatabaseSchema } from "@project/src/schema.ts";


const db = new DatabaseSchema();
const {panel} = dashboard(db);

mount(Dashboard, {
  target: document.getElementById('dashboard')!,
  props: {
    manager: new DashboardManager(),
    dashboard: panel
  }
});
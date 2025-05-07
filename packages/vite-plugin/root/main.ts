import { mount } from 'svelte'
import { Dashboard, DashboardManager } from "@qwery/dashboard";
import {dashboard, table} from "@project/src/main.ts"

mount(Dashboard, {
  target: document.getElementById('dashboard')!,
  props: {
    manager: new DashboardManager(table),
    dashboard
  }
});
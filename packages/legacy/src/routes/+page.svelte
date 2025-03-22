<script lang="ts">
  import {onMount} from "svelte";
  // import ThemeSwitcher from "$lib/views/ThemeSwitcher.svelte";
  import Header from "$lib/views/Header.svelte";
  import Dashboard from "$lib/Dashboard.svelte";
  import { dashboard, manager } from "$lib/../project/dashboard";

  onMount(() => manager.triggerUpdates());
</script>

<div class="flex h-screen flex-col bg-gray-50 dark:bg-neutral-900">
  <Header>
    {#snippet left()}
      <a
        class="flex-none text-xl font-semibold text-black focus:opacity-80 focus:outline-hidden dark:text-white"
        href="#home"
        aria-label="Brand"
      >
        qwery
      </a>
    {/snippet}
    {#snippet right()}
      <a
        class="font-medium text-gray-600 hover:text-gray-400 focus:text-gray-400 focus:outline-hidden dark:text-neutral-400 dark:hover:text-neutral-500 dark:focus:text-neutral-500"
        href="#logout">Logout</a
      >
      <!-- <ThemeSwitcher></ThemeSwitcher> -->
    {/snippet}
  </Header>
  <Dashboard {dashboard} {manager}></Dashboard>
</div>

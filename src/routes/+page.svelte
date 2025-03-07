<script lang="ts">
  import ThemeSwitcher from "$lib/ui/ThemeSwitcher.svelte";
  import Header from "$lib/ui/Header.svelte";
  import PanelCard from "$lib/ui/PanelCard.svelte";
  import PanelGrid from "$lib/ui/PanelGrid.svelte";
  import Table from "$lib/ui/table/Table.svelte";
  import { Terminal } from "lucide-svelte";
  import FilterButton from "$lib/ui/FilterButton.svelte";
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
      <ThemeSwitcher></ThemeSwitcher>
    {/snippet}
  </Header>
  <Header>
    {#snippet left()}
      <button
        type="button"
        class="inline-flex items-center gap-x-2 rounded-lg border border-transparent bg-transparent px-2 py-2 text-sm font-medium text-blue-800 hover:bg-transparent hover:text-blue-400 focus:bg-transparent focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 dark:text-blue-800 dark:hover:bg-transparent"
      >
        <Terminal></Terminal>
      </button>
      <FilterButton></FilterButton>
      <FilterButton></FilterButton>
      <FilterButton></FilterButton>
      <FilterButton></FilterButton>
    {/snippet}
  </Header>
  <PanelGrid>
    <PanelCard>
      <Table></Table>
    </PanelCard>
  </PanelGrid>
</div>

<script lang="ts">
  import Header from "$lib/views/Header.svelte";
  import FilterPanel from "$lib/panels/FilterPanel.svelte";
  import Actions from "$lib/views/Actions.svelte";
  import { onMount } from "svelte";
  import type { PanelOrContainer, AnyProps, Container, Panel } from "$lib/panels";
  import type { ContainerContext, PanelContext } from "$lib/DashboardManager.svelte";
  import { manager, dashboard } from "../project/dashboard";

  onMount(() => manager.triggerUpdates());
</script>

{#snippet panelOrContainer(def: PanelOrContainer<AnyProps>, container: ContainerContext)}
  {#if def.type === "container"}
    {@render containerSnippet(def, container.createContainer())}
  {:else if def.type === "panel"}
    {@render panelSnippet(def, manager.createPanel({ filter: def.filter, container }))}
  {/if}
{/snippet}

{#snippet containerSnippet(def: Container<AnyProps, AnyProps, AnyProps>, ctx: ContainerContext)}
  <svelte:component this={def.component} {...def.props} {ctx}>
    {#each def.content as child, idx (idx)}
      <svelte:component this={def.wrapper} {...child.layout}>
        {@render panelOrContainer(child, ctx)}
      </svelte:component>
    {/each}
  </svelte:component>
{/snippet}

{#snippet panelSnippet(def: Panel<AnyProps, AnyProps>, ctx: PanelContext)}
  <svelte:component this={def.component} {...def.props} {ctx}></svelte:component>
{/snippet}

<Header>
  {#snippet left()}
    <Actions></Actions>
    {#each manager.filters as filter (filter.dataField.id)}
      <FilterPanel
        ctx={manager.createPanel()}
        {filter}
        ondelete={() => manager.filterManager.dropFilter(filter.dataField)}
      ></FilterPanel>
    {/each}
  {/snippet}
</Header>

<div class="contents">
  {/* @ts-expect-error do not understand */ null}
  {@render panelOrContainer(dashboard, manager.createBaseContainer())}
</div>

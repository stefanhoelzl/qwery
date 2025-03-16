<script lang="ts">
  import Header from "$lib/views/Header.svelte";
  import FilterPanel from "$lib/panels/FilterPanel.svelte";
  import Actions from "$lib/views/Actions.svelte";
  import { onMount } from "svelte";
  import type { PanelOrContainer, AnyProps, Container, Panel } from "$lib/panels";
  import { manager, dashboard } from "../project/dashboard";

  onMount(() => manager.triggerUpdates());
</script>

{#snippet panelOrContainer(def: PanelOrContainer<AnyProps>)}
  {#if def.type === "container"}
    {@render containerSnippet(def)}
  {:else if def.type === "panel"}
    {@render panelSnippet(def)}
  {/if}
{/snippet}

{#snippet containerSnippet(def: Container<AnyProps, AnyProps, AnyProps>)}
  <svelte:component this={def.component} {...def.props}>
    {#each def.content as child, idx (idx)}
      <svelte:component this={def.wrapper} {...child.layout}>
        {@render panelOrContainer(child)}
      </svelte:component>
    {/each}
  </svelte:component>
{/snippet}

{#snippet panelSnippet(def: Panel<AnyProps, AnyProps>)}
  <svelte:component
    this={def.component}
    {...def.props}
    ctx={manager.createPanel({ filter: def.filter })}
  ></svelte:component>
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
  {@render panelOrContainer(dashboard)}
</div>

<script lang="ts">
  import Header from "$lib/views/Header.svelte";
  import Table from "$lib/panels/Table.svelte";
  import Grid from "./views/Grid.svelte";
  import GridCell from "$lib/views/GridCell.svelte";
  import FilterPanel from "$lib/views/FilterPanel.svelte";
  import Actions from "$lib/views/Actions.svelte";
  import { StringDimension, NumberMetric, NotNullFilter } from "$lib/QueryBuilder";
  import { DashboardManager } from "$lib/DashboardManager.svelte";
  import { onMount } from "svelte";

  const dashboardManager = new DashboardManager();
  const article_number = new StringDimension("prodstep_articlenumber");
  const stage = new StringDimension("prodstep_stage");
  const count = new NumberMetric("count()", { label: "#" });

  onMount(() => dashboardManager.triggerUpdates());
</script>

<Header>
  {#snippet left()}
    <Actions></Actions>
    {#each dashboardManager.filters as filter (filter.dataField.id)}
      <FilterPanel
        ctx={dashboardManager.createPanel()}
        {filter}
        ondelete={() => dashboardManager.filterManager.dropFilter(filter.dataField)}
      ></FilterPanel>
    {/each}
  {/snippet}
</Header>

<div class="contents">
  <Grid cols={12} rows={12}>
    <GridCell row={0} row-span={12} col={0} col-span={3}>
      <Table
        columns={[{ field: article_number }, { field: count, width: 100 }]}
        ctx={dashboardManager.createPanel({ filter: new NotNullFilter(article_number) })}
      ></Table>
    </GridCell>
    <GridCell row={0} row-span={6} col={3} col-span={2}>
      <Table
        columns={[{ field: stage }, { field: count, width: 100 }]}
        ctx={dashboardManager.createPanel({ filter: new NotNullFilter(stage) })}
      ></Table>
    </GridCell>
  </Grid>
</div>

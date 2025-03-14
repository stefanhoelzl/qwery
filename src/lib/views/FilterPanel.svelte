<script lang="ts">
  import FilterView from "./FilterView.svelte";
  import type { PanelContext } from "$lib/DashboardManager.svelte";
  import { type DataFieldFilter, NumberMetric } from "$lib/QueryBuilder";
  import { onDestroy } from "svelte";
  import Table from "$lib/panels/Table.svelte";

  interface Props {
    filter: DataFieldFilter<unknown>;
    ctx: PanelContext;
    ondelete: () => void;
  }

  const { ondelete, filter, ctx }: Props = $props();

  onDestroy(() => ctx.drop());
</script>

<FilterView label={filter.dataField.label} {ondelete}>
  <Table {ctx} columns={[{field: filter.dataField}, {field: new NumberMetric("count()"), width: 100}]} ></Table>
</FilterView>

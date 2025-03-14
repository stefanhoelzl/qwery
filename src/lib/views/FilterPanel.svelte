<script lang="ts">
  import FilterView from "./FilterView.svelte";
  import NumberRange from "$lib/views/NumberRange.svelte";
  import type { PanelContext } from "$lib/DashboardManager.svelte";
  import { type DataFieldFilter } from "$lib/QueryBuilder";
  import { onDestroy } from "svelte";

  interface Props {
    filter: DataFieldFilter<unknown>;
    ctx: PanelContext;
    ondelete: () => void;
  }

  const { ondelete, filter, ctx }: Props = $props();

  onDestroy(() => ctx.drop());
</script>

<FilterView label={filter.dataField.label} {ondelete}>
  <NumberRange></NumberRange>
</FilterView>

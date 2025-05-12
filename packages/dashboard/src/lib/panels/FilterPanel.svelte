<script lang="ts">
	import FilterView from '../views/FilterView.svelte';
	import type { PanelContext } from '$lib/DashboardManager.svelte.js';
	import {
		type DataFieldFilter,
		number_metric,
		RangeFilter,
		DataFieldFilterMap
	} from '$lib/QueryBuilder';
	import { onDestroy } from 'svelte';
	import Table from '$lib/panels/Table.svelte';
	import NumberRange from '$lib/views/NumberRange.svelte';

	interface Props {
		filter: DataFieldFilter<unknown>;
		ctx: PanelContext;
	}

	const { filter, ctx }: Props = $props();

	onDestroy(() => ctx.drop());
</script>

<FilterView label={filter.dataField.label} ondelete={() => ctx.dropFilter(filter.dataField)}>
	{#if filter instanceof RangeFilter}
		<NumberRange
			min={filter.min}
			max={filter.max}
			onupdate={(min, max) => {
				ctx.filter(new DataFieldFilterMap([new RangeFilter(filter.dataField, min, max)]));
			}}
		></NumberRange>
	{:else}
		<Table
			{ctx}
			columns={[{ field: filter.dataField }, { field: number_metric('count()'), width: 100 }]}
		></Table>
	{/if}
</FilterView>

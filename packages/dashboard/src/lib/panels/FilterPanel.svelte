<script lang="ts">
	import FilterView from '../views/FilterView.svelte';
	import type { PanelContext } from '$lib/DashboardManager.svelte.js';
	import {
		type Filter,
		number,
		range,
		Field,
	} from '$lib/QueryBuilder';
	import { onDestroy } from 'svelte';
	import Table from '$lib/panels/Table.svelte';
	import NumberRange from '$lib/views/NumberRange.svelte';

	interface Props {
		filter: Filter;
		ctx: PanelContext;
	}

	const { filter, ctx }: Props = $props();

	onDestroy(() => ctx.drop());
</script>

<FilterView label={filter.field.label} ondelete={() => ctx.dropFilter(filter.field)}>
	{#if false}
		<NumberRange
			min={0}
			max={1}
			onupdate={(min, max) => {
				ctx.filter([range(filter.field, min, max)]);
			}}
		></NumberRange>
	{:else}
		<Table
			{ctx}
			columns={[{ field: filter.field }, { field: new Field("count", 'count()', [], true, number()), width: 100 }]}
		></Table>
	{/if}
</FilterView>

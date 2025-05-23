<script module lang="ts">
	import { Field } from '$lib/QueryBuilder';
	import type { PanelContext } from '$lib/DashboardManager.svelte';
	import Loading from '$lib/views/Loading.svelte';

	export type Columns<R extends unknown[]> = {
		[K in keyof R]: {
			field: Field<R[K], unknown>;
			width?: number;
		};
	};

	export interface Props<R extends unknown[]> {
		columns: Columns<R>;
		ctx: PanelContext;
	}
</script>

<script lang="ts" generics="R extends unknown[]">
	import TableView from '$lib/views/TableView.svelte';
	import { selection, range } from '$lib/QueryBuilder';

	let { columns, ctx }: Props<R> = $props();

	const pageSize = 200;
	let data: R[] = $state([]);
	let pages: number = $state(1);
	let loading: boolean = $state(false);

	let orderBy: [Field<unknown, unknown>, 'asc' | 'desc'][] = [];

	ctx.onUpdate(async () => {
		if (!ctx.isActive) {
			loading = true;
			const [count, result] = await ctx.fetch<R>(
				//  @ts-expect-error i dont know
				columns.map((c) => c.field),
				{ limit: pageSize, orderBy }
			)
			pages = Math.ceil(count / pageSize);
			data = result;
			loading = false;
		}
	});

	function onDataRequest(opts: { page: number; sort: { field: string; dir: 'asc' | 'desc' }[] }) {
		orderBy = opts.sort.map((s) => [columns[parseInt(s.field)].field, s.dir]);
		return ctx
			.fetch<R>(
				//  @ts-expect-error i dont know
				columns.map((c) => c.field),
				{ limit: pageSize, offset: (opts.page - 1) * pageSize, orderBy }
			)
			.then(([_count, data]) => ({ last_page: pages, data }));
	}

	function onSelect(valueMap: Map<number, unknown[]>) {
		ctx.filter(
			Array.from(
				valueMap.entries().map(([col, values]) => {
					if (values.every((v) => typeof v === 'number'))
						return range(columns[col].field, Math.min(...values), Math.max(...values));
					return selection(columns[col].field, values);
				})
			)
		);
	}
</script>

<Loading {loading}>
	<TableView
		columns={Object.entries(columns).map(([key, column]) => ({
			field: key.toString(),
			title: column.field.label,
			width: column.width ? (column.width > 1 ? column.width : `${column.width * 100}%`) : undefined,
			formatter: (cell) => column.field.format(cell.getValue())
		}))}
		{data}
		{pages}
		{pageSize}
		{onSelect}
		{onDataRequest}
	></TableView>
</Loading>
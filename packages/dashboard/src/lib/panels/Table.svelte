<script module lang="ts">
	import type { DataField } from '$lib/QueryBuilder';
	import type { PanelContext } from '$lib/DashboardManager.svelte';
	import Loading from '$lib/views/Loading.svelte';

	export type Columns<R extends unknown[]> = {
		[K in keyof R]: {
			field: DataField<R[K]>;
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
	import { DataFieldFilterMap, InFilter, number_metric, RangeFilter } from '$lib/QueryBuilder';

	let { columns, ctx }: Props<R> = $props();

	const pageSize = 200;
	let data: R[] = $state([]);
	let pages: number = $state(1);
	let loading: boolean = $state(false);

	let orderBy: [DataField<unknown>, 'asc' | 'desc'][] = [];

	function clause(fields: DataField<unknown>[]): string | undefined {
		const fieldsSql = fields.map((f) => f.toString());
		return fields.length === 1 ? fieldsSql[0] : `(${fieldsSql.join(', ')})`;
	}

	ctx.onUpdate(async () => {
		if (!ctx.isActive) {
			loading = true;
			const distinctFields = columns
				.map((c) => c.field)
				.filter((f) => !f.aggregation)
			const countResult = distinctFields.length === 0 ? [] : await ctx.fetch([number_metric(() => `count(distinct ${clause(distinctFields)})`)]);
			const count = countResult.length > 0 ? countResult[0][0] : 0;
			pages = Math.ceil(count / pageSize);
			data = await ctx
				.fetch<R>(
					//  @ts-expect-error i dont know
					columns.map((c) => c.field),
					{ limit: pageSize, orderBy }
				);
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
			.then((data) => ({ last_page: pages, data }));
	}

	function onSelect(valueMap: Map<number, unknown[]>) {
		ctx.filter(
			new DataFieldFilterMap(
				Array.from(
					valueMap.entries().map(([col, values]) => {
						if (values.every((v) => typeof v === 'number'))
							return new RangeFilter(columns[col].field, Math.min(...values), Math.max(...values));
						return new InFilter(columns[col].field, values);
					})
				)
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
			formatter: (cell) => column.field.valueAsString(cell.getValue())
		}))}
		{data}
		{pages}
		{pageSize}
		{onSelect}
		{onDataRequest}
	></TableView>
</Loading>
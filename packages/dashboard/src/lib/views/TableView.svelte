<script lang="ts">
	import { TabulatorFull, type ColumnDefinition } from 'tabulator-tables';
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		columns: ColumnDefinition[];
		data: unknown[][];
		pageSize: number;
		pages: number;
		onSelect?: (values: Map<number, unknown[]>) => void;
		onDataRequest?: (opts: {
			page: number;
			sort: { field: string; dir: 'asc' | 'desc' }[];
		}) => Promise<{ last_page: number; data: unknown[][] }>;
	}

	let {
		columns,
		data,
		pageSize,
		pages,
		onSelect = undefined,
		onDataRequest = undefined
	}: Props = $props();

	let tableElement: HTMLDivElement;
	let table: TabulatorFull | undefined = $state(undefined);

	$effect(() => {
		if (data.length > 0) table?.setData('trigger ajax');
		else table?.setData([]);
	});

	function request(page: number, sort: { field: string; dir: 'asc' | 'desc' }[]) {
		if ((page === 1 && sort.length === 0) || onDataRequest === undefined)
			return new Promise((r) => r({ last_page: pages, data }));
		return onDataRequest({ page, sort });
	}

	function delayed(delay: number, cb: () => void) {
		let timeout: number | undefined = undefined;
		return () => {
			if (timeout !== undefined) clearTimeout(timeout);
			// @ts-expect-error setTimeout return type not defined as number
			timeout = setTimeout(cb, delay);
		};
	}

	function onRangeChanged() {
		const map = table?.getRanges().reduce((map, range) => {
			range
				.getColumns()
				.map((col) => table?.getColumns().indexOf(col))
				.filter((col) => col !== undefined)
				.forEach((col) => {
					const values = (range.getData() as unknown[][]).map((row) => row[col]);
					if (!map.has(col)) map.set(col, values);
					else map.get(col)?.push(...values);
				});
			return map;
		}, new Map<number, unknown[]>());
		if (map) onSelect?.(map);
	}

	onMount(() => {
		const uninitializedTable = new TabulatorFull(tableElement, {
			data,
			columns,
			layout: 'fitColumns',
			layoutColumnsOnNewData: true,
			height: '100%',
			selectableRange: true,
			selectableRangeClearCells: true,
			selectableRangeInitializeDefault: false,
			sortMode: 'remote',
			ajaxRequestFunc: (
				url,
				req,
				opts: { page: number; size: number; sort: { field: string; dir: 'asc' | 'desc' }[] }
			) => request(opts.page, opts.sort),
			progressiveLoad: 'scroll',
			paginationSize: pageSize,
			dataLoader: false
		});
		uninitializedTable.on('rangeChanged', delayed(100, onRangeChanged));
		uninitializedTable.on('tableBuilt', () => {
			table = uninitializedTable;
		});
	});
	onDestroy(() => table?.destroy());
</script>

<div bind:this={tableElement}></div>

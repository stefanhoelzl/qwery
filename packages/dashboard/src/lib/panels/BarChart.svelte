<script lang="ts">
	import * as echarts from 'echarts';
	import { onMount } from 'svelte';
	import type { PanelContext } from '$lib/DashboardManager.svelte';
	import type { DataField } from '$lib/QueryBuilder';

	interface Props {
		ctx: PanelContext;
		x: DataField<unknown>;
		y: DataField<unknown>;
	}
	const { ctx, x, y }: Props = $props();

	let chartElement: HTMLDivElement;
	let chart: echarts.ECharts;

	ctx.onUpdate(() => {
		ctx.fetch({ x, y }).then((data) => {
			chart.setOption({
				xAxis: {
					data: data.map((r) => r.x)
				},
				series: [
					{
						type: 'bar',
						data: data.map((r) => r.y)
					}
				]
			});
		});
	});

	onMount(() => {
		chart = echarts.init(chartElement);
		chart.setOption({
			xAxis: { data: [] },
			yAxis: {},
			tooltip: {},
			series: [],
			grid: {
				top: 10,
				bottom: 20,
				left: 60,
				right: 10
			}
		});

		const resizeObserver = new ResizeObserver(() => chart.resize());
		resizeObserver.observe(chartElement);
	});
</script>

<div bind:this={chartElement} class="bar"></div>

<style>
	.bar {
		background-color: white;
		height: 100%;
		width: 100%;
	}
</style>

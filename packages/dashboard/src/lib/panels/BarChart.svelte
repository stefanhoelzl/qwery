<script lang="ts">
	import * as echarts from 'echarts/core';
  import { BarChart } from 'echarts/charts';
  import { GridComponent, TooltipComponent } from "echarts/components";
  import { CanvasRenderer } from 'echarts/renderers';
	import { onMount } from 'svelte';
	import type { PanelContext } from '$lib/DashboardManager.svelte';
	import type { DataField } from '$lib/QueryBuilder';
  import Loading from '$lib/views/Loading.svelte';

  echarts.use([
    BarChart,
    CanvasRenderer,
    GridComponent,
    TooltipComponent,
  ]);

	interface Props {
		ctx: PanelContext;
		x: DataField<unknown>;
		y: DataField<unknown>;
    orderBy?: [DataField<unknown>, "asc" | "desc"][];
    ymax?: number;
    log?: number;
	}
	const { ctx, x, y, orderBy, log, ymax }: Props = $props();

  let loading = $state(false);

	let chartElement: HTMLDivElement;
	let chart: echarts.ECharts;

	ctx.onUpdate(async () => {
    loading = true;
		const [_count, data] = await ctx.fetch({ x, y }, {orderBy})
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
    loading = false;
	});

	onMount(() => {
		chart = echarts.init(chartElement);
		chart.setOption({
			xAxis: { data: [] },
			yAxis: {
        type: log ? "log" : undefined,
        logBase: log ? log : undefined,
        min: log ? 1 : 0,
        max: ymax ? ymax: "dataMax",
      },
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

<Loading {loading}>
  <div bind:this={chartElement} class="bar"></div>
</Loading>

<style>
	.bar {
		background-color: white;
		height: 100%;
		width: 100%;
	}
</style>

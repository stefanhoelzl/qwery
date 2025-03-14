<script lang="ts">
  import { TabulatorFull, type ColumnDefinition } from "tabulator-tables";
  import { onMount, onDestroy } from "svelte";

  interface Props {
    columns: ColumnDefinition[];
    data: unknown[][];
    onSelect?: (values: Map<number, unknown[]>) => void;
  }

  let { columns, data, onSelect = undefined }: Props = $props();

  let tableElement: HTMLDivElement;
  let table: TabulatorFull | undefined = $state(undefined);

  $effect(() => {
    table?.setData(data);
  });

  function delayed(delay: number, cb: () => void) {
    let timeout: number | undefined = undefined;
    return () => {
      if (timeout !== undefined) clearTimeout(timeout);
      // @ts-expect-error setTimeout return type not defined as number
      timeout = setTimeout(cb, delay);
    };
  }

  function onRangeChanged() {
    tableElement.focus();
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
      layout: "fitColumns",
      layoutColumnsOnNewData: true,
      height: "100%",
      selectableRange: true,
      selectableRangeClearCells: true,
      selectableRangeInitializeDefault: false
    });
    uninitializedTable.on("rangeChanged", delayed(100, onRangeChanged));
    uninitializedTable.on("tableBuilt", () => {
      table = uninitializedTable;
    });
  });
  onDestroy(() => table?.destroy());
</script>

<div bind:this={tableElement}></div>

<script lang="ts">
  import { TabulatorFull } from "tabulator-tables";
  import { onMount } from "svelte";

  let tableElement: HTMLDivElement;

  onMount(() => {
    new TabulatorFull(tableElement, {
      data: Array.apply(null, Array(20)).map(() => ({
        c0: "a bit longer text to resize cols must be longer sooooooooooooooooooooooolong",
        c1: 1
      })),
      autoColumnsDefinitions: (columnDefinitions) => {
        return (
          columnDefinitions?.map((col) => {
            col.widthGrow = col.field === "c0" ? 5 : 1;
            return col;
          }) || []
        );
      },
      autoColumns: true,
      selectableRange: true,
      selectableRangeClearCells: true,
      selectableRangeInitializeDefault: false,
      maxHeight: "100%",
      layout: "fitColumns",
      layoutColumnsOnNewData: true
    });
  });
</script>

<div bind:this={tableElement}></div>

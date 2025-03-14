<script module lang="ts">
  import type { DataField } from "$lib/QueryBuilder";
  import type { PanelContext } from "$lib/DashboardManager.svelte";

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
  import TableView from "$lib/views/TableView.svelte";
  import { DataFieldFilterMap, InFilter, RangeFilter } from "$lib/QueryBuilder";

  let { columns, ctx }: Props<R> = $props();

  let data: R[] = $state([]);

  function refreshIfInactive() {
    if (!ctx.isActive)
      //  @ts-expect-error i dont know
      ctx.fetch<R>(columns.map((c) => c.field)).then((updatedData) => {
        data = updatedData;
      });
  }

  $effect(() => refreshIfInactive());
  ctx.onUpdate(() => refreshIfInactive());

  function onSelect(valueMap: Map<number, unknown[]>) {
    ctx.filter(
      new DataFieldFilterMap(
        Array.from(
          valueMap.entries().map(([col, values]) => {
            if (values.every((v) => typeof v === "number"))
              return new RangeFilter(columns[col].field, Math.min(...values), Math.max(...values));
            return new InFilter(columns[col].field, values);
          })
        )
      )
    );
  }
</script>

<TableView
  columns={Object.entries(columns).map(([key, column]) => ({
    field: key.toString(),
    title: column.field.label,
    width: column.width ? (column.width > 1 ? column.width : `${column.width * 100}%`) : undefined,
    formatter: (cell) => column.field.valueAsString(cell.getValue())
  }))}
  {data}
  {onSelect}
></TableView>

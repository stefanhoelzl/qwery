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
  import { DataFieldFilterMap, InFilter, NumberMetric, RangeFilter } from "$lib/QueryBuilder";

  let { columns, ctx }: Props<R> = $props();

  const pageSize = 200;
  let data: R[] = $state([]);
  let pages: number = $state(1);

  ctx.onUpdate(async () => {
    if (!ctx.isActive) {
      const distinctFields = columns
        .map((c) => c.field)
        .filter((f) => !f.aggregation)
        .map((f) => f.sql);
      const distinctClause =
        distinctFields.length === 1 ? distinctFields[0] : `(${distinctFields.join(", ")})`;
      const countResult = await ctx.fetch([new NumberMetric(`count(distinct ${distinctClause})`)]);
      pages = Math.ceil(countResult[0][0] / pageSize);
      ctx
        .fetch<R>(
          //  @ts-expect-error i dont know
          columns.map((c) => c.field),
          { limit: pageSize }
        )
        .then((updatedData) => {
          data = updatedData;
        });
    }
  });

  function onDataRequest(opts: { page: number; sort: { field: string; dir: "asc" | "desc" }[] }) {
    return ctx
      .fetch<R>(
        //  @ts-expect-error i dont know
        columns.map((c) => c.field),
        { limit: pageSize, offset: (opts.page - 1) * pageSize }
      )
      .then((data) => ({ last_page: pages, data }));
  }

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
  {pages}
  {pageSize}
  {onSelect}
  {onDataRequest}
></TableView>

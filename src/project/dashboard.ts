import Table from "$lib/panels/Table.svelte";
import { StringDimension, NumberMetric, NotNullFilter } from "$lib/QueryBuilder";
import { grid, panel } from "$lib/panels";

const article_number = new StringDimension("prodstep_articlenumber");
const stage = new StringDimension("prodstep_stage");
const count = new NumberMetric("count()", { label: "#" });

export const dashboard = grid({
  props: { cols: 12, rows: 12 },
  content: [
    panel({
      component: Table,
      props: { columns: [{ field: article_number }, { field: count, width: 100 }] },
      filter: new NotNullFilter(article_number),
      layout: { row: 0, "row-span": 12, col: 0, "col-span": 3 }
    }),
    panel({
      component: Table,
      props: { columns: [{ field: stage }, { field: count, width: 100 }] },
      filter: new NotNullFilter(stage),
      layout: { row: 0, "row-span": 6, col: 3, "col-span": 2 }
    })
  ],
  layout: undefined
});

// @ts-nocheck

import {
  notNull,
  Table,
  BarChart,
  grid,
  panel,
  tabs,
  number,
  table,
  metric,
  type Field,
  type FieldFactories,
  type DatabaseSchema
} from "@qweri/dashboard";
import { Schema } from "./schema";

export default function dashboard(
  db: Schema,
  ctx: FieldFactories,
  defineSchema: (_: DatabaseSchema) => void
) {
  defineSchema(table("expeditions"));

  db.expeditions.year.configure({
    label: "Year",
    formatter: (value) => (value ? value.toString() : "")
  });
  db.expeditions.season.configure({ label: "Season" });
  db.expeditions.nation.configure({ label: "Nationality" });
  db.expeditions.route1.configure({ label: "Route" });
  db.expeditions.leaders.configure({ label: "Leaders" });
  db.expeditions.success1.configure({
    label: "Success",
    formatter: (value: boolean | null) =>
      value === null ? "unknown" : value ? "success" : "no success"
  });
  db.expeditions.sponsor.configure({ label: "Sponsor" });
  db.expeditions.smttime.configure({ label: "Summit Time" });
  db.expeditions.termreason.configure({ label: "Reason for termination" });
  db.expeditions.highpoint.configure({ label: "Highpoint" });
  db.expeditions.achievment.configure({ label: "Achievement" });
  db.expeditions.agency.configure({ label: "Agency" });

  const count_star = ctx
    .computed("count_star", metric`count(*)`, number())
    .configure({ label: "Count" });
  const success_rate = ctx
    .computed(
      "success_rate",
      metric`sum(CASE WHEN ${db.expeditions.success1} THEN 1 ELSE 0 END) / ${count_star}`,
      number()
    )
    .configure({
      label: "Success Rate",
      formatter: (value: number | null) => (value === null ? "" : `${(value * 100).toFixed(2)} %`)
    });
  const max_highpoint = ctx
    .computed("max_highpoint", metric`max(${db.expeditions.highpoint})`, number())
    .configure({ label: "max. Highpoint" });

  const expeditions_panel = panel({
    component: Table,
    props: {
      columns: [
        { field: db.expeditions.year, width: 100 },
        { field: db.expeditions.season, width: 100 },
        { field: db.expeditions.smttime, width: 100 },
        { field: db.expeditions.route1 },
        { field: db.expeditions.leaders },
        { field: db.expeditions.highpoint, width: 100 },
        { field: db.expeditions.success1, width: 100 },
        { field: db.expeditions.sponsor },
        { field: db.expeditions.agency },
        { field: db.expeditions.termreason },
        { field: db.expeditions.achievment }
      ]
    }
  });

  function dimension_panel(dimension: Field<any>) {
    return panel({
      component: Table,
      props: {
        columns: [
          { field: dimension },
          { field: count_star },
          { field: max_highpoint },
          { field: success_rate }
        ]
      }
    });
  }
  const highpoint_chart = panel({
    component: BarChart,
    props: {
      x: db.expeditions.year,
      y: max_highpoint
    },
    filter: notNull(db.expeditions.highpoint)
  });

  return {
    panel: grid([
      {
        panel: expeditions_panel,
        layout: { row: 0, "row-span": 4, col: 0, "col-span": 24 }
      },
      {
        panel: tabs({
          Year: dimension_panel(db.expeditions.year),
          Season: dimension_panel(db.expeditions.season),
          Achievment: dimension_panel(db.expeditions.achievment),
          Route: dimension_panel(db.expeditions.route1),
          Agency: dimension_panel(db.expeditions.agency),
          "Termination Reason": dimension_panel(db.expeditions.termreason),
          Sponsor: dimension_panel(db.expeditions.sponsor),
          Leader: dimension_panel(db.expeditions.leaders)
        }),
        layout: { row: 4, "row-span": 4, col: 12, "col-span": 12 }
      },
      { panel: highpoint_chart, layout: { row: 4, "row-span": 4, col: 0, "col-span": 12 } }
    ])
  };
}

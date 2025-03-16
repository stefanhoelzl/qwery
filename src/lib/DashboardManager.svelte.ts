import { FilterManager } from "$lib/FilterManager";
import {
  DataField,
  DataFieldFilter,
  type DataFieldFilterMap,
  type AggregationQueryOptions
} from "$lib/QueryBuilder";
import { type Filter, buildAggregationQuery } from "$lib/QueryBuilder";

class FetchQueryEngine {
  async query<R>(opts: AggregationQueryOptions<R>): Promise<R[]> {
    const body = buildAggregationQuery(opts);
    const response = await fetch("/api/query", {
      method: "POST",
      body: body.json(),
      headers: { "content-type": "application/json" }
    });

    const json = await response.json();
    return json.map((r: unknown[]) =>
      Object.keys(opts.select)
        .map((key, idx) => [key, idx] as const)
        .reduce((prev, [key, idx]) => ({ ...prev, [key]: r[idx] }), {})
    );
  }
}

type FetchOpts = {
  limit?: number;
  offset?: number;
  orderBy?: [DataField<unknown>, "asc" | "desc"][];
};

export interface PanelContext {
  isActive: boolean;
  fetch<R>(fields: { [Key in keyof R]: DataField<R[Key]> }, opts?: FetchOpts): Promise<R[]>;
  filter<V>(filterMap: DataFieldFilterMap<V>): void;
  dropFilter(dataField: DataField<unknown>): void;
  onUpdate(cb: () => void): void;
  drop(): void;
}

export class DashboardManager {
  public filterManager = new FilterManager();
  private updateHandler: Map<number, (() => void)[]> = new Map();
  private queryEngine: FetchQueryEngine = new FetchQueryEngine();

  public filters: DataFieldFilter<unknown>[] = $state([]);
  private contexts: PanelContext[] = [];

  constructor(private table: string) {
    this.filterManager.onUpdate(() => {
      this.filters = this.filterManager.filters;
      this.triggerUpdates();
    });
  }

  public triggerUpdates() {
    this.updateHandler.values().forEach((cbs) => cbs.forEach((cb) => cb()));
  }

  public createPanel(opts?: { filter?: Filter }): PanelContext {
    const filterCtx = this.filterManager.createContext();
    const id = Math.max(0, ...Array.from(this.updateHandler.keys())) + 1;
    const filters = opts?.filter ? [opts.filter] : [];
    const isActive = false;

    this.updateHandler.set(id, []);

    const ctx = $state({
      isActive,
      fetch: <R>(fields: { [Key in keyof R]: DataField<R[Key]> }, opts?: FetchOpts) =>
        this.queryEngine.query({
          table: this.table,
          select: fields,
          filters: [...filters, ...this.filterManager.filters],
          ...opts
        }),
      filter: (filterMap: DataFieldFilterMap) => {
        this.contexts.forEach((context) => {
          context.isActive = context === ctx;
        });
        filterCtx.filter(filterMap);
      },
      dropFilter: (dataField: DataField<unknown>) => {
        this.contexts.forEach((context) => {
          context.isActive = false;
        });
        filterCtx.dropFilter(dataField);
      },
      onUpdate: (cb: () => void) => this.updateHandler.get(id)?.push(() => cb()),
      drop: () => {
        this.contexts.forEach((context) => {
          context.isActive = false;
        });
        this.updateHandler.delete(id);
      }
    });
    this.contexts.push(ctx);
    return ctx;
  }
}

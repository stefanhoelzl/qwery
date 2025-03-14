import { FilterManager } from "$lib/FilterManager";
import { DataField, DataFieldFilter, type DataFieldFilterMap } from "$lib/QueryBuilder";
import { type Filter, buildAggregationQuery } from "$lib/QueryBuilder";

class FetchQueryEngine {
  async query<R>(record: { [Key in keyof R]: DataField<R[Key]> }, filters: Filter[]): Promise<R[]> {
    const body = buildAggregationQuery({ table: "data", select: record, filters });
    const response = await fetch("/api/query", {
      method: "POST",
      body: body.json(),
      headers: { "content-type": "application/json" }
    });

    const json = await response.json();
    return json.map((r: R) =>
      Object.keys(record).reduce((prev, idx) => ({ ...prev, [idx]: r[idx] }), {})
    );
  }
}

export interface PanelContext {
  isActive: boolean;
  fetch<R>(fields: { [Key in keyof R]: DataField<R[Key]> }): Promise<R[]>;
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

  constructor() {
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
      fetch: <R>(fields: { [Key in keyof R]: DataField<R[Key]> }) =>
        this.queryEngine.query(fields, [...filters, ...this.filterManager.filters]),
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

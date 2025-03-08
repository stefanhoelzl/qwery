import {
  ReplacingDataFieldFilterMap,
  type DataField,
  type DataFieldFilterMap,
  type Filter
} from "$lib/QueryBuilder";

export interface FilterContext {
  filter(filterMap: DataFieldFilterMap): void;
  dropFilter(dataField: DataField<unknown>): void;
}

type UpdateCallback = () => void;

export class FilterManager extends EventTarget {
  private confirmedFilterMap = new ReplacingDataFieldFilterMap();
  private activeFilterMap = new ReplacingDataFieldFilterMap();
  private activeContext?: FilterContext = undefined;
  private updateCallbacks: UpdateCallback[] = [];

  constructor(private readonly baseFilters: Filter[] = []) {
    super();
  }

  newFilterContext(): FilterContext {
    const ctx = {
      filter: (filterMap: DataFieldFilterMap) => {
        if (ctx === this.activeContext) {
          this.activeFilterMap = new ReplacingDataFieldFilterMap(this.confirmedFilterMap.filters);
        } else {
          this.confirmedFilterMap = new ReplacingDataFieldFilterMap(this.activeFilterMap.filters);
        }
        this.activeContext = ctx;
        filterMap.filters.forEach((f) => this.activeFilterMap.replace(f));
        this.updateCallbacks.forEach((cb) => cb());
      },
      dropFilter: (dataField: DataField<unknown>) => {
        this.activeFilterMap.delete(dataField);
        this.updateCallbacks.forEach((cb) => cb());
      }
    };
    return ctx;
  }

  onUpdate(cb: UpdateCallback) {
    this.updateCallbacks.push(cb);
  }

  get filters(): Filter[] {
    return [...this.baseFilters, ...this.activeFilterMap.filters];
  }
}

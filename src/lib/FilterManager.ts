import { DataFieldFilterMap, type DataField, DataFieldFilter } from "$lib/QueryBuilder";

export interface FilterContext {
  filter(filterMap: DataFieldFilterMap): void;
  dropFilter(dataField: DataField<unknown>): void;
}

type UpdateCallback = () => void;

export class FilterManager {
  private confirmedFilterMap = new DataFieldFilterMap();
  private activeFilterMap = new DataFieldFilterMap();
  private activeContext?: FilterContext = undefined;
  private updateCallbacks: UpdateCallback[] = [];

  createContext(): FilterContext {
    const ctx = {
      filter: (filterMap: DataFieldFilterMap) => {
        if (ctx === this.activeContext) {
          this.activeFilterMap = new DataFieldFilterMap(this.confirmedFilterMap.filters);
        } else {
          this.confirmedFilterMap = new DataFieldFilterMap(this.activeFilterMap.filters);
        }
        this.activeContext = ctx;
        filterMap.filters.forEach((f) => this.activeFilterMap.replace(f));
        this.updateCallbacks.forEach((cb) => cb());
      },
      dropFilter: (dataField: DataField<unknown>) => {
        this.dropFilter(dataField);
      }
    };
    return ctx;
  }

  dropFilter(dataField: DataField<unknown>) {
    this.activeFilterMap.delete(dataField);
    this.updateCallbacks.forEach((cb) => cb());
  }

  onUpdate(cb: UpdateCallback) {
    this.updateCallbacks.push(cb);
  }

  get filters(): DataFieldFilter<unknown>[] {
    return this.activeFilterMap.filters;
  }
}

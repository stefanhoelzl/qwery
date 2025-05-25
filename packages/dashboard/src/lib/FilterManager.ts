import { type Field, type Filter } from "$lib/QueryBuilder";

export interface FilterContext {
  filter(filters: Filter[]): void;
  dropFilter(field: Field<unknown, unknown>): void;
}

type UpdateCallback = () => void;

export class FilterManager {
  private confirmedFilters: Filter[] = [];
  private activeFilters: Filter[] = [];
  private activeContext?: FilterContext = undefined;
  private updateCallbacks: UpdateCallback[] = [];

  createContext(): FilterContext {
    const ctx = {
      filter: (filters: Filter[]) => {
        if (ctx === this.activeContext) {
          this.activeFilters = [...this.confirmedFilters];
        } else {
          this.confirmedFilters = [...this.activeFilters];
        }
        this.activeContext = ctx;
        this.activeFilters = this.activeFilters.filter((af) =>
          filters.every((f) => f.field.id !== af.field.id)
        );
        this.activeFilters = [...this.activeFilters, ...filters];
        this.updateCallbacks.forEach((cb) => cb());
      },
      dropFilter: (field: Field<unknown, unknown>) => {
        this.dropFilter(field);
      }
    };
    return ctx;
  }

  dropFilter(field: Field<unknown, unknown>) {
    this.activeFilters = this.activeFilters.filter((af) => field.id !== af.field.id);
    this.updateCallbacks.forEach((cb) => cb());
  }

  onUpdate(cb: UpdateCallback) {
    this.updateCallbacks.push(cb);
  }

  get filters(): Filter[] {
    return this.activeFilters;
  }
}

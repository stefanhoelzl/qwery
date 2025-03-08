import { expect, test, vi } from "vitest";
import {
  DataFieldFilterMap,
  DataFieldFilter,
  StringDimension,
  type DataField
} from "$lib/QueryBuilder";
import { FilterManager } from "$lib/FilterManager";

class MockFilter extends DataFieldFilter<unknown> {
  private static nextId = 0;
  private readonly id: number;

  constructor(dataField: DataField<unknown>) {
    super(dataField);
    this.id = MockFilter.nextId;
    MockFilter.nextId += 1;
  }
  get sql() {
    return `MockFilter-${this.id}`;
  }
}

class MockFilterMap extends DataFieldFilterMap {
  constructor(filter?: MockFilter) {
    super();
    if (filter !== undefined) this.map.set(filter.dataField.uniqueKey, filter);
  }
}

function mockDataField(opts?: { sql?: string }) {
  return new StringDimension({ sql: opts?.sql || "" }) as DataField<unknown>;
}

function mockFilter(opts?: { dataField?: DataField<unknown> }) {
  return new MockFilter(opts?.dataField || mockDataField());
}

function mockFilterMap(filter?: MockFilter) {
  return new MockFilterMap(filter || mockFilter());
}

test("filters are empty after init", () => {
  const fm = new FilterManager();
  expect(fm.filters).toHaveLength(0);
});

test("filters contain base filter", () => {
  const filter = mockFilter();
  const fm = new FilterManager([filter]);
  expect(fm.filters).toEqual([filter]);
});

test("filters contain context filter", () => {
  const filter = mockFilter();
  const fm = new FilterManager();
  fm.newFilterContext().filter(mockFilterMap(filter));
  expect(fm.filters).toEqual([filter]);
});

test("context filter replaces existing filter for same data field", () => {
  const filter = mockFilter();
  const fm = new FilterManager();
  fm.newFilterContext().filter(mockFilterMap());
  fm.newFilterContext().filter(mockFilterMap(filter));
  expect(fm.filters).toEqual([filter]);
});

test("context filter keeps existing filter for different data field", () => {
  const filter0 = mockFilter({ dataField: mockDataField({ sql: "0" }) });
  const filter1 = mockFilter({ dataField: mockDataField({ sql: "1" }) });
  const fm = new FilterManager();
  fm.newFilterContext().filter(mockFilterMap(filter0));
  fm.newFilterContext().filter(mockFilterMap(filter1));
  expect(fm.filters).toEqual([filter0, filter1]);
});

test("context can remove filter for data fields", () => {
  const dataField = mockDataField();
  const fm = new FilterManager();
  fm.newFilterContext().filter(mockFilterMap(mockFilter({ dataField })));
  fm.newFilterContext().dropFilter(dataField);
  expect(fm.filters).toHaveLength(0);
});

test("when same context filters multiple times, the previous filter gets deleted", () => {
  const filter0 = mockFilter({ dataField: mockDataField({ sql: "0" }) });
  const filter1 = mockFilter({ dataField: mockDataField({ sql: "1" }) });
  const fm = new FilterManager();
  const ctx = fm.newFilterContext();
  ctx.filter(mockFilterMap(filter0));
  ctx.filter(mockFilterMap(filter1));
  expect(fm.filters).toEqual([filter1]);
});

test("fires event on filter change", () => {
  const cb = vi.fn();
  const fm = new FilterManager();
  fm.onUpdate(cb);
  fm.newFilterContext().filter(mockFilterMap());
  expect(cb).toHaveBeenCalledExactlyOnceWith();
});

test("fires event on filter removal", () => {
  const cb = vi.fn();
  const filter = mockFilter();
  const fm = new FilterManager();
  fm.newFilterContext().filter(mockFilterMap(filter));
  fm.onUpdate(cb);
  fm.newFilterContext().dropFilter(filter.dataField);
  expect(cb).toHaveBeenCalledExactlyOnceWith();
});

import { expect, test, vi } from "vitest";
import { Field, string } from "$lib/QueryBuilder";
import { FilterManager } from "$lib/FilterManager";

let nextDataFieldId = 0;
function mockField(maybeId?: string) {
  const id = maybeId || (nextDataFieldId++).toString();
  return new Field(id, id, [], false, string()) as Field<unknown, unknown>;
}

function mockFilter(opts?: { field?: Field<unknown, unknown> }) {
  return {
    field: opts?.field || mockField(),
    sql: "MockFilter"
  };
}

test("filters are empty after init", () => {
  const fm = new FilterManager();
  expect(fm.filters).toHaveLength(0);
});

test("filters contain context filter", () => {
  const filter = mockFilter();
  const fm = new FilterManager();
  fm.createContext().filter([filter]);
  expect(fm.filters).toEqual([filter]);
});

test("context filter replaces existing filter for same data field", () => {
  const firstFilter = mockFilter({ field: mockField("id") });
  const secondFilter = mockFilter({ field: mockField("id") });
  const fm = new FilterManager();
  fm.createContext().filter([firstFilter]);
  fm.createContext().filter([secondFilter]);
  expect(fm.filters).toEqual([secondFilter]);
});

test("context filter keeps existing filter for different data field", () => {
  const filter0 = mockFilter({ field: mockField() });
  const filter1 = mockFilter({ field: mockField() });
  const fm = new FilterManager();
  fm.createContext().filter([filter0]);
  fm.createContext().filter([filter1]);
  expect(fm.filters).toEqual([filter0, filter1]);
});

test("context can remove filter for data fields", () => {
  const field = mockField();
  const fm = new FilterManager();
  fm.createContext().filter([mockFilter({ field })]);
  fm.createContext().dropFilter(field);
  expect(fm.filters).toHaveLength(0);
});

test("when same context filters multiple times, the previous filter gets deleted", () => {
  const filter0 = mockFilter({ field: mockField() });
  const filter1 = mockFilter({ field: mockField() });
  const fm = new FilterManager();
  const ctx = fm.createContext();
  ctx.filter([filter0]);
  ctx.filter([filter1]);
  expect(fm.filters).toEqual([filter1]);
});

test("fires event on filter change", () => {
  const cb = vi.fn();
  const fm = new FilterManager();
  fm.onUpdate(cb);
  fm.createContext().filter([]);
  expect(cb).toHaveBeenCalledExactlyOnceWith();
});

test("fires event on filter removal", () => {
  const cb = vi.fn();
  const filter = mockFilter();
  const fm = new FilterManager();
  fm.createContext().filter([filter]);
  fm.onUpdate(cb);
  fm.createContext().dropFilter(filter.field);
  expect(cb).toHaveBeenCalledExactlyOnceWith();
});

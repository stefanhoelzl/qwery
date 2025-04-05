import { expect, test, vi } from 'vitest';
import {
	DataFieldFilterMap,
	DataFieldFilter,
	StringDimension,
	type DataField
} from '$lib/QueryBuilder';
import { FilterManager } from '$lib/FilterManager';

class MockFilter extends DataFieldFilter<unknown> {
	get sql() {
		return 'MockFilter';
	}
}

class MockFilterMap extends DataFieldFilterMap {
	constructor(filter?: MockFilter) {
		super();
		if (filter !== undefined) this.map.set(filter.dataField.id, filter);
	}
}

let nextDataFieldId = 0;
function mockDataField(id?: string) {
	return new StringDimension(id || (nextDataFieldId++).toString()) as DataField<unknown>;
}

function mockFilter(opts?: { dataField?: DataField<unknown> }) {
	return new MockFilter(opts?.dataField || mockDataField());
}

function mockFilterMap(filter?: MockFilter) {
	return new MockFilterMap(filter || mockFilter());
}

test('filters are empty after init', () => {
	const fm = new FilterManager();
	expect(fm.filters).toHaveLength(0);
});

test('filters contain context filter', () => {
	const filter = mockFilter();
	const fm = new FilterManager();
	fm.createContext().filter(mockFilterMap(filter));
	expect(fm.filters).toEqual([filter]);
});

test('context filter replaces existing filter for same data field', () => {
	const firstFilter = mockFilter({ dataField: mockDataField('id') });
	const secondFilter = mockFilter({ dataField: mockDataField('id') });
	const fm = new FilterManager();
	fm.createContext().filter(mockFilterMap(firstFilter));
	fm.createContext().filter(mockFilterMap(secondFilter));
	expect(fm.filters).toEqual([secondFilter]);
});

test('context filter keeps existing filter for different data field', () => {
	const filter0 = mockFilter({ dataField: mockDataField() });
	const filter1 = mockFilter({ dataField: mockDataField() });
	const fm = new FilterManager();
	fm.createContext().filter(mockFilterMap(filter0));
	fm.createContext().filter(mockFilterMap(filter1));
	expect(fm.filters).toEqual([filter0, filter1]);
});

test('context can remove filter for data fields', () => {
	const dataField = mockDataField();
	const fm = new FilterManager();
	fm.createContext().filter(mockFilterMap(mockFilter({ dataField })));
	fm.createContext().dropFilter(dataField);
	expect(fm.filters).toHaveLength(0);
});

test('when same context filters multiple times, the previous filter gets deleted', () => {
	const filter0 = mockFilter({ dataField: mockDataField() });
	const filter1 = mockFilter({ dataField: mockDataField() });
	const fm = new FilterManager();
	const ctx = fm.createContext();
	ctx.filter(mockFilterMap(filter0));
	ctx.filter(mockFilterMap(filter1));
	expect(fm.filters).toEqual([filter1]);
});

test('fires event on filter change', () => {
	const cb = vi.fn();
	const fm = new FilterManager();
	fm.onUpdate(cb);
	fm.createContext().filter(mockFilterMap());
	expect(cb).toHaveBeenCalledExactlyOnceWith();
});

test('fires event on filter removal', () => {
	const cb = vi.fn();
	const filter = mockFilter();
	const fm = new FilterManager();
	fm.createContext().filter(mockFilterMap(filter));
	fm.onUpdate(cb);
	fm.createContext().dropFilter(filter.dataField);
	expect(cb).toHaveBeenCalledExactlyOnceWith();
});

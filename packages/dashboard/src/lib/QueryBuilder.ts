export type DataFieldOpts<V> = {
	sql?: string;
	label?: string;
	formatter?: (value: V | unknown) => string;
	nullable?: boolean;
};

export abstract class DataField<D> {
	constructor(
		public readonly id: string,
		protected opts?: DataFieldOpts<D>
	) {}

	abstract get aggregation(): boolean;
	abstract valueAsSql(value: D): string;

	get sql(): string {
		return this.opts?.sql || this.id;
	}

	get label(): string {
		return this.opts?.label || this.id;
	}

	valueAsString(value: D): string {
		return value === null || value === undefined
			? '<null>'
			: this.opts?.formatter?.(value) || value.toString();
	}
}

export abstract class Dimension<D> extends DataField<D> {
	get aggregation() {
		return false;
	}
}

export abstract class Metric<D> extends DataField<D> {
	get aggregation() {
		return true;
	}
}

export abstract class Filter {
	abstract get aggregation(): boolean;
	abstract get sql(): string;
}

export abstract class DataFieldFilter<V> extends Filter {
	constructor(public dataField: DataField<V>) {
		super();
	}

	get aggregation() {
		return this.dataField.aggregation;
	}
}

export class InFilter<V> extends DataFieldFilter<V> {
	constructor(
		dataField: DataField<V>,
		private values: V[] = []
	) {
		super(dataField);
	}

	addValues(values: V[]) {
		this.values = [...this.values, ...values];
	}

	get sql() {
		return `${this.dataField.sql} IN (${this.values.map((v) => this.dataField.valueAsSql(v)).join(', ')})`;
	}
}

export class RangeFilter extends DataFieldFilter<number> {
	constructor(
		dataField: DataField<number>,
		public readonly min: number,
		public readonly max: number
	) {
		super(dataField);
	}

	get sql() {
		return `${this.dataField.sql} BETWEEN ${this.min} AND ${this.max}`;
	}
}

export class NotNullFilter<V> extends DataFieldFilter<V> {
	get sql() {
		return `${this.dataField.sql} IS NOT NULL`;
	}
}

export class StringDimension extends Dimension<string> {
	valueAsSql(value: string): string {
		return `'${value.replaceAll("'", "''")}'`;
	}
}

export class StringMetric extends Metric<string> {
	valueAsSql(value: string): string {
		return `'${value.replaceAll("'", "''")}'`;
	}
}

export class NumberDimension extends Dimension<number> {
	valueAsSql(value: number): string {
		return value.toString();
	}

	valueAsString(value: number): string {
		if(value === null) return "<null>";
		return value.toLocaleString();
	}
}

export class NumberMetric extends Metric<number> {
	valueAsSql(value: number): string {
		return value.toString();
	}

	valueAsString(value: number): string {
		if(value === null) return "<null>";
		return this.opts?.formatter?.(value) || value.toLocaleString();
	}
}

export abstract class FilterGroup extends Filter {
	protected abstract readonly joinWith: string;
	protected abstract get filters(): Filter[];

	get aggregation() {
		return this.filters.some((f) => f.aggregation);
	}

	get sql() {
		return this.filters.map((f) => f.sql).join(` ${this.joinWith} `);
	}
}

abstract class FilterListGroup extends FilterGroup {
	constructor(private readonly _filters: Filter[]) {
		super();
	}

	get filters() {
		return this._filters;
	}
}

class AndFilter extends FilterListGroup {
	joinWith = 'AND';
}

export class OrFilter extends FilterListGroup {
	joinWith = 'OR';
}

export class DataFieldFilterMap<V = unknown> extends FilterGroup {
	joinWith = 'AND';

	protected readonly map: Map<string, DataFieldFilter<V>> = new Map();

	constructor(initialFilters?: DataFieldFilter<V>[]) {
		super();
		initialFilters?.forEach((f) => this.map.set(f.dataField.id, f));
	}

	get filters() {
		return Array.from(this.map.values());
	}

	has(dataField: DataField<unknown>) {
		return this.map.has(dataField.id);
	}

	delete(dataField: DataField<unknown>) {
		return this.map.delete(dataField.id);
	}

	replace(filter: DataFieldFilter<unknown>) {
		const existed = this.has(filter.dataField);
		this.map.set(filter.dataField.id, filter);
		return existed;
	}
}

export class Query {
	constructor(private readonly sql: string) {}
	json() {
		return JSON.stringify(this.sql);
	}
}

export type AggregationQueryOptions<R> = {
	table: string;
	select: {
		[K in keyof R]: DataField<R[K]>;
	};
	filters?: Filter[];
	limit?: number;
	offset?: number;
	orderBy?: [DataField<unknown>, 'asc' | 'desc'][];
};

export function buildAggregationQuery<R>(options: AggregationQueryOptions<R>): Query {
	const select = Object.values(options.select)
		.map((s) => `${s.sql}`)
		.join(', ');

	const filters = Array.from(options.filters || []).reduce(
		(prev, filter) => {
			if (filter.aggregation) prev.having.push(filter);
			else prev.where.push(filter);
			return prev;
		},
		{ where: [] as Filter[], having: [] as Filter[] }
	);
	const where = filters.where.length > 0 ? new AndFilter(filters.where) : undefined;
	const having = filters.having.length > 0 ? new AndFilter(filters.having) : undefined;
	const defaultOrder = Object.values(options.select).map((k) => k.sql);
	const customOrder = options.orderBy
		? options.orderBy.map(([field, dir]) => `${field.sql} ${dir}`)
		: [];
	const parts = [
		`SELECT ${select}`,
		`FROM ${options.table}`,
		where ? `WHERE ${where.sql}` : undefined,
		'GROUP BY ALL',
		having ? `HAVING ${having.sql}` : undefined,
		`ORDER BY ${[...customOrder, ...defaultOrder].join(',')}`,
		options.limit ? `LIMIT ${options.limit}` : undefined,
		options.offset ? `OFFSET ${options.offset}` : undefined
	];
	return new Query(parts.filter((p) => p !== undefined).join(' '));
}

type DataFieldOpts<V> = {
	sql?: string;
	label?: string;
	aggregation: boolean;
	stringFormatter: (value: NonNullable<V>) => string;
	sqlFormatter: (value: NonNullable<V>) => string;
};

export class DataField<D> {
	constructor(
		public readonly id: string,
		protected readonly opts: DataFieldOpts<D>
	) {}

	get aggregation(): boolean {
		return this.opts.aggregation;
	}

	get sql(): string {
		return this.opts?.sql || this.id;
	}

	get label(): string {
		return this.opts?.label || this.id;
	}

	valueAsSql(value: D): string {
		return value === null || value === undefined ? "NULL" : this.opts.sqlFormatter(value);
	}

	valueAsString(value: D): string {
		return value === null || value === undefined
			? '<null>'
			: this.opts.stringFormatter(value);
	}
}

export function dimension<V>(id: string, opts: Omit<DataFieldOpts<V>, "aggregation">) {
	return new DataField(id, {...opts, aggregation: false});
}

export function metric<V>(id: string, opts: Omit<DataFieldOpts<V>, "aggregation">) {
	return new DataField(id, {...opts, aggregation: true});
}

type CustomizeableDataFieldOpts<V> = {
	sql?: string;
	label?: string;
	stringFormatter?: (value: NonNullable<V>) => string;
}

const defaultStringOptions = (opts?: CustomizeableDataFieldOpts<string>) =>  ({
	...opts,
	stringFormatter: opts?.stringFormatter || ((v) => v.toString()),
	sqlFormatter: (v: string) => `'${v.replaceAll("'", "''")}'`
})

const defaultNumberOptions = (opts?: CustomizeableDataFieldOpts<number>) =>  ({
	...opts,
	stringFormatter: opts?.stringFormatter || (v => v.toLocaleString()),
	sqlFormatter: (v: number) => v.toString(),
})

const defaultBooleanOptions = (opts?: CustomizeableDataFieldOpts<boolean>) =>  ({
	...opts,
	stringFormatter: opts?.stringFormatter || (v => v.toString()),
	sqlFormatter: (v: boolean) => v.toString(),
})

const defaultDateOptions = (opts?: CustomizeableDataFieldOpts<Date>) =>  ({
	...opts,
	stringFormatter: opts?.stringFormatter || (v => v.toLocaleString()),
	sqlFormatter: (v: Date) => v.toString(),
})

export function number_metric<N extends never | null = never>(id: string, opts?: CustomizeableDataFieldOpts<number | N>) {
	return metric<number | N>(id, defaultNumberOptions(opts))
}

export abstract class TableSchemaBase {
	protected abstract name: string;

	string_dimension<N extends never | null = never>(id: string, opts?: CustomizeableDataFieldOpts<string | N>) {
		return dimension<string | N>(id, defaultStringOptions(opts))
	}

	number_dimension<N extends never | null = never>(id: string, opts?: CustomizeableDataFieldOpts<number | N>) {
		return dimension<number | N>(id, defaultNumberOptions(opts))
	}

	boolean_dimension<N extends never | null = never>(id: string, opts?: CustomizeableDataFieldOpts<boolean | N>) {
		return dimension<boolean | N>(id, defaultBooleanOptions(opts))
	}

	date_dimension<N extends never | null = never>(id: string, opts?: CustomizeableDataFieldOpts<Date | N>) {
		return dimension<Date | N>(id, defaultDateOptions(opts))
	}
}
export abstract class DatabaseSchemaBase {
	string_metric<N extends never | null = never>(id: string, opts?: CustomizeableDataFieldOpts<string | N>) {
		return metric<string | N>(id, defaultStringOptions(opts))
	}

	number_metric<N extends never | null = never>(id: string, opts?: CustomizeableDataFieldOpts<number | N>) {
		return metric<number | N>(id, defaultNumberOptions(opts))
	}

	boolean_metric<N extends never | null = never>(id: string, opts?: CustomizeableDataFieldOpts<boolean | N>) {
		return metric<boolean | N>(id, defaultBooleanOptions(opts)	)
	}

	date_metric<N extends never | null = never>(id: string, opts?: CustomizeableDataFieldOpts<Date | N>) {
		return metric<Date | N>(id, defaultDateOptions(opts))
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

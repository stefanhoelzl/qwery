export type DataFieldOpts<V> = {
  sql: string;
  label?: string;
  formatter?: (value: V) => string;
  nullable?: boolean;
};

export abstract class DataField<D> {
  constructor(private opts: DataFieldOpts<D>) {}

  abstract get aggregation(): boolean;
  abstract valueAsSql(value: D): string;

  get sql(): string {
    return this.opts.sql;
  }

  get label(): string {
    return this.opts.label || this.sql;
  }

  get uniqueKey(): string {
    return this.sql;
  }

  valueAsString(value: D): string {
    return value === null || value === undefined
      ? "<null>"
      : this.opts.formatter?.(value) || value.toString();
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
    return `${this.dataField.sql} IN (${this.values.map((v) => this.dataField.valueAsSql(v)).join(", ")})`;
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

export class NumberDimension extends Dimension<number> {
  valueAsSql(value: number): string {
    return value.toString();
  }
}

export class NumberMetric extends Metric<number> {
  valueAsSql(value: number): string {
    return value.toString();
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
  joinWith = "AND";
}

export class OrFilter extends FilterListGroup {
  joinWith = "OR";
}

export abstract class DataFieldFilterMap<
  V extends DataFieldFilter<unknown> = DataFieldFilter<unknown>
> extends FilterGroup {
  joinWith = "AND";

  protected readonly map: Map<string, V> = new Map();

  constructor(initialFilters?: V[]) {
    super();
    initialFilters?.forEach((f) => this.map.set(f.dataField.uniqueKey, f));
  }

  get filters() {
    return Array.from(this.map.values());
  }

  has(dataField: DataField<unknown>) {
    return this.map.has(dataField.uniqueKey);
  }

  delete(dataField: DataField<unknown>) {
    return this.map.delete(dataField.uniqueKey);
  }
}

export class DataFieldInFilterMap extends DataFieldFilterMap<InFilter<unknown>> {
  addValues<V>(dataField: DataField<V>, values: V[]) {
    if (!this.map.has(dataField.uniqueKey))
      this.map.set(dataField.uniqueKey, new InFilter(dataField, values) as InFilter<unknown>);
    else this.map.get(dataField.uniqueKey)?.addValues(values);
  }
}

export class ReplacingDataFieldFilterMap extends DataFieldFilterMap {
  replace(filter: DataFieldFilter<unknown>) {
    const existed = this.has(filter.dataField);
    this.map.set(filter.dataField.uniqueKey, filter);
    return existed;
  }
}

export class Query {
  constructor(private readonly sql: string) {}
  json() {
    return JSON.stringify(this.sql);
  }
}

export type AggregationQueryOptions = {
  table: string;
  select: Record<string, DataField<unknown>>;
  filters?: Filter[];
};

export function buildAggregationQuery(options: AggregationQueryOptions): Query {
  const select = Object.values(options.select)
    .map((s) => `${s.sql}`)
    .join(", ");

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

  const parts = [
    `SELECT ${select}`,
    `FROM ${options.table}`,
    where ? `WHERE ${where.sql}` : undefined,
    "GROUP BY ALL",
    having ? `HAVING ${having.sql}` : undefined,
    `ORDER BY ${Object.values(options.select)
      .map((k) => k.sql)
      .join(",")}`
  ];
  return new Query(parts.filter((p) => p !== undefined).join(" "));
}

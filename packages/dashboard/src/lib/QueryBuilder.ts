export class FieldType<ValueType> {
  constructor(
    private readonly opts: {
      escape: (value: ValueType) => string;
      parse: (value: string) => ValueType;
      format: (value: ValueType) => string;
    }
  ) {}
  nullable(): FieldType<ValueType | null> {
    return this as FieldType<ValueType | null>;
  }
  get parse() {
    return this.opts.parse;
  }
  get escape() {
    return this.opts.escape;
  }
  get format() {
    return this.opts.format;
  }
}

export function string(): FieldType<string> {
  return new FieldType<string>({
    escape: (value) => `'${value}'`,
    parse: (value) => value,
    format: (value) => value
  });
}

export function number(): FieldType<number> {
  return new FieldType<number>({
    escape: (value) => value.toString(),
    parse: (value) => parseFloat(value),
    format: (value) => value.toLocaleString()
  });
}

export function boolean(): FieldType<boolean> {
  return new FieldType<boolean>({
    escape: (value) => (value ? "TRUE" : "FALSE"),
    parse: (value) => value === "true",
    format: (value) => value.toLocaleString()
  });
}

export function date(): FieldType<Date> {
  return new FieldType<Date>({
    escape: (value) => `'${value.toISOString()}'`,
    parse: (value) => new Date(Date.parse(value)),
    format: (value) => value.toLocaleString()
  });
}

type FieldOptions<ValueType> = { label?: string; formatter?: (value: ValueType) => string };

export class Field<ValueType> {
  private options: FieldOptions<ValueType> = {};

  constructor(
    readonly id: string,
    readonly sql: string,
    readonly tables: string[],
    readonly aggregated: boolean,
    readonly type: FieldType<ValueType>
  ) {}

  get label() {
    return this.options.label || this.id;
  }

  configure(options: FieldOptions<ValueType>): Field<ValueType> {
    this.options = { ...this.options, ...options };
    return this;
  }

  format(value: ValueType): string {
    if (value === null) return "<NULL>";
    return this.options.formatter === undefined
      ? this.type.format(value)
      : this.options.formatter(value);
  }

  toString(): string {
    return this.sql;
  }
}

export interface FieldFactories {
  column<T>(table: string, name: string, type: FieldType<T>): Field<T>;
  computed<T>(
    id: string,
    [sqlString, usedFields, aggregated]: [string, Field<unknown>[], boolean],
    type: FieldType<T>
  ): Field<T>;
}

function computed(
  strings: TemplateStringsArray,
  maybeFields: unknown[]
): [string, Field<unknown>[]] {
  const fields = maybeFields.filter((maybeField) => maybeField instanceof Field);
  const sql = strings.reduce(
    (prev, curr, idx) => `${prev}${curr}${maybeFields[idx] === undefined ? "" : maybeFields[idx]}`,
    ""
  );
  return [sql, fields];
}

export function metric(
  strings: TemplateStringsArray,
  ...maybeFields: unknown[]
): [string, Field<unknown>[], boolean] {
  const [sql, fields] = computed(strings, maybeFields);
  return [sql, fields, true];
}

export function dimension(
  strings: TemplateStringsArray,
  ...maybeFields: unknown[]
): [string, Field<unknown>[], boolean] {
  const [sql, fields] = computed(strings, maybeFields);
  return [sql, fields, false];
}

export function fieldFactories(): FieldFactories {
  const usedIds: Set<string> = new Set();
  function validatedId(id: string): string {
    if (usedIds.has(id)) throw `ID '${id}' is already used`;
    usedIds.add(id);
    return id;
  }

  return {
    column: function <T>(table: string, name: string, type: FieldType<T>): Field<T> {
      return new Field(validatedId(name), name, [table], false, type);
    },

    computed: function <T>(
      id: string,
      [sqlString, usedFields, aggregated]: [string, Field<unknown>[], boolean],
      type: FieldType<T>
    ): Field<T> {
      return new Field(
        validatedId(id),
        sqlString,
        usedFields.map((field) => field.tables).flat(),
        aggregated || usedFields.some((field) => field.aggregated),
        type
      );
    }
  };
}

export interface DatabaseSchema {
  join(tables: string[]): string;
}

export function table(name: string): DatabaseSchema {
  return {
    join: function () {
      return name;
    }
  };
}

export function star(...mappings: [Field<unknown>, Field<unknown>][]): DatabaseSchema {
  if (mappings.length === 0) throw "missing table joins";

  mappings.forEach((mapping) =>
    mapping.forEach((field) => {
      if (field.tables.length != 1)
        throw `invalid star schema: field '${field.id}' referencing multiple tables (${field.tables.join(", ")})`;
    })
  );

  const tables = new Set(mappings.map(([field]) => field.tables[0]));
  if (tables.size != 1)
    throw `invalid star schema: multiple fact tables ${Array.from(tables).join(", ")}`;
  mappings.forEach(([field]) => {
    mappings.forEach(([otherField]) => {
      if (field.tables[0] != otherField.tables[0]) throw ``;
    });
  });

  mappings.forEach(([, field]) => {
    if (mappings.filter(([, other]) => field.tables[0] == other.tables[0]).length > 1)
      throw `table ${field.tables[0]} cannot be joined with multiple keys to fact table`;
  });

  const factTable: string = tables.values().next().value!;

  return {
    join: function (tables): string {
      let clause = factTable;
      for (const [fromField, toField] of mappings) {
        if (!tables.indexOf(toField.tables[0])) continue;

        if (tables.indexOf(toField.tables[0]) > 1)
          clause = `(${clause} INNER JOIN ${toField.tables[0]} ON ${fromField.sql} = ${toField.sql})`;
      }
      return clause;
    }
  };
}

export interface Filter {
  field: Field<unknown>;
  sql: string;
}

export function selection<ValueType>(field: Field<ValueType>, values: ValueType[]): Filter {
  return {
    field: field as Field<unknown>,
    sql: `${field.sql} IN (${values.map((v) => field.type.escape(v)).join(", ")})`
  };
}

export function range<ValueType>(field: Field<ValueType>, from: ValueType, to: ValueType): Filter {
  return {
    field: field as Field<unknown>,
    sql: `${field.sql} BETWEEN ${field.type.escape(from)} AND ${field.type.escape(to)}`
  };
}

export function notNull(field: Field<unknown>): Filter {
  return {
    field: field,
    sql: `${field.sql} IS NOT NULL`
  };
}

export type AggregationQueryOptions<Record> = {
  select: {
    [Key in keyof Record]: Field<Record[Key]>;
  };
  filters?: Filter[];
  limit?: number;
  offset?: number;
  orderBy?: [Field<unknown>, "asc" | "desc"][];
};

export class Query<Record> {
  private readonly queries: string[];

  constructor(
    schema: DatabaseSchema,
    private readonly options: AggregationQueryOptions<Record>
  ) {
    const tables = new Set([
      ...Object.values(options.select)
        .map((s) => s.tables)
        .flat(),
      ...(options.filters?.map((filter) => filter.field.tables).flat() || [])
    ]);
    const from = schema.join(Array.from(tables));

    const select = Object.values(options.select)
      .map((s) => `${s.sql}`)
      .join(", ");

    const filters = Array.from(options.filters || []).reduce(
      (prev, filter) => {
        if (filter.field.aggregated) prev.having.push(filter);
        else prev.where.push(filter);
        return prev;
      },
      { where: [] as Filter[], having: [] as Filter[] }
    );
    const where =
      filters.where.length > 0
        ? filters.where.map((filter) => `(${filter.sql})`).join(" AND ")
        : undefined;
    const having =
      filters.having.length > 0
        ? filters.having.map((filter) => `(${filter.sql})`).join(" AND ")
        : undefined;

    const defaultOrder = Object.values(options.select).map((k) => k.sql);
    const customOrder = options.orderBy
      ? options.orderBy.map(([field, dir]) => `${field.sql} ${dir}`)
      : [];

    const temp = [
      "CREATE TEMPORARY TABLE _temp AS",
      `SELECT ${select} FROM ${from}`,
      where ? `WHERE ${where}` : undefined,
      "GROUP BY ALL",
      having ? `HAVING ${having}` : undefined,
      `ORDER BY ${[...customOrder, ...defaultOrder].join(", ")}`
    ];

    const data = [
      "SELECT * FROM _temp",
      options.limit ? `LIMIT ${options.limit}` : undefined,
      options.offset ? `OFFSET ${options.offset}` : undefined
    ];

    this.queries = [
      temp.filter((p) => p !== undefined).join(" "),
      data.filter((p) => p !== undefined).join(" ")
    ];
  }

  parse([statistics, result]: [[number], unknown[][]]): [number, Record[]] {
    return [
      statistics[0],
      result.map((r) =>
        Object.keys(this.options.select)
          .map((key, idx) => [key, idx] as const)
          .reduce((prev, [key, idx]) => ({ ...prev, [key]: r[idx] }), {} as Record)
      )
    ];
  }

  json() {
    return JSON.stringify(this.queries);
  }
}

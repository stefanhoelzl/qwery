import { FilterManager } from '$lib/FilterManager';
import {
	Field,
	Query,
	type Filter,
	type AggregationQueryOptions,
	type DatabaseSchema
} from '$lib/QueryBuilder';

class FetchQueryEngine {
	async query<R>(schema: DatabaseSchema, opts: AggregationQueryOptions<R>): Promise<[number, R[]]> {
		const query = new Query(schema, opts);
		const response = await fetch('/api/query', {
			method: 'POST',
			body: query.json(),
			headers: { 'content-type': 'application/json' }
		});

		const json = await response.json();
		const [count, records] = query.parse(json)
		return [count, records];
	}
}

type FetchOpts = {
	limit?: number;
	offset?: number;
	orderBy?: [Field<unknown, unknown>, 'asc' | 'desc'][];
};

export interface PanelContext {
	type: 'panel';
	isActive: boolean;
	isVisible: boolean;
	pendingUpdate: boolean;
	fetch<R>(fields: { [Key in keyof R]: Field<R[Key], unknown> }, opts?: FetchOpts): Promise<[number, R[]]>;
	filter(filters: Filter[]): void;
	dropFilter(field: Field<unknown, unknown>): void;
	update(): void;
	onUpdate(cb: () => void): void;
	drop(): void;
}

export interface ContainerContext {
	type: 'container';
	children: (ContainerContext | PanelContext)[];
	changedChildVisibility: (child: number, visible: boolean) => void;
	onVisibilityChange?: (visible: boolean) => boolean;
	createContainer: () => ContainerContext;
}

export class DashboardManager {
	public filterManager = new FilterManager();
	private updateHandler: Map<number, (() => void)[]> = new Map();
	private queryEngine: FetchQueryEngine = new FetchQueryEngine();

	public filters: Filter[] = $state([]);
	private contexts: PanelContext[] = [];

	constructor(private readonly schema: DatabaseSchema) {
		this.filterManager.onUpdate(() => {
			this.filters = this.filterManager.filters;
			this.triggerUpdates();
		});
	}

	public triggerUpdates() {
		this.contexts.forEach((ctx) => ctx.update());
	}

	public createBaseContainer(): ContainerContext {
		const _createContainer = () => {
			const ctx: ContainerContext = {
				type: 'container',
				children: [],
				changedChildVisibility: (childIdx, visible) => {
					const child = ctx.children[childIdx];
					if(child.type === "panel") {
						child.isVisible = visible;
						if (visible && child.pendingUpdate) child.update();
					} else if (!child.onVisibilityChange?.(visible)) {
						child.children.forEach((
							_, idx) => child.changedChildVisibility(idx, visible)
						)
					}
				},
				createContainer: () => {
					const child = _createContainer();
					ctx.children.push(child);
					return child;
				}
			};
			return ctx;
		};

		return _createContainer();
	}

	public createPanel(opts?: { filter?: Filter; container?: ContainerContext }): PanelContext {
		const filterCtx = this.filterManager.createContext();
		const id = Math.max(0, ...Array.from(this.updateHandler.keys())) + 1;
		const filters = opts?.filter ? [opts.filter] : [];

		this.updateHandler.set(id, []);

		const ctx: PanelContext = $state({
			type: 'panel',
			isActive: false,
			isVisible: true,
			pendingUpdate: false,
			fetch: <R>(fields: { [Key in keyof R]: Field<R[Key], unknown> }, opts?: FetchOpts) => {
				return this.queryEngine.query(this.schema, {
					select: fields,
					filters: [...filters, ...this.filterManager.filters],
					...opts
				});
			},
			filter: (filters: Filter[]) => {
				this.contexts.forEach((context) => {
					context.isActive = context === ctx;
				});
				filterCtx.filter(filters);
			},
			dropFilter: (field: Field<unknown, unknown>) => {
				this.contexts.forEach((context) => {
					context.isActive = false;
				});
				filterCtx.dropFilter(field);
			},
			update: () => {
				if (ctx.isVisible) {
					this.updateHandler.get(id)?.forEach((cb) => cb());
					ctx.pendingUpdate = false;
				} else ctx.pendingUpdate = true;
			},
			onUpdate: (cb: () => void) => this.updateHandler.get(id)?.push(() => cb()),
			drop: () => {
				this.contexts.forEach((context) => {
					context.isActive = false;
				});
				this.updateHandler.delete(id);
			}
		});
		this.contexts.push(ctx);
		opts?.container?.children.push(ctx);
		return ctx;
	}
}

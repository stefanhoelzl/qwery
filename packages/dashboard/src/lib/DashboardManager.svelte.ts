import { FilterManager } from '$lib/FilterManager';
import {
	DataField,
	DataFieldFilter,
	type DataFieldFilterMap,
	type AggregationQueryOptions
} from '$lib/QueryBuilder';
import { type Filter, buildAggregationQuery } from '$lib/QueryBuilder';

class FetchQueryEngine {
	async query<R>(opts: AggregationQueryOptions<R>): Promise<R[]> {
		const body = buildAggregationQuery(opts);
		const response = await fetch('/api/query', {
			method: 'POST',
			body: body.json(),
			headers: { 'content-type': 'application/json' }
		});

		const json = await response.json();
		return json.map((r: unknown[]) =>
			Object.keys(opts.select)
				.map((key, idx) => [key, idx] as const)
				.reduce((prev, [key, idx]) => ({ ...prev, [key]: r[idx] }), {})
		);
	}
}

type FetchOpts = {
	limit?: number;
	offset?: number;
	orderBy?: [DataField<unknown>, 'asc' | 'desc'][];
};

export interface PanelContext {
	type: 'panel';
	isActive: boolean;
	isVisible: boolean;
	pendingUpdate: boolean;
	fetch<R>(fields: { [Key in keyof R]: DataField<R[Key]> }, opts?: FetchOpts): Promise<R[]>;
	filter<V>(filterMap: DataFieldFilterMap<V>): void;
	dropFilter(dataField: DataField<unknown>): void;
	update(): void;
	onUpdate(cb: () => void): void;
	drop(): void;
}

export interface ContainerContext {
	type: 'container';
	children: (ContainerContext | PanelContext)[];
	onVisibilityChange: (child: number, visible: boolean) => void;
	createContainer: () => ContainerContext;
}

export class DashboardManager {
	public filterManager = new FilterManager();
	private updateHandler: Map<number, (() => void)[]> = new Map();
	private queryEngine: FetchQueryEngine = new FetchQueryEngine();

	public filters: DataFieldFilter<unknown>[] = $state([]);
	private contexts: PanelContext[] = [];

	constructor(private table: string) {
		this.filterManager.onUpdate(() => {
			this.filters = this.filterManager.filters;
			this.triggerUpdates();
		});
	}

	public triggerUpdates() {
		this.contexts.forEach((ctx) => ctx.update());
	}

	public createBaseContainer(): ContainerContext {
		const _allChildPanels = (ctx: ContainerContext | PanelContext): PanelContext[] => {
			if (ctx.type === 'panel') return [ctx];
			return ctx.children
				.map((c) => _allChildPanels(c))
				.reduce((prev, curr) => [...prev, ...curr], []);
		};

		const _createContainer = () => {
			const ctx: ContainerContext = {
				type: 'container',
				children: [],
				onVisibilityChange: (childIdx, visible) => {
					_allChildPanels(ctx.children[childIdx]).map((p) => {
						p.isVisible = visible;
						if (visible && p.pendingUpdate) p.update();
					});
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
			fetch: <R>(fields: { [Key in keyof R]: DataField<R[Key]> }, opts?: FetchOpts) => {
				return this.queryEngine.query({
					table: this.table,
					select: fields,
					filters: [...filters, ...this.filterManager.filters],
					...opts
				});
			},
			filter: (filterMap: DataFieldFilterMap) => {
				this.contexts.forEach((context) => {
					context.isActive = context === ctx;
				});
				filterCtx.filter(filterMap);
			},
			dropFilter: (dataField: DataField<unknown>) => {
				this.contexts.forEach((context) => {
					context.isActive = false;
				});
				filterCtx.dropFilter(dataField);
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

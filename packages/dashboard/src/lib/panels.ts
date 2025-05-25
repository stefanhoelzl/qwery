import type { Component, ComponentProps } from "svelte";
import Grid from "$lib/views/Grid.svelte";
import GridCell from "$lib/views/GridCell.svelte";
import Tabs from "$lib/views/Tabs.svelte";
import Tab from "$lib/views/Tab.svelte";
import type { Filter } from "$lib/QueryBuilder";
import type { ContainerContext, PanelContext } from "$lib/DashboardManager.svelte";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyProps = ComponentProps<any>;

export interface Panel<Props extends AnyProps> {
  type: "panel";
  component: Component<Props & { ctx: PanelContext }>;
  props: Props;
  filter?: Filter;
}

export interface Container<Props extends AnyProps, WrapperProps extends AnyProps> {
  type: "container";
  component: Component<Props & { ctx: ContainerContext }>;
  props: Props;
  wrapper: Component<WrapperProps>;
  content: { panel: PanelOrContainer; layout: WrapperProps }[];
}

export type PanelOrContainer = Panel<AnyProps> | Container<AnyProps, AnyProps>;

export function panel<Props extends AnyProps>(opts: {
  component: Component<Props & { ctx: PanelContext }>;
  props: Props;
  filter?: Filter;
}): Panel<Props> {
  return {
    type: "panel",
    component: opts.component,
    props: opts.props || {},
    filter: opts.filter
  };
}

export function container<Props extends AnyProps, WrapperProps extends AnyProps>(opts: {
  component: Component<Props & { ctx: ContainerContext }>;
  props: Props;
  wrapper: Component<WrapperProps>;
  content: { panel: PanelOrContainer; layout: WrapperProps }[];
}): Container<Props, WrapperProps> {
  return {
    type: "container",
    component: opts.component,
    props: opts.props || {},
    wrapper: opts.wrapper,
    content: opts.content
  };
}

export function grid(
  content: { layout: ComponentProps<typeof GridCell>; panel: PanelOrContainer }[]
): Container<ComponentProps<typeof Grid>, ComponentProps<typeof GridCell>> {
  const rows = Math.max(...content.map((c) => c.layout.row + c.layout["row-span"]));
  const cols = Math.max(...content.map((c) => c.layout.col + c.layout["col-span"]));

  return container({
    component: Grid,
    props: { rows, cols },
    wrapper: GridCell,
    content: content
  });
}

let tabId = 0;
export function tabs(
  content: Record<string, PanelOrContainer>
): Container<ComponentProps<typeof Tabs>, ComponentProps<typeof Tab>> {
  return container({
    component: Tabs,
    props: { id: ++tabId, tabs: Object.keys(content) },
    wrapper: Tab,
    content: Object.values(content).map((panel, idx) => ({
      panel,
      layout: { position: idx, id: tabId }
    }))
  });
}

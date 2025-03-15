import Grid from "./views/Grid.svelte";
import GridCell from "$lib/views/GridCell.svelte";
import type { Filter } from "$lib/QueryBuilder";
import type { PanelContext } from "$lib/DashboardManager.svelte";
import type { Component, ComponentProps } from "svelte";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyProps = ComponentProps<any>;

export interface Panel<Props extends AnyProps, Layout extends AnyProps> {
  type: "panel";
  component: Component<Props & { ctx: PanelContext }>;
  props: Props;
  filter?: Filter;
  layout: Layout;
}

export interface Container<
  Props extends AnyProps,
  WrapperProps extends AnyProps,
  LayoutProps extends AnyProps | undefined
> {
  type: "container";
  component: Component<Props>;
  props: Props;
  layout: LayoutProps;
  wrapper: Component<WrapperProps>;
  content: PanelOrContainer<WrapperProps>[];
}

export type PanelOrContainer<WrapperProps extends AnyProps> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Panel<any, WrapperProps> | Container<AnyProps, AnyProps, WrapperProps>;

export function panel<Props extends AnyProps, LayoutProps extends AnyProps>(opts: {
  component: Component<Props & { ctx: PanelContext }>;
  props: Props;
  filter?: Filter;
  layout: LayoutProps;
}): Panel<Props, LayoutProps> {
  return {
    type: "panel",
    component: opts.component,
    props: opts.props || {},
    filter: opts.filter,
    layout: opts.layout || {}
  };
}

export function container<
  Props extends AnyProps,
  WrapperProps extends AnyProps,
  LayoutProps extends AnyProps | undefined
>(opts: {
  component: Component<Props>;
  props: Props;
  layout: LayoutProps;
  wrapper: Component<WrapperProps>;
  content: PanelOrContainer<WrapperProps>[];
}): Container<Props, WrapperProps, LayoutProps> {
  return {
    type: "container",
    component: opts.component,
    props: opts.props || {},
    layout: opts.layout,
    wrapper: opts.wrapper,
    content: opts.content
  };
}

export function grid<LayoutProps extends AnyProps>(opts: {
  props: ComponentProps<typeof Grid>;
  layout?: LayoutProps;
  content: PanelOrContainer<ComponentProps<typeof GridCell>>[];
}): Container<
  ComponentProps<typeof Grid>,
  ComponentProps<typeof GridCell>,
  LayoutProps | undefined
> {
  return container({
    component: Grid,
    props: opts.props,
    layout: opts.layout,
    wrapper: GridCell,
    content: opts.content
  });
}

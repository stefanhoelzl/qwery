<script lang="ts">
	import Header from '$lib/views/Header.svelte';
	import FilterPanel from '$lib/panels/FilterPanel.svelte';
	import Actions from '$lib/views/Actions.svelte';
	import type { PanelOrContainer, AnyProps, Container, Panel } from '$lib/panels';
	import {
		type ContainerContext,
		type DashboardManager,
		type PanelContext
	} from '$lib/DashboardManager.svelte';
	import { HSStaticMethods } from 'preline';
	import { onMount } from 'svelte';
	import '$lib/dashboard.css';

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dashboard: PanelOrContainer<any>;
		manager: DashboardManager;
	}
	const { dashboard, manager }: Props = $props();

	onMount(() => HSStaticMethods.autoInit());
	onMount(() => manager.triggerUpdates());

	if (import.meta.hot) {
		import.meta.hot.on('vite:afterUpdate', () => {
			HSStaticMethods.autoInit();
		});
	}
</script>

{#snippet panelOrContainer(def: PanelOrContainer<AnyProps>, container: ContainerContext)}
	{#if def.type === 'container'}
		{@render containerSnippet(def, container.createContainer())}
	{:else if def.type === 'panel'}
		{@render panelSnippet(def, manager.createPanel({ filter: def.filter, container }))}
	{/if}
{/snippet}

{#snippet containerSnippet(def: Container<AnyProps, AnyProps, AnyProps>, ctx: ContainerContext)}
	<def.component {...def.props} {ctx}>
		{#each def.content as child, idx (idx)}
			<def.wrapper {...child.layout}>
				{@render panelOrContainer(child, ctx)}
			</def.wrapper>
		{/each}
	</def.component>
{/snippet}

{#snippet panelSnippet(def: Panel<AnyProps, AnyProps>, ctx: PanelContext)}
	<def.component {...def.props} {ctx}></def.component>
{/snippet}

<Header>
	{#snippet left()}
		<Actions></Actions>
		{#each manager.filters as filter (filter.dataField.id)}
			<FilterPanel ctx={manager.createPanel()} {filter}></FilterPanel>
		{/each}
	{/snippet}
</Header>

<div class="contents">
	{@render panelOrContainer(dashboard, manager.createBaseContainer())}
</div>

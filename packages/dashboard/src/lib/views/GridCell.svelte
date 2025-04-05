<script module lang="ts">
	import type { Snippet } from 'svelte';

	export interface Props {
		row: number;
		col: number;
		'row-span': number;
		'col-span': number;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import Card from '$lib/views/Card.svelte';

	let { row, col, 'row-span': rowSpan, 'col-span': colSpan, children }: Props = $props();
</script>

<div style:grid-area={`${row + 1} / ${col + 1} / span ${rowSpan} / span ${colSpan}`}>
	<Card>
		{@render children?.()}
	</Card>
</div>

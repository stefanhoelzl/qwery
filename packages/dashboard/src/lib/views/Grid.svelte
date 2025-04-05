<script module lang="ts">
	import type { Snippet } from 'svelte';

	export interface Props {
		cols: number;
		rows: number;
		children?: Snippet;
	}
</script>

<script lang="ts">
	let { cols, rows, children }: Props = $props();
</script>

<div class="flex h-full flex-1 flex-col space-y-2 overflow-hidden p-2">
	<div
		style:grid-template-rows={`repeat(${rows}, 1fr)`}
		style:grid-template-columns={`repeat(${cols}, 1fr)`}
		class="grid h-full gap-2"
	>
		{@render children?.()}
	</div>
</div>

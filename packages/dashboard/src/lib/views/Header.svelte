<script lang="ts">
	import type { Snippet } from 'svelte';

	let { left, right }: { left?: Snippet; right?: Snippet } = $props();
</script>

<header class="flex w-full flex-nowrap flex-wrap justify-start py-1 text-sm">
	<nav class="item-l mx-auto flex w-full justify-between">
		<div class="mt-0 flex flex-row items-center justify-start gap-5 px-5">
			{@render left?.()}
		</div>
		<div class="mt-0 flex flex-row items-center justify-end gap-5 px-5">
			{@render right?.()}
		</div>
	</nav>
</header>

<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

<div
	class="flex h-full flex-col rounded-xl border border-t-4 border-gray-200 border-t-transparent bg-white p-2 shadow-md dark:border-neutral-700 dark:bg-neutral-800"
>
	{@render children?.()}
</div>

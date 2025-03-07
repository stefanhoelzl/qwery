<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children?: Snippet } = $props();
</script>

<div
  class="flex flex-col rounded-xl border border-t-4 border-gray-200 border-t-transparent bg-white p-2 shadow-md active:border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-500 dark:bg-neutral-800"
>
  {@render children?.()}
</div>

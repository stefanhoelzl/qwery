<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children?: Snippet } = $props();
</script>

<div class="flex flex-1 flex-col space-y-2 overflow-hidden p-2">
  <div class="grid h-full grid-cols-4 grid-rows-2 gap-2">
    {@render children?.()}
  </div>
</div>

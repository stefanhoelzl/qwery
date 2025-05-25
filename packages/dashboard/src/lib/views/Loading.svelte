<script lang="ts">
  import { ChartNoAxesColumn } from "lucide-svelte";
  import type { Snippet } from "svelte";

  interface Props {
    loading: boolean;
    children: Snippet;
  }

  let { loading, children }: Props = $props();
</script>

<div class="relative h-full w-full">
  <div
    class:hidden={!loading}
    class="absolute z-50 flex h-full w-full items-center justify-center bg-white/50"
  >
    <ChartNoAxesColumn class="h-full max-h-16 w-full max-w-16 animate-pulse stroke-1"
    ></ChartNoAxesColumn>
  </div>
  {@render children()}
</div>

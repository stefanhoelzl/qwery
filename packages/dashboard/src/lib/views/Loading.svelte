<script lang="ts">
  import {ChartNoAxesColumn} from "lucide-svelte";
  import type { Snippet } from "svelte";

  interface Props {
    loading: boolean;
    children: Snippet;
  }

  let {loading, children}: Props = $props();
</script>

<div class="w-full h-full relative">
  <div class:hidden={!loading} class="absolute h-full w-full flex justify-center items-center bg-white/50 z-50">
    <ChartNoAxesColumn class="h-full w-full max-h-16 max-w-16 stroke-1 animate-pulse"></ChartNoAxesColumn>
  </div>
  {@render children()}
</div>


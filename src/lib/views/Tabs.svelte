<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  import {ChevronLeft, ChevronRight} from "lucide-svelte";
  import type {ContainerContext} from "$lib/DashboardManager.svelte";

  interface Props {
    tabs: string[];
    id: number;
    children?: Snippet;
    ctx: ContainerContext;
  }

  const { children, tabs, id, ctx }: Props = $props();
  let selectedIdx = $state(0);

  onMount(() => Array(tabs.length).keys().forEach(idx => ctx.onVisibilityChange(idx, idx === selectedIdx)))
</script>

<div
  id="hs-scroll-nav-tabs"
  class="relative overflow-hidden border-b border-gray-200 px-4 dark:border-neutral-700"
  data-hs-scroll-nav=""
>
  <div
    id="hs-tabs"
    class="hs-scroll-nav-body flex snap-x snap-mandatory gap-x-5 overflow-x-auto [&::-webkit-scrollbar]:h-0"
    aria-label="Tabs"
    role="tablist"
    aria-orientation="horizontal"
  >
    {#each tabs as name, idx (name)}
      <button
        type="button"
        class:active={idx === selectedIdx}
        class="hs-tab-active:font-semibold hs-tab-active:border-blue-600 hs-tab-active:text-blue-600 active inline-flex snap-start items-center gap-x-2 border-b-2 border-transparent px-1 py-2 text-sm whitespace-nowrap text-gray-500 hover:text-blue-600 focus:text-blue-600 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 dark:text-neutral-400 dark:hover:text-blue-500"
        id={`tabs-item-${id}-${idx}`}
        aria-selected={idx === selectedIdx}
        data-hs-tab={`#tabs-${id}-${idx}`}
        aria-controls={`tabs-${id}-${idx}`}
        role="tab"
        onclick={() => {
          if(selectedIdx === idx) return;
          ctx.onVisibilityChange(selectedIdx, false);
          ctx.onVisibilityChange(idx, true);
          selectedIdx = idx
        }}
      >
        <!-- ADD ICON -->
        {name}
      </button>
    {/each}
  </div>

  <!-- Arrows -->
  <button
    type="button"
    class="hs-scroll-nav-prev hs-scroll-nav-disabled:hidden hs-scroll-nav-disabled:pointer-events-none absolute start-0 top-1/2 z-10 hidden size-9 shrink-0 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-800 hover:bg-gray-100 focus:bg-gray-100 focus:outline-hidden md:flex dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
  >
    <ChevronLeft></ChevronLeft>
    <span class="sr-only">Previous</span>
  </button>
  <button
    type="button"
    class="hs-scroll-nav-next hs-scroll-nav-disabled:hidden hs-scroll-nav-disabled:pointer-events-none absolute end-0 top-1/2 z-10 hidden size-9 shrink-0 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-800 hover:bg-gray-100 focus:bg-gray-100 focus:outline-hidden md:flex dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
  >
    <span class="sr-only">Next</span>
    <ChevronRight></ChevronRight>
  </button>
  <!-- End Arrows -->
</div>

<div class="mt-3 contents">
  {@render children?.()}
</div>

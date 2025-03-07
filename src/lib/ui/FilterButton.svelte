<script lang="ts">
  import { Trash2, Filter } from "lucide-svelte";
  import NumberFilter from "$lib/ui/NumberFilter.svelte";
</script>

<div
  class="hs-dropdown group flex min-w-20 items-center justify-center gap-x-2 rounded-lg border border-transparent bg-blue-200 px-4 py-2 text-sm font-medium text-blue-800 [--auto-close:inside] [--placement:bottom-left] disabled:pointer-events-none disabled:opacity-50 dark:bg-blue-800/30 dark:text-blue-400"
>
  <span class="flex justify-center group-hover:invisible">Filter</span>

  <button
    type="button"
    id="hs-dropdown-default"
    class="hs-dropdown-toggle group-not-hover:hidden absolute flex size-5 shrink-0 -translate-x-4 items-center justify-center gap-2 rounded-lg border border-transparent bg-transparent text-sm font-medium text-gray-500 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 dark:text-gray-400"
    aria-haspopup="menu"
    aria-expanded="false"
    aria-label="Dropdown"
  >
    <Filter></Filter>
  </button>

  <div
    class="hs-dropdown-menu duration hs-dropdown-open:opacity-100 z-10 mt-2 hidden max-h-3/4 min-w-100 overflow-scroll rounded-lg bg-white opacity-0 shadow-md transition-[opacity,margin] dark:divide-neutral-700 dark:border dark:border-neutral-700 dark:bg-neutral-800"
    role="menu"
    aria-orientation="vertical"
    aria-labelledby="hs-dropdown-default"
  >
    <NumberFilter></NumberFilter>
  </div>

  <button
    type="button"
    class="group-not-hover:hidden absolute flex size-5 shrink-0 translate-x-4 items-center justify-center gap-2 rounded-lg border border-transparent bg-transparent text-sm font-medium text-gray-500 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 dark:text-gray-400"
  >
    <Trash2></Trash2>
  </button>
</div>

<script lang="ts">
  import { Trash2, Filter } from "lucide-svelte";
  import { type Snippet } from "svelte";

  interface Props {
    label: string;
    ondelete: () => void;
    children: Snippet;
  }

  const { label, ondelete, children }: Props = $props();
  let open = $state(false);
</script>

<div
  class="group relative inline-block min-w-20 items-center justify-center gap-x-2 rounded-lg border border-transparent bg-blue-200 p-0 text-sm font-medium text-blue-800 [--auto-close:inside] [--placement:bottom-left] disabled:pointer-events-none disabled:opacity-50 dark:bg-blue-800/30 dark:text-blue-400"
>
  <span class="m-2 flex justify-center group-hover:invisible">{label}</span>

  <div
    class="group-not-hover:invisible flex-inline absolute top-0 flex h-full w-full items-center justify-center gap-x-4"
  >
    <button
      type="button"
      class="items-center justify-center rounded-lg border border-transparent bg-transparent text-sm font-medium text-gray-500 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 dark:text-gray-400"
      aria-haspopup="menu"
      aria-expanded={open}
      onclick={() => (open = !open)}
    >
      <Filter></Filter>
    </button>

    <button
      type="button"
      onclick={() => ondelete()}
      class="items-center justify-center rounded-lg border border-transparent bg-transparent text-sm font-medium text-gray-500 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 dark:text-gray-400"
    >
      <Trash2></Trash2>
    </button>
  </div>

  <div
    class="full-h absolute z-1 mt-2 min-w-100 overflow-scroll rounded-lg bg-white shadow-md transition-[opacity,margin] dark:divide-neutral-700 dark:border dark:border-neutral-700 dark:bg-neutral-800"
    class:hidden={!open}
    role="menu"
  >
    {@render children()}
  </div>
</div>

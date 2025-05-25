<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    position: number;
    id: number;
    children?: Snippet;
  }

  const { position, children, id }: Props = $props();
  const classes = position === 0 ? [] : ["hidden"];
</script>

<div
  class={["contents", ...classes]}
  id={`tabs-${id}-${position}`}
  role="tabpanel"
  aria-labelledby={`tabs-item-${id}-${position}`}
>
  {@render children?.()}
</div>

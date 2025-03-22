<script>
  import "../app.css";
  import {HSStaticMethods} from "preline";

  import { onMount } from "svelte";

  let { children } = $props();

  onMount(() => {
    HSStaticMethods.autoInit();
  });

  if (import.meta.hot) {
    import.meta.hot.on("vite:afterUpdate", () => {
      HSStaticMethods.autoInit();
    });
  }
</script>

{@render children()}

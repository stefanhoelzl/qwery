<script>
  import "../app.css";

  import { onMount } from "svelte";

  let { children } = $props();

  onMount(() => {
    window.HSStaticMethods.autoInit();
  });

  if (import.meta.hot) {
    import.meta.hot.on("vite:afterUpdate", () => {
      window.HSStaticMethods.autoInit();
    });
  }
</script>

{@render children()}

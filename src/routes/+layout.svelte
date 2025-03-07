<script>
  import "../app.css";

  import { afterNavigate } from "$app/navigation";

  let { children } = $props();

  afterNavigate(() => {
    window.HSStaticMethods.autoInit();
  });

  if (import.meta.hot) {
    import.meta.hot.on("vite:afterUpdate", () => {
      window.HSStaticMethods.autoInit();
    });
  }
</script>

{@render children()}

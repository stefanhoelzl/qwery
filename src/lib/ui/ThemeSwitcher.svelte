<script lang="ts">
  import { onMount } from "svelte";
  import { Moon, Sun, MonitorCog } from "lucide-svelte";

  const themes = {
    light: { icon: Sun, tooltip: "Light" },
    system: { icon: MonitorCog, tooltip: "System" },
    dark: { icon: Moon, tooltip: "Dark" }
  };

  let currentTheme: string;

  function onswitch(theme: string) {
    currentTheme = theme;
    window.setTheme(theme);
  }

  onMount(() => {
    currentTheme = window.loadTheme();
  });
</script>

<svelte:head>
  <script>
    function loadTheme() {
      if (window.localStorage.getItem("theme") === "light") return "light";
      if (window.localStorage.getItem("theme") === "dark") return "dark";
      return "system";
    }

    function setTheme(theme) {
      const light =
        theme === "light" ||
        (theme === "system" && !window.matchMedia("(prefers-color-scheme: dark)").matches);
      const dark =
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

      if (theme === "system") window.localStorage.removeItem("theme");
      else window.localStorage.setItem("theme", theme);

      const html = document.querySelector("html");
      if (light) {
        if (html.classList.contains("dark")) html.classList.remove("dark");
        if (!html.classList.contains("light")) html.classList.add("light");
      } else if (dark) {
        if (html.classList.contains("light")) html.classList.remove("light");
        if (!html.classList.contains("dark")) html.classList.add("dark");
      }
    }

    setTheme(loadTheme());
  </script>
</svelte:head>

<div class="flex">
  <div
    class="flex rounded-lg bg-gray-100 p-1 transition hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600"
  >
    <div class="flex gap-x-1" aria-orientation="horizontal">
      {#each Object.entries(themes) as [theme, { icon, tooltip }] (theme)}
        <div class="hs-tooltip inline-block [--placement:bottom]">
          <button
            type="button"
            class="hs-tooltip-toggle active inline-flex items-center rounded-lg bg-transparent px-2 py-1 text-sm font-medium text-gray-500 focus:text-gray-700 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 aria-checked:bg-white aria-checked:text-gray-700 dark:text-neutral-400 aria-checked:dark:bg-neutral-800 dark:aria-checked:bg-gray-800 aria-checked:dark:text-neutral-400"
            role="switch"
            aria-checked={currentTheme === theme}
            data-hs-theme={theme}
            onclick={() => onswitch(theme)}
          >
            <svelte:component this={icon} class="block size-4"></svelte:component>
            <span
              class="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible invisible absolute z-10 inline-block bg-gray-900 px-2 py-1 text-white opacity-0 transition-opacity"
              role="tooltip"
            >
              {tooltip}
            </span>
          </button>
        </div>
      {/each}
    </div>
  </div>
</div>

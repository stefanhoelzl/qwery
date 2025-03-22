<script lang="ts">
  import Card from "$lib/views/Card.svelte";

  interface Props {
    min: number;
    max: number;
    onupdate: (min: number, max: number) => void;
  }

  let { min = $bindable(), max = $bindable(), onupdate }: Props = $props();

  const sliderConfig = {
    start: [140, 300],
    range: {
      min: 0,
      max: 500
    },
    connect: true,
    pips: {
      mode: "values",
      values: [0, 125, 250, 375, 500],
      density: 20
    },
    tooltips: true,
    formatter: "integer",
    cssClasses: {
      target: "relative h-1 mb-10 rounded-full bg-gray-100 dark:bg-neutral-700",
      base: "w-full h-full relative z-1",
      origin: "absolute top-0 end-0 w-full h-full origin-[0_0] rounded-full",
      handle:
        "absolute top-1/2 end-0 size-3.5 bg-white border-4 border-blue-600 rounded-full cursor-pointer translate-x-2/4 -translate-y-2/4 dark:border-blue-500",
      connects: "relative z-0 w-full h-full rounded-full overflow-hidden",
      connect: "absolute top-0 end-0 z-1 w-full h-full bg-blue-600 origin-[0_0] dark:bg-blue-500",
      touchArea: "absolute -top-1 -bottom-1 -start-1 -end-1",
      tooltip:
        "bg-white border border-gray-200 text-sm text-gray-800 py-1 px-2 rounded-lg mb-3 absolute bottom-full start-2/4 -translate-x-2/4 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white",
      pips: "relative w-full h-10 mt-1",
      value: "absolute top-4 -translate-x-2/4 text-sm text-gray-400 dark:text-neutral-500",
      marker: "absolute h-1 border-s border-gray-400 dark:border-neutral-500"
    }
  };
</script>

<Card>
  <div class="z-20 m-6 hidden px-4" data-hs-range-slider={JSON.stringify(sliderConfig)}></div>

  <div class="flex flex-row space-x-4">
    <div class="basis-1/2">
      <input
        id="hs-pass-charts-values-to-inputs-min-target"
        class="block w-full rounded-lg px-4 py-2.5 disabled:pointer-events-none disabled:opacity-50 sm:py-3 sm:text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
        type="number"
        bind:value={min}
        oninput={() => onupdate(min, max)}
      />
    </div>
    <div class="basis-1/2">
      <input
        id="hs-pass-charts-values-to-inputs-max-target"
        class="block w-full rounded-lg border-gray-600 px-4 py-2.5 ring-gray-600 focus:border-blue-500 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 sm:py-3 sm:text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
        type="number"
        bind:value={max}
        oninput={() => onupdate(min, max)}
      />
    </div>
  </div>
</Card>

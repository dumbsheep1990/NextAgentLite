<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import type { Selection } from "@uwdata/mosaic-core";

  import BoxPlot from "./BoxPlot.svelte";
  import CountPlot from "./CountPlot.svelte";
  import Histogram from "./Histogram.svelte";
  import Histogram2D from "./Histogram2D.svelte";
  import HistogramStack from "./HistogramStack.svelte";
  import ListCountPlot from "./ListCountPlot.svelte";
  import SelectionList from "./SelectionList.svelte";
  import VgPlot from "./VgPlot.svelte";

  import type { PlotSpec } from "./plot.js";
  import type { PlotStateStore } from "./plot_state_store.js";

  const Components: Record<string, any> = {
    BoxPlot: BoxPlot,
    CountPlot: CountPlot,
    Histogram: Histogram,
    Histogram2D: Histogram2D,
    HistogramStack: HistogramStack,
    ListCountPlot: ListCountPlot,
    SelectionList: SelectionList,
  };

  interface Props {
    spec: PlotSpec;
    table: string;
    filter: Selection;
    stateStore?: PlotStateStore<any>;
  }
  let { table, filter, spec, stateStore }: Props = $props();
</script>

<svelte:boundary>
  {#if "component" in spec}
    {@const Component = Components[spec.component]}
    <Component {...spec.props} table={table} filter={filter} stateStore={stateStore} />
  {:else}
    <VgPlot spec={spec} params={{ brush: filter }} />
  {/if}

  {#snippet failed(error, reset)}
    <div>
      An error occurred in this chart. Please check and <button class="underline" onclick={reset}>try again</button>.
      <div class="text-xs">{error?.toString() ?? "unknown"}</div>
    </div>
  {/snippet}
</svelte:boundary>

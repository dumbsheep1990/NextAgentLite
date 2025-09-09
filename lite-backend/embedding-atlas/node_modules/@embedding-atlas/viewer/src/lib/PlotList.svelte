<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import { flip } from "svelte/animate";
  import { slide } from "svelte/transition";

  import PlotCell from "./plots/PlotCell.svelte";
  import Button from "./widgets/Button.svelte";

  import type { ColumnDesc } from "./database_utils.js";
  import { IconClose, IconDown, IconUp } from "./icons.js";
  import { plotUniqueId, type Plot } from "./plots/plot.js";
  import type { PlotStateStoreManager } from "./plots/plot_state_store.js";

  interface Props {
    table: string;
    columns: ColumnDesc[];
    filter: any;
    plots: Plot[];
    layout?: "sidebar" | "full";
    stateStores?: PlotStateStoreManager;
  }

  let { table, filter, plots = $bindable(), columns, layout = "sidebar", stateStores }: Props = $props();

  function addNewPlot() {
    plots = [{ id: plotUniqueId(), title: "New Chart", spec: null }, ...plots];
  }

  function removePlot(plot: Plot) {
    plots = plots.filter((x) => x !== plot);
  }

  function updatePlot(oldPlot: Plot, newPlot: Plot) {
    plots = plots.map((x) => (x === oldPlot ? newPlot : x));
  }

  function reorderPlot(plot: Plot, direction: "up" | "down") {
    let index = plots.indexOf(plot);
    if (index < 0) {
      return;
    }
    let newPlots = plots.slice();
    if (direction == "up" && index > 0) {
      let tmp = newPlots[index - 1];
      newPlots[index - 1] = plot;
      newPlots[index] = tmp;
    }
    if (direction == "down" && index < plots.length - 1) {
      let tmp = newPlots[index + 1];
      newPlots[index + 1] = plot;
      newPlots[index] = tmp;
    }
    plots = newPlots;
  }
</script>

<div
  class="flex gap-2"
  class:flex-col={layout == "sidebar"}
  class:flex-row={layout == "full"}
  class:flex-wrap={layout == "full"}
>
  <button
    class="flex-none bg-slate-100 dark:bg-slate-700 rounded-md p-2 text-slate-500 hover:bg-white hover:text-slate-900 dark:hover:bg-slate-600 dark:hover:text-slate-100 select-none focus-visible:outline-2 outline-blue-600 -outline-offset-2"
    style:width={layout == "full" ? "400px" : null}
    onclick={() => addNewPlot()}
  >
    + Add Chart
  </button>
  {#each plots as plot, index (plot)}
    <div
      class="flex-none bg-slate-100 dark:bg-slate-700 rounded-md"
      style:width={layout == "full" ? "400px" : null}
      animate:flip={{ duration: 300 }}
      out:slide
    >
      <PlotCell
        table={table}
        plot={plot}
        filter={filter}
        columns={columns}
        onChange={(newPlot) => updatePlot(plot, newPlot)}
        stateStore={stateStores?.store(plot.id)}
      >
        {#snippet buttons()}
          {#if index > 0}
            <Button icon={IconUp} title="Move up" style="plotCell" order={3} onClick={() => reorderPlot(plot, "up")} />
          {/if}
          {#if index < plots.length - 1}
            <Button
              icon={IconDown}
              title="Move down"
              style="plotCell"
              order={4}
              onClick={() => reorderPlot(plot, "down")}
            />
          {/if}
          <Button icon={IconClose} style="plotCellClose" title="Close" order={5} onClick={() => removePlot(plot)} />
        {/snippet}
      </PlotCell>
    </div>
  {/each}
</div>

<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import type { Selection } from "@uwdata/mosaic-core";
  import type { Snippet } from "svelte";
  import { slide } from "svelte/transition";

  import Button from "../widgets/Button.svelte";
  import PlotBuilder from "./PlotBuilder.svelte";
  import PlotView from "./PlotView.svelte";
  import SpecEditor from "./SpecEditor.svelte";

  import { IconChevronDown, IconChevronUp, IconEdit } from "../icons.js";

  import type { ColumnDesc } from "../database_utils.js";
  import type { Plot } from "./plot.js";
  import type { PlotStateStore } from "./plot_state_store.js";

  interface Props {
    table: string;
    filter: Selection;
    plot: Plot;
    columns: ColumnDesc[];
    buttons?: Snippet;
    onChange?: (value: Plot) => void;
    stateStore?: PlotStateStore<any>;
  }

  let { table, filter, plot, columns, buttons, onChange, stateStore }: Props = $props();

  let isEditing: boolean = $state(false);
  let isVisible: boolean = $state(true);
</script>

<div class="group">
  <div class="px-2 pt-2 flex items-center">
    <button
      class="font-mono font-medium py-1 text-left flex flex-1 mr-2 overflow-hidden items-center"
      onclick={() => (isVisible = !isVisible)}
    >
      {#if isVisible}
        <div class="text-sm pr-0.5"><IconChevronUp /></div>
      {:else}
        <div class="text-sm pr-0.5"><IconChevronDown /></div>
      {/if}
      <div class="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
        {plot.title}
      </div>
    </button>
    <div class="flex-none flex gap-0.5 opacity-0 group-hover:opacity-100">
      {#if plot.spec != null && !isEditing}
        <Button icon={IconEdit} order={1} style="plotCell" title="Edit spec" onClick={() => (isEditing = true)} />
      {/if}
      {@render buttons?.()}
    </div>
  </div>
  <div
    style:display="grid"
    style:grid-template-rows={isVisible ? "1fr" : "0fr"}
    style:transition="grid-template-rows 300ms ease-in-out"
  >
    <div class="overflow-hidden px-2 pb-2">
      <div class="pt-2"></div>
      {#if plot.spec != null}
        <PlotView table={table} filter={filter} spec={plot.spec} stateStore={stateStore} />
        {#if isEditing}
          <div transition:slide>
            <SpecEditor
              spec={plot.spec}
              onConfirm={(spec) => {
                isEditing = false;
                onChange?.({ ...plot, spec: spec });
              }}
              onCancel={() => {
                isEditing = false;
              }}
            />
          </div>
        {/if}
      {:else}
        <PlotBuilder
          table={table}
          filter={filter}
          columns={columns}
          onCreate={(plot) => {
            onChange?.(plot);
          }}
        />
      {/if}
    </div>
  </div>
</div>

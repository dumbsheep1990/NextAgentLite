<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import type { DataPoint } from "@embedding-atlas/component";

  import TooltipText from "./TooltipText.svelte";
  import { IconSearch } from "./icons";

  interface Props {
    tooltip: DataPoint;
    textRenderer?: string;
    textField: string | null;
    darkMode: boolean;
    onNearestNeighborSearch?: (id: any) => void;
  }

  let { tooltip, textRenderer = "plain", textField, darkMode, onNearestNeighborSearch }: Props = $props();

  function isLink(text: string): boolean {
    return typeof text == "string" && (text.startsWith("http://") || text.startsWith("https://"));
  }
</script>

<div class="embedding-atlas-root">
  <div
    class="p-2 border flex flex-col gap-2 border-slate-500 shadow-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-md text-ellipsis overflow-x-hidden overflow-y-scroll"
    class:dark={darkMode}
    style:max-width="400px"
    style:max-height="300px"
  >
    <div class="flex-none">
      <TooltipText text={textField == null ? tooltip.text : tooltip.fields?.[textField]} renderer={textRenderer} />
    </div>
    <div class="flex-none flex flex-row gap-1 flex-wrap">
      {#if tooltip.fields != null}
        {#each Object.keys(tooltip.fields) as field}
          {@const text = tooltip.fields[field]?.toString() ?? "(null)"}
          <div class="px-2 flex gap-2 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-md">
            <div class="text-slate-400 dark:text-slate-400 font-medium">{field}</div>
            <div class="text-ellipsis whitespace-nowrap overflow-hidden max-w-72" title={text}>
              {#if isLink(text)}
                <a href={text} class="underline" target="_blank">{text}</a>
              {:else}
                {text}
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </div>
    {#if onNearestNeighborSearch}
      <div>
        <button
          class="text-sm flex gap-0.5 items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300"
          onclick={() => {
            onNearestNeighborSearch?.(tooltip.identifier);
          }}
        >
          <IconSearch /> Nearest Neighbors
        </button>
      </div>
    {/if}
  </div>
</div>

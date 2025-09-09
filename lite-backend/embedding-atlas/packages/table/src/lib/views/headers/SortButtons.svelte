<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import { Context } from "../../context/context.svelte.js";
  import type { SortDirection } from "../../types/index.js";

  interface Props {
    col: string;
  }

  let { col }: Props = $props();

  const controller = Context.controller;

  let isSorted: boolean = $derived(controller.sort ? controller.sort.column === col : false);
  let sortDirection: SortDirection | null = $derived(controller.sort ? controller.sort.direction : null);

  let icon = $derived.by(() => {
    if (!isSorted) {
      return "⇅";
    } else if (sortDirection === "ascending") {
      return "↑";
    } else {
      return "↓";
    }
  });
</script>

<button
  class="sort-buttons"
  onclick={() => {
    const direction = isSorted ? (sortDirection === "ascending" ? "descending" : null) : "ascending";
    if (direction) {
      controller.handleSort({ column: col, direction: direction });
    } else {
      controller.handleSort(null);
    }
  }}
>
  <div class="sort-button {isSorted ? 'selected' : null} sort-glyph">{icon}</div>
</button>

<style>
  .sort-buttons {
    all: unset;
    flex-shrink: 0;
    width: 16px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    flex-direction: row;
    margin-left: 4px;
    border-radius: 2px;
    padding-left: 4px;
    padding-right: 4px;
    color: var(--tertiary-text-color);
  }

  .sort-buttons:hover {
    --placeholder: 0;
    background-color: var(--hover-bg);
  }

  .sort-glyph {
    color: var(--tertiary-text-color);
  }

  .sort-buttons:hover .sort-glyph {
    color: var(--tertiary-text-color);
  }

  .selected {
    color: var(--primary-text-color) !important;
  }
</style>

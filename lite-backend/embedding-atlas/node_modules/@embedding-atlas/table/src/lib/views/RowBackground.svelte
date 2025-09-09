<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import { ConfigContext } from "../context/config.svelte";
  import { Context } from "../context/context.svelte";

  interface Props {
    row: string;
  }

  let { row }: Props = $props();

  const controller = Context.controller;
  const model = Context.model;
  const overscrollModifier = Context.overscrollModifier;
  const config = ConfigContext.config;

  let height: number = $derived(model.rowHeights[row]);
  let width: number = $derived(Math.max(model.colsRightmostPosition, controller.viewWidth));
  let y: number = $derived(overscrollModifier.y(model.rowPositions[row]));
  let rowParity = $derived(model.getRowParity(row));
  let isFlashed = $derived(controller.flashedRowId === row);
  let isHovered = $derived(controller.hoveredRowId === row);

  let highlighted: boolean | null = $derived.by(() => {
    if (config.highlightedRows) {
      return config.highlightedRows?.has(row);
    } else {
      return null;
    }
  });
</script>

<div
  class="row-background {rowParity} {isFlashed ? 'flashed' : null} {isHovered && config.highlightHoveredRow
    ? 'hovered'
    : null}"
  style:--width={width + "px"}
  style:--height={height + "px"}
  style:--y={y + "px"}
></div>

{#if highlighted !== null && !highlighted}
  <div
    class="row-background {rowParity} dimmer"
    style:--width={width + "px"}
    style:--height={height + "px"}
    style:--y={y + "px"}
  ></div>
{/if}

<style>
  .row-background {
    position: absolute;
    width: var(--width);
    height: var(--height);
    box-sizing: border-box;
    z-index: -1;
    transform: translate3d(0, var(--y), 0);

    transition: background-color 100ms linear;
  }

  .odd {
    background-color: var(--secondary-bg);
  }

  .even {
    background-color: var(--primary-bg);
  }

  .dimmer {
    background-color: var(--dimmed-row-color);
    z-index: 10;
    pointer-events: none;
  }

  .flashed {
    background-color: var(--row-scroll-to-color);
  }

  .hovered {
    background-color: var(--row-hover-color);
  }
</style>

<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import CellContent from "./CellContent.svelte";
  import RowNumber from "./RowNumber.svelte";

  import { ConfigContext } from "../../context/config.svelte";
  import { Context } from "../../context/context.svelte";
  import { OID } from "../../model/TableModel.svelte.js";

  interface Props {
    row: string;
    col: string;
  }

  const { row, col }: Props = $props();

  const model = Context.model;
  const controller = Context.controller;
  const overscrollModifier = Context.overscrollModifier;
  const config = ConfigContext.config;

  let { x, y } = $derived(model.getPosition({ row, col }));
  let renderY = $derived(overscrollModifier.y(y));
  let { width, height } = $derived(model.getDimensions({ row, col }));
  let isFirstCol = $derived(model.isFirstCol(col));
  let isLastCol = $derived(model.isLastCol(col));
  let parentBackgroundColor = $derived(
    model.getRowParity(row) === "even" ? "var(--primary-bg)" : "var(--secondary-bg)",
  );
  let isFlashed = $derived(controller.flashedRowId === row);

  let onClick = () => {
    if (config.onRowClick) {
      config.onRowClick(row);
    }
  };

  let hovered = $state(false);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="cell"
  style:--x={x + "px"}
  style:--y={renderY + "px"}
  style:--width={width + "px"}
  style:--height={height + "px"}
  style:--padding-x={config.betweenColPadding + "px"}
  style:--padding-y={config.betweenRowPadding + "px"}
  style:--extra-right-padding={(isLastCol ? config.verticalScrollbarWidth : 0) + "px"}
  style:--extra-left-padding={(isFirstCol ? config.firstColLeftPadding : 0) + "px"}
  style:--background-color={parentBackgroundColor}
  onclick={onClick}
  onkeydown={(e) => {
    if (e.key === "Enter") {
      onClick();
    }
  }}
  onpointerenter={() => {
    hovered = true;
    controller.hoveredRowId = row;
  }}
  onpointerleave={() => {
    hovered = false;
    controller.hoveredRowId = null;
  }}
>
  {#if col !== OID}
    <CellContent row={row} col={col} hovered={hovered} />
  {:else}
    <RowNumber row={row} col={col} />
  {/if}
</div>

<style>
  .cell {
    --x: 0px;
    --y: 0px;
    --width: 0px;
    --height: 0px;

    display: flex;
    box-sizing: border-box;
    padding-top: calc(var(--padding-y) / 2);
    padding-bottom: calc(var(--padding-y) / 2);
    padding-right: calc(calc(var(--padding-x) / 2) + var(--extra-right-padding));
    padding-left: calc(calc(var(--padding-x) / 2) + var(--extra-left-padding));
    position: absolute;
    left: 0;
    top: 0;
    width: var(--width);
    height: var(--height);
    transform: translate(var(--x), var(--y));
    contain: layout paint;

    color: var(--primary-text-color);
    font-family: var(--cell-font-family);
    font-size: var(--cell-font-size);
  }
</style>

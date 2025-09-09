<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import _ from "lodash";
  import { onMount } from "svelte";
  import { ConfigContext } from "../context/config.svelte.js";
  import { Context } from "../context/context.svelte.js";

  const verticalScrollbarController = Context.verticalScrollbarController;
  const tableController = Context.controller;
  const config = ConfigContext.config;

  let renderedPillPosition: number = $state(0);
  let renderedRow: number = $state(0);
  let element: HTMLElement | null = $state(null);
  let pillElement: HTMLElement | null = $state(null);
  let labelElement: HTMLElement | null = $state(null);

  let rowString = $derived(new Intl.NumberFormat().format(renderedRow));

  let lastRAFId = 0;

  onMount(() => {
    lastRAFId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(lastRAFId);
    };
  });

  function fade() {
    if (element) {
      element.style.opacity = "0";
    }
  }
  const debouncedFade = _.debounce(fade, 1000);
  $effect(() => {
    if (element) {
      tableController.yScroll;
      element.style.opacity = "1";
      debouncedFade();
    }
  });

  function tick() {
    renderedPillPosition = verticalScrollbarController.pillPosition ?? renderedPillPosition;
    renderedRow = verticalScrollbarController.displayRow ?? renderedRow;
    if (pillElement) {
      pillElement.style.transform = `translate3d(0, ${renderedPillPosition}px, 0)`;
    }
    if (labelElement) {
      labelElement.style.setProperty("--offset", verticalScrollbarController.labelOffset - 1 + "px");
    }
    lastRAFId = requestAnimationFrame(tick);
  }
</script>

<div
  class="vertical-scrollbar"
  bind:this={element}
  bind:clientHeight={verticalScrollbarController.elementHeight}
  onpointerdown={verticalScrollbarController.handlePointerDown}
  onpointermove={verticalScrollbarController.handlePointerMove}
  onpointerup={verticalScrollbarController.handlePointerUp}
  style:--offset-bottom={config.horizontalScrollbarHeight + "px"}
  style:--width={config.verticalScrollbarWidth + "px"}
>
  <div class="pill" bind:this={pillElement} style:--pill-height={verticalScrollbarController.pillHeight + "px"}>
    <div class="label" bind:this={labelElement} bind:clientHeight={verticalScrollbarController.labelHeight}>
      {rowString}
    </div>
  </div>
</div>

<style>
  .vertical-scrollbar {
    position: absolute;
    right: 0;
    top: 0;
    width: var(--width);
    height: calc(100% - var(--offset-bottom));

    contain: layout;
    cursor: row-resize;

    transition: opacity 200ms linear;
    user-select: none;

    background-color: var(--scrollbar-bg);
  }

  .vertical-scrollbar:hover {
    opacity: 1 !important;
  }

  .pill {
    --pill-height: 4px;

    position: relative;
    pointer-events: none; /* let the container respond to pointer events */
    top: 0;
    left: 0;
    width: calc(var(--width) - 2px);
    margin-left: 1px;
    margin-right: 1px;
    height: var(--pill-height);
    border-radius: 2px;

    will-change: transform;
    background-color: var(--scrollbar-pill-bg);
  }

  .label {
    --offset: 0;

    position: absolute;
    pointer-events: none;
    top: 0;
    left: -4px;
    font-family: var(--font-family);
    font-size: 14px;
    white-space: nowrap;
    padding: 2px 4px;
    box-shadow: var(--shadow);
    transform: translate(-100%, calc(-50% + var(--pill-height) / 2 - var(--offset)));
    border-radius: 2px;

    color: var(--secondary-text-color);
    background-color: var(--scrollbar-label-bg);
    border: var(--outline);
  }
</style>

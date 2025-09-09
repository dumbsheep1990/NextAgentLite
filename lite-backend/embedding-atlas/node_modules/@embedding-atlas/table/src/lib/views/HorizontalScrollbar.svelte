<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import _ from "lodash";
  import { onMount } from "svelte";

  import { ConfigContext } from "../context/config.svelte.js";
  import { Context } from "../context/context.svelte.js";

  const horizontalScrollbarController = Context.horizontalScrollbarController;
  const tableController = Context.controller;
  const config = ConfigContext.config;

  let pillWidth = $state(0);
  let element: HTMLElement | null = $state(null);
  let pillElement: HTMLElement | null = $state(null);

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
      tableController.xScroll;
      element.style.opacity = "1";
      debouncedFade();
    }
  });

  function tick() {
    pillWidth = horizontalScrollbarController.pillWidth;
    if (pillElement) {
      pillElement.style.transform = `translate(${horizontalScrollbarController.pillLeft}px, 0)`;
    }

    lastRAFId = requestAnimationFrame(tick);
  }
</script>

<div
  class="horizontal-scrollbar"
  bind:this={element}
  bind:clientWidth={horizontalScrollbarController.elementWidth}
  style:--height={config.horizontalScrollbarHeight + "px"}
>
  <div
    class="pill"
    bind:this={pillElement}
    style:--width={pillWidth + "px"}
    style:--margin={horizontalScrollbarController.margin + "px"}
    onpointerdown={horizontalScrollbarController.handlePointerDown}
    onpointermove={horizontalScrollbarController.handlePointerMove}
    onpointerup={horizontalScrollbarController.handlePointerUp}
  ></div>
</div>

<style>
  .horizontal-scrollbar {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: var(--height);
    transition: opacity 200ms linear;
    background-color: var(--scrollbar-bg);
  }

  .horizontal-scrollbar:hover {
    opacity: 1 !important;
  }

  .pill {
    width: var(--width);
    height: calc(var(--height) - var(--margin) * 2);
    margin: var(--margin);
    border-radius: 2px;
    background-color: var(--scrollbar-pill-bg);
  }
</style>

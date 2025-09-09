<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  import type { Action } from "svelte/action";

  import { Context } from "../../context/context.svelte.js";
  import type { Anchor, HorizontalAlign, VerticalAlign } from "../../controllers/TablePortalController.svelte.js";

  interface Props {
    element: HTMLElement | null;
    relativeTo: HTMLElement;
    anchor: Anchor;
    horizontalAlign: HorizontalAlign;
    verticalAlign: VerticalAlign;
    children: Snippet;
    stickyX: boolean;
  }

  let {
    element = $bindable(),
    relativeTo,
    horizontalAlign,
    anchor,
    verticalAlign,
    children,
    stickyX,
  }: Props = $props();

  const controller = Context.controller;
  const tablePortalController = Context.tablePortalController;

  let portalElement: HTMLElement | null = $state(null);

  const portal: Action = (node: HTMLElement) => {
    $effect(() => {
      tablePortalController.mount(node, relativeTo, anchor, horizontalAlign, verticalAlign);

      node.focus();
      return () => {
        tablePortalController.destroy(node);
      };
    });
  };

  let initialX = 0;

  onMount(() => {
    initialX = controller.xScroll;
    requestAnimationFrame(tick);
  });

  function tick() {
    if (portalElement && stickyX) {
      portalElement.style.transform = `translateX(${controller.xScroll - initialX}px)`;
    }

    requestAnimationFrame(tick);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="table-portal"
  bind:this={portalElement}
  tabindex="-1"
  use:portal
  onclick={(e) => {
    // dont let clicks bubble up
    e.stopPropagation();
  }}
  onwheel={(e) => {
    // dont let wheel events bubble up
    e.stopPropagation();
  }}
>
  {@render children()}
</div>

<style>
  .table-portal {
    position: absolute;
  }
</style>

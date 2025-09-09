<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import { type Snippet } from "svelte";
  import ToggleButton from "./ToggleButton.svelte";

  interface Props {
    title?: string;
    label?: string | null;
    icon?: any | null;
    anchor?: "left" | "right";
    children?: Snippet;
  }

  let { title = "", label = null, icon = null, anchor = "right", children }: Props = $props();

  let visible: boolean = $state(false);
  let container: HTMLDivElement | undefined = $state(undefined);

  function onKeyDown(e: KeyboardEvent) {
    if (visible && e.key == "Escape") {
      visible = false;
      e.stopPropagation();
    }
  }

  $effect(() => {
    if (container != null) {
      let onRootMouseDown = (e: Event) => {
        if (!visible || !container) {
          return;
        }
        if (e.target && !container.contains(e.target as any)) {
          visible = false;
        }
      };
      let root = container.getRootNode();
      root.addEventListener("mousedown", onRootMouseDown);
      return () => {
        root.removeEventListener("mousedown", onRootMouseDown);
      };
    }
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="relative" bind:this={container} onkeydown={onKeyDown}>
  <ToggleButton icon={icon} title={title} label={label} bind:checked={visible} />
  {#if visible}
    <div
      class="absolute top-[30px] px-3 py-3 rounded-md z-20 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-lg"
      class:right-0={anchor == "right"}
      class:left-0={anchor == "left"}
    >
      {@render children?.()}
    </div>
  {/if}
</div>

<svelte:window />

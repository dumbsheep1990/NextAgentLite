<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import type { Snippet } from "svelte";

  let containerWidth = $state(300);
  let containerHeight = $state(200);

  let { children }: { children?: Snippet<[number, number]> } = $props();
</script>

<div
  style:user-select="none"
  style:position="relative"
  style:width="100%"
  style:height="100%"
  bind:clientWidth={containerWidth}
  bind:clientHeight={containerHeight}
>
  {@render children?.(containerWidth, containerHeight)}
</div>

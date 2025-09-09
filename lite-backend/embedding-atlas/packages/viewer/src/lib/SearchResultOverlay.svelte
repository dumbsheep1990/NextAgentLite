<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import type { OverlayProxy } from "@embedding-atlas/component";
  import type { SearchResultItem } from "./search.js";

  interface Props {
    items: SearchResultItem[];
    highlightItem?: SearchResultItem | null;
    proxy: OverlayProxy;
  }

  let { items, highlightItem, proxy }: Props = $props();
</script>

<svg width={proxy.width} height={proxy.height}>
  <g>
    {#each items as item}
      {#if item.x != null && item.y != null}
        {@const loc = proxy.location(item.x, item.y)}
        {@const isHighlight = item.id == highlightItem?.id}
        {#if isHighlight}
          <line x1={loc.x - 20} x2={loc.x - 10} y1={loc.y} y2={loc.y} class="stroke-orange-500" />
          <line x1={loc.x + 20} x2={loc.x + 10} y1={loc.y} y2={loc.y} class="stroke-orange-500" />
          <line x1={loc.x} x2={loc.x} y1={loc.y - 20} y2={loc.y - 10} class="stroke-orange-500" />
          <line x1={loc.x} x2={loc.x} y1={loc.y + 20} y2={loc.y + 10} class="stroke-orange-500" />
        {/if}
        <circle cx={loc.x} cy={loc.y} r={4} class="fill-orange-500 stroke-orange-700 stroke-2" />
      {/if}
    {/each}
  </g>
</svg>

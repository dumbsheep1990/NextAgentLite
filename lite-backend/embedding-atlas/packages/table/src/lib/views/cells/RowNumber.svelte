<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import { Context } from "../../context/context.svelte";

  interface Props {
    row: string;
    col: string;
  }

  const { row, col }: Props = $props();

  const model = Context.model;

  const content: number | null = model.getContent({ row, col });
  const formatted = $derived(new Intl.NumberFormat().format(content ?? 0));
</script>

<div class="row-number">
  {formatted}
</div>

<style>
  .row-number {
    flex-grow: 1;
    text-align: right;
    color: var(--secondary-text-color);
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
</style>

<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  interface Props {
    bigint: BigInt | null;
    height: number;
  }

  let { bigint, height = $bindable() }: Props = $props();

  function format(n: BigInt | null) {
    if (n === null) {
      return null;
    }

    return n.toLocaleString();
  }
</script>

<div class="bigint-content" bind:clientHeight={height}>
  {format(bigint)}
</div>

<style>
  .bigint-content {
    text-align: right;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
</style>

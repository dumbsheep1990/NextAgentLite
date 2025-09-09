<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  interface Props {
    number: number | null;
    height: number;
  }

  let { number, height = $bindable() }: Props = $props();

  function format(n: number | null) {
    if (n === null) {
      return null;
    }

    if (Number.isInteger(n)) {
      return n.toString();
    } else {
      // floating point
      return n.toPrecision(4).toString();
    }
  }
</script>

<div class="number-content" bind:clientHeight={height}>
  {format(number)}
</div>

<style>
  .number-content {
    text-align: right;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
</style>

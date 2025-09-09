<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import { ConfigContext } from "../../context/config.svelte";

  interface Props {
    col: string;
  }

  let { col }: Props = $props();

  const config = ConfigContext.config;
</script>

<div class="header-title">
  {config.columnConfigs[col]?.title ?? col}
</div>

<style>
  .header-title {
    flex-shrink: 1;
    margin-right: 2px;
  }
</style>

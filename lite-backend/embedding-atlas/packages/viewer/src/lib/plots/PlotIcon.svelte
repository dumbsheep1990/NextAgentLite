<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import colors from "tailwindcss/colors";

  import { Context } from "../contexts.js";

  const darkMode = Context.darkMode;

  import chart_boxplot from "../../assets/chart-boxplot.svg?raw";
  import chart_h_bar from "../../assets/chart-h-bar.svg?raw";
  import chart_heatmap from "../../assets/chart-heatmap.svg?raw";
  import chart_spec from "../../assets/chart-spec.svg?raw";
  import chart_stacked from "../../assets/chart-stacked.svg?raw";
  import chart_v_histogram from "../../assets/chart-v-histogram.svg?raw";

  const icons: Record<string, string> = {
    "chart-boxplot": chart_boxplot,
    "chart-h-bar": chart_h_bar,
    "chart-heatmap": chart_heatmap,
    "chart-stacked": chart_stacked,
    "chart-v-histogram": chart_v_histogram,
    "chart-spec": chart_spec,
  };

  let { type } = $props();

  function process(source: string, darkMode: boolean): string {
    source = source.replace("xmlns", 'style="width:100%;height:100%" xmlns');
    let map: Record<string, string> = darkMode ? { black: colors.slate[400] } : { black: colors.slate[500] };
    for (let key in map) {
      source = source.replaceAll(key, map[key]);
    }
    return source;
  }
</script>

<div class="w-12 h-12">{@html process(icons[type] ?? "", $darkMode)}</div>

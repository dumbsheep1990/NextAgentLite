<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import type { Selection } from "@uwdata/mosaic-core";
  import { parseSpec } from "@uwdata/mosaic-spec";

  import CodeEditor from "../widgets/CodeEditor.svelte";
  import Select from "../widgets/Select.svelte";
  import PlotIcon from "./PlotIcon.svelte";
  import PlotView from "./PlotView.svelte";

  import { type ColumnDesc, type JSColumnType } from "../database_utils.js";
  import { plotUniqueId, type Plot, type PlotSpec } from "./plot.js";
  import {
    makeBoxPlot,
    makeCountPlot,
    makeHistogram,
    makeHistogram2D,
    makeHistogramStack,
    type Field,
  } from "./specs.js";

  interface Props {
    table: string;
    filter: Selection;
    columns?: ColumnDesc[];
    onCreate?: (plot: Plot) => void;
  }

  let { table, columns = [], onCreate, filter }: Props = $props();

  interface UIElement {
    field?: {
      key: string;
      label: string;
      types?: JSColumnType[] | null;
    };
    text?: {
      key: string;
      placeholder?: string | null;
    };
  }

  interface ChartType {
    icon: string;
    description?: string;
    ui: UIElement[];
    preview: boolean;
    create: (values: Record<string, any>) => { title: string; spec: PlotSpec } | undefined | null;
  }

  let chartTypes: ChartType[] = [
    {
      icon: "chart-h-bar",
      description: "Create a count plot of a categorical field",
      ui: [{ field: { key: "x", label: "Field", types: ["number", "string", "string[]"] } }],
      preview: true,
      create: ({ x }) => {
        if (x == null) return;
        return {
          title: x.name,
          spec: makeCountPlot(x),
        };
      },
    },
    {
      icon: "chart-v-histogram",
      description: "Create a histogram of a field",
      ui: [{ field: { key: "x", label: "Field", types: ["number", "string"] } }],
      preview: true,
      create: ({ x }) => {
        if (x == null) return;
        return {
          title: x.name,
          spec: makeHistogram(x),
        };
      },
    },
    {
      icon: "chart-heatmap",
      description: "Create a 2D heatmap of two fields",
      ui: [
        { field: { key: "x", label: "X Field", types: ["number", "string"] } }, //
        { field: { key: "y", label: "Y Field", types: ["number", "string"] } }, //
      ],
      preview: true,
      create: ({ x, y }) => {
        if (x == null || y == null) return;
        return {
          title: `${x.name} vs. ${y.name}`,
          spec: makeHistogram2D(x, y),
        };
      },
    },
    {
      icon: "chart-stacked",
      description: "Create a stacked histogram",
      ui: [
        { field: { key: "x", label: "X Field", types: ["number", "string"] } }, //
        { field: { key: "y", label: "Group Field", types: ["number", "string"] } }, //
      ],
      preview: true,
      create: ({ x, y }) => {
        if (x == null || y == null) return;
        return {
          title: `${x.name} by ${y.name}`,
          spec: makeHistogramStack(x, y),
        };
      },
    },
    {
      icon: "chart-boxplot",
      description: "Create a box plot",
      ui: [
        { field: { key: "x", label: "X Field" } }, //
        { field: { key: "y", label: "Y Field", types: ["number"] } }, //
      ],
      preview: true,
      create: ({ x, y }) => {
        if (x == null || y == null) return;
        return {
          title: `${x.name} vs. ${y.name}`,
          spec: makeBoxPlot(x, y),
        };
      },
    },
    {
      icon: "chart-spec",
      description: "Create a chart with Mosaic specification",
      ui: [{ text: { key: "spec", placeholder: "{ /* Mosaic spec in JSON */ }" } }],
      preview: false,
      create: ({ spec }) => {
        if (typeof spec != "string" || spec.trim() == "") {
          return;
        }
        let parsed = JSON.parse(spec);
        parseSpec(parsed);
        return { title: "Mosaic Chart", spec: parsed };
      },
    },
  ];

  let chartType: ChartType = $state.raw(chartTypes[0]);
  let values: Record<string, any> = $state({});
  let validateResult: string | boolean = $state(false);
  let previewSpec: PlotSpec | null = $state(null);

  $effect.pre(() => {
    let _ = chartType;
    values = {};
  });

  $effect.pre(() => {
    try {
      let r = chartType.create(getInput());
      validateResult = r != null;
      previewSpec = chartType.preview ? (r?.spec ?? null) : null;
    } catch (e: any) {
      validateResult = e.toString();
    }
  });

  function confirm() {
    let r = chartType.create(getInput());
    if (r) {
      onCreate?.({ id: plotUniqueId(), title: r.title, spec: r.spec });
    }
  }

  function getInput() {
    let input = { ...values };
    for (let item of chartType.ui) {
      if (item.field) {
        input[item.field.key] = getField(input[item.field.key]);
      }
    }
    return input;
  }

  function getField(name: string): Field | null {
    let c = columns.find((x) => x.name == name);
    if (c == null || c.jsType == null) {
      return null;
    }
    switch (c.jsType) {
      case "number":
        return {
          name: c.name,
          type: "continuous",
        };
      case "string":
        return {
          name: c.name,
          type: "discrete",
        };
      case "string[]":
        return {
          name: c.name,
          type: "discrete[]",
        };
      default:
        return null;
    }
  }

  function filteredColumns(types: JSColumnType[] | null | undefined): ColumnDesc[] {
    if (types == null) {
      return columns.filter((c) => c.jsType != null);
    }
    return columns.filter((c) => c.jsType != null && types.indexOf(c.jsType) >= 0);
  }
</script>

<div class="flex flex-col gap-2">
  <div class="flex gap-2">
    {#each chartTypes as type}
      {@const selected = chartType == type}
      <button
        onclick={() => {
          chartType = type;
        }}
        title={type.description}
        class="rounded-md border border-slate-300 dark:border-slate-600"
        class:!border-slate-500={selected}
        class:dark:!border-slate-400={selected}
        class:!bg-slate-300={selected}
        class:dark:!bg-slate-600={selected}
      >
        <PlotIcon type={type.icon} />
      </button>
    {/each}
  </div>

  <div>{chartType.description}</div>

  {#each chartType.ui as elem}
    {#if elem.field}
      {@const key = elem.field.key}
      <span class="text-slate-500 dark:text-slate-400">{elem.field.label}</span>
      <Select
        value={values[key] ?? null}
        onChange={(v) => (values[key] = v)}
        placeholder="(select field)"
        class="w-full"
        options={filteredColumns(elem.field.types).map((c) => ({
          value: c.name,
          label: `${c.name} (${c.type})`,
        }))}
      />
    {/if}
    {#if elem.text}
      {@const key = elem.text.key}
      <CodeEditor language="json" value={values[key]} onChange={(v) => (values[key] = v)} />
    {/if}
  {/each}
  <button
    class="px-2 mt-2 h-8 w-24 rounded-md text-white text-sm"
    class:bg-blue-500={validateResult === true}
    class:bg-gray-400={validateResult !== true}
    class:dark:bg-gray-600={validateResult !== true}
    onclick={confirm}
    disabled={validateResult !== true}>Confirm</button
  >
  {#if previewSpec != null}
    <span class="text-slate-500 dark:text-slate-400">Preview</span>
    {#key previewSpec}
      <PlotView table={table} filter={filter} spec={previewSpec} />
    {/key}
  {/if}
  {#if typeof validateResult == "string" && validateResult.trim() != ""}
    <div>{validateResult}</div>
  {/if}
</div>

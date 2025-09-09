<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import Select from "./widgets/Select.svelte";

  import type { ColumnDesc } from "./database_utils.js";
  import { renderersList } from "./renderers";

  interface Props {
    columns: ColumnDesc[];
    styles: Record<string, string>;
    onStylesChange: (value: Record<string, string>) => void;
  }

  let { columns, styles, onStylesChange }: Props = $props();

  function changeStyle(name: string, value: string | null | undefined) {
    let newStyles: Record<string, string> = {};
    for (let c of columns) {
      if (c.name == name) {
        if (value != null && value != "") {
          newStyles[c.name] = value;
        }
      } else if (styles[c.name]) {
        newStyles[c.name] = styles[c.name];
      }
    }
    onStylesChange(newStyles);
  }
</script>

<div class="max-h-48 overflow-x-hidden overflow-y-scroll border border-slate-200 dark:border-slate-600 p-2 rounded-md">
  <table>
    <tbody>
      {#each columns as column}
        <tr class="leading-10">
          <td class="w-full">
            <div class="max-w-80 whitespace-nowrap text-ellipsis overflow-x-hidden">{column.name}</div>
          </td>
          <td>
            <Select
              value={styles[column.name] ?? null}
              onChange={(v) => changeStyle(column.name, v)}
              options={[
                { value: null, label: "(default)" },
                ...renderersList.map((x) => ({ value: x.renderer, label: x.label })),
              ]}
            ></Select>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import { parseSpec } from "@uwdata/mosaic-spec";

  import CodeEditor from "../widgets/CodeEditor.svelte";

  import type { PlotSpec } from "./plot.js";

  interface Props {
    spec: PlotSpec;
    onCancel: () => void;
    onConfirm: (spec: PlotSpec) => void;
  }

  let { spec, onCancel, onConfirm }: Props = $props();

  let jsonText: string = $state(JSON.stringify(spec, null, 2));
  let errorMessage: string = $state("");

  $effect.pre(() => {
    errorMessage = testEditedSpec(jsonText) ?? "";
  });

  function testEditedSpec(text: string): string | null {
    try {
      let parsed = JSON.parse(text);
      if (!("component" in parsed)) {
        parseSpec(parsed);
      }
    } catch (e: any) {
      return e.toString();
    }
    return null;
  }

  function confirm() {
    let error = testEditedSpec(jsonText);
    if (error != null) {
      errorMessage = error;
      return;
    }
    onConfirm(JSON.parse(jsonText));
  }

  function cancel() {
    onCancel();
  }
</script>

<div class="pt-2">
  <CodeEditor language="json" value={jsonText} onChange={(v) => (jsonText = v)} className="mb-2" />
  <div class="flex gap-1 items-center">
    <div class="flex-1">
      <a class="underline pr-2" href="https://uwdata.github.io/mosaic/api/spec/format.html" target="_blank">
        Mosaic Spec Reference
      </a>
    </div>
    <button class="px-2 h-8 rounded-md bg-blue-500 text-white text-sm" onclick={confirm}>Confirm</button>
    <button class="px-2 h-8 rounded-md bg-slate-500 text-white text-sm" onclick={cancel}>Cancel</button>
  </div>
  <div>{errorMessage}</div>
</div>

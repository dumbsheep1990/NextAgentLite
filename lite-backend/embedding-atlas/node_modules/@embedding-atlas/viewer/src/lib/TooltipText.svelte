<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import { textRendererClasses } from "./renderers/index.js";

  interface Props {
    text?: string;
    renderer?: string;
  }

  let { text = "", renderer = "plain" }: Props = $props();

  let rendererClass = $derived(textRendererClasses[renderer] ?? null);

  function action(element: HTMLDivElement, props: { class: any; value: any }) {
    let component = new props.class(element, { value: props.value });
    return {
      update(props: { value: any }) {
        component.update?.({ value: props.value });
      },
      destroy() {
        component.destroy?.();
      },
    };
  }
</script>

{#if rendererClass == null}
  {text}
{:else}
  {#key rendererClass}
    <div use:action={{ class: rendererClass, value: text }}></div>
  {/key}
{/if}

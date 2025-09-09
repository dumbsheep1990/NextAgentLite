<!-- Copyright (c) 2025 Apple Inc. Licensed under MIT License. -->
<script lang="ts">
  import SvgSpinner from "~icons/svg-spinners/270-ring-with-bg";

  import Button from "./Button.svelte";

  import { IconClose } from "../icons.js";

  interface Props {
    label?: string | null;
    icon?: any | null;
    title?: string;
    order?: number | null;
    style?: string;
    class?: string | null;
    onClick?: () => Promise<void>;
  }

  let {
    label = null,
    icon = null,
    title = "",
    order = null,
    style = "default",
    onClick,
    class: additionalClasses,
  }: Props = $props();

  let state: "ready" | "running" | "error" = $state("ready");

  async function onClickButton() {
    if (!onClick) {
      return;
    }
    state = "running";
    try {
      await onClick();
      state = "ready";
    } catch (e) {
      state = "error";
    }
  }
</script>

<Button
  label={label}
  icon={state == "ready" ? icon : state == "running" ? SvgSpinner : IconClose}
  title={title}
  order={order}
  style={style}
  class={additionalClasses}
  onClick={onClickButton}
/>

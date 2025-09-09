// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import { getContext, setContext } from "svelte";
import type { Theme } from "../api/style.js";

export class StyleState {
  colorScheme: "light" | "dark" | null = $state(null);
  theme: Theme = $state({});
}

const STYLE_KEY = Symbol("style");

export class StyleContext {
  public static initialize() {
    setContext(STYLE_KEY, new StyleState());
  }

  public static get style(): StyleState {
    return getContext(STYLE_KEY);
  }
}

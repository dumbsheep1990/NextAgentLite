// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import type { PlotStateStore } from "./plot_state_store";

export function syncState<T>(store: PlotStateStore<T> | null | undefined, get: () => T, set: (value: T) => void) {
  let state = store;
  if (state == null) {
    return;
  }
  let cleanup = state.subscribe((value) => {
    if (value == null) {
      return;
    }
    set(value);
  });
  $effect.pre(() => {
    state.set(get());
  });
  return cleanup;
}

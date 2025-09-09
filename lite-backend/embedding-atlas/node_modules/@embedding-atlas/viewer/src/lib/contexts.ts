// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

// The set of Svelte contexts

import { type Coordinator, coordinator as defaultCoordinator } from "@uwdata/mosaic-core";
import { getContext, setContext } from "svelte";
import type { Readable } from "svelte/store";

const coordinatorKey = Symbol("coordinator");
const darkModeKey = Symbol("darkMode");

export class Context {
  static get coordinator(): Coordinator {
    return getContext(coordinatorKey) ?? defaultCoordinator();
  }

  static set coordinator(value: Coordinator) {
    setContext(coordinatorKey, value);
  }

  static get darkMode(): Readable<boolean> {
    return getContext(darkModeKey);
  }

  static set darkMode(value: Readable<boolean>) {
    setContext(darkModeKey, value);
  }
}

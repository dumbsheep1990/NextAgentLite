// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import type { Spec } from "@uwdata/mosaic-spec";
import { nanoid } from "nanoid";

export interface Plot {
  id: string;
  title: string;
  spec: PlotSpec | null; // null shows a chart builder UI
}

export interface ComponentSpec {
  component: string;
  props: Record<string, any>;
}

export type PlotSpec = Spec | ComponentSpec;

export function plotUniqueId(): string {
  return nanoid(14);
}

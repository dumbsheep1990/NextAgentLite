// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import { interpolateTurbo } from "d3-scale-chromatic";
export { defaultCategoryColors } from "@embedding-atlas/component";

export function defaultOrdinalColors(count: number): string[] {
  let result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(interpolateTurbo((i + 0.5) / count));
  }
  return result;
}

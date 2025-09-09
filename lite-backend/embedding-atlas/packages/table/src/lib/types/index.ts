// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

export type SortDirection = "ascending" | "descending";

export interface Sort {
  column: string;
  direction: SortDirection;
}

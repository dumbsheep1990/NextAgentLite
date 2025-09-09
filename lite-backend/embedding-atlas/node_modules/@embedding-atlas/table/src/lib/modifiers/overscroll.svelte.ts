// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import { ConfigContext } from "../context/config.svelte.js";
import type { TableController } from "../controllers/TableController.svelte.js";

export class OverscrollModifier {
  tableController: TableController;

  offset = $derived.by(() => {
    return (
      Math.floor(-this.tableController.yScroll / ConfigContext.config.scrollOverflowValue) *
      ConfigContext.config.scrollOverflowValue
    );
  });

  constructor(tableController: TableController) {
    this.tableController = tableController;
  }

  public y(y: number) {
    return y - this.offset;
  }

  public yScroll(yScroll: number) {
    return yScroll + this.offset;
  }
}

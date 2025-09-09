// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import { ConfigContext, type Config } from "../context/config.svelte.js";
import type { TableModel } from "../model/TableModel.svelte.js";
import type { TableController } from "./TableController.svelte.js";

export interface ColResizeControllerProps {
  tableModel: TableModel;
  tableController: TableController;
  col: string;
}

export class ColResizeController {
  tableModel: TableModel;
  tableController: TableController;
  col: string;
  config: Config;

  isDragging: boolean = false;
  startDragX: number | null = 0;

  constructor({ tableModel, tableController, col }: ColResizeControllerProps) {
    this.tableModel = tableModel;
    this.tableController = tableController;
    this.col = col;
    this.config = ConfigContext.config;
  }

  public handlePointerDown = (e: PointerEvent) => {
    e.preventDefault(); // prevents selection
    // @ts-ignore
    e.target.setPointerCapture(e.pointerId);
    this.isDragging = true;
    this.startDragX = e.offsetX;
  };

  public handlePointerMove = (e: PointerEvent) => {
    if (this.isDragging && this.startDragX !== null) {
      const dragDiff = e.offsetX - this.startDragX;
      const prevColWidth = this.tableModel.colWidths[this.col];
      const newColWidth = Math.max(0, Math.round(prevColWidth + dragDiff));
      if (!this.config.columnConfigs[this.col]) {
        this.config.columnConfigs[this.col] = {};
      }
      this.config.columnConfigs[this.col].width = newColWidth;
      this.config.onColumnConfigsChange(this.col, $state.snapshot(this.config.columnConfigs));
    }
  };

  public handlePointerUp = (e: PointerEvent) => {
    // @ts-ignore
    e.target.releasePointerCapture(e.pointerId);
    this.isDragging = false;
    this.startDragX = null;
  };
}

// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import type { TableModel } from "../model/TableModel.svelte.js";
import type { TableController } from "./TableController.svelte.js";

export interface HorizontalScrollbarControllerProps {
  tableModel: TableModel;
  tableController: TableController;
}

export class HorizontalScrollbarController {
  tableModel: TableModel;
  tableController: TableController;

  margin: number = 2;
  isDragging: boolean = false;
  lastDragX: number | null = 0;

  public elementWidth: number = $state(0);

  public scrollbarWidth: number = $derived(this.elementWidth - this.margin * 2);
  public pillWidth: number = $derived.by(() => {
    return (this.tableController.viewWidth / this.tableModel.colsRightmostPosition) * this.scrollbarWidth;
  });
  public pillLeft: number = $derived.by(() => {
    return (-this.tableController.xScroll / this.tableModel.colsRightmostPosition) * this.scrollbarWidth;
  });

  constructor({ tableModel, tableController }: HorizontalScrollbarControllerProps) {
    this.tableModel = tableModel;
    this.tableController = tableController;
  }

  public handlePointerDown = (e: PointerEvent) => {
    e.preventDefault(); // prevents selection
    // @ts-ignore
    e.target.setPointerCapture(e.pointerId);
    this.isDragging = true;
    this.lastDragX = e.offsetX;
  };

  public handlePointerMove = (e: PointerEvent) => {
    if (this.isDragging && this.lastDragX !== null) {
      this.tableController.scroll({ deltaX: e.offsetX - this.lastDragX, deltaY: 0 });
    }
  };

  public handlePointerUp = (e: PointerEvent) => {
    // @ts-ignore
    e.target.releasePointerCapture(e.pointerId);
    this.isDragging = false;
    this.lastDragX = null;
  };
}

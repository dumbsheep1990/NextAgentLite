// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import clamp from "lodash/clamp.js";
import throttle from "lodash/throttle.js";

import { ConfigContext } from "../context/config.svelte.js";
import type { TableModel } from "../model/TableModel.svelte.js";
import type { TableController } from "./TableController.svelte.js";

export interface VerticalScrollbarControllerProps {
  tableModel: TableModel;
  tableController: TableController;
}

export class VerticalScrollbarController {
  tableModel: TableModel;
  tableController: TableController;

  public isDragging: boolean = false;

  public elementHeight: number = $state(0);
  public labelHeight: number = $state(0);
  public pillHeight: number = $derived(ConfigContext.config.verticalScrollbarPillHeight);
  public scrollbarHeight: number = $derived(this.elementHeight - this.pillHeight);

  public displayRow: number = $derived.by(() => {
    if (this.tableController.firstVisibleRowOID) {
      return this.tableController.firstVisibleRowOID;
    } else {
      // use the table offset if nothing is visible
      return this.tableController.offset + 1;
    }
  });
  public pillPosition: number | null = $derived.by(() => {
    return ((this.displayRow - 1) / (this.tableModel.numRows - 1)) * this.scrollbarHeight;
  });
  public labelOffset: number = $derived.by(() => {
    if (this.pillPosition === null) {
      return 0;
    }
    const top = this.pillPosition + this.pillHeight / 2 - this.labelHeight / 2;
    if (top < 0) {
      return top;
    }

    const bottom = this.pillPosition + this.pillHeight / 2 + this.labelHeight / 2;
    if (bottom > this.elementHeight) {
      return bottom - this.elementHeight;
    }

    return 0;
  });

  constructor({ tableModel, tableController }: VerticalScrollbarControllerProps) {
    this.tableModel = tableModel;
    this.tableController = tableController;
  }

  private computeOffsetFromPointer = (e: PointerEvent): number => {
    this.isDragging = true;
    let offset = Math.round((e.offsetY / this.scrollbarHeight) * (this.tableModel.numRows - 1));
    return clamp(offset, 0, this.tableModel.numRows - 1);
  };

  private pointerDown = (e: PointerEvent) => {
    e.preventDefault(); // prevents selection
    // @ts-ignore
    e.target.setPointerCapture(e.pointerId);
    this.isDragging = true;
    const rowOffset = this.computeOffsetFromPointer(e);
    this.tableController.isJumping = true;
    this.tableController.jumpToOffset(rowOffset);
  };
  public handlePointerDown = throttle(this.pointerDown, 50);

  private pointerMove = (e: PointerEvent) => {
    if (this.isDragging) {
      const rowOffset = this.computeOffsetFromPointer(e);
      this.tableController.jumpToOffset(rowOffset);
    }
  };
  public handlePointerMove = throttle(this.pointerMove, 50);

  public handlePointerUp = (e: PointerEvent) => {
    // @ts-ignore
    e.target.releasePointerCapture(e.pointerId);
    this.isDragging = false;
    this.tableController.isJumping = false;
  };
}

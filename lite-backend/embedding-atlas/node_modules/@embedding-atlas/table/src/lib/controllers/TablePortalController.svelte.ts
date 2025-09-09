// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import { TableController } from "./TableController.svelte.js";

export type HorizontalAlign = "left" | "center" | "right";
export type VerticalAlign = "top" | "middle" | "bottom";
export type Anchor = "inside" | "outside";

export class TablePortalController {
  tableController: TableController;
  tableElement: HTMLElement | null = $derived.by(() => {
    return this.tableController.element;
  });

  constructor(tableController: TableController) {
    this.tableController = tableController;
  }

  mount(
    element: HTMLElement,
    relativeTo: HTMLElement,
    anchor: Anchor,
    horizontalAlign: HorizontalAlign,
    verticalAlign: VerticalAlign,
  ) {
    if (!this.tableElement) {
      return;
    }

    const relativeBox = relativeTo.getBoundingClientRect();
    const tableBox = this.tableElement.getBoundingClientRect();

    const yOffset = tableBox.top;
    const xOffset = tableBox.left;

    switch (anchor) {
      case "inside":
        switch (verticalAlign) {
          case "top":
            element.style.top = relativeBox.top - yOffset + "px";
            break;
          case "middle":
          case "bottom":
            throw new Error("not yet implemented" + anchor + verticalAlign);
        }

        switch (horizontalAlign) {
          case "left":
            element.style.left = relativeBox.left - xOffset + "px";
          case "center":
          case "right":
            throw new Error("not yet implemented" + anchor + horizontalAlign);
        }
        break;
      case "outside":
        switch (verticalAlign) {
          case "top":
            element.style.top = relativeBox.bottom - yOffset + "px";
            break;
          case "middle":
          case "bottom":
            throw new Error("not yet implemented" + anchor + verticalAlign);
        }

        switch (horizontalAlign) {
          case "left":
            element.style.left = relativeBox.left - xOffset + "px";
            break;
          case "center":
          case "right":
            throw new Error("not yet implemented" + anchor + horizontalAlign);
        }
        break;
    }

    this.tableElement.appendChild(element);
  }

  destroy(element: HTMLElement) {
    if (!this.tableElement) {
      return;
    }
    if (this.tableElement.contains(element)) {
      // need this check in case the browser has already removed the node
      // (it seems like when svelte builds this the behavior is different than in the dev environment)
      this.tableElement.removeChild(element);
    }
  }
}

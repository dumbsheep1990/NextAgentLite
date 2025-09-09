// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import type { Component } from "svelte";
import { createClassComponent } from "svelte/legacy";

export type CustomCellsConfig = { [col: string]: CustomCell };

export interface CustomCellProps {
  value: any;
  rowData: { [col: string]: any };
}

type CustomCellClass = new (
  node: HTMLElement,
  props: CustomCellProps,
) => { update?: (props: CustomCellProps) => void; destroy?: () => void };

export type CustomCell =
  | {
      class: CustomCellClass;
      props?: CustomCellProps;
    }
  | CustomCellClass;

export function createCustomCellClass<Props extends CustomCellProps>(Component: Component<Props>): any {
  return class {
    private component: any;

    constructor(target: HTMLDivElement, props: Props) {
      this.component = createClassComponent({ component: Component, target: target, props: props });
    }

    update(props: Partial<Props>) {
      this.component.$set(props);
    }

    destroy() {
      this.component.$destroy();
    }
  };
}

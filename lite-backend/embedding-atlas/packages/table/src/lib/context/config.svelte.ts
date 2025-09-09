// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import { getContext, setContext } from "svelte";

export interface Config {
  headerHeight: number | null; // null will use auto height
  columnConfigs: ColumnConfigs;
  onColumnConfigsChange: ColumnConfigChangeCallback;
  minColumnWidths: ColumnWidthsConfig;
  rowRenderBatchSize: number;
  minFetchSize: number;
  renderWindowOffset: number;
  verticalScrollbarPillHeight: number;
  verticalScrollbarWidth: number;
  horizontalScrollbarHeight: number;
  lineHeight: number;
  textMaxLines: number;
  betweenRowPadding: number;
  betweenColPadding: number;
  scrollOverflowValue: number;
  onRowClick: RowClickCallback | null;
  highlightedRows: Set<string> | null;
  firstColLeftPadding: number;
  showRowNumber: boolean | null;
  onShowRowNumberChange: ((showRowNumber: boolean) => void) | null;
  highlightHoveredRow: boolean;

  get rowHeight(): number;

  DEFAULT_TEXT_MAX_LINES: number;
  DEFAULT_LINE_HEIGHT: number;
  DEFAULT_ROW_NUMBER_COL_WIDTH: number;
}

export type ColumnWidthsConfig = {
  [column: string]: number | null;
};

export type ColumnTitlesConfig = {
  [column: string]: string;
};

export type ColumnResizeCallback = (column: string, newWidth: number) => void;

export type ColumnConfig = {
  title?: string;
  width?: number;
  hidden?: boolean;
};

export type ColumnConfigs = {
  [column: string]: ColumnConfig;
};

export type ColumnConfigChangeCallback = (column: string, newConfigs: ColumnConfigs) => void;

export type RowClickCallback = (rowId: string) => void;

export const DEFAULT_CONFIG = {
  headerHeight: null,
  columnConfigs: {},
  onColumnConfigsChange: () => {},
  minColumnWidths: {},
  rowRenderBatchSize: 4,
  minFetchSize: 1,
  renderWindowOffset: 400,
  verticalScrollbarPillHeight: 4,
  verticalScrollbarWidth: 24,
  horizontalScrollbarHeight: 16,
  lineHeight: 20,
  textMaxLines: 3,
  betweenRowPadding: 8,
  betweenColPadding: 24,
  scrollOverflowValue: 1000000, // keep this below chrome's maximum translate value
  onRowClick: null,
  highlightedRows: null,
  firstColLeftPadding: 8,
  showRowNumber: true,
  onShowRowNumberChange: () => {},
  highlightHoveredRow: false,

  get rowHeight() {
    return this.textMaxLines * this.lineHeight + this.betweenRowPadding;
  },

  DEFAULT_TEXT_MAX_LINES: 3,
  DEFAULT_LINE_HEIGHT: 20,
  DEFAULT_ROW_NUMBER_COL_WIDTH: 60,
};

export class ConfigState {
  config: Config = $state(DEFAULT_CONFIG);
}

const CONFIG_KEY = Symbol("config");

export class ConfigContext {
  public static initialize() {
    setContext(CONFIG_KEY, new ConfigState());
  }

  public static get config(): Config {
    const configState: ConfigState = getContext(CONFIG_KEY);
    if (configState == null) {
      throw new Error("config context not yet set");
    }
    return configState.config;
  }
}

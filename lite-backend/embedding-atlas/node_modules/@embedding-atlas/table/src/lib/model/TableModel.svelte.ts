// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import { ConfigContext } from "../context/config.svelte.js";
import type { Schema } from "./Schema.svelte.js";

export type TableData = { [rowId: string]: any };
export type RowPositions = { [rowId: string]: number };
export type ColPositions = { [colId: string]: number };
export type RowHeights = { [rowId: string]: number };
export type ColWidths = { [colId: string]: number };
export type OIDToRow = { [oid: number]: string };

export const OID = "__oid";
export const KEY = "__key";
export const DEFAULT_COL_WIDTH = 120;

export interface Cell {
  row: string;
  col: string;
}

export class TableModel {
  schema: Schema;

  data: TableData = $state({});
  defaultColWidths: ColWidths = $state({});
  public columns: string[] = $state([]);
  public numRows: number = $state(0);
  public renderOffset = $state(0);
  public rowHeightAddition: RowHeights = $state({});
  public hiddenColumns = $derived.by(() => {
    return this.columns.reduce((set: Set<string>, col) => {
      if (ConfigContext.config.columnConfigs[col]?.hidden) {
        set.add(col);
      }

      if (col === OID && ConfigContext.config.showRowNumber === false) {
        set.add(OID);
      }
      return set;
    }, new Set<string>());
  });

  rowKeyColumn: string | null = null;

  constructor(schema: Schema) {
    this.schema = schema;
  }

  public renderableRows: string[] = $derived(
    Object.keys(this.data).sort((a, b) => this.data[a][OID] - this.data[b][OID]),
  );
  public renderableCols: string[] = $derived.by(() => {
    return this.columns.filter((c) => !this.hiddenColumns.has(c));
  });
  public minRowPosition: number = $derived.by(() => {
    if (this.renderableRows.length === 0) {
      return this.zeroRowPosition;
    }
    return Math.min(...this.renderableRows.map((row) => this.rowPositions[row]));
  });
  public maxRowPosition: number = $derived.by(() => {
    if (this.renderableRows.length === 0) {
      return this.finalRowPosition;
    }
    return Math.max(...this.renderableRows.map((row) => this.rowPositions[row]));
  });
  public minRowOID: number = $derived.by(() => {
    const min = Math.min(...this.renderableRows.map((row) => this.data[row][OID]));
    return Number.isSafeInteger(min) ? min : 0;
  });
  public maxRowOID: number = $derived.by(() => {
    const max = Math.max(...this.renderableRows.map((row) => this.data[row][OID]));
    return Number.isSafeInteger(max) ? max : 0;
  });
  public zeroRowPosition: number = $derived.by(() => {
    return 0;
  });
  public finalRowPosition: number = $derived.by(() => {
    return (this.numRows - 1) * ConfigContext.config.rowHeight + this.rowPositionOffsets.cumulative;
  });

  public colsLeftmostPosition: number = 0;
  public colsRightmostPosition: number = $derived.by(() => {
    const lastCol = this.renderableCols[this.renderableCols.length - 1];
    return this.colPositions[lastCol] + this.colWidths[lastCol];
  });

  rowPositionOffsets: { offsets: RowPositions; cumulative: number } = $derived.by(() => {
    return this.renderableRows.reduce(
      ({ offsets, cumulative }: { offsets: RowPositions; cumulative: number }, row) => {
        offsets[row] = cumulative;
        const offset = this.rowHeightAddition[row] ?? 0;
        return { offsets, cumulative: cumulative + offset };
      },
      { offsets: {}, cumulative: 0 },
    );
  });
  rowPositions: RowPositions = $derived.by(() => {
    return this.renderableRows.reduce((positions: RowPositions, row) => {
      const d = this.data[row];
      const oid = d[OID];
      const y = (oid - 1) * ConfigContext.config.rowHeight + this.rowPositionOffsets.offsets[row];
      positions[row] = y;
      return positions;
    }, {});
  });
  colPositions: ColPositions = $derived.by(() => {
    let x = 0;
    return this.columns.reduce((positions: ColPositions, col, i) => {
      if (!this.hiddenColumns.has(col)) {
        positions[col] = x;
        x += this.colWidths[col];
      }

      return positions;
    }, {});
  });
  rowHeights: RowHeights = $derived.by(() => {
    return this.renderableRows.reduce((heights: RowHeights, row) => {
      heights[row] = ConfigContext.config.rowHeight + (this.rowHeightAddition[row] ?? 0);
      return heights;
    }, {});
  });
  colWidths: ColWidths = $derived.by(() => {
    return this.columns.reduce((widths: ColWidths, col, i) => {
      widths[col] = Math.max(
        ConfigContext.config.columnConfigs[col]?.width ?? this.defaultColWidths[col] ?? DEFAULT_COL_WIDTH,
        ConfigContext.config.minColumnWidths[col] ?? 0,
      );
      if (this.isFirstCol(col)) {
        widths[col] += ConfigContext.config.firstColLeftPadding; // leave room for the column selector
      }
      if (this.isLastCol(col)) {
        // add the vertical scrollbar width to the last column
        widths[col] += ConfigContext.config.verticalScrollbarWidth;
      }
      return widths;
    }, {});
  });

  getContent<T>({ row, col }: Cell): T | null {
    if (this.data[row]) {
      return this.data[row][col];
    }

    return null;
  }

  getRowData(row: string): any | null {
    if (this.data[row]) {
      return this.data[row];
    }

    return null;
  }

  getPosition({ row, col }: Cell): { x: number; y: number } {
    const x = this.colPositions[col];
    const y = this.rowPositions[row];
    return { x, y };
  }

  getDimensions({ row, col }: Cell): { width: number; height: number } {
    const width = this.colWidths[col];
    const height = this.rowHeights[row];

    return { width, height };
  }

  getRowParity(row: string): "even" | "odd" {
    if (this.data[row]) {
      return this.data[row][OID] % 2 === 0 ? "even" : "odd";
    }

    return "odd";
  }

  isFirstCol(col: string): boolean {
    return this.renderableCols.indexOf(col) === 0;
  }

  isLastCol(col: string): boolean {
    return this.renderableCols.indexOf(col) === this.renderableCols.length - 1;
  }

  // Deletes the given row and returns the offset necessary to remove from scroll position.
  deleteRow(row: string): number {
    delete this.data[row];
    const heightRemoval = this.rowHeightAddition[row] ?? 0;
    delete this.rowHeightAddition[row];
    return heightRemoval;
  }

  collapseRow(row: string): number {
    const heightRemoval = this.rowHeightAddition[row] ?? 0;
    delete this.rowHeightAddition[row];
    return heightRemoval;
  }

  reset() {
    this.data = {};
    this.rowHeightAddition = {};
  }

  teardown() {
    this.reset();
  }
}

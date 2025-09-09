// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import type { JSType } from "@uwdata/mosaic-core";

import type { ColumnInfo } from "../mosaic-clients/RowsClient.js";

export type ColumnDataType = { [column: string]: JSType };
export type ColumnSqlType = { [column: string]: string };

export class Schema {
  public columnInfo: ColumnInfo | null = $state(null);
  public dataType: ColumnDataType = $derived.by(() => {
    if (!this.columnInfo) {
      return {};
    }

    return Object.keys(this.columnInfo).reduce((dict: ColumnDataType, c) => {
      dict[c] = this.columnInfo![c].type;
      return dict;
    }, {});
  });
  public sqlType: ColumnSqlType = $derived.by(() => {
    if (!this.columnInfo) {
      return {};
    }

    return Object.keys(this.columnInfo).reduce((dict: ColumnSqlType, c) => {
      dict[c] = this.columnInfo![c].sqlType;
      return dict;
    }, {});
  });
}

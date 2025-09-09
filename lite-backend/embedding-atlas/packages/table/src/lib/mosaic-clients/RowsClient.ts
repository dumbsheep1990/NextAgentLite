// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import type { FieldInfo } from "@uwdata/mosaic-core";
import { MosaicClient, queryFieldInfo, Selection } from "@uwdata/mosaic-core";
import { cast, column, desc, Query, row_number } from "@uwdata/mosaic-sql";

import type { Sort } from "../types/index.js";

type ResultCallback = (data: any[]) => void;
type ColumnInfoCallback = (columnInfo: ColumnInfo) => void;

export const OID = "__oid";
export const KEY = "__key";

export type ColumnInfo = { [column: string]: FieldInfo };

export class RowsClient extends MosaicClient {
  tableName: string;
  columns: string[];
  onResult: ResultCallback;
  onColumnInfo: ColumnInfoCallback;

  limit: number = 20;
  offset: number = 0;

  sort: Sort | null = null;
  info: FieldInfo[] | null = null;
  columnInfo: ColumnInfo | null = null;
  isReady: boolean = false;

  constructor(
    tableName: string,
    columns: string[],
    filterBy: Selection | null,
    onResult: ResultCallback,
    onColumnInfo: ColumnInfoCallback,
  ) {
    super(filterBy ?? undefined);
    this.tableName = tableName;
    this.columns = columns;
    this.onResult = onResult;
    this.onColumnInfo = onColumnInfo;
  }

  async prepare() {
    if (this.coordinator == null) {
      return;
    }
    let info = await queryFieldInfo(this.coordinator, [{ table: this.tableName, column: "*" }]);
    const columnInfo = info.reduce((dict: ColumnInfo, f) => {
      dict[f.column] = f;
      return dict;
    }, {});
    this.columnInfo = columnInfo;
    this.onColumnInfo(columnInfo);
    this.isReady = true;
  }

  public getSelect({ includeRowNumber }: { includeRowNumber: boolean } = { includeRowNumber: true }) {
    const select = this.columns.reduce((dict: any, col) => {
      if (this.columnInfo?.[col]?.sqlType === "BIGINT") {
        dict[col] = cast(column(col), "TEXT");
      } else {
        dict[col] = column(col);
      }
      return dict;
    }, {});

    if (!includeRowNumber) {
      delete select[OID];
    }

    return select;
  }

  queryResult(data: any): this {
    this.onResult(data);
    return this;
  }

  query(filter: any = []): any {
    if (!this.isReady) {
      return null;
    }

    const select = this.columns.reduce((dict: any, col) => {
      if (this.columnInfo?.[col]?.sqlType === "BIGINT") {
        dict[col] = cast(column(col), "TEXT");
      } else {
        dict[col] = column(col);
      }
      return dict;
    }, {});

    select[OID] = row_number();

    if (this.sort) {
      const orderby = this.sort.direction === "ascending" ? this.sort.column : desc(this.sort.column);
      select[OID] = select[OID].orderby(orderby);
    }

    const query = Query.from(this.tableName).select(select).where(filter).limit(this.limit).offset(this.offset);

    return query;
  }

  fetchRows(offset: number, limit: number) {
    this.offset = offset;
    this.limit = limit;
    this.requestUpdate();
  }
}

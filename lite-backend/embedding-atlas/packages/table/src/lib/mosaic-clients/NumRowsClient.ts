// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import { MosaicClient, Selection } from "@uwdata/mosaic-core";
import { count, Query } from "@uwdata/mosaic-sql";

type ResultCallback = (count: number) => void;

export class NumRowsClient extends MosaicClient {
  tableName: string;
  onResult: ResultCallback;

  constructor(tableName: string, filterBy: Selection | null, onResult: ResultCallback) {
    super(filterBy ?? undefined);
    this.tableName = tableName;
    this.onResult = onResult;
  }

  queryResult(data: any): this {
    const arr = data.toArray();
    const count = arr[0]["count"];
    this.onResult(count);
    return this;
  }

  query(filter: any = []): any {
    const query = Query.from(this.tableName).select({ count: count() }).where(filter);
    return query;
  }
}

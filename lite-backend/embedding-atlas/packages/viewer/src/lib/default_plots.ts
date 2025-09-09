// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import type { Coordinator } from "@uwdata/mosaic-core";
import { TableInfo } from "./database_utils";

/** Returns a list of default plots for a given data table. */
export async function defaultPlots(
  coordinator: Coordinator,
  table: string,
  excludeColumns: string[] = [],
): Promise<{ id: string; title: string; spec: any }[]> {
  let tableInfo = new TableInfo(coordinator, table);
  let columns = await tableInfo.columnDescriptions();
  return tableInfo.defaultPlots(columns.filter((x) => excludeColumns.indexOf(x.name) < 0));
}

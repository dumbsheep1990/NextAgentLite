// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import { column, literal, sql } from "@uwdata/mosaic-sql";

import type { Rectangle } from "../utils.js";
import { stopWords } from "./stop_words.js";

/** A text summarizer based on c-TF-IDF, all implemented as SQL queries. */
export class TextSummarizer {
  private coordinator: any;
  private tableName: string;
  private xColumn: string;
  private yColumn: string;
  private textColumn: string;
  private derivedTableDF: string;
  private derivedTableBins: string;
  private initialized: boolean;
  private xBinSize: number;
  private yBinSize: number;
  private x0: number;
  private y0: number;

  constructor(options: { coordinator: any; table: string; text: string; x: string; y: string }) {
    this.coordinator = options.coordinator;
    this.tableName = options.table;
    this.xColumn = options.x;
    this.yColumn = options.y;
    this.textColumn = options.text;

    this.derivedTableDF = this.tableName + "_df";
    this.derivedTableBins = this.tableName + "_bt";
    this.initialized = false;
    this.xBinSize = 1;
    this.yBinSize = 1;
    this.x0 = 0;
    this.y0 = 0;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    let xColumn = column(this.xColumn);
    let yColumn = column(this.yColumn);
    let textColumn = column(this.textColumn);

    let r = await this.coordinator.query(sql`
      SELECT
        MIN(${xColumn}) AS xMin, QUANTILE_CONT(${xColumn}, 0.99) - QUANTILE_CONT(${xColumn}, 0.01) AS xDiff,
        MIN(${yColumn}) AS yMin, QUANTILE_CONT(${yColumn}, 0.99) - QUANTILE_CONT(${yColumn}, 0.01) AS yDiff,
        COUNT(*) AS count
      FROM ${this.tableName}
    `);
    let { xMin, yMin, xDiff, yDiff, count } = r.get(0);

    this.x0 = xMin;
    this.y0 = yMin;
    this.xBinSize = xDiff / 200;
    this.yBinSize = yDiff / 200;
    let minCount = count < 10000 ? 1 : 5;
    await this.coordinator.exec(sql`

    `);
    await this.coordinator.exec(sql`
      CREATE OR REPLACE TEMP MACRO embedding_view_tokenize(s) AS
        unnest(string_split_regex(regexp_replace(lower(s), '[^a-z0-9'']', ' ', 'g'), '\\s+'));

      CREATE OR REPLACE TABLE ${this.derivedTableBins} AS (
        WITH tokens_all AS (
          SELECT
            floor((${xColumn} - ${this.x0}) / ${this.xBinSize})::INT + 32768 * (floor((${yColumn} - ${this.y0}) / ${this.yBinSize})::INT) as xykey,
            embedding_view_tokenize(${textColumn}) AS token
          FROM ${this.tableName}
        )
        SELECT xykey, token, COUNT(*) AS count
        FROM tokens_all
        WHERE token NOT IN ('',${stopWords.map((x) => literal(x)).join(",")}) AND LENGTH(token) >= 3
        GROUP BY xykey, token
        HAVING count >= ${minCount}
      );
      CREATE OR REPLACE TABLE ${this.derivedTableDF} AS (
        SELECT sum(count) AS count, stem(token, 'english') AS stem_token
        FROM ${this.derivedTableBins} GROUP BY stem_token
      );
    `);
    this.initialized = true;
  }

  private indices(rects: Rectangle[]): number[] {
    let keys = new Set<number>();
    for (let { xMin, yMin, xMax, yMax } of rects) {
      let xiLowerBound = Math.floor((xMin - this.x0) / this.xBinSize);
      let xiUpperBound = Math.floor((xMax - this.x0) / this.xBinSize);
      let yiLowerBound = Math.floor((yMin - this.y0) / this.yBinSize);
      let yiUpperBound = Math.floor((yMax - this.y0) / this.yBinSize);
      for (let xi = xiLowerBound; xi <= xiUpperBound; xi++) {
        for (let yi = yiLowerBound; yi <= yiUpperBound; yi++) {
          let p = yi * 32768 + xi;
          keys.add(p);
        }
      }
    }
    return Array.from(keys);
  }

  async summarize(rects: Rectangle[], limit: number = 4): Promise<string[]> {
    await this.initialize();
    let indices = this.indices(rects);
    let q = sql`
      WITH tokens_tf AS (
        SELECT token, sum(count) AS count
        FROM ${this.derivedTableBins}
        WHERE xykey IN (${indices.join(",")})
        GROUP BY token
      ),
      tokens_tf_stem AS (
        SELECT sum(count) AS count, stem(token, 'english') AS stem_token, ARG_MAX(token, count) AS token
        FROM tokens_tf
        GROUP BY stem_token
      )
      SELECT
        tokens_tf_stem.count AS tf,
        ${this.derivedTableDF}.count AS df,
        tf * log(1 + (SELECT sum(count) FROM tokens_tf_stem) / df) AS tfidf,
        tokens_tf_stem.token AS token
      FROM ${this.derivedTableDF}, tokens_tf_stem
      WHERE ${this.derivedTableDF}.stem_token == tokens_tf_stem.stem_token
      ORDER BY tfidf DESC limit ${limit}
    `;
    // TODO: try to directly call the DuckDB instance to see if perf is better.
    let result = await this.coordinator.query(q);
    let list = result.getChild("token").toArray();
    return list;
  }
}

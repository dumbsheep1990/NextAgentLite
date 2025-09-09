// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import quickselect from "quickselect";

export function median(values: Float32Array): number {
  let temp = new Float32Array(values);
  let middleIndex = Math.floor(values.length / 2);
  quickselect(temp as any, middleIndex);
  return temp[middleIndex];
}

export function mean(values: Float32Array): number {
  if (values.length == 0) {
    return 0;
  }
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stdev(values: Float32Array): number {
  if (values.length == 0) {
    return 0;
  }
  let m = mean(values);
  return Math.sqrt(values.reduce((a, b) => a + (b - m) * (b - m)) / values.length);
}

export function approximateDensity2D(
  x: Float32Array,
  y: Float32Array,
  binWidth: number,
  xBinStart: number = 0,
  yBinStart: number = 0,
): number {
  let keyData = new ArrayBuffer(8);
  let i32View = new Uint32Array(keyData);
  let u64View = new BigUint64Array(keyData);
  let map = new Map<bigint, number>();
  for (let i = 0; i < x.length; i++) {
    i32View[0] = Math.floor((x[i] - xBinStart) / binWidth);
    i32View[1] = Math.floor((y[i] - yBinStart) / binWidth);
    let key = u64View[0];
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  let maxValue: number = 0;
  for (let value of map.values()) {
    maxValue = Math.max(value, maxValue);
  }
  return maxValue / (binWidth * binWidth);
}

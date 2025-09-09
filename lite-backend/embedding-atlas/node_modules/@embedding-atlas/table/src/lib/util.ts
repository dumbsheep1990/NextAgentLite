// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

export function diff<T>(left: T[], right: T[]): { left: T[]; right: T[] } {
  const leftSet = new Set(left);
  const rightSet = new Set(right);

  return {
    left: left.filter((element) => !rightSet.has(element)),
    right: right.filter((element) => !leftSet.has(element)),
  };
}

export function remove<T>(arr: T[], toRemove: T[]): T[] {
  const removeSet = new Set(toRemove);
  return arr.filter((element) => !removeSet.has(element));
}

export function add<T>(arr: T[], toAdd: T[]): T[] {
  return arr.concat(toAdd);
}

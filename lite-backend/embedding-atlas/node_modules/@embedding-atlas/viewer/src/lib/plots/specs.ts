// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import type { PlotSpec } from "./plot.js";

export interface Field {
  name: string;
  type: "continuous" | "discrete" | "discrete[]";
}

export function makeHistogram(field: Field): PlotSpec {
  return {
    component: "Histogram",
    props: { field: field.name, binCount: 20 },
  };
}

export function makeCountPlot(field: Field): PlotSpec {
  if (field.type == "discrete[]") {
    return {
      component: "ListCountPlot",
      props: { field: field.name },
    };
  } else {
    return {
      component: "CountPlot",
      props: { field: field.name },
    };
  }
}

export function makeHistogramStack(x: Field, group: Field): PlotSpec {
  return {
    component: "HistogramStack",
    props: { xField: x.name, groupField: group.name, xBinCount: 20, groupBinCount: 5 },
  };
}

export function makeHistogram2D(x: Field, y: Field): PlotSpec {
  return {
    component: "Histogram2D",
    props: { xField: x.name, yField: y.name, xBinCount: 20, yBinCount: 20 },
  };
}

export function makeBoxPlot(x: Field, y: Field): PlotSpec {
  return {
    component: "BoxPlot",
    props: { xField: x.name, yField: y.name, xBinCount: 20 },
  };
}

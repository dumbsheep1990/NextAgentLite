// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import type { CustomCell } from "@embedding-atlas/table";

import { ImageRenderer } from "./image.js";
import { JSONRenderer } from "./json.js";
import { MarkdownRenderer } from "./markdown.js";
import { URLRenderer } from "./url.js";

export let textRendererClasses: Record<string, any> = {
  markdown: MarkdownRenderer,
  image: ImageRenderer,
  url: URLRenderer,
  json: JSONRenderer,
};

export let renderersList = [
  { renderer: "markdown", label: "Markdown" },
  { renderer: "image", label: "Image" },
  { renderer: "url", label: "Link" },
  { renderer: "json", label: "JSON" },
];

function resolveRenderer(value: string | CustomCell | null | undefined) {
  if (value == null || value == "plain") {
    return undefined;
  }
  if (typeof value == "string") {
    return textRendererClasses[value];
  }
  return value; // value is a CustomCell
}

export function makeCustomCellRenderers(
  renderers: Record<string, string>,
  tableCellRenderers: Record<string, string | CustomCell> | null | undefined,
) {
  let result: Record<string, any> = {};
  if (tableCellRenderers != null) {
    for (let column in tableCellRenderers) {
      result[column] = resolveRenderer(tableCellRenderers[column]);
    }
  }
  for (let column in renderers) {
    if (renderers[column] != null) {
      result[column] = resolveRenderer(renderers[column]);
    }
  }
  return result;
}

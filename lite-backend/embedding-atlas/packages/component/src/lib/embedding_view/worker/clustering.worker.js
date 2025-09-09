// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import { dynamicLabelPlacement, findClusters } from "./worker_functions.js";

onmessage = async (msg) => {
  if (msg.data.name == "findClusters") {
    let args = msg.data.payload;
    let clusters = await findClusters(args.density_map, args.width, args.height, args.options);
    postMessage({ id: msg.data.id, payload: clusters });
  }
  if (msg.data.name == "dynamicLabelPlacement") {
    let args = msg.data.payload;
    let result = dynamicLabelPlacement(args.labels, args.options);
    postMessage({ id: msg.data.id, payload: result });
  }
};

postMessage({
  ready: true,
});

export {};

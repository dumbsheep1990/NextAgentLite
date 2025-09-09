// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import * as React from "react";
import { useState, useEffect } from "react";
import { Coordinator, wasmConnector } from "@uwdata/mosaic-core";

import { EmbeddingAtlas } from "embedding-atlas/react";
import { createSampleDataTable } from "../sample_datasets";

export default function Component() {
  let [coordinator, _] = useState(() => new Coordinator());
  let [ready, setReady] = useState(false);

  useEffect(() => {
    async function initialize() {
      const wasm = await wasmConnector();
      coordinator.databaseConnector(wasm);
      await createSampleDataTable(coordinator, "dataset", 100000);
      setReady(true);
    }
    initialize();
  }, []);

  if (ready) {
    return (
      <div className="w-full h-full">
        <EmbeddingAtlas
          coordinator={coordinator}
          table="dataset"
          idColumn="id"
          textColumn="text"
          projectionColumns={{ x: "x", y: "y" }}
        />
      </div>
    );
  } else {
    return <p>Initializing dataset...</p>;
  }
}

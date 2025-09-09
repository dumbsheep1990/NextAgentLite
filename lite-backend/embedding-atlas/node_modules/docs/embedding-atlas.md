# EmbeddingAtlas

The `embedding-atlas` package contains a component for the entire frontend user interface of Embedding Atlas.

```
npm install embedding-atlas
```

To use the React wrapper:

```js
import { EmbeddingAtlas } from "embedding-atlas/react";

<EmbeddingAtlas
  table="data_table"
  ...
/>
```

To use the Svelte wrapper:

```js
import { EmbeddingAtlas } from "embedding-atlas/svelte";

<EmbeddingAtlas
  table="data_table"
  ...
/>
```

If your application does not use React or Svelte, you may directly construct the component:

```js
import { EmbeddingAtlas } from "embedding-atlas";

let target = document.getElementById("container");
let props = {
  table: "data_table",
  // ...
};

// Create and mount the component
let component = new EmbeddingAtlas(target, props);

// Update with new props
component.update(newProps);

// Destroy the component
component.destroy();
```

## Properties

The view can be configured with the following properties (props):

### coordinator `Coordinator`

Required. The Mosaic coordinator.

### table `string`

Required. The name of the data table.

### idColumn `string`

Required. The column for unique row identifiers.

### projectionColumns `{ x: string; y: string } | null`

The X and Y columns for the embedding projection view.

### neighborsColumn `string | null`

The column for pre-computed nearest neighbors.
Each value in the column should be a dictionary with the format: `{ "ids": [id1, id2, ...], "distances": [distance1, distance2, ...] }`.
`"ids"` should be an array of row ids (as given by the `idColumn`) of the neighbors, sorted by distance.
`"distances"` should contain the corresponding distances to each neighbor.
Note that if `searcher.nearestNeighbors` is specified, the UI will use the searcher instead.

### textColumn `string | null`

The column for text. The text will be used as content for the tooltip and search features.

### colorScheme `"light" | "dark" | null`

The color scheme.

### initialState `EmbeddingAtlasState | null`

The initial viewer state.

### searcher `Searcher | null`

An object that provides search functionalities, including full text search, vector search, and nearest neighbor queries.
If not specified (undefined), a default full-text search with the text column will be used.
If set to null, search will be disabled.

### automaticLabels `boolean | null`

Set to true to enable automatic labels for the embedding.

### cache `Cache | null`

A cache to speed up initialization of the viewer.

### tableCellRenderers `Record<string, CustomCell | "markdown">`;

Custom cell renderers for the table view.

### onExportSelection `((predicate: string | null, format: string) => Promise<void>) | null`

A callback to export the currently selected points.

### onExportApplication `(() => Promise<void>) | null`

A callback to download the application as archive.

### onStateChange `((state: EmbeddingAtlasState) => void) | null`

A callback when the state of the viewer changes. You may serialize the state to JSON and load it back.

## State

The `EmbeddingAtlasState` interface describes the state of the Embedding Atlas UI.

You may set `initialState` to a previously-saved state value to reload the UI to its previous state.

Fields of the state:

- `version`: The version of Embedding Atlas that created this state
- `timestamp`: UNIX timestamp when this state was created
- `plots`: The list of charts in the UI. Each chart contains a randomly-generated ID, a title, and a JSON specification.
- `predicate`: The SQL predicate of the current selection from the `state.predicate` field.

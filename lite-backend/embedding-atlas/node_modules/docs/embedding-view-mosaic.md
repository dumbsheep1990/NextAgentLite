# EmbeddingViewMosaic

The `embedding-atlas` package contains a component for displaying up to a few millions of points from an embedding with x and y coordinates.
The component connects to a [Mosaic](https://idl.uw.edu/mosaic/) coordinator and can display data for specified table and x, y coordinate columns.

We also provide React and Svelte wrappers of the component to easily include it in your own application.

<p class="light-only"><img style="margin: 0 auto;" src="./assets/component-light.png" /></p>
<p class="dark-only"><img style="margin: 0 auto;" src="./assets/component-dark.png" /></p>

```
npm install embedding-atlas
```

To use the React wrapper:

```js
import { EmbeddingViewMosaic } from "embedding-atlas/react";

<EmbeddingViewMosaic
  table="data_table"
  x="x_column"
  y="y_column"
  category="category_column"
  text="text_column"
  identifier="identifier_column"
  filter={brush}
  ...
/>
```

To use the Svelte wrapper:

```js
import { EmbeddingViewMosaic } from "embedding-atlas/svelte";

<EmbeddingViewMosaic
  table="data_table"
  x="x_column"
  y="y_column"
  category="category_column"
  text="text_column"
  identifier="identifier_column"
  filter={brush}
  ...
/>
```

If your application does not use React or Svelte, you may directly construct the component:

```js
import { EmbeddingViewMosaic } from "embedding-atlas";

let target = document.getElementById("container");
let props = {
  table: "data_table",
  x: "x_column",
  y: "y_column",
  category: "category_column",
  text: "text_column",
  identifier: "identifier_column",
  filter: brush,
  onTooltip: (value) => {
    // ...
  },
};

// Create and mount the component
let component = new EmbeddingViewMosaic(target, props);

// Update with new props
component.update(newProps);

// Destroy the component
component.destroy();
```

## Properties

The view can be configured with the following properties (props):

### coordinator `Coordinator`

The Mosaic coordinator (if not specified, the default coordinator from Mosaic's `coordinator()` method will be used).

### table `string`

Required. The name of the data table.

### x, y `string`

Required. The names of the x and y columns.

### text `string | null`

The name of the text column. If specified, the default tooltip shows the text content.
The text content is also used to generate labels when `automaticLabels` is set to `true`.

### category `string | null`

The name of the category column. The categories should be represented as integers starting from 0. If you have categories represented as strings, you should first convert them to 0-indexed integers.

### identifier `string | null`

The name of the identifier (aka., id) column. If specified, the `selection` object will contain an `identifier` property that you can use to identify the point.

### categoryColors `string[] | null`

The colors for the categories. Category `i` will use the `i`-th color from this list. If not specified, default colors will be used.

### filter `Selection | null`

A Mosaic `Selection` object to filter the contents of this view.

### tooltip `Selection | DataPoint | DataPointID | null`

The current tooltip. The tooltip is an object with the following fields: `x`, `y`, `category`, `text`, `identifier`.

You may pass the identifier for the data point (`DataPointID`), or a `DataPoint` object, or a Mosaic `Selection`. If an id or a `DataPoint` object is specified, you will need to use `onTooltip` to listen to tooltip changes; if a Mosaic `Selection` is used, the selection will be updated when tooltip is triggered.

### selection `Selection | DataPoint[] | DataPointID[] | null`

The current single or multiple point selection.

You may pass an array of `DataPointID` or `DataPoint` objects, or a Mosaic `Selection`. If `DataPointID[]` or `DataPoint[]` is specified, you will need to use `onSelection` to listen to selection changes; if a Mosaic `Selection` is used, the selection will be updated with the appropriate predicates.

### rangeSelection `Selection | null`

A Mosaic `Selection` object to capture the component's range selection.

### rangeSelectionValue `Rectangle | Point[] | null`

The rectangle or polygon that drives the range selection. Setting this changes the current
range selection and also affects the selection passed in `rangeSelection`.

Use `onRangeSelection` to listen for changes to this rectangle.

### mode `"points" | "density" | null`

The rendering mode. In `points` mode, the view will simply render each data point individually. In `density` mode, the view will show a density estimation as a contour plot when zoomed out.

### width, height `number | null`

The width and height of the view.

### pixelRatio `number | null`

The pixel ratio of the view.

### colorScheme `"light" | "dark" | null`

Set light or dark mode.

### theme `Theme | null`

Configure the theme of the view. `Theme` is defined as the following:

```ts
interface ThemeConfig {
  fontFamily: string;
  clusterLabelColor: string;
  clusterLabelOutlineColor: string;
  clusterLabelOpacity: number;
  statusBar: boolean;
  statusBarTextColor: string;
  statusBarBackgroundColor: string;
  brandingLink: { text: string; href: string } | null;
}

type Theme = Partial<ThemeConfig> & {
  /** Overrides for light mode. */
  dark?: Partial<ThemeConfig>;
  /** Overrides for dark mode. */
  light?: Partial<ThemeConfig>;
};
```

### viewportState `ViewportState | null`

The viewport state. You may use this to share viewport state across multiple views. If undefined or set to `null`, the view will use a default viewport state.

To listen to viewport state change, use `onViewportState`.

`ViewportState` is defined as the following:

```ts
interface ViewportState {
  /** The x coordinate of the center of the viewport in data units. */
  x: number;
  /** The y coordinate of the center of the viewport in data units. */
  y: number;
  /** The scale of the viewport. This scales data units to [-1, 1]. */
  scale: number;
}
```

### automaticLabels `boolean | null`

Set to `true` to enable automatic labels from the `text` column.

### onViewportState `((value: ViewportState) => void) | null`

A callback for when viewportState changes.

### onTooltip `((value: DataPoint | null) => void) | null`

A callback for when tooltip changes.

### onSelection `((value: DataPoint[] | null) => void) | null`

A callback for when selection changes.

### onRangeSelection `((value: Rectangle | Point[] | null) => void) | null`

A callback for when rangeSelection changes.

## Custom Tooltip

You may use the `customTooltip` property to change how tooltips are displayed.

First create a class for the custom tooltip component:

```js
class CustomTooltip {
  constructor(target, props) {
    // Create the tooltip component and mount it to the target element.
    // props will contain a `tooltip` field, plus any custom prop you specified.
  }
  update(props) {
    // Update the component with new props.
  }
  destroy() {
    // Destroy the component.
  }
}
```

Then specify the `customTooltip` property to the component:

```js
<EmbeddingViewMosaic
  ...
  customTooltip={{
    class: CustomTooltip,
    props: { customProp: 10 } // Pass additional props to the tooltip component.
  }}
/>
```

## Custom Overlay

You may use the `customOverlay` property to add an overlay to the embedding view.

First create a class for the custom overlay:

```js
class CustomOverlay {
  constructor(target, props) {
    // Create the tooltip component and mount it to the target element.
    // props will contain a `proxy` field, plus any custom prop you specified.
    // You can use proxy.location(x, y) to get the pixel location of a data point at (x, y).
  }
  update(props) {
    // Update the component with new props.
  }
  destroy() {
    // Destroy the component.
  }
}
```

Then specify the `customOverlay` property to the component:

```js
<EmbeddingViewMosaic
  ...
  customOverlay={{
    class: CustomOverlay,
    props: { customProp: 10 } // Pass additional props to the overlay component.
  }}
/>
```

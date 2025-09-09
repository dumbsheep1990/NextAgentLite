import { Coordinator } from '@uwdata/mosaic-core';
import { Selection as Selection_2 } from '@uwdata/mosaic-core';

declare type AdditionalHeaderContentClass = new (node: HTMLElement, props: AdditionalHeaderContentProps) => {
    update?: (props: AdditionalHeaderContentProps) => void;
    destroy?: () => void;
};

declare interface AdditionalHeaderContentProps {
    column: string;
}

declare type AdditionalHeaderContentsConfig = {
    [col: string]: CustomHeader;
};

export declare type AutomaticLabelsConfig = {
    cache?: {
        get: (key: string) => Promise<any | null>;
        set: (key: string, value: any) => Promise<void>;
    };
};

declare interface Cache_2 {
    /** Gets an object from the cache with the given key. Returns `null` if the entry is not found. */
    get(key: string): Promise<any | null>;
    /** Sets an object to the cache with the given key */
    set(key: string, value: any): Promise<void>;
}
export { Cache_2 as Cache }

/** A resulting cluster from the find clusters function */
export declare interface Cluster {
    /** Cluster identifier */
    identifier: number;
    /** The total density */
    sum_density: number;
    /** The mean x location (weighted by density) */
    mean_x: number;
    /** The mean y location (weighted by density) */
    mean_y: number;
    /** The maximum density */
    max_density: number;
    /** The location with the maximum density */
    max_density_location: [number, number];
    /** The number of pixels in the cluster */
    pixel_count: number;
    /** The cluster's boundary represented as a list of polygons */
    boundary?: [number, number][][];
    /** The cluster's boundary approximated with a list of rectangles */
    boundary_rect_approximation?: [number, number, number, number][];
}

declare type ColumnConfig = {
    title?: string;
    width?: number;
    hidden?: boolean;
};

declare type ColumnConfigChangeCallback = (column: string, newConfigs: ColumnConfigs) => void;

declare type ColumnConfigs = {
    [column: string]: ColumnConfig;
};

export declare function createKNN(count: number, input_dim: number, data: Float32Array, options?: KNNOptions): Promise<KNN>;

/**
 * Initialize a UMAP instance.
 * @param count the number of data points
 * @param input_dim the input dimension
 * @param output_dim the output dimension
 * @param data the data array. Must be a Float32Array with count * input_dim elements.
 * @param options options
 */
export declare function createUMAP(
count: number,
input_dim: number,
output_dim: number,
data: Float32Array,
options?: UMAPOptions,
): Promise<UMAP>;

declare type CustomCell = {
    class: CustomCellClass;
    props?: CustomCellProps;
} | CustomCellClass;

declare type CustomCellClass = new (node: HTMLElement, props: CustomCellProps) => {
    update?: (props: CustomCellProps) => void;
    destroy?: () => void;
};

declare interface CustomCellProps {
    value: any;
    rowData: {
        [col: string]: any;
    };
}

declare type CustomCellsConfig = {
    [col: string]: CustomCell;
};

export declare type CustomComponent<N, P> = {
    class: CustomComponentClass<N, P & any>;
    props?: Record<string, any>;
} | CustomComponentClass<N, P>;

declare type CustomComponentClass<N, P> = new (node: N, props: P) => {
    update?: (props: P) => void;
    destroy?: () => void;
};

declare type CustomHeader = {
    class: AdditionalHeaderContentClass;
    props?: AdditionalHeaderContentProps;
} | AdditionalHeaderContentClass;

export declare type DataField = string | {
    sql: string;
};

export declare interface DataPoint {
    x: number;
    y: number;
    category?: number;
    text?: string;
    identifier?: DataPointID;
    fields?: Record<string, any>;
}

export declare type DataPointID = string | number | bigint;

export declare function defaultCategoryColors(count: number): string[];

/** Returns a list of default plots for a given data table. */
export declare function defaultPlots(coordinator: Coordinator, table: string, excludeColumns?: string[]): Promise<{
    id: string;
    title: string;
    spec: any;
}[]>;

export declare const EmbeddingAtlas: (props: EmbeddingAtlasProps) => any;

export declare interface EmbeddingAtlasProps {
    /** The Mosaic coordinator */
    coordinator: Coordinator;
    /** The name of the data table */
    table: string;
    /** The column for unique row identifiers */
    idColumn: string;
    /** The X and Y columns for the embedding projection view */
    projectionColumns?: {
        x: string;
        y: string;
    } | null;
    /** The column for pre-computed nearest neighbors.
     * Each value in the column should be a dictionary with the format: `{ "ids": [id1, id2, ...], "distances": [distance1, distance2, ...] }`.
     * `"ids"` should be an array of row ids (as given by the `idColumn`) of the neighbors, sorted by distance.
     * `"distances"` should contain the corresponding distances to each neighbor.
     * Note that if `searcher.nearestNeighbors` is specified, the UI will use the searcher instead.
     */
    neighborsColumn?: string | null;
    /** The column for text. The text will be used as content for the tooltip and search features. */
    textColumn?: string | null;
    /** The color scheme. */
    colorScheme?: "light" | "dark" | null;
    /** The initial viewer state */
    initialState?: EmbeddingAtlasState | null;
    /** An object that provides search functionalities, including full text search, vector search, and nearest neighbor queries.
     * If not specified (undefined), a default full-text search with the text column will be used.
     * If set to null, search will be disabled. */
    searcher?: Searcher | null;
    /** Set to true to enable automatic labels for the embedding */
    automaticLabels?: boolean | null;
    /** A cache to speed up initialization of the viewer */
    cache?: Cache_2 | null;
    /** Custom cell renderers for the table view */
    tableCellRenderers?: Record<string, CustomCell | "markdown">;
    /** A callback to export the currently selected points */
    onExportSelection?: ((predicate: string | null, format: "json" | "jsonl" | "csv" | "parquet") => Promise<void>) | null;
    /** A callback to download the application as archive */
    onExportApplication?: (() => Promise<void>) | null;
    /** A callback when the state of the viewer changes. You may serialize the state to JSON and load it back. */
    onStateChange?: ((state: EmbeddingAtlasState) => void) | null;
}

export declare interface EmbeddingAtlasState {
    /** The version of Embedding Atlas that created this state */
    version: string;
    /** UNIX timestamp when this was created */
    timestamp: number;
    /** The view configuration and state of the embedding view */
    view?: any;
    /** The list of plots */
    plots?: {
        id: string;
        title: string;
        spec: any;
    }[];
    /** The state of all plots */
    plotStates?: Record<string, any>;
    /** The selection predicate (SQL expression) */
    predicate?: string | null;
}

export declare const EmbeddingView: (props: EmbeddingViewProps) => any;

export declare const EmbeddingViewMosaic: (props: EmbeddingViewMosaicProps) => any;

export declare interface EmbeddingViewMosaicProps {
    /** The Mosaic Coordinator */
    coordinator?: Coordinator;
    /** The data table name. */
    table: string;
    /** The x column. */
    x: string;
    /** The y column. */
    y: string;
    /** The category column (optional).
     * If specified, color points by category.
     * Categories should be represented as integers starting from zero.
     * Currently we only support at most four categories. */
    category?: string | null;
    /** The text column (optional).
     * If specified, the text will be used as the default tooltip on hover. */
    text?: string | null;
    /** The id column (optional). */
    identifier?: string | null;
    /** Additional fields for the tooltip data element.
     * Each field can be specified as a column name or a SQL expression. */
    additionalFields?: Record<string, DataField> | null;
    /** Mosaic filter (optional). */
    filter?: Selection_2 | null;
    /** The colors for the categories. */
    categoryColors?: string[] | null;
    /** The tooltip. Tooltip is triggered on hover.
     * If a Mosaic Selection is provided, the selection's value
     * will be used as the current tooltip; and when the tooltip
     * changes, the selection will be updated with a predicate. */
    tooltip?: Selection_2 | DataPoint | DataPointID | null;
    /** The selection. Selection is triggered with click or shift/cmd-click.
     * If a Mosaic Selection is provided, the selection's value
     * will be used as the current selection; and when the tooltip
     * changes, the selection will be updated with a predicate. */
    selection?: Selection_2 | DataPoint[] | DataPointID[] | null;
    /** The range selection. Shift-drag to create a range selection. */
    rangeSelection?: Selection_2 | null;
    /** The value of the range selection. This is a rectangle in data coordinates.
     * When this property is changed, the range selection updates accordingly. */
    rangeSelectionValue?: Rectangle | Point[] | null;
    /** The width of the view. */
    width?: number | null;
    /** The height of the view. */
    height?: number | null;
    /** The pixel ratio of the view. */
    pixelRatio?: number | null;
    /** Color scheme. */
    colorScheme?: "light" | "dark" | null;
    /** Theme. */
    theme?: Theme | null;
    /** The viewport state. */
    viewportState?: ViewportState | null;
    /** Set to true to automatically create labels from the text field. */
    automaticLabels?: AutomaticLabelsConfig | boolean | null;
    /** View mode. */
    mode?: "points" | "density" | null;
    /** Minimum average density for density contours to show up.
     * The density is measured as number of points per square points (aka., px in CSS units). */
    minimumDensity?: number | null;
    /** A custom renderer to draw the tooltip content. */
    customTooltip?: CustomComponent<HTMLDivElement, {
        tooltip: DataPoint;
    }> | null;
    /** A custom renderer to draw overlay on top of the embedding view. */
    customOverlay?: CustomComponent<HTMLDivElement, {
        proxy: OverlayProxy;
    }> | null;
    /** A callback for when viewportState changes. */
    onViewportState?: ((value: ViewportState) => void) | null;
    /** A callback for when tooltip changes. */
    onTooltip?: ((value: DataPoint | null) => void) | null;
    /** A callback for when selection changes. */
    onSelection?: ((value: DataPoint[] | null) => void) | null;
    /** A callback for when range selection changes. */
    onRangeSelection?: ((value: Rectangle | Point[] | null) => void) | null;
}

export declare interface EmbeddingViewProps {
    /** The data. */
    data: {
        x: Float32Array;
        y: Float32Array;
        category?: Uint8Array | null;
    };
    /** The colors for the categories. */
    categoryColors?: string[] | null;
    /** The tooltip. Tooltip is triggered on hover. */
    tooltip?: DataPoint | null;
    /** The selection. Selection is triggered with click or shift/cmd-click. */
    selection?: DataPoint[] | null;
    /** The range selection. Shift-drag to create a range selection. */
    rangeSelection?: Rectangle | null;
    /** The width of the view. */
    width?: number | null;
    /** The height of the view. */
    height?: number | null;
    /** The pixel ratio of the view. */
    pixelRatio?: number | null;
    /** Color scheme. */
    colorScheme: "light" | "dark" | null;
    /** Theme. */
    theme?: Theme | null;
    /** The viewport state. */
    viewportState?: ViewportState | null;
    /** Set to true to automatically create labels from the text field. */
    automaticLabels?: AutomaticLabelsConfig | boolean | null;
    /** View mode. */
    mode?: "points" | "density" | null;
    /** Minimum average density for density contours to show up.
     * The density is measured as number of points per square points (aka., px in CSS units).
     */
    minimumDensity?: number | null;
    /** A custom renderer to draw the tooltip content. */
    customTooltip?: CustomComponent<HTMLDivElement, {
        tooltip: DataPoint;
    }> | null;
    /** A custom renderer to draw overlay on top of the embedding view. */
    customOverlay?: CustomComponent<HTMLDivElement, {
        proxy: OverlayProxy;
    }> | null;
    /** A function to query selected point given (x, y) location, and a unit distance (distance of 1pt in data units). */
    querySelection?: ((x: number, y: number, unitDistance: number) => Promise<DataPoint | null>) | null;
    /** A function that returns a summary label for points covered by the union of the given rectangles. */
    queryClusterLabels?: ((rects: Rectangle[]) => Promise<string | null>) | null;
    /** A callback for when viewportState changes. */
    onViewportState?: ((value: ViewportState) => void) | null;
    /** A callback for when tooltip changes. */
    onTooltip?: ((value: DataPoint | null) => void) | null;
    /** A callback for when selection changes. */
    onSelection?: ((value: DataPoint[] | null) => void) | null;
    /** A callback for when rangeSelection changes. */
    onRangeSelection?: ((value: Rectangle | Point[] | null) => void) | null;
}

/**
 * Find clusters from a density map
 * @param density_map the density map, a `Float32Array` with `width * height` elements
 * @param width the width of the density map
 * @param height the height of the density map
 * @param options algorithm options
 * @returns
 */
export declare function findClusters(density_map: Float32Array, width: number, height: number, options?: Partial<FindClustersOptions>): Promise<Cluster[]>;

/** Options of the find clusters function */
export declare interface FindClustersOptions {
    /** The threshold for unioning two clusters */
    union_threshold: number;
}

export declare interface KNN {
    query_by_index(index: number, k: number): KNNQueryResult;
    query_by_vector(data: Float32Array, k: number): KNNQueryResult;
    destroy(): void;
}

/** KNN options */
export declare interface KNNOptions {
    /** The distance metric */
    metric?: "euclidean" | "cosine";

    /** The nearest neighbor method. By default we use HNSW with its default parameters. */
    method?: "hnsw" | "nndescent" | "vptree";
}

export declare interface KNNQueryResult {
    indices: Int32Array;
    distnaces: Float32Array;
}

export declare function maxDensityModeCategories(): number;

export declare interface OverlayProxy {
    location: (x: number, y: number) => {
        x: number;
        y: number;
    };
    width: number;
    height: number;
}

/** A point with x and y coordinates. */
export declare interface Point {
    x: number;
    y: number;
}

/** A rectangle with min, max coordinate for each dimension.
 * It is required that xMin <= xMax and yMin <= yMax. */
export declare interface Rectangle {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
}

declare type RowClickCallback = (rowId: string) => void;

export declare interface Searcher {
    /** Perform a full text search with the given query */
    fullTextSearch?(query: string, options?: {
        limit: number;
        predicate: string | null;
        onStatus: (status: string) => void;
    }): Promise<{
        id: any;
    }[]>;
    /** Perform a vector search with the given query */
    vectorSearch?(query: string, options?: {
        limit: number;
        predicate: string | null;
        onStatus: (status: string) => void;
    }): Promise<{
        id: any;
        distance?: number;
    }[]>;
    /** Find nearest neighbors of the row of the given id */
    nearestNeighbors?(id: any, options?: {
        limit: number;
        predicate: string | null;
        onStatus: (status: string) => void;
    }): Promise<{
        id: any;
        distance?: number;
    }[]>;
}

export declare const Table: (props: TableProps) => any;

export declare interface TableProps {
    table: string;
    columns: string[];
    rowKey: string;
    columnConfigs?: ColumnConfigs | null;
    onColumnConfigsChange?: ColumnConfigChangeCallback | null;
    showRowNumber?: boolean | null;
    onShowRowNumberChange?: (showRowNumber: boolean) => void;
    coordinator?: Coordinator | null;
    filter?: Selection_2 | null;
    scrollTo?: any | null;
    colorScheme?: "light" | "dark" | null;
    theme?: Theme_2 | null;
    lineHeight?: number | null;
    numLines?: number | null;
    customCells?: CustomCellsConfig | null;
    additionalHeaderContents?: AdditionalHeaderContentsConfig | null;
    headerHeight?: number | null;
    onRowClick?: RowClickCallback | null;
    highlightedRows?: any[] | null;
    highlightHoveredRow?: boolean | null;
}

export declare type Theme = Partial<ThemeConfig> & {
    /** Overrides for light mode. */
    dark?: Partial<ThemeConfig>;
    /** Overrides for dark mode. */
    light?: Partial<ThemeConfig>;
};

declare type Theme_2 = ThemeConfig_2 & {
    dark?: ThemeConfig_2;
    light?: ThemeConfig_2;
};

declare interface ThemeConfig {
    fontFamily: string;
    clusterLabelColor: string;
    clusterLabelOutlineColor: string;
    clusterLabelOpacity: number;
    statusBar: boolean;
    statusBarTextColor: string;
    statusBarBackgroundColor: string;
    brandingLink: {
        text: string;
        href: string;
    } | null;
}

declare interface ThemeConfig_2 {
    primaryTextColor?: string;
    secondaryTextColor?: string;
    tertiaryTextColor?: string;
    fontFamily?: string;
    fontSize?: string;
    primaryBackgroundColor?: string;
    secondaryBackgroundColor?: string;
    tertiaryBackgroundColor?: string;
    hoverBackgroundColor?: string;
    headerFontFamily?: string;
    headerFontSize?: string;
    cellFontFamily?: string;
    cellFontSize?: string;
    scrollbarBackgroundColor?: string;
    scrollbarPillColor?: string;
    scrollbarLabelBackgroundColor?: string;
    shadow?: string;
    outlineColor?: string;
    dimmedRowColor?: string;
    rowScrollToColor?: string;
    rowHoverColor?: string;
}

export declare interface UMAP {
    /** The current epoch number */
    get epoch(): number;

    /** The input dimension */
    get input_dim(): number;

    /** The output dimension */
    get output_dim(): number;

    /**
     * Get the current embedding.
     * The resulting Float32Array points to WASM internal memory.
     * If you need to use the data outside this library or after further
     * interaction with this library, make sure to create a copy
     * of the array, as the underlying memory may change.
     */
    get embedding(): Float32Array;

    /**
     * Run the UMAP algorithm until reaching `epoch_limit` epochs,
     * or to completion if `epoch_limit` is not specified.
     * @param epoch_limit the epoch number to run to
     */
    run(epoch_limit?: number): void;

    /** Destroy the instance and release resources */
    destroy(): void;
}

/** UMAP options */
export declare interface UMAPOptions {
    /** The input distance metric */
    metric?: "euclidean" | "cosine";

    /** The nearest neighbor method. By default we use HNSW with its default parameters. */
    knn_method?: "hnsw" | "nndescent" | "vptree";

    /** The initialization method. By default we use spectral initialization. */
    initialize_method?: "spectral" | "random" | "none";

    local_connectivity?: number;
    bandwidth?: number;
    mix_ratio?: number;
    spread?: number;
    min_dist?: number;
    a?: number;
    b?: number;
    repulsion_strength?: number;
    n_epochs?: number;
    learning_rate?: number;
    negative_sample_rate?: number;
    n_neighbors?: number;
    /** The random seed. */
    seed?: number;
}

/** A state describing the viewport's pan and zoom state.
 * The screen coordinate of a point is calculated as follows:
 * px = ((x - viewport.x) * viewport.scale + 1) / 2 * width
 * py = ((y - viewport.y) * viewport.scale + 1) / 2 * height
 */
export declare interface ViewportState {
    /** The x coordinate of the center of the viewport in data units. */
    x: number;
    /** The y coordinate of the center of the viewport in data units. */
    y: number;
    /** The scale of the viewport. This scales data units to [-1, 1]. */
    scale: number;
}

export { }

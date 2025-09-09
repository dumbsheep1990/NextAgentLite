import { Coordinator } from '@uwdata/mosaic-core';
import { Selection as Selection_2 } from '@uwdata/mosaic-core';

export declare type AutomaticLabelsConfig = {
    cache?: {
        get: (key: string) => Promise<any | null>;
        set: (key: string, value: any) => Promise<void>;
    };
};

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

export declare type CustomComponent<N, P> = {
    class: CustomComponentClass<N, P & any>;
    props?: Record<string, any>;
} | CustomComponentClass<N, P>;

declare type CustomComponentClass<N, P> = new (node: N, props: P) => {
    update?: (props: P) => void;
    destroy?: () => void;
};

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

export declare class EmbeddingView {
    private component;
    private currentProps;
    constructor(target: HTMLElement, props: EmbeddingViewProps);
    update(props: Partial<EmbeddingViewProps>): void;
    destroy(): void;
}

export declare class EmbeddingViewMosaic {
    private component;
    private currentProps;
    constructor(target: HTMLElement, props: EmbeddingViewMosaicProps);
    update(props: Partial<EmbeddingViewMosaicProps>): void;
    destroy(): void;
}

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

export declare type Theme = Partial<ThemeConfig> & {
    /** Overrides for light mode. */
    dark?: Partial<ThemeConfig>;
    /** Overrides for dark mode. */
    light?: Partial<ThemeConfig>;
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

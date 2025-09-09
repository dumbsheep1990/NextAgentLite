import { Coordinator } from '@uwdata/mosaic-core';

declare interface Cache_2 {
    /** Gets an object from the cache with the given key. Returns `null` if the entry is not found. */
    get(key: string): Promise<any | null>;
    /** Sets an object to the cache with the given key */
    set(key: string, value: any): Promise<void>;
}
export { Cache_2 as Cache }

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

/** Returns a list of default plots for a given data table. */
export declare function defaultPlots(coordinator: Coordinator, table: string, excludeColumns?: string[]): Promise<{
    id: string;
    title: string;
    spec: any;
}[]>;

export declare class EmbeddingAtlas {
    private component;
    private container;
    private currentProps;
    constructor(target: HTMLElement, props: EmbeddingAtlasProps);
    update(props: Partial<EmbeddingAtlasProps>): void;
    destroy(): void;
}

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

export { }

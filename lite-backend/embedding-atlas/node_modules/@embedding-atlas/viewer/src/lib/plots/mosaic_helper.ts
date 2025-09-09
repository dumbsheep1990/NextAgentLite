// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import { MosaicClient, type Coordinator, type Selection } from "@uwdata/mosaic-core";

type Predicate = any;
type Query = any;

export interface MakeClientOptions {
  /** The Mosaic coordinator */
  coordinator: Coordinator;

  /** A selection whose predicates will be fed into the
   * query function to produce the SQL query. */
  selection?: Selection | null;

  /** A function that returns a query from a list of selection predicates */
  query: (...predicates: (Predicate | null)[]) => Query;

  /** Called by the coordinator to return a query result. */
  queryResult?: (data: any) => void;

  /** Called by the coordinator to report a query execution error. */
  queryPending?: () => void;

  /** Called by the coordinator to inform the client that a query is pending. */
  queryError?: (error: any) => void;
}

/** Make a new client with the given options, and connect the client to the provided coordinator. */
export function makeClient(options: MakeClientOptions): MosaicClient & { destroy: () => void } {
  let coordinator = options.coordinator;
  let client = new DynamicQueryClient({ ...options, coordinator: coordinator }) as any;
  coordinator.connect(client);
  client.destroy = () => {
    coordinator.disconnect(client);
  };
  return client;
}

class DynamicQueryClient extends MosaicClient {
  private _spec: MakeClientOptions & { coordinator: Coordinator };

  constructor(spec: MakeClientOptions & { coordinator: Coordinator }) {
    super(spec.selection ?? undefined);
    this._spec = { ...spec };
  }

  query(predicate: any) {
    return this._spec.query(predicate);
  }

  queryResult(data: any): this {
    this._spec.queryResult?.(data);
    return this;
  }

  queryPending(): this {
    this._spec.queryPending?.();
    return this;
  }

  queryError(error: any): this {
    this._spec.queryError?.(error);
    return this;
  }
}

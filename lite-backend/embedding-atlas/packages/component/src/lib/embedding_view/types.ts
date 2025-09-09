// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

export type DataPointID = string | number | bigint;

export interface DataPoint {
  x: number;
  y: number;
  category?: number;
  text?: string;
  identifier?: DataPointID;
  fields?: Record<string, any>;
}

export type DataField = string | { sql: string };

export type AutomaticLabelsConfig = {
  cache?: {
    get: (key: string) => Promise<any | null>;
    set: (key: string, value: any) => Promise<void>;
  };
};

export interface OverlayProxy {
  location: (x: number, y: number) => { x: number; y: number };
  width: number;
  height: number;
}

type CustomComponentClass<N, P> = new (node: N, props: P) => { update?: (props: P) => void; destroy?: () => void };

export type CustomComponent<N, P> =
  | {
      class: CustomComponentClass<N, P & any>;
      props?: Record<string, any>;
    }
  | CustomComponentClass<N, P>;

// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import { writable, type Subscriber, type Unsubscriber, type Writable } from "svelte/store";

/** Keeps the state of a plot. Created with PlotStateStoreManager. */
export interface PlotStateStore<T> {
  /** Set the plot's state */
  set: (value: T) => void;
  /** Subscribe to the state. To avoid cycles, this is only notified when the state is set via the PlotStateStoreManager. */
  subscribe: (subscriber: Subscriber<T>) => Unsubscriber;
  /** Get a child store for the given id */
  child: (id: string) => PlotStateStore<any>;
}

/** Manages the state stores for all plots */
export class PlotStateStoreManager {
  private storeMap: Map<string, PlotStateStore<any>>;
  private currentState: Record<string, any>;
  private notifier: Writable<number>;
  private notifier2: Writable<number>;

  constructor() {
    this.storeMap = new Map();
    this.currentState = {};
    this.notifier = writable(0);
    this.notifier2 = writable(0);
  }

  /** Set the state of all plots */
  set(state: Record<string, any>) {
    for (let key in state) {
      this.currentState[key] = state[key];
    }
    this.notifier2.update((v) => v + 1);
  }

  /** Get the state of all plots */
  get(): Record<string, any> {
    return this.currentState;
  }

  /** Subscribe to any plot's state change */
  subscribe(callback: (states: Record<string, any>) => {}): Unsubscriber {
    return this.notifier.subscribe(() => {
      callback(this.currentState);
    });
  }

  /** Get a store for plot with the given id */
  store(id: string): PlotStateStore<any> {
    let store = this.storeMap.get(id);
    if (store != null) {
      return store;
    }
    store = {
      set: (newValue: any) => {
        this.currentState[id] = newValue;
        this.notifier.update((v) => v + 1);
      },
      subscribe: (callback) => {
        return this.notifier2.subscribe(() => {
          let value = this.currentState[id] ?? null;
          callback(value);
        });
      },
      child: (subid) => this.store(id + "/" + subid),
    };
    this.storeMap.set(id, store);
    return store;
  }
}

// Basically the same as svelte/store, but implemented manually here
// to be super light on dependencies. It's not quite as robust, maybe
// I should have just copied it exactly. It's pretty close though.

const noop = () => {};

export type Subscriber<T> = (value: T) => void;
export type Unsubscriber = () => void;
export type Updater<T> = (value: T) => T;
export type StartStopNotifier<T> = (set: Subscriber<T>) => Unsubscriber | void;

export interface Readable<T> {
  subscribe(this: void, subscriber: Subscriber<T>): Unsubscriber;
}

export interface Writable<T> extends Readable<T> {
  set(this: void, value: T): void;
  update(this: void, updater: Updater<T>): void;
}

export function get<T>(store: Readable<T>): T {
  let output: T;
  store.subscribe((value) => (output = value))();
  return output!;
}

export function readonly<T>(store: Readable<T>): Readable<T> {
  return { subscribe: store.subscribe };
}

export function readable<T>(
  state: T,
  start: StartStopNotifier<T> = noop
): Readable<T> {
  return readonly(writableInternal(state, start));
}

export function writable<T>(state?: T | undefined): Writable<T | undefined>;
export function writable<T>(state: T): Writable<T>;
export function writable<T>(state: T): Writable<T> {
  return writableInternal(state);
}

function writableInternal<T>(
  state: T,
  start: StartStopNotifier<T> = noop
): Writable<T> {
  const subscribers = new Map<symbol, Subscriber<T>>();

  let stop: Unsubscriber | undefined;

  function notify() {
    for (const subscriber of subscribers.values()) {
      subscriber(state);
    }
  }

  function set(value: T) {
    state = value;
    notify();
  }

  function update(updater: Updater<T>) {
    set(updater(state));
  }

  function subscribe(subscriber: Subscriber<T>) {
    const key = Symbol();
    subscriber(state);
    subscribers.set(key, subscriber);

    if (subscribers.size === 1) {
      stop = start(set) ?? noop;
    }

    return () => {
      subscribers.delete(key);
      if (subscribers.size === 0) {
        stop?.();
        stop = undefined;
      }
    };
  }

  return { set, update, subscribe };
}

type Stores = [Readable<unknown>, ...Readable<unknown>[]];
type StoresValues<T> = {
  [K in keyof T]: T[K] extends Readable<infer U> ? U : never;
};

type AutoCombiner<S extends Stores, T> = (values: StoresValues<S>) => T;

type ManualCombiner<S extends Stores, T> = (
  values: StoresValues<S>,
  set: (value: T) => void
) => Unsubscriber | void;

type Combiner<S extends Stores, T> = ManualCombiner<S, T> | AutoCombiner<S, T>;

function isAuto<S extends Stores, T>(
  combiner: Combiner<S, T>
): combiner is AutoCombiner<S, T> {
  return combiner.length == 1;
}

export function derived<S extends Stores, T>(
  inputs: S,
  combiner: AutoCombiner<S, T>,
  initial: T
): Readable<T>;
export function derived<S extends Stores, T>(
  inputs: S,
  combiner: AutoCombiner<S, T>,
  initial?: T
): Readable<T | undefined>;
export function derived<S extends Stores, T>(
  inputs: S,
  combiner: ManualCombiner<S, T>,
  initial: T
): Readable<T>;
export function derived<S extends Stores, T>(
  inputs: S,
  combiner: ManualCombiner<S, T>,
  initial?: T
): Readable<T | undefined>;
export function derived<S extends Stores, T>(
  inputs: S,
  combiner: Combiner<S, T>,
  initial: T
): Readable<T> {
  const auto = isAuto(combiner);

  return readable(initial, (set) => {
    const values: StoresValues<S> = [] as StoresValues<S>;
    let pending = inputs.map(() => true);
    let cleanup: Unsubscriber | undefined;

    function sync() {
      if (pending.some((v) => v)) {
        return;
      }

      cleanup?.();

      if (auto) {
        const result = combiner(values);
        set(result);
      } else {
        const result = combiner(values, set);
        cleanup = typeof result === "function" ? result : undefined;
      }
    }

    const unsubscribers = inputs.map((store, i) =>
      store.subscribe((value) => {
        values[i] = value;
        pending[i] = false;
        sync();
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      pending = inputs.map(() => true);
      cleanup?.();
    };
  });
}

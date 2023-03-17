export function get(store) {
  let output;
  const unsub = store.subscribe((value) => {
    output = value;
  });
  unsub();
  return output;
}

export function writable(state) {
  const subscribers = new Map();

  function set(value) {
    state = value;
    for (const subscriber of subscribers.values()) {
      subscriber(state);
    }
  }

  function subscribe(subscriber) {
    const key = Symbol();
    subscriber(state);
    subscribers.set(key, subscriber);
    return () => subscribers.delete(key);
  }

  return { get, set, subscribe };
}

export function derived(inputOrInputs, combiner = (x) => x) {
  const inputs = Array.isArray(inputOrInputs) ? inputOrInputs : [input];

  function subscribe(subscriber) {
    const state = [inputs.map(get)];
    subscriber(combiner(...state));

    const unsubscribers = inputs.map((input, i) =>
      input.subscribe((value) => {
        state[i] = value;
        subscriber(combiner(...state));
      })
    );

    return () => unsubscribers.forEach((unsub) => unsub());
  }

  return { subscribe };
}

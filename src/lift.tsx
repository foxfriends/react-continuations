import React, { useMemo, type FunctionComponent } from "react";
import { derived, readable, type Readable } from "./store";
import { useReadable } from "./useStore";

type Storable<T> = {
  [K in keyof T]: T[K] | Readable<T[K]>;
};

type StoreComponent<C> = C extends FunctionComponent<infer P>
  ? FunctionComponent<Storable<P>>
  : never;

export function lift<P>(
  Component: FunctionComponent<P>
): FunctionComponent<Storable<P>> {
  function Lifted(props: Storable<P> & JSX.IntrinsicAttributes) {
    const storeProps = Object.entries(props).filter(
      (element): element is [string, Readable<unknown>] =>
        !!element[1] &&
        typeof element[1] === "object" &&
        "subscribe" in element[1] &&
        typeof element[1].subscribe === "function"
    );
    const stores = storeProps.map(([, v]) => v);
    const storeNames = storeProps.map(([k]) => k);

    const componentStore = useMemo(() => {
      if (stores.length === 0) {
        return readable(
          <Component {...(props as P & JSX.IntrinsicAttributes)} />
        );
      }

      return derived(
        stores as [Readable<unknown>, ...Readable<unknown>[]],
        ([...values]) => {
          const newProps = values.reduce(
            (acc: P & JSX.IntrinsicAttributes, value, i) => ({
              ...acc,
              [storeNames[i]]: value,
            }),
            props as P & JSX.IntrinsicAttributes
          );
          return <Component {...newProps} />;
        },
        null
      );
    }, storeNames);

    return useReadable(componentStore);
  }

  Lifted.displayName = Component.displayName ?? Component.name;
  return Lifted;
}

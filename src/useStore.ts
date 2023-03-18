import { type Readable, type Writable, get } from "./store";
import {
  type SetStateAction,
  type Dispatch,
  useEffect,
  useState,
  useCallback,
} from "react";

export function useReadable<T>(store: Readable<T>): T {
  const [state, setState] = useState(get(store));
  useEffect(() => store.subscribe(setState), [store]);
  return state;
}

export function useWritable<T>(
  store: Writable<T>
): [T, Dispatch<SetStateAction<T>>];
export function useWritable<T>(
  store: Writable<T>
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(get(store));
  useEffect(() => store.subscribe(setState), [store]);
  const update = useCallback(
    (action: SetStateAction<T>) => {
      if (typeof action === "function") {
        store.update(action as (value: T) => T);
      } else {
        store.set(action);
      }
    },
    [store]
  );
  return [state, update];
}

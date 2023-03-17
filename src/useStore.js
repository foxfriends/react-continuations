import { get } from "./store";
import { useEffect, useState } from "react";

export function useStore(store) {
  const [state, setState] = useState(get(store));
  useEffect(() => store.subscribe(setState), [store]);
  return state;
}

import {
  cloneElement,
  useMemo,
  useState,
  type FunctionComponent,
  type ReactElement,
  type JSXElementConstructor,
} from "react";
import { writable, readonly, type Readable } from "./store";

type StorePropsReactElement<
  P,
  C extends string | JSXElementConstructor<any> =
    | string
    | JSXElementConstructor<any>
> = ReactElement<{ [K in keyof P]: P[K] | Readable<P[K]> }, C>;

type SequenceProps<State> = {
  [key: string]: unknown;
  state: State;
  next: (state: State) => void;
  back: () => void;
};

export function createSequence<Props>(
  sequencer: (
    props: Props
  ) => Generator<
    StorePropsReactElement<SequenceProps<unknown>>,
    void,
    Readable<unknown> | undefined
  >
): FunctionComponent<Props> {
  function Sequenced(inputProps: Props) {
    const [stepIndex, setStepIndex] = useState(0);

    const components = useMemo(() => {
      let previous;
      const components = [];
      const sequence = sequencer(inputProps);
      for (let i = 0; ; i += 1) {
        const { value, done } = sequence.next(previous);
        if (done) {
          break;
        }

        const output = writable();
        previous = readonly(output);
        const next = (value: unknown) => {
          output.set(value);
          setStepIndex(i + 1);
        };
        const back = () => setStepIndex(i - 1);

        components.push(cloneElement(value, { next, back, state: output }));
      }
      return components;
    }, []);

    return components[stepIndex];
  }

  Sequenced.displayName = sequencer.name;

  return Sequenced;
}

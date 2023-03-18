import {
  cloneElement,
  useMemo,
  useState,
  type FunctionComponent,
  type ReactElement,
  type JSXElementConstructor,
  useEffect,
} from "react";
import { writable, readonly, type Readable } from "./store";

type StorePropsReactElement<
  P,
  C extends string | JSXElementConstructor<any> =
    | string
    | JSXElementConstructor<any>
> = ReactElement<{ [K in keyof P]: P[K] | Readable<P[K]> }, C>;

type SequenceElementProps<State> = {
  [key: string]: unknown;
  state: State;
  next: (state: State) => void;
  back: () => void;
};

type SequenceProps<T> = {
  onComplete: (value: T) => void;
};

export function createSequence<Result, Props>(
  sequencer: (
    props: Props
  ) => Generator<
    StorePropsReactElement<SequenceElementProps<unknown>>,
    Readable<Result>,
    Readable<unknown> | undefined
  >
): FunctionComponent<Props & SequenceProps<Result>> {
  function Sequenced({
    onComplete,
    ...inputProps
  }: Props & SequenceProps<Result>) {
    const [stepIndex, setStepIndex] = useState(0);

    const [components, result] = useMemo(() => {
      let previous;
      const components = [];
      const sequence = sequencer(inputProps as Props);
      for (let i = 0; ; i += 1) {
        const { value, done } = sequence.next(previous);
        if (done) {
          return [components, value];
          break;
        }

        const output = writable();
        previous = readonly(output);
        const next = (value: unknown) => {
          output.set(value);
          if (i + 1 <= components.length) {
            setStepIndex(i + 1);
          }
        };
        const back = () => {
          if (i > 0) {
            setStepIndex(i - 1);
          }
        };

        components.push(cloneElement(value, { next, back, state: output }));
      }
    }, []);

    useEffect(() => {
      let skipFirst = true;
      return result.subscribe((value) => {
        if (!skipFirst) {
          onComplete?.(value);
        }
        skipFirst = false;
      });
    }, [result, onComplete]);

    return components[stepIndex];
  }

  Sequenced.displayName = sequencer.name;

  return Sequenced;
}

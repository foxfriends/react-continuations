import {
  cloneElement,
  useMemo,
  useState,
  type FunctionComponent,
  type ReactElement,
  type JSXElementConstructor,
  type ComponentProps,
} from "react";
import {
  writable,
  derived,
  readonly,
  get,
  type Writable,
  type Readable,
} from "./store";
import { useReadable } from "./useStore";
export { lift } from "./lift";

type ElementProps<T> = T extends ReactElement<infer P> ? P : never;

type StorePropsReactElement<
  P,
  C extends string | JSXElementConstructor<any> =
    | string
    | JSXElementConstructor<any>
> = ReactElement<{ [K in keyof P]: P[K] | Readable<P[K]> }, C>;

type UnstorePropsReactElement<T> = T extends StorePropsReactElement<
  infer P,
  infer C
>
  ? ReactElement<{ [K in keyof P]: P extends Readable<infer T> ? T : P }, C>
  : never;

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
    const [originals, outputs] = useMemo(() => {
      const originals = [];
      const outputs = [];
      const sequence = sequencer(inputProps);
      for (;;) {
        const { value, done } = sequence.next(
          outputs.length ? readonly(outputs[outputs.length - 1]) : undefined
        );
        if (done) {
          break;
        }
        originals.push(value);
        outputs.push(writable());
      }
      return [originals, outputs];
    }, []);

    const [stepIndex, setStepIndex] = useState(0);

    const components = useMemo(
      () =>
        originals.map((component, i) => {
          const output = outputs[i];

          const next = (value: unknown) => {
            output.set(value);
            setStepIndex(i + 1);
          };

          const back = () => setStepIndex(i - 1);

          return cloneElement(component, { next, back, state: output });
        }),
      [originals, outputs]
    );

    return components[stepIndex];
  }

  Sequenced.displayName = sequencer.name;

  return Sequenced;
}

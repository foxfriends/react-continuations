import { cloneElement, useMemo, useState } from "react";
import { writable, derived, get } from "./store";
import { useStore } from "./useStore";

export function createSequence(sequencer) {
  function Sequenced(inputProps) {
    const [originals, outputs] = useMemo(() => {
      const originals = [];
      const outputs = [];
      const sequence = sequencer(inputProps);
      for (;;) {
        const { value, done } = sequence.next(outputs[outputs.length - 1]);
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

          const next = (value) => {
            output.set(value);
            setStepIndex(i + 1);
          };

          const back = () => setStepIndex(i - 1);

          return cloneElement(component, { next, back });
        }),
      [originals, outputs]
    );

    const componentStore = useMemo(() => {
      const component = components[stepIndex];
      const storeProps = Object.entries(component.props).filter(
        ([k, v]) => v && typeof v.subscribe === "function"
      );
      const stores = storeProps.map(([, v]) => v);
      const props = storeProps.map(([k]) => k);
      return derived(
        [outputs[stepIndex], ...stores],
        (state, ...storeProps) => {
          const newProps = storeProps.reduce(
            (acc, value, i) => ({ ...acc, [props[i]]: value }),
            { state }
          );
          return cloneElement(component, newProps);
        }
      );
    }, [stepIndex]);

    return useStore(componentStore);
  }

  Sequenced.displayName = sequencer.name;

  return Sequenced;
}

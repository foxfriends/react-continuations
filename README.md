# React Continuations

I don't think this is actually using continuations all that much, but was based
on an idea that came from working with continuations... and maybe will become
full continuation-supporting in the future.

But you can kind of see it if you try hard enough... Components are yielded,
and called with the current and previous continuations, by some witchcraft
using `cloneElement` to treat those yielded components as if they were actually
functions (it's not rendering the yielded components, it's just using them as
templates for future renders).

## Sequences

For now, the only usage of this concept is the *sequence*. A generator can
be passed to `createSequence` that `yield`s a series of steps that can be
navigated between. Each step is a component that may accept the props
`next` and `back`, which will move forward or backward a step in the sequence.

After each `yield`, the generator resumes with a *store* that represents the
"result" value of that step. When progressing to the next step, a value passed
to the `next` function is placed into this store. This store can then be passed
on to the components further along in the sequence. This store is also automatically
passed to the current step via the prop `state`, allowing for the component to
"remember" the value it ended with last time it was rendered.

To make store-props more invisible, a helper higher-order-component function
`lift` is provided that "lifts" a regular component into one that accepts such
a "store" in place of any props. The store is watched automatically and the
component rendered with the latest values of all those props.

For a full example, see the [checkout example](./examples/checkout/).

## Stores

Stores are basically stolen straight out of [Svelte][]. There are three kinds,
which work basically like they do in Svelte, but with slightly more restricted
syntax in the use of `derived`:
* `readable(init, (set) => { /* ... */ }): { subscribe }
* `writable(init): { set, update, subscribe }`
* `derived(stores, (values) => { /* ... */ }): { subscribe }`
* `derived(stores, (values, set) => { /* ... */ }): { subscribe }`

[Svelte]: https://svelte.dev/docs#run-time-svelte-store

Stores are a way of managing "higher-order state" in ways ordinary React states
don't work so well:
* Stores can outlive the component that creates them
* You can pass stores to other components
* You can put stores in stores

To turn a store back into regular React values, the hooks `value = useReadable(store)`
and `[value, setValue] = useWritable(store)` can be used, hopefully intuitively.

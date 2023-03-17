# React Continuations

I don't think this is actually using continuations all that much, but was based
on an idea that came from working with continuations... and maybe will become
full continuation-supporting in the future.

But you can kind of see it if you try hard enough... Components are yielded,
and called with the current and previous continuations, by some witchcraft
using `cloneElement` to treat those yielded components as if they were actually
functions (it's not rendering the yielded components, it's just using them as
templates for future renders).

For now only `createSequence` is supported, a single usage of the idea,
but probably other applications of this pattern can be useful... different
sequencings, etc.

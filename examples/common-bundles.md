### Quirk: the `minChunks` option and the meaning of infinity

What the official webpack documentation has to say on this:

> The minimum number of chunks which need to contain a module before it’s moved
> into the commons chunk. The number must be greater than or equal 2 and lower
> than or equal to the number of chunks. Passing Infinity just creates the
> commons chunk, but moves no modules into it. By providing a function you can
> add custom logic. (Defaults to the number of chunks)

The possible values this option can have are:

- `number`
- `Infinity`
- `function(module, count) -> boolean`

Not setting the value to `Infinity` implies that if a module seems to be
referenced by more than one bundle, it will also be added to that bundle
(even _if_ it was not listed in the module list for the entry the plugin was
defined for.)

How this affected us was in the following situation: at some point, a mini-app
appeared in our code-base that had a dependency on a module (say, `lodash`) of
a different version than the one in the base app. The base app's dependency was
being served in the common bundle, and we found out as time went by that the
dependency of the mini-app was also being served in the bundle.

However, that mini-app was never meant to use the common bundle; its own
dependencies were meant to be bundled along with its application code. At run-
time, you'd find out that the mini-app couldn't run because some of its
dependencies were no longer found by webpack - that is, they are residing in
the common bundle (`vendor.js`) which was never sourced by the HTML.

This is where the `minChunks: Infinity` option came into play: it instructs
webpack to not add any module into the common bundle except for those listed in
the entry the plugin is defined for. That's what we were after; the base app
has its dependencies rolled up in the common bundle (`vendor.js`) and the
mini-app's dependencies are bundled inline along with the rest of its code.

In mortal-webpack, this is the default behaviour (through the `strict` option
accepted by [[builders.generateCommonBundle]].) It is still possible to 
override it by passing `pluginOptions` to that API and configure the plugin
directly, but be warned!
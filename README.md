# mortal-webpack

![mortal-webpack-logo](./assets/mortal-webpack-logo.svg)

Declarative webpack configuration that scales.

## Installation

```shell
npm install --save-dev mortal-webpack
# or using yarn
yarn add --dev mortal-webpack
```

## Getting started

> Currently this package only targets webpack 1.

The intended usage of `mortal-webpack` is to pass it a list of what is referred
to as [[build directives | builders]] and let it generate a configuration
object to give to webpack.

Where one would normally write something like this:

```javascript
// @file: webpack.config.js
module.exports = {
  entry: 'index.js',
  output: {
    path: 'dist',
  }
}
```

They would now put `mortal-webpack` in between:

```javascript
// @file: webpack.config.js
const { compose, builders: b } = require('mortal-webpack')

module.exports = compose([
  b.generateBundle({
    name: 'application',
    modules: [ 'index.js' ]
  }),

  b.output({ path: 'dist' }),
])
```

What you pass to the [[compose]] call above is an array of [[build directives |
builders]] - these are your primary APIs of configuring webpack with mortal-
webpack and they are what you should be looking into next.

Once you're feeling excited, you can tap into [[writing macros |
./examples/macros.md]] for extra convenience and power.

## Where to go from here

- learn more about [[error reporting | ./examples/error-reporting.md]]
- learn how to set up multiple [[build targets | ./examples/targets.md]] to
  manage complicated build systems

## Related projects

[webpack-blocks](https://github.com/andywer/webpack-blocks) is a great
alternative to `mortal-webpack` and may prove a better fit for many use cases.

There are several differences between the two:

- `mortal-webpack` is focused on large and complicated build systems consisting
  of multiple targets
- while `webpack-blocks` provides handy "blocks" of functionality from anywhere
  (3rd-party), `mortal-webpack` has no such notion for extensibility. Instead,
  you can roll your own [[macros | ./examples/macros.md]] to share
  functionality between different targets.
- `mortal-webpack` is designed to catch user mistakes and tries very hard to
  prevent bad builds from ever being started
- `webpack-blocks` may be easier to get started with. The target audiences
  differ between the two; `mortal-webpack` doesn't attempt to hide anything
  from you, you'll still have to go through the different [[directives |
  builders]].

## License

mortal-webpack - declarative webpack configuration
Copyright (C) 2017 Instructure, INC.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
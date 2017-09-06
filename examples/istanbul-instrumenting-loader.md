# Coverage with Istanbul

_TBD_

Below is a sample loader implementation for running files through `istanbul`
to "instrument" them and collect coverage:

```javascript
const istanbul = require("istanbul");
const instrumenter = new istanbul.Instrumenter({
  embedSource: true,
  noAutoWrap: true,
  noCompact: true,
});

module.exports = function(source) {
  if (this.cacheable) {
    this.cacheable();
  }

  return instrumenter.instrumentSync(source, this.resourcePath);
};
```
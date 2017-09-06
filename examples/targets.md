# Build targets

Commonly, applications need to tune their build scripts differently based on
the target environment, development versus test for example.

When the tuning is simple, it is possible to maintain this all in a single
build script with a few conditional statements. However, when your needs start
to go beyond that, things tend to get a little hairy.

This document will show how `mortal-webpack` can help us manage several or a
dozen build profiles for each target platform or environment.

_TBD_
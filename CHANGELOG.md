## 1.1.3

- Added builder [[builders.unless]] for complimenting [[builders.when]]

## 1.1.2

- [[builders.enableDevServer]] now accepts all devServer configuration
  parameters

## 1.1.1

- Added builder [[builders.plugin]]
- [[compose]] will no longer break if `html-webpack-plugin` is not installed
  and no html file is being generated
- [[compose]] will no longer break if `happypack` is not installed and
  happypack was not requested to be used
- Is now somewhat compatible with ExtractTextWebpackPlugin (ugh)

## 1.1.0

- Added builder [[builders.message]]
- Added builder [[builders.generateSourceMaps]]
- Fixed an issue where arrays of directives were not being respected if they
  were inside other arrays (like when using [[builders.when]])
- [[builders.useDLL]] will now verify the manifest for the DLL is usable
- Renamed `builders.resolve` to [[builders.resolveModules]]
- Renamed `builders.resolveLoader` to [[builders.resolveLoaders]]

## 1.0.0

Initial release.
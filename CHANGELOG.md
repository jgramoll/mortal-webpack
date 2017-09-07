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
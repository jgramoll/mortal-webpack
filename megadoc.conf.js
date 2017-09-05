const path = require('path');
const layout = [
  {
    match: { by: 'url', on: '*' },
    regions: [
      {
        name: 'Layout::Content',
        options: { framed: true },
        outlets: [
          {
            name: 'Markdown::Document',
            using: 'articles',
            match: {
              by: 'namespace',
              on: 'articles'
            }
          },
          {
            name: 'Markdown::Document',
            using: 'auxiliary',
            match: {
              by: 'namespace',
              on: 'auxiliary'
            }
          },
          {
            name: 'CJS::Module',
            match: {
              by: 'namespace',
              on: 'js'
            }
          },
        ]
      },

      {
        name: 'Layout::Sidebar',
        outlets: [
          {
            name: 'Markdown::Browser',
            using: 'articles'
          },
          {
            name: 'Layout::SidebarHeader',
            options: {
              text: 'API'
            }
          },
          {
            name: 'CJS::ClassBrowser',
            using: 'js',
          },

          {
            name: 'Layout::SidebarHeader',
            options: {
              text: 'FATALITIES'
            }
          },

          {
            name: 'Markdown::Browser',
            using: 'fatalities',
          },
          {
            name: 'Layout::SidebarHeader',
            options: {
              text: 'AUXILIARY'
            }
          },

          {
            name: 'Markdown::Browser',
            using: 'auxiliary',
          },

          {
            name: 'Layout::SidebarSearch',
            options: {
              text: 'Search'
            }
          },
        ]
      },
    ]
  }
];

module.exports = {
  outputDir: path.resolve(__dirname, 'doc'),
  assetRoot: path.resolve(__dirname),
  strict: true,
  serializer: [ 'megadoc-html-serializer', {
    theme: [ 'megadoc-theme-minimalist', {} ],
    title: 'mortal-webpack',
    resizableSidebar: false,
    fixedSidebar: true,
    sidebarWidth: 340,
    favicon: null,
    metaDescription: 'webpack configuration for mere mortals',
    footer: 'Crafted with &#9829; using <a href="https://github.com/megadoc">megadoc</a>.',
    tooltipPreviews: false,
    styleSheet: path.resolve(__dirname, 'megadoc.conf.less'),
    rewrite: {
      '/readme.html': '/index.html',
    },
    runtimeOutputPath: 'megadoc-assets',
    layoutOptions: {
      banner: false,
      customLayouts: layout,
    },
  }],

  sources: [
    {
      id: 'js',
      include: [ 'lib/*.js' ],
      processor: [ 'megadoc-plugin-js', {
        id: 'js',
        showSourcePaths: false,
        strict: false,
        linkToNamespacesInBrowser: false,
        parserOptions: {
          presets: [['es2015', { modules: false }]],
          babelrc: false,
        },
        builtInTypes: [
          {
            name: 'webpack.DefinePlugin',
            href: 'https://webpack.github.io/docs/list-of-plugins.html#defineplugin'
          },
          {
            name: 'webpack.resolve.alias',
            href: 'https://webpack.github.io/docs/configuration.html#resolve-alias'
          },
          {
            name: 'webpack.module.noParse',
            href: 'https://webpack.github.io/docs/configuration.html#module-noparse'
          },
          {
            name: 'webpack.optimize.CommonsChunkPlugin',
            href: 'https://webpack.github.io/docs/list-of-plugins.html#commonschunkplugin'
          },
          {
            name: 'webpack.NoEmitOnErrorsPlugin',
            href: 'https://webpack.github.io/docs/list-of-plugins.html#noemitonerrorsplugin'
          },

          {
            name: 'webpack.context',
            href: 'https://webpack.github.io/docs/configuration.html#context'
          },
          {
            name: 'Config',
            href: 'https://webpack.github.io/docs/configuration.html'
          }
        ]
      }]
    },
    {
      id: 'articles',
      include: [
        'README.md',
        'CHANGELOG.md',
      ],
      processor: [ 'megadoc-plugin-markdown', {
        id: 'articles',
        baseURL: '/',
        strict: false,
        fullFolderTitles: false,
        discardIdPrefix: 'doc-',
      }]
    },

    {
      id: 'auxiliary',
      include: [
        'examples/istanbul-instrumenting-loader.md'
      ],

      processor: [ 'megadoc-plugin-markdown', {
        baseURL: '/auxiliary',
        strict: false,
        fullFolderTitles: false,
        discardIdPrefix: 'examples-',
      }]
    },

    {
      id: 'fatalities',
      include: [
        'examples/writing-multiple-targets.md'
      ],

      processor: [ 'megadoc-plugin-markdown', {
        baseURL: '/fatalities',
        strict: false,
        fullFolderTitles: false,
        discardIdPrefix: 'examples-',
      }]
    },
  ]
}
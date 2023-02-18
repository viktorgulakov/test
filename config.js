/* global module */

let config = {
  'dir': {
    'src': 'src/',
    'build': 'build/',
    'blocks': 'src/blocks/'
  },
  'addStyleBefore': [
    'src/scss/variables.scss',
    'src/scss/fonts.scss',
    'src/scss/mixins.scss',
    'src/scss/base/all.scss',
    'swiper/swiper-bundle.min.css',
    // 'somePackage/dist/somePackage.css', // для 'node_modules/somePackage/dist/somePackage.css',
  ],
  'addJsBefore': [
    './script.js',
  ],
  'addJsAfter': [],
  'addAssets': {
    'src/fonts/*': 'fonts/',
    // 'node_modules/somePackage/images/*.{png,svg,jpg,jpeg}': 'img/',
  },
  'devBlocks': [
    'lib',
  ],
  // строки для импорта полифиллов
  'polyfills': [
    "core-js/stable/dom-collections/for-each",
    "core-js/stable/object/assign",
    "core-js/stable/object/entries",
    "core-js/stable/number/is-nan",
    "core-js/stable/symbol",
    "core-js/stable/array/from",
    "core-js/stable/array/includes",
    "core-js/stable/array/find-index",
    "core-js/stable/array/find",
    "core-js/stable/array/entries",
    "core-js/stable/promise",
    "custom-event-polyfill",
    "classlist-polyfill",
    "element-remove",
    "url-search-params-polyfill",
  ]
};

module.exports = config;

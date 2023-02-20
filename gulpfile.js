/* global exports process console __dirname */
/* eslint-disable no-console */
'use strict';

// Пакеты, использующиеся при обработке
const { series, parallel, src, dest, watch } = require('gulp');
const fs = require('fs');
const plumber = require('gulp-plumber');
const del = require('del');
const pug = require('gulp-pug');
const svgSprite = require('gulp-svg-sprite');
const imagemin = require('gulp-imagemin');
const imageminPngquant = require('imagemin-pngquant');
const browserSync = require('browser-sync').create();
const debug = require('gulp-debug');
const sass = require('gulp-sass')(require('sass'));
const webpackStream = require('webpack-stream');
const postcss = require('gulp-postcss');
const autoprefixer = require("autoprefixer");
const mqpacker = require("css-mqpacker");
const atImport = require("postcss-import");
const csso = require('gulp-csso');
const cpy = require('cpy');
const path = require('path');
const concat = require('gulp-concat');
const replace = require('gulp-replace');
const config = require('./config');

const dir = config.dir;
const activePagesList = ['index'];

// Глобальные настройки этого запуска
const mode = process.env.MODE || 'development';

// Настройки pug-компилятора
const pugOption = {
  filters: { 'show-code': mode === 'development' ? () => '' : filterShowCode, },
};

// Список и настройки плагинов postCSS
const postCssPlugins = [
  autoprefixer({grid: true}),
  mqpacker({
    sort: true
  }),
  atImport(),
];


function writePugMixinsFile(cb) {
  let pugMixins = "//- Файл генерируется автоматически\n\n";
  const blocks = getBlocksWithExt('pug');
  blocks.forEach((blockName) => {
    pugMixins += `include ${dir.blocks.replace(dir.src, '../')}${blockName}/${blockName}.pug\n`;
  })

  fs.writeFileSync(`${dir.src}pug/mixins.pug`, pugMixins);
  cb();
}
exports.writePugMixinsFile = writePugMixinsFile

// Для build, собирает всё
function compilePug() {
  const fileList = [
    `${dir.src}pages/**/*.pug`,
    `!${dir.src}pages/data/*.pug`,
  ];

  return src(fileList)
    .pipe(debug({title: 'Compiles: '}))
    .pipe(pug(pugOption))
    .pipe(dest(dir.build));
}
exports.compilePug = compilePug

// Сборка demo блоков, для build
function compileBlocksDemo() {
  const fileList = [
    `${dir.src}blocks/**/demo*.pug`
  ];

  return src(fileList)
    .pipe(debug({title: 'Compile: '}))
    .pipe(pug({ pretty: true }))
    .pipe(dest(`${dir.build}blocks`));
}
exports.compileBlocksDemo = compileBlocksDemo

// Сборка при изменение блоков и страниц, пересобирает активные страницы. А также при загрузке страницы
function compilePugFast(pageName) {
  const fileList = [
    `!${dir.src}pages/data/*.pug`,
  ];

  if (typeof pageName === 'string') {
    fileList.push(`${dir.src}pages/${pageName}.pug`);
  } else {
    activePagesList.forEach((page) => {
      fileList.push(`${dir.src}pages/${page}.pug`);
    });
  }

  return src(fileList)
    .pipe(plumber({
      errorHandler: function (err) {
        console.log(err.message);
        this.emit('end');
      }
    }))
    .pipe(debug({title: 'Compiles: '}))
    .pipe(replace(/include:show-code(.*)(.html|.pug)/g, '<pre class="code"><code>Код доступен в build версии</code></pre>'))
    .pipe(pug(pugOption))
    .pipe(dest(dir.build));
}

function copyAssets(cb) {
  for (let item in config.addAssets) {
    let dest = `${dir.build}${config.addAssets[item]}`;
    cpy(item, dest);
  }
  cb();
}
exports.copyAssets = copyAssets;

function copyMainImages() {
  return src([`${dir.src}img/**/*.{png,svg,jpg,jpeg}`,`${dir.src}blocks/**/*.{png,svg,jpg,jpeg}`, `!${dir.src}img/sprite-svg/*.svg`])
    .pipe(
      imagemin([
        imagemin.mozjpeg({ quality: 80, progressive: true }),
        imageminPngquant({ speed: 1, quality: [0.7, 0.9] }),
      ]),
    )
    .pipe(dest(`${dir.build}img`,));
}
exports.copyMainImages = copyMainImages ;

function createSvgSprite () {
  return src(`${dir.src}img/sprite-svg/*.svg`)
    .pipe(svgSprite({
        mode: {
          stack: {
            sprite: "../sprite.svg"
          }
        },
      }
    ))
    .pipe(dest(`${dir.build}img`,));
}
exports.createSvgSprite = createSvgSprite;

function writeSassImportsFile(cb) {
  const scssImportsList = [];
  config.addStyleBefore.forEach(function(src) {
    scssImportsList.push(src);
  });

  const blocks = getBlocksWithExt('scss');
  blocks.forEach(function(blockName){
    if (!config.devBlocks.includes(blockName)) {
      const url = `${dir.blocks}${blockName}/${blockName}.scss`;
      scssImportsList.push(url);
    }
  });

  let styleImports = "//- Файл генерируется автоматически\n\n";
  scssImportsList.forEach(function(src) {
    styleImports += `@import "${src}";\n`;
  });

  fs.writeFileSync(`${dir.src}scss/style.scss`, styleImports);

  cb();
}
exports.writeSassImportsFile = writeSassImportsFile;

function writeSassImportsFileDev(cb) {
  const scssImportsList = [];

  config.devBlocks.forEach(function(blockName){
    const url = `${dir.blocks}${blockName}/${blockName}.scss`;
    scssImportsList.push(url);
  });

  let styleImports = "//- Файл генерируется автоматически\n\n";
  scssImportsList.forEach(function(src) {
    styleImports += `@import "${src}";\n`;
  });

  fs.writeFileSync(`${dir.src}scss/dev.scss`, styleImports);

  cb();
}
exports.writeSassImportsFileDev = writeSassImportsFileDev;


function compileSass() {
  const fileList = [
    `${dir.src}scss/style.scss`,
    `${dir.src}scss/dev.scss`,
  ];
  return src(fileList)
    .pipe(debug({title: 'Compiles style: '}))
    .pipe(sass({includePaths: [__dirname+'/','node_modules']}))
    .pipe(postcss(postCssPlugins))
    .pipe(csso({
      restructure: false,
    }))
    .pipe(dest(`${dir.build}/css`, { sourcemaps: mode === 'development' ? '.' : false }))
    .pipe(browserSync.stream());
}
exports.compileSass = compileSass;

function writeJsRequiresFile(cb) {
  const jsRequiresList = [];
  config.addJsBefore.forEach(function(src) {
    jsRequiresList.push(src);
  });

  const blocks = getBlocksWithExt('js');
  blocks.forEach(function(blockName){
    if (!config.devBlocks.includes(blockName)) {
      jsRequiresList.push(`../blocks/${blockName}/${blockName}.js`)
    }
  });

  config.addJsAfter.forEach(function(src) {
    jsRequiresList.push(src);
  });

  let jsRequires = "//- Файл генерируется автоматически\n\n";
  // добавляем полифилы из core-js
  config.polyfills.forEach((polyfill) => {
    jsRequires += `import '${polyfill}';\n`;
  })

  jsRequires += '/* global require */\n\n';

  jsRequiresList.forEach(function(src) {
    jsRequires += `require('${src}');\n`;
  });

  fs.writeFileSync(`${dir.src}js/entry.js`, jsRequires);
  cb();
}
exports.writeJsRequiresFile = writeJsRequiresFile;

function writeJsRequiresFileDev(cb) {
  const jsRequiresList = [];

  config.devBlocks.forEach(function(blockName){
    jsRequiresList.push(`../blocks/${blockName}/${blockName}.js`)
  });

  let jsRequires = "//- Файл генерируется автоматически\n\n";

  jsRequiresList.forEach(function(src) {
    jsRequires += `require('${src}');\n`;
  });

  fs.writeFileSync(`${dir.src}js/dev.js`, jsRequires);
  cb();
}
exports.writeJsRequiresFileDev = writeJsRequiresFileDev;


function buildJs() {
  const entryList = {
    'bundle': `./${dir.src}js/entry.js`,
    'dev': `./${dir.src}js/dev.js`,
  };

  return src([`${dir.src}js/entry.js`, `${dir.src}js/dev.js`])
    .pipe(plumber())
    .pipe(webpackStream({
      mode: mode,
      entry: entryList,
      devtool: mode === 'development' ? 'inline-source-map' : false,
      output: {
        filename: '[name].js',
      },
      resolve: {
        alias: {
          Utils: path.resolve(__dirname, 'src/js/utils/'),
          Libs: path.resolve(__dirname, 'src/js/libs/'),
        },
      },
      module: {
        rules: [
          {
            test: /\.(js)$/,
            exclude: /core-js/,
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env']
              ],
            },
          }
        ]
      },
    }))
    .pipe(dest(`${dir.build}js`));
}
exports.buildJs = buildJs;


function clearBuildDir() {
  return del([
    `${dir.build}**/*`,
  ]);
}
exports.clearBuildDir = clearBuildDir;

function reload(done) {
  browserSync.reload();
  done();
}

function devMiddleware(req, res, next) {
  if (req.url.includes('.html')) {
    const pageName = req.url.replace(/\/|.html/g, '');
    if (!activePagesList.includes(pageName)) {
      activePagesList.push(pageName);

      compilePugFast(pageName).once('end', () => {
        next();
      });
    } else {
      next();
    }
  } else {
    next();
  }
}

function serve() {

  browserSync.init({
    server: dir.build,
    port: 8080,
    startPath: 'index.html',
    open: true,
    notify: false,
    middleware: devMiddleware,
  });

  // Страницы: изменение, добавление
  watch([`${dir.src}pages/**/*.pug`], { events: ['change', 'add'], delay: 100 }, series(
    compilePugFast,
    reload
  ));

  // Страницы: удаление
  watch([`${dir.src}pages/**/*.pug`], { delay: 100 })
    .on('unlink', function(path) {
      let filePathInBuildDir = path.replace(`${dir.src}pages/`, dir.build).replace('.pug', '.html');
      fs.unlink(filePathInBuildDir, (err) => {
        if (err) throw err;
        console.log(`---------- Delete:  ${filePathInBuildDir}`);
      });
    });

  // Разметка Блоков: изменение
  watch([`${dir.blocks}**/*.pug`, `!${dir.blocks}**/demo-*.pug`], { events: ['change'], delay: 100 }, series(
    compilePugFast,
    reload
  ));

  // Разметка Блоков: добавление
  watch([`${dir.blocks}**/*.pug`, `!${dir.blocks}**/demo-*.pug`], { events: ['add'], delay: 100 }, series(
    writePugMixinsFile,
    compilePugFast,
    reload
  ));

  // Разметка Блоков: удаление
  watch([`${dir.blocks}**/*.pug`, `!${dir.blocks}**/demo-*.pug`], { events: ['unlink'], delay: 100 },
    writePugMixinsFile,
  );

  // Demo блоков: изменение
  watch([`${dir.blocks}**/demo-*.pug`], { events: ['change'], delay: 100 }, series(
    compilePugFast,
    reload
  ));

  // Demo блоков: добавление
  watch([`${dir.blocks}**/demo-*.pug`], { events: ['add'], delay: 100 }, series(
    compilePugFast,
    reload
  ));

  // Шаблоны pug: все события
  watch([`${dir.src}pug/**/*.pug`, `!${dir.src}pug/mixins.pug`], { delay: 100 }, series(
    compilePugFast,
    reload,
  ));

  // Стили Блоков: изменение
  watch([`${dir.blocks}**/*.scss`, `!${dir.blocks}**/*no-js.scss`], { events: ['change'], delay: 100 }, series(
    compileSass,
  ));

  // Стили Блоков: добавление
  watch([`${dir.blocks}**/*.scss`], { events: ['add'], delay: 100 }, series(
    parallel(
      writeSassImportsFile,
      writeSassImportsFileDev,
    ),
    compileSass,
  ));

  // Стилевые глобальные файлы: все события
  watch([`${dir.src}scss/**/*.scss`, `!${dir.src}scss/style.scss`, `!${dir.src}scss/dev.scss`], { events: ['all'], delay: 100 }, series(
    compileSass
  ));

  // Скриптовые глобальные файлы: все события
  watch([`${dir.src}js/**/*.js`, `!${dir.src}js/entry.js`, `!${dir.src}js/dev.js`, `${dir.blocks}**/*.js`], { events: ['all'], delay: 100 }, series(
    parallel(
      writeJsRequiresFile,
      writeJsRequiresFileDev,
    ),
    buildJs,
    reload
  ));

  // Картинки: все события
  watch([`${dir.src}img/**/*.{jpg,jpeg,png,gif,svg,webp}`], { events: ['all'], delay: 100 }, series(
    copyMainImages,
    reload,
  ));

  // sprite.svg
  watch([`${dir.src}img/sprite-svg/*.{svg}`], { events: ['all'], delay: 100 }, series(
    createSvgSprite,
    reload
  ));
}


exports.build = series(
  clearBuildDir,

  // pug
  writePugMixinsFile,
  compileBlocksDemo,
  compilePug,

  // js
  parallel(
    writeJsRequiresFile,
    writeJsRequiresFileDev,
  ),
  buildJs,

  // scss
  parallel(
    writeSassImportsFile,
    writeSassImportsFileDev,
  ),
  parallel(
    compileSass
  ),

  // static
  copyAssets,
  copyMainImages,
  createSvgSprite
);


exports.default = series(
  clearBuildDir,
  parallel(
    // pug
    series(
      parallel(
        writePugMixinsFile
      ),
      compilePugFast,
    ),
    // js
    series(
      parallel(
        writeJsRequiresFile,
        writeJsRequiresFileDev,
      ),
      buildJs
    ),
    // scss
    series(
      parallel(
        writeSassImportsFile,
        writeSassImportsFileDev,
      ),
      parallel(
        compileSass,
      )
    ),
    // static
    copyAssets,
    copyMainImages,
    createSvgSprite
  ),
  serve,
);





// Функции, не являющиеся задачами Gulp ----------------------------------------

/**
 * Получение списка блоков, содержащий файл определённого формата
 * @param  {string} ext Расширение файлов, которое ищется
 */

function getBlocksWithExt(ext) {
  let blocks = [];
  fs.readdirSync(dir.blocks, { withFileTypes: true }).forEach((item) => {
    if (item.isDirectory() && fs.existsSync(`${dir.blocks}${item.name}/${item.name}.${ext}`)) {
      blocks.push(item.name);
    }
  });

  return blocks;
}

//
/**
 * Pug-фильтр, выводящий содержимое pug-файла в виде форматированного текста
 */
function filterShowCode(text, options) {
  var result = '<pre class="code"><code>';
  if (typeof(options['first-line']) !== 'undefined') result = result + options['first-line'] + '</code>\n<code>';
  result = result + text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  result = result + '</code></pre>\n';
  return result;
}

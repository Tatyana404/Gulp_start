const { src, dest, watch, parallel, series } = require('gulp')
const scss = require('gulp-sass')(require('sass'))
const concat = require('gulp-concat')
const browserSync = require('browser-sync').create()
const uglify = require('gulp-uglify-es').default //минификация .js
const autoprefixer = require('gulp-autoprefixer') //сканирует CSS файлы, и автоматически проставляет префиксы к css свойствам
const imagemin = require('gulp-image') //минификация изображений
const del = require('del')

//аналогия лайв сервера. Указываем корневую папку всего приложения
function browsersync () {
  browserSync.init({
    server: {
      baseDir: 'app/'
    }
  })
}

//удаление папки dist каждый раз перед сборкой
function cleanDist () {
  return del('dist')
}

function images () {
  return src('app/images/**/*')
    .pipe(
      imagemin({
        pngquant: true,
        optipng: false,
        zopflipng: true,
        jpegRecompress: false,
        mozjpeg: true,
        gifsicle: true,
        svgo: true,
        concurrent: 10,
        quiet: true
      })
    )
    .pipe(dest('dist/images'))
}

function scripts () {
  return src(['node_modules/jquery/dist/jquery.js', 'app/js/main.js']) //в начале подключаются нужные библиотеки а затем последним наш основной рабочий файл
    .pipe(concat('main.min.js'))
    .pipe(
      uglify() //сжатие js файлов
    )
    .pipe(dest('app/js'))
    .pipe(browserSync.stream()) //автоматическое обновление страницы
}

function styles () {
  return src('app/scss/style.scss') //откуда берем файл
    .pipe(scss({ outputStyle: 'compressed' })) //минификация (удаление пробелов и превращение в строку)
    .pipe(concat('style.min.css')) //имя файла на выходе
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['last 10 version'], //совместимость с более старыми браузерами (напр. display: flex выдаст -->display:-webkit-box;display:-ms-flexbox;display:flex)
        grid: true //чтоб работало с grid
      })
    )
    .pipe(dest('app/css')) //куда положит готовый файл
    .pipe(browserSync.stream()) //аналогия лайв сервера, чтоб стили применялись без перезагрузки
}

//перечисляем все что должно войти в итоговый билд, каждого файла уже здесь должно быть по одному
function build () {
  return src(
    [
      'app/css/style.min.css',
      'app/fonts/**/*',
      'app/js/main.min.js',
      'app/*.html'
    ],
    { base: 'app' } //корневая папка в папке билда
  ).pipe(dest('dist')) //папка в корне куда сложить все сбилженые файлы
}

//отслеживает все файлы по указанному пути и при изменении в них запускает указанную функцию
function watching () {
  watch(['app/scss/**/*.scss'], styles)
  watch(['app/js/**/*.js', '!app/js/main.min.js'], scripts)
  watch('app/*.html').on('change', browserSync.reload) //https://browsersync.io/docs/gulp
}

exports.styles = styles //нигде не импортится, запускается командой gulp styles
exports.watching = watching // нигде не импортится, запускается командой gulp watching (по типу nodemon, забивает консоль)
exports.browsersync = browsersync //запускается gulp browsersync, открывает localhost в браузере и забивает консоль
exports.scripts = scripts
exports.images = images
exports.cleanDist = cleanDist

exports.build = series(cleanDist, images, build) //series отвечает за строгую последовательность запуска функций, в начале удаляет вообще весь прошлый билд, затем перекидываются изображения в новый билд, затем все остальное
exports.default = parallel(styles, scripts, browsersync, watching) //запуск по дефолту, запускается командой gulp, после чего parallel позволяет запускать одновременно несколько процессов, все которые занимают консоль

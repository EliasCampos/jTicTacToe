const {promisify} = require('util');

const gulp = require('gulp');
const pug = require('gulp-pug');
const sass = require('gulp-sass');
const webpack = require('webpack');

const webpackConfig = require('./webpack.config.js');
const paths = {
  markup: {src: 'src/pug/*.pug', dest: 'build/'},
  styles: {src: 'src/sass/*.scss', dest: 'build/css/'}
}

function renderMarkup() {
  return gulp.src(paths.markup.src)
    .pipe(pug({filename: "index"}))
    .pipe(gulp.dest(paths.markup.dest))
}

function renderStyles() {
  return gulp.src(paths.styles.src)
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest(paths.styles.dest))
}

function renderScripts() {
  return promisify(webpack)(webpackConfig)
    .then(stats => {
      const info = stats.toJson();
      if (stats.hasErrors()) console.error(info.errors);
      if (stats.hasWarnings()) console.warn(info.warnings);
    })
    .catch(err => {
      console.error(err.stack || err);
      if (err.details) console.error(err.details);
    });
}

exports.build = gulp.parallel([renderMarkup, renderStyles, renderScripts]);

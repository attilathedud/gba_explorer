let gulp = require("gulp");
let sass = require("gulp-sass");
let cleanCSS = require("gulp-clean-css");

gulp.task("styles", function() {
    return gulp.src("src/scss/**/*.scss")
        .pipe(sass())
        .pipe(cleanCSS())
        .pipe(gulp.dest("src/css/"));
});

gulp.task("watch", function () {
    gulp.watch("src/scss/**/*.scss", ["styles"]);
});

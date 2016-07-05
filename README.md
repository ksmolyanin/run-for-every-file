# run-for-every-file

*node.js 6.x is required*

This is a small node.js utility that do only one thing:
it enumerates files and runs a shell command for every file.

It is primarily intended for using NPM as task runner
(look for "npm run ..." and NPM "scripts" section),
which is suited quite well for building your node.js/web applications
(bundling, minification and so on).

It is cross-platform and should work under Linux, OS X and Windows.

## Usage

Install

    npm install --save-dev run-for-every-file

Run as shell command

    run-for-every-file --src '...' --dest '...' --file '...' --not-file '...' --run '...'

### Parameters

`--src` - source directory; example: `--src './src/'`

`--dest` - destination directory; example: `--dest './dist/prod/'`

`--file` - file pattern; example: `--file '**/*.js'` - gets all *.js files recursively. It uses *glob* syntax. See description of glob patterns: https://github.com/isaacs/node-glob

`--not-file` - file anti-pattern; example: `--file '**/*.min.js'`

Both `--file` and `--not-file` can be used multiple times in one command. Think about them as appended by logical AND.

`--run` - shell command; example: `cat {{file}}` - outputs content of every file to the screen

It is possible to use the following variables inside "run" string:

`{{src}}` - value passed in `--src` param

`{{dest}}` - value passed in `--dest` param

`{{src-file}}` - path to exact source file; example: "./src/app/js/main.js"

`{{dest-file}}` - path to exact destination file; example: "./dist/prod/app/js/main.js"

`{{file}}` - path to the file relative to "src" parameter ("src" part isn't included); example: "app/js/main.js"

`{{file-path}}` - only path part of `{{file}}`; example: "app/js" (without trailing "/")

`{{file-name}}` - only base file name without extension; example: "main.js"

`{{file-ext}}` - file extension; example: "js" (without leading ".")

`{{file-name-ext}}` - file name with extension; example: "main.js"

Also you can pass param with any other name and it will be available as variable `{{your-param-name-here}}`.

#### Advices

- Use trailing slash "/" in directory paths: `--src './src/'`
- Enclose params into quotes (single or double) to prevent substitution of globs by OS: `--file '**/*.js'` should be used instead of just `--file **/*.js`

#### Example

This will just copy all *.js files (excluding *.min.js files) from "./src/" recursively to "./dist/prod/" (without dir structure):

    run-for-every-file --src './src/' --dest './dist/prod/' --file '**/*.js' --not-file '**/*.min.js' --run 'shx cp -f  {{src-file}} {{dest}}/{{file-name-ext}}'

`shx` is node.js utility that makes some *nix commands available cross-platform. See https://github.com/shelljs/shx

#### Complex example of package.json

The following set of commands can be run, for example, as "npm run build:qa" or "npm run build:prod".

It cleans destination dir, clones dir structure inside destination dir,
cleans up and minifies js (except already minified *.min.js files), html, css and json,
builds js source maps (only for "qa" build)
and copies other files (images and so on) to destination dir.

    {
      "name": "my-application",
      "version": "1.0.0",
      "description": "My Application",
      "scripts": {
        "clean": "shx rm -rf",
        "clean:qa": "npm run clean -- './dist/qa/*'",
        "clean:prod": "npm run clean -- './dist/prod/*'",
        "make-dir": "run-for-every-file --src './src/' --file '**/*/' --run 'shx mkdir -p {{dest-file}}'",
        "make-dir:qa": "npm run make-dir --  --dest './dist/qa/'",
        "make-dir:prod": "npm run make-dir --  --dest './dist/prod/'",
        "minify-js:qa": "run-for-every-file --src './src/' --dest './dist/qa/' --file '**/*.js' --not-file '**/*.min.js' --not-file '**/*/' --run 'uglifyjs {{src-file}} -o {{dest-file}} --compress drop_console --mangle --screw-ie8 --source-map {{dest-file}}.map --source-map-url /{{file}}.map --prefix 2 --source-map-include-sources'",
        "minify-js:prod": "run-for-every-file --src './src/' --dest './dist/prod/' --file '**/*.js' --not-file '**/*.min.js' --not-file '**/*/' --run 'uglifyjs {{src-file}} -o {{dest-file}} --compress drop_console --mangle --screw-ie8'",
        "minify-css": "run-for-every-file --src './src/' --file '**/*.css' --not-file '**/*/' --run 'cleancss {{src-file}} -o {{dest-file}} --skip-import'",
        "minify-css:qa": "npm run minify-css --  --dest './dist/qa/'",
        "minify-css:prod": "npm run minify-css --  --dest './dist/prod/'",
        "minify-html": "run-for-every-file --src './src/' --file '**/*.html' --not-file '**/*/' --run 'html-minifier -c ./html-minifier.config.json {{src-file}} -o {{dest-file}}'",
        "minify-html:qa": "npm run minify-html --  --dest './dist/qa/'",
        "minify-html:prod": "npm run minify-html --  --dest './dist/prod/'",
        "minify-json": "run-for-every-file --src './src/' --file '**/*.json' --not-file '**/*/' --run 'mjson.js -s {{src-file}} -o {{dest-file}} -i \"\"'",
        "minify-json:qa": "npm run minify-json --  --dest './dist/qa/'",
        "minify-json:prod": "npm run minify-json --  --dest './dist/prod/'",
        "copy-others": "run-for-every-file --src './src/' --file '**/!(*.js|*.css|*.html|*.json)' --file '**/*.min.js' --not-file '**/*/' --run 'shx cp -f {{src-file}} {{dest-file}}'",
        "copy-others:qa": "npm run copy-others --  --dest './dist/qa/'",
        "copy-others:prod": "npm run copy-others --  --dest './dist/prod/'",
        "build:qa": "npm run clean:qa && npm run make-dir:qa && npm run minify-js:qa && npm run minify-css:qa && npm run minify-html:qa && npm run minify-json:qa && npm run copy-others:qa",
        "build:prod": "npm run clean:prod && npm run make-dir:prod && npm run minify-js:prod && npm run minify-css:prod && npm run minify-html:prod && npm run minify-json:prod && npm run copy-others:prod"
      },
      "devDependencies": {
        "clean-css": "^3.4.18",
        "html-minifier": "^2.1.6",
        "mjson": "^0.4.2",
        "run-for-every-file": "^1.0.0",
        "shx": "^0.1.2",
        "uglify-js": "^2.6.4"
      }
    }

Tools used in this example are

- ShellJS: https://github.com/shelljs/shelljs
- UglifyJS 2: https://github.com/mishoo/UglifyJS2
- clean-css: https://github.com/jakubpawlowicz/clean-css
- HTMLMinifier: https://github.com/kangax/html-minifier
- node-mjson: https://github.com/fkei/node-mjson

## License

**MIT**

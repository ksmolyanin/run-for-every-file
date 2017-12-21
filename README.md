# run-for-every-file

*Node.js >= 6.x is required*

This is small Node.js utility that enumerates files by pattern
and runs any shell or JS command for every file.
It is cross-platform and should work under Linux, OS X and Windows.

It is primarily intended for NPM used as a task runner
(look for "npm run ..." command and "scripts" section of package.json).

## Usage

Install

    npm install --save-dev run-for-every-file

Run as shell command

    run-for-every-file --src '...' --dest '...' --file '...' --not-file '...' --run '...'

### Parameters

`--src` - source directory. Example: `--src ./src/`

`--dest` - destination directory. Example: `--dest ./dist/prod/`

`--file` - file pattern. Example: `--file '**/*.js'` - gets all *.js files recursively.

Patterns use "glob" syntax: https://github.com/isaacs/node-glob

`--run` - shell command. Example: `echo {{src-file}}` - outputs name of every source file to the screen

`--run-js` - JavaScript command. Example: `console.log('{{src-file}}')` - the same as above

`--not-file` - file anti-pattern. Example: `--not-file '**/*.min.js'`

Both `--file` and `--not-file` can be used multiple times in one command. Think about them as joined by logical AND.

`--dot` - enable glob's `dot` setting to include names starting with dots, such as `.gitignore`. Example: `--file * --dot`

`--only-files` - use with `--dot` to filter out non-file names, such as `.vscode/` directories. Example: `--file */* --dot --only-files`

#### The following variables are available inside "run" and "run-js" strings:

`{{src-file}}` - path to exact source file. Example: "./src/app/js/main.js"

`{{dest-file}}` - path to exact destination file. Example: "./dist/prod/app/js/main.js"

`{{file}}` - relative file path. Example: "app/js/main.js"

`{{file-path}}` - only path part of `{{file}}`. Example: "app/js" (without trailing "/")

`{{file-name}}` - base file name. Example: "main"

`{{file-ext}}` - file extension. Example: "js"

`{{file-name-ext}}` - file name with extension. Example: "main.js"

Also, you can pass custom param with any other name and it will be available as variable `{{your-param-name-here}}`.

#### Advices

- Use trailing slash "/" in directory paths: `--src ./src/` (not just `--src ./src`).
- Enclose params into quotes to prevent substitution of globs by OS: `--file '**/*.js'` (not just `--file **/*.js`).
  For Linux both single (`'...'`) and double (`"..."`) quotes are Ok, but Windows allows only double quotes in command line.

#### Example

This example command will copy all *.js files (excluding *.min.js files) from "./src/" recursively to "./dist/prod/" (without dir structure):

    run-for-every-file --src ./src/ --dest ./dist/prod/ --file '**/*.js' --not-file '**/*.min.js' --run 'shx cp -f  {{src-file}} {{dest}}{{file-name-ext}}'

`shx` is Node.js utility that makes some *nix commands available cross-platform: https://github.com/shelljs/shx

#### Complex example

The following *package.json* includes almost all possible usages of params and variables.
Also it is a quite useful example of NPM-based build tool.

Actions performed here are

- Clean destination dir;
- Clone dir structure inside destination dir;
- Clean up and minify js (except already minified *.min.js files);
- Clean up and minify html;
- Clean up and minify css;
- Clean up and minify json;
- Build JS source maps (only for "qa" build);
- Copy other files (images and so on) to destination dir.

It can be run from command prompt by "npm run build:qa" or "npm run build:prod".

It is adopted to be used on Windows (so there are many escaped double quotes inside (`\"`).

    {
      "name": "my-application",
      "version": "1.0.0",
      "description": "My Application",
      "scripts": {
          "start": "webpack-dev-server --config ./webpack.config.js",
          "start:dev": "npm run start -- --content-base \"./src/\"",
          "start:qa": "npm run start -- --content-base \"./dist/qa/\"",
          "start:prod": "npm run start -- --content-base \"./dist/prod/\"",
          "clean": "shx rm -rf",
          "clean:dev": "npm run clean -- \"./dist/dev/*\"",
          "clean:qa": "npm run clean -- \"./dist/qa/*\"",
          "clean:prod": "npm run clean -- \"./dist/prod/*\"",
          "make-dir": "run-for-every-file --src \"./src/\" --file \"**/*/\" --run \"shx mkdir -p {{dest-file}}\"",
          "make-dir:dev": "npm run make-dir --  --dest \"./dist/dev/\"",
          "make-dir:qa": "npm run make-dir --  --dest \"./dist/qa/\"",
          "make-dir:prod": "npm run make-dir --  --dest \"./dist/prod/\"",
          "minify-js:qa": "run-for-every-file --src \"./src/\" --dest \"./dist/qa/\" --file \"**/*.js\" --not-file \"**/*.min.js\" --not-file \"**/*/\" --run \"uglifyjs {{src-file}} -o {{dest-file}} --compress drop_console --mangle --screw-ie8 --source-map {{dest-file}}.map --source-map-url /{{file}}.map --prefix 2 --source-map-include-sources\"",
          "minify-js:prod": "run-for-every-file --src \"./src/\" --dest \"./dist/prod/\" --file \"**/*.js\" --not-file \"**/*.min.js\" --not-file \"**/*/\" --run \"uglifyjs {{src-file}} -o {{dest-file}} --compress drop_console --mangle --screw-ie8\"",
          "minify-css": "run-for-every-file --src \"./src/\" --file \"**/*.css\" --not-file \"**/*/\" --run \"cleancss {{src-file}} -o {{dest-file}} --skip-import\"",
          "minify-css:qa": "npm run minify-css --  --dest \"./dist/qa/\"",
          "minify-css:prod": "npm run minify-css --  --dest \"./dist/prod/\"",
          "minify-html": "run-for-every-file --src \"./src/\" --file \"**/*.html\" --not-file \"**/*/\" --run \"html-minifier -c ./html-minifier.config.json {{src-file}} -o {{dest-file}}\"",
          "minify-html:qa": "npm run minify-html --  --dest \"./dist/qa/\"",
          "minify-html:prod": "npm run minify-html --  --dest \"./dist/prod/\"",
          "minify-json": "run-for-every-file --src \"./src/\" --file \"**/*.json\" --not-file \"**/*/\" --run-js \"var fs = require(\\\"fs\\\"); fs.writeFileSync(\\\"{{dest-file}}\\\", JSON.stringify(JSON.parse(fs.readFileSync(\\\"{{src-file}}\\\", {encoding: \\\"utf8\\\"}))));\"",
          "minify-json:qa": "npm run minify-json --  --dest \"./dist/qa/\"",
          "minify-json:prod": "npm run minify-json --  --dest \"./dist/prod/\"",
          "copy-others": "run-for-every-file --src \"./src/\" --file \"**/!(*.js|*.css|*.html|*.json)\" --file \"**/*.min.js\" --not-file \"**/*/\" --run \"shx cp -f {{src-file}} {{dest-file}}\"",
          "copy-others:dev": "run-for-every-file --src \"./src/\" --dest \"./dist/dev/\" --file \"**/*\" --not-file \"**/*/\" --run \"shx cp -f {{src-file}} {{dest-file}}\"",
          "copy-others:qa": "npm run copy-others --  --dest \"./dist/qa/\"",
          "copy-others:prod": "npm run copy-others --  --dest \"./dist/prod/\"",
          "build:dev": "npm run clean:dev && npm run make-dir:dev && npm run  copy-others:dev",
          "build:qa": "npm run clean:qa && npm run make-dir:qa && npm run minify-js:qa && npm run minify-css:qa && npm run minify-html:qa && npm run minify-json:qa && npm run copy-others:qa",
          "build:prod": "npm run clean:prod && npm run make-dir:prod && npm run minify-js:prod && npm run minify-css:prod && npm run minify-html:prod && npm run minify-json:prod && npm run copy-others:prod"
        },
        "devDependencies": {
          "clean-css": "^3.4.18",
          "html-minifier": "^2.1.6",
          "run-for-every-file": "^1.0.0",
          "shx": "^0.1.2",
          "uglify-js": "^2.6.4"
        }
    }

Other tools used in this example are

- shx/ShellJS: https://github.com/shelljs/shelljs
- UglifyJS 2: https://github.com/mishoo/UglifyJS2
- clean-css: https://github.com/jakubpawlowicz/clean-css
- HTMLMinifier: https://github.com/kangax/html-minifier

## License

**MIT**

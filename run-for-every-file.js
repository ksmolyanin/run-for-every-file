#!/usr/bin/env node

/**
 * Small node.js utility that enumerates files and runs a shell command for every file.
 * @author Konstantin Smolyanin
 * @license MIT
 */

'use strict';

const path = require('path');
const execSync = require('child_process').execSync;
const vm = require('vm');

const glob = require('glob');
const minimist = require('minimist');

/**
 * It substitutes params in template.
 * @param {string} template
 * @param {Object} params
 * @param {string} [srcDir]
 * @param {string} [srcFile]
 * @param {string} [destDir]
 * @param {string} [destFile]
 * @return {string}
 */
function placeParams(template, params, srcDir = null, srcFile = null, destDir = null, destFile = null) {
    return template.replace(/{{([^{}]+)}}/g, (_, name) => {
        if (name === 'src-file') {
            if (srcFile) {
                return srcFile;
            } else {
                throw new Error('Cannot get source path to substitute {{src-file}} param!');
            }
        } else if (name === 'dest-file') {
            if (destFile) {
                return destFile;
            } else {
                throw new Error('Cannot get destination path to substitute {{dest-file}} param!');
            }
        } else if (['file', 'file-path', 'file-name', 'file-ext', 'file-name-ext'].includes(name)) {
            let relPath;
            if (srcFile) {
                relPath = srcFile.substr((srcDir || '').length);
            } else if (destFile) {
                relPath = destFile.substr((destDir || '').length);
            } else {
                throw new Error('Cannot get path to substitute {{' + name + '}} param!');
            }
            switch (name) {
                case 'file':
                    return relPath;
                case 'file-path':
                    return path.dirname(relPath);
                case 'file-name':
                    const basename = path.basename(relPath);
                    return basename.substr(0, basename.length - path.extname(relPath).length);
                case 'file-ext':
                    return path.extname(relPath).substr(1);
                case 'file-name-ext':
                    return path.basename(relPath);
            }
        } else if (['run', 'run-js'].includes(name)) { // not replaceable params
            return '{{' + name + '}}';
        } else { // optional replaceable params
            return name in params ? params[name] : '{{' + name + '}}';
        }
    });
}

/**
 * It finds all files in source dir that are suited for passed patterns.
 * @param {string} srcDir
 * @param {string|Array} globPattern
 * @param {string|Array} globAntiPattern
 * @param {Object} globOptions
 * @return {Array}
 */
function findFiles(srcDir, globPattern, globAntiPattern = '', globOptions = {}) {
    const search = (dir, pattern, globOptions) => {
        pattern = Array.isArray(pattern) ? pattern : [pattern];
        return pattern.reduce((files, pattern) => {
            return files.concat(glob.sync(dir + pattern, globOptions));
        }, []);
    };

    let result = [];

    const includeFiles = search(srcDir, globPattern, globOptions);
    if (globAntiPattern) {
        const excludeFiles = search(srcDir, globAntiPattern, globOptions);
        result = includeFiles.filter((file) => !excludeFiles.includes(file));
    } else {
        result = includeFiles;
    }

    return result;
}

/**
 * It executes shell command or evaluates JS string.
 * @param {boolean} isJsCommand
 * @param {string} command
 * @param {boolean} isSilent
 */
function run(isJsCommand, command, isSilent = false) {
    !isSilent && process.stdout.write(`COMMAND: ${command}\n`);
    if (isJsCommand) {
        vm.runInThisContext('(function (require) { ' + command + ' });')(require);
    } else {
        const output = execSync(command) || '';
        !isSilent && process.stdout.write(output);
    }
}

const params = minimist(process.argv.slice(2));
const srcDir = params.src || null;
const destDir = params.dest || null;
const globPattern = params.file || '';
const globAntiPattern = params['not-file'] || '';
const command = params.run || params['run-js'] || null;
const isJsCommand = 'run-js' in params;
const isSilent = Boolean(params.silent);
const includeDotFiles = Boolean(params.dot);

const globOptions = {
    mark: true,
    strict: true,
    dot: includeDotFiles
};

if (!command) {
    throw new Error('Required parameter "run" not provided!');
}

if (!srcDir) {
    run(isJsCommand, placeParams(command, params), isSilent);
    process.exit();
}

const srcFiles = findFiles(srcDir, globPattern, globAntiPattern, globOptions);

if (!srcFiles.length) {
    !isSilent && console.warn('No one file has been found! Command didn\'t run.');
    process.exit();
}

srcFiles.forEach((srcFile) => {
    const destFile = destDir ? destDir + srcFile.substr(srcDir.length) : null;
    run(isJsCommand, placeParams(command, params, srcDir, srcFile, destDir, destFile), isSilent);
});

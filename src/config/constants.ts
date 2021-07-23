import path from 'path';

const pkg = require(path.resolve('package.json'));

export const packageName = pkg.name;
export const LOCAL_PACKAGE_FILE = 'package.json';
export const DEFAULT_TAG = 'latest';
export const DEFAULT_TAG_PRERELEASE = 'next';
export const NPM_DEFAULT_REGISTRY = 'https://registry.npmjs.org';

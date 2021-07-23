/* eslint-disable no-nested-ternary */
import semver from 'semver';
import chalk from 'chalk';
import { IOptions } from '../../../type';

const { green, red, redBright } = chalk;

export const prompts = {
  incrementList: {
    type: 'list',
    message: () => 'Select increment (next version):',
    choices: (context: IOptions) => getIncrementChoices(context),
    pageSize: 9,
  },
  preRelease: {
    type: 'input',
    message: (context: IOptions) => {
      const { latestVersion } = context.npm;
      const { preReleaseId = 'alpha' } = context.version;
      const defaultVersion = semver.inc(latestVersion!, 'prerelease', preReleaseId);
      const prompt = `(default: "${preReleaseId}", yielding ${defaultVersion})`;
      return `Enter a prerelease identifier ${prompt}`;
    },
    filter: (context: IOptions) => versionFilter(context),
  },
  custom: {
    type: 'input',
    message: () => `Please enter a valid version:`,
    transformer: (context: IOptions) => versionTransformer(context),
    validate: (input: string | semver.SemVer | null | undefined) =>
      !!semver.valid(input) || 'The version must follow the semver standard.',
  },
};

const getIncrementChoices = (context: IOptions) => {
  const version = context.npm.latestVersion!;
  const { preReleaseId = 'alpha', isPreRelease, increment } = context.version;

  const patch = semver.inc(version, 'patch');
  const minor = semver.inc(version, 'minor');
  const major = semver.inc(version, 'major');
  const prepatch = semver.inc(version, 'prepatch', preReleaseId);
  const preminor = semver.inc(version, 'preminor', preReleaseId);
  const premajor = semver.inc(version, 'premajor', preReleaseId);
  if (typeof increment === 'undefined' && isPreRelease) {
    return [
      { value: prepatch, name: `Prepatch (${prepatch})` },
      { value: preminor, name: `Preminor (${preminor})` },
      { value: premajor, name: `Premajor (${premajor})` },
      { value: 'CUSTOM', name: 'Custom Version' },
    ];
  } else {
    return [
      { value: patch, name: `Patch (${patch})` },
      { value: minor, name: `Minor (${minor})` },
      { value: major, name: `Major (${major})` },
      { value: prepatch, name: `Prepatch (${prepatch})` },
      { value: preminor, name: `Preminor (${preminor})` },
      { value: premajor, name: `Premajor (${premajor})` },
      { value: 'PRERELEASE', name: 'Custom Prerelease (alpha,beta,rc...)' },
      { value: 'CUSTOM', name: 'Custom Version' },
    ];
  }
};

const versionFilter = (context: IOptions) => (input: string) => {
  const { latestVersion } = context.npm;
  const { preReleaseId = 'alpha' } = context.version;
  return semver.inc(latestVersion!, 'prerelease', input || preReleaseId);
};

const versionTransformer = (context: IOptions) => (input: string) =>
  semver.valid(input) ? (semver.gt(input, context.npm.latestVersion!) ? green(input) : red(input)) : redBright(input);

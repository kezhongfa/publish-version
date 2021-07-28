import path from 'path';
import { cosmiconfigSync } from 'cosmiconfig';
import parseJson from 'parse-json';
import { parse } from 'yaml';
import { isPlainObject, defaultsDeep, cloneDeep, merge, get } from 'lodash';
import defaultConfig from '@/config/publish-version.json';
import { LOCAL_PACKAGE_FILE, packageName } from '@/config/constants';
import { debugByNameSpace } from '@/helpers';
import {
  IOptions,
  ILocalPackageManifest,
  PartialDeep,
  IContextOptions,
  IGetContextOptions,
  IGitOptions,
  INpmOptions,
} from '../type';

const debug = debugByNameSpace('config');
const searchPlaces = [
  'package.json',
  `.${packageName}.json`,
  `.${packageName}.js`,
  `.${packageName}.yaml`,
  `.${packageName}.yml`,
];

const loaders = {
  '.json': (_: any, content: string | null) => parseJson(content),
  '.yaml': (_: any, content: string) => parse(content),
};

const getLocalConfig = (localConfigFile?: string) => {
  const localConfig = {};
  const explorer = cosmiconfigSync(packageName, {
    searchPlaces,
    loaders,
  });
  const result = localConfigFile ? explorer.load(localConfigFile) : explorer.search();
  if (result && typeof result.config === 'string') {
    throw new Error(`Invalid configuration file at ${result.filepath}`);
  }
  return result && isPlainObject(result.config) ? result.config : localConfig;
};

const getNpmPackageManifest = (manifestFile?: string | boolean) => {
  let npm = {} as ILocalPackageManifest;
  if (manifestFile === false) return npm;
  const manifestPath = path.resolve(<string>manifestFile || LOCAL_PACKAGE_FILE);
  try {
    npm = require(manifestPath);
  } catch (err) {
    debug(err);
  }
  return npm;
};

class Config {
  constructorConfig: PartialDeep<IOptions>;

  localConfig: PartialDeep<IOptions>;

  options: IOptions;

  localPackageManifest: ILocalPackageManifest;

  context: IContextOptions;

  constructor(o: PartialDeep<IOptions>) {
    const config = this.formatOption(o);
    this.constructorConfig = config;
    this.localConfig = getLocalConfig(config.config);
    this.localPackageManifest = getNpmPackageManifest(config.manifest);
    this.options = this.expand(this.mergeOptions());
    this.context = {};
    debug(this.options);
  }

  formatOption(o: PartialDeep<IOptions>) {
    const options = cloneDeep(o);
    const { git, npm } = options;
    if (Array.isArray(git) && git.includes(false)) {
      // @ts-ignore
      options.git = false;
    } else if (Array.isArray(npm) && npm.includes(false)) {
      // @ts-ignore
      options.npm = false;
    } else if (options['only-changelog']) {
      options.increment = false;
    }
    return options;
  }

  expand(options: IOptions) {
    return this.expandNoNpm(this.expandNoGit(this.expandVersion(options)));
  }

  expandNoNpm(o: IOptions) {
    const options = cloneDeep(o);
    const { npm, increment } = options;
    // @ts-ignore
    if (npm === false || options['only-changelog']) {
      options.npm = { skipCheck: true, publish: false } as INpmOptions;
    } else if (increment !== false) {
      options.npm.tag = options.npm.tag || options.version.preReleaseId;
    }
    return defaultsDeep({}, options, {
      npm: this.npmConfig,
    });
  }

  expandNoGit(o: IOptions) {
    const options = cloneDeep(o);
    const { git } = options;
    // @ts-ignore
    if (git === false) {
      options.git = { skipCheck: true, commit: false, tag: false, push: false } as IGitOptions;
    } else if (options['only-changelog']) {
      options.git = {
        skipCheck: true,
        commit: false,
        tag: false,
        push: false,
        changelog: git.changelog,
      } as IGitOptions;
    }
    return options;
  }

  expandVersion(o: IOptions) {
    const options = cloneDeep(o || {});
    const { increment, preRelease, preReleaseId } = options;
    options.version = {
      increment,
      isPreRelease: Boolean(preRelease),
      preReleaseId: typeof preRelease === 'string' ? preRelease : preReleaseId,
    };

    return options;
  }

  mergeOptions() {
    return defaultsDeep(
      {},
      this.constructorConfig,
      this.localConfig,
      {
        npm: this.npmConfig,
      },
      defaultConfig,
    );
  }

  get npmConfig() {
    const { version: latestVersion, name, private: isPrivate, publishConfig } = this.localPackageManifest;
    return {
      latestVersion: latestVersion || '0.0.0',
      name: name || path.basename(process.cwd()),
      private: isPrivate,
      publish: !!name,
      publishConfig,
    };
  }

  getContext(path?: any): IGetContextOptions {
    const context = merge({}, this.options, this.context);
    return path ? get(context, path) : context;
  }

  setContext(options: Partial<IContextOptions>) {
    debug(options);
    merge(this.context, options);
  }

  get isUpdate() {
    return this.options.increment === false;
  }
}

export default Config;

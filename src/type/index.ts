import Config from '../lib/config';
import Log from '../lib/log';
import Prompt from '../lib/prompt';
import Shell from '../lib/shell';
import Spinner from '../lib/spinner';

export type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

export type TContainer = {
  log: Log;
  config: Config;
  prompt: Prompt;
  spinner: Spinner;
  shell: Shell;
};

export enum ENamespace {
  npm = 'npm',
  git = 'git',
  version = 'version',
}

export type TAccess = 'public' | 'restricted';
export interface IPublishConfig {
  registry?: string;
  access?: TAccess;
}

export interface IGitRepo {
  host: string | null;
  owner?: string | null;
  project: string | null;
  protocol: string | null;
  remote: string | null;
  repository: string | null;
}

export interface IIncrementBase {
  latestVersion?: string;
  increment?: string | boolean;
  isPreRelease?: boolean;
  preReleaseId?: string;
}

export interface IGitOptions {
  skipCheck: boolean;
  requireCleanWorkingDir: boolean;
  requireBranch: null | string[] | string;
  addUntrackedFiles: boolean;
  commit: boolean;
  commitMessage: string;
  commitArgs: string[];
  tag: boolean;
  tagName: string;
  tagMessage: string;
  tagArgs: string[];
  push: boolean;
  pushArgs: string[];
  changelog: string | null;
}

export interface INpmOptions {
  skipCheck: boolean;
  name: string;
  latestVersion?: string;
  private?: boolean;
  publishConfig?: IPublishConfig;
  publish: boolean;
  publishPath: string;
  tag?: string | null | number;
  registry: string | null;
  access: TAccess | null;
  timeout: number;
  publishArgs: string[];
}
export interface IVersionOptions {
  increment?: string | boolean;
  isPreRelease: boolean;
  preReleaseId?: string;
}
export interface IHooksOptions {
  beforeStart: string | string[] | null;
  afterStart: string | string[] | null;
  beforeVersion: string | string[] | null;
  afterVersion: string | string[] | null;
  beforePublish: string | string[] | null;
  afterPublish: string | string[] | null;
}

export interface ILocalPackageManifest {
  name?: string;
  version?: string;
  private?: boolean;
  publishConfig?: IPublishConfig;
}
export interface ICommonOptions {
  increment?: string | boolean;
  preRelease?: string | boolean;
  preReleaseId?: string;
  config?: string;
  manifest?: string;
  _: string[];
  c?: string;
  ['only-changelog']?: boolean;
}

export interface IOptions extends ICommonOptions {
  git: IGitOptions;
  npm: INpmOptions;
  hooks: IHooksOptions;
  version: IVersionOptions;
}

export interface IContextOptions {
  repo?: IGitRepo;
  latestVersion?: string;
  name?: string;
  version?: string | null;
  latestTag?: string | null;
}

export interface IGetContextOptions extends IOptions, IContextOptions {
  version: IVersionOptions & string;
}

export interface IGitContextOptions {
  isCommitted?: boolean;
  isTagged?: boolean;
}

export interface INpmContextOptions {
  isPublished?: boolean;
  tag?: string | number | null;
  version?: string;
  username?: string | null;
}

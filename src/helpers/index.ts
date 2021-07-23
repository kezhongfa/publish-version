/* eslint-disable no-nested-ternary */
/* eslint-disable no-template-curly-in-string */
import gitUrlParse from 'git-url-parse';
import debug from 'debug';
import { template, last } from 'lodash';
import { packageName } from '@/config/constants';
import Log from '@/lib/log';
import semver from 'semver';
import { IGitRepo } from '../type';

const log = new Log();

export const noop = Promise.resolve();

export const format = (t = '', context?: any) => {
  try {
    return template(t)(context);
  } catch (error) {
    log.error(`Unable to render template with context:\n${t}\n${JSON.stringify(context)}`);
    log.error(error);
    throw error;
  }
};

export const debugByNameSpace = (namespace: string) => debug(`${packageName}:${namespace}`);

export const parseGitUrl = (remoteUrl?: string): IGitRepo => {
  if (!remoteUrl) return { host: null, owner: null, project: null, protocol: null, remote: null, repository: null };
  const normalizedUrl = remoteUrl.replace(/\\/g, '/');
  const parsedUrl = gitUrlParse(normalizedUrl);
  const { resource: host, name: project, protocol, href: remote } = parsedUrl;
  const owner = protocol === 'file' ? last(parsedUrl.owner.split('/')) : parsedUrl.owner;
  const repository = `${owner}/${project}`;
  return { host, owner, project, protocol, remote, repository };
};

export const sleep = (ms?: number) => new Promise(resolve => setTimeout(resolve, ms));

export const rejectAfter = (ms?: number) =>
  sleep(ms).then(() => {
    throw new Error(`Timed out after ${ms || 0}ms.`);
  });

export const parseVersion = (raw?: string | null) => {
  if (raw == null) return { version: raw, isPreRelease: false, preReleaseId: null };
  const version = semver.valid(raw) ? raw : semver.coerce(raw);
  if (!version) return { version: raw, isPreRelease: false, preReleaseId: null };
  const parsed = semver.parse(version);
  let isPreRelease = false;
  let preReleaseId = null;
  if (parsed) {
    isPreRelease = parsed.prerelease.length > 0;
    preReleaseId = isPreRelease && isNaN(Number(parsed.prerelease[0])) ? parsed.prerelease[0] : null;
  }

  return {
    version: version.toString(),
    isPreRelease,
    preReleaseId,
  };
};

export const fixArgs = (args?: string | string[]) => (args ? (typeof args === 'string' ? args.split(' ') : args) : []);

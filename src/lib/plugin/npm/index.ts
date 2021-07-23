import semver from 'semver';
import { get } from 'lodash';
import { ENamespace, INpmContextOptions, INpmOptions, TContainer } from '../../../type';
import { CollaboratorError, NpmAuthError, NpmTimeoutError } from '../../errors';
import { fixArgs, parseVersion, rejectAfter } from '@/helpers';
import { prompts } from './prompts';
import BasePlugin from '../base-plugin';
import { DEFAULT_TAG, DEFAULT_TAG_PRERELEASE, NPM_DEFAULT_REGISTRY } from '@/config/constants';

class npm extends BasePlugin<INpmOptions, INpmContextOptions> {
  constructor({ namespace, container }: { namespace: ENamespace; container: TContainer }) {
    super({ container, namespace });
    this.registerPrompts(prompts);
  }

  async validate() {
    const { publish, latestVersion: version, private: isPrivate, skipCheck } = this.options;
    if (skipCheck || !publish || isPrivate) return;

    const timeout = Number(this.options.timeout) * 1000;
    const validations = Promise.all([this.isRegistryOk(), this.isAuthenticated(), this.getLatestVersion()]);
    await Promise.race([validations, rejectAfter(timeout)]).catch(() => {
      throw new NpmTimeoutError(timeout);
    });
    const [isRegistryOk, isAuthenticated, latestVersion] = await validations;
    if (!isRegistryOk) {
      throw new NpmTimeoutError(timeout);
    }
    if (!isAuthenticated) {
      throw new NpmAuthError();
    }

    if (!(await this.isCollaborator())) {
      const { username, name } = this.getContext();
      throw new CollaboratorError(username, name);
    }

    if (!latestVersion) {
      this.log.warn('No version found in npm registry. Assuming new package.');
    } else if (!semver.eq(latestVersion, version!)) {
      this.log.warn(`Latest version in registry (${latestVersion}) does not match package.json (${version}).`);
    }
  }

  get registryArg() {
    const registry = this.getRegistry();
    return registry !== NPM_DEFAULT_REGISTRY ? ` --registry ${registry}` : '';
  }

  isAuthenticated() {
    return this.shell.exec(`npm whoami${this.registryArg}`).then(
      output => {
        const username = output ? output.trim() : null;
        this.setContext({ username });
        return true;
      },
      err => {
        this.debug(err);
        if (/code E40[04]/.test(err)) {
          this.log.warn('Ignoring response from unsupported `npm whoami` command.');
          return true;
        }
        return false;
      },
    );
  }

  isRegistryOk() {
    return this.shell.exec(`npm ping${this.registryArg}`).then(
      () => true,
      err => {
        this.debug(err);
        return false;
      },
    );
  }

  isCollaborator() {
    const name = this.getName();
    const { username } = this.getContext();
    if (username === undefined) return true;
    if (username === null) return false;
    return this.exec(`npm access ls-collaborators ${name}${this.registryArg}`).then(
      output => {
        try {
          const collaborators = JSON.parse(output);
          const permissions = collaborators[username];
          return permissions && permissions.includes('write');
        } catch (err) {
          this.debug(err);
          return false;
        }
      },
      err => {
        this.debug(err);
        return true;
      },
    );
  }

  async getLatestVersion() {
    const { latestVersion, name } = this.options;
    const tag = await this.resolveTag(latestVersion!);
    try {
      return this.shell.exec(`npm show ${name}@${tag} version${this.registryArg}`).catch(() => null);
    } catch (e) {
      return null;
    }
  }

  getRegistry() {
    return get(this.options, 'registry', get(this.options, 'publishConfig.registry', NPM_DEFAULT_REGISTRY));
  }

  getName() {
    return this.getContext('name');
  }

  getRegistryPreReleaseTags() {
    return this.shell.exec(`npm view ${this.getName()} dist-tags --json`).then(
      output => {
        try {
          const tags = JSON.parse(output);
          return Object.keys(tags).filter(tag => tag !== DEFAULT_TAG);
        } catch (err) {
          this.debug(err);
          return [];
        }
      },
      () => [],
    );
  }

  async guessPreReleaseTag() {
    const [tag] = await this.getRegistryPreReleaseTags();
    if (tag) {
      return tag;
    } else {
      this.log.warn(`Unable to get pre-release tag(s) from npm registry. Using "${DEFAULT_TAG_PRERELEASE}".`);
      return DEFAULT_TAG_PRERELEASE;
    }
  }

  async resolveTag(version: string) {
    const { tag } = this.options;
    const { isPreRelease, preReleaseId } = parseVersion(version);
    if (!isPreRelease) {
      return DEFAULT_TAG;
    } else {
      return tag || preReleaseId || (await this.guessPreReleaseTag());
    }
  }

  async bump(version: string) {
    const tag = this.options.tag || (await this.resolveTag(version));
    this.setContext({ version, tag });

    if (this.config.isUpdate) return false;

    const task = () => this.shell.exec(`npm version ${version} --no-git-tag-version`);
    return this.spinner.show({ task, label: 'npm version' });
  }

  async publish() {
    if (this.options.publish === false) return false;

    await this.showPrompt({
      promptName: 'publish',
      task: this._publish.bind(this),
    });
  }

  private async _publish(isPublish: boolean) {
    if (!isPublish) {
      return;
    }
    const { publishPath = '.', private: isPrivate, publishArgs } = this.options;

    const { tag = DEFAULT_TAG } = this.getContext();
    if (isPrivate) {
      this.log.warn('Skip publish: package is private.');
      return false;
    }
    const args = [publishPath, `--tag ${tag}`, ...fixArgs(publishArgs)].filter(Boolean);
    return this.shell
      .exec(`npm publish ${args.join(' ')}`)!
      .then(() => {
        this.setContext({ isPublished: true });
      })
      .catch(err => {
        this.debug(err);
        throw err;
      });
  }
}

export default npm;

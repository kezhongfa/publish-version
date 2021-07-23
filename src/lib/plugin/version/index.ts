/* eslint-disable no-nested-ternary */
import { ENamespace, IIncrementBase, IVersionOptions, TContainer } from '../../../type';
import { isString } from 'lodash';
import semver, { ReleaseType } from 'semver';
import BasePlugin from '../base-plugin';
import { prompts } from './prompts';

const RELEASE_TYPES = ['patch', 'minor', 'major'];
const PRERELEASE_TYPES = ['prepatch', 'preminor', 'premajor'];
const CONTINUATION_TYPES = ['prerelease'];
const ALL_RELEASE_TYPES = [...RELEASE_TYPES, ...PRERELEASE_TYPES, ...CONTINUATION_TYPES];

class Version extends BasePlugin<IVersionOptions> {
  constructor({ namespace, container }: { namespace: ENamespace; container: TContainer }) {
    super({ container, namespace });
    this.registerPrompts(prompts);
  }

  async getIncrementedVersion(options: IIncrementBase) {
    const version = this.incrementVersion(options);

    return version || (await this.promptIncrementVersion(options));
  }

  isPreRelease(version: string | semver.SemVer) {
    return Boolean(semver.prerelease(version));
  }

  isValid(version: string | semver.SemVer | null | undefined) {
    return Boolean(semver.valid(version));
  }

  promptIncrementVersion(options: IIncrementBase): Promise<any> {
    return new Promise(resolve => {
      this.showPrompt({
        promptName: 'incrementList',
        task: (increment: string) => {
          if (increment === 'CUSTOM') {
            return this.showPrompt({ promptName: 'custom', task: resolve });
          } else if (increment === 'PRERELEASE') {
            return this.showPrompt({ promptName: 'preRelease', task: resolve });
          } else {
            return resolve(this.incrementVersion(Object.assign({}, options, { increment })));
          }
        },
      });
    });
  }

  incrementVersion({ latestVersion, increment, isPreRelease, preReleaseId }: IIncrementBase) {
    if (increment === false) {
      return latestVersion;
    }
    if (isString(increment)) {
      const latestIsPreRelease = this.isPreRelease(latestVersion!);
      const isValidVersion = this.isValid(increment);

      if (isValidVersion && semver.gte(increment, latestVersion!)) {
        return increment;
      }
      const coercedVersion = !isValidVersion && semver.coerce(increment);
      if (coercedVersion && semver.gte(coercedVersion, latestVersion!)) {
        this.log.warn(`Coerced invalid semver version "${increment}" into "${coercedVersion}".`);
        return coercedVersion.toString();
      }

      if (isPreRelease && !increment && latestIsPreRelease) {
        return semver.inc(latestVersion!, 'prerelease', preReleaseId);
      }

      const normalizedType = RELEASE_TYPES.includes(increment) && isPreRelease ? `pre${increment}` : increment;
      if (ALL_RELEASE_TYPES.includes(normalizedType)) {
        return semver.inc(latestVersion!, normalizedType as ReleaseType, preReleaseId);
      }
    }
  }
}

export default Version;

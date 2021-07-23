import { includes, castArray } from 'lodash';
import { ENamespace, IGitContextOptions, IGitOptions, TContainer } from '../../../type';
import {
  GitCleanWorkingDirError,
  GitNetworkError,
  GitRemoteUrlError,
  GitRepoError,
  RequireBranchError,
} from '../../errors';
import { parseGitUrl, format, fixArgs } from '@/helpers';
import { prompts } from './prompts';
import BasePlugin from '../base-plugin';

class Git extends BasePlugin<IGitOptions, IGitContextOptions> {
  remoteUrl!: string;

  constructor({ namespace, container }: { namespace: ENamespace; container: TContainer }) {
    super({ container, namespace });
    this.registerPrompts(prompts);
  }

  async validate() {
    if (this.options.skipCheck) {
      this.config.setContext({ repo: parseGitUrl() });
      return;
    }

    if (!(await this.isGitRepo())) {
      throw new GitRepoError();
    }

    if (this.options.requireBranch && !(await this.isRequiredBranch())) {
      throw new RequireBranchError(this.options.requireBranch);
    }

    if (this.options.requireCleanWorkingDir && !(await this.isWorkingDirClean())) {
      throw new GitCleanWorkingDirError();
    }

    this.remoteUrl = await this.getRemoteUrl();
    if (this.options.push && !this.remoteUrl) {
      throw new GitRemoteUrlError();
    }
    this.config.setContext({ repo: parseGitUrl(this.remoteUrl) });

    await this.fetch();
    const latestTag = await this.getLatestTag();
    this.config.setContext({ latestTag });
  }

  async changelog() {
    const { changelog } = this.options;

    if (!changelog) return null;
    return this.shell.exec(changelog);
  }

  async getLatestTag() {
    return await this.shell.exec('git describe --tags --abbrev=0');
  }

  isGitRepo() {
    return this.shell.exec('git rev-parse --git-dir').then(
      () => true,
      () => false,
    );
  }

  async isRequiredBranch() {
    const branch = await this.getBranchName();
    const requiredBranches = castArray(this.options.requireBranch);
    return requiredBranches.length > 0 ? requiredBranches.includes(branch) : true;
  }

  isRemoteName(remoteUrlOrName: string) {
    return !includes(remoteUrlOrName, '/');
  }

  async getRemoteUrl() {
    const remoteNameOrUrl = (await this.getRemote()) || 'origin';

    return this.isRemoteName(remoteNameOrUrl)
      ? this.exec(`git remote get-url ${remoteNameOrUrl}`).catch(() =>
          this.exec(`git config --get remote.${remoteNameOrUrl}.url`).catch(() => null),
        )
      : remoteNameOrUrl;
  }

  async getRemote() {
    const branchName = await this.getBranchName();
    return branchName ? await this.getRemoteForBranch(branchName) : null;
  }

  async getBranchName() {
    try {
      return this.exec('git rev-parse --abbrev-ref HEAD');
    } catch (e) {
      return null;
    }
  }

  async getRemoteForBranch(branch: string | null) {
    try {
      return this.exec(`git config --get branch.${branch}.remote`);
    } catch (e) {
      return null;
    }
  }

  isWorkingDirClean() {
    return this.shell.exec('git diff --quiet HEAD').then(
      () => true,
      () => false,
    );
  }

  async fetch() {
    try {
      return this.shell.exec('git fetch');
    } catch (err) {
      this.debug(err);
      throw new GitNetworkError(err, this.remoteUrl);
    }
  }

  async status() {
    try {
      return this.shell.exec('git status --short --untracked-files=no');
    } catch (e) {
      return null;
    }
  }

  stageDir({ baseDir = '.' } = {}) {
    const { addUntrackedFiles } = this.options;
    return this.shell.exec(['git', 'add', baseDir, addUntrackedFiles ? '--all' : '--update']);
  }

  async beforePublish() {
    if (this.options.commit) {
      const changeSet = await this.status();
      this.container.log.preview({ title: 'changeset', text: changeSet });
      await this.stageDir();
    }
  }

  async publish() {
    const { commit, tag, push } = this.options;
    await this.showPrompt({
      enabled: commit,
      promptName: 'commit',
      task: this.commit.bind(this),
    });
    await this.showPrompt({
      enabled: tag,
      promptName: 'tag',
      task: this.tag.bind(this),
    });
    await this.showPrompt({
      enabled: push,
      promptName: 'push',
      task: this.push.bind(this),
    });
  }

  private commit(isCommit: boolean) {
    if (!isCommit) {
      return;
    }
    const { commitMessage, commitArgs } = this.options;
    const msg = format(commitMessage, this.config.getContext());
    return this.shell.exec(['git', 'commit', '--message', msg, ...fixArgs(commitArgs as string[])]).then(
      () => this.setContext({ isCommitted: true }),
      err => {
        this.debug(err);
        if (/nothing (added )?to commit/.test(err)) {
          this.container.log.warn('No changes to commit. The latest commit will be tagged.');
        } else {
          throw new Error(err);
        }
      },
    );
  }

  private async tag() {
    const { tagMessage, tagArgs, tagName } = this.options;
    const message = format(tagMessage, this.config.getContext());
    const _tagName = format(tagName, this.config.getContext());
    await this.shell.exec(['git', 'tag', '-a', _tagName, '-m', message, ...fixArgs(tagArgs as string[])]);
    return this.setContext({ isTagged: true });
  }

  private async push() {
    const { pushArgs } = this.options;
    const push = await this.shell.exec(['git', 'push', ...fixArgs(pushArgs as string[])]);
    return push;
  }
}

export default Git;

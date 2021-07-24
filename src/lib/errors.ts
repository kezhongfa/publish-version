class BaseError extends Error {
  constructor(...args: any) {
    super(...args);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class GitRepoError extends BaseError {
  constructor() {
    super('The current directory is not (inside) a Git repository. Use `--no-git` to skip Git steps.');
  }
}

export class GitRemoteUrlError extends BaseError {
  constructor() {
    super(`Could not get remote Git url.
           Please add a remote repository.`);
  }
}

export class GitCleanWorkingDirError extends BaseError {
  constructor() {
    super(
      `Working dir must be clean.
      Please stage and commit your changes.
      Alternatively, use \`--no-git.requireCleanWorkingDir\` to include the changes in the release commit` +
        ` (or save \`"git.requireCleanWorkingDir": false\` in the configuration).`,
    );
  }
}

export class GitNetworkError extends BaseError {
  constructor(err: { message: any }, remoteUrl: any) {
    super(`Unable to fetch from ${remoteUrl}
          ${err.message}`);
  }
}

export class NpmTimeoutError extends BaseError {
  constructor(timeout: number) {
    super(`Unable to reach npm registry (timed out after ${timeout}ms).`);
  }
}

export class NpmAuthError extends BaseError {
  constructor() {
    super('Not authenticated with npm. Please `npm login` and try again.');
  }
}

export class RequireBranchError extends BaseError {
  constructor(requireBranch: string | string[]) {
    super(`Must be on branch ${requireBranch}`);
  }
}

export class CollaboratorError extends BaseError {
  constructor(username: string, name: string) {
    super(`User ${username} is not a collaborator for ${name}.`);
  }
}

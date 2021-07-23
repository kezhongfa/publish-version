/* eslint-disable no-await-in-loop */
import { castArray } from 'lodash';
import { ENamespace, IIncrementBase, IOptions, PartialDeep, TContainer } from '../type';
import Prompt from './prompt';
import Config from './config';
import Log from './log';
import Spinner from './spinner';
import Shell from './shell';
import Git from './plugin/git';
import Npm from './plugin/npm';
import Version from './plugin/version';
import { parseVersion } from '@/helpers';

export const runTasks = async (o: PartialDeep<IOptions>) => {
  const container = {} as TContainer;

  container.config = new Config(o);
  const { config } = container;
  container.log = new Log();
  container.prompt = new Prompt(container);
  container.spinner = new Spinner(container);
  container.shell = new Shell(container);

  try {
    const runScripts = async function (scripts: string | string[] | null) {
      for (const script of castArray(scripts)) {
        if (script) {
          await container.spinner.show({
            enabled: !!script,
            task: () => container.shell.exec(script),
            label: script,
          });
        }
      }
    };

    const options = config.getContext();
    const { hooks } = options;
    const { beforeStart, afterStart, beforeVersion, afterVersion, beforePublish, afterPublish } = hooks!;

    // beforeStart;
    await runScripts(beforeStart!);

    const gitPlugin = new Git({ container, namespace: ENamespace.git });
    const npmPlugin = new Npm({ container, namespace: ENamespace.npm });
    const versionPlugin = new Version({ container, namespace: ENamespace.version });
    await Promise.all([gitPlugin.validate(), npmPlugin.validate()]);
    // afterStart;
    await runScripts(afterStart!);
    // changelog
    await gitPlugin.changelog();
    const { increment, isPreRelease, preReleaseId } = options.version;
    const { latestVersion, name } = options.npm;
    const incrementBase: IIncrementBase = {
      latestVersion,
      increment,
      isPreRelease,
      preReleaseId,
    };
    let version: string | undefined;

    if (config.isUpdate) {
      version = latestVersion;
    } else {
      version = await versionPlugin.getIncrementedVersion(incrementBase);
    }
    config.setContext({ latestVersion, name, ...parseVersion(version) });
    // console.log('version:', version, parseVersion(version), config.getContext());
    // beforeVersion;
    await runScripts(beforeVersion!);
    await npmPlugin.bump(version as string);
    // afterVersion;
    await runScripts(afterVersion!);
    // beforePublish;
    await runScripts(beforePublish!);
    await gitPlugin.beforePublish();
    // publish;
    await npmPlugin.publish();
    await gitPlugin.publish();
    // afterPublish;
    await runScripts(afterPublish!);

    container.log.log(`Done (in ${Math.floor(process.uptime())}s.)`);
  } catch (err) {
    container.log.error(err.message || err);
    throw err;
  }
};

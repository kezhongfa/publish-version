import { version, help } from './template';
import { runTasks } from './tasks';

export default async (options: Record<string, any>) => {
  if (options.version) {
    version();
  } else if (options.help) {
    help();
  } else {
    return runTasks(options);
  }
  return Promise.resolve();
};

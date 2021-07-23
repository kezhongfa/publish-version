import execa from 'execa';
import Log from './log';
import { debugByNameSpace, format } from '@/helpers';
import { TContainer } from '../type';
import Config from './config';

const sh = require('shelljs');

const debug = debugByNameSpace('shell');

sh.config.silent = !debug.enabled;

class Shell {
  config: Config;

  log: Log;

  constructor(container: TContainer) {
    this.config = container.config;
    this.log = container.log;
  }

  exec(command: string | string[], context?: Record<string, any>) {
    return typeof command === 'string'
      ? this.execFormatted(format(command, context || this.config.getContext()))
      : this.execFormatted(command);
  }

  execFormatted(command: string | string[]) {
    return typeof command === 'string' ? this.execString(command) : this.execArguments(command);
  }

  execString(command: string): Promise<any> {
    return new Promise((resolve, reject) => {
      sh.exec(command, { async: true }, (code: number, stdout: any, stderr: any) => {
        const _stdout = stdout.toString().trim();
        debug({ command, code, stdout, stderr });
        if (code === 0) {
          resolve(_stdout);
        } else {
          reject(new Error(stderr || _stdout));
        }
      });
    });
  }

  async execArguments(command: string[]) {
    const [program, ...programArgs] = command;
    try {
      const { stdout, stderr } = await execa(program, programArgs);
      debug({ command, stdout, stderr });
      return Promise.resolve(stdout || stderr);
    } catch (error) {
      if (error.stdout) {
        this.log.log(`\n${error.stdout}`);
      }
      debug({ error });
      return Promise.reject(new Error(error.stderr || error.message));
    }
  }
}
export default Shell;

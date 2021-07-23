import chalk from 'chalk';
import { upperFirst, lowerCase } from 'lodash';
import { EOL } from 'os';

export default class Log {
  log(...args: string[]) {
    console.log(...args);
  }

  error(...args: any[]) {
    console.error(chalk.red('ERROR'), ...args);
  }

  info(...args: any[]) {
    this.log(chalk.grey(...args));
  }

  warn(...args: any[]) {
    this.log(chalk.yellow('WARNING'), ...args);
  }

  preview({ title, text }: { title: string; text?: string }) {
    if (text) {
      const header = chalk.bold(upperFirst(title));
      const body = text.replace(new RegExp(EOL + EOL, 'g'), EOL);
      this.log(`${header}:${EOL}${body}`);
    } else {
      this.log(`Empty ${lowerCase(title)}`);
    }
  }
}

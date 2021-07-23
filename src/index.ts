import minimist from 'minimist';
import './lib/update-notifier';
import main from './lib';

const aliases = {
  c: 'config',
  h: 'help',
  v: 'version',
  i: 'increment',
};

const parseArgs = (args?: string[]) => {
  const options = minimist(args, {
    boolean: ['only-changelog'],
    alias: aliases,
  });
  options.increment = options._[0] || options.i;
  return options;
};

export const options = parseArgs(process.argv.slice(2));

main(options).then(
  () => process.exit(0),
  () => process.exit(1),
);

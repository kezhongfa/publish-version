import { version as v, name } from '../../package.json';

const helpText = `${name}@v${v}

  Usage: ${name} <increment> [options]

  Use e.g. "${name} minor" directly as shorthand for "${name} --increment=minor".

  -c --config            Path to local configuration options [default: ".${name}.json"]
  -h --help              Print this help
  -i --increment         Increment "major", "minor", "patch", or "pre*" version; or specify version [default: "patch"]
  -v --version           Print ${name} version number`;

export const version = () => console.log(`${name}@${v}`);

export const help = () => console.log(helpText);

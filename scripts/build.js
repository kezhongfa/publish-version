const shell = require('shelljs');
const colors = require('colors');
const fs = require('fs');
const path = require('path');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

const execBuildTask = () => execAsync('npm run clean && rollup -c', 'execBuildTask');
const execPackageJsonTask = () => {
  const packageJson = require('../package.json');
  const pkg = JSON.parse(JSON.stringify(packageJson));
  Reflect.deleteProperty(pkg, 'devDependencies');
  Reflect.deleteProperty(pkg, 'husky');
  Reflect.deleteProperty(pkg, 'scripts');
  Reflect.deleteProperty(pkg, 'publish-version');
  Reflect.deleteProperty(pkg, 'publishConfig');
  const distPath = resolveApp('dist');
  fs.writeFileSync(`${distPath}/package.json`, JSON.stringify(pkg, null, 2), {
    encoding: 'utf-8',
  });
};
const execShellTask = () => {
  shell.cp('README.md', 'dist');
  shell.cp('CHANGELOG.md', 'dist');
  shell.cp('License', 'dist/License');
  shell.cp('-R', 'src/bin', 'dist');
  shell.cp('-R', 'dist/src/*', 'dist');
  shell.rm('-rf', './dist/src');
};
execBuildTask()
  .then(execShellTask)
  .then(execPackageJsonTask)
  .catch(err => {
    console.log(colors.red(err));
    process.exit(1);
  });

function execAsync(command, execLog) {
  return new Promise((resolve, reject) => {
    const child = shell.exec(command, { async: true });
    child.on('close', function (code) {
      if (code === 0) {
        resolve();
      } else {
        const error = `${execLog} fail`.red;
        reject(error);
      }
    });
  });
}

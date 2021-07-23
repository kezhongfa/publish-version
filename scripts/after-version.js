const shell = require('shelljs');

shell.cp('CHANGELOG.md', 'dist');
shell.cp('package.json', 'dist');

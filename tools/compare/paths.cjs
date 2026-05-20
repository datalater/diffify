const path = require('node:path');

const packageRoot = path.resolve(__dirname, '../..');
const diffifyOutputRoot = path.join(packageRoot, '.diffify');

module.exports = {
  packageRoot,
  diffifyOutputRoot,
};

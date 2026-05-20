const fs = require('node:fs/promises');
const { diffifyOutputRoot } = require('./paths.cjs');

async function clearAllDiffifyCaptures() {
  await fs.rm(diffifyOutputRoot, { recursive: true, force: true });
  await fs.mkdir(diffifyOutputRoot, { recursive: true });
}

module.exports = {
  clearAllDiffifyCaptures,
};

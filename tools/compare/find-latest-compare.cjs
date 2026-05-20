const path = require('node:path');
const { readdir, readFile } = require('node:fs/promises');
const { diffifyOutputRoot } = require('./paths.cjs');

/**
 * @param {{ projectId: string; viewportKey: string }} params
 * @returns {Promise<Record<string, unknown> | null>}
 */
async function findLatestCompareSummary({ projectId, viewportKey }) {
  if (!projectId || !viewportKey) return null;

  const base = path.join(diffifyOutputRoot, projectId, viewportKey);

  try {
    const entries = await readdir(base, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    if (dirs.length === 0) return null;

    const parseRunTs = (name) => {
      const head = name.split('-')[0];
      const n = parseInt(head, 10);
      return Number.isFinite(n) ? n : 0;
    };

    dirs.sort((a, b) => parseRunTs(b) - parseRunTs(a));

    for (const runId of dirs) {
      const summaryPath = path.join(base, runId, 'summary.json');
      try {
        const raw = await readFile(summaryPath, 'utf8');
        const data = JSON.parse(raw);
        if (
          data &&
          typeof data === 'object' &&
          data.pixelDiff &&
          typeof data.pixelDiff.imageUrl === 'string'
        ) {
          return data;
        }
      } catch {
        continue;
      }
    }

    return null;
  } catch (error) {
    if (error && /** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

module.exports = {
  findLatestCompareSummary,
};

const path = require('node:path');
const { readdir, readFile, stat } = require('node:fs/promises');
const { diffifyOutputRoot } = require('./paths.cjs');

const ARTIFACT_FILES = ['source.png', 'result.png', 'diff.png', 'summary.json'];

/**
 * @returns {Promise<{
 *   root: string;
 *   totalBytes: number;
 *   runs: Array<{
 *     projectId: string;
 *     viewportKey: string;
 *     runId: string;
 *     bytes: number;
 *     capturedAt: string | null;
 *   }>;
 * }>}
 */
async function getDiffifyStorageInfo() {
  const runs = [];

  async function scanRun(projectId, viewportKey, runId) {
    const runPath = path.join(diffifyOutputRoot, projectId, viewportKey, runId);
    let bytes = 0;
    for (const f of ARTIFACT_FILES) {
      try {
        const st = await stat(path.join(runPath, f));
        bytes += st.size;
      } catch {
        /* missing file */
      }
    }
    let capturedAt = null;
    try {
      const raw = await readFile(path.join(runPath, 'summary.json'), 'utf8');
      const j = JSON.parse(raw);
      const ca = j?.sourceCapture?.capturedAt;
      capturedAt = typeof ca === 'string' ? ca : null;
    } catch {
      /* invalid or missing summary */
    }
    runs.push({ projectId, viewportKey, runId, bytes, capturedAt });
  }

  try {
    const projectEntries = await readdir(diffifyOutputRoot, {
      withFileTypes: true,
    });
    for (const pe of projectEntries) {
      if (!pe.isDirectory()) continue;
      const projectId = pe.name;
      const vpPath = path.join(diffifyOutputRoot, projectId);
      const vpEntries = await readdir(vpPath, { withFileTypes: true });
      for (const ve of vpEntries) {
        if (!ve.isDirectory()) continue;
        const viewportKey = ve.name;
        const runBase = path.join(vpPath, viewportKey);
        const runEntries = await readdir(runBase, { withFileTypes: true });
        for (const re of runEntries) {
          if (!re.isDirectory()) continue;
          await scanRun(projectId, viewportKey, re.name);
        }
      }
    }
  } catch (error) {
    if (
      error &&
      /** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT'
    ) {
      return { root: diffifyOutputRoot, totalBytes: 0, runs: [] };
    }
    throw error;
  }

  const parseRunTs = (name) => {
    const head = name.split('-')[0];
    const n = parseInt(head, 10);
    return Number.isFinite(n) ? n : 0;
  };

  runs.sort((a, b) => parseRunTs(b.runId) - parseRunTs(a.runId));

  const totalBytes = runs.reduce((acc, r) => acc + r.bytes, 0);

  return { root: diffifyOutputRoot, totalBytes, runs };
}

module.exports = {
  getDiffifyStorageInfo,
};

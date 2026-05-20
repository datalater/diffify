import { createReadStream, mkdirSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

const pluginDir = dirname(fileURLToPath(import.meta.url));
const toolsRoot = resolve(pluginDir, 'tools/compare');
const diffifyArtifactsDir = resolve(pluginDir, '.diffify');

mkdirSync(diffifyArtifactsDir, { recursive: true });

const requireTool = createRequire(import.meta.url);

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.json': 'application/json',
};

function loadTool<T extends object>(fileName: string): T {
  return requireTool(resolve(toolsRoot, fileName)) as T;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw) as unknown;
}

async function tryServeArtifact(
  pathname: string,
  res: ServerResponse,
): Promise<boolean> {
  const prefix = '/__diffify__/artifacts/';
  if (!pathname.startsWith(prefix)) return false;

  const rel = pathname.slice(prefix.length);
  if (!rel || rel.includes('..')) {
    res.statusCode = 403;
    res.end();
    return true;
  }

  const filePath = join(diffifyArtifactsDir, rel);
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      res.statusCode = 404;
      res.end();
      return true;
    }
    res.statusCode = 200;
    res.setHeader(
      'Content-Type',
      MIME[extname(filePath)] ?? 'application/octet-stream',
    );
    createReadStream(filePath).pipe(res);
    return true;
  } catch {
    res.statusCode = 404;
    res.end();
    return true;
  }
}

export function diffifyDevPlugin(): Plugin {
  return {
    name: 'diffify-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        const pathname = new URL(url, 'http://localhost').pathname;

        if (await tryServeArtifact(pathname, res)) {
          return;
        }

        try {
          if (pathname === '/__diffify__/health' && req.method === 'GET') {
            const { checkBrowserHealth } = loadTool<{
              checkBrowserHealth: () => Promise<{ ok: boolean; message: string }>;
            }>('shared-browser.cjs');
            const result = await checkBrowserHealth();
            sendJson(res, 200, result);
            return;
          }

          if (
            pathname === '/__diffify__/install-browsers' &&
            req.method === 'POST'
          ) {
            const { installPlaywrightChromium } = loadTool<{
              installPlaywrightChromium: () => Promise<{
                ok: boolean;
                message: string;
              }>;
            }>('shared-browser.cjs');
            const result = await installPlaywrightChromium();
            sendJson(res, result.ok ? 200 : 500, result);
            return;
          }

          if (pathname === '/__diffify__/storage' && req.method === 'GET') {
            const { getDiffifyStorageInfo } = loadTool<{
              getDiffifyStorageInfo: () => Promise<unknown>;
            }>('list-storage.cjs');
            const info = await getDiffifyStorageInfo();
            sendJson(res, 200, info);
            return;
          }

          if (
            pathname === '/__diffify__/clear-captures' &&
            req.method === 'POST'
          ) {
            const { clearAllDiffifyCaptures } = loadTool<{
              clearAllDiffifyCaptures: () => Promise<void>;
            }>('clear-captures.cjs');
            await clearAllDiffifyCaptures();
            sendJson(res, 200, { ok: true });
            return;
          }

          if (
            pathname === '/__diffify__/latest-compare' &&
            req.method === 'GET'
          ) {
            const requestUrl = new URL(url, 'http://localhost');
            const projectId = requestUrl.searchParams.get('projectId') ?? '';
            const viewportKey =
              requestUrl.searchParams.get('viewportKey') ?? '';
            const { findLatestCompareSummary } = loadTool<{
              findLatestCompareSummary: (input: {
                projectId: string;
                viewportKey: string;
              }) => Promise<Record<string, unknown> | null>;
            }>('find-latest-compare.cjs');
            const summary = await findLatestCompareSummary({
              projectId,
              viewportKey,
            });
            sendJson(
              res,
              200,
              summary ? { found: true, ...summary } : { found: false },
            );
            return;
          }

          if (pathname === '/__diffify__/compare' && req.method === 'POST') {
            const body = (await readJsonBody(req)) as {
              projectId?: string;
              viewportKey?: string;
              width?: number;
              height?: number;
              sourceDocument?: string;
              resultDocument?: string;
            };
            const { runScratchCompare } = loadTool<{
              runScratchCompare: (input: {
                projectId: string;
                viewportKey: string;
                width: number;
                height: number;
                sourceDocument: string;
                resultDocument: string;
              }) => Promise<unknown>;
            }>('run-scratch-compare.cjs');
            const result = await runScratchCompare({
              projectId: body.projectId ?? '',
              viewportKey: body.viewportKey ?? '',
              width: Number(body.width) || 800,
              height: Number(body.height) || 600,
              sourceDocument: body.sourceDocument ?? '',
              resultDocument: body.resultDocument ?? '',
            });
            sendJson(res, 200, result);
            return;
          }
        } catch (error) {
          sendJson(res, 500, {
            error:
              error instanceof Error ? error.message : 'Diffify request failed.',
          });
          return;
        }

        next();
      });
    },
  };
}

const path = require('node:path');
const { mkdir, readFile, writeFile } = require('node:fs/promises');
const { PNG } = require('pngjs');
const blazediff = require('@blazediff/core');
const { diffifyOutputRoot } = require('./paths.cjs');
const { getCaptureDeviceScaleFactor } = require('./capture-scale.cjs');
const { launchDiffifyBrowser } = require('./shared-browser.cjs');

const TARGET_SELECTOR = '[data-diffify-target]';
const WAIT_AFTER_CONTENT_MS = 2500;

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createFilledPng(width, height) {
  const png = new PNG({ width, height });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 255;
    png.data[i + 1] = 255;
    png.data[i + 2] = 255;
    png.data[i + 3] = 255;
  }
  return png;
}

function copyPng(source, target) {
  const rowSize = source.width * 4;
  for (let y = 0; y < source.height; y += 1) {
    const sourceStart = y * rowSize;
    const sourceEnd = sourceStart + rowSize;
    const targetStart = y * target.width * 4;
    source.data.copy(target.data, targetStart, sourceStart, sourceEnd);
  }
}

/**
 * @param {import('playwright').Page} page
 * @param {string} fullHtml
 * @param {{ width: number; height: number }} viewport
 * @param {string} imagePath
 */
async function captureDocument(page, fullHtml, viewport, imagePath) {
  await page.setViewportSize({
    width: viewport.width,
    height: viewport.height,
  });
  await page.setContent(fullHtml, { waitUntil: 'networkidle' });
  await page.waitForTimeout(WAIT_AFTER_CONTENT_MS);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  const locator = page.locator(TARGET_SELECTOR).first();
  await locator.waitFor({ state: 'visible', timeout: 15000 });
  await locator.screenshot({ path: imagePath });
}

async function writePixelDiff(paths) {
  const sourcePng = PNG.sync.read(await readFile(paths.sourceImageFile));
  const resultPng = PNG.sync.read(await readFile(paths.resultImageFile));
  const width = Math.max(sourcePng.width, resultPng.width);
  const height = Math.max(sourcePng.height, resultPng.height);

  const sourceCanvas = createFilledPng(width, height);
  const resultCanvas = createFilledPng(width, height);
  copyPng(sourcePng, sourceCanvas);
  copyPng(resultPng, resultCanvas);
  await writeFile(paths.sourceImageFile, PNG.sync.write(sourceCanvas));
  await writeFile(paths.resultImageFile, PNG.sync.write(resultCanvas));

  const output = new Uint8ClampedArray(width * height * 4);
  const diffPixels = blazediff.diff(
    new Uint8ClampedArray(
      sourceCanvas.data.buffer,
      sourceCanvas.data.byteOffset,
      sourceCanvas.data.byteLength,
    ),
    new Uint8ClampedArray(
      resultCanvas.data.buffer,
      resultCanvas.data.byteOffset,
      resultCanvas.data.byteLength,
    ),
    output,
    width,
    height,
  );

  const diffPng = new PNG({ width, height });
  diffPng.data = Buffer.from(output);
  await writeFile(paths.diffImageFile, PNG.sync.write(diffPng));

  return {
    width,
    height,
    diffPixels,
    diffPercent: ((diffPixels / (width * height)) * 100).toFixed(3),
  };
}

/**
 * @param {{
 *   projectId: string;
 *   viewportKey: string;
 *   width: number;
 *   height: number;
 *   sourceDocument: string;
 *   resultDocument: string;
 * }} input
 */
async function runScratchCompare(input) {
  const { projectId, viewportKey, width, height, sourceDocument, resultDocument } =
    input;

  if (!projectId || !viewportKey) {
    throw new Error('projectId and viewportKey are required.');
  }
  if (!sourceDocument?.trim() || !resultDocument?.trim()) {
    throw new Error('sourceDocument and resultDocument are required.');
  }

  const viewport = {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };

  const runId = `${Date.now()}-capture`;
  const outputDir = path.join(
    diffifyOutputRoot,
    projectId,
    viewportKey,
    runId,
  );
  await mkdir(outputDir, { recursive: true });

  const paths = {
    outputDir,
    sourceImageFile: path.join(outputDir, 'source.png'),
    resultImageFile: path.join(outputDir, 'result.png'),
    diffImageFile: path.join(outputDir, 'diff.png'),
    summaryFile: path.join(outputDir, 'summary.json'),
  };

  const deviceScaleFactor = getCaptureDeviceScaleFactor();
  const browser = await launchDiffifyBrowser();
  const context = await browser.newContext({ deviceScaleFactor });
  const page = await context.newPage();

  try {
    await captureDocument(page, sourceDocument, viewport, paths.sourceImageFile);
    await captureDocument(page, resultDocument, viewport, paths.resultImageFile);
    const pixelDiff = await writePixelDiff(paths);
    const capturedAt = new Date().toISOString();
    const publicBase = `/__diffify__/artifacts/${projectId}/${viewportKey}/${runId}`;

    const payload = {
      projectId,
      viewportKey,
      runId,
      outputDir,
      viewport,
      deviceScaleFactor,
      sourceCapture: {
        imageUrl: `${publicBase}/source.png`,
        width: pixelDiff.width,
        height: pixelDiff.height,
        capturedAt,
      },
      resultCapture: {
        imageUrl: `${publicBase}/result.png`,
        width: pixelDiff.width,
        height: pixelDiff.height,
        capturedAt,
      },
      pixelDiff: {
        imageUrl: `${publicBase}/diff.png`,
        width: pixelDiff.width,
        height: pixelDiff.height,
        diffPixels: pixelDiff.diffPixels,
        diffPercent: pixelDiff.diffPercent,
      },
      summaryUrl: `${publicBase}/summary.json`,
    };

    await writeFile(paths.summaryFile, `${JSON.stringify(payload, null, 2)}\n`);
    return payload;
  } finally {
    await context.close();
    await browser.close();
  }
}

module.exports = {
  runScratchCompare,
  TARGET_SELECTOR,
};

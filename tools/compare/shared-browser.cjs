const { constants } = require('node:fs');
const { access } = require('node:fs/promises');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const SYSTEM_BROWSER_CANDIDATES = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
].filter(Boolean);

let cachedBrowserOk = null;

function formatLaunchFailure(error) {
  if (!(error instanceof Error)) {
    return 'Unknown launch error';
  }
  return error.message.split('\n')[0] ?? error.message;
}

async function isExecutableFile(filePath) {
  try {
    await access(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function launchDiffifyBrowser() {
  const attempts = [];

  const tryLaunch = async (label, options) => {
    try {
      return await chromium.launch(options);
    } catch (error) {
      attempts.push(`${label}: ${formatLaunchFailure(error)}`);
      return null;
    }
  };

  const managedBrowser = await tryLaunch('playwright-managed chromium', {
    headless: true,
  });
  if (managedBrowser) return managedBrowser;

  for (const executablePath of SYSTEM_BROWSER_CANDIDATES) {
    if (!(await isExecutableFile(executablePath))) continue;
    const browser = await tryLaunch(`system browser (${executablePath})`, {
      executablePath,
      headless: true,
    });
    if (browser) return browser;
  }

  throw new Error(
    [
      'Diffify failed to launch a browser for capture.',
      ...attempts.map((attempt) => `- ${attempt}`),
      'Install Chromium with `npm exec playwright install chromium` in the diffify repo, or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.',
    ].join('\n'),
  );
}

/**
 * @returns {Promise<{ ok: boolean; message: string }>}
 */
async function checkBrowserHealth() {
  if (cachedBrowserOk === true) {
    return { ok: true, message: 'Browser ready (cached).' };
  }

  let browser = null;
  try {
    browser = await launchDiffifyBrowser();
    await browser.close();
    cachedBrowserOk = true;
    return { ok: true, message: 'Browser ready.' };
  } catch (error) {
    cachedBrowserOk = false;
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : 'Browser check failed.',
    };
  }
}

function invalidateBrowserHealthCache() {
  cachedBrowserOk = null;
}

/**
 * @returns {Promise<{ ok: boolean; message: string }>}
 */
function installPlaywrightChromium() {
  return new Promise((resolve) => {
    invalidateBrowserHealthCache();
    const child = spawn(
      'npx',
      ['playwright', 'install', 'chromium'],
      {
        cwd: require('./paths.cjs').packageRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      },
    );

    let stderr = '';
    child.stderr?.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({
          ok: true,
          message: 'Playwright Chromium installed.',
        });
        return;
      }
      resolve({
        ok: false,
        message:
          stderr.trim() ||
          `playwright install exited with code ${code ?? 'unknown'}`,
      });
    });

    child.on('error', (error) => {
      resolve({
        ok: false,
        message: error.message,
      });
    });
  });
}

module.exports = {
  launchDiffifyBrowser,
  checkBrowserHealth,
  installPlaywrightChromium,
  invalidateBrowserHealthCache,
};

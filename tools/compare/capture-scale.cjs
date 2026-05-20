/**
 * Playwright `deviceScaleFactor` for sharper captures (e.g. Retina).
 * Env: `DIFFIFY_CAPTURE_SCALE` — number 1–4, default 1.
 */
function getCaptureDeviceScaleFactor() {
  const raw = process.env.DIFFIFY_CAPTURE_SCALE;
  if (raw === undefined || raw === '') return 1;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || n > 4) return 1;
  return Math.round(n * 100) / 100;
}

module.exports = {
  getCaptureDeviceScaleFactor,
};

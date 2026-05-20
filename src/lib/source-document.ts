const TAILWIND_BROWSER_SRC = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4';
const FONT_SRC =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';

/** Figma Source scratch — `<head>` 안에 넣을 기본 내용 */
export const DEFAULT_FIGMA_SOURCE_HEAD = [
  '<meta charset="UTF-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
  `<script src="${TAILWIND_BROWSER_SRC}"></script>`,
  `<link href="${FONT_SRC}" rel="stylesheet">`,
].join('\n');

/**
 * fragment 최상단 단일 루트에 `data-diffify-target`을 붙인다.
 * 여러 루트·텍스트만 있으면 캡처용 래퍼 div로 감싼다.
 */
function tryMergeTargetOntoSingleRoot(html: string): string | null {
  if (typeof DOMParser === 'undefined') return null;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const { body } = doc;
  if (body.childElementCount !== 1) return null;

  const root = body.firstElementChild;
  if (!root) return null;

  root.setAttribute('data-diffify-target', '');
  return root.outerHTML;
}

function wrapBodyHtml(rawHtml: string): string {
  const trimmed = rawHtml.trim();
  if (!trimmed) return '<div data-diffify-target></div>';
  if (/\bdata-diffify-target\b/i.test(trimmed)) return trimmed;

  const merged = tryMergeTargetOntoSingleRoot(trimmed);
  if (merged) return merged;

  return `<div data-diffify-target>${trimmed}</div>`;
}

function buildFullDocument(headInner: string, bodyInner: string): string {
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    headInner,
    '</head>',
    '<body>',
    bodyInner,
    '</body>',
    '</html>',
  ].join('');
}

/** Scratch: `<head>` 내용 + body fragment */
export function createScratchDocument(headInner: string, bodyHtml: string) {
  const trimmed = bodyHtml.trim();
  if (/<html[\s>]/i.test(trimmed)) return trimmed;
  return buildFullDocument(headInner.trim(), wrapBodyHtml(trimmed));
}

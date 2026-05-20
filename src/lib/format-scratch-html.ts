const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/** iframe srcDoc 미리보기·복사용 HTML 들여쓰기 (Prettier 스타일) */
export function formatScratchHtmlDocument(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const lines = trimmed
    .replace(/>\s*</g, '>\n<')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let pad = 0;
  const result: string[] = [];

  for (const line of lines) {
    const isClosing = /^<\//.test(line);
    const isDoctype = /^<!doctype/i.test(line);
    const isComment = /^<!--/.test(line);
    const isInstruction = /^<\?/.test(line);

    if (isClosing) {
      pad = Math.max(0, pad - 1);
    }

    result.push(`${'  '.repeat(pad)}${line}`);

    if (isClosing || isDoctype || isComment || isInstruction) {
      continue;
    }

    const openMatch = line.match(/^<([a-zA-Z][\w-]*)/);
    if (!openMatch) continue;

    const tag = openMatch[1].toLowerCase();
    const selfClosing = /\/>$/.test(line);
    const inlineClosed = new RegExp(`</${tag}>`, 'i').test(line);

    if (!selfClosing && !inlineClosed && !VOID_TAGS.has(tag)) {
      pad += 1;
    }
  }

  return `${result.join('\n')}\n`;
}

function unwrapSingleRootElement(formatted: string): string {
  const lines = formatted.trimEnd().split('\n');
  if (lines.length <= 1) {
    return lines[0]?.trim() ?? '';
  }

  const inner = lines.slice(1, -1);
  const dedented = inner.map((line) =>
    line.startsWith('  ') ? line.slice(2) : line,
  );
  const body = dedented.join('\n').trimEnd();
  return body ? `${body}\n` : '';
}

export function formatScratchHeadFragment(head: string): string {
  const trimmed = head.trim();
  if (!trimmed) return '';
  return formatScratchHtmlDocument(trimmed).trimEnd();
}

export function formatScratchBodyHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return '';
  const formatted = formatScratchHtmlDocument(
    `<div data-diffify-format-root>${trimmed}</div>`,
  );
  return unwrapSingleRootElement(formatted);
}

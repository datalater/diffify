import { createScratchDocument } from './source-document';

export type ScratchHtmlLayer = 'source' | 'result';

export function formatScratchExportFilename(layer: ScratchHtmlLayer): string {
  return `diffify-${layer}-${formatExportTimestamp(new Date())}.html`;
}

function formatExportTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('-');
}

export function buildScratchExportHtml(head: string, bodyHtml: string): string {
  return createScratchDocument(head, bodyHtml);
}

/** HTML 파일에서 `<head>` innerHTML · `<body>` innerHTML 분리 */
export function parseHtmlFileContent(raw: string): {
  head: string;
  bodyHtml: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { head: '', bodyHtml: '' };
  }

  if (!/<html[\s>]/i.test(trimmed)) {
    return { head: '', bodyHtml: trimmed };
  }

  const doc = new DOMParser().parseFromString(trimmed, 'text/html');
  return {
    head: doc.head?.innerHTML.trim() ?? '',
    bodyHtml: doc.body?.innerHTML.trim() ?? '',
  };
}

export type ExportScratchHtmlResult =
  | { ok: true; fileName: string }
  | { ok: false; reason: 'aborted' | 'failed' };

export function exportScratchHtmlFailureReason(
  result: ExportScratchHtmlResult,
): 'aborted' | 'failed' | undefined {
  if (result.ok) return undefined;
  return result.reason;
}

export async function exportScratchHtmlFile(
  layer: ScratchHtmlLayer,
  head: string,
  bodyHtml: string,
): Promise<ExportScratchHtmlResult> {
  const content = buildScratchExportHtml(head, bodyHtml);
  const suggestedName = formatScratchExportFilename(layer);

  try {
    if ('showSaveFilePicker' in window) {
      const handle = await (
        window as Window & {
          showSaveFilePicker: (options: {
            suggestedName?: string;
            types?: Array<{
              description: string;
              accept: Record<string, string[]>;
            }>;
          }) => Promise<FileSystemFileHandle>;
        }
      ).showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'HTML',
            accept: { 'text/html': ['.html'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return { ok: true, fileName: handle.name };
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { ok: false, reason: 'aborted' };
    }
  }

  try {
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = suggestedName;
    anchor.click();
    URL.revokeObjectURL(url);
    return { ok: true, fileName: suggestedName };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

export function pickScratchHtmlFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,text/html';
    input.addEventListener('change', () => {
      resolve(input.files?.[0] ?? null);
    });
    input.click();
  });
}

export async function readScratchHtmlFile(
  file: File,
): Promise<{ head: string; bodyHtml: string } | null> {
  if (
    file.type &&
    file.type !== 'text/html' &&
    !/\.html?$/i.test(file.name)
  ) {
    return null;
  }
  try {
    return parseHtmlFileContent(await file.text());
  } catch {
    return null;
  }
}

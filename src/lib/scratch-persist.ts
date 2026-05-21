import { DEFAULT_FIGMA_SOURCE_HEAD } from './source-document';

export type ScratchPersistedContent = {
  sourceHead: string;
  sourceHtml: string;
  resultHead: string;
  resultHtml: string;
  showingSource: boolean;
};

export type ScratchEditors = Omit<ScratchPersistedContent, 'showingSource'>;

export function scratchPersistedContentFromEditors(
  editors: ScratchEditors,
  showingSource: boolean,
): ScratchPersistedContent {
  return { ...editors, showingSource };
}

export type ScratchPersistPayload = {
  v: 1 | 2;
  sh: string;
  sx: string;
  rh: string;
  rx: string;
  w?: number;
  h?: number;
  ls: 0 | 1;
  stk?: 0 | 1;
};

export type ScratchPersistSnapshot = ScratchPersistedContent & {
  previewWidth: number;
  previewHeight: number;
};

const SEARCH_PARAM = 'state';
const PERSIST_VERSION = 2 as const;
export const MAX_URL_STATE_CHARS = 12_000;

export function defaultScratchPreviewDimensions(): {
  previewWidth: number;
  previewHeight: number;
} {
  return { previewWidth: 768, previewHeight: 900 };
}

export function scratchSnapshotFromContent(
  content: ScratchPersistedContent,
): ScratchPersistSnapshot {
  return { ...content, ...defaultScratchPreviewDimensions() };
}

function toPayload(content: ScratchPersistedContent): ScratchPersistPayload {
  return {
    v: PERSIST_VERSION,
    sh: content.sourceHead,
    sx: content.sourceHtml,
    rh: content.resultHead,
    rx: content.resultHtml,
    ls: content.showingSource ? 1 : 0,
  };
}

function isPersistPayload(raw: unknown): raw is ScratchPersistPayload {
  if (typeof raw !== 'object' || raw === null) return false;
  const p = raw as ScratchPersistPayload;
  return (
    (p.v === 1 || p.v === 2) &&
    typeof p.sh === 'string' &&
    typeof p.sx === 'string' &&
    typeof p.rh === 'string' &&
    typeof p.rx === 'string' &&
    (p.ls === 0 || p.ls === 1)
  );
}

export function contentFromPayload(
  payload: ScratchPersistPayload,
): ScratchPersistedContent {
  return {
    sourceHead: payload.sh,
    sourceHtml: payload.sx,
    resultHead: payload.rh,
    resultHtml: payload.rx,
    showingSource: payload.ls === 1,
  };
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(encoded: string): Uint8Array {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + '='.repeat(pad));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function utf8ToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

async function gzipCompress(text: string): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') return null;
  try {
    const stream = new Blob([text])
      .stream()
      .pipeThrough(new CompressionStream('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    return null;
  }
}

async function gzipDecompress(bytes: Uint8Array): Promise<string | null> {
  if (typeof DecompressionStream === 'undefined') return null;
  try {
    const stream = new Blob([new Uint8Array(bytes)])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'));
    return bytesToUtf8(
      new Uint8Array(await new Response(stream).arrayBuffer()),
    );
  } catch {
    return null;
  }
}

export async function isScratchStateTooLongForUrl(
  content: ScratchPersistedContent,
): Promise<boolean> {
  return (await encodeScratchState(content)).length > MAX_URL_STATE_CHARS;
}

export async function encodeScratchState(
  content: ScratchPersistedContent,
): Promise<string> {
  const json = JSON.stringify(toPayload(content));
  const gz = await gzipCompress(json);
  if (gz) return `z.${base64UrlEncode(gz)}`;
  return `u.${base64UrlEncode(utf8ToBytes(json))}`;
}

export async function decodeScratchState(
  encoded: string,
): Promise<ScratchPersistSnapshot | null> {
  const trimmed = encoded.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.startsWith('z.')) {
      const json = await gzipDecompress(base64UrlDecode(trimmed.slice(2)));
      if (!json) return null;
      const payload = JSON.parse(json) as unknown;
      if (!isPersistPayload(payload)) return null;
      return scratchSnapshotFromContent(contentFromPayload(payload));
    }
    if (trimmed.startsWith('u.')) {
      const json = bytesToUtf8(base64UrlDecode(trimmed.slice(2)));
      const payload = JSON.parse(json) as unknown;
      if (!isPersistPayload(payload)) return null;
      return scratchSnapshotFromContent(contentFromPayload(payload));
    }
    return null;
  } catch {
    return null;
  }
}

export const defaultScratchSnapshot = (): ScratchPersistSnapshot =>
  scratchSnapshotFromContent({
    sourceHead: DEFAULT_FIGMA_SOURCE_HEAD,
    sourceHtml: '',
    resultHead: '',
    resultHtml: '',
    showingSource: true,
  });

export async function copyScratchShareUrl(
  content: ScratchPersistedContent,
): Promise<{ ok: boolean; reason?: 'too_long' | 'clipboard' }> {
  const encoded = await encodeScratchState(content);
  if (encoded.length > MAX_URL_STATE_CHARS) {
    return { ok: false, reason: 'too_long' };
  }
  const url = new URL(window.location.href);
  url.searchParams.set(SEARCH_PARAM, encoded);
  try {
    await navigator.clipboard.writeText(url.toString());
    return { ok: true };
  } catch {
    return { ok: false, reason: 'clipboard' };
  }
}

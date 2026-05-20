import type { ScratchEditors } from './scratch-persist';

/** 버전·draft·dirty — head/HTML만 (미리보기 레이어 제외) */
export function canonicalScratchDocumentJson(
  document: ScratchEditors,
): string {
  return JSON.stringify({
    rh: document.resultHead,
    rx: document.resultHtml,
    sh: document.sourceHead,
    sx: document.sourceHtml,
  });
}

export async function hashScratchDocument(
  document: ScratchEditors,
): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalScratchDocumentJson(document));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function scratchDocumentEquals(
  a: ScratchEditors,
  b: ScratchEditors,
): Promise<boolean> {
  return (await hashScratchDocument(a)) === (await hashScratchDocument(b));
}

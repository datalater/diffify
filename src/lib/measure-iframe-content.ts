export const LIVE_TARGET_SELECTOR =
  '[data-diffify-target],[data-component],body > *:first-child';

export type IframeContentSize = {
  width: number;
  height: number;
};

async function measureTargetRect(
  frame: HTMLIFrameElement,
): Promise<DOMRect | null> {
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) return null;

  if (doc.fonts?.ready) {
    try {
      await doc.fonts.ready;
    } catch {
      /* ignore */
    }
  }

  await new Promise<void>((resolve) => {
    win.requestAnimationFrame(() => {
      win.requestAnimationFrame(() => resolve());
    });
  });

  const target =
    doc.querySelector<HTMLElement>(LIVE_TARGET_SELECTOR) ?? doc.body;
  return target.getBoundingClientRect();
}

/** `data-diffify-target` 등 콘텐츠 박스 실측 (w-fit / h-fit) */
export async function measureIframeContentSize(
  frame: HTMLIFrameElement,
): Promise<IframeContentSize> {
  const rect = await measureTargetRect(frame);
  if (!rect) return { width: 1, height: 80 };
  return {
    width: Math.max(1, Math.ceil(rect.width)),
    height: Math.max(80, Math.ceil(rect.height)),
  };
}

export async function measureIframeContentHeight(
  frame: HTMLIFrameElement,
): Promise<number> {
  const { height } = await measureIframeContentSize(frame);
  return height;
}

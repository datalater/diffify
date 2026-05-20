export const LIVE_TARGET_SELECTOR =
  '[data-diffify-target],[data-component],body > *:first-child';

const MIN_CONTENT_HEIGHT = 80;

export type IframeContentSize = {
  width: number;
  height: number;
};

/** live preview — Dimensions 툴바·w-fit/h-fit */
export type PreviewLiveMeasured = {
  iframeWidth: number;
  iframeHeight: number;
  contentWidth: number;
  contentHeight: number;
};

function liveMeasureTarget(doc: Document): HTMLElement {
  return doc.querySelector<HTMLElement>(LIVE_TARGET_SELECTOR) ?? doc.body;
}

/** layout box — scrollHeight는 iframe 초기 높이를 끌어올려 회귀한다 */
function layoutRectSize(el: HTMLElement): { width: number; height: number } {
  const rect = el.getBoundingClientRect();
  return {
    width: Math.ceil(Math.max(rect.width, 0)),
    height: Math.ceil(Math.max(rect.height, 0)),
  };
}

/** 자동 주입 래퍼(`<div data-diffify-target>단일자식</div>`)인지 */
function isAutoInjectedTargetWrapper(el: HTMLElement): boolean {
  if (el.tagName !== 'DIV' || !el.hasAttribute('data-diffify-target')) {
    return false;
  }
  if (el.childElementCount !== 1) return false;
  const attrs = Array.from(el.attributes);
  return attrs.every((a) => a.name === 'data-diffify-target');
}

/**
 * w-fit/h-fit·콘텐츠 크기 — `data-diffify-target`이 붙은 실제 UI 루트.
 * 자동 래퍼만 있으면 그 첫 element 자식, 아니면 target 요소 자신.
 */
export function resolvePastedContentRoot(doc: Document): HTMLElement | null {
  const wrapper = doc.querySelector('[data-diffify-target]');
  if (!wrapper || !(wrapper instanceof HTMLElement)) {
    const fallback =
      doc.querySelector('[data-component]') ?? doc.body.firstElementChild;
    return fallback instanceof HTMLElement ? fallback : null;
  }

  if (
    isAutoInjectedTargetWrapper(wrapper) &&
    wrapper.firstElementChild instanceof HTMLElement
  ) {
    return wrapper.firstElementChild;
  }

  return wrapper;
}

async function prepareIframeDocument(
  frame: HTMLIFrameElement,
): Promise<Document | null> {
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

  return doc;
}

/** 콘텐츠 루트 rect — w-fit / h-fit (래퍼가 아님) */
export async function measureIframeContentSize(
  frame: HTMLIFrameElement,
): Promise<IframeContentSize> {
  const doc = await prepareIframeDocument(frame);
  if (!doc) {
    return { width: 1, height: MIN_CONTENT_HEIGHT };
  }

  const contentRoot = resolvePastedContentRoot(doc) ?? liveMeasureTarget(doc);
  const { width, height } = layoutRectSize(contentRoot);

  return {
    width: Math.max(1, width),
    height: Math.max(MIN_CONTENT_HEIGHT, height),
  };
}

export async function measureIframeContentHeight(
  frame: HTMLIFrameElement,
): Promise<number> {
  const { height } = await measureIframeContentSize(frame);
  return height;
}

/** Popover·서브메뉴가 viewport 밖으로 나가지 않도록 보정 */

export const POPOVER_VIEWPORT_PAD_PX = 8;

export type PopoverAlign = 'start' | 'end';
export type PopoverSide = 'bottom' | 'top';
export type SubmenuExpand = 'end' | 'start';

export function popoverPanelPlacementClass(
  align: PopoverAlign,
  side: PopoverSide,
): string {
  const horizontal =
    align === 'end' ? 'right-0 left-auto' : 'left-0 right-auto';
  const vertical =
    side === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1';
  return `${horizontal} ${vertical}`;
}

export function submenuPanelPlacementClass(expand: SubmenuExpand): string {
  return expand === 'end'
    ? 'top-0 left-full ml-0.5'
    : 'top-0 right-full mr-0.5';
}

function flipSubmenuExpand(expand: SubmenuExpand): SubmenuExpand {
  return expand === 'end' ? 'start' : 'end';
}

/** translate로 미세 조정 (align/side 적용 후 1회) */
export function nudgeElementIntoViewport(
  element: HTMLElement,
  pad = POPOVER_VIEWPORT_PAD_PX,
): void {
  element.style.transform = '';
  const rect = element.getBoundingClientRect();
  let dx = 0;
  let dy = 0;
  if (rect.right > window.innerWidth - pad) {
    dx = window.innerWidth - pad - rect.right;
  }
  if (rect.left < pad) {
    dx = pad - rect.left;
  }
  if (rect.bottom > window.innerHeight - pad) {
    dy = window.innerHeight - pad - rect.bottom;
  }
  if (rect.top < pad) {
    dy = pad - rect.top;
  }
  if (dx !== 0 || dy !== 0) {
    element.style.transform = `translate(${Math.round(dx)}px, ${Math.round(dy)}px)`;
  }
}

function applyPopoverPlacement(
  element: HTMLElement,
  align: PopoverAlign,
  side: PopoverSide,
  placementClassName: string,
): PopoverAlign {
  element.className = placementClassName;
  element.dataset.popoverAlign = align;
  element.dataset.popoverSide = side;
  return align;
}

function rectOverflowsViewport(rect: DOMRect, pad: number): boolean {
  return (
    rect.left < pad ||
    rect.right > window.innerWidth - pad ||
    rect.top < pad ||
    rect.bottom > window.innerHeight - pad
  );
}

/**
 * preferred align/side 적용 후 flip·nudge.
 * @param placementClassName — NAV_PANEL_BASE + panelClassName 등 전체 베이스
 */
export function settlePopoverInViewport(
  element: HTMLElement,
  preferredAlign: PopoverAlign,
  placementClassName: string,
  pad = POPOVER_VIEWPORT_PAD_PX,
): void {
  let align = preferredAlign;
  let side: PopoverSide = 'bottom';

  const fullClass = (a: PopoverAlign, s: PopoverSide) =>
    `${placementClassName} ${popoverPanelPlacementClass(a, s)}`;

  applyPopoverPlacement(element, align, side, fullClass(align, side));

  let rect = element.getBoundingClientRect();
  if (rect.right > window.innerWidth - pad) {
    align = 'end';
  }
  if (rect.left < pad) {
    align = 'start';
  }
  applyPopoverPlacement(element, align, side, fullClass(align, side));

  rect = element.getBoundingClientRect();
  if (rect.bottom > window.innerHeight - pad && rect.height < window.innerHeight - pad * 2) {
    side = 'top';
    applyPopoverPlacement(element, align, side, fullClass(align, side));
  }
  if (rect.top < pad && side === 'top') {
    side = 'bottom';
    applyPopoverPlacement(element, align, side, fullClass(align, side));
  }

  nudgeElementIntoViewport(element, pad);
}

export function settleSubmenuInViewport(
  element: HTMLElement,
  baseClassName: string,
  preferredExpand: SubmenuExpand,
  pad = POPOVER_VIEWPORT_PAD_PX,
): void {
  let expand = preferredExpand;

  const fullClass = (e: SubmenuExpand) =>
    `${baseClassName} ${submenuPanelPlacementClass(e)}`;

  element.className = fullClass(expand);
  let rect = element.getBoundingClientRect();

  if (rect.right > window.innerWidth - pad) {
    expand = 'start';
  }
  if (rect.left < pad) {
    expand = 'end';
  }
  element.className = fullClass(expand);

  rect = element.getBoundingClientRect();
  if (rectOverflowsViewport(rect, pad)) {
    expand = flipSubmenuExpand(expand);
    element.className = fullClass(expand);
  }

  nudgeElementIntoViewport(element, pad);
}

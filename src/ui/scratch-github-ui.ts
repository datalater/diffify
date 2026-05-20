/** GitHub Primer dark — scratch top bar / controls */
export const GITHUB_BORDER = '#30363d';
export const GITHUB_BTN_BG = '#21262d';
export const GITHUB_CANVAS = '#161b22';

export const GITHUB_TOOLBAR_GROUP_CLASS =
  'inline-flex h-8 items-stretch overflow-hidden rounded-md border border-[#30363d] bg-[#21262d] font-sans text-xs shadow-sm';

export const GITHUB_BTN_CLASS =
  'inline-flex items-center px-3 font-medium text-[#e6edf3] transition-colors hover:bg-[#30363d] focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#388bfd] disabled:cursor-not-allowed disabled:text-[#484f58] disabled:hover:bg-transparent';

export const GITHUB_DIRTY_BADGE_CLASS =
  'inline-flex items-center gap-1.5 border-r border-[#30363d] bg-[#bb800926] px-2.5 font-medium text-[#d29922]';

export const GITHUB_SELECT_WRAP_CLASS =
  'relative flex min-w-[6.5rem] max-w-[10rem] items-center border-l border-[#30363d]';

export const GITHUB_SELECT_CLASS =
  'h-full w-full min-w-0 cursor-pointer appearance-none bg-transparent py-0 pl-2.5 pr-7 text-xs font-medium text-[#e6edf3] disabled:cursor-not-allowed disabled:text-[#484f58] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#388bfd]';

export const NAV_MENU_TRIGGER_CLASS =
  'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-[#30363d] bg-[#21262d] px-3 text-xs font-medium text-[#e6edf3] shadow-sm transition-colors hover:bg-[#30363d] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#388bfd]';

/** 위치(align/side)는 ScratchNavPopover가 붙임 */
export const NAV_PANEL_BASE_CLASS =
  'absolute z-50 min-w-[12rem] rounded-md border border-[#30363d] bg-[#161b22] py-1 shadow-lg';

/** @deprecated use NAV_PANEL_BASE_CLASS + popoverPanelPlacementClass */
export const NAV_PANEL_CLASS = `${NAV_PANEL_BASE_CLASS} left-0 top-full mt-1`;

export const NAV_MENU_ITEM_CLASS =
  'w-full cursor-pointer rounded-sm px-3 py-1.5 text-left text-xs font-medium text-[#e6edf3] transition-colors hover:bg-[#30363d] disabled:cursor-not-allowed disabled:text-[#484f58]';

export const NAV_SUBMENU_ITEM_CLASS =
  'w-full cursor-pointer whitespace-nowrap rounded-sm px-3 py-1.5 text-left text-xs text-[#e6edf3] transition-colors hover:bg-[#30363d]';

export const NAV_SUBMENU_PANEL_BASE_CLASS =
  'absolute z-[60] min-w-[7rem] rounded-md border border-[#30363d] bg-[#161b22] py-1 pl-0.5 shadow-lg';

/** @deprecated use NAV_SUBMENU_PANEL_BASE_CLASS + submenuPanelPlacementClass */
export const NAV_SUBMENU_PANEL_CLASS = `${NAV_SUBMENU_PANEL_BASE_CLASS} top-0 left-full ml-0.5`;

/**
 * Scratch 에디터 초기 예시 콘텐츠.
 *
 * source/result 각각의 `<head>`/`<body>`를 미리 채워, 사용자가 도구 사용법을
 * 바로 확인할 수 있게 한다. 초기 상태 조립(defaultScratchSnapshot, scratch-persist.ts)이
 * 이 네 상수를 그대로 사용한다.
 */

/** Source `<head>` — Tailwind v4 + Inter 폰트 로드 예시 */
export const DEFAULT_SCRATCH_SOURCE_HEAD = `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- (예시) tailwind@4 적용 -->
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<!-- (예시) google font Inter 적용 -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`;

/** Source `<body>` — Figma export(CardRadio) 예시 */
export const DEFAULT_SCRATCH_SOURCE_BODY = `<!-- @viewport: Group 22 (1381x3831) -->
<div data-node-name="cardradio" data-figma-component='{"name":"CardRadio","nodeId":"1817:13386","props":{"Label":false,"Explanation":"Books and specific URLs are allowed.","Title":"Open Book Allowed","Status":"Active"}}' class="py-4 px-5 flex flex-col items-end gap-2 [flex:1_0_0] self-stretch rounded-[8px] border-2 border-solid border-[var(--function-color-color-primary,#0078FF)] bg-[rgba(0,_120,_255,_0.02)]">
  <div data-node-name="title-and-description" class="flex h-20 min-h-20 flex-col items-start gap-1 self-stretch">
    <div data-node-name="frame-1000004371" class="flex flex-col items-start gap-2 self-stretch">
      <div data-node-name="ic-settings" data-figma-component='{"name":"ic-Settings","nodeId":"I1817:13386;1800:20867","props":{"Type":"Open Book Allowed"}}' class="py-1 px-px flex w-6 h-6 flex-col items-start gap-2.5 aspect-square">
        <div data-node-name="menu-book" class="w-[22px] h-4 flex-shrink-[0] aspect-[11/8] [fill:var(--function-color-color-primary,_#0078FF)]">
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 5.9V4.2C13.55 3.96667 14.1125 3.79167 14.6875 3.675C15.2625 3.55833 15.8667 3.5 16.5 3.5C16.9333 3.5 17.3583 3.53333 17.775 3.6C18.1917 3.66667 18.6 3.75 19 3.85V5.45C18.6 5.3 18.1958 5.1875 17.7875 5.1125C17.3792 5.0375 16.95 5 16.5 5C15.8667 5 15.2583 5.07917 14.675 5.2375C14.0917 5.39583 13.5333 5.61667 13 5.9ZM13 11.4V9.7C13.55 9.46667 14.1125 9.29167 14.6875 9.175C15.2625 9.05833 15.8667 9 16.5 9C16.9333 9 17.3583 9.03333 17.775 9.1C18.1917 9.16667 18.6 9.25 19 9.35V10.95C18.6 10.8 18.1958 10.6875 17.7875 10.6125C17.3792 10.5375 16.95 10.5 16.5 10.5C15.8667 10.5 15.2583 10.575 14.675 10.725C14.0917 10.875 13.5333 11.1 13 11.4ZM13 8.65V6.95C13.55 6.71667 14.1125 6.54167 14.6875 6.425C15.2625 6.30833 15.8667 6.25 16.5 6.25C16.9333 6.25 17.3583 6.28333 17.775 6.35C18.1917 6.41667 18.6 6.5 19 6.6V8.2C18.6 8.05 18.1958 7.9375 17.7875 7.8625C17.3792 7.7875 16.95 7.75 16.5 7.75C15.8667 7.75 15.2583 7.82917 14.675 7.9875C14.0917 8.14583 13.5333 8.36667 13 8.65ZM12 13.05C12.7333 12.7 13.4708 12.4375 14.2125 12.2625C14.9542 12.0875 15.7167 12 16.5 12C17.1 12 17.6875 12.05 18.2625 12.15C18.8375 12.25 19.4167 12.4 20 12.6V2.7C19.45 2.46667 18.8792 2.29167 18.2875 2.175C17.6958 2.05833 17.1 2 16.5 2C15.7167 2 14.9417 2.1 14.175 2.3C13.4083 2.5 12.6833 2.8 12 3.2V13.05ZM11 16C10.2 15.3667 9.33333 14.875 8.4 14.525C7.46667 14.175 6.5 14 5.5 14C4.8 14 4.1125 14.0917 3.4375 14.275C2.7625 14.4583 2.11667 14.7167 1.5 15.05C1.15 15.2333 0.8125 15.225 0.4875 15.025C0.1625 14.825 0 14.5333 0 14.15V2.1C0 1.91667 0.0458333 1.74167 0.1375 1.575C0.229167 1.40833 0.366667 1.28333 0.55 1.2C1.33333 0.816667 2.1375 0.520833 2.9625 0.3125C3.7875 0.104167 4.63333 0 5.5 0C6.46667 0 7.4125 0.125 8.3375 0.375C9.2625 0.625 10.15 1 11 1.5C11.85 1 12.7375 0.625 13.6625 0.375C14.5875 0.125 15.5333 0 16.5 0C17.3667 0 18.2125 0.104167 19.0375 0.3125C19.8625 0.520833 20.6667 0.816667 21.45 1.2C21.6333 1.28333 21.7708 1.40833 21.8625 1.575C21.9542 1.74167 22 1.91667 22 2.1V14.15C22 14.5333 21.8375 14.825 21.5125 15.025C21.1875 15.225 20.85 15.2333 20.5 15.05C19.8833 14.7167 19.2375 14.4583 18.5625 14.275C17.8875 14.0917 17.2 14 16.5 14C15.5 14 14.5333 14.175 13.6 14.525C12.6667 14.875 11.8 15.3667 11 16Z" fill="#0078FF"/>
          </svg>
        </div>
      </div>
      <span data-node-name="option-title" data-figma-text-style="Inter/md-down (768~)/sub-title-02(500)" class="self-stretch text-[var(--text-color-color-text--primary,#263747)] text-[16px] font-medium leading-[150%] tracking-[-0.009em]">Open Book Allowed</span>
    </div>
  </div>
  <span data-node-name="body" data-figma-text-style="Inter/md-down (768~)/body-01" class="[flex:1_0_0] self-stretch text-[var(--text-color-color-text--body,#44576C)] text-[16px] font-normal leading-[160%] tracking-[-0.0063em]">Books and specific URLs are allowed.</span>
  <div data-node-name="form-massage" data-figma-component='{"name":"form-massage","nodeId":"I1817:13386;1814:34313","props":{"Type":"info_Test-taker Guidelines"}}' class="flex items-start gap-1 self-stretch">
    <div data-node-name="frame-1000004373" class="pt-[3px] pr-0 pb-0 pl-0 flex items-center gap-1">
      <div data-node-name="icon-allowed" data-figma-component='{"name":"icon_allowed","nodeId":"I1817:13386;1814:34313;1814:33343","props":{"Type":"Looking away"}}' class="p-px flex w-4 h-4 justify-center items-center gap-2.5 aspect-square">
        <div data-node-name="eye-tracking" class="w-3.5 h-3.5 flex-shrink-[0] aspect-square [fill:var(--text-color-color-text--secondary,_#98A8B9)]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.18182 14H1.27273C0.922727 14 0.623106 13.8754 0.373864 13.6261C0.124621 13.3769 0 13.0773 0 12.7273V10.8182H1.27273V12.7273H3.18182V14ZM10.8182 14V12.7273H12.7273V10.8182H14V12.7273C14 13.0773 13.8754 13.3769 13.6261 13.6261C13.3769 13.8754 13.0773 14 12.7273 14H10.8182ZM7 11.1364C5.72727 11.1364 4.57386 10.7598 3.53977 10.0068C2.50568 9.25379 1.75 8.25152 1.27273 7C1.75 5.74848 2.50568 4.74621 3.53977 3.99318C4.57386 3.24015 5.72727 2.86364 7 2.86364C8.27273 2.86364 9.42614 3.24015 10.4602 3.99318C11.4943 4.74621 12.25 5.74848 12.7273 7C12.25 8.25152 11.4943 9.25379 10.4602 10.0068C9.42614 10.7598 8.27273 11.1364 7 11.1364ZM7 9.22727C7.61515 9.22727 8.14015 9.00985 8.575 8.575C9.00985 8.14015 9.22727 7.61515 9.22727 7C9.22727 6.38485 9.00985 5.85985 8.575 5.425C8.14015 4.99015 7.61515 4.77273 7 4.77273C6.38485 4.77273 5.85985 4.99015 5.425 5.425C4.99015 5.85985 4.77273 6.38485 4.77273 7C4.77273 7.61515 4.99015 8.14015 5.425 8.575C5.85985 9.00985 6.38485 9.22727 7 9.22727ZM7 7.95455C6.73485 7.95455 6.50947 7.86174 6.32386 7.67614C6.13826 7.49053 6.04545 7.26515 6.04545 7C6.04545 6.73485 6.13826 6.50947 6.32386 6.32386C6.50947 6.13826 6.73485 6.04545 7 6.04545C7.26515 6.04545 7.49053 6.13826 7.67614 6.32386C7.86174 6.50947 7.95455 6.73485 7.95455 7C7.95455 7.26515 7.86174 7.49053 7.67614 7.67614C7.49053 7.86174 7.26515 7.95455 7 7.95455ZM0 3.18182V1.27273C0 0.922727 0.124621 0.623106 0.373864 0.373864C0.623106 0.124621 0.922727 0 1.27273 0H3.18182V1.27273H1.27273V3.18182H0ZM12.7273 3.18182V1.27273H10.8182V0H12.7273C13.0773 0 13.3769 0.124621 13.6261 0.373864C13.8754 0.623106 14 0.922727 14 1.27273V3.18182H12.7273Z" fill="#98A8B9"/>
          </svg>
        </div>
      </div>
    </div>
    <span data-node-name="text" data-figma-text-style="Inter/md-down (768~)/body-02" class="[flex:1_0_0] text-[var(--text-color-color-text--secondary,#98A8B9)] text-[14px] font-normal leading-[160%] tracking-[-0.0063em]">Looking Away Allowed</span>
  </div>
</div>`;

/**
 * Result `<head>` — 위 source(Tailwind CDN 런타임)와 시각적으로 동일하게
 * 렌더되도록, CardRadio가 실제 쓰는 유틸리티 클래스만 추려 정적 CSS로 담는다.
 * (전체 Tailwind 빌드 대신 "딱 필요한 값"만 — 셀렉터는 source body의 class 문자열에 매칭.)
 */
export const DEFAULT_SCRATCH_RESULT_HEAD = `<style>
/* minimal reset */
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; padding: 0; border: 0 solid; }
svg { display: block; }

/* layout */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-end { align-items: flex-end; }
.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.self-stretch { align-self: stretch; }
.\\[flex\\:1_0_0\\] { flex: 1 0 0; }
.flex-shrink-\\[0\\] { flex-shrink: 0; }
.aspect-square { aspect-ratio: 1 / 1; }
.aspect-\\[11\\/8\\] { aspect-ratio: 11 / 8; }

/* gap */
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-2\\.5 { gap: 0.625rem; }

/* size */
.h-20 { height: 5rem; }
.min-h-20 { min-height: 5rem; }
.w-6 { width: 1.5rem; }
.h-6 { height: 1.5rem; }
.w-4 { width: 1rem; }
.h-4 { height: 1rem; }
.w-3\\.5 { width: 0.875rem; }
.h-3\\.5 { height: 0.875rem; }
.w-\\[22px\\] { width: 22px; }

/* spacing */
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.px-5 { padding-left: 1.25rem; padding-right: 1.25rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.px-px { padding-left: 1px; padding-right: 1px; }
.p-px { padding: 1px; }
.pt-\\[3px\\] { padding-top: 3px; }
.pr-0 { padding-right: 0; }
.pb-0 { padding-bottom: 0; }
.pl-0 { padding-left: 0; }

/* border / radius / background */
.rounded-\\[8px\\] { border-radius: 8px; }
.border-2 { border-width: 2px; }
.border-solid { border-style: solid; }
.border-\\[var\\(--function-color-color-primary\\,\\#0078FF\\)\\] { border-color: var(--function-color-color-primary, #0078FF); }
.bg-\\[rgba\\(0\\,_120\\,_255\\,_0\\.02\\)\\] { background-color: rgba(0, 120, 255, 0.02); }

/* typography */
.text-\\[16px\\] { font-size: 16px; }
.text-\\[14px\\] { font-size: 14px; }
.font-medium { font-weight: 500; }
.font-normal { font-weight: 400; }
.leading-\\[150\\%\\] { line-height: 150%; }
.leading-\\[160\\%\\] { line-height: 160%; }
.tracking-\\[-0\\.009em\\] { letter-spacing: -0.009em; }
.tracking-\\[-0\\.0063em\\] { letter-spacing: -0.0063em; }
.text-\\[var\\(--text-color-color-text--primary\\,\\#263747\\)\\] { color: var(--text-color-color-text--primary, #263747); }
.text-\\[var\\(--text-color-color-text--body\\,\\#44576C\\)\\] { color: var(--text-color-color-text--body, #44576C); }
.text-\\[var\\(--text-color-color-text--secondary\\,\\#98A8B9\\)\\] { color: var(--text-color-color-text--secondary, #98A8B9); }

/* svg fill */
.\\[fill\\:var\\(--function-color-color-primary\\,_\\#0078FF\\)\\] { fill: var(--function-color-color-primary, #0078FF); }
.\\[fill\\:var\\(--text-color-color-text--secondary\\,_\\#98A8B9\\)\\] { fill: var(--text-color-color-text--secondary, #98A8B9); }
</style>`;

/**
 * Result `<body>` — source와 동일한 CardRadio 컴포넌트.
 * 정적 CSS(result head)로도 같은 모습으로 렌더되는지 비교용이라 같은 마크업을 쓴다.
 */
export const DEFAULT_SCRATCH_RESULT_BODY = `
<button type="button" role="switch" aria-checked="true" aria-label="toggle" data-state="on" class="group flex w-full flex-col items-start gap-2 rounded-lg px-5 py-4 text-left transition-[background-color,box-shadow] mobile-down:px-4 mobile-down:py-3 ring-primary bg-[rgba(0,120,255,0.02)] ring-2 ring-inset mobile-down:ring-1 hover:bg-blue-grey-20 cursor-pointer"><div data-slot="tcb-title" class="flex flex-col items-start gap-1 group-disabled:opacity-50 mobile-up:pb-6 mobile-down:[&amp;:not(:has(~[data-slot=tcb-allowed-actions])):not(:has(~[data-slot=tcb-note])):not(:has(~[data-slot=tcb-description]:not([data-mobile-hidden])))]:pb-6"><div class="mobile-down:gap-1 flex flex-col items-start gap-2"><div class="flex items-start gap-2.5 [&amp;&gt;svg]:fill-blue-grey-400 mobile-down:[&amp;&gt;svg]:size-5 [&amp;&gt;svg]:size-6 group-data-[state=on]:[&amp;&gt;svg]:fill-primary"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><mask id="ic-menu-book_svg__mask0_190_1106" width="24" height="24" x="0" y="0" maskUnits="userSpaceOnUse" style="mask-type: alpha;"><path d="M0 0h24v24H0z"></path></mask><g mask="url(#ic-menu-book_svg__mask0_190_1106)"><path d="M14 9.9V8.2a8.8 8.8 0 0 1 1.688-.525A9 9 0 0 1 17.5 7.5q.65 0 1.275.1T20 7.85v1.6q-.6-.225-1.212-.337A7 7 0 0 0 17.5 9q-.95 0-1.825.238A8 8 0 0 0 14 9.9m0 5.5v-1.7a8.8 8.8 0 0 1 1.688-.525A9 9 0 0 1 17.5 13q.65 0 1.275.1t1.225.25v1.6q-.6-.225-1.212-.337A7 7 0 0 0 17.5 14.5a7.3 7.3 0 0 0-1.825.225A7 7 0 0 0 14 15.4m0-2.75v-1.7a8.8 8.8 0 0 1 1.688-.525 9 9 0 0 1 1.812-.175q.65 0 1.275.1T20 10.6v1.6q-.6-.225-1.212-.337a7 7 0 0 0-1.288-.113q-.95 0-1.825.238A8 8 0 0 0 14 12.65m-1 4.4q1.099-.525 2.213-.788a10.268 10.268 0 0 1 4.05-.113q.863.151 1.737.451V6.7a8.7 8.7 0 0 0-1.712-.525 9.2 9.2 0 0 0-4.113.125q-1.15.3-2.175.9zM12 20a9.6 9.6 0 0 0-2.6-1.475A8.2 8.2 0 0 0 6.5 18q-1.05 0-2.062.275a9 9 0 0 0-1.938.775q-.525.275-1.012-.025A.97.97 0 0 1 1 18.15V6.1q0-.274.137-.525A.86.86 0 0 1 1.55 5.2q1.175-.575 2.412-.888Q5.2 4 6.5 4q1.45 0 2.838.375Q10.725 4.75 12 5.5A10.8 10.8 0 0 1 17.5 4q1.3 0 2.538.313 1.238.312 2.412.887.274.125.413.375.137.25.137.525v12.05a.97.97 0 0 1-.488.875q-.487.3-1.012.025a9 9 0 0 0-1.937-.775A7.8 7.8 0 0 0 17.5 18q-1.5 0-2.9.525A9.6 9.6 0 0 0 12 20"></path></g></svg></div><span class="type-sub-title-02 text-text-primary mobile-down:type-sub-title-03 group-data-[state=on]:font-medium">Open Book Allowed</span></div></div><span data-slot="tcb-description" data-mobile-hidden="" class="type-body-01 text-text-body flex-[1_0_0] mobile-down:hidden mobile-down:text-[14px] group-disabled:opacity-50">Books and specific URLs are allowed.</span><div data-slot="tcb-allowed-actions" class="flex items-start gap-1 group-disabled:opacity-50"><div class="flex gap-1 pt-1.25"><div class="[&amp;_svg]:fill-blue-grey-200 [&amp;_svg]:size-4"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><mask id="ic-eye-tracking_svg__mask0_219_4580" width="24" height="24" x="0" y="0" maskUnits="userSpaceOnUse" style="mask-type: alpha;"><path d="M0 0h24v24H0z"></path></mask><g mask="url(#ic-eye-tracking_svg__mask0_219_4580)"><path d="M6 23H3q-.824 0-1.412-.587A1.93 1.93 0 0 1 1 21v-3h2v3h3zm12 0v-2h3v-3h2v3q0 .824-.587 1.413A1.93 1.93 0 0 1 21 23zm-6-4.5q-3 0-5.437-1.775T3 12q1.125-2.95 3.563-4.725Q9 5.5 12 5.5t5.438 1.775T21 12q-1.125 2.95-3.562 4.725Q15 18.5 12 18.5m0-3q1.45 0 2.475-1.025A3.37 3.37 0 0 0 15.5 12q0-1.45-1.025-2.475A3.37 3.37 0 0 0 12 8.5q-1.45 0-2.475 1.025A3.37 3.37 0 0 0 8.5 12q0 1.45 1.025 2.475A3.37 3.37 0 0 0 12 15.5m0-2q-.625 0-1.062-.437A1.45 1.45 0 0 1 10.5 12q0-.625.438-1.062A1.45 1.45 0 0 1 12 10.5q.624 0 1.063.438.437.437.437 1.062 0 .624-.437 1.063A1.45 1.45 0 0 1 12 13.5M1 6V3q0-.824.587-1.412A1.93 1.93 0 0 1 3 1h3v2H3v3zm20 0V3h-3V1h3q.824 0 1.413.587Q23 2.176 23 3v3z"></path></g></svg></div></div><div><span class="type-body-02 text-text-secondary mobile-down:type-body-03">Looking Away Allowed</span></div></div></button>
`;

/**
 * 초기 에디터 콘텐츠 맨 위에만 붙이는 안내 주석.
 * (Examples 버튼 모달에는 넣지 않는다 — 그쪽은 복사용 순수 예시.)
 */
export const SCRATCH_EXAMPLE_NOTICE =
  '<!-- 👋 예시입니다 · 지우고 직접 입력하세요 · 상단 "Examples" 버튼으로 언제든 다시 볼 수 있어요 -->';

/** 초기값 조립용 — 안내 주석을 예시 앞에 붙인다. */
export function withExampleNotice(example: string): string {
  return `${SCRATCH_EXAMPLE_NOTICE}\n${example}`;
}

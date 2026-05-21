# diffify

Figma HTML(Source)와 구현 마크업(Result)을 브라우저에서 비교하는 **Scratch** 도구.

배포: **https://datalater.github.io/diffify/** (GitHub Pages, repo `datalater/diffify`)

## 로컬 개발

```bash
npm install
npm run dev
```

Vite `base`가 `/diffify/`이므로 로컬 미리보기:

```bash
npm run dev -- --open /diffify/
```

또는 `http://localhost:5173/diffify/`

## 빌드

```bash
npm run build
npm run preview   # dist 미리보기
```

## 기능

- Source/Result 각각 `<head>` + body HTML, 200ms debounce 미리보기
- Space/D: 한쪽만 표시 (dual iframe + `visibility`, flicker 없음)
- `localStorage` + URL `?state=` (gzip) 자동 저장·공유
- **로컬 dev 전용** (`npm run dev`): Playwright 캡처 + `@blazediff/core` 픽셀 diff, `.diffify/` 저장소 UI

### 로컬 픽셀 캡처 (dev only)

```bash
npm install
npm run dev -- --open /diffify/
```

첫 캡처 시 브라우저가 없으면 TopBar **「Chromium 설치」** 또는:

```bash
npm run setup:playwright
```

- **새로 캡처**: 현재 프로젝트·미리보기 크기(`width×height`) 기준으로 source/result PNG + diff PNG 저장
- **모드**: 오버레이(캡처 PNG / 라이브 iframe) · 픽셀 diff
- **로컬 캡처 저장소**: 페이지 하단에서 run 목록·용량·비우기

GitHub Pages 빌드에는 compare UI/API가 포함되지 않는다.

캡처 화질(선택):

```bash
DIFFIFY_CAPTURE_SCALE=2 npm run dev
```

`1`–`4` (기본 `1`). Playwright `deviceScaleFactor`와 `.diffify` 경로(`768x900@2x` 등)에 반영된다.
## GitHub Pages 배포

1. GitHub에서 repo `datalater/diffify` 생성
2. Settings → Pages → Source: **GitHub Actions**
3. `main`에 push → `.github/workflows/deploy-pages.yml` 이 `dist` 배포
4. URL: `https://datalater.github.io/diffify/`

## state 포맷

`scratch-persist` URL 인코딩 (`z.` / `u.` prefix). 워크스페이스는 `diffify-scratch-projects`·프로젝트별 draft/meta·IndexedDB `diffify-scratch`에 저장한다.

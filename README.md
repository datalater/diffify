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
## GitHub Pages 배포

1. GitHub에서 repo `datalater/diffify` 생성
2. Settings → Pages → Source: **GitHub Actions**
3. `main`에 push → `.github/workflows/deploy-pages.yml` 이 `dist` 배포
4. URL: `https://datalater.github.io/diffify/`

## state 포맷

hera `scratch-persist`와 동일 (`diffify-scratch-v1`, `z.` / `u.` prefix).

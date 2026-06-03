# tif-gacha-alert

강력추천 가챠가 새로 뜨면 텔레그램으로 알림 (GitHub Actions 5분 크론).

본체 웹앱(tif-gacha-web)의 `/api/gachas`를 호출해 `recommend` 가챠를 감지하고,
이전 상태(state.json, Actions 캐시)와 비교해 **새로 뜬 것만** 텔레그램으로 보냅니다.

## 설정 (GitHub repo → Settings → Secrets and variables → Actions)
- `TG_BOT_TOKEN` — 텔레그램 봇 토큰 (@BotFather)
- `TG_CHAT_ID` — 알림 받을 내 chat id (@userinfobot)
- `SITE_ACCESS_KEY` — 웹앱 접근 비밀번호

`SITE_URL`은 워크플로에 박혀 있음 (기본 https://tif-gacha-web.vercel.app).

## 수동 테스트
Actions 탭 → gacha-alert → Run workflow.

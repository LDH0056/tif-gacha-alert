# tif-gacha-alert

가챠 회수율(환원율)이 **90% / 95% / 100%** 를 돌파하면 텔레그램으로 알림 (GitHub Actions 15분 크론).

본체 웹앱(tif-gacha-web)의 `/api/gachas?source=tif|tplay` 를 호출해 각 가챠의 회수율(ratio)을 보고,
가챠당 각 단계를 **1번씩만** 발송. 이미 알린 단계는 재알림 안 함(상태=state.json, Actions 캐시).
1회 비용 1,000코인 미만(100원 이벤트 등)은 노이즈 컷으로 제외.

## 설정 (GitHub repo → Settings → Secrets and variables → Actions)
- `TG_BOT_TOKEN` — 텔레그램 봇 토큰 (@BotFather)
- `TG_CHAT_ID` — 알림 받을 내 chat id (@userinfobot)
- `SITE_ACCESS_KEY` — 웹앱 접근 비밀번호

`SITE_URL`은 워크플로에 박혀 있음 (기본 https://tif-gacha-web.vercel.app).

## 수동 테스트
Actions 탭 → gacha-alert → Run workflow.

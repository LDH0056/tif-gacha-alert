// 회수율(환원율) 마일스톤 알림 → 텔레그램
//  tif/tplay 가챠가 회수율 90/95/100% 를 돌파하면 각 단계 1회씩 알림.
//  (90 밑→다시 위로 와도 한 번 알린 단계는 재알림 안 함)
// env: SITE_URL, SITE_ACCESS_KEY, TG_BOT_TOKEN, TG_CHAT_ID, [DRY_RUN]
const fs = require('fs');

const SITE = process.env.SITE_URL || 'https://tif-gacha-web.vercel.app';
const KEY = process.env.SITE_ACCESS_KEY;
const TG = process.env.TG_BOT_TOKEN;
const CHAT = process.env.TG_CHAT_ID;
const DRY = !!process.env.DRY_RUN;
const SOURCES = ['tif', 'tplay'];   // 회수율(ratio) 있는 소스만
const SRC_NAME = { tif: 'TIF가챠', tplay: '가챠플레이' };
const STATE_FILE = 'state.json';

const MILESTONES = [90, 95, 100];  // 회수율 알림 단계(%)
const MIN_PRICE = 1000;            // 1회 비용 이 미만 가챠는 제외(100원 이벤트 등 노이즈 컷)

function esc(s) { return String(s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])); }
function n(x) { return (x || 0).toLocaleString(); }

async function fetchGachas(src) {
  const r = await fetch(`${SITE}/api/gachas?source=${src}`, { headers: { 'x-access-key': KEY } });
  if (!r.ok) { console.log(`[${src}] HTTP ${r.status}`); return []; }
  const j = await r.json();
  return (j.gachas || []).map(g => ({ src, ...g }));
}

async function sendTG(text) {
  if (DRY) { console.log('--- DRY ---\n' + text + '\n-----------'); return; }
  const r = await fetch(`https://api.telegram.org/bot${TG}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  if (!r.ok) console.log('텔레그램 전송 실패', r.status, await r.text());
}

(async () => {
  if (!DRY && (!KEY || !TG || !CHAT)) { console.log('환경변수 누락 (SITE_ACCESS_KEY/TG_BOT_TOKEN/TG_CHAT_ID)'); process.exit(0); }

  // 수동 테스트 핑 (workflow_dispatch에서 test=true)
  if (process.env.TEST_PING === 'true') {
    await sendTG('✅ <b>테스트 알림</b>\n회수율 봇 정상 작동 중 — 15분마다 감시.\n가챠가 90% / 95% / 100% 돌파하면 각 단계 1회 알림이 옵니다.');
    console.log('테스트 핑 발송 완료');
  }

  // 상태 로드: { milestones: { "tif:16111": 95, ... } }  (구버전 배열/형식이면 무시)
  let milestones = {};
  try {
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (raw && !Array.isArray(raw) && raw.milestones) milestones = raw.milestones;
  } catch (e) { /* 최초 실행 */ }

  const all = (await Promise.all(SOURCES.map(fetchGachas))).flat();

  let mCount = 0;
  for (const g of all) {
    if (g.ratio == null || (g.price || 0) < MIN_PRICE) continue;
    const pct = Math.round(g.ratio * 100);
    const key = `${g.src}:${g.id}`;
    const done = milestones[key] || 0;            // 이미 알린 최고 단계
    const toFire = MILESTONES.filter(m => m > done && pct >= m);
    for (const m of toFire) {
      const emoji = m >= 100 ? '🔥' : '📈';
      const label = m >= 100 ? '100% 본전 돌파!' : `${m}% 도달`;
      await sendTG(`${emoji} 회수율 ${label}  [${SRC_NAME[g.src]}]\n${esc(g.name)}\n회수율 <b>${pct}%</b> · EV ${n(g.ev)} / 1회 ${n(g.price)}코인 · 남은 ${n(g.remain)}회\n👉 ${SITE}`);
      mCount++;
      console.log('마일스톤:', g.src, g.id, m + '%', g.name);
    }
    if (toFire.length) milestones[key] = Math.max(done, ...toFire);
  }

  if (!DRY) fs.writeFileSync(STATE_FILE, JSON.stringify({ milestones }));
  console.log(`마일스톤 알림 ${mCount}건 (감시 ${all.length}개)`);
})().catch(e => { console.error(e); process.exit(1); });

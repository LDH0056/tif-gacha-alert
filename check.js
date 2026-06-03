// 강력추천 가챠 감지 → 텔레그램 알림 (새로 뜬 것만)
// env: SITE_URL, SITE_ACCESS_KEY, TG_BOT_TOKEN, TG_CHAT_ID
const fs = require('fs');

const SITE = process.env.SITE_URL || 'https://tif-gacha-web.vercel.app';
const KEY = process.env.SITE_ACCESS_KEY;
const TG = process.env.TG_BOT_TOKEN;
const CHAT = process.env.TG_CHAT_ID;
const SOURCES = ['tif', 'tplay', 'spt'];
const SRC_NAME = { tif: 'TIF가챠', tplay: '가챠플레이', spt: 'SPT가챠' };
const STATE_FILE = 'state.json';

function esc(s) { return String(s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])); }

async function getRecommends(src) {
  const r = await fetch(`${SITE}/api/gachas?source=${src}`, { headers: { 'x-access-key': KEY } });
  if (!r.ok) { console.log(`[${src}] HTTP ${r.status}`); return []; }
  const j = await r.json();
  return (j.gachas || []).filter(g => g.recommend)
    .map(g => ({ src, id: g.id, name: g.name, openRate: g.openRate }));
}

async function sendTG(text) {
  const r = await fetch(`https://api.telegram.org/bot${TG}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  if (!r.ok) console.log('텔레그램 전송 실패', r.status, await r.text());
}

(async () => {
  if (!KEY || !TG || !CHAT) { console.log('환경변수 누락 (SITE_ACCESS_KEY/TG_BOT_TOKEN/TG_CHAT_ID)'); process.exit(0); }

  let prev = [];
  try { prev = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (e) { /* 최초 실행 */ }
  const prevSet = new Set(prev);

  const all = (await Promise.all(SOURCES.map(getRecommends))).flat();
  const curKeys = all.map(g => `${g.src}:${g.id}`);
  const fresh = all.filter(g => !prevSet.has(`${g.src}:${g.id}`));

  for (const g of fresh) {
    const msg = `🔥 <b>강력추천</b>  [${SRC_NAME[g.src]}]\n` +
      `${esc(g.name)}\n` +
      `개봉률 <b>${g.openRate}%</b> · HIT 상위 경품 재고 있음\n` +
      `👉 ${SITE}`;
    await sendTG(msg);
    console.log('알림:', g.src, g.id, g.name);
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify(curKeys));
  console.log(`현재 강력추천 ${all.length}건, 신규 알림 ${fresh.length}건`);
})().catch(e => { console.error(e); process.exit(1); });

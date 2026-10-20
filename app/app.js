const chat = document.getElementById("chat");
const box = document.getElementById("box");
const cardsEl = document.getElementById("cards");
const toolsEl = document.getElementById("tools");
const chipsEl = document.getElementById("chips");
const emptyEl = document.getElementById("empty");
const onboardEl = document.getElementById("onboard");

let history = [];
let PROFILE = { name: "Family", lang: "en" };
try {
  const saved = JSON.parse(localStorage.getItem("fc_profile") || "{}");
  if (saved.name) PROFILE.name = String(saved.name);
  if (saved.lang) PROFILE.lang = String(saved.lang);
} catch(e) {}

const VOICES = {
  en: ["Joanna", "en-US"],
  hi: ["Kajal", "hi-IN"],
  ja: ["Takumi", "ja-JP"],
};
function ttsLang(){ return (VOICES[PROFILE.lang] || VOICES.en)[1]; }
function ttsVoice(){ return (VOICES[PROFILE.lang] || VOICES.en)[0]; }

const I18N = {
  en: {
    obTitle: "Let's get to know you",
    obSub: "Ten seconds — then my memory is yours.",
    obNameQ: "What should I call you?",
    obLangQ: "Alexa ki zubaan — ことばをえらんでね",
    obDone: "Let's go →",
    obCustomPh: "Type a name…",
    heroTitle: "What should the family do tonight?",
    heroReady: "Ready when you are, %s.",
    heroSub: "One ask — I line up the calendar, the living-room TV, the front door and snacks. Every tool call below runs on a real MCP server.",
    placeholder: "Ask anything — e.g. 'movie night with kids'",
    kids: "Kids mode — kid-safe picks only",
    error: "Server's off — run ./run.sh and try again.",
    mediaSub: "Kid-safe for tonight",
    tvKidsOn: "🛡️ Kids mode — only U/A",
    tvKidsOff: "Kids mode off",
    doorSub: "Front Door • Entryway",
    doorCam: "📹 Front door",
    doorHint: "Last event from the front door",
    etaLabel: "⏱️ Arriving by",
    delivChip: "Grocery delivery",
    calBadge: "Free @ 7:30 PM",
    calFree: "Free after 7:30 PM — that's your movie-night window.",
    remindSub: "Family check-ins",
    remindTag: "💌 Sent:",
    remindCall: "📞 Video call:",
    propNote: "Nothing is ordered until you say confirm.",
    btnConfirm: "✓ Confirm order",
    btnCancel: "✕ Cancel",
    micTitle: "Voice input (Chrome)",
    ttsOn: "Alexa voice: on",
    ttsOff: "Alexa voice: muted",
    editTitle: "Edit profile",
    chips: [
      ["movie night with kids", "🎬 movie night with kids"],
      ["who is at the front door?", "🔔 front door?"],
      ["what's on my calendar today?", "📅 calendar"],
      ["order popcorn and samosa", "🍿 order snacks"],
      ["check in on grandma", "👵 check on grandma"],
    ],
    heroChips: [
      ["who is at the front door?", "🔔 front door?"],
      ["what's on my calendar today?", "📅 calendar"],
      ["order popcorn and samosa", "🍿 order snacks"],
      ["check in on grandma", "👵 check on grandma"],
    ],
  },
  hi: {
    obTitle: "Pehli mulaquat — chalo jaan-pahchaan ho jaye",
    obSub: "Das second lagenge — phir meri yaaddasht aapki hai.",
    obNameQ: "Main aapko kya bulau?",
    obLangQ: "Alexa ki zubaan — ことばをえらんでね",
    obDone: "Chalo shuru karein →",
    obCustomPh: "Naam likhiye…",
    heroTitle: "Aaj family raat mein kare kya?",
    heroReady: "Aapke liye taiyaar hoon, %s.",
    heroSub: "Ek baat boliye — calendar, TV, darwaza aur snacks main sambhal lunga. Har tool call neeche real MCP server par chal rahi hai.",
    placeholder: "Kuch bhi poochhiye — jaise 'movie night aaj karna hai'",
    kids: "Bachon ka mode — sirf kid-safe picks",
    error: "Server band hai — ./run.sh chalaiye, fir try kijiye.",
    mediaSub: "Bachon ke liye safe",
    tvKidsOn: "🛡️ Bachon ka mode — sirf U/A",
    tvKidsOff: "Bachon ka mode band",
    doorSub: "Front door • bahar",
    doorCam: "📹 Darwaza",
    doorHint: "Darwaze ka last event",
    etaLabel: "⏱️ Ghar pahunchega",
    delivChip: "Grocery delivery",
    calBadge: "7:30 PM ke baad free",
    calFree: "7:30 ke baad aap free hain — wahi movie night ka window.",
    remindSub: "Family check-ins",
    remindTag: "💌 Bheja:",
    remindCall: "📞 Video call:",
    propNote: "Aap confirm karne tak kuch order nahi hoga.",
    btnConfirm: "✓ Order confirm",
    btnCancel: "✕ Cancel",
    error: "Server band hai — ./run.sh chalaiye, fir try kijiye.",
    micTitle: "Awaaz se poochhiye (Chrome)",
    ttsOn: "Alexa awaaz: on",
    ttsOff: "Alexa awaaz: band",
    editTitle: "Profile badlein",
    chips: [
      ["movie night aaj karna hai", "🎬 movie night aaj"],
      ["darwaza pe kaun hai?", "🔔 darwaza?"],
      ["aaj ka plan?", "📅 plan"],
      ["samosa order karo", "🍿 samosa"],
      ["dadi se baat karao", "👵 dadi"],
    ],
    heroChips: [
      ["darwaza pe kaun hai?", "🔔 darwaza?"],
      ["aaj ka plan?", "📅 plan"],
      ["samosa order karo", "🍿 samosa"],
      ["dadi se baat karao", "👵 dadi"],
    ],
  },
  ja: {
    obTitle: "はじめまして — ちょっとだけ教えてね",
    obSub: "10秒だけ。おぼえたら、いつでも思い出します。",
    obNameQ: "なんて呼べばいい？",
    obLangQ: "ことばをえらんでね",
    obDone: "はじめよう →",
    obCustomPh: "なまえを入れてね…",
    heroTitle: "今夜、家族で何をする？",
    heroReady: "いつでも準備OK、%sさん。",
    heroSub: "ひと言で — カレンダー、リビングのTV、玄関、おやつをぜんぶおまかせ。下のtool callはぜんぶ本物のMCPサーバーで動いています。",
    placeholder: "なにでも聞いてね — 例：「映画の夜の準備」",
    kids: "Kids mode — 子ども向きだけ",
    mediaSub: "今夜はkid-safe pick",
    tvKidsOn: "🛡️ kids mode — U/Aだけ",
    tvKidsOff: "kids modeオフ",
    doorSub: "玄関 • 入り口",
    doorCam: "📹 玄関",
    doorHint: "玄関のさいきんのイベント",
    etaLabel: "⏱️ 到着は",
    delivChip: "お買い物デリバリー",
    calBadge: "19:30以降フリー",
    calFree: "19:30以降は空いています — これがmovie nightの時間。",
    remindSub: "家族の見守り",
    remindTag: "💌 送信ずみ:",
    remindCall: "📞 Video call:",
    propNote: "confirmするまで注文はしません。",
    btnConfirm: "✓ 注文を確定",
    btnCancel: "✕ キャンセル",
    error: "サーバーが動いていません — ./run.sh を実行してからもう一度。",
    micTitle: "声で聞く（Chrome）",
    ttsOn: "Alexaの声: オン",
    ttsOff: "Alexaの声: ミュート",
    editTitle: "profile を編集",
    chips: [
      ["映画の夜の準備", "🎬 映画の夜"],
      ["玄関はどう？", "🔔 玄関"],
      ["今日の予定は？", "📅 予定"],
      ["ポップコーン注文", "🍿 おやつ"],
      ["おばあちゃんに連絡", "👵 おばあちゃん"],
    ],
    heroChips: [
      ["玄関はどう？", "🔔 玄関"],
      ["今日の予定は？", "📅 予定"],
      ["ポップコーン注文", "🍿 おやつ"],
      ["おばあちゃんに連絡", "👵 おばあちゃん"],
    ],
  },
};
function t08n(){ return I18N[PROFILE.lang] || I18N.en; }

function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

function bubble(who, text){
  const d = document.createElement("div");
  d.className = "msg " + who;
  const label = document.createElement("b");
  label.textContent = who === "alexa" ? "Alexa+" : "You";
  d.appendChild(label);
  const body = document.createElement("span");
  body.className = "msg-text";
  d.appendChild(body);
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
  typeInto(body, text, who === "alexa" ? 1300 : 0);
}

function typeInto(el, text, dur){
  text = String(text);
  if(!dur){ el.textContent = text; return; }
  const tokens = text.split(/(\s+)/).filter(x=>x !== "");
  const step = Math.max(18, Math.min(60, dur / Math.max(1, tokens.length)));
  let i = 0;
  const iv = setInterval(()=>{
    el.textContent += tokens[i];
    i += 1;
    const nearBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 120;
    if(nearBottom) chat.scrollTop = chat.scrollHeight;
    if(i >= tokens.length) clearInterval(iv);
  }, step);
}

function saveProfile(){
  try{ localStorage.setItem("fc_profile", JSON.stringify(PROFILE)); }catch(e){}
}

function heroTitleText(){
  const cfg = t08n();
  if(PROFILE.name && PROFILE.name !== "Family") return cfg.heroReady.replace("%s", PROFILE.name);
  return cfg.heroTitle;
}

function heroCtaHtml(){
  return t08n().chips[0][1];
}

function buildChips(){
  const cfg = t08n();
  chipsEl.innerHTML = cfg.chips
    .map(c=>'<button data-q="'+escapeHtml(c[0])+'">'+c[1]+"</button>").join("");
  const heroChips = document.getElementById("hero-chips");
  if(heroChips){
    heroChips.innerHTML = cfg.heroChips
      .map(c=>'<button data-q="'+escapeHtml(c[0])+'">'+c[1]+"</button>").join("");
  }
}

function applyLang(lang){
  if(!I18N[lang]) lang = "en";
  PROFILE.lang = lang;
  saveProfile();
  document.documentElement.lang = ttsLang();
  const cfg = I18N[lang];
  const set = (id, val)=>{ const el=document.getElementById(id); if(el) el.textContent=val; };
  set("ob-title", cfg.obTitle);
  set("ob-sub", cfg.obSub);
  set("ob-name-q", cfg.obNameQ);
  set("ob-lang-q", cfg.obLangQ);
  set("ob-done", cfg.obDone);
  const obCustom = document.getElementById("ob-name-input");
  if(obCustom) obCustom.placeholder = cfg.obCustomPh;
  set("hero-title", heroTitleText());
  set("hero-sub", cfg.heroSub);
  const cta = document.getElementById("hero-cta");
  if(cta) cta.innerHTML = heroCtaHtml();
  box.placeholder = cfg.placeholder;
  set("kids-label", cfg.kids);
  const mic = document.getElementById("mic");
  if(mic) mic.title = cfg.micTitle;
  const tts = document.getElementById("tts-toggle");
  if(tts) tts.title = voiceEnabled ? cfg.ttsOn : cfg.ttsOff;
  const editBtn = document.getElementById("edit-profile");
  if(editBtn) editBtn.title = cfg.editTitle;
  document.querySelectorAll(".lang button").forEach(b=>{
    b.classList.toggle("active", b.dataset.lang === lang);
  });
  document.querySelectorAll("#ob-langs button").forEach(b=>{
    b.classList.toggle("sel", b.dataset.oblang === lang);
  });
  buildChips();
}

function hideEmptyState(){
  if(emptyEl && !emptyEl.classList.contains("fading")){
    emptyEl.classList.add("fading");
    setTimeout(()=>{ emptyEl.style.display = "none"; }, 250);
    if(chipsEl) chipsEl.hidden = false;
  }
}

function showThinking(){
  const d = document.createElement("div");
  d.className = "msg alexa thinking";
  d.id = "thinking";
  d.innerHTML = "<b>Alexa+</b><span class='dots'><i></i><i></i><i></i></span>";
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}

function hideThinking(){
  const d = document.getElementById("thinking");
  if(d) d.remove();
}

let voiceEnabled = true;

function speak(text){
  if(!voiceEnabled || !window.speechSynthesis) return;
  text = String(text || "");
  if(!text.trim()) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/[*_#`]/g, "");
  const u = new SpeechSynthesisUtterance(clean);
  u.rate = 1.02;
  u.pitch = 1.0;
  u.lang = ttsLang();
  const ring = document.querySelector(".ring");
  u.onstart = ()=>{ if(ring) ring.classList.add("speaking"); };
  u.onend = ()=>{ if(ring) ring.classList.remove("speaking"); };
  u.onerror = ()=>{ if(ring) ring.classList.remove("speaking"); };
  window.speechSynthesis.speak(u);
}

function renderCards(cards){
  if(!cards || !cards.length) return;
  const cfg = t08n();
  cardsEl.innerHTML = "";
  cards.forEach((c,i)=>{
    const d=document.createElement("div");
    d.className="vcard";
    d.dataset.type = c.type;
    d.style.animationDelay = (i * 0.09) + "s";
    let inner="";

    if(c.type==="media"){
      const items = c.items || [];
      inner += `
        <div class="vcard-header">
          <span class="vcard-icon">🎬</span>
          <div>
            <h4>${escapeHtml(c.title || "Tonight's picks")}</h4>
            <span class="vcard-sub">${escapeHtml(cfg.mediaSub)}</span>
          </div>
          <span class="badge-tag green">Kids-Safe ON</span>
        </div>
        <div class="media-grid">
          ${items.map(it=>`
            <div class="media-item">
              <span class="play-btn">▶</span>
              <span class="media-title">${escapeHtml(it)}</span>
              <span class="media-chip">Watch Now</span>
            </div>
          `).join("")}
        </div>
      `;
    } else if(c.type==="tv"){
      const tv = c.detail || {};
      inner += `
        <div class="vcard-header">
          <span class="vcard-icon">📺</span>
          <div>
            <h4>${escapeHtml(c.title || "Living-Room TV")}</h4>
            <span class="vcard-sub">Living Room • 4K TV</span>
          </div>
          <span class="badge-tag cyan">Now playing</span>
        </div>
        <div class="tv-mockup">
          <div class="tv-screen">
            <div class="tv-screen-content">
              <span class="tv-app-pill">▶ App: <b>${escapeHtml(tv.app || "Movies")}</b></span>
              <span class="tv-kids-tag">${tv.kids_mode ? escapeHtml(cfg.tvKidsOn) : escapeHtml(cfg.tvKidsOff)}</span>
            </div>
          </div>
          <div class="tv-meta-row">
            <span>🔊 Volume: <b>${escapeHtml(String(tv.volume || 22))}</b></span>
            <span>⚡ Power: <b style="color:var(--green)">ON</b></span>
            <span>📡 Input: <b>HDMI 1</b></span>
          </div>
        </div>
      `;
    } else if(c.type==="door"){
      const door = c.detail || {};
      inner += `
        <div class="vcard-header">
          <span class="vcard-icon">🔔</span>
          <div>
            <h4>${escapeHtml(c.title || "Front Door Camera")}</h4>
            <span class="vcard-sub">${escapeHtml(cfg.doorSub)}</span>
          </div>
          <span class="badge-tag red-pulse">● LIVE 1080p</span>
        </div>
        <div class="camera-viewport">
          <div class="cam-scanline"></div>
          <div class="cam-overlay">
            <span class="cam-badge">${escapeHtml(cfg.doorCam)}</span>
            <span class="cam-time">${escapeHtml(door.time || "Just now")}</span>
          </div>
          <div class="cam-event-banner">
            <span class="cam-event-icon">📦</span>
            <div class="cam-event-text">
              <b>${escapeHtml(door.last_event || "Motion detected")}</b>
              <small>${escapeHtml(cfg.doorHint)}</small>
            </div>
          </div>
        </div>
      `;
    } else if(c.type==="order"){
      const ord = c.detail || {};
      const items = ord.items || [];
      inner += `
        <div class="vcard-header">
          <span class="vcard-icon">🍿</span>
          <div>
            <h4>${escapeHtml(c.title || "Grocery Order")}</h4>
            <span class="vcard-sub">ID: ${escapeHtml(ord.order_id || "ORD-LIVE")}</span>
          </div>
          <span class="badge-tag green">Confirmed</span>
        </div>
        <div class="order-tracker">
          <div class="order-progress">
            <div class="p-step done"><span class="p-dot">✓</span><span>Ordered</span></div>
            <div class="p-line done"></div>
            <div class="p-step done"><span class="p-dot">✓</span><span>Packing</span></div>
            <div class="p-line active"></div>
            <div class="p-step current"><span class="p-dot">●</span><span>On the Way</span></div>
          </div>
          <div class="order-eta">
            <span>${escapeHtml(cfg.etaLabel)} <b>${escapeHtml(ord.eta || "in 30 min")}</b></span>
            <span class="status-chip">${escapeHtml(cfg.delivChip)}</span>
          </div>
          <div class="order-items-list">
            ${items.map(it=>`
              <span class="order-item-pill">
                ${it.includes("popcorn") ? "🍿" : it.includes("samosa") ? "🥟" : it.includes("juice") ? "🧃" : "🛍️"}
                ${escapeHtml(it)}
              </span>
            `).join("")}
          </div>
        </div>
      `;
    } else if(c.type==="calendar"){
      const cal = c.detail || {};
      const events = cal.events || [];
      inner += `
        <div class="vcard-header">
          <span class="vcard-icon">📅</span>
          <div>
            <h4>${escapeHtml(c.title || "Family Calendar")}</h4>
            <span class="vcard-sub">${escapeHtml(cal.day ? cal.day.toUpperCase() : "TODAY")}</span>
          </div>
          <span class="badge-tag purple">${escapeHtml(cfg.calBadge)}</span>
        </div>
        <div class="cal-timeline">
          ${events.map(e=>`
            <div class="cal-item">
              <span class="cal-time">${escapeHtml(e.start || "")}</span>
              <div class="cal-details">
                <b>${escapeHtml(e.title || "")}</b>
                <small>${escapeHtml(e.start || "")} - ${escapeHtml(e.end || "")}</small>
              </div>
            </div>
          `).join("")}
          <div class="cal-free-highlight">
            ${escapeHtml(cfg.calFree)}
          </div>
        </div>
      `;
    } else if(c.type==="remind"){
      const rem = c.detail || {};
      inner += `
        <div class="vcard-header">
          <span class="vcard-icon">👵</span>
          <div>
            <h4>${escapeHtml(c.title || "Grandma Check-in")}</h4>
            <span class="vcard-sub">${escapeHtml(cfg.remindSub)}</span>
          </div>
          <span class="badge-tag pink">Message Sent</span>
        </div>
        <div class="remind-card-body">
          <div class="remind-bubble">
            <span class="bubble-tag">${escapeHtml(cfg.remindTag)}</span>
            <p>"${escapeHtml(rem.message || "")}"</p>
          </div>
          <div class="remind-call-row">
            <span>${escapeHtml(cfg.remindCall)} <b>${escapeHtml(rem.call_scheduled || "")}</b></span>
            <span class="badge-tag green">Confirmed</span>
          </div>
        </div>
      `;
    } else if(c.type==="order_proposal"){
      const prop = c.detail || {};
      const items = prop.items || [];
      inner += `
        <div class="vcard-header">
          <span class="vcard-icon">🛡️</span>
          <div>
            <h4>${escapeHtml(c.title || "Confirm Your Order")}</h4>
            <span class="vcard-sub">Proposal: ${escapeHtml(prop.proposal_id || "PROP")}</span>
          </div>
          <span class="badge-tag amber">Human Approval</span>
        </div>
        <div class="proposal-card-body">
          <div class="proposal-items">
            <p>Items: <b>${items.map(i=>escapeHtml(i)).join(", ")}</b></p>
            <p>Deliver to: <b>${escapeHtml(prop.address || "Home")}</b></p>
            <small class="proposal-note">${escapeHtml(cfg.propNote)}</small>
          </div>
          <div class="proposal-actions">
            <button class="btn-confirm" onclick="send('confirm')">${escapeHtml(cfg.btnConfirm)}</button>
            <button class="btn-decline" onclick="send('cancel')">${escapeHtml(cfg.btnCancel)}</button>
          </div>
        </div>
      `;
    } else {
      inner += `
        <h4>${escapeHtml(c.title||c.type)}</h4>
        <pre>${escapeHtml(JSON.stringify(c.detail||c.items||c,null,2)).slice(0,600)}</pre>
      `;
    }

    d.innerHTML = inner;
    cardsEl.appendChild(d);
  });
}

function renderTools(tools){
  if(!tools || !tools.length){ toolsEl.innerHTML='<p class="muted">None yet.</p>'; return; }
  toolsEl.innerHTML = tools.map(t=>'<span class="tool">🔧 '+escapeHtml(t)+"</span>").join(" ");
}

async function fetchAuditLedger(){
  const el = document.getElementById("audit-ledger");
  if(!el) return;
  try{
    const r = await fetch("/api/audit");
    const d = await r.json();
    const entries = d.entries || [];
    if(!entries.length){
      el.innerHTML = '<p class="muted">Nothing logged yet.</p>';
      return;
    }
    el.innerHTML = entries.slice(0, 5).map(e=>{
      const t = new Date(e.ts * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
      return `
        <div class="audit-row ${e.ok ? 'ok' : 'err'}">
          <div class="audit-main">
            <span class="audit-tool">⚡ ${escapeHtml(e.tool)}</span>
            <span class="audit-status ${e.ok ? 'ok' : 'err'}">${e.ok ? 'PASS' : 'FAIL'}</span>
          </div>
          <span class="audit-time">${t}</span>
        </div>
      `;
    }).join("");
  }catch(e){}
}

function updateChatCount(n){
  const badge = document.getElementById("chat-count-badge");
  const mem = document.getElementById("memory-count");
  if(badge) badge.textContent = "Chat #" + n;
  if(mem) mem.textContent = n + (n === 1 ? " chat" : " chats");
}

async function speakViaPolly(text){
  try{
    const r = await fetch("/api/speak",{method:"POST",headers:{"Content-Type":"application/json"},
      body: JSON.stringify({text, voice: ttsVoice()})});
    if(!r.ok) return false;
    const d = await r.json();
    if(!d.audio_b64) return false;
    const ring = document.querySelector(".ring");
    await new Promise((res, rej)=>{
      const a = new Audio("data:audio/mpeg;base64,"+d.audio_b64);
      if(ring) ring.classList.add("speaking");
      a.onended = ()=>{ if(ring) ring.classList.remove("speaking"); res(); };
      a.onerror = ()=>{ if(ring) ring.classList.remove("speaking"); rej(new Error("audio")); };
      a.play().catch(rej);
    });
    return true;
  }catch(e){ return false; }
}

async function send(text){
  text = (text||box.value||"").trim();
  if(!text) return;
  const kids = document.getElementById("kids").checked;
  hideEmptyState();
  hideThinking();
  box.value="";
  bubble("you", text);
  showThinking();
  try{
    const r = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},
      body: JSON.stringify({message:text, history, profile:{name:PROFILE.name, lang:PROFILE.lang, kids_mode:kids}})});
    if(!r.ok) throw new Error("http " + r.status);
    const out = await r.json();
    if(!out || typeof out.reply !== "string") throw new Error("bad payload");
    hideThinking();
    bubble("alexa", out.reply);
    renderCards(out.cards);
    renderTools(out.tools_used);
    if(!(await speakViaPolly(out.reply))) speak(out.reply);
    fetchAuditLedger();
    if(typeof out.chat_count === "number"){
      updateChatCount(out.chat_count);
    } else {
      updateChatCount(history.length + 1);
    }
    history.push({user:text, alexa:out.reply});
  }catch(e){
    hideThinking();
    bubble("alexa", t08n().error);
  }
}

// ── Onboarding ──
let obName = "Krrish";
let obLang = PROFILE.lang;

document.getElementById("ob-done").onclick = ()=>{
  const custom = document.getElementById("ob-name-input");
  if(custom && custom.value.trim() && !custom.hidden) obName = custom.value.trim();
  PROFILE.name = obName || "Family";
  saveProfile();
  onboardEl.hidden = true;
  applyLang(obLang || "en");
};

// Suggestion chips + hero CTAs (event delegation survives rebuilds)
document.addEventListener("click", (e)=>{
  const q = e.target.closest("[data-q]");
  if(q){ send(q.dataset.q); return; }
  const langBtn = e.target.closest(".lang button");
  if(langBtn){ applyLang(langBtn.dataset.lang); return; }
  const obLangBtn = e.target.closest("#ob-langs button");
  if(obLangBtn){
    obLang = obLangBtn.dataset.oblang;
    document.querySelectorAll("#ob-langs button").forEach(b=>b.classList.toggle("sel", b===obLangBtn));
    return;
  }
  const nameBtn = e.target.closest("#ob-names button");
  if(nameBtn){
    document.querySelectorAll("#ob-names button").forEach(b=>b.classList.toggle("sel", b===nameBtn));
    const custom = document.getElementById("ob-name-input");
    if(nameBtn.dataset.name === "__custom"){
      custom.hidden = false;
      custom.focus();
      obName = "";
    } else {
      custom.hidden = true;
      obName = nameBtn.dataset.name;
    }
    return;
  }
});

document.getElementById("edit-profile").onclick = ()=>{
  onboardEl.hidden = false;
};

// Voice input (Web Speech API, Chrome)
document.getElementById("mic").onclick=()=>{
  const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ alert(t08n().error.includes("run.sh") ? "Voice needs Chrome. Type instead." : "Voice needs Chrome. Type instead."); return; }
  const mic = document.getElementById("mic");
  const rec=new SR(); rec.lang=ttsLang(); rec.start();
  mic.classList.add("listening");
  rec.onend=()=>mic.classList.remove("listening");
  rec.onerror=()=>mic.classList.remove("listening");
  rec.onresult=e=>{ box.value=e.results[0][0].transcript; send(); };
};

// Voice audio TTS toggle
const ttsBtn = document.getElementById("tts-toggle");
if(ttsBtn){
  ttsBtn.onclick=()=>{
    voiceEnabled = !voiceEnabled;
    ttsBtn.textContent = voiceEnabled ? "🔊" : "🔇";
    ttsBtn.title = voiceEnabled ? t08n().ttsOn : t08n().ttsOff;
    ttsBtn.classList.toggle("muted", !voiceEnabled);
    if(!voiceEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
  };
}

document.getElementById("send").onclick=()=>send();
box.addEventListener("keydown",e=>{if(e.key==="Enter")send();});

// Initial load: persisted memory count decides onboarding vs hero
fetch("/api/memory")
  .then(r=>r.json())
  .then(d=>{
    if(d && typeof d.total_chats === "number") updateChatCount(d.total_chats);
    applyLang(PROFILE.lang);
    const fresh = !d || typeof d.total_chats !== "number" || d.total_chats === 0;
    if(fresh){
      onboardEl.hidden = false;
    } else {
      applyLang(PROFILE.lang);  // personalize hero with stored name
    }
  })
  .catch(()=>{
    applyLang(PROFILE.lang);
  });

const chat = document.getElementById("chat");
const box = document.getElementById("box");
const cardsEl = document.getElementById("cards");
const toolsEl = document.getElementById("tools");
const chipsEl = document.getElementById("chips");
const emptyEl = document.getElementById("empty");
const onboardEl = document.getElementById("onboard");

let history = [];
let PROFILE = { name: "Family", lang: "en", land: "", kids_home: true, wife_home: false, grandparents_home: false, relatives_home: false, custom_home: "" };
try {
  const saved = JSON.parse(localStorage.getItem("fc_profile") || "{}");
  if (saved.name) PROFILE.name = String(saved.name);
  if (saved.lang) PROFILE.lang = String(saved.lang);
  if (saved.land) PROFILE.land = String(saved.land);
  if (saved.agegroup) PROFILE.agegroup = String(saved.agegroup);
  if (saved.gender) PROFILE.gender = String(saved.gender);
  if (typeof saved.kids_home === "boolean") PROFILE.kids_home = saved.kids_home;
  if (typeof saved.wife_home === "boolean") PROFILE.wife_home = saved.wife_home;
  if (typeof saved.grandparents_home === "boolean") PROFILE.grandparents_home = saved.grandparents_home;
  if (typeof saved.relatives_home === "boolean") PROFILE.relatives_home = saved.relatives_home;
  if (saved.custom_home) PROFILE.custom_home = String(saved.custom_home);
} catch(e) {}

const VOICES = {
  en: ["Joanna", "en-US"],
  hi: ["Kajal", "hi-IN"],
  ja: ["Takumi", "ja-JP"],
};
function ttsLang(){ return (VOICES[PROFILE.lang] || VOICES.en)[1]; }
function ttsVoice(){ return (VOICES[PROFILE.lang] || VOICES.en)[0]; }

const OB_GREET = {
  en: "%s! Ready when you are — I already remember this.",
  hi: "%s! Aapke liye taiyaar hoon — sab yaad hai mujhe.",
  ja: "%sさん!いつでも準備OK — もう覚えています。",
};

const I18N = {
  en: {
    obTitle: "Let's get to know you",
    obSub: "Ten seconds — then my memory is yours.",
    obNameQ: "What should I call you?",
    obLangQ: "Alexa ki zubaan — ことばをえらんでね",
    obDone: "Let's go →",
    obCustomPh: "Type a name…",
    obAgeQ: "A little about you — optional, skip anytime",
    obHomeQ: "Who's at home?",
    obHomeNote: "Tailors movie recommendations, snacks, and home controls.",
    obNext: "Next →",
    obSkipTxt: "skip — keep it simple",
    obBackTxt: "← back",
    heroTitle: "What should the family do tonight?",
    heroReady: "Ready when you are, %s.",
    heroSub: "One ask — I line up the calendar, the living-room TV, the front door and snacks. Every tool call below runs on a real MCP server.",
    placeholder: "Ask anything — e.g. 'movie night with kids'",
    kids: "Kids mode — kid-safe picks only",
    error: "Server's off — run ./run.sh and try again.",
    mediaSub: "Kid-safe for tonight",
    tvKidsOn: "Kids mode — only U/A",
    tvKidsOff: "Kids mode off",
    doorSub: "Front Door • Entryway",
    doorCam: "Front door",
    doorHint: "Last event from the front door",
    etaLabel: "Arriving by",
    delivChip: "Grocery delivery",
    calBadge: "Free @ 7:30 PM",
    calFree: "Free after 7:30 PM — that's your movie-night window.",
    remindSub: "Family check-ins",
    remindTag: "Sent:",
    remindCall: "Video call:",
    propNote: "Nothing is ordered until you say confirm.",
    btnConfirm: "Confirm order",
    btnCancel: "Cancel",
    sceneSub: "Movie-night scene",
    sceneLights: "Lights — dimmed to 20%",
    sceneDnd: "Front door — do-not-disturb",
    sceneTv: "Living-room TV — ready",
    sceneBadge: "Scene Active",
    weatherSub: "Home forecast",
    weatherNow: "Now",
    weatherEve: "Evening",
    weatherBadge: "Updated",
    hwSub: "Kids mode",
    hwLeft: "min left",
    hwBadge: "To finish",
    hwDoneNote: "Done — screen time unlocked",
    listSub: "Family shopping list",
    listBadge: "Added",
    listOn: "On the list now",
    micTitle: "Voice input (Chrome)",
    ttsOn: "Voice: on",
    ttsOff: "Voice: muted",
    editTitle: "Edit profile",
    chips: [
      ["movie night with kids", "movie night with kids"],
      ["who is at the front door?", "front door?"],
      ["what's on my calendar today?", "calendar"],
      ["order popcorn and samosa", "order snacks"],
      ["check in on grandma", "check on grandma"],
      ["dim the lights", "dim lights"],
      ["how's the weather?", "weather"],
      ["is homework done?", "homework"],
      ["add milk to the shopping list", "shopping list"],
    ],
    heroChips: [
      ["who is at the front door?", "front door?"],
      ["what's on my calendar today?", "calendar"],
      ["order popcorn and samosa", "order snacks"],
      ["check in on grandma", "check on grandma"],
      ["dim the lights", "dim lights"],
      ["how's the weather?", "weather"],
    ],
  },
  hi: {
    obTitle: "Pehli mulaquat — chalo jaan-pahchaan ho jaye",
    obSub: "Das second lagenge — phir meri yaaddasht aapki hai.",
    obNameQ: "Main aapko kya bulau?",
    obLangQ: "Alexa ki zubaan — ことばをえらんでね",
    obDone: "Chalo shuru karein →",
    obCustomPh: "Naam likhiye…",
    obAgeQ: "Thoda apne baare mein — optional, kabhi skip",
    obHomeQ: "Ghar par kaun-kaun hai?",
    obHomeNote: "Movie recommendations, snacks aur controls family ke hisaab se set hote hain.",
    obNext: "Aage →",
    obSkipTxt: "skip — seedha rakho",
    obBackTxt: "← peeche",
    heroTitle: "Aaj family raat mein kare kya?",
    heroReady: "Aapke liye taiyaar hoon, %s.",
    heroSub: "Ek baat boliye — calendar, TV, darwaza aur snacks main sambhal lunga. Har tool call neeche real MCP server par chal rahi hai.",
    placeholder: "Kuch bhi poochhiye — jaise 'movie night aaj karna hai'",
    kids: "Bachon ka mode — sirf kid-safe picks",
    error: "Server band hai — ./run.sh chalaiye, fir try kijiye.",
    mediaSub: "Bachon ke liye safe",
    tvKidsOn: "Bachon ka mode — sirf U/A",
    tvKidsOff: "Bachon ka mode band",
    doorSub: "Front door • bahar",
    doorCam: "Darwaza",
    doorHint: "Darwaze ka last event",
    etaLabel: "Ghar pahunchega",
    delivChip: "Grocery delivery",
    calBadge: "7:30 PM ke baad free",
    calFree: "7:30 ke baad aap free hain — wahi movie night ka window.",
    remindSub: "Family check-ins",
    remindTag: "Bheja:",
    remindCall: "Video call:",
    propNote: "Aap confirm karne tak kuch order nahi hoga.",
    btnConfirm: "Order confirm",
    btnCancel: "Cancel",
    sceneSub: "Movie-night scene",
    sceneLights: "Lights — 20% par dim",
    sceneDnd: "Darwaza — do-not-disturb",
    sceneTv: "Living-room TV — ready",
    sceneBadge: "Scene on",
    weatherSub: "Ghar ka mausam",
    weatherNow: "Abhi",
    weatherEve: "Shaam",
    weatherBadge: "Updated",
    hwSub: "Bachon ka mode",
    hwLeft: "min baaki",
    hwBadge: "Khatam karna hai",
    hwDoneNote: "Ho gaya — screen time unlocked",
    listSub: "Family shopping list",
    listBadge: "Add ho gaya",
    listOn: "Abhi list par",
    micTitle: "Awaaz se poochhiye (Chrome)",
    ttsOn: "Voice: on",
    ttsOff: "Voice: band",
    editTitle: "Profile badlein",
    chips: [
      ["movie night aaj karna hai", "movie night aaj"],
      ["darwaza pe kaun hai?", "darwaza?"],
      ["aaj ka plan?", "plan"],
      ["samosa order karo", "samosa"],
      ["dadi se baat karao", "dadi"],
      ["lights dim karo", "scene"],
      ["mausam kaisa hai?", "mausam"],
      ["homework ka status?", "homework"],
      ["list mein doodh add karo", "list"],
    ],
    heroChips: [
      ["darwaza pe kaun hai?", "darwaza?"],
      ["aaj ka plan?", "plan"],
      ["samosa order karo", "samosa"],
      ["dadi se baat karao", "dadi"],
      ["lights dim karo", "scene"],
      ["mausam kaisa hai?", "mausam"],
    ],
  },
  ja: {
    obTitle: "はじめまして — ちょっとだけ教えてね",
    obSub: "10秒だけ。おぼえたら、いつでも思い出します。",
    obNameQ: "なんて呼べばいい？",
    obLangQ: "ことばをえらんでね",
    obDone: "はじめよう →",
    obCustomPh: "なまえを入れてね…",
    obAgeQ: "ちょっとだけ教えてね — やめてもOK",
    obHomeQ: "おうちには誰がいる？",
    obHomeNote: "映画のセレクトやおやつ、家電コントロールをご家族に合わせます。",
    obNext: "つぎへ →",
    obSkipTxt: "スキップ — シンプルに",
    obBackTxt: "← もどる",
    heroTitle: "今夜、家族で何をする？",
    heroReady: "いつでも準備OK、%sさん。",
    heroSub: "ひと言で — カレンダー、リビングのTV、玄関、おやつをぜんぶおまかせ。下のtool callはぜんぶ本物のMCPサーバーで動いています。",
    placeholder: "なにでも聞いてね — 例：「映画の夜の準備」",
    kids: "Kids mode — 子ども向きだけ",
    mediaSub: "今夜はkid-safe pick",
    tvKidsOn: "kids mode — U/Aだけ",
    tvKidsOff: "kids modeオフ",
    doorSub: "玄関 • 入り口",
    doorCam: "玄関",
    doorHint: "玄関のさいきんのイベント",
    etaLabel: "到着は",
    delivChip: "お買い物デリバリー",
    calBadge: "19:30以降フリー",
    calFree: "19:30以降は空いています — これがmovie nightの時間。",
    remindSub: "家族の見守り",
    remindTag: "送信ずみ:",
    remindCall: "Video call:",
    propNote: "confirmするまで注文はしません。",
    btnConfirm: "注文を確定",
    btnCancel: "キャンセル",
    sceneSub: "movie-night シーン",
    sceneLights: "照明 — 20%におとした",
    sceneDnd: "玄関 — 取り込み中",
    sceneTv: "リビングTV — 準備ずみ",
    sceneBadge: "シーン実行中",
    weatherSub: "おうちのお天気",
    weatherNow: "いま",
    weatherEve: "夜",
    weatherBadge: "さいしん",
    hwSub: "kids mode",
    hwLeft: "ぶんのこり",
    hwBadge: "のこり",
    hwDoneNote: "おわってます — 画面タイムOK",
    listSub: "家族の買い物リスト",
    listBadge: "追加ずみ",
    listOn: "いまのリスト",
    error: "サーバーが動いていません — ./run.sh を実行してからもう一度。",
    micTitle: "声で聞く（Chrome）",
    ttsOn: "Voice: オン",
    ttsOff: "Voice: ミュート",
    editTitle: "profile を編集",
    chips: [
      ["映画の夜の準備", "映画の夜"],
      ["玄関はどう？", "玄関"],
      ["今日の予定は？", "予定"],
      ["ポップコーン注文", "おやつ"],
      ["おばあちゃんに連絡", "おばあちゃん"],
      ["ライトを落として", "シーン"],
      ["天気はどう？", "天気"],
      ["宿題は？", "宿題"],
      ["リストにぎゅうにゅうを追加", "リスト"],
    ],
    heroChips: [
      ["玄関はどう？", "玄関"],
      ["今日の予定は？", "予定"],
      ["ポップコーン注文", "おやつ"],
      ["おばあちゃんに連絡", "おばあちゃん"],
      ["ライトを落として", "シーン"],
      ["天気はどう？", "天気"],
    ],
  },
};
function t08n(){ return I18N[PROFILE.lang] || I18N.en; }

// Live "what will Alexa run" detection while typing (mirrors agent/agent.py router order).
// Normalization: lowercase + collapse extra spaces, so case/spacing never break matching.
let mayConfirm = false;
const HINT_RULES = [
  { keys: ["movie night","film","filmy","eiga","映画","ムービー","मूवी","फिल्म","movie ka","movie plan"], hint: "🎬 → <b>get_calendar</b> <b>tv_control</b> <b>door_status</b> <b>order_groceries</b> <b>scene_control</b> <b>get_weather</b>" },
  { keys: ["scene","dim","lights","mood","sajao","ライト","あかり","照明"], hint: "💡 → <b>scene_control</b>", skipMovie: true },
  { keys: ["homework","padhai","study","宿題","しゅくだい","benkyou"], hint: "📚 → <b>check_homework</b>" },
  { keys: ["weather","rain","baarish","barish","mausam","tenki","天気","てんき","あめ","雨"], hint: "🌦️ → <b>get_weather</b>" },
  { keys: ["shopping list","to list","list par","list mein","kharidari","リスト","りすと"], hint: "🛒 → <b>add_shopping_list</b>" },
  { keys: ["door","ring","package","delivery","who is","darwaza","darwaze","दरवाज़ा","玄関","genkan"], hint: "🔔 → <b>door_status</b>" },
  { keys: ["order","popcorn","groceries","buy","snack","samosa","khana","注文","ポップコーン","サモサ","食べ物","たべもの"], hint: "🛒 → <b>propose_order</b> · confirm_order" },
  { keys: ["calendar","schedule","meeting","plan","free","tomorrow","today","tonight","kab hai","予定","カレンダー","karenda"], hint: "📅 → <b>get_calendar</b>" },
  { keys: ["grandma","grandmother","nani","dadi","check in","remind","दादी","नानी","祖母","おばあちゃん","baat karao"], hint: "👵 → <b>remind_grandma</b> · get_calendar" },
  { keys: ["tv","watch","play","kids","cricket","movie"], hint: "📺 → <b>tv_control</b>" },
];
const HINT_CONFIRM = ["confirm","place it","yes, order","yes order","confirm kar","haan order","ok order","確定","かくてい"];
const HINT_CANCEL = ["cancel","decline","never mind","cancel karo","キャンセル"];

function updateTypeHint(){
  let el = document.getElementById("type-hint");
  if(!el) return;
  const t = (box.value || "").toLowerCase().replace(/\s+/g, " ").trim();
  let html = "";
  if(mayConfirm && HINT_CONFIRM.some(k=>t.includes(k))){
    html = "🛒 → <b>confirm_order</b>";
  } else if(mayConfirm && HINT_CANCEL.some(k=>t.includes(k))){
    html = "✕ → <b>confirm_order</b> (decline)";
  } else {
    for(const r of HINT_RULES){
      if(r.skipMovie && (t.includes("movie night") || t.includes("映画の夜"))) continue;
      if(r.keys.some(k=>t.includes(k))){ html = "✓ " + r.hint; break; }
    }
  }
  el.innerHTML = html;
  el.classList.toggle("on", !!html);
}

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
  updateUserHeader();
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
  if(PROFILE.grandparents_home){
    chipsEl.querySelectorAll("[data-q]").forEach(b=>{
      const q = (b.dataset.q || "").toLowerCase();
      if(q.includes("grandma") || q.includes("dadi") || q.includes("おばあちゃん")) b.classList.add("hot");
    });
  }
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
  set("ob-age-q", cfg.obAgeQ);
  set("ob-home-q", cfg.obHomeQ);
  set("ob-home-note", cfg.obHomeNote);
  set("ob-n1", cfg.obNext);
  set("ob-n2", cfg.obNext);
  set("ob-n3", cfg.obNext);
  set("ob-skip2", cfg.obSkipTxt);
  set("ob-back", cfg.obBackTxt);
  const AGE_LABELS = { en: ["Kid","Teen","Adult","60+"], hi: ["Bacha","Teen","Adult","60+"], ja: ["子ども","10代","おとな","60+"] };
  const HOME_LABELS = { en: ["🧒 Kids","👵 Grandparents"], hi: ["🧒 Bachche","👵 Dadi-Nani"], ja: ["🧒 子ども","👵 ばあば"] };
  document.querySelectorAll("#ob-ages [data-age]").forEach(b=>{ b.textContent = AGE_LABELS[lang][["kid","teen","adult","60s"].indexOf(b.dataset.age)]; });
  document.querySelectorAll("#ob-homes [data-home]").forEach(b=>{ b.textContent = HOME_LABELS[lang][b.dataset.home === "kids" ? 0 : 1]; });
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
  updateObPreview();
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
    } else if(c.type==="scene"){
      inner += `
        <div class="vcard-header">
          <span class="vcard-icon">💡</span>
          <div>
            <h4>${escapeHtml(c.title || "Movie-night scene")}</h4>
            <span class="vcard-sub">${escapeHtml(cfg.sceneSub)}</span>
          </div>
          <span class="badge-tag amber">${escapeHtml(cfg.sceneBadge)}</span>
        </div>
        <div class="scene-rows">
          <div class="scene-row"><span>${escapeHtml(cfg.sceneLights)}</span><b>💡</b></div>
          <div class="scene-row"><span>${escapeHtml(cfg.sceneDnd)}</span><b>🚪</b></div>
          <div class="scene-row"><span>${escapeHtml(cfg.sceneTv)}</span><b>📺</b></div>
        </div>
      `;
    } else if(c.type==="weather"){
      const w = c.detail || {};
      inner += `
        <div class="vcard-header">
          <span class="vcard-icon">🌦️</span>
          <div>
            <h4>${escapeHtml(c.title || "Weather")}</h4>
            <span class="vcard-sub">${escapeHtml(cfg.weatherSub)}</span>
          </div>
          <span class="badge-tag cyan">${escapeHtml(cfg.weatherBadge)}</span>
        </div>
        <div class="weather-body">
          <span class="weather-temp">${escapeHtml(String(w.temp_c || ""))}°C</span>
          <div class="weather-conds">
            <span><b>${escapeHtml(cfg.weatherNow)}</b> ${escapeHtml(w.now || "")}</span>
            <span><b>${escapeHtml(cfg.weatherEve)}</b> ${escapeHtml(w.evening || "")}</span>
          </div>
        </div>
      `;
    } else if(c.type==="homework"){
      const hw = c.detail || {};
      const done = !!hw.done;
      inner += `
        <div class="vcard-header">
          <span class="vcard-icon">📚</span>
          <div>
            <h4>${escapeHtml(c.title || "Homework check")}</h4>
            <span class="vcard-sub">${escapeHtml(cfg.hwSub)}</span>
          </div>
          <span class="badge-tag ${done ? "green" : "amber"}">${done ? "✓" : escapeHtml(cfg.hwBadge)}</span>
        </div>
        <div class="scene-rows">
          <div class="scene-row">
            <span>${escapeHtml(hw.subject || "")}</span>
            <b>${done ? escapeHtml(cfg.hwDoneNote) : escapeHtml(String(hw.minutes_left || 0)) + " " + escapeHtml(cfg.hwLeft)}</b>
          </div>
        </div>
      `;
    } else if(c.type==="shopping_list"){
      const sl = c.detail || {};
      const items = sl.list || sl.added || [];
      inner += `
        <div class="vcard-header">
          <span class="vcard-icon">🛒</span>
          <div>
            <h4>${escapeHtml(c.title || "Shopping list")}</h4>
            <span class="vcard-sub">${escapeHtml(cfg.listSub)}</span>
          </div>
          <span class="badge-tag green">${escapeHtml(cfg.listBadge)}</span>
        </div>
        <div class="list-pills">
          ${items.map(it=>`<span class="order-item-pill">${escapeHtml(it)}</span>`).join("")}
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
    if(currentAudio){ try{ currentAudio.pause(); }catch(e){} currentAudio = null; }
    const r = await fetch("/api/speak",{method:"POST",headers:{"Content-Type":"application/json"},
      body: JSON.stringify({text, voice: ttsVoice()})});
    if(!r.ok) return false;
    const d = await r.json();
    if(!d.audio_b64) return false;
    const ring = document.querySelector(".ring");
    await new Promise((res, rej)=>{
      const a = new Audio("data:audio/mpeg;base64,"+d.audio_b64);
      currentAudio = a;
      if(ring) ring.classList.add("speaking");
      a.onended = ()=>{ if(currentAudio === a) currentAudio = null; if(ring) ring.classList.remove("speaking"); res(); };
      a.onerror = ()=>{ if(currentAudio === a) currentAudio = null; if(ring) ring.classList.remove("speaking"); rej(new Error("audio")); };
      a.play().catch(rej);
    });
    return true;
  }catch(e){ return false; }
}

// One turn at a time: while a call is in flight the next ask waits in a FIFO
// queue and runs the moment the current turn (speech included) is done.
let busy = false;
let currentAudio = null;
const turnQueue = [];

function runNextTurn(){
  if(turnQueue.length) setTimeout(()=>send(turnQueue.shift(), true), 200);
}

function setBusy(on){
  busy = on;
  document.body.classList.toggle("busy", on);
  if(!on && window.speechSynthesis) window.speechSynthesis.cancel();
}

async function send(text, fromQueue){
  text = (text||box.value||"").trim();
  if(!text) return;
  if(busy && !fromQueue){ turnQueue.push(text); return; }
  setBusy(true);
  const kids = document.getElementById("kids").checked;
  hideEmptyState();
  hideThinking();
  box.value="";
  updateTypeHint();
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
    if(out.cards && out.cards.some(c=>c.type==="order_proposal")){
      mayConfirm = true;
    } else if((out.tools_used||[]).some(x=>String(x).startsWith("confirm_order"))){
      mayConfirm = false;
    }
    if(!(await speakViaPolly(out.reply))) speak(out.reply);
    fetchAuditLedger();
    if(typeof out.chat_count === "number"){
      updateChatCount(out.chat_count);
    } else {
      updateChatCount(history.length + 1);
    }
    history.push({user:text, alexa:out.reply});
    setBusy(false);
    runNextTurn();
  }catch(e){
    hideThinking();
    bubble("alexa", t08n().error);
    setBusy(false);
    runNextTurn();
  }
}

// ── Onboarding (4-step) + landing ──
let obName = "Krrish";
let obLang = PROFILE.lang;
let obStep = 1;

const OB_DEFAULTS = {
  agegroup: PROFILE.agegroup || "",
  gender: PROFILE.gender || "",
  kids_home: PROFILE.kids_home !== undefined ? PROFILE.kids_home : true,
  grandparents_home: PROFILE.grandparents_home !== undefined ? PROFILE.grandparents_home : false,
};

function obSel(containerId, attrKey, val){
  document.querySelectorAll("#"+containerId+" button").forEach(b=>b.classList.toggle("sel", val && b.getAttribute(attrKey) === val));
}

function updateObPreview(){
  const el = document.getElementById("ob-preview");
  if(!el) return;
  const who = obName || "Family";
  el.textContent = (OB_GREET[obLang] || OB_GREET.en).replace("%s", who);
}

function obShow(n){
  obStep = n;
  document.querySelectorAll(".ob-step").forEach(s=>{
    s.hidden = Number(s.dataset.step) !== n;
  });
  document.querySelectorAll("#ob-dots i").forEach((d,i)=>d.classList.toggle("on", i < n));
  const back = document.getElementById("ob-back");
  if(back) back.hidden = n === 1;
  if(n === 4) updateObPreview();
}

function updateUserHeader(){
  const badge = document.getElementById("user-profile-badge");
  const nameEl = document.getElementById("user-display-name");
  const detailsEl = document.getElementById("user-display-details");
  const logoutBtn = document.getElementById("logout-btn");

  const hasName = PROFILE.name && PROFILE.name !== "Family";
  const isConfigured = !!(PROFILE.land && hasName);
  const userName = isConfigured ? PROFILE.name : (hasName ? PROFILE.name : "Family");

  if(nameEl) nameEl.textContent = userName;
  if(detailsEl){
    const bits = [];
    if(PROFILE.agegroup) bits.push(PROFILE.agegroup);
    if(PROFILE.kids_home) bits.push("🛡️ kids");
    if(PROFILE.lang && PROFILE.lang !== "en") bits.push(PROFILE.lang.toUpperCase());
    detailsEl.textContent = bits.length ? `• ${bits.join(" · ")}` : "";
  }
  if(badge) badge.hidden = !isConfigured;
  if(logoutBtn) logoutBtn.hidden = !isConfigured;
}

function showLanding(){
  document.body.classList.add("show-landing");
  if(onboardEl) onboardEl.hidden = true;
  updateLandingButtons();
}

function updateLandingButtons(){
  const skipBtn = document.getElementById("land-skip");
  const hasProfile = PROFILE.land && PROFILE.name && PROFILE.name !== "Family";
  if(skipBtn){
    skipBtn.textContent = hasProfile ? `Open App (${PROFILE.name}) →` : "just show me the app";
  }
}

function enterApp(){
  document.body.classList.remove("show-landing");
  if(onboardEl) onboardEl.hidden = false;
  obBackfill();
  obShow(1);
}

function enterAppDirect(){
  document.body.classList.remove("show-landing");
  if(onboardEl) onboardEl.hidden = true;
  updateLandingButtons();
  updateUserHeader();
}

function obBackfill(){
  obName = (PROFILE.land && PROFILE.name && PROFILE.name !== "Family") ? PROFILE.name : "Krrish";
  document.querySelectorAll("#ob-names button").forEach(b=>b.classList.toggle("sel", b.dataset.name === obName));
  const custom = document.getElementById("ob-name-input");
  if(custom){ custom.value = obName; if(![...document.querySelectorAll("#ob-names button")].some(b=>b.classList.contains("sel"))){ custom.hidden = false; } else custom.hidden = true; }
  obSel("ob-ages", "data-age", OB_DEFAULTS.agegroup);
  obSel("ob-gends", "data-gender", OB_DEFAULTS.gender);
  obSel("ob-homes", "data-home", OB_DEFAULTS.kids_home ? "kids" : "");
  document.querySelector('#ob-homes [data-home="grandma"]').classList.toggle("sel", OB_DEFAULTS.grandparents_home);
  obLang = PROFILE.lang || "en";
}

function finishOnboarding(){
  const custom = document.getElementById("ob-name-input");
  if(custom && custom.value.trim() && !custom.hidden) obName = custom.value.trim();
  PROFILE.name = obName || "Family";
  PROFILE.land = "saved";
  PROFILE.agegroup = OB_DEFAULTS.agegroup;
  PROFILE.gender = OB_DEFAULTS.gender;
  PROFILE.kids_home = OB_DEFAULTS.kids_home;
  PROFILE.grandparents_home = OB_DEFAULTS.grandparents_home;
  saveProfile();
  document.body.classList.remove("show-landing");
  if(onboardEl) onboardEl.hidden = true;
  const kids = document.getElementById("kids");
  if(kids) kids.checked = PROFILE.kids_home ? true : kids.checked;
  updateLandingButtons();
  updateUserHeader();
  applyLang(obLang || "en");
}

document.getElementById("land-cta").onclick = enterApp;
document.getElementById("land-skip").onclick = ()=>{
  if(!PROFILE.land) PROFILE.land = "skip";
  saveProfile();
  enterAppDirect();
  applyLang(PROFILE.lang || "en");
};

const navBrand = document.getElementById("nav-brand");
if(navBrand) navBrand.onclick = showLanding;

const navLanding = document.getElementById("nav-landing");
if(navLanding) navLanding.onclick = showLanding;

const landLogo = document.getElementById("land-logo");
if(landLogo) landLogo.onclick = enterAppDirect;

const landNavApp = document.getElementById("land-nav-app");
if(landNavApp) landNavApp.onclick = enterAppDirect;

const obClose = document.getElementById("ob-close");
if(obClose){
  obClose.onclick = ()=>{
    if(onboardEl) onboardEl.hidden = true;
    enterAppDirect();
  };
}

const logoutBtn = document.getElementById("logout-btn");
if(logoutBtn){
  logoutBtn.onclick = ()=>{
    localStorage.removeItem("fc_profile");
    PROFILE = { name: "Family", lang: "en", land: "" };
    OB_DEFAULTS.agegroup = "";
    OB_DEFAULTS.gender = "";
    OB_DEFAULTS.kids_home = true;
    OB_DEFAULTS.grandparents_home = false;
    obName = "Krrish";
    obLang = "en";
    updateUserHeader();
    showLanding();
    applyLang("en");
  };
}

[navBrand, navLanding].forEach(el=>{
  if(el) el.addEventListener("keydown", e=>{ if(e.key==="Enter" || e.key===" ") { e.preventDefault(); showLanding(); } });
});
[landLogo, landNavApp].forEach(el=>{
  if(el) el.addEventListener("keydown", e=>{ if(e.key==="Enter" || e.key===" ") { e.preventDefault(); enterAppDirect(); } });
});

document.getElementById("ob-done").onclick = finishOnboarding;
document.getElementById("ob-back").onclick = ()=>{ obShow(obStep > 1 ? obStep - 1 : 1); };
document.getElementById("ob-n1").onclick = ()=>obShow(2);
document.getElementById("ob-n2").onclick = ()=>obShow(3);
document.getElementById("ob-n3").onclick = ()=>obShow(4);
document.getElementById("ob-skip2").onclick = ()=>{
  OB_DEFAULTS.agegroup = "";
  OB_DEFAULTS.gender = "";
  obSel("ob-ages", "data-age", "");
  obSel("ob-gends", "data-gender", "");
  obShow(3);
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
    updateObPreview();
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
  const ageBtn = e.target.closest("#ob-ages button");
  if(ageBtn){
    OB_DEFAULTS.agegroup = ageBtn.dataset.age;
    obSel("ob-ages", "data-age", OB_DEFAULTS.agegroup);
    return;
  }
  const gBtn = e.target.closest("#ob-gends button");
  if(gBtn){
    OB_DEFAULTS.gender = gBtn.dataset.gender;
    obSel("ob-gends", "data-gender", OB_DEFAULTS.gender);
    return;
  }
  const hBtn = e.target.closest("#ob-homes button");
  if(hBtn){
    const key = hBtn.dataset.home === "kids" ? "kids_home" : "grandparents_home";
    OB_DEFAULTS[key] = !OB_DEFAULTS[key];
    hBtn.classList.toggle("sel", OB_DEFAULTS[key]);
    return;
  }
});

document.getElementById("edit-profile").onclick = ()=>{
  obBackfill();
  obShow(1);
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
box.addEventListener("input",updateTypeHint);
updateTypeHint();

// Light/dark theme (persists across visits)
let darkSaved = false;
try{ darkSaved = localStorage.getItem("fc_theme") === "dark"; }catch(e){}
document.documentElement.classList.toggle("dark", darkSaved);
document.querySelectorAll(".theme-toggle").forEach(btn=>{
  btn.onclick = ()=>{
    const dark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", dark);
    try{ localStorage.setItem("fc_theme", dark ? "dark" : "light"); }catch(e){}
  };
});

// Initial load: first visit → landing; returning → straight into the app.
// Landing is the only entry point to the stepper; the app never force-opens it.
if(!PROFILE.land){
  document.body.classList.add("show-landing");
  updateLandingButtons();
  updateUserHeader();
} else {
  enterAppDirect();
}
fetch("/api/memory")
  .then(r=>r.json())
  .then(d=>{
    if(d && typeof d.total_chats === "number") updateChatCount(d.total_chats);
    applyLang(PROFILE.lang);
  })
  .catch(()=>{
    applyLang(PROFILE.lang);
  });

const chat = document.getElementById("chat");
const box = document.getElementById("box");
const cardsEl = document.getElementById("cards");
const toolsEl = document.getElementById("tools");
const chipsEl = document.getElementById("chips");
const emptyEl = document.getElementById("empty");
let history = [];

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
  // Word-by-word reveal, capped so long replies never feel slow.
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
  window.speechSynthesis.cancel();
  const clean = text.replace(/[*_#`]/g, "");
  const u = new SpeechSynthesisUtterance(clean);
  u.rate = 1.02;
  u.pitch = 1.0;
  const ring = document.querySelector(".ring");
  u.onstart = ()=>{ if(ring) ring.classList.add("speaking"); };
  u.onend = ()=>{ if(ring) ring.classList.remove("speaking"); };
  u.onerror = ()=>{ if(ring) ring.classList.remove("speaking"); };
  window.speechSynthesis.speak(u);
}

function renderCards(cards){
  if(!cards || !cards.length) return;
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
            <span class="vcard-sub">Kid-safe for tonight</span>
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
              <span class="tv-kids-tag">${tv.kids_mode ? "🛡️ Kids mode — only U/A" : "Kids mode off"}</span>
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
            <span class="vcard-sub">Front Door • Entryway</span>
          </div>
          <span class="badge-tag red-pulse">● LIVE 1080p</span>
        </div>
        <div class="camera-viewport">
          <div class="cam-scanline"></div>
          <div class="cam-overlay">
            <span class="cam-badge">📹 Front door</span>
            <span class="cam-time">${escapeHtml(door.time || "Just now")}</span>
          </div>
          <div class="cam-event-banner">
            <span class="cam-event-icon">📦</span>
            <div class="cam-event-text">
              <b>${escapeHtml(door.last_event || "Motion detected")}</b>
              <small>Last event from the front door</small>
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
            <span>⏱️ Arriving by <b>${escapeHtml(ord.eta || "in 30 min")}</b></span>
            <span class="status-chip">Grocery delivery</span>
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
          <span class="badge-tag purple">Free @ 7:30 PM</span>
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
            Free after 7:30 PM — that's your movie-night window.
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
            <span class="vcard-sub">Family check-ins</span>
          </div>
          <span class="badge-tag pink">Message Sent</span>
        </div>
        <div class="remind-card-body">
          <div class="remind-bubble">
            <span class="bubble-tag">💌 Sent:</span>
            <p>"${escapeHtml(rem.message || "Hi Grandma! Just checking in — how are you feeling today?")}"</p>
          </div>
          <div class="remind-call-row">
            <span>📞 Video call: <b>${escapeHtml(rem.call_scheduled || "Tomorrow 10:00")}</b></span>
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
            <small class="proposal-note">Nothing is ordered until you say confirm.</small>
          </div>
          <div class="proposal-actions">
            <button class="btn-confirm" onclick="send('confirm')">✓ Confirm order</button>
            <button class="btn-decline" onclick="send('cancel')">✕ Cancel</button>
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
      body: JSON.stringify({text})});
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
  hideEmptyState();
  hideThinking();
  box.value="";
  bubble("you", text);
  const kids = document.getElementById("kids").checked;
  showThinking();
  try{
    const r = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},
      body: JSON.stringify({message:text, history, profile:{name:"Family",kids_mode:kids}})});
    const out = await r.json();
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
    bubble("alexa","Server's off — run ./run.sh and try again.");
  }
}

document.getElementById("send").onclick=()=>send();
box.addEventListener("keydown",e=>{if(e.key==="Enter")send();});
document.querySelectorAll("[data-q]").forEach(b=>b.addEventListener("click",()=>send(b.dataset.q)));

// Voice input (Web Speech API, Chrome)
document.getElementById("mic").onclick=()=>{
  const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ alert("Voice needs Chrome. Type instead."); return; }
  const mic = document.getElementById("mic");
  const rec=new SR(); rec.lang="en-US"; rec.start();
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
    ttsBtn.title = voiceEnabled ? "Alexa voice: on" : "Alexa voice: muted";
    ttsBtn.classList.toggle("muted", !voiceEnabled);
    if(!voiceEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
  };
}

// Initial load: persisted memory count + audit ledger
fetch("/api/memory")
  .then(r=>r.json())
  .then(d=>{ if(d && typeof d.total_chats === "number") updateChatCount(d.total_chats); })
  .catch(()=>{});

fetchAuditLedger();

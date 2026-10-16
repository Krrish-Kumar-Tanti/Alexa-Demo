const chat = document.getElementById("chat");
const box = document.getElementById("box");
const cardsEl = document.getElementById("cards");
const toolsEl = document.getElementById("tools");
let history = [];

function bubble(who, text) {
  const d = document.createElement("div");
  d.className = "msg " + who;
  d.innerHTML = (who === "alexa" ? "<b>Alexa+</b><br/>" : "<b>You</b><br/>") + escapeHtml(text);
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

function renderCards(cards){
  if(!cards || !cards.length) return;
  cardsEl.innerHTML = "";
  cards.forEach(c=>{
    const d=document.createElement("div");
    d.className="vcard";
    let inner="<h4>"+escapeHtml(c.title||c.type)+"</h4>";
    if(c.type==="media"){ inner+="<ul>"+c.items.map(i=>"<li>▶ "+escapeHtml(i)+"</li>").join("")+"</ul>"; }
    else { inner+="<pre>"+escapeHtml(JSON.stringify(c.detail||c.items||c,null,2)).slice(0,600)+"</pre>"; }
    d.innerHTML=inner;
    cardsEl.appendChild(d);
  });
}
function renderTools(tools){
  if(!tools || !tools.length){ toolsEl.innerHTML='<p class="muted">No tools called (chit-chat).</p>'; return; }
  toolsEl.innerHTML = tools.map(t=>'<span class="tool">🔧 '+escapeHtml(t)+"</span>").join(" ");
}

async function send(text){
  text = (text||box.value||"").trim();
  if(!text) return;
  box.value="";
  bubble("you", text);
  const kids = document.getElementById("kids").checked;
  try{
    const r = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},
      body: JSON.stringify({message:text, history, profile:{name:"Family",kids_mode:kids}})});
    const out = await r.json();
    bubble("alexa", out.reply);
    renderCards(out.cards);
    renderTools(out.tools_used);
    history.push({user:text, alexa:out.reply});
  }catch(e){ bubble("alexa","Backend not running. Start API on :8000. ("+e+")"); }
}

document.getElementById("send").onclick=()=>send();
box.addEventListener("keydown",e=>{if(e.key==="Enter")send();});
document.querySelectorAll(".chips button").forEach(b=>b.onclick=()=>send(b.dataset.q));

// Voice input (Web Speech API, Chrome)
document.getElementById("mic").onclick=()=>{
  const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ alert("Voice needs Chrome. Type instead."); return; }
  const rec=new SR(); rec.lang="en-US"; rec.start();
  rec.onresult=e=>{ box.value=e.results[0][0].transcript; send(); };
};

bubble("alexa","Hi! I'm Family Captain (simulated Alexa+). Try 'movie night with kids' - I'll check calendar, TV, front door and order snacks in one go.");

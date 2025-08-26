const API_URL = "https://xerodayai.netlify.app/.netlify/functions/proxy";
const STORAGE_KEY = "xerochat-sessions-v1";
const ACTIVE_KEY = "xerochat-active-v1";
const SETTINGS_KEY = "xerochat-settings-v1";

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const modelSelect = document.getElementById("modelSelect");
const newChatBtn = document.getElementById("newChatBtn");
const clearChatBtn = document.getElementById("clearChatBtn");
const exportBtn = document.getElementById("exportBtn");
const sessionsListEl = document.getElementById("sessionsList");
const sessionSearchEl = document.getElementById("sessionSearch");
const emptyStateTemplate = document.getElementById("emptyState");
const modelBadge = document.getElementById("modelBadge");
const sessionTitleEl = document.getElementById("sessionTitle");
const settingsBtn = document.getElementById("settingsBtn");

/* Settings UI elements */
const settingsModal = document.getElementById("settingsModal");
const settingsCloseBtn = document.getElementById("settingsCloseBtn");
const settingsCancelBtn = document.getElementById("settingsCancelBtn");
const settingsSaveBtn = document.getElementById("settingsSaveBtn");
const themeSelect = document.getElementById("themeSelect");
const typewriterToggle = document.getElementById("typewriterToggle");
const typeSpeedRange = document.getElementById("typeSpeedRange");
const bubbleWidthRange = document.getElementById("bubbleWidthRange");
const sidebarWidthRange = document.getElementById("sidebarWidthRange");
const userMdToggle = document.getElementById("userMdToggle");

let sessions = loadSessions();
let currentSessionId = localStorage.getItem(ACTIVE_KEY) || null;

/* Typewriter config */
let TYPEWRITER = true;
let TYPE_SPEED = 25;

/* Settings state */
const DEFAULT_SETTINGS = {
  theme: "system",
  typewriter: true,
  typeSpeed: 12,
  bubbleWidth: 100,
  sidebarWidth: 240,
  userMarkdown: false
};
let settings = loadSettings();

/* ---------- helpers ---------- */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function now() { return Date.now(); }
function fmtTime(ts) {
  const d = new Date(ts);
  const diff = Date.now() - ts;
  if (diff < 60_000) return "now";
  if (diff < 60 * 60_000) return `${Math.round(diff / 60_000)}m`;
  if (diff < 24 * 60 * 60_000) return `${Math.round(diff / (60*60_000))}h`;
  return d.toLocaleDateString();
}
function truncate(str, n=60){ if (!str) return ""; return str.length > n ? str.slice(0,n-1) + "…" : str; }
function saveSessions(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); }
function loadSessions(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
function saveSettings(){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
function loadSettings(){
  try { return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")); }
  catch { return { ...DEFAULT_SETTINGS }; }
}

/* ---------- Apply settings ---------- */
function applySettings(){
  const html = document.documentElement;
  if (settings.theme === "dark") html.setAttribute("data-theme", "dark");
  else if (settings.theme === "light") html.setAttribute("data-theme", "light");
  else html.setAttribute("data-theme", "dark");

  html.style.setProperty("--msg-max", `${settings.bubbleWidth}%`);
  html.style.setProperty("--sidebar-w", `${settings.sidebarWidth}px`);

  TYPEWRITER = !!settings.typewriter;
  TYPE_SPEED = Math.max(5, Math.min(60, Number(settings.typeSpeed) || DEFAULT_SETTINGS.typeSpeed));

  if (themeSelect) themeSelect.value = settings.theme;
  if (typewriterToggle) typewriterToggle.checked = !!settings.typewriter;
  if (typeSpeedRange) typeSpeedRange.value = TYPE_SPEED;
  if (bubbleWidthRange) bubbleWidthRange.value = settings.bubbleWidth;
  if (sidebarWidthRange) sidebarWidthRange.value = settings.sidebarWidth;
  if (userMdToggle) userMdToggle.checked = !!settings.userMarkdown;
}

/* ---------- session management ---------- */
function createSession(name){
  const s = { id: uid(), name: name || "New Conversation", model: modelSelect?.value || "openai/gpt-oss-20b", messages: [], preview: "", updatedAt: now() };
  sessions.unshift(s);
  saveSessions();
  setCurrentSession(s.id);
  renderSessionsList();
  renderChat(s);
  return s;
}
function setCurrentSession(id){
  currentSessionId = id;
  localStorage.setItem(ACTIVE_KEY, id);
  renderSessionsList();
}
function getCurrentSession(){ return sessions.find(s => s.id === currentSessionId); }
function renameSession(id, newName){
  const s = sessions.find(x => x.id === id); if(!s) return;
  s.name = newName || s.name; s.updatedAt = now(); saveSessions(); renderSessionsList(); renderChat(s);
}
function deleteSession(id){
  const idx = sessions.findIndex(s => s.id === id);
  if (idx === -1) return;
  sessions.splice(idx,1);
  if (sessions.length) currentSessionId = sessions[0].id; else currentSessionId = null;
  saveSessions();
  renderSessionsList();
  if (currentSessionId) renderChat(getCurrentSession()); else chatBox.innerHTML = emptyStateTemplate ? emptyStateTemplate.outerHTML : "";
}
function updateSessionPreview(id, previewText){
  const s = sessions.find(x => x.id === id); if(!s) return;
  s.preview = truncate(previewText, 80); s.updatedAt = now();
  sessions = [s, ...sessions.filter(x => x.id !== s.id)];
  saveSessions(); renderSessionsList();
}

/* ---------- render sessions list ---------- */
function renderSessionsList(filter=""){
  if (!sessionsListEl) return;
  sessionsListEl.innerHTML = "";
  const items = sessions
    .filter(s => !filter || s.name.toLowerCase().includes(filter.toLowerCase()) || (s.preview && s.preview.toLowerCase().includes(filter.toLowerCase())))
    .sort((a,b) => b.updatedAt - a.updatedAt);

  if (!items.length){ sessionsListEl.innerHTML = `<div class="session-empty">No chats yet. Click “New” to start.</div>`; return; }

  for (const s of items){
    const el = document.createElement("div");
    el.className = "session-item" + (s.id === currentSessionId ? " active" : "");
    el.tabIndex = 0;

    const avatar = document.createElement("div");
    avatar.className = "session-avatar";
    const initials = (s.name || "").split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase() || "C";
    avatar.textContent = initials;

    const body = document.createElement("div");
    body.className = "session-body";
    const title = document.createElement("div"); title.className = "session-title"; title.textContent = s.name || "New Conversation";
    const preview = document.createElement("div"); preview.className = "session-preview"; preview.textContent = s.preview || "No messages yet";
    const meta = document.createElement("div"); meta.className = "session-meta";
    const when = document.createElement("div"); when.className = "badge-time"; when.textContent = fmtTime(s.updatedAt || s.createdAt || Date.now());
    meta.appendChild(when);
    body.appendChild(title); body.appendChild(preview); body.appendChild(meta);

    const actions = document.createElement("div"); actions.className = "session-actions";
    const renameBtn = document.createElement("button"); renameBtn.title = "Rename"; renameBtn.innerHTML = "✎";
    renameBtn.addEventListener("click", (ev)=>{ ev.stopPropagation(); const newName = prompt("Rename chat", s.name) || s.name; renameSession(s.id, newName); });
    const delBtn = document.createElement("button"); delBtn.title = "Delete"; delBtn.innerHTML = "🗑";
    delBtn.addEventListener("click", (ev)=>{ ev.stopPropagation(); if(confirm("Delete this chat?")) deleteSession(s.id); });

    actions.appendChild(renameBtn); actions.appendChild(delBtn);

    el.appendChild(avatar); el.appendChild(body); el.appendChild(actions);

    el.addEventListener("click", () => { setCurrentSession(s.id); renderChat(s); });
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setCurrentSession(s.id); renderChat(s); } });

    sessionsListEl.appendChild(el);
  }
}

/* ---------- chat rendering ---------- */
function renderChat(session){
  chatBox.innerHTML = "";
  if (!session || !session.messages || session.messages.length === 0){
    if (emptyStateTemplate) chatBox.appendChild(emptyStateTemplate.cloneNode(true));
    sessionTitleEl.textContent = session?.name || "New Conversation";
    if (modelSelect) modelSelect.value = session?.model || modelSelect.value;
    updateModelBadge();
    return;
  }
  session.messages.forEach(m => appendMessage(m.role, m.content, false, true));
  sessionTitleEl.textContent = session.name || "Conversation";
  if (modelSelect) modelSelect.value = session.model || modelSelect.value;
  updateModelBadge();
}

function appendMessage(role, text="", isLoading=false, immediate=false){
  const msg = document.createElement("div");
  msg.className = `message ${role === "user" ? "user" : "assistant"}`;

  if (isLoading) {
    msg.innerHTML = `<span class="spinner"></span>`;
  } else {
    const container = document.createElement("div");
    if (role === "assistant" || (role === "user" && settings.userMarkdown)) {
      container.className = "md";
      if (immediate) {
        container.innerHTML = renderSafeHTML(text);
        msg.appendChild(container);
        enhanceCodeBlocks(container);
        typesetMath(container);
      } else {
        container.textContent = text;
        msg.appendChild(container);
      }
    } else {
      container.textContent = text;
      msg.appendChild(container);
    }
  }

  chatBox.appendChild(msg);
  window.requestAnimationFrame(()=> window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
  return msg;
}

/* ---------- Markdown, sanitize, math ---------- */
function configureMarked(){
  if (!window.marked) return;
  marked.setOptions({ gfm: true, breaks: false, headerIds: false, mangle: false });
}
function basicMarkdownFallback(md){
  let html = md.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  html = html.replace(/``````/g, (m,lang,code)=>`<pre><code class="language-${lang||'text'}">${code.replace(/</g,"&lt;")}</code></pre>`);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/^(#{1,6})\s*(.+)$/gm, (m,hs,txt)=>`<h${hs.length}>${txt}</h${hs.length}>`);
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, `<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>`);
  html = html.split(/\n{2,}/).map(para=>{
    if (/^<h\d|^<pre|^<ul|^<ol|^<blockquote|^<table/.test(para)) return para;
    return `<p>${para.replace(/\n/g,'<br/>')}</p>`;
  }).join("\n");
  return html;
}
function renderMarkdown(md){
  if (window.marked) return marked.parse(md || "");
  return basicMarkdownFallback(md || "");
}
function sanitizeHTML(dirty){
  if (window.DOMPurify) {
    return DOMPurify.sanitize(dirty, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: false,
      ALLOWED_ATTR: false,
      FORBID_TAGS: ['style','iframe','object','embed','script','noscript'],
      FORBID_ATTR: ['onerror','onload','onclick','onfocus','onmouseover']
    });
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(dirty, 'text/html');
  const forbid = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','NOSCRIPT']);
  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, null, false);
  const toRemove = [];
  while (walker.nextNode()){
    const el = walker.currentNode;
    if (forbid.has(el.tagName)) { toRemove.push(el); continue; }
    [...el.attributes].forEach(a=>{
      if (/^on/i.test(a.name)) el.removeAttribute(a.name);
      if (/(^|:)\s*javascript\s*:/i.test(a.value)) el.removeAttribute(a.name);
    });
  }
  toRemove.forEach(n=>n.remove());
  return doc.body.innerHTML;
}
function renderSafeHTML(mdText){
  const raw = renderMarkdown(mdText);
  return sanitizeHTML(raw);
}
function typesetMath(scopeEl){
  try {
    if (window.MathJax && typeof MathJax.typesetPromise === "function") {
      MathJax.typesetPromise([scopeEl]).catch(()=>{});
    }
  } catch {}
}
function enhanceCodeBlocks(scopeEl){
  const pres = scopeEl.querySelectorAll('pre');
  pres.forEach(pre=>{
    if (pre.querySelector('.copy-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.textContent = 'Copy';
    pre.appendChild(btn);
  });
}
chatBox.addEventListener('click', async (e)=>{
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;
  const pre = btn.closest('pre');
  const code = pre?.querySelector('code')?.innerText || '';
  try {
    await navigator.clipboard.writeText(code);
    const old = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(()=>{ btn.textContent = old; }, 1200);
  } catch {
    btn.textContent = 'Failed';
    setTimeout(()=>{ btn.textContent = 'Copy'; }, 1200);
  }
});

/* ---------- think handling & typewriter ---------- */
function extractThink(text){
  if (!text) return [];
  const m = text.match(/<think>[\s\S]*?<\/think>/gi);
  return m ? m.map(t => t.replace(/<\/?think>/gi,"").trim()) : [];
}
function cleanResponse(text){ return (text || "").replace(/<think>[\s\S]*?<\/think>/gi,"").trim(); }

function typeText(el, text, speed = TYPE_SPEED){
  if(!TYPEWRITER){ el.textContent = text; return Promise.resolve(); }
  el.textContent = "";
  return new Promise(resolve=>{
    let i = 0;
    const id = setInterval(()=>{
      el.textContent += text[i++] || "";
      window.scrollTo({ top: document.body.scrollHeight });
      if(i >= text.length){ clearInterval(id); resolve(); }
    }, speed);
  });
}
async function renderAssistantMessage(msgEl, text){
  msgEl.innerHTML = "";
  const container = document.createElement("div");
  container.className = "md";
  msgEl.appendChild(container);

  await typeText(container, text, TYPE_SPEED);
  container.innerHTML = renderSafeHTML(text);
  enhanceCodeBlocks(container);
  typesetMath(container);
  window.scrollTo({ top: document.body.scrollHeight });
}

/* ---------- send to proxy ---------- */
async function sendMessage(){
  const session = getCurrentSession();
  if(!session){ createSession(); return; }
  const message = input.value.trim();
  if(!message) return;

  appendMessage("user", message);
  session.messages.push({ role: "user", content: message });
  updateSessionPreview(session.id, message);
  saveSessions();

  input.value = "";
  const loadingEl = appendMessage("assistant", "", true);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: session.model || modelSelect.value, messages: session.messages })
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    const rawReply = data?.choices?.[0]?.message?.content || data?.result || (typeof data === "string" ? data : null) || "(No response)";
    const thinks = extractThink(rawReply);
    const visible = cleanResponse(rawReply);

    loadingEl.innerHTML = "";
    await renderAssistantMessage(loadingEl, visible);

    session.messages.push({ role: "assistant", content: visible });
    updateSessionPreview(session.id, visible);
    saveSessions();

    if (thinks.length) console.log("AI THINK:", thinks.join("\n\n---\n\n"));
  } catch (err) {
    loadingEl.textContent = "❌ Error: " + (err.message || err);
  }
}

/* ---------- UI hooks ---------- */
function updateModelBadge(){ if (!modelBadge || !modelSelect) return; modelBadge.textContent = modelSelect.value.split("/").pop(); }

sendBtn?.addEventListener("click", sendMessage);
input?.addEventListener("keydown", (e)=>{ if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); sendMessage(); }});

newChatBtn?.addEventListener("click", ()=>{ createSession("New Conversation"); input.focus(); });
clearChatBtn?.addEventListener("click", ()=>{ const s = getCurrentSession(); if(!s) return; if(confirm("Clear messages in this chat?")) { s.messages = []; s.preview = ""; saveSessions(); renderChat(s); renderSessionsList(); }});
exportBtn?.addEventListener("click", ()=>{ const s = getCurrentSession(); if(!s) return; const blob = new Blob([JSON.stringify(s, null, 2)], {type:"application/json"}); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${(s.name||"chat").replace(/[^\w-]+/g,"_")}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); });

sessionSearchEl?.addEventListener("input", (e)=>{ renderSessionsList(e.target.value); });

modelSelect?.addEventListener("change", ()=>{ const s = getCurrentSession(); if(!s) return; s.model = modelSelect.value; s.updatedAt = now(); saveSessions(); renderSessionsList(); updateModelBadge(); });

document.addEventListener("click", (e)=>{
  if (e.target && e.target.classList && e.target.classList.contains("chip")){
    const t = e.target.textContent || "";
    input.value = t; input.focus(); sendMessage();
  }
});

/* ---------- Settings ---------- */
function openSettings(){ settingsModal?.classList.remove("hidden"); }
function closeSettings(){ settingsModal?.classList.add("hidden"); }
settingsBtn?.addEventListener("click", openSettings);
settingsCloseBtn?.addEventListener("click", closeSettings);
settingsCancelBtn?.addEventListener("click", closeSettings);
settingsModal?.addEventListener("click", (e)=>{ if (e.target?.dataset?.close) closeSettings(); });
document.addEventListener("keydown", (e)=>{ if (e.key === "Escape" && settingsModal && !settingsModal.classList.contains("hidden")) closeSettings(); });

function bindSettingsUI(){
  if (!themeSelect) return;
  themeSelect.addEventListener("change", ()=>{ settings.theme = themeSelect.value; saveSettings(); applySettings(); });
  typewriterToggle?.addEventListener("change", ()=>{ settings.typewriter = !!typewriterToggle.checked; saveSettings(); applySettings(); });
  typeSpeedRange?.addEventListener("input", ()=>{ settings.typeSpeed = Number(typeSpeedRange.value || DEFAULT_SETTINGS.typeSpeed); saveSettings(); applySettings(); });
  bubbleWidthRange?.addEventListener("input", ()=>{ settings.bubbleWidth = Number(bubbleWidthRange.value || DEFAULT_SETTINGS.bubbleWidth); saveSettings(); applySettings(); });
  sidebarWidthRange?.addEventListener("input", ()=>{ settings.sidebarWidth = Number(sidebarWidthRange.value || DEFAULT_SETTINGS.sidebarWidth); saveSettings(); applySettings(); });
  userMdToggle?.addEventListener("change", ()=>{ settings.userMarkdown = !!userMdToggle.checked; saveSettings(); });
  settingsSaveBtn?.addEventListener("click", closeSettings);
}

(function init(){
  configureMarked();
  applySettings();
  bindSettingsUI();

  sessions = loadSessions();
  if (!sessions || !sessions.length) createSession("New Conversation");
  else {
    if (!currentSessionId || !sessions.find(s=>s.id===currentSessionId)) currentSessionId = sessions[0].id;
    renderSessionsList();
    renderChat(getCurrentSession());
  }
  updateModelBadge();
})();
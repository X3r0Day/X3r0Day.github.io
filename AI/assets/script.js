const API_URL = "https://xerodayai.netlify.app/.netlify/functions/proxy";
const chatBox = document.getElementById("chatBox");
const input = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const modelSelect = document.getElementById("modelSelect");


const RENDER_MARKDOWN = true;    // enable Markdown rendering
const TYPEWRITER = false;        // set to false for instant render (fast)
const TYPE_SPEED = 8;            // used only if TYPEWRITER === true
const TYPE_CHUNK = 12;           // used only if TYPEWRITER === true

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}

async function ensureMarkdown() {
  if (window.marked && window.DOMPurify) return;
  await loadScript("https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js");
  await loadScript("https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js");
  if (window.marked) {
    window.marked.setOptions({
      gfm: true,
      breaks: true,
      headerIds: false
    });
  }
}

async function ensureMath() {
  if (window.MathJax && window.MathJax.typesetPromise) return;
  // Configure MathJax
  window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$','$$'], ['\\[','\\]']]
    },
    options: {
      skipHtmlTags: ['script','noscript','style','textarea','pre','code']
    }
  };
  await loadScript("https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js");
}

async function renderMarkdownTo(el, text) {
  try {
    await ensureMarkdown();
    const html = window.marked.parse(text || "");
    const safe = window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
    el.innerHTML = safe;
    await ensureMath();
    await window.MathJax.typesetPromise([el]);
  } catch {
    // Fallback: plain text if something fails
    el.textContent = text || "";
  }
}


function appendMessage(sender, text, isLoading = false) {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;

  if (isLoading) {
    msg.innerHTML = `<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>`;
  } else {
    msg.textContent = text;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

function cleanResponse(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

function typeText(element, text, speed = TYPE_SPEED) {
  if (RENDER_MARKDOWN && !TYPEWRITER) {
    renderMarkdownTo(element, text);
    return;
  }

  let i = 0;
  const n = (text || "").length;
  const chunk = Math.max(TYPE_CHUNK, Math.ceil(n / 500));
  element.textContent = "";

  const timer = setInterval(() => {
    const next = text.slice(i, i + chunk);
    element.textContent += next;
    i += next.length;
    chatBox.scrollTop = chatBox.scrollHeight;

    if (i >= n) {
      clearInterval(timer);
      if (RENDER_MARKDOWN) renderMarkdownTo(element, text);
    }
  }, speed);
}

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  appendMessage("user", message);
  input.value = "";
  autoResize();
  const loadingMsg = appendMessage("assistant", "", true);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, model: modelSelect.value })
    });

    const data = await res.json();
    const reply = cleanResponse(data.choices?.[0]?.message?.content || "(No response)");

    loadingMsg.innerHTML = "";
    typeText(loadingMsg, reply);
  } catch (err) {
    loadingMsg.innerHTML = "❌ Error: " + err.message;
  }
}

const newChatBtn = document.getElementById("newChatBtn");
const clearChatBtn = document.getElementById("clearChatBtn");
const exportBtn = document.getElementById("exportBtn");
const settingsBtn = document.getElementById("settingsBtn");
const modelBadge = document.getElementById("modelBadge");
const themeToggle = document.getElementById("themeToggle");
const compactToggle = document.getElementById("compactToggle");
const emptyState = document.getElementById("emptyState");

const EMPTY_HTML = emptyState ? emptyState.outerHTML : "";

function updateModelBadge() {
  if (!modelBadge || !modelSelect) return;
  const label =
    modelSelect.selectedOptions[0]?.textContent.trim() || modelSelect.value;
  modelBadge.textContent = label;
}

function autoResize() {
  if (!input || input.tagName !== "TEXTAREA") return;
  input.style.height = "auto";
  input.style.height = `${input.scrollHeight}px`;
}

function exportChat() {
  const items = [...chatBox.querySelectorAll(".message")].map((el) => ({
    role: el.classList.contains("user") ? "user" : "assistant",
    content: el.textContent || ""
  }));

  const data = {
    model: modelSelect?.value || "",
    exportedAt: new Date().toISOString(),
    messages: items
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const first = (items.find(m => m.role === "user")?.content || "chat")
    .slice(0, 40)
    .replace(/[^\w\-]+/g, "-");
  a.href = url;
  a.download = `xerochat-${first || "session"}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

function openSettings() {
  const dlg = document.createElement("dialog");
  dlg.style.padding = "0";
  dlg.style.border = "1px solid var(--border)";
  dlg.style.borderRadius = "12px";
  dlg.style.background = "var(--bg-chat)";
  dlg.style.color = "var(--text-primary)";
  dlg.style.maxWidth = "420px";
  dlg.style.width = "min(92vw, 420px)";
  dlg.innerHTML = `
    <form method="dialog" style="padding:16px;display:grid;gap:12px">
      <h3 style="margin:0 0 6px 0;font:600 16px/1.2 var(--font);">Settings</h3>
      <label style="display:flex;align-items:center;gap:10px;">
        <input id="dlgTheme" type="checkbox" ${themeToggle?.checked ? "checked" : ""}/>
        <span>Light theme</span>
      </label>
      <label style="display:flex;align-items:center;gap:10px;">
        <input id="dlgCompact" type="checkbox" ${compactToggle?.checked ? "checked" : ""}/>
        <span>Compact messages</span>
      </label>
      <menu style="display:flex;gap:8px;justify-content:flex-end;margin:8px 0 0;">
        <button value="cancel" style="border:1px solid var(--border);background:var(--bg-input);color:var(--text-secondary);border-radius:8px;padding:8px 12px;">Close</button>
      </menu>
    </form>`;
  document.body.appendChild(dlg);

  dlg.addEventListener("close", () => {
    const dlgTheme = dlg.querySelector("#dlgTheme");
    const dlgCompact = dlg.querySelector("#dlgCompact");
    if (themeToggle && dlgTheme) themeToggle.checked = dlgTheme.checked;
    if (compactToggle && dlgCompact) compactToggle.checked = dlgCompact.checked;
    dlg.remove();
  });

  dlg.showModal();
}

sendBtn?.addEventListener("click", sendMessage);

input?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    if (input.tagName === "TEXTAREA" && e.shiftKey) return;
    e.preventDefault();
    sendMessage();
  }
});

modelSelect?.addEventListener("change", () => {
  updateModelBadge();
});

newChatBtn?.addEventListener("click", () => {
  chatBox.innerHTML = EMPTY_HTML || "";
  input.value = "";
  autoResize();
});

clearChatBtn?.addEventListener("click", () => {
  chatBox.innerHTML = EMPTY_HTML || "";
});

exportBtn?.addEventListener("click", exportChat);

settingsBtn?.addEventListener("click", openSettings);

document.addEventListener("click", (e) => {
  const t = e.target;
  if (t && t.classList && t.classList.contains("chip")) {
    const txt = t.textContent?.trim() || "";
    input.value = txt;
    autoResize();
    sendMessage();
  }
});

updateModelBadge();
autoResize();
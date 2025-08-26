const API_URL = "https://xerodayai.netlify.app/.netlify/functions/proxy";
const STORAGE_KEY = "xerochat-history";

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const modelSelect = document.getElementById("modelSelect");

let conversation = loadHistory();

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversation));
}

function appendMessage(sender, text, isLoading = false) {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.textContent = isLoading ? "..." : text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

function cleanResponse(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  appendMessage("user", message);
  conversation.push({ role: "user", content: message });
  saveHistory();

  input.value = "";
  const loadingMsg = appendMessage("assistant", "", true);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelSelect.value,
        messages: conversation
      })
    });

    const data = await res.json();
    const reply = cleanResponse(data.choices?.[0]?.message?.content || "(No response)");

    loadingMsg.textContent = reply;
    conversation.push({ role: "assistant", content: reply });
    saveHistory();
  } catch (err) {
    loadingMsg.textContent = "❌ Error: " + err.message;
  }
}

sendBtn?.addEventListener("click", sendMessage);

input?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// clear chat
document.getElementById("clearChatBtn")?.addEventListener("click", () => {
  conversation = [];
  saveHistory();
  chatBox.innerHTML = "";
});
const messageInput = document.getElementById("messageInput");
const chatForm = document.getElementById("chatForm");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const historyList = document.getElementById("historyList");
const newChatButton = document.getElementById("newChat");
const themeToggle = document.getElementById("themeToggle");
const menuButton = document.getElementById("menuButton");
const sidebar = document.getElementById("sidebar");
const sendButton = document.getElementById("sendButton");

let conversations =
  JSON.parse(localStorage.getItem("zack_conversations")) || [];

let currentConversation = [];

function saveConversations() {
  localStorage.setItem(
    "zack_conversations",
    JSON.stringify(conversations)
  );
}

function renderHistory() {
  historyList.innerHTML = "";

  conversations.forEach((conversation, index) => {
    const button = document.createElement("button");

    button.className = "history-item";

    button.textContent =
      conversation.title || `محادثة ${index + 1}`;

    button.onclick = () => loadConversation(index);

    historyList.appendChild(button);
  });
}

function loadConversation(index) {
  const conversation = conversations[index];

  currentConversation = conversation.messages || [];

  messages.innerHTML = "";

  welcome.style.display = "none";

  currentConversation.forEach((message) => {
    addMessageToScreen(message.role, message.content);
  });

  sidebar.classList.remove("open");
}

function addMessageToScreen(role, content) {
  const message = document.createElement("div");

  message.className = `message ${role}`;

  const inner = document.createElement("div");
  inner.className = "message-inner";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "أنت" : "Z";

  const text = document.createElement("div");
  text.className = "message-content";
  text.textContent = content;

  inner.appendChild(avatar);
  inner.appendChild(text);

  message.appendChild(inner);
  messages.appendChild(message);

  messages.parentElement.scrollTop =
    messages.parentElement.scrollHeight;
}

function generateDemoResponse(input) {
  const text = input.toLowerCase();

  if (
    text.includes("html") ||
    text.includes("كود") ||
    text.includes("برمجة")
  ) {
    return `بالتأكيد! أستطيع مساعدتك في البرمجة.

مثال بسيط:

<h1>مرحبًا من Zack</h1>

يمكنك أن تطلب مني إنشاء HTML أو CSS أو JavaScript أو شرح أي جزء من الكود.

ملاحظة: هذه النسخة الحالية من Zack هي واجهة تجريبية. لإجابات الذكاء الاصطناعي الحقيقية، يجب ربطها بخادم API.`;
  }

  if (text.includes("ذكاء اصطناعي")) {
    return `الذكاء الاصطناعي هو مجموعة من التقنيات التي تسمح للبرامج بتنفيذ مهام تحتاج عادةً إلى قدر من الذكاء البشري، مثل فهم اللغة وتحليل المعلومات وتوليد النصوص.

أنا Zack في هذه النسخة التجريبية أستخدم ردودًا محلية بسيطة.`;
  }

  if (text.includes("موقع")) {
    return `فكرة جميلة! يمكنك تطوير Zack إلى منصة ذكاء اصطناعي كاملة تحتوي على:

• محادثات متعددة
• تسجيل دخول للمستخدمين
• حفظ المحادثات
• رفع الملفات
• توليد الصور
• دعم عدة نماذج ذكاء اصطناعي
• وضع ليلي
• تطبيق للهاتف

ويمكنني مساعدتك في بناء كل جزء منها.`;
  }

  return `مرحبًا! أنا Zack 👋

استلمت رسالتك:
"${input}"

هذه نسخة تجريبية من الواجهة، لذلك الردود الحالية محلية وليست متصلة بنموذج ذكاء اصطناعي حقيقي.

يمكنك ربط Zack لاحقًا بـ API للذكاء الاصطناعي للحصول على إجابات حقيقية.`;
}

async function sendMessage(text) {
  text = text.trim();

  if (!text) return;

  welcome.style.display = "none";

  addMessageToScreen("user", text);

  currentConversation.push({
    role: "user",
    content: text
  });

  messageInput.value = "";
  messageInput.style.height = "auto";

  sendButton.disabled = true;

  await new Promise((resolve) => setTimeout(resolve, 500));

  const response = generateDemoResponse(text);

  addMessageToScreen("assistant", response);

  currentConversation.push({
    role: "assistant",
    content: response
  });

  saveCurrentConversation();

  sendButton.disabled = false;
  messageInput.focus();
}

function saveCurrentConversation() {
  if (currentConversation.length === 0) return;

  const firstUserMessage = currentConversation.find(
    (message) => message.role === "user"
  );

  const title = firstUserMessage
    ? firstUserMessage.content.slice(0, 35)
    : "محادثة جديدة";

  const existingIndex = conversations.findIndex(
    (conversation) =>
      conversation.messages === currentConversation
  );

  if (existingIndex >= 0) {
    conversations[existingIndex].messages =
      currentConversation;
  } else {
    conversations.unshift({
      title,
      messages: currentConversation
    });
  }

  saveConversations();
  renderHistory();
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(messageInput.value);
});

messageInput.addEventListener("input", () => {
  messageInput.style.height = "auto";
  messageInput.style.height =
    Math.min(messageInput.scrollHeight, 180) + "px";
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

newChatButton.addEventListener("click", () => {
  currentConversation = [];

  messages.innerHTML = "";

  welcome.style.display = "block";

  messageInput.value = "";
  messageInput.focus();

  sidebar.classList.remove("open");
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const darkMode = document.body.classList.contains("dark");

  localStorage.setItem("zack_dark_mode", darkMode);
});

menuButton.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

document.querySelectorAll(".suggestions button").forEach((button) => {
  button.addEventListener("click", () => {
    sendMessage(button.dataset.prompt);
  });
});

if (localStorage.getItem("zack_dark_mode") === "true") {
  document.body.classList.add("dark");
}

renderHistory();

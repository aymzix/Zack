
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


/* =========================
   حفظ المحادثات
========================= */

function saveConversations() {
  localStorage.setItem(
    "zack_conversations",
    JSON.stringify(conversations)
  );
}


/* =========================
   عرض سجل المحادثات
========================= */

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


/* =========================
   تحميل محادثة
========================= */

function loadConversation(index) {
  const conversation = conversations[index];

  currentConversation = conversation.messages || [];

  messages.innerHTML = "";

  welcome.style.display = "none";

  currentConversation.forEach((message) => {
    addMessageToScreen(
      message.role,
      message.content
    );
  });

  sidebar.classList.remove("open");
}


/* =========================
   إضافة رسالة إلى الشاشة
========================= */

function addMessageToScreen(role, content) {
  const message = document.createElement("div");

  message.className = `message ${role}`;

  const inner = document.createElement("div");
  inner.className = "message-inner";

  const avatar = document.createElement("div");
  avatar.className = "avatar";

  avatar.textContent =
    role === "user" ? "أنت" : "Z";

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


/* =========================
   إرسال الرسالة إلى NVIDIA
========================= */

async function sendMessage(text) {
  text = text.trim();

  if (!text) return;

  welcome.style.display = "none";

  addMessageToScreen(
    "user",
    text
  );

  currentConversation.push({
    role: "user",
    content: text
  });

  messageInput.value = "";

  messageInput.style.height = "auto";

  sendButton.disabled = true;


  /* رسالة مؤقتة */

  addMessageToScreen(
    "assistant",
    "جاري التفكير..."
  );


  try {

    const response = await fetch(
      "/api/chat",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          message: text
        })
      }
    );


    const data = await response.json();


    /* إزالة رسالة جاري التفكير */

    const assistantMessages =
      messages.querySelectorAll(
        ".message.assistant"
      );

    if (assistantMessages.length > 0) {

      assistantMessages[
        assistantMessages.length - 1
      ].remove();

    }


    /* التحقق من الخطأ */

    if (!response.ok) {

      throw new Error(
        data.error ||
        "حدث خطأ في الخادم"
      );

    }


    const reply =
      data.reply ||
      "لم يصل رد من NVIDIA.";


    /* عرض الرد */

    addMessageToScreen(
      "assistant",
      reply
    );


    /* حفظ الرد */

    currentConversation.push({
      role: "assistant",
      content: reply
    });


    saveCurrentConversation();


  } catch (error) {

    console.error(
      "Zack Error:",
      error
    );


    /* إزالة جاري التفكير */

    const assistantMessages =
      messages.querySelectorAll(
        ".message.assistant"
      );

    if (assistantMessages.length > 0) {

      assistantMessages[
        assistantMessages.length - 1
      ].remove();

    }


    const errorMessage =
      "حدث خطأ أثناء الاتصال بـ NVIDIA API.\n\n" +
      "تأكد من:\n" +
      "1. تشغيل server.js\n" +
      "2. وجود NVIDIA_API_KEY في ملف .env\n" +
      "3. صحة مفتاح NVIDIA API";


    addMessageToScreen(
      "assistant",
      errorMessage
    );


    currentConversation.push({
      role: "assistant",
      content: errorMessage
    });


    saveCurrentConversation();


  } finally {

    sendButton.disabled = false;

    messageInput.focus();

  }
}


/* =========================
   حفظ المحادثة الحالية
========================= */

function saveCurrentConversation() {

  if (
    currentConversation.length === 0
  ) {
    return;
  }


  const firstUserMessage =
    currentConversation.find(
      (message) =>
        message.role === "user"
    );


  const title =
    firstUserMessage
      ? firstUserMessage.content.slice(
          0,
          35
        )
      : "محادثة جديدة";


  /*
   * إذا كانت محادثة جديدة
   */

  if (
    conversations.length === 0 ||
    conversations[0].messages !==
      currentConversation
  ) {

    conversations.unshift({
      title: title,
      messages: currentConversation
    });

  } else {

    conversations[0].messages =
      currentConversation;

  }


  saveConversations();

  renderHistory();
}


/* =========================
   إرسال النموذج
========================= */

chatForm.addEventListener(
  "submit",
  (event) => {

    event.preventDefault();

    sendMessage(
      messageInput.value
    );

  }
);


/* =========================
   تغيير ارتفاع مربع الكتابة
========================= */

messageInput.addEventListener(
  "input",
  () => {

    messageInput.style.height =
      "auto";

    messageInput.style.height =
      Math.min(
        messageInput.scrollHeight,
        180
      ) + "px";

  }
);


/* =========================
   زر Enter
========================= */

messageInput.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      chatForm.requestSubmit();

    }

  }
);


/* =========================
   محادثة جديدة
========================= */

newChatButton.addEventListener(
  "click",
  () => {

    currentConversation = [];

    messages.innerHTML = "";

    welcome.style.display =
      "block";

    messageInput.value = "";

    messageInput.style.height =
      "auto";

    messageInput.focus();

    sidebar.classList.remove(
      "open"
    );

  }
);


/* =========================
   الوضع الليلي
========================= */

themeToggle.addEventListener(
  "click",
  () => {

    document.body.classList.toggle(
      "dark"
    );

    const darkMode =
      document.body.classList.contains(
        "dark"
      );

    localStorage.setItem(
      "zack_dark_mode",
      darkMode
    );

  }
);


/* =========================
   القائمة الجانبية
========================= */

menuButton.addEventListener(
  "click",
  () => {

    sidebar.classList.toggle(
      "open"
    );

  }
);


/* =========================
   أزرار الاقتراحات
========================= */

document
  .querySelectorAll(
    ".suggestions button"
  )
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        sendMessage(
          button.dataset.prompt
        );

      }
    );

  });


/* =========================
   استعادة الوضع الليلي
========================= */

if (
  localStorage.getItem(
    "zack_dark_mode"
  ) === "true"
) {

  document.body.classList.add(
    "dark"
  );

}


/* =========================
   تشغيل سجل المحادثات
========================= */

renderHistory();

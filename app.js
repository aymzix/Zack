const messageInput = document.getElementById("messageInput");
const chatForm = document.getElementById("chatForm");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const historyList = document.getElementById("historyList");
const newChatButton = document.getElementById("newChatButton");
const themeToggle = document.getElementById("themeToggle");
const menuButton = document.getElementById("menuButton");
const sidebar = document.getElementById("sidebar");
const sendButton = document.getElementById("sendButton");

const STORAGE_KEY = "zack_conversations";

let currentConversation = [];


// =========================
// الرسائل
// =========================

function addMessageToScreen(role, content) {
  const message = document.createElement("div");

  message.className = `message ${role}`;

  const contentElement = document.createElement("div");

  contentElement.className = "message-content";

  contentElement.textContent = content;

  message.appendChild(contentElement);

  messages.appendChild(message);

  messages.scrollTop = messages.scrollHeight;
}


// =========================
// حفظ المحادثات
// =========================

function saveCurrentConversation() {
  if (currentConversation.length === 0) {
    return;
  }

  let conversations = [];

  try {
    conversations =
      JSON.parse(
        localStorage.getItem(STORAGE_KEY)
      ) || [];
  } catch {
    conversations = [];
  }

  const conversation = {
    id: Date.now(),
    messages: currentConversation,
    updatedAt: new Date().toISOString()
  };

  conversations.unshift(conversation);

  conversations =
    conversations.slice(0, 50);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(conversations)
  );

  renderHistory();
}


// =========================
// عرض سجل المحادثات
// =========================

function renderHistory() {
  if (!historyList) return;

  historyList.innerHTML = "";

  let conversations = [];

  try {
    conversations =
      JSON.parse(
        localStorage.getItem(STORAGE_KEY)
      ) || [];
  } catch {
    conversations = [];
  }

  conversations.forEach((conversation) => {
    if (
      !conversation.messages ||
      conversation.messages.length === 0
    ) {
      return;
    }

    const firstUserMessage =
      conversation.messages.find(
        (message) =>
          message.role === "user"
      );

    const button =
      document.createElement("button");

    button.className =
      "history-item";

    button.textContent =
      firstUserMessage?.content ||
      "محادثة جديدة";

    button.addEventListener(
      "click",
      () => {
        loadConversation(
          conversation
        );
      }
    );

    historyList.appendChild(button);
  });
}


// =========================
// تحميل محادثة
// =========================

function loadConversation(conversation) {
  currentConversation =
    [...conversation.messages];

  messages.innerHTML = "";

  if (welcome) {
    welcome.style.display = "none";
  }

  currentConversation.forEach(
    (message) => {
      addMessageToScreen(
        message.role,
        message.content
      );
    }
  );

  if (sidebar) {
    sidebar.classList.remove("open");
  }
}


// =========================
// محادثة جديدة
// =========================

function startNewChat() {
  currentConversation = [];

  messages.innerHTML = "";

  if (welcome) {
    welcome.style.display = "flex";
  }

  if (messageInput) {
    messageInput.value = "";
    messageInput.focus();
  }

  if (sidebar) {
    sidebar.classList.remove("open");
  }
}


// =========================
// إرسال الرسالة إلى NVIDIA
// =========================

async function sendMessage(text) {
  text = text.trim();

  if (!text) {
    return;
  }

  if (welcome) {
    welcome.style.display = "none";
  }

  addMessageToScreen(
    "user",
    text
  );

  currentConversation.push({
    role: "user",
    content: text
  });

  if (messageInput) {
    messageInput.value = "";
    messageInput.style.height = "auto";
  }

  if (sendButton) {
    sendButton.disabled = true;
  }

  addMessageToScreen(
    "assistant",
    "جاري التفكير..."
  );

  try {
    const response =
      await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          message: text
        })
      });

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    // حذف رسالة "جاري التفكير..."
    const assistantMessages =
      messages.querySelectorAll(
        ".message.assistant"
      );

    if (
      assistantMessages.length > 0
    ) {
      assistantMessages[
        assistantMessages.length - 1
      ].remove();
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
        `خطأ من الخادم (${response.status})`
      );
    }

    const reply =
      data.reply ||
      "لم يصل رد من NVIDIA.";

    addMessageToScreen(
      "assistant",
      reply
    );

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

    // حذف رسالة "جاري التفكير..."
    const assistantMessages =
      messages.querySelectorAll(
        ".message.assistant"
      );

    if (
      assistantMessages.length > 0
    ) {
      assistantMessages[
        assistantMessages.length - 1
      ].remove();
    }

    const errorMessage =
      "تعذر الاتصال بالخادم.\n\n" +
      error.message;

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
    if (sendButton) {
      sendButton.disabled = false;
    }

    if (messageInput) {
      messageInput.focus();
    }
  }
}


// =========================
// نموذج إرسال الرسالة
// =========================

if (chatForm) {
  chatForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const text =
        messageInput.value;

      await sendMessage(text);
    }
  );
}


// =========================
// Enter لإرسال الرسالة
// Shift + Enter لسطر جديد
// =========================

if (messageInput) {
  messageInput.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        chatForm?.requestSubmit();
      }
    }
  );

  messageInput.addEventListener(
    "input",
    () => {
      messageInput.style.height =
        "auto";

      messageInput.style.height =
        Math.min(
          messageInput.scrollHeight,
          200
        ) + "px";
    }
  );
}


// =========================
// زر محادثة جديدة
// =========================

if (newChatButton) {
  newChatButton.addEventListener(
    "click",
    startNewChat
  );
}


// =========================
// الوضع الليلي
// =========================

if (themeToggle) {
  themeToggle.addEventListener(
    "click",
    () => {
      document.body.classList.toggle(
        "dark"
      );

      const isDark =
        document.body.classList.contains(
          "dark"
        );

      localStorage.setItem(
        "zack_dark_mode",
        isDark ? "true" : "false"
      );
    }
  );
}


// =========================
// فتح القائمة في الهاتف
// =========================

if (menuButton) {
  menuButton.addEventListener(
    "click",
    () => {
      sidebar?.classList.toggle(
        "open"
      );
    }
  );
}


// =========================
// الاقتراحات
// =========================

document
  .querySelectorAll(
    ".suggestion"
  )
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const text =
          button.textContent.trim();

        if (messageInput) {
          messageInput.value = text;

          messageInput.focus();

          messageInput.dispatchEvent(
            new Event("input")
          );
        }
      }
    );
  });


// =========================
// تحميل الوضع الليلي
// =========================

const savedDarkMode =
  localStorage.getItem(
    "zack_dark_mode"
  );

if (savedDarkMode === "true") {
  document.body.classList.add(
    "dark"
  );
}


// =========================
// تحميل السجل عند فتح الموقع
// =========================

renderHistory();

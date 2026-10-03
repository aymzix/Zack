const messageInput =
  document.getElementById("messageInput");

const chatForm =
  document.getElementById("chatForm");

const messages =
  document.getElementById("messages");

const welcome =
  document.getElementById("welcome");

const historyList =
  document.getElementById("historyList");

const newChatButton =
  document.getElementById("newChat");

const themeToggle =
  document.getElementById("themeToggle");

const menuButton =
  document.getElementById("menuButton");

const sidebar =
  document.getElementById("sidebar");

const sendButton =
  document.getElementById("sendButton");

const imageButton =
  document.getElementById("imageButton");

const imageMode =
  document.getElementById("imageMode");

const STORAGE_KEY =
  "zack_conversations";

let currentConversation = [];

let imageGenerationMode = false;


// ============================
// إضافة رسالة نصية
// ============================

function addMessageToScreen(
  role,
  content
) {
  const message =
    document.createElement("div");

  message.className =
    `message ${role}`;

  const inner =
    document.createElement("div");

  inner.className =
    "message-inner";

  const avatar =
    document.createElement("div");

  avatar.className =
    "avatar";

  avatar.textContent =
    role === "user"
      ? "أ"
      : "Z";

  const contentElement =
    document.createElement("div");

  contentElement.className =
    "message-content";

  contentElement.textContent =
    content;

  inner.appendChild(avatar);
  inner.appendChild(contentElement);

  message.appendChild(inner);

  messages.appendChild(message);

  messages.scrollTop =
    messages.scrollHeight;
}


// ============================
// إضافة صورة
// ============================

function addImageToScreen(
  imageUrl
) {
  const message =
    document.createElement("div");

  message.className =
    "message assistant";

  const inner =
    document.createElement("div");

  inner.className =
    "message-inner";

  const avatar =
    document.createElement("div");

  avatar.className =
    "avatar";

  avatar.textContent =
    "Z";

  const content =
    document.createElement("div");

  content.className =
    "message-content image-message";

  const image =
    document.createElement("img");

  image.src =
    imageUrl;

  image.alt =
    "صورة تم إنشاؤها بواسطة Zack";

  image.className =
    "generated-image";

  const download =
    document.createElement("a");

  download.href =
    imageUrl;

  download.download =
    "zack-image.png";

  download.textContent =
    "⬇ تنزيل الصورة";

  download.className =
    "download-image";

  content.appendChild(image);
  content.appendChild(download);

  inner.appendChild(avatar);
  inner.appendChild(content);

  message.appendChild(inner);

  messages.appendChild(message);

  messages.scrollTop =
    messages.scrollHeight;
}


// ============================
// حفظ المحادثة
// ============================

function saveCurrentConversation() {

  if (
    currentConversation.length === 0
  ) {
    return;
  }

  let conversations = [];

  try {

    conversations =
      JSON.parse(
        localStorage.getItem(
          STORAGE_KEY
        )
      ) || [];

  } catch {

    conversations = [];

  }

  conversations.unshift({

    id: Date.now(),

    messages:
      currentConversation,

    updatedAt:
      new Date().toISOString()

  });

  conversations =
    conversations.slice(0, 50);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      conversations
    )
  );

  renderHistory();
}


// ============================
// سجل المحادثات
// ============================

function renderHistory() {

  if (!historyList) {
    return;
  }

  historyList.innerHTML = "";

  let conversations = [];

  try {

    conversations =
      JSON.parse(
        localStorage.getItem(
          STORAGE_KEY
        )
      ) || [];

  } catch {

    conversations = [];

  }

  conversations.forEach(
    (conversation) => {

      if (
        !conversation.messages ||
        conversation.messages.length === 0
      ) {
        return;
      }

      const firstUser =
        conversation.messages.find(
          message =>
            message.role === "user"
        );

      const button =
        document.createElement(
          "button"
        );

      button.className =
        "history-item";

      button.textContent =
        firstUser?.content ||
        "محادثة جديدة";

      button.addEventListener(
        "click",
        () => {
          loadConversation(
            conversation
          );
        }
      );

      historyList.appendChild(
        button
      );

    }
  );
}


// ============================
// تحميل محادثة
// ============================

function loadConversation(
  conversation
) {

  currentConversation =
    [...conversation.messages];

  messages.innerHTML = "";

  welcome.style.display =
    "none";

  currentConversation.forEach(
    message => {

      addMessageToScreen(
        message.role,
        message.content
      );

    }
  );

  sidebar?.classList.remove(
    "open"
  );
}


// ============================
// محادثة جديدة
// ============================

function startNewChat() {

  currentConversation = [];

  messages.innerHTML = "";

  welcome.style.display =
    "block";

  messageInput.value = "";

  imageGenerationMode =
    false;

  imageMode.classList.remove(
    "active"
  );

  imageButton.classList.remove(
    "active"
  );

  messageInput.placeholder =
    "اكتب رسالتك إلى Zack...";

  messageInput.focus();

  sidebar?.classList.remove(
    "open"
  );
}


// ============================
// إنشاء صورة باستخدام Cosmos
// ============================

async function generateImage(
  prompt
) {

  if (!prompt.trim()) {
    return;
  }

  welcome.style.display =
    "none";

  addMessageToScreen(
    "user",
    "🎨 " + prompt
  );

  currentConversation.push({
    role: "user",
    content: "🎨 " + prompt
  });

  messageInput.value = "";

  sendButton.disabled = true;
  imageButton.disabled = true;

  addMessageToScreen(
    "assistant",
    "🎨 جاري إنشاء الصورة..."
  );

  try {

    const response =
      await fetch(
        "/api/image",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            prompt
          })
        }
      );

    let data = {};

    try {
      data =
        await response.json();
    } catch {
      data = {};
    }

    const waitingMessages =
      messages.querySelectorAll(
        ".message.assistant"
      );

    if (
      waitingMessages.length
    ) {

      waitingMessages[
        waitingMessages.length - 1
      ].remove();

    }

    if (!response.ok) {

      throw new Error(
        data.error ||
        `خطأ من الخادم (${response.status})`
      );

    }

    if (!data.image) {

      throw new Error(
        "لم تصل الصورة من الخادم"
      );

    }

    addImageToScreen(
      data.image
    );

    currentConversation.push({
      role: "assistant",
      content:
        "[تم إنشاء صورة]"
    });

    saveCurrentConversation();

  } catch (error) {

    console.error(
      "IMAGE ERROR:",
      error
    );

    const waitingMessages =
      messages.querySelectorAll(
        ".message.assistant"
      );

    if (
      waitingMessages.length
    ) {

      waitingMessages[
        waitingMessages.length - 1
      ].remove();

    }

    const errorMessage =
      "تعذر إنشاء الصورة.\n\n" +
      error.message;

    addMessageToScreen(
      "assistant",
      errorMessage
    );

  } finally {

    sendButton.disabled = false;
    imageButton.disabled = false;

    messageInput.focus();

  }
}


// ============================
// إرسال رسالة نصية
// ============================

async function sendMessage(
  text
) {

  text =
    text.trim();

  if (!text) {
    return;
  }

  if (imageGenerationMode) {

    await generateImage(
      text
    );

    return;
  }

  welcome.style.display =
    "none";

  addMessageToScreen(
    "user",
    text
  );

  currentConversation.push({
    role: "user",
    content: text
  });

  messageInput.value = "";

  messageInput.style.height =
    "auto";

  sendButton.disabled = true;

  addMessageToScreen(
    "assistant",
    "جاري التفكير..."
  );

  try {

    const response =
      await fetch(
        "/api/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            message: text
          })
        }
      );

    let data = {};

    try {

      data =
        await response.json();

    } catch {

      data = {};

    }

    const assistantMessages =
      messages.querySelectorAll(
        ".message.assistant"
      );

    if (
      assistantMessages.length
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

    const assistantMessages =
      messages.querySelectorAll(
        ".message.assistant"
      );

    if (
      assistantMessages.length
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

  } finally {

    sendButton.disabled =
      false;

    messageInput.focus();

  }
}


// ============================
// إرسال النموذج
// ============================

chatForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    await sendMessage(
      messageInput.value
    );

  }
);


// ============================
// زر إنشاء الصورة
// ============================

imageButton.addEventListener(
  "click",
  () => {

    imageGenerationMode =
      !imageGenerationMode;

    imageButton.classList.toggle(
      "active",
      imageGenerationMode
    );

    imageMode.classList.toggle(
      "active",
      imageGenerationMode
    );

    if (
      imageGenerationMode
    ) {

      messageInput.placeholder =
        "اكتب وصف الصورة التي تريد إنشاءها...";

      messageInput.focus();

    } else {

      messageInput.placeholder =
        "اكتب رسالتك إلى Zack...";

      messageInput.focus();

    }

  }
);


// ============================
// Enter
// ============================

messageInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      chatForm.requestSubmit();

    }

  }
);


// ============================
// تكبير مربع الكتابة
// ============================

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


// ============================
// محادثة جديدة
// ============================

newChatButton.addEventListener(
  "click",
  startNewChat
);


// ============================
// الوضع الداكن
// ============================

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
      isDark
        ? "true"
        : "false"
    );

  }
);


// ============================
// القائمة في الهاتف
// ============================

menuButton.addEventListener(
  "click",
  () => {

    sidebar.classList.toggle(
      "open"
    );

  }
);


// ============================
// الاقتراحات
// ============================

document
  .querySelectorAll(
    ".suggestions button"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          messageInput.value =
            button.dataset.prompt ||
            button.textContent.trim();

          messageInput.focus();

          messageInput.dispatchEvent(
            new Event("input")
          );

        }
      );

    }
  );


// ============================
// تحميل الوضع الداكن
// ============================

if (
  localStorage.getItem(
    "zack_dark_mode"
  ) === "true"
) {

  document.body.classList.add(
    "dark"
  );

}


// ============================
// تحميل السجل
// ============================

renderHistory();

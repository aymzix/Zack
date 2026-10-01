import express from "express";
import "dotenv/config";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("."));

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "لم يتم إرسال رسالة"
      });
    }

    if (!process.env.NVIDIA_API_KEY) {
      return res.status(500).json({
        error: "NVIDIA_API_KEY غير موجود في ملف .env"
      });
    }

    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`
        },

        body: JSON.stringify({
          model: "openai/gpt-oss-120b",

          messages: [
            {
              role: "user",
              content: message
            }
          ],

          temperature: 0.6,
          max_tokens: 4096,
          stream: false
        })
      }
    );

    const data = await response.json();

    console.log("NVIDIA status:", response.status);
    console.log("NVIDIA response:", data);

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.message ||
          data?.error ||
          "NVIDIA API أعاد خطأ"
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        error: "NVIDIA لم تُرجع نصًا"
      });
    }

    res.json({
      reply: reply
    });

  } catch (error) {

    console.error(
      "Server error:",
      error
    );

    res.status(500).json({
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Zack يعمل على http://localhost:${PORT}`
  );
});

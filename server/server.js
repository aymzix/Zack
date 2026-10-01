import express from "express";
import "dotenv/config";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("."));

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body.message;

    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
          temperature: 0.7,
          max_tokens: 2048,
          stream: false
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(response.status).json({
        error: "خطأ من NVIDIA API"
      });
    }

    res.json({
      reply: data.choices[0].message.content
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "حدث خطأ في الخادم"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Zack يعمل على http://localhost:${PORT}`);
});

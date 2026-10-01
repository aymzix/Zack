export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed"
    });
  }

  try {
    const { message } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "لم يتم إرسال رسالة"
      });
    }

    const apiKey = process.env.NVIDIA_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "مفتاح NVIDIA API غير مضبوط على الخادم"
      });
    }

    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content:
                "أنت Zack، مساعد ذكي ومفيد. أجب باللغة العربية إذا كانت رسالة المستخدم بالعربية."
            },
            {
              role: "user",
              content: message.trim()
            }
          ],
          temperature: 0.6,
          max_tokens: 4096,
          stream: false
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("NVIDIA API error:", data);

      return res.status(response.status).json({
        error:
          data?.message ||
          data?.error ||
          "حدث خطأ من NVIDIA API"
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        error: "لم يصل رد من NVIDIA"
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "حدث خطأ داخلي في الخادم"
    });
  }
          }

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
        error: "NVIDIA_API_KEY غير موجود في Vercel"
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
          model: "openai/gpt-oss-20b",

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
          max_tokens: 1024,
          stream: false
        })
      }
    );

    const data = await response.json();

    console.log(
      "NVIDIA STATUS:",
      response.status
    );

    console.log(
      "NVIDIA RESPONSE:",
      JSON.stringify(data)
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          `NVIDIA HTTP ${response.status}: ` +
          (
            data?.message ||
            data?.error ||
            JSON.stringify(data)
          )
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        error:
          "NVIDIA لم تُرجع نصًا. الرد: " +
          JSON.stringify(data)
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error(
      "SERVER ERROR:",
      error
    );

    return res.status(500).json({
      error:
        "خطأ داخلي: " +
        error.message
    });
  }
}

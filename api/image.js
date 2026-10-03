export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed"
    });
  }

  try {
    const { prompt } = req.body || {};

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        error: "لم يتم إرسال وصف للصورة"
      });
    }

    const apiKey = process.env.NVIDIA_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "NVIDIA_API_KEY غير موجود في Vercel"
      });
    }

    const response = await fetch(
      "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          prompt: prompt.trim(),
          width: 1024,
          height: 1024,
          mode: "base",
          samples: 1,
          seed: Math.floor(Math.random() * 4294967295),
          steps: 4
        })
      }
    );

    const responseText = await response.text();

    console.log("NVIDIA IMAGE STATUS:", response.status);
    console.log("NVIDIA IMAGE RESPONSE:", responseText);

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(response.status || 500).json({
        error:
          `NVIDIA HTTP ${response.status}: ` +
          responseText.substring(0, 1000)
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          `NVIDIA HTTP ${response.status}: ` +
          (
            data?.detail ||
            data?.message ||
            data?.error ||
            JSON.stringify(data)
          )
      });
    }

    const base64Image =
      data?.artifacts?.[0]?.base64;

    if (!base64Image) {
      return res.status(500).json({
        error:
          "NVIDIA لم تُرجع الصورة. الرد: " +
          JSON.stringify(data).substring(0, 1500)
      });
    }

    return res.status(200).json({
      image: `data:image/jpeg;base64,${base64Image}`
    });

  } catch (error) {
    console.error("IMAGE SERVER ERROR:", error);

    return res.status(500).json({
      error: "خطأ داخلي: " + error.message
    });
  }
}

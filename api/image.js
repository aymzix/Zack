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
      "https://ai.api.nvidia.com/v1/cosmos/nvidia/cosmos3-nano",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model_mode: "text2image",
          prompt: prompt.trim(),
          resolution: "720_1_1",
          seed: Math.floor(Math.random() * 2147483647)
        })
      }
    );

    const text = await response.text();

    console.log("COSMOS STATUS:", response.status);
    console.log("COSMOS RESPONSE:", text);

    let data;

    try {
      data = JSON.parse(text);
    } catch (parseError) {
      return res.status(500).json({
        error:
          "NVIDIA أرسلت استجابة غير صالحة JSON: " +
          text.substring(0, 500)
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          `NVIDIA HTTP ${response.status}: ` +
          (
            data?.message ||
            data?.detail ||
            data?.error ||
            JSON.stringify(data)
          )
      });
    }

    const base64Image = data?.b64_image;

    if (!base64Image) {
      return res.status(500).json({
        error:
          "لم يتم العثور على b64_image في استجابة NVIDIA: " +
          JSON.stringify(data).substring(0, 1000)
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

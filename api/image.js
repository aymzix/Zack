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

    // يمكنك وضع Invocation URL الخاص بـ NVIDIA في Vercel
    // باسم COSMOS3_API_URL إذا كان NVIDIA أعطاك عنوانًا مختلفًا.
    const apiUrl =
      process.env.COSMOS3_API_URL ||
      "https://ai.api.nvidia.com/v1/cosmos/nvidia/cosmos3-nano";

    const requestBody = {
      model_mode: "text2image",
      prompt: prompt.trim(),
      resolution: "720_1_1",
      num_inference_steps: 50,
      seed: Math.floor(Math.random() * 2147483647)
    };

    console.log("COSMOS URL:", apiUrl);
    console.log("COSMOS REQUEST:", JSON.stringify(requestBody));

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();

    console.log("COSMOS STATUS:", response.status);
    console.log("COSMOS RESPONSE:", responseText);

    let data = null;

    try {
      data = JSON.parse(responseText);
    } catch {
      if (!response.ok) {
        return res.status(response.status).json({
          error:
            `NVIDIA HTTP ${response.status}: ${responseText.substring(
              0,
              500
            )}`
        });
      }

      return res.status(500).json({
        error:
          "NVIDIA أرسلت استجابة غير JSON: " +
          responseText.substring(0, 500)
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

    const base64Image = data?.b64_image;

    if (!base64Image) {
      return res.status(500).json({
        error:
          "لم تُرجع NVIDIA صورة. الاستجابة: " +
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

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
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          task: "text2image",

          prompt: prompt.trim(),

          seed: Math.floor(
            Math.random() * 2147483647
          ),

          width: 1024,
          height: 1024
        })
      }
    );

    const data = await response.json();

    console.log(
      "COSMOS STATUS:",
      response.status
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          `Cosmos HTTP ${response.status}: ` +
          (
            data?.message ||
            data?.error ||
            JSON.stringify(data)
          )
      });
    }

    const image =
      data?.b64_image ||
      data?.image ||
      data?.data?.[0]?.b64_image;

    if (!image) {
      return res.status(500).json({
        error:
          "لم تُرجع Cosmos صورة. الرد: " +
          JSON.stringify(data)
      });
    }

    return res.status(200).json({
      image: `data:image/png;base64,${image}`
    });

  } catch (error) {
    console.error(
      "COSMOS ERROR:",
      error
    );

    return res.status(500).json({
      error:
        "خطأ في إنشاء الصورة: " +
        error.message
    });
  }
}

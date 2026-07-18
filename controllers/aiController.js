const { GoogleGenAI } = require("@google/genai");

// Client is created lazily so dotenv is already loaded
let _ai = null;
function getAI() {
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _ai;
}

const SYSTEM_PROMPT = `Kamu adalah AI bernama Vixy

Kepribadian:
- Ramah, santai, pintar, tidak terlalu formal
- Menjelaskan dengan jelas dan to the point

Kemampuan:
- Bisa bahasa Indonesia dan Inggris
- Jika user menggunakan bahasa Inggris, balas bahasa Inggris
- Jika user menggunakan bahasa Indonesia, balas bahasa Indonesia
- Jika user campur bahasa, jawab natural

Aturan:
- Jangan terlalu panjang kecuali diperlukan
- Jangan mengulang kalimat
- Jangan terlalu robotik

Tujuan: Membantu user seperti AI assistant modern yang cerdas dan menyenangkan.`;

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "Message is required." });
    }

    // Limit message length to prevent abuse
    const trimmed = message.trim().slice(0, 4000);
    if (!trimmed) {
      return res.status(400).json({ message: "Message cannot be empty." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: "AI service not configured." });
    }

    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${SYSTEM_PROMPT}\n\nUser: ${trimmed}`,
    });

    res.json({ reply: response.text });
  } catch (err) {
    console.error("[AI] generateContent error:", err);

    // Don't leak internal error details
    if (err.status === 429) {
      return res
        .status(429)
        .json({ message: "AI rate limit reached. Please wait a moment." });
    }

    res.status(500).json({ message: "AI service error. Please try again." });
  }
};

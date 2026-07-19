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
- Ingat konteks percakapan sebelumnya dan gunakan saat menjawab

Tujuan: Membantu user seperti AI assistant modern yang cerdas dan menyenangkan.`;

exports.chat = async (req, res) => {
  try {
    const { message, history } = req.body;

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

    // Build multi-turn contents array from history
    // history format from frontend: [{role: "user"|"ai", text: "..."}]
    const contents = [];

    // Prepend system prompt as first user turn (Gemini doesn't have system role in contents)
    contents.push({
      role: "user",
      parts: [{ text: SYSTEM_PROMPT }],
    });
    contents.push({
      role: "model",
      parts: [{ text: "Siap! Aku Vixy, AI assistant kamu. Ada yang bisa aku bantu?" }],
    });

    // Add conversation history (max last 20 turns to avoid token overflow)
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-20);
      for (const turn of recentHistory) {
        if (!turn || typeof turn.text !== "string") continue;
        const role = turn.role === "ai" ? "model" : "user";
        contents.push({
          role,
          parts: [{ text: turn.text.slice(0, 4000) }],
        });
      }
    }

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: trimmed }],
    });

    const response = await getAI().models.generateContent({
      model: "gemini-2.5-pro",
      contents,
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

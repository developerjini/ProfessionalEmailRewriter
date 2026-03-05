const WORKER_URL = "https://email-rewriter-api.i5veagl.workers.dev";

export type Tone =
  | "formal"
  | "semi-formal"
  | "concise"
  | "friendly"
  | "casual"
  | "persuasive";

export interface RewriteOptions {
  tone: Tone;
  language: "ko" | "en";
}

function toneLabel(tone: Tone) {
  // systemInstruction에 자연스럽게 들어갈 표현
  switch (tone) {
    case "formal":
      return "formal";
    case "semi-formal":
      return "semi-formal";
    case "concise":
      return "concise";
    case "friendly":
      return "friendly";
    case "casual":
      return "casual";
    case "persuasive":
      return "persuasive";
    default:
      return "formal";
  }
}

export async function rewriteText(text: string, options: RewriteOptions) {
  const { tone, language } = options;

  const systemInstruction = `
You are a professional business communication expert.
Your task is to rewrite the user's input into a professional business email.

Guidelines:
- Maintain the core meaning of the message.
- Use a ${toneLabel(tone)} tone.
- The output should be in ${language === "ko" ? "Korean" : "English"}.
- If the input is in a different language, translate it while rewriting.
- Structure the output as follows:
  1. [Summary Section]: A very brief (1-2 sentences) summary of the core message, labeled as "요약" (in Korean) or "Summary" (in English).
  2. [Email Section]: The complete professional email (Subject, Salutation, Body, Closing).
- Ensure the language is polite, respectful, and appropriate for a workplace setting.
- Do not add any conversational filler or meta-comments. Just provide the summary and the rewritten email.
  `.trim();

  // Gemini REST 형식(payload) - Worker가 그대로 Gemini로 전달
  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${systemInstruction}\n\n[User Input]\n${text}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
    },
  };

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      // Worker가 Gemini 응답을 그대로 내려주므로, message 확인 가능
      throw new Error(
        `Gemini API Error (${res.status}): ${JSON.stringify(data)}`
      );
    }

    // Gemini REST 응답에서 텍스트 추출
    const out =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.candidates?.[0]?.content?.text ??
      "";

    if (!out) {
      throw new Error("Empty response from Gemini.");
    }

    return out;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to rewrite text. Please try again.");
  }
}
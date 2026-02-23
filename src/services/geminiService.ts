import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export type Tone = 'formal' | 'semi-formal' | 'concise' | 'friendly' | 'casual' | 'persuasive';

export interface RewriteOptions {
  tone: Tone;
  language: 'ko' | 'en';
}

export async function rewriteText(text: string, options: RewriteOptions) {
  const { tone, language } = options;
  
  const systemInstruction = `
    You are a professional business communication expert. 
    Your task is to rewrite the user's input into a professional business email.
    
    Guidelines:
    - Maintain the core meaning of the message.
    - Use a ${tone} tone.
    - The output should be in ${language === 'ko' ? 'Korean' : 'English'}.
    - If the input is in a different language, translate it while rewriting.
    - Structure the output as follows:
      1. [Summary Section]: A very brief (1-2 sentences) summary of the core message, labeled as "요약" (in Korean) or "Summary" (in English).
      2. [Email Section]: The complete professional email (Subject, Salutation, Body, Closing).
    - Ensure the language is polite, respectful, and appropriate for a workplace setting.
    - Do not add any conversational filler or meta-comments. Just provide the summary and the rewritten email.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: text,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to rewrite text. Please try again.");
  }
}

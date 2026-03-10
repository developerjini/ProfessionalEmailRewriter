export type Tone =
  | 'formal'
  | 'soft'
  | 'concise'
  | 'friendly'
  | 'casual'
  | 'persuasive';

export interface RewriteOptions {
  tone: Tone;
  language: 'ko' | 'en';
}

export interface EmailResult {
  subject: string;
  body: string;
}

const TONE_GUIDE: Record<Tone, { label: string; ko: string; en: string }> = {
  formal: {
    label: '정중한',
    ko: `- 높임말과 경어를 철저히 사용 (예: ~드립니다, ~주시기 바랍니다, ~말씀드립니다)
- 격식 있고 공식적인 어조 유지
- 문장은 완결성 있게, 줄임말 없이 작성
- 상사, 임원, 외부 거래처에게 보내는 공문 스타일`,
    en: `- Use formal, highly respectful language throughout
- Complete sentences, no contractions or abbreviations
- Suitable for superiors, executives, or external clients`,
  },
  soft: {
    label: '부드러운',
    ko: `- 따뜻하고 배려 깊은 어조 (예: ~부탁드려도 될까요, ~감사드립니다, ~수고 많으셨습니다)
- 딱딱하지 않고 부드럽게, 하지만 예의 바르게
- 동료나 협력 부서에 보내는 친근한 업무 메일 스타일`,
    en: `- Warm, considerate, and gentle tone
- Polite but approachable, not stiff
- Suitable for colleagues or cross-department communication`,
  },
  concise: {
    label: '간결한',
    ko: `- 불필요한 인사말, 수식어 최소화
- 핵심 내용만 짧고 명확하게 전달
- 글머리 기호나 번호 목록을 적극 활용하여 빠르게 파악 가능하도록
- 바쁜 상대방도 한 눈에 읽을 수 있는 구조`,
    en: `- Minimal pleasantries, straight to the point
- Short, clear sentences
- Use bullet points or numbered lists where possible
- Quickly scannable structure`,
  },
  friendly: {
    label: '친근한',
    ko: `- 가깝고 편안한 느낌이지만 비즈니스 예의는 유지 (예: ~해요, ~해드릴게요)
- 딱딱한 표현보다 자연스럽고 대화하는 듯한 어조
- 가까운 동료나 자주 협업하는 팀원에게 보내는 스타일`,
    en: `- Warm and personable but still professional
- Natural, conversational tone while maintaining business etiquette
- Suitable for close colleagues or familiar contacts`,
  },
  casual: {
    label: '캐주얼',
    ko: `- 격식을 많이 낮춘 편안하고 자연스러운 말투 (예: ~해요, ~할게요, ~어때요?)
- 일상 대화체에 가깝게, 하지만 무례하지 않게
- 친한 동료나 팀 내부 소통 스타일`,
    en: `- Relaxed and conversational, low formality
- Natural, everyday language — not rude, just casual
- Suitable for close teammates or internal quick messages`,
  },
  persuasive: {
    label: '설득력 있는',
    ko: `- 논리적 근거와 이유를 명확히 제시
- 상대방이 동의하거나 행동하도록 유도하는 구조
- 핵심 주장 → 근거 → 요청 순서로 전개
- 자신감 있고 적극적인 어조 (예: ~을 제안드립니다, ~를 검토해 주시길 강력히 권장합니다)`,
    en: `- Lead with a clear main point, followed by supporting reasoning
- Action-oriented, confident tone
- Structure: claim → evidence → call to action
- Use assertive but professional language`,
  },
};

export async function rewriteEmail(
  apiKey: string,
  text: string,
  options: RewriteOptions
): Promise<EmailResult> {
  const { tone, language } = options;
  const isKorean = language === 'ko';
  const guide = TONE_GUIDE[tone];

  const systemInstruction = isKorean
    ? `당신은 한국 직장인을 위한 비즈니스 메일 전문 작성 도우미입니다.
사용자가 입력한 메일 초안을 완성도 높은 비즈니스 메일로 재작성해주세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[말투: ${guide.label}] — 아래 지침을 반드시 준수하세요
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${guide.ko}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[메일 작성 원칙]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 구조화: 내용이 복잡하거나 항목이 여러 개라면 번호(1. 2. 3.)나 글머리(-)를 활용해 가독성 높게 정리
2. 완성도: 인사말(도입) → 본문(핵심 내용) → 마무리 인사(요청/마무리)의 3단 구조로 작성
3. 전문성: 기술 용어, 수치, 시스템명 등 원문의 구체적인 정보는 그대로 유지하되 더 명확하게 표현
4. 충실성: 원문에 없는 내용을 임의로 추가하지 말 것
5. 서식 금지: 본문에 **볼드**, *이탤릭*, ## 제목 등 마크다운 서식을 절대 사용하지 말 것. 순수 텍스트만 사용할 것

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[출력 형식] — 반드시 아래 JSON만 출력 (마크다운 불가, 설명 불가)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{"subject": "메일 제목 (50자 이내, 핵심 내용 담기)", "body": "완성된 메일 본문"}`
    : `You are a professional business email writing assistant.
Rewrite the user's draft into a polished, well-structured business email.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Tone: ${guide.label}] — Follow these guidelines strictly
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${guide.en}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Writing Principles]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Structure: Use numbered lists or bullet points when content has multiple items
2. Completeness: Follow a 3-part structure — opening → body → closing
3. Professionalism: Keep technical terms, numbers, and system names from the original
4. Faithfulness: Do not add information that wasn't in the original draft
5. No markdown: Never use **bold**, *italic*, or ## headers in the body. Plain text only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Output Format] — Output ONLY the JSON below (no markdown, no explanation)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{"subject": "Clear subject line (under 50 chars)", "body": "Complete email body"}`;

  const userPrompt = isKorean
    ? `아래 메일 초안을 위의 지침에 따라 완성도 높은 비즈니스 메일로 재작성해주세요.\n\n[메일 초안]\n${text}`
    : `Rewrite the following email draft following the guidelines above.\n\n[Draft]\n${text}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.6,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
    const message = err?.error?.message || `HTTP ${response.status}`;
    throw new Error(`API 오류: ${message}`);
  }

  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!rawText) throw new Error('응답이 비어있습니다. 다시 시도해주세요.');

  // 마크다운 코드블록 제거 후 JSON 파싱
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('응답 파싱 실패. 다시 시도해주세요.');

  const parsed = JSON.parse(jsonMatch[0]) as { subject?: string; body?: string };
  if (!parsed.subject || !parsed.body) throw new Error('응답 형식 오류. 다시 시도해주세요.');

  // ** 등 마크다운 서식 제거
  const cleanBody = parsed.body
    .replace(/\*\*(.*?)\*\*/g, '$1')  // **볼드** → 볼드
    .replace(/\*(.*?)\*/g, '$1')       // *이탤릭* → 이탤릭
    .replace(/#{1,6}\s*/g, '');        // ## 제목 → 제거

  return { subject: parsed.subject, body: cleanBody };
}
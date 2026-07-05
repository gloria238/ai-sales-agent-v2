import { NextResponse } from "next/server";
import { callDeepSeek } from "@salesagent/ai-core";
import { getSession } from "@/lib/session";

/**
 * POST /api/v1/translate
 * Translate text to a target language using DeepSeek.
 *
 * Body: { text: string, targetLanguage: string }
 * Returns: { translated: string, sourceLanguage: string }
 *
 * Language codes: zh, en, ja, ko, fr, de, es, pt, ru, ar, etc.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { text?: string; targetLanguage?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { text, targetLanguage } = body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (text.length > 5000) {
    return NextResponse.json({ error: "text too long (max 5000 chars)" }, { status: 400 });
  }

  const lang = targetLanguage || "en";
  const langNames: Record<string, string> = {
    zh: "简体中文", en: "English", ja: "日本語", ko: "한국어",
    fr: "Français", de: "Deutsch", es: "Español", pt: "Português",
    ru: "Русский", ar: "العربية",
  };
  const targetName = langNames[lang] || lang;

  try {
    const response = await callDeepSeek(
      `将以下文字翻译成${targetName}（${lang}），只输出翻译结果，不要任何解释、不要引号包裹：\n\n${text}`,
      undefined,
      { temperature: 0, timeoutMs: 15_000 },
    );

    const translated = response.content.trim();

    return NextResponse.json({
      translated,
      sourceLanguage: "auto",
      targetLanguage: lang,
    });
  } catch (err) {
    console.error("Translation error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "Translation failed — please try again" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `Tu es DiveGuide, un assistant expert en plongée sous-marine pour EviDive. Tu aides les utilisateurs à découvrir le monde sous-marin et à trouver leurs prochaines aventures de plongée.

TON RÔLE :
- Tu poses des questions pour comprendre le profil et les envies de l'utilisateur
- Tu es passionné, chaleureux et enthousiaste
- Tu donnes des conseils personnalisés basés sur leurs réponses
- Tu adaptes ta langue à celle de l'utilisateur (français ou anglais selon son premier message)

DÉROULEMENT :
1. Commence par te présenter brièvement et demander si l'utilisateur a déjà fait de la plongée
2. Selon sa réponse, adapte tes questions suivantes
3. Pose des questions sur son expérience, ses envies, ses contraintes
4. Après 4-5 échanges, propose des recommandations personnalisées

STYLE :
- Questions ouvertes, réponses concises
- Utilise des emojis avec modération (🐢 🦈 🌊 🤿)
- Sois encourageant et bienveillant`;

const WELCOME_FR =
  "Bonjour ! Je suis DiveGuide, ton assistant personnel pour la plongée. 🌊\n\nAs-tu déjà fait de la plongée ? Si oui, quel est ton niveau ? Sinon, dis-moi ce qui t'attire dans les fonds marins !";
const WELCOME_EN =
  "Hello! I'm DiveGuide, your personal diving assistant. 🌊\n\nHave you ever been diving? If so, what's your level? If not, tell me what attracts you to the underwater world!";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        message: messages.length === 0 ? WELCOME_FR : "Le service IA n'est pas configuré. Ajoutez GROQ_API_KEY dans votre .env.",
      });
    }

    if (messages.length === 0) {
      const locale = request.headers.get("accept-language")?.includes("fr")
        ? "fr"
        : "en";
      return NextResponse.json({
        message: locale === "fr" ? WELCOME_FR : WELCOME_EN,
      });
    }

    if (messages.length > 50) {
      return NextResponse.json(
        { error: "Trop de messages." },
        { status: 400 }
      );
    }

    const apiMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: String(m.content).slice(0, 2000),
      })),
    ];

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: apiMessages,
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Groq API error:", error);
      return NextResponse.json(
        { error: "Erreur du service IA" },
        { status: 500 }
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      return NextResponse.json(
        { error: "Réponse vide du service IA" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

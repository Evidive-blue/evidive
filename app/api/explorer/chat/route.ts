import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Tu es DiveGuide, un assistant expert en plongée sous-marine pour EviDive. Tu aides les utilisateurs à découvrir le monde sous-marin et à trouver leurs prochaines aventures de plongée.

TON RÔLE :
- Tu poses des questions pour comprendre le profil et les envies de l'utilisateur
- Tu es passionné, chaleureux et enthousiaste
- Tu donnes des conseils personnalisés basés sur leurs réponses
- Tu parles en français

DÉROULEMENT DE LA CONVERSATION :
1. Commence par te présenter brièvement et demander si l'utilisateur a déjà fait de la plongée
2. Selon sa réponse, adapte tes questions suivantes
3. Pose des questions sur :
   - Son expérience (débutant, certifié, niveau)
   - Ce qu'il rêve de voir (grands animaux, récifs colorés, épaves, grottes...)
   - Ses préférences (eau chaude/froide, profondeur, courant...)
   - Ses contraintes (budget, période, durée)
4. Après 4-5 échanges, propose des recommandations personnalisées :
   - Destinations adaptées
   - Meilleure saison pour y aller
   - Ce qu'il pourra y voir
   - Niveau requis
   - Conseils pratiques

STYLE :
- Questions ouvertes, pas de QCM
- Réponses concises (2-3 phrases max par message sauf pour les recommandations finales)
- Utilise des emojis avec modération (🐢 🦈 🐙 🌊 🤿)
- Sois encourageant et bienveillant

IMPORTANT :
- Ne donne JAMAIS de réponses pré-faites ou de listes à choix
- Adapte-toi vraiment aux réponses de l'utilisateur
- Si l'utilisateur est débutant, rassure-le et propose des expériences adaptées
- Si l'utilisateur est expérimenté, propose des aventures plus techniques`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages requis' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Configuration API manquante' },
        { status: 500 }
      );
    }

    // Préparer les messages pour l'API Groq
    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: apiMessages,
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      return NextResponse.json(
        { error: 'Erreur du service IA' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'Réponse vide du service IA' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: assistantMessage,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

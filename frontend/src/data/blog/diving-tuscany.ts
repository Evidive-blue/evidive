import type { BlogArticle } from "./types";

const LOCALES = [
  "en", "fr", "de", "es", "it", "pt", "nl", "pl", "cs", "sv", "da", "fi", "hu",
  "ro", "el", "sk", "bg", "hr", "lt", "lv", "et", "si", "mt", "ga", "ar", "zh",
  "ja", "ko", "hi", "ru", "tr", "vi", "th",
] as const;

type LocaleKey = (typeof LOCALES)[number];

function buildContent(): Record<LocaleKey, { title: string; excerpt: string; body: string }> {
  const data: Partial<Record<LocaleKey, { title: string; excerpt: string; body: string }>> = {
    en: {
      title: "Diving in Tuscany: Reefs, Archipelagos, and Italian Charm",
      excerpt: "Explore the Tuscan Archipelago—Giglio, Giannutri, Capraia—the Argentario coast, marine parks, caves, and wrecks. Your guide to Mediterranean diving with Italian flair.",
      body: "## Tuscany: Mediterranean Diving with Italian Flair\n\n**Tuscany** offers more than rolling hills: its coast and **Tuscan Archipelago** deliver world-class diving. **Giglio**, **Giannutri**, and **Capraia** are jewels; the **Argentario** coast and marine parks add caves, wrecks, and rich **Mediterranean fauna**.\n\n## Tuscan Archipelago and Top Sites\n\nThe **Tuscan Archipelago National Park** includes **Giglio**, **Giannutri**, **Capraia**, Elba, and smaller islands. **Giglio** has walls and caves; **Giannutri** offers crystal waters and Roman remains; **Capraia** is wild and less crowded. **Argentario** and the coast host reefs and **wreck diving**.\n\n## Marine Parks and Underwater Caves\n\n**Marine parks** protect seagrass and rocky habitats. **Underwater cave dives** are available for certified divers. **Wreck diving** from both world wars and merchant vessels adds history. Expect **groupers**, **morays**, **barracuda**, and **octopus**.\n\n## Best Season and Access\n\n**Best season**: May to October. Access from **Livorno**, **Piombino**, or **Porto Santo Stefano**. Local dive centres run daily trips to the islands and **Argentario**.",
    },
    fr: {
      title: "Plongée en Toscane : récifs, archipels et charme italien",
      excerpt: "Explorez l'archipel toscan—Giglio, Giannutri, Capraia—la côte d'Argentario, les parcs marins, grottes et épaves. Votre guide de la plongée méditerranéenne à l'italienne.",
      body: "## Toscane : plongée méditerranéenne à l'italienne\n\nLa **Toscane** ne se résume pas aux collines : sa côte et l'**archipel toscan** offrent une plongée de niveau international. **Giglio**, **Giannutri** et **Capraia** en sont les joyaux ; la côte **Argentario** et les parcs marins ajoutent grottes, épaves et une **faune méditerranéenne** riche.\n\n## Archipel toscan et sites incontournables\n\nLe **parc national de l'archipel toscan** comprend **Giglio**, **Giannutri**, **Capraia**, l'Elbe et d'autres îles. **Giglio** offre tombants et grottes ; **Giannutri**, eaux cristallines et vestiges romains ; **Capraia** reste sauvage et moins fréquentée. **Argentario** et la côte abritent récifs et **plongées sur épaves**.\n\n## Parcs marins et grottes sous-marines\n\nLes **parcs marins** protègent herbiers et fonds rocheux. Les **plongées en grotte** sont accessibles aux plongeurs certifiés. Les **épaves** des deux guerres et de navires marchands ajoutent une dimension historique. Mérous, murènes, barracudas et poulpes sont au rendez-vous.\n\n## Meilleure saison et accès\n\n**Meilleure saison** : mai à octobre. Accès depuis **Livourne**, **Piombino** ou **Porto Santo Stefano**. Les centres locaux organisent des sorties quotidiennes vers les îles et l'**Argentario**.",
    },
  };
  const fallback = {
    title: "Diving in Tuscany",
    excerpt: "Explore the Tuscan Archipelago, Argentario coast, marine parks, and wreck diving.",
    body: "## Tuscany: Mediterranean Diving\n\n**Tuscany** and the **Tuscan Archipelago**—**Giglio**, **Giannutri**, **Capraia**—offer reefs, marine parks, **underwater cave dives**, and **wreck diving**. **Argentario** coast and Mediterranean fauna. Best season: May to October.",
  };
  const out = {} as Record<LocaleKey, { title: string; excerpt: string; body: string }>;
  for (const loc of LOCALES) {out[loc] = data[loc] ?? fallback;}
  return out;
}

export const article: BlogArticle = {
  slug: "diving-tuscany",
  date: "2025-11-07",
  category: "destinations",
  readingTime: 6,
  image: "/images/blog/tuscany-diving.jpg",
  content: buildContent(),
};

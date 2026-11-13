import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "@/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "@/config/cours/metiers";
import { CHAPITRES } from "@/config/cours/registre";
import { SITUATIONS } from "@/config/cours/situations";
import { servirLeChapitre } from "@/pedagogy/cours/chapitre-servi";

/**
 * LA BONNE RÉPONSE NE SE TRAHIT PAS PAR SA LONGUEUR (audit pédagogique du 11 novembre 2026, P1-5).
 *
 * Mesure du 11 novembre : dans 197 questions à choix de 90 chapitres, la bonne réponse était
 * strictement l'option la plus longue, dont 3 des 4 questions de « Les flux de l'entreprise »,
 * l'essai par défaut du site. Un élève qui prenait toujours la réponse la plus détaillée trouvait
 * la bonne sans lire. Les 197 ont été rééquilibrées, sans chiffre ni fait nouveau : la bonne
 * réponse a raccourci et reporté sa précision dans son retour, ou un piège a reçu l'argument qui
 * le rend tentant. La garde des épisodes (longueur-des-options.test.ts) suit la même méthode.
 *
 * Ce qui se mesure : les questions à choix (`choix`) et les comparaisons (`comparaison`) des
 * chapitres et des cas pratiques, servies par `servirLeChapitre` dans chaque entreprise où le
 * chapitre se joue, car leurs textes se calculent sur les chiffres de l'entreprise. Une question
 * se trahit si, dans une entreprise au moins, l'une de ses bonnes réponses est strictement plus
 * longue que chacun de ses pièges. Les bureaux, les enquêtes et les scénarios ont d'autres formes
 * de question ; ils ne sont pas dans cette garde.
 *
 * Le plafond : dans chaque chapitre et dans chaque cas, la bonne réponse n'est strictement la plus
 * longue que dans un tiers de ses questions à choix au plus, arrondi au-dessus.
 */

const plafond = (n: number) => Math.ceil(n / 3);

interface Mesure {
  ou: string;
  questions: number;
  trahies: string[];
}

function mesurer(): Mesure[] {
  const sortie: Mesure[] = [];
  const tous = [...CHAPITRES.map((c) => ["chapitre", c] as const), ...SITUATIONS.map((s) => ["cas", s] as const)];
  for (const [sorte, ch] of tous) {
    const questions = new Set<string>();
    const trahies = new Set<string>();
    for (const entreprise of ch.entreprises?.codes ?? ENTREPRISES_DU_COURS) {
      for (const e of servirLeChapitre(ch, casDeLEntreprise(entreprise)).etapes) {
        if (e.type !== "choix" && e.type !== "comparaison") continue;
        questions.add(e.id);
        const juste = e.options.filter((o) => o.juste).map((o) => o.texte.length);
        const pieges = e.options.filter((o) => !o.juste).map((o) => o.texte.length);
        if (juste.length && pieges.length && Math.max(...juste) > Math.max(...pieges)) trahies.add(e.id);
      }
    }
    sortie.push({ ou: `${sorte} ${ch.code}`, questions: questions.size, trahies: [...trahies] });
  }
  return sortie;
}

describe("la longueur des réponses", () => {
  const mesures = mesurer();

  it("la mesure lit les questions à choix des chapitres et des cas pratiques", () => {
    expect(mesures.filter((m) => m.ou.startsWith("chapitre")).reduce((n, m) => n + m.questions, 0)).toBeGreaterThan(1000);
    expect(mesures.filter((m) => m.ou.startsWith("cas")).reduce((n, m) => n + m.questions, 0)).toBeGreaterThan(50);
  });

  it("dans chaque chapitre et chaque cas, la bonne réponse n'est la plus longue que dans un tiers des questions au plus", () => {
    const fautifs = mesures
      .filter((m) => m.trahies.length > plafond(m.questions))
      .map((m) => `${m.ou} (${m.trahies.length} sur ${m.questions}) : ${m.trahies.join(", ")}`);
    expect(fautifs).toEqual([]);
  });
});

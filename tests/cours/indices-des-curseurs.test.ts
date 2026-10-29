import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "@/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "@/config/cours/metiers";
import { CHAPITRES } from "@/config/cours/registre";
import { SITUATIONS } from "@/config/cours/situations";
import { servirLeChapitre, type CurseurServi } from "@/pedagogy/cours/chapitre-servi";

/**
 * L'INDICE DU CURSEUR VA DANS LE BON SENS, ET LE CURSEUR NE PART PAS SUR LA RÉPONSE
 * (audit pédagogique, P0-1 et P1-6).
 *
 * Quand l'élève valide trop bas, il lit `rates.dessous` ; trop haut, `rates.dessus`
 * (chapitre-guide.tsx). Une position trop basse doit donc l'envoyer vers le haut, jamais
 * vers le bas, et inversement : quatre chapitres du CAP et du bac pro avaient les deux
 * messages échangés. La garde lit les consignes de direction des messages (« cherchez le plus
 * petit », « remisez moins », « montez »…) et vérifie leur sens, sur tous les curseurs, dans
 * toutes les entreprises. Elle vérifie aussi que la position de départ n'est jamais la bonne
 * réponse : l'élève validerait sans avoir rien manipulé.
 */

/** Les consignes qui disent de baisser la position. */
const VERS_LE_BAS = [
  /cherchez (?:le |la |les )?(?:plus (?:petit|petite|petits|petites|bas|basse|court|courte)\b|moins\b|premier\b|première\b)/i,
  /cherchez plus bas/i,
  /cherchez (?:le|la|les) (?:\S+ )(?:le |la |les )?plus (?:bas|basses?|petits?|petites?)\b/i,
  /\b(?:remisez|visez|consommez) moins\b/i,
  /\bmoins longtemps\b/i,
  /\bmoins(?: [^\s,:.]+){0,3} suffi(?:t|sent|rait|raient|saient)\b/i,
];

/** Les consignes qui disent de monter la position. */
const VERS_LE_HAUT = [
  /cherchez (?:le |la |les )?(?:plus (?:haut|haute|grand|grande|fort|forte|long|longue|gros|grosse)\b|plus d'|plus grand)/i,
  /cherchez (?:le|la|les) (?:\S+ )(?:le |la |les )?plus (?:haut|haute|long|longue|grand|grande|forte?)\b/i,
  /\b(?:montez|avancez|allongez)\b/i,
  /\b(?:doit|il faut) monter\b|\bpeut monter(?: encore| davantage|\s*[.:])/i,
  /\bvendez-en plus\b/i,
  /\bvous pouvez (?:remiser|accorder|baisser|aller) (?:davantage|plus)\b/i,
  /\bpouvez aller plus loin\b/i,
];

const dit = (texte: string, consignes: readonly RegExp[]) => consignes.some((r) => r.test(texte));

const curseurs = [...CHAPITRES, ...SITUATIONS].flatMap((chapitre) =>
  ENTREPRISES_DU_COURS.filter((code) => !chapitre.entreprises || chapitre.entreprises.codes.includes(code)).flatMap((code) =>
    servirLeChapitre(chapitre, casDeLEntreprise(code))
      .etapes.filter((e): e is CurseurServi => e.type === "curseur")
      .map((etape) => ({ nom: `${chapitre.code} / ${etape.id} chez ${code}`, etape })),
  ),
);

it("la garde reconnaît les deux sens", () => {
  expect(dit("Plus bas, la promesse tient encore : cherchez la plus petite prime brute.", VERS_LE_BAS)).toBe(true);
  expect(dit("À cette remise, le chiffre d'affaires tombe sous celui du mois sans promotion : remisez moins.", VERS_LE_BAS)).toBe(true);
  expect(dit("Le chiffre d'affaires tient encore : vous pouvez remiser davantage. Cherchez la plus forte remise.", VERS_LE_HAUT)).toBe(true);
  expect(dit("Le budget permet encore un brut plus haut : cherchez le plus haut.", VERS_LE_HAUT)).toBe(true);
  expect(curseurs.length).toBeGreaterThan(100);
});

describe.each(curseurs)("$nom", ({ etape }) => {
  it("trop bas, l'indice dit de monter ; trop haut, de descendre", () => {
    expect(dit(etape.rates.dessous, VERS_LE_BAS), `dessous : ${etape.rates.dessous}`).toBe(false);
    expect(dit(etape.rates.dessus, VERS_LE_HAUT), `dessus : ${etape.rates.dessus}`).toBe(false);
  });

  it("la position de départ n'est pas la bonne réponse", () => {
    expect(etape.depart).not.toBe(etape.cible.attendu);
  });
});

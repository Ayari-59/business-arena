import { describe, expect, it } from "vitest";
import { ASSEZ_VENDRE_POUR_NE_RIEN_PERDRE } from "../../src/config/cours/chapitres/assez-vendre-pour-ne-rien-perdre";
import { DE_L_INDIVIDU_A_L_ACTEUR } from "../../src/config/cours/chapitres/de-l-individu-a-l-acteur";
import type { Cas } from "../../src/config/cours/cas";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeTri, EtatDuCours } from "../../src/config/cours/types";
import { gardeDuCurseurSgn, gardeDuProgrammeSgn, gardesDeTexteSgn } from "./gardes-de-la-sgn";

/**
 * LES GARDES DE LA SGN VOIENT LEURS FAUTES. Chaque garde ajoutée pour le lot A (la bonne réponse jamais
 * la plus longue, une catégorie de tri jamais vide, chaque objectif travaillé, au plus 20 étapes, un
 * curseur aux droites vraiment droites) est passée sur une copie fautive d'un chapitre : elle doit
 * rougir. Sur le chapitre juste, elle reste verte (les tests de chaque chapitre).
 */

const avec = (ch: Chapitre, id: string, change: (e: Etape) => Etape): Chapitre => ({ ...ch, etapes: ch.etapes.map((e) => (e.id === id ? change(e) : e)) });

describe("les gardes de la SGN rougissent sur une copie fautive", () => {
  it("la bonne réponse devenue la plus longue", () => {
    const faux = avec(DE_L_INDIVIDU_A_L_ACTEUR, "le-stereotype", (e) => {
      const c = e as EtapeChoix;
      return { ...c, options: (cas: Cas, etat: EtatDuCours) => c.options(cas, etat).map((o) => (o.juste ? { ...o, texte: `${o.texte}, et bien plus encore que tout ce que disent les autres réponses` } : o)) };
    });
    expect(() => gardesDeTexteSgn(faux)).toThrow(/la plus longue/);
  });

  it("une catégorie de tri laissée vide", () => {
    const faux = avec(DE_L_INDIVIDU_A_L_ACTEUR, "formel-ou-informel", (e) => {
      const t = e as EtapeTri;
      return { ...t, elements: (cas: Cas) => t.elements(cas).map((x) => ({ ...x, categorie: "formelle" })) };
    });
    expect(() => gardesDeTexteSgn(faux)).toThrow(/informelle vide/);
  });

  it("un objectif qu'aucune étape évaluée ne travaille", () => {
    const faux = { ...DE_L_INDIVIDU_A_L_ACTEUR, objectifs: [...DE_L_INDIVIDU_A_L_ACTEUR.objectifs, "Un objectif oublié"] };
    expect(() => gardesDeTexteSgn(faux)).toThrow(/objectif 5/);
  });

  it("plus de 20 étapes", () => {
    const etapes = [...DE_L_INDIVIDU_A_L_ACTEUR.etapes, ...DE_L_INDIVIDU_A_L_ACTEUR.etapes.map((e) => ({ ...e, id: `${e.id}-bis` }))];
    expect(() => gardeDuProgrammeSgn({ ...DE_L_INDIVIDU_A_L_ACTEUR, etapes }, "STMG Thème 1 · De l'individu à l'acteur")).toThrow(/au plus 20 étapes/);
  });

  it("un curseur dont une droite n'est pas droite", () => {
    const faux = avec(ASSEZ_VENDRE_POUR_NE_RIEN_PERDRE, "le-curseur-du-seuil", (e) => {
      const c = e as EtapeCurseur;
      return { ...c, droites: (cas: Cas) => ({ ...c.droites(cas), cout: (q: number) => c.droites(cas).cout(q) + (q > 2_000 ? 10_000 : 0) }) };
    });
    expect(() => gardeDuCurseurSgn(faux, "le-curseur-du-seuil", 1_485)).toThrow(/une droite/);
  });
});

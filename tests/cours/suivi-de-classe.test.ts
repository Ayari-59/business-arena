import { describe, expect, it } from "vitest";
import { CHAPITRES } from "../../src/config/cours/registre";
import { vueDeLaClasse, type ProgressionLue } from "../../src/pedagogy/cours/suivi";

/**
 * LA VUE DE L'ENSEIGNANT : CE QUE LES PROGRESSIONS DISENT, AGRÉGÉ SANS SE TROMPER.
 * Une étape réussie du premier coup n'est pas une étape réussie après une erreur, ni une
 * étape où l'on a demandé la correction ; une remarque reçue par deux élèves compte deux
 * élèves, même si l'un l'a reçue trois fois.
 */

const chapitre = CHAPITRES[0]!;
const [intro, apport, emprunt] = chapitre.etapes;
const p = (eleve: string, etape: number, etapes: ProgressionLue["etapes"], erreurs: ProgressionLue["erreurs"] = {}): ProgressionLue => ({
  eleve,
  entreprise: "nova",
  etape,
  etapes,
  erreurs,
  majLe: new Date(0),
});

describe("vueDeLaClasse", () => {
  const vue = vueDeLaClasse(chapitre, [
    p("Zoé", 3, {
      [intro!.id]: { essais: 0, reussi: true, aide: false },
      [apport!.id]: { essais: 1, reussi: true, aide: false },
      [emprunt!.id]: { essais: 3, reussi: true, aide: true },
    }, { [apport!.id]: [] , [emprunt!.id]: ["La dette envers la banque se passe au crédit.", "La dette envers la banque se passe au crédit."] }),
    p("Adam", 2, {
      [intro!.id]: { essais: 0, reussi: true, aide: false },
      [apport!.id]: { essais: 2, reussi: true, aide: false },
    }, { [apport!.id]: ["L'argent reçu en banque se passe au débit."], [emprunt!.id]: ["La dette envers la banque se passe au crédit."] }),
    p("Inès", 0, {}),
  ]);

  it("une ligne par élève, dans l'ordre alphabétique, avec ses cases", () => {
    expect(vue.eleves.map((e) => e.eleve)).toEqual(["Adam", "Inès", "Zoé"]);
    const zoe = vue.eleves.find((e) => e.eleve === "Zoé")!;
    expect(zoe.cases.slice(0, 4)).toEqual(["premier-coup", "premier-coup", "aidee", "en-cours"]);
    expect(zoe.premierCoup).toBe(1);
    expect(zoe.aidees).toBe(1);
    const adam = vue.eleves.find((e) => e.eleve === "Adam")!;
    expect(adam.cases.slice(0, 3)).toEqual(["premier-coup", "reussie", "en-cours"]);
    expect(vue.eleves.find((e) => e.eleve === "Inès")!.cases[0]).toBe("en-cours");
    expect(vue.finis).toBe(0);
  });

  it("par étape : premier coup, avec la correction, et les remarques comptées en élèves", () => {
    const e = vue.etapes.find((x) => x.id === emprunt!.id)!;
    expect(e.aidees).toBe(1);
    expect(e.premierCoup).toBe(0);
    expect(e.remarques).toEqual([{ texte: "La dette envers la banque se passe au crédit.", eleves: 2 }]);
    const a = vue.etapes.find((x) => x.id === apport!.id)!;
    expect(a.premierCoup).toBe(1);
    expect(a.remarques).toEqual([{ texte: "L'argent reçu en banque se passe au débit.", eleves: 1 }]);
    expect(vue.etapes.find((x) => x.id === intro!.id)!.notee).toBe(false);
  });
});

describe("vueDeLaClasse, objectif par objectif", () => {
  // Deux élèves qui ont fini le premier chapitre : l'un tout du premier coup, l'autre avec la
  // correction sur l'étape du premier objectif. Un troisième, en route, ne compte pas encore.
  const notees = chapitre.etapes.filter((e) => e.type !== "lecture");
  const tout = (s: { essais: number; reussi: boolean; aide: boolean }) => Object.fromEntries(notees.map((e) => [e.id, s]));
  const k = notees[0]!.objectifs![0]!;
  const vue = vueDeLaClasse(chapitre, [
    p("Zoé", chapitre.etapes.length, tout({ essais: 1, reussi: true, aide: false })),
    p("Adam", chapitre.etapes.length, { ...tout({ essais: 1, reussi: true, aide: false }), [notees[0]!.id]: { essais: 2, reussi: true, aide: true } }),
    p("Inès", 2, {}),
  ]);

  it("compte, parmi les élèves qui ont fini, les acquis, en cours et à revoir de chaque objectif", () => {
    expect(vue.objectifs).toHaveLength(chapitre.objectifs.length);
    expect(vue.objectifs[k]).toEqual({ objectif: chapitre.objectifs[k], acquis: 1, enCours: 0, aRevoir: 1 });
    const autres = vue.objectifs.filter((_, i) => !notees[0]!.objectifs!.includes(i));
    for (const o of autres) expect([o.acquis, o.enCours, o.aRevoir]).toEqual([2, 0, 0]);
  });
});

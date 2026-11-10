import { describe, expect, it } from "vitest";
import { coursDuDiplome } from "../../src/config/cours/par-diplome";

/**
 * LA SCIENCES DE GESTION ET NUMÉRIQUE DE PREMIÈRE, COUVERTE EN ENTIER (lot A du chantier STMG).
 *
 * Les quatre thèmes ne portent plus « en cours » sur /cours?diplome=stmg, et chacun montre les chapitres
 * qui couvrent ses questions officielles (audit du chantier STMG, section 1) : la preuve est écrite dans
 * config/cours/matieres-en-entier.ts, et cette garde vérifie que la page la tient.
 */

const PARTIE = "Première, sciences de gestion et numérique";

const ATTENDUS: Record<string, readonly string[]> = {
  "Thème 1 · De l'individu à l'acteur": ["de-l-individu-a-l-acteur", "la-diversite-des-organisations", "qualification-competences-et-liens-de-travail", "salaire-brut-net-cout", "recruter", "remuneration-et-motivation", "former", "indicateurs-sociaux", "effectif-et-masse-salariale"],
  "Thème 2 · Numérique et intelligence collective": ["donnees-personnelles-et-donnees-ouvertes", "decider-ensemble", "une-information-a-temps", "le-processus-et-le-pgi"],
  "Thème 3 · Création de valeur et performance": ["les-formes-de-la-valeur", "la-performance-globale", "valeur-ajoutee-et-partage", "lire-le-compte-de-resultat", "rentabilite", "marche-et-part-de-marche"],
  "Thème 4 · Temps et risque": ["assez-vendre-pour-ne-rien-perdre", "prevoir-sa-tresorerie", "le-temps-de-l-organisation", "les-risques-de-la-performance", "fonds-de-roulement-et-tresorerie", "financer-l-entreprise"],
};

describe("la SGN de première, sur la page du bac STMG", () => {
  const blocs = coursDuDiplome("stmg")!.blocs.filter((b) => b.partie === PARTIE);

  it("compte quatre thèmes, aucun « en cours »", () => {
    expect(blocs.map((b) => b.bloc)).toEqual(Object.keys(ATTENDUS));
    for (const b of blocs) expect(b.enCours, b.bloc!).toBe(false);
  });

  it("chaque thème montre les chapitres qui couvrent ses questions", () => {
    for (const b of blocs) {
      const codes = b.chapitres.map((c) => c.chapitre.code);
      for (const code of ATTENDUS[b.bloc!]!) expect(codes, `${b.bloc} : ${code}`).toContain(code);
    }
  });

  it("une information qui circule à temps se range sous le thème 2, qu'elle cite en premier", () => {
    const t2 = blocs.find((b) => b.bloc === "Thème 2 · Numérique et intelligence collective")!;
    const t4 = blocs.find((b) => b.bloc === "Thème 4 · Temps et risque")!;
    expect(t2.chapitres.some((c) => c.chapitre.code === "une-information-a-temps")).toBe(true);
    expect(t4.chapitres.some((c) => c.chapitre.code === "une-information-a-temps")).toBe(false);
  });
});

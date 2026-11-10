import { describe, expect, it } from "vitest";
import { coursDuDiplome } from "../../src/config/cours/par-diplome";

/**
 * LA MERCATIQUE DE TERMINALE, COUVERTE EN ENTIER (lot D du chantier STMG).
 *
 * Les trois thèmes ne portent plus « en cours » sur /cours?diplome=stmg, et chacun montre les chapitres
 * qui couvrent ses questions officielles (audit du chantier STMG, section 4) : la preuve est écrite dans
 * config/cours/matieres-en-entier.ts, et cette garde vérifie que la page la tient.
 */

const PARTIE = "Terminale, mercatique";

const ATTENDUS: Record<string, readonly string[]> = {
  "Thème 1 · La définition de l'offre": ["segmenter-et-cibler", "positionner-l-offre", "l-experience-client", "prix-psychologique", "demande-et-prix", "les-politiques-tarifaires"],
  "Thème 2 · La distribution de l'offre": ["canaux-de-distribution", "le-parcours-client", "vendre-en-ligne"],
  "Thème 3 · La communication de l'offre": ["ce-que-rapporte-la-communication", "le-plan-de-communication", "fideliser-grace-au-numerique", "influence-communaute-et-e-reputation"],
};

describe("la mercatique de terminale, sur la page du bac STMG", () => {
  const blocs = coursDuDiplome("stmg")!.blocs.filter((b) => b.partie === PARTIE);

  it("compte trois thèmes, aucun « en cours »", () => {
    expect(blocs.map((b) => b.bloc)).toEqual(Object.keys(ATTENDUS));
    for (const b of blocs) expect(b.enCours, b.bloc!).toBe(false);
  });

  it("chaque thème montre les chapitres qui couvrent ses questions", () => {
    for (const b of blocs) {
      const codes = b.chapitres.map((c) => c.chapitre.code);
      for (const code of ATTENDUS[b.bloc!]!) expect(codes, `${b.bloc} : ${code}`).toContain(code);
    }
  });

  it("l'expérience client se range sous la mercatique, et non sous la SGN avec qui elle partage la valeur perçue", () => {
    const sgn = coursDuDiplome("stmg")!.blocs.find((b) => b.partie === "Première, sciences de gestion et numérique" && b.bloc === "Thème 3 · Création de valeur et performance")!;
    expect(sgn.chapitres.some((c) => c.chapitre.code === "l-experience-client")).toBe(false);
    expect(blocs[0]!.chapitres.some((c) => c.chapitre.code === "l-experience-client")).toBe(true);
  });
});

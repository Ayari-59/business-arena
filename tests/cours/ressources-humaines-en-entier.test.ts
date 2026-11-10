import { describe, expect, it } from "vitest";
import { blocsDuChapitre } from "../../src/config/couverture";
import { MATIERES_COUVERTES_EN_ENTIER } from "../../src/config/cours/matieres-en-entier";
import { coursDuDiplome } from "../../src/config/cours/par-diplome";
import { CHAPITRES } from "../../src/config/cours/registre";

/**
 * LES RESSOURCES HUMAINES ET LA COMMUNICATION DE TERMINALE, COUVERTES EN ENTIER (lot E du chantier STMG).
 *
 * Les trois thèmes ne portent plus « en cours » sur /cours?diplome=stmg, et chacun montre les chapitres qui
 * couvrent ses neuf questions (audit du chantier STMG, section 5) ; la preuve est dans
 * config/cours/matieres-en-entier.ts. Un chapitre s'affiche sous l'entrée que le référentiel nomme la
 * première (par-diplome.ts) : les chapitres du lot ne citent donc que leur thème de ressources humaines, et
 * « Recruter », « Former » et « Rémunération et motivation » ne citent plus le thème 1 de la SGN, nommé
 * avant. Les chapitres partagés de la partie commune (la GPEC, la communication) restent sous elle.
 */

const PARTIE = "Terminale, ressources humaines et communication";

const ATTENDUS: Record<string, readonly string[]> = {
  "Thème 1 · Les compétences au service de l'organisation et l'organisation au service du développement des compétences": [
    "recruter-et-integrer",
    "recruter",
    "evaluer-le-travail",
    "developper-les-competences",
    "former",
  ],
  "Thème 2 · Des facteurs de motivation et de satisfaction : qualité de vie au travail et rémunération": [
    "qualite-de-vie-et-conditions-de-travail",
    "sante-et-securite-au-travail",
    "au-dela-du-salaire",
    "remuneration-et-motivation",
  ],
  "Thème 3 · La recherche de cohésion, un levier d'amélioration des relations de travail et du climat social": [
    "le-climat-social-et-le-conflit",
    "le-dialogue-social",
    "communication-interne-et-marque-employeur",
  ],
};

const chapitre = (code: string) => CHAPITRES.find((c) => c.code === code)!;

describe("les ressources humaines et la communication de terminale, sur la page du bac STMG", () => {
  const blocs = coursDuDiplome("stmg")!.blocs.filter((b) => b.partie === PARTIE);

  it("compte trois thèmes, aucun « en cours »", () => {
    expect(blocs.map((b) => b.bloc)).toEqual(Object.keys(ATTENDUS));
    for (const b of blocs) expect(b.enCours, b.bloc!).toBe(false);
  });

  it("chaque thème montre les chapitres qui couvrent ses questions, tous au niveau du lycée", () => {
    for (const b of blocs) {
      const codes = b.chapitres.map((c) => c.chapitre.code);
      for (const code of ATTENDUS[b.bloc!]!) expect(codes, `${b.bloc} : ${code}`).toContain(code);
      for (const l of b.chapitres) expect(l.chapitre.palier, l.chapitre.code).toBe(1);
    }
  });

  it("chaque thème est déclaré complet une fois, avec sa preuve", () => {
    for (const bloc of Object.keys(ATTENDUS)) {
      const m = MATIERES_COUVERTES_EN_ENTIER.filter((x) => x.formation === "stmg" && x.partie === PARTIE && x.bloc === bloc);
      expect(m, bloc).toHaveLength(1);
      expect(m[0]!.preuve, bloc).toMatch(/lot E/);
    }
  });

  it("les chapitres déplacés ne citent plus le thème 1 de la SGN, et le coût du travail y reste", () => {
    for (const code of ["recruter", "former", "remuneration-et-motivation"]) expect(blocsDuChapitre(chapitre(code), "stmg"), code).toHaveLength(1);
    const sgn1 = coursDuDiplome("stmg")!.blocs.find((b) => b.partie === "Première, sciences de gestion et numérique" && b.bloc === "Thème 1 · De l'individu à l'acteur")!;
    const codes = sgn1.chapitres.map((c) => c.chapitre.code);
    for (const code of ["salaire-brut-net-cout", "effectif-et-masse-salariale", "indicateurs-sociaux", "qualification-competences-et-liens-de-travail"]) expect(codes, code).toContain(code);
  });

  it("les chapitres partagés de la partie commune restent sous elle, cités en second par les ressources humaines", () => {
    expect(blocsDuChapitre(chapitre("les-ressources-pour-produire"), "stmg")).toHaveLength(2);
    expect(blocsDuChapitre(chapitre("communiquer-avec-chaque-acteur"), "stmg")).toHaveLength(2);
    for (const b of blocs) for (const code of ["les-ressources-pour-produire", "communiquer-avec-chaque-acteur"]) expect(b.chapitres.map((c) => c.chapitre.code)).not.toContain(code);
  });
});

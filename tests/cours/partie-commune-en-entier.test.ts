import { describe, expect, it } from "vitest";
import { blocsDuChapitre } from "../../src/config/couverture";
import { coursDuDiplome } from "../../src/config/cours/par-diplome";
import { CHAPITRES } from "../../src/config/cours/registre";

/**
 * LA PARTIE COMMUNE DE TERMINALE (management, sciences de gestion et numérique), COUVERTE EN ENTIER, ET LA
 * GESTION ET FINANCE AU NIVEAU DU LYCÉE (lot C du chantier STMG).
 *
 * Les trois thèmes de la partie commune ne portent plus « en cours » sur /cours?diplome=stmg, et chacun
 * montre les chapitres qui couvrent ses douze questions (audit du chantier STMG, section 3) ; la preuve
 * est dans config/cours/matieres-en-entier.ts. La gestion et finance montre désormais ses versions lycée
 * des questions 1.3, 1.4 et 3.4 ; le seuil de rentabilité du lot A la sert en second.
 */

const PARTIE = "Terminale, enseignement commun";

const ATTENDUS: Record<string, readonly string[]> = {
  "Thème 1 · Les organisations et l'activité de production de biens et de services": [
    "une-offre-pour-un-besoin",
    "les-ressources-pour-produire",
    "organiser-la-production",
    "le-numerique-dans-la-production",
    "organiser-le-travail-et-coordonner",
    "cout-complet-ou-cout-specifique",
    "produire-bien",
  ],
  "Thème 2 · Les organisations et les acteurs": ["federer-les-acteurs", "le-client-a-l-ere-numerique", "communiquer-avec-chaque-acteur", "les-acteurs-et-la-valeur"],
  "Thème 3 · Les organisations et la société": ["ethique-transparence-et-egalite", "les-modes-de-vie-changent", "donnees-et-algorithmes", "s-implanter-sur-un-territoire"],
};

const chapitre = (code: string) => CHAPITRES.find((c) => c.code === code)!;

describe("la partie commune de terminale, sur la page du bac STMG", () => {
  const blocs = coursDuDiplome("stmg")!.blocs.filter((b) => b.partie === PARTIE);

  it("compte trois thèmes, aucun « en cours »", () => {
    expect(blocs.map((b) => b.bloc)).toEqual(Object.keys(ATTENDUS));
    for (const b of blocs) expect(b.enCours, b.bloc!).toBe(false);
  });

  it("chaque thème montre les chapitres qui couvrent ses questions, tous au niveau du lycée", () => {
    for (const b of blocs) {
      const codes = b.chapitres.map((c) => c.chapitre.code);
      for (const code of ATTENDUS[b.bloc!]!) expect(codes, `${b.bloc} : ${code}`).toContain(code);
      for (const code of ATTENDUS[b.bloc!]!) expect(chapitre(code).palier, code).toBe(1);
    }
  });

  it("le contrôle des coûts (1.3) cite d'abord la gestion et finance, et se range sous la partie commune, que le texte nomme avant", () => {
    const c = chapitre("cout-complet-ou-cout-specifique");
    expect(blocsDuChapitre(c, "stmg")).toEqual(["Thème 3 · Accompagner la prise de décision", "Thème 1 · Les organisations et l'activité de production de biens et de services"]);
    // Un chapitre ne paraît qu'une fois, sous l'entrée que le référentiel nomme la première (par-diplome.ts).
    const gf3 = coursDuDiplome("stmg")!.blocs.find((b) => b.partie === "Terminale, gestion et finance" && b.bloc === "Thème 3 · Accompagner la prise de décision")!;
    expect(gf3.chapitres.map((l) => l.chapitre.code)).not.toContain("cout-complet-ou-cout-specifique");
  });

  it("les chapitres partagés avec les ressources humaines citent d'abord la partie commune", () => {
    expect(blocsDuChapitre(chapitre("les-ressources-pour-produire"), "stmg")[0]).toBe("Thème 1 · Les organisations et l'activité de production de biens et de services");
    expect(blocsDuChapitre(chapitre("communiquer-avec-chaque-acteur"), "stmg")[0]).toBe("Thème 2 · Les organisations et les acteurs");
    const rh = coursDuDiplome("stmg")!.blocs.filter((b) => b.partie === "Terminale, ressources humaines et communication");
    for (const b of rh) expect(b.chapitres.map((c) => c.chapitre.code)).not.toContain("les-ressources-pour-produire");
  });
});

describe("la gestion et finance, au niveau du lycée", () => {
  const gf = coursDuDiplome("stmg")!.blocs.filter((b) => b.partie === "Terminale, gestion et finance");
  const codes = (bloc: string) => gf.find((b) => b.bloc === bloc)!.chapitres.map((c) => c.chapitre.code);

  it("1.3 et 1.4 : « Investir, amortir, clôturer » sous le thème 1", () => {
    expect(codes("Thème 1 · Appliquer les règles comptables")).toContain("investir-amortir-cloturer");
  });

  it("3.4 : « Coût complet ou coût spécifique » cite d'abord le thème 3, et le seuil du lot A le cite en second", () => {
    expect(blocsDuChapitre(chapitre("cout-complet-ou-cout-specifique"), "stmg")[0]).toBe("Thème 3 · Accompagner la prise de décision");
    expect(chapitre("cout-complet-ou-cout-specifique").parcours).toBe("stmg-gf");
    const seuil = chapitre("assez-vendre-pour-ne-rien-perdre");
    expect(blocsDuChapitre(seuil, "stmg")).toEqual(["Thème 4 · Temps et risque", "Thème 3 · Accompagner la prise de décision"]);
    expect(seuil.palier).toBe(1);
  });

  it("aucun chapitre de gestion et finance affiché n'est au-dessus du palier du lycée", () => {
    expect(codes("Thème 3 · Accompagner la prise de décision").length).toBeGreaterThan(0);
    for (const b of gf) for (const l of b.chapitres) expect(l.chapitre.palier, l.chapitre.code).toBe(1);
  });
});

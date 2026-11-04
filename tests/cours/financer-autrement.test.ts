import { describe, expect, it } from "vitest";
import { FINANCER_AUTREMENT, SOLUTION_DU_PLAN, compteCourantNecessaire, financerAutrement, planDuLaboratoire } from "../../src/config/cours/chapitres/financer-autrement";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { casDuChapitre } from "../../src/config/cours/situations";
import { DEUX_FACONS_DE_REMBOURSER, deuxFaconsDeRembourser } from "../../src/config/cours/situations/par-chapitre/deux-facons-de-rembourser";
import type { Chapitre } from "../../src/config/cours/types";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, etape, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte } from "./gardes-du-lycee";

/**
 * FINANCER AUTREMENT, SUR LA LIGNE SEMI-AUTOMATIQUE DE LA GAMME DE NOVA DANS LE MONDE DU COURS, ET
 * SON CAS : DEUX FAÇONS DE REMBOURSER.
 *
 * Refait à la main : la ligne à 150 000 €, la subvention de 20 % ; pour 40 000 €, la banque à 5 %
 * sur 5 ans en parts égales, le compte courant à 3 % et le prêt participatif à 6 % sur 4 ans,
 * remboursés à la fin ; la capacité d'autofinancement de 105 297,07 €.
 */

const ch = chapitreDuCas(FINANCER_AUTREMENT, NOVA);
const c = (x: number) => Math.round(x * 100) / 100 + 0;

function laBonneReponseNeSeDevinePas(source: Chapitre) {
  const x = chapitreDuCas(source, NOVA);
  for (const [i, e] of x.etapes.entries()) {
    if (e.type !== "choix") continue;
    const options = e.options(NOVA, etatAvant(x, NOVA, i));
    const justes = options.filter((o) => o.juste);
    expect(justes, e.id).toHaveLength(1);
    expect(justes[0]!.texte.length, `${source.code} · ${e.id} : la bonne réponse est la plus longue`).toBeLessThan(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  }
}

describe("financer autrement la ligne de NOVA", () => {
  const k = financerAutrement(NOVA);

  it("est au registre : le programme du Bac STMG gestion et finance, son thème, ses prérequis", () => {
    expect(PROGRAMME["stmg-gf"][1]).toContain(FINANCER_AUTREMENT.titre);
    expect(CHAPITRES).toContain(FINANCER_AUTREMENT);
    expect(FINANCER_AUTREMENT.blocs).toEqual(["STMG Thème 3 · Accompagner la prise de décision"]);
    expect(FINANCER_AUTREMENT.prerequis).toEqual(["financer-l-entreprise", "capacite-de-remboursement"]);
    expect(casDuChapitre(FINANCER_AUTREMENT.code)).toBe(DEUX_FACONS_DE_REMBOURSER);
  });

  it("la subvention : 20 % de 150 000 €, 120 000 € restent à financer", () => {
    expect(etape(ch, "subvention", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([30_000, 120_000]);
  });

  it("une seule bonne réponse : le compte courant se rembourse, le prêt participatif rapporte des intérêts", () => {
    expect(etape(ch, "compte-courant", "choix").options(NOVA, VIDE).filter((o) => o.juste).map((o) => o.texte)).toEqual(["Ils seront remboursés, sans part de capital de plus"]);
    expect(etape(ch, "participatif", "choix").options(NOVA, VIDE).filter((o) => o.juste).map((o) => o.texte)).toEqual(["Leur argent, avec des intérêts"]);
  });

  it("pour 40 000 € : 6 000 €, 6 000 € et 9 600 € d'intérêts ; 10 000 €, 1 200 € et 2 400 € la première année", () => {
    expect(etape(ch, "le-cout-total", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([40_000 * 0.05 * 3, 40_000 * 0.03 * 5, 40_000 * 0.06 * 4]);
    expect(etape(ch, "la-premiere-annee", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([8_000 + 2_000, 1_200, 2_400]);
  });

  it("le curseur : 63 637 € en compte courant, au-delà des 40 000 € que les associés peuvent prêter", () => {
    // Première année : 25 % de ce que prête la banque (un cinquième de capital, 5 % d'intérêts), 3 % du compte courant.
    // 30 000 − 0,22 x ≤ 16 000 : x ≥ 63 636,36.
    expect(compteCourantNecessaire(k)).toBe(63_637);
    gardeDuCurseur(ch, "combien-en-compte-courant", 63_637);
    expect(planDuLaboratoire(k, { compteCourant: 40_000 }).premiereAnnee).toBe(21_200);
  });

  it("le laboratoire : 40 000 € en compte courant, 30 000 € de prêt participatif, 50 000 € à la banque", () => {
    gardeDuLaboratoire(ch, "le-laboratoire-du-plan-de-financement");
    const x = planDuLaboratoire(k, SOLUTION_DU_PLAN);
    expect([x.banque, x.interets, x.premiereAnnee]).toEqual([50_000, 20_700, 15_500]);
    const defi = etape(ch, "le-laboratoire-du-plan-de-financement", "simulation").defi(NOVA);
    expect(defi.atteint({ compteCourant: 40_000, participatif: 40_000 })).toBe(false); // 21 600 € d'intérêts
    expect(defi.atteint({ compteCourant: 40_000, participatif: 20_000 })).toBe(false); // 17 400 € la première année
    expect(defi.atteint({ compteCourant: 30_000, participatif: 100_000 })).toBe(false); // plus que les 120 000 € à financer
  });

  it("ce que dira la banque : 188 000 €, 1,79 an, 54,8 %", () => {
    expect(etape(ch, "ce-que-dira-la-banque", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([188_000, 1.79, 54.8]);
  });

  it("les textes sont propres, une seule bonne réponse, jamais la plus longue, les notions existent", () => {
    gardesDeTexte(FINANCER_AUTREMENT);
    laBonneReponseNeSeDevinePas(FINANCER_AUTREMENT);
  });
});

describe("le cas : deux façons de rembourser", () => {
  const r = deuxFaconsDeRembourser(NOVA);
  it("120 000 € à 5 % sur 5 ans : 30 000 € puis 27 716,98 € la première année ; 18 000 € puis 18 584,88 € d'intérêts", () => {
    expect(r.montant).toBe(120_000);
    expect([r.capitalDesParts, r.interetsDeLaPremiereAnnee, r.parts.premiereAnnee]).toEqual([24_000, 6_000, 30_000]);
    expect(r.parts.interets).toBe(120_000 * 0.05 * 3);
    expect(r.echeance).toBe(27_716.98);
    expect(r.capitalDeLaPremiereEcheance).toBe(c(27_716.98 - 6_000));
    expect(r.constantes.interets).toBe(18_584.88);
    expect(r.allegement).toBe(c(30_000 - 27_716.98));
    expect(r.surcout).toBe(c(18_584.88 - 18_000));
  });
  it("les textes sont propres, une seule bonne réponse, jamais la plus longue", () => {
    gardesDeTexte(DEUX_FACONS_DE_REMBOURSER);
    laBonneReponseNeSeDevinePas(DEUX_FACONS_DE_REMBOURSER);
  });
});

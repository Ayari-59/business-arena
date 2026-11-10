import { describe, expect, it } from "vitest";
import {
  BAISSE_DU_DEFI,
  CAPACITE_DE_REMBOURSEMENT,
  EMPRUNT_DU_DEFI,
  SOLUTION_DE_LA_BANQUE,
  banqueDuLaboratoire,
  capaciteDeRemboursement,
} from "../../src/config/cours/chapitres/capacite-de-remboursement";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { casDuChapitre } from "../../src/config/cours/situations";
import { LA_BANQUE_TESTE_UNE_ANNEE_DIFFICILE, anneeDifficile } from "../../src/config/cours/situations/par-chapitre/la-banque-teste-une-annee-difficile";
import type { Chapitre } from "../../src/config/cours/types";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, etape, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte } from "./gardes-du-lycee";

/**
 * LA CAPACITÉ DE REMBOURSEMENT ET LES LIMITES DE L'ANALYSE FONCTIONNELLE, SUR LE PREMIER EXERCICE
 * DE NOVA DU MONDE DU COURS, ET SON CAS : LA BANQUE TESTE UNE ANNÉE DIFFICILE.
 *
 * Refait à la main : la capacité d'autofinancement, 79 225,96 € + 26 071,11 € ; l'emprunt de
 * 68 000 € ; les capitaux propres de 229 225,96 € et les ressources durables de 323 297,07 € ;
 * le loyer de 19 700 € par mois.
 */

const ch = chapitreDuCas(CAPACITE_DE_REMBOURSEMENT, NOVA);
const c = (x: number) => Math.round(x * 100) / 100 + 0;
const CAF = c(79_225.96 + 26_071.11);

/** Une seule bonne réponse, et jamais la plus longue des options. */
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

describe("la capacité de remboursement de NOVA", () => {
  const k = capaciteDeRemboursement(NOVA);

  it("est au registre : le programme du Bac STMG gestion et finance, son thème, ses prérequis", () => {
    expect(PROGRAMME["stmg-gf"][1]).toContain(CAPACITE_DE_REMBOURSEMENT.titre);
    expect(CHAPITRES).toContain(CAPACITE_DE_REMBOURSEMENT);
    expect(CAPACITE_DE_REMBOURSEMENT.blocs).toEqual(["STMG Thème 2 · Analyser la situation de l'entreprise"]);
    expect(CAPACITE_DE_REMBOURSEMENT.prerequis).toEqual(["fonds-de-roulement-et-tresorerie", "financer-l-entreprise"]);
    expect(CAPACITE_DE_REMBOURSEMENT.ensuite).toEqual(["financer-autrement"]);
    expect(casDuChapitre(CAPACITE_DE_REMBOURSEMENT.code)).toBe(LA_BANQUE_TESTE_UNE_ANNEE_DIFFICILE);
  });

  it("la capacité de remboursement et l'indépendance se refont à la main", () => {
    expect(etape(ch, "capacite", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([CAF, 0.65]); // 68 000 ÷ 105 297,07
    expect(etape(ch, "independance", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([70.9]); // 229 225,96 ÷ 323 297,07
    expect(etape(ch, "le-banquier", "choix").options(NOVA, VIDE).filter((o) => o.juste).map((o) => o.texte)).toEqual(["Elle peut emprunter : les deux règles sont tenues"]);
  });

  it("le curseur : 353 188 €, quatre années de capacité moins l'emprunt", () => {
    expect(k.permisParLaCapacite).toBe(Math.floor(4 * CAF - 68_000));
    gardeDuCurseur(ch, "jusqu-ou-emprunter", 353_188);
    expect(k.permisParLIndependance).toBe(135_154);
  });

  it("le laboratoire : 100 000 € empruntés tiennent les deux règles avec 15 % de ventes en moins, 110 000 € non", () => {
    gardeDuLaboratoire(ch, "le-laboratoire-de-la-banque");
    expect(SOLUTION_DE_LA_BANQUE).toEqual({ emprunt: EMPRUNT_DU_DEFI, baisse: BAISSE_DU_DEFI });
    const x = banqueDuLaboratoire(k, SOLUTION_DE_LA_BANQUE);
    expect(x.caf).toBe(43_694.07);
    expect(Math.round(x.capaciteDeRemboursement * 100) / 100).toBe(3.84); // 168 000 ÷ 43 694,07
    const defi = etape(ch, "le-laboratoire-de-la-banque", "simulation").defi(NOVA);
    expect(defi.atteint({ emprunt: 110_000, baisse: 15 })).toBe(false); // 4,11 ans
    expect(defi.atteint({ emprunt: 100_000, baisse: 20 })).toBe(false); // 20 % : l'année est trop mauvaise
    expect(defi.atteint({ emprunt: 100_000, baisse: 10 })).toBe(false); // le défi demande 15 % au moins
    expect(defi.atteint({ emprunt: 140_000, baisse: 0 })).toBe(false); // l'indépendance tombe sous 50 %
  });

  it("les loyers à venir : 236 400 €, et 2,89 ans de capacité s'ils étaient comptés", () => {
    expect(etape(ch, "les-loyers-a-venir", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([236_400, 2.89]); // 304 400 ÷ 105 297,07
  });

  it("les textes sont propres, une seule bonne réponse, jamais la plus longue, les notions existent", () => {
    gardesDeTexte(CAPACITE_DE_REMBOURSEMENT);
    laBonneReponseNeSeDevinePas(CAPACITE_DE_REMBOURSEMENT);
  });
});

describe("le cas : la banque teste une année difficile", () => {
  const r = anneeDifficile(NOVA);
  it("10 % de ventes en moins et 150 000 € empruntés : 3,48 ans, mais 48,43 % d'indépendance", () => {
    expect(r.enceintes).toBe(21_208);
    // (23 564 − 21 208) × 21 € de marge en moins, 7 500 € d'intérêts : 42 991,96 € avant impôt.
    expect(c(99_967.96 - 2_356 * 21 - 7_500)).toBe(42_991.96);
    expect(r.resultatNet).toBe(c(42_991.96 - 6_498));
    expect(r.caf).toBe(c(36_493.96 + 26_071.11));
    expect(r.dettes).toBe(218_000);
    expect(r.capacite).toBe(3.48);
    expect(r.ressources).toBe(473_297.07);
    expect(r.independance).toBe(48.43);
    expect([r.capaciteTient, r.independanceTient]).toEqual([true, false]);
    expect(r.pretPossible).toBe(c(2 * 229_225.96 - 323_297.07));
  });
  it("les textes sont propres, une seule bonne réponse, jamais la plus longue", () => {
    gardesDeTexte(LA_BANQUE_TESTE_UNE_ANNEE_DIFFICILE);
    laBonneReponseNeSeDevinePas(LA_BANQUE_TESTE_UNE_ANNEE_DIFFICILE);
  });
});

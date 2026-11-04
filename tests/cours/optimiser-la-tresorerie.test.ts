import { describe, expect, it } from "vitest";
import {
  COUT_MAXIMAL_DU_DEFI,
  OPTIMISER_LA_TRESORERIE,
  PRIX_DU_DEFI,
  SOLUTION_DU_MANQUE,
  manqueDuLaboratoire,
  optimiser,
} from "../../src/config/cours/chapitres/optimiser-la-tresorerie";
import { LA_BANQUE_PROPOSE_L_ESCOMPTE, escompteProposePar } from "../../src/config/cours/situations/par-chapitre/la-banque-propose-l-escompte";
import { SOLUTIONS_DU_MANQUE, agios, couvrirLeManque, prixSansDecouvert } from "../../src/config/cours/monde/tresorerie-a-optimiser";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, etape, gardeDuCurseur, gardeDuLaboratoire, gardesDeTexte } from "./gardes-du-lycee";

/**
 * OPTIMISER LA TRÉSORERIE, SUR LE BILAN DU 31 DÉCEMBRE DU PREMIER EXERCICE DE NOVA, ET SON CAS : LA
 * BANQUE PROPOSE L'ESCOMPTE.
 *
 * Refait à la main : 115 734,87 € en banque, 136 934,58 € sur le compte à terme (133 000 € et
 * 3 934,58 € d'intérêts), 81 000 € dus aux fournisseurs et 41 119,27 € à l'État et au personnel ; le
 * compte à terme bloqué 6 jours après la clôture (du 31 décembre au 6 janvier), la facture de
 * décembre de CampusTech, 22 656 €, à 70 jours (au 10 mars), sur l'année de 360 jours.
 */

const ch = chapitreDuCas(OPTIMISER_LA_TRESORERIE, NOVA);
const c = (x: number) => Math.round(x * 100) / 100 + 0;
const BANQUE = 115_734.87;
const TRESORERIE = c(BANQUE + 136_934.58);
const A_PAYER = c(81_000 + 41_119.27);
const EXCEDENT = c(TRESORERIE - A_PAYER);
const MANQUE = c(PRIX_DU_DEFI - BANQUE);

describe("l'excédent de NOVA et ses placements", () => {
  const k = optimiser(NOVA);

  it("la trésorerie est celle du chapitre « Fonds de roulement », et l'excédent se refait à la main", () => {
    expect(k.tresorerie).toBe(TRESORERIE);
    expect(EXCEDENT).toBe(130_550.18);
    expect(etape(ch, "l-excedent", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([A_PAYER, EXCEDENT, c(EXCEDENT * 0.03)]);
  });

  it("le partage : 60 000 € disponibles à 1 %, le reste bloqué à 3 %", () => {
    const bloque = c(EXCEDENT - 60_000);
    expect(etape(ch, "partager-l-excedent", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([bloque, c(bloque * 0.03), 600, c(c(bloque * 0.03) + 600)]);
    expect(etape(ch, "quel-placement", "choix").options(NOVA, VIDE).filter((o) => o.juste).map((o) => o.texte)).toEqual(["Sur un compte rémunéré, disponible à tout moment"]);
  });
});

describe("le manque du 31 décembre et ce qui le couvre", () => {
  const k = optimiser(NOVA);

  it("6 jours de blocage, 70 jusqu'à l'échéance de la facture", () => {
    expect(k.joursDeBlocage).toBe(6);
    expect(k.facture).toEqual({ ttc: 22_656, jours: 70, echeance: { jour: 10, mois: 3, exercice: 1 } });
  });

  it("le curseur : 115 734 €, ce qu'il y a en banque", () => {
    expect(prixSansDecouvert(k)).toBe(Math.floor(BANQUE));
    gardeDuCurseur(ch, "payer-sans-decouvert", 115_734);
  });

  it("le coût de chaque solution, refait à la main", () => {
    expect(MANQUE).toBe(34_265.13);
    expect(etape(ch, "couvrir-le-manque", "montants").champs(NOVA, VIDE).map((x) => x.attendu)).toEqual([MANQUE, c((MANQUE * 0.1 * 6) / 360), c((MANQUE * 0.02 * 6) / 360)]);
    expect(couvrirLeManque(k, PRIX_DU_DEFI, "decouvert").cout).toBe(57.11);
    expect(couvrirLeManque(k, PRIX_DU_DEFI, "compte-courant").cout).toBe(11.42);
    // L'escompte : 22 656 × 6 % × 70 ÷ 360, puis le découvert sur 11 609,13 € pendant 6 jours.
    expect(couvrirLeManque(k, PRIX_DU_DEFI, "escompte").cout).toBe(c(c((22_656 * 0.06 * 70) / 360) + c(((MANQUE - 22_656) * 0.1 * 6) / 360)));
    // Casser le compte à terme : ses intérêts perdus, et plus de manque.
    expect(couvrirLeManque(k, PRIX_DU_DEFI, "casser")).toMatchObject({ cout: 3_934.58, decouvert: 0 });
    // Sans manque, aucune solution ne coûte rien.
    for (const s of SOLUTIONS_DU_MANQUE) expect(couvrirLeManque(k, 100_000, s).cout).toBe(0);
  });

  it("le laboratoire : le découvert va jusqu'à 170 000 €, l'avance des associés plus loin, l'escompte et le compte cassé jamais", () => {
    gardeDuLaboratoire(ch, "le-laboratoire-de-la-tresorerie");
    expect(SOLUTION_DU_MANQUE).toEqual({ prix: 150_000, solution: 0 });
    const defi = etape(ch, "le-laboratoire-de-la-tresorerie", "simulation").defi(NOVA);
    expect(defi.atteint({ prix: 170_000, solution: 0 })).toBe(true); // 54 265,13 × 10 % × 6 ÷ 360 = 90,44
    expect(defi.atteint({ prix: 180_000, solution: 0 })).toBe(false); // 107,11
    expect(defi.atteint({ prix: 250_000, solution: 2 })).toBe(true); // 44,76
    expect(defi.atteint({ prix: 150_000, solution: 1 })).toBe(false);
    expect(defi.atteint({ prix: 150_000, solution: 3 })).toBe(false);
    expect(defi.atteint({ prix: 140_000, solution: 0 })).toBe(false);
    expect(manqueDuLaboratoire(NOVA, { prix: 250_000, solution: 3 }).decouvert).toBe(c(250_000 - BANQUE - 133_000));
    expect(COUT_MAXIMAL_DU_DEFI).toBe(100);
  });

  it("une seule bonne réponse, partout", () => {
    expect(etape(ch, "predire-le-paiement", "choix").options(NOVA, VIDE).filter((o) => o.juste).map((o) => o.texte)).toEqual(["La banque passe à découvert jusqu'au 6 janvier"]);
    expect(etape(ch, "agir-sur-le-besoin", "choix").options(NOVA, VIDE).filter((o) => o.juste).map((o) => o.texte)).toEqual(["Faire baisser le besoin en fonds de roulement"]);
  });

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(OPTIMISER_LA_TRESORERIE);
  });
});

describe("le cas : la banque propose l'escompte", () => {
  const r = escompteProposePar(NOVA);
  it("264,32 € d'agios, moins qu'un découvert de 70 jours, plus qu'un découvert de 6", () => {
    expect(r.agiosDEscompte).toBe(c((22_656 * 0.06 * 70) / 360));
    expect(r.agiosDEscompte).toBe(264.32);
    expect(r.netRecu).toBe(c(22_656 - 264.32));
    expect(r.decouvertLong).toBe(agios(22_656, 0.1, 70));
    expect(r.decouvertCourt).toBe(37.76);
    expect(r.decouvertCourt).toBeLessThan(r.agiosDEscompte);
    expect(r.agiosDEscompte).toBeLessThan(r.decouvertLong);
    // Rien ne manque : la banque et le compte à terme couvrent largement ce qu'il faut payer bientôt.
    expect(r.banque + r.placement).toBeGreaterThan(r.aPayerDansLeMois);
  });
  it("les textes sont propres, une seule bonne réponse", () => {
    gardesDeTexte(LA_BANQUE_PROPOSE_L_ESCOMPTE);
  });
});

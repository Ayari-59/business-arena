import { describe, expect, it } from "vitest";
import { LE_COMPTE_CLIENT, compteClientDuChapitre } from "../../src/config/cours/chapitres/le-compte-client";
import { FINANCER_ET_PLACER, financementDuChapitre } from "../../src/config/cours/chapitres/financer-et-placer-la-tresorerie";
import { CREANCES_AU_31_DECEMBRE } from "../../src/config/cours/monde/exercice-de-nova";
import { chaineQuiPaieTard } from "../../src/config/cours/situations/par-chapitre/une-chaine-nouvelle-a-60-jours";
import { VIBRA_REPASSE_COMMANDE } from "../../src/config/cours/situations/par-chapitre/vibra-repasse-commande";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { THEMES } from "../../src/config/cours/themes";
import type { Chapitre } from "../../src/config/cours/types";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";

/**
 * LE COMPTE CLIENT (NOVA en N+1) : chaque chiffre refait à la main, à partir de la facture de CampusTech
 * (320 enceintes à 59 € HT, 22 656 € TTC), de la lettre de change et du factor de « Financer et placer
 * la trésorerie », de Sonora (33 630 € TTC au 416) et des hypothèses du chapitre (le doublon du
 * 10 février, 20 000 € versés sur janvier, Studio Méridien et Vibra, les lignes de crédit, 15 € de frais
 * d'impayé).
 */

const ch = LE_COMPTE_CLIENT;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
const lignesDe = (x: Chapitre, id: string) => etape(chapitreDuCas(x, NOVA), id, "ecriture").ecriture(NOVA).lignes.map((l) => [l.compte, l.sens, l.montant]);

/** Chaque écriture attendue : équilibrée, au plan du cours, des montants positifs, et passe son propre correcteur. */
function gardeDesEcritures(x: Chapitre) {
  let n = 0;
  for (const e of chapitreDuCas(x, NOVA).etapes) {
    if (e.type !== "ecriture") continue;
    n++;
    const a = e.ecriture(NOVA);
    expect(equilibree(enEcriture(a)), e.id).toBe(true);
    for (const l of a.lignes) {
      expect(compteDuPlan(l.compte), `${e.id} ${l.compte}`).toBeDefined();
      expect(l.montant, `${e.id} ${l.compte}`).toBeGreaterThan(0);
    }
    expect(corriger(enSaisie(a), a), e.id).toEqual({ juste: true, remarques: [], notes: [] });
  }
  return n;
}

describe("le compte client : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme de la comptabilité générale (palier 4), au thème, et cite le BTS CG P1", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][4]!);
    expect(ch.parcours).toBe("comptabilite-generale");
    expect(ch.palier).toBe(4);
    expect(ch.blocs).toEqual(["BTS CG P1 · Contrôle et traitement comptable des opérations commerciales"]);
    expect(THEMES.find((t) => t.code === "comptabilite")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["remises-et-reglements", "financer-et-placer-la-tresorerie"]);
    expect(ch.ensuite).toEqual(["fournisseurs-et-banque"]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    ch.objectifs.forEach((_, i) => expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true));
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const x of [ch, VIBRA_REPASSE_COMMANDE]) {
      for (const e of chapitreDuCas(x, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });

  it("chaque écriture est équilibrée, au plan du cours, et passe son correcteur", () => {
    expect(gardeDesEcritures(ch)).toBe(8);
    expect(gardeDesEcritures(VIBRA_REPASSE_COMMANDE)).toBe(1);
  });

  it("la balance âgée tombe juste, ligne et colonne", () => {
    const g = etape(chapitreDuCas(ch, NOVA), "la-balance-agee", "a-completer").grille(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
  });
});

describe("le compte de CampusTech, refait à la main", () => {
  it("le lettrage : octobre, novembre et décembre lettrés ; le second virement du 10 février reste seul ; janvier en lettrage partiel", () => {
    const x = compteClientDuChapitre(NOVA);
    expect(x.lettrage.lettres.map((l) => [l.reference, l.lettre])).toEqual([["octobre", "A"], ["novembre", "B"], ["décembre", "C"]]);
    expect(x.lettrage.nonLettrees.filter((l) => l.credit > 0).map((l) => l.code)).toEqual(["v-nov-bis"]);
    expect(x.lettrage.partielles).toEqual([{ reference: "janvier", lignes: ["f-jan", "v-jan"], reste: 2_656 }]);
    expect(juste(ch, "le-compte-dans-le-pgi")).toEqual(["Je refuse : ce virement paie novembre, c'est un doublon"]);
  });

  it("le solde : 7 factures de 22 656 € au débit, 4 × 22 656 € + 20 000 € au crédit, 47 968 € affichés, 70 624 € justes", () => {
    expect(c(320 * 59 * 1.2)).toBe(22_656);
    expect(c(7 * 22_656 - 4 * 22_656 - 20_000)).toBe(47_968);
    expect(attendus(ch, "le-solde-a-corriger")).toEqual([47_968, 70_624, 22_656]);
    expect(lignesDe(ch, "annuler-le-doublon")).toEqual([["411", "debit", 22_656], ["512", "credit", 22_656]]);
  });

  it("les factures de N au 1er janvier sont celles de la fiche figée", () => {
    const ttc = CREANCES_AU_31_DECEMBRE.filter((k) => k.client === "CampusTech").map((k) => k.ttc);
    expect(ttc).toEqual([22_656, 22_656, 22_656]);
  });
});

describe("la lettre de change, au journal, sans contredire « Financer et placer »", () => {
  it("l'acceptation (413 / 411), la remise (5114 / 413), le bordereau : 22 296,16 € nets, 339,84 € d'agio, 20 € de commission", () => {
    expect(lignesDe(ch, "la-lcr-acceptee")).toEqual([["413", "debit", 22_656], ["411", "credit", 22_656]]);
    expect(lignesDe(ch, "la-remise-a-l-escompte")).toEqual([["5114", "debit", 22_656], ["413", "credit", 22_656]]);
    expect(c((22_656 * 0.09 * 60) / 360)).toBe(339.84);
    expect(lignesDe(ch, "le-bordereau-d-escompte")).toEqual([["512", "debit", 22_296.16], ["6616", "debit", 339.84], ["627", "debit", 20], ["5114", "credit", 22_656]]);
    // Les mêmes chiffres que le chapitre du P6.
    const p6 = financementDuChapitre(NOVA).escompteDec;
    expect([p6.net, p6.agio, p6.commission]).toEqual([22_296.16, 339.84, 20]);
    expect(FINANCER_ET_PLACER.code).toBe("financer-et-placer-la-tresorerie");
  });

  it("l'engagement hors bilan : 22 656 € au 31 janvier, rien au 31 mars", () => {
    expect(attendus(ch, "les-effets-escomptes")).toEqual([22_656, 0]);
  });
});

describe("la balance âgée et la ligne de crédit, refaites à la main", () => {
  it("au 30 avril : CampusTech 45 312 € non échus, 22 656 € à 10 jours, 2 656 € à 40 jours ; Studio Méridien 3 540 € à 50 jours ; Vibra 7 080 € non échus ; Sonora 33 630 € à 135 jours", () => {
    const b = compteClientDuChapitre(NOVA).balance;
    const l = Object.fromEntries(b.lignes.map((x) => [x.client, [x.parTranche["non-echu"], x.parTranche["1-30"], x.parTranche["31-60"], x.parTranche["plus-60"], x.total]]));
    expect(l).toEqual({
      CampusTech: [2 * 22_656, 22_656, 2_656, 0, 70_624],
      "Studio Méridien": [0, 0, c(50 * 59 * 1.2), 0, 3_540],
      Vibra: [c(100 * 59 * 1.2), 0, 0, 0, 7_080],
      Sonora: [0, 0, 0, 33_630, 33_630],
    });
    expect(b.total).toBe(c(70_624 + 3_540 + 7_080 + 33_630));
    expect(b.total).toBe(114_874);
    expect(b.lignes.find((x) => x.client === "Sonora")!.retardMaximal).toBe(15 + 4 * 30);
  });

  it("la commande urgente : (80 000 − 70 624) ÷ 70,80 € = 132 enceintes ; 120 au pas de 20, escompte ou non", () => {
    expect(Math.floor((80_000 - 70_624) / 70.8)).toBe(132);
    gardeDuCurseur(ch, "la-commande-au-curseur", 132);
    expect(juste(ch, "predire-la-ligne")).toEqual(["Non, il ne change pas l'en-cours"]);
    const e = gardeDuLaboratoire(ch, "le-laboratoire-de-l-en-cours");
    expect(e.defi(NOVA).solution).toEqual({ commande: 120, escompte: 1 });
  });

  it("l'alerte : Studio Méridien, au-delà de sa ligne de 3 000 €", () => {
    expect(juste(ch, "l-alerte")).toEqual(["Studio Méridien : bloquer ses livraisons"]);
  });
});

describe("l'impayé et l'affacturage, refaits à la main", () => {
  it("Vibra : 5113 / 413 pour 7 080 €, puis l'impayé avec 15 € de frais et 3 € de TVA", () => {
    expect(lignesDe(ch, "la-remise-a-l-encaissement")).toEqual([["5113", "debit", 7_080], ["413", "credit", 7_080]]);
    expect(lignesDe(ch, "l-effet-impaye")).toEqual([["411", "debit", 7_080], ["627", "debit", 15], ["44566", "debit", 3], ["5113", "credit", 7_080], ["512", "credit", 18]]);
  });

  it("Ondes : 40 356 € cédés ; 36 320,40 € d'avance, 423,74 € et 403,56 € de commissions, 80,71 € de TVA, 35 412,39 € virés", () => {
    expect(lignesDe(ch, "la-cession-au-factor")).toEqual([["467", "debit", 40_356], ["411", "credit", 40_356]]);
    expect(c((36_320.4 * 0.07 * 60) / 360)).toBe(423.74);
    expect(c(403.56 * 0.2)).toBe(80.71);
    expect(c(36_320.4 - 423.74 - 403.56 - 80.71)).toBe(35_412.39);
    expect(lignesDe(ch, "le-bordereau-du-factor")).toEqual([["512", "debit", 35_412.39], ["6225", "debit", 403.56], ["44566", "debit", 80.71], ["6616", "debit", 423.74], ["467", "credit", 36_320.4]]);
    // Le même coût que le cas du P6, hors taxes.
    expect(chaineQuiPaieTard(NOVA).a.cout).toBe(c(423.74 + 403.56));
  });
});

describe("le cas dédié : Vibra repasse commande", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(VIBRA_REPASSE_COMMANDE);
    gardeDuCas(VIBRA_REPASSE_COMMANDE, ch);
  });

  it("150 enceintes : 10 620 € TTC, 620 € au-delà de la ligne, 141 enceintes acceptées", () => {
    expect(lignesDe(VIBRA_REPASSE_COMMANDE, "le-reglement")).toEqual([["512", "debit", 7_080], ["411", "credit", 7_080]]);
    const m = etape(chapitreDuCas(VIBRA_REPASSE_COMMANDE, NOVA), "l-en-cours", "montants").champs(NOVA, VIDE).map((x) => x.attendu);
    expect(m).toEqual([c(150 * 70.8), 620, Math.floor(10_000 / 70.8)]);
    expect(m[2]).toBe(141);
    const r = etape(VIBRA_REPASSE_COMMANDE, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte)).toEqual(["Livrer 141 enceintes, sous la ligne"]);
  });
});

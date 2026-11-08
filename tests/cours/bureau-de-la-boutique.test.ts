import { describe, expect, it } from "vitest";
import { BUREAUX, bureauParCode, bureauxDuChapitre } from "../../src/config/cours/bureaux";
import { RAPPROCHEMENT_DE_MARS, grilleDeLEtat } from "../../src/config/cours/bureaux/rapprochement-de-mars";
import type { EtapeDeClassement, EtapeDeReponse, EtapeDuJournal } from "../../src/config/cours/bureaux/types";
import {
  ANNUAIRE_RESILIE,
  TVA_DE_FEVRIER,
  chiffresInverses,
  compteDeMars,
  montantsDeMars,
  operationsDeMars,
  rapprochementDeMars,
  releveDeMars,
} from "../../src/config/cours/monde/bureau-de-la-boutique";
import { CONDITIONS_DE_LA_BANQUE, FIN_DE_FEVRIER, REMISE_DE_CARTES, echeancier, facturesDeFevrier, salairesNets } from "../../src/config/cours/monde/fournisseurs-et-banque-de-la-boutique";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { chequeQuiNEstPasPasse } from "../../src/config/cours/situations/par-chapitre/le-cheque-qui-n-est-pas-passe";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { servirLeBureau } from "../../src/pedagogy/cours/bureau-servi";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import { corrigerLeTableau, incoherencesDuTableau, solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { LEXIQUE_INTERDIT, espacesOrdinairesFautives, phrasesLongues, tiretsAuMilieu, tutoiements } from "../helpers/textes-du-depot";
import { NOMBRE_DE_CAS_DEDIES } from "../helpers/nombre-de-cas-dedies";

/**
 * LE BUREAU DE LA BOUTIQUE : LE RAPPROCHEMENT DE MARS (monde/bureau-de-la-boutique.ts,
 * bureaux/rapprochement-de-mars.ts). Chaque chiffre refait à la main ; le départ de mars est la fin de
 * février du chapitre « Fournisseurs et banque » et de son cas ; l'état de rapprochement tombe juste ;
 * les écritures le rendent au compte ; les textes suivent les règles de la maison.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const b = RAPPROCHEMENT_DE_MARS;
const etape = <T extends (typeof b.etapes)[number]["type"]>(id: string, type: T) => {
  const e = b.etapes.find((x) => x.id === id)!;
  expect(e.type, id).toBe(type);
  return e as Extract<(typeof b.etapes)[number], { type: T }>;
};

describe("le monde de mars : chaque chiffre à la main, dans la suite de février", () => {
  const m = montantsDeMars(f);
  const fev = chequeQuiNEstPasPasse({ code: "boutique" });

  it("mars part de la fin de février : le compte rectifié du cas, le relevé du 28 février, le chèque en suspens", () => {
    // Février : 21 400 € au compte ; relevé = 21 400 + 1 104 − 1 800 − 18 = 20 686 € ; rectifié 19 582 €.
    expect(FIN_DE_FEVRIER.compte).toBe(21_400);
    expect([fev.releve, fev.compteRectifie, fev.releveRectifie, fev.cheque]).toEqual([20_686, 19_582, 19_582, 1_104]);
    expect(compteDeMars(f).depart).toBe(19_582);
    expect(releveDeMars(f).depart).toBe(20_686);
    expect(m.chequeDeFevrier).toBe(fev.cheque);
  });

  it("les mêmes façonniers, la même banque, les mêmes taux", () => {
    // L'échéance du 1er mars : le mérinos (4 032 €) moins son avoir (201,60 €) ; celle de l'atelier, ses 100 bonnets.
    expect(m.faconnier).toBe(c(4_032 - 201.6));
    expect(m.faconnier).toBe(c(echeancier(f).lignes.filter((l) => l.echeance.mois === 3 && l.echeance.jour === 1).reduce((t, l) => t + l.montant, 0)));
    const bonnets = facturesDeFevrier(f).find((x) => x.fournisseur === "atelier-local")!;
    expect([m.atelier, bonnets.echeance.jour, bonnets.echeance.mois]).toEqual([1_390.8, 7, 3]);
    expect(f.fournisseurs.map((x) => x.nom)).toContain("Atelier de tricotage local");
    // La tenue de compte : 15 € HT et 20 % de TVA ; la publicité et l'entretien de la fiche, à 20 %.
    expect(m.frais).toEqual({ ht: CONDITIONS_DE_LA_BANQUE.tenueDeCompteHt, tva: 3, ttc: 18 });
    expect(m.publicite).toEqual({ ht: 1_500, tva: 300, ttc: 1_800 });
    expect(m.entretien).toBe(c(920 * 1.2));
    // Les salaires nets : 10 100 € de brut moins 22 % ; la remise d'une semaine de cartes, celle de janvier.
    expect(m.salaires).toBe(c(10_100 * 0.78));
    expect(m.salaires).toBe(salairesNets(f));
    expect(m.remise).toBe(REMISE_DE_CARTES);
    expect(m.loyer).toBe(13_600);
    // Le comité : 10 200 € HT de commandes en janvier, huit commandes, 20 % de TVA.
    expect(m.comite).toBe(c((10_200 * 1.2) / 8));
    expect(m.tva).toBe(TVA_DE_FEVRIER.montant);
    expect(m.annuaire).toBe(ANNUAIRE_RESILIE.abonnement);
  });

  it("l'erreur de saisie : deux chiffres inversés, 1 390,80 € saisis 1 309,80 €, 81 € d'écart", () => {
    expect(chiffresInverses(1_390.8)).toBe(1_309.8);
    expect(m.atelierSaisi).toBe(1_309.8);
    expect(rapprochementDeMars(f).erreur).toBe(81);
    // L'écart d'une inversion des dizaines et des unités est un multiple de 9.
    expect(rapprochementDeMars(f).erreur % 9).toBe(0);
  });

  it("le relevé et le compte au 31 mars, refaits ligne à ligne", () => {
    const releve = c(20_686 - 3_830.4 - 13_600 - 1_104 + 4 * 18_400 - 1_390.8 + 1_530 - 59.9 - 14_600 - 1_800 - 7_878 - 18);
    const compte = c(19_582 - 3_830.4 - 13_600 + 4 * 18_400 - 1_309.8 - 14_600 - 1_104 - 7_878);
    expect(releve).toBe(51_534.9);
    expect(compte).toBe(50_859.8);
    expect(releveDeMars(f).fin).toBe(releve);
    expect(compteDeMars(f).fin).toBe(compte);
    // Le compte reste créditeur tout le mois (au plus bas 2 151,60 € le 3 mars) : pas d'intérêts débiteurs.
    expect(releveDeMars(f).plusBas).toBe(2_151.6);
    expect(releveDeMars(f).plusBas).toBeGreaterThan(0);
  });

  it("l'état de rapprochement : les deux soldes rectifiés égaux, 50 490,80 €", () => {
    const r = rapprochementDeMars(f);
    expect(r.compteRectifie).toBe(c(50_859.8 + 1_530 - 1_800 - 18 - 81));
    expect(r.releveRectifie).toBe(c(51_534.9 - 1_104 + 59.9));
    expect(r.compteRectifie).toBe(50_490.8);
    expect(r.releveRectifie).toBe(r.compteRectifie);
  });

  it("les points à trouver : cinq, dont une anomalie à signaler, et le chèque de février qui se pointe avec son état", () => {
    const ops = operationsDeMars(f);
    const point = (code: string) => ops.find((o) => o.code === code)!.point;
    expect(point("entretien")).toBe("boutique"); // chèque émis non débité
    expect(point("frais")).toBe("banque"); // frais non saisis
    expect(point("comite")).toBe("banque"); // virement reçu non saisi
    expect(point("atelier")).toBe("ecart"); // erreur de saisie
    expect(point("annuaire")).toBe("banque"); // prélèvement inattendu, à signaler
    expect(point("publicite")).toBe("banque"); // l'avis resté dans la pile
    expect(point("cheque-fevrier")).toBe("fevrier");
    // Pointées des deux côtés : le façonnier, le loyer, les quatre remises, la TVA, les salaires.
    expect(ops.filter((o) => o.point === "pointee").length).toBe(8);
  });
});

describe("le bureau du rapprochement de mars", () => {
  it("est enregistré, réservé, repris du chapitre « Fournisseurs et banque », sans compter parmi les cas dédiés", () => {
    expect(BUREAUX).toContain(b);
    expect(bureauParCode("rapprochement-de-mars")).toBe(b);
    expect(bureauxDuChapitre("fournisseurs-et-banque")).toEqual([b]);
    expect(b.titre).toBe("Au bureau : le rapprochement de mars");
    expect(b.libre).toBe(false);
    expect(b.reprend).toEqual(["fournisseurs-et-banque"]);
    const ch = CHAPITRES.find((x) => x.code === "fournisseurs-et-banque")!;
    expect([b.parcours, b.palier]).toEqual([ch.parcours, ch.palier]);
    expect(CAS_PAR_CHAPITRE.length).toBe(NOMBRE_DE_CAS_DEDIES);
    expect(b.entreprise.nom).toBe(f.entreprise);
  });

  it("une pile de cinq à huit pièces, de toutes les natures demandées, et un courriel de la gérante", () => {
    expect(b.pile.length).toBeGreaterThanOrEqual(5);
    expect(b.pile.length).toBeLessThanOrEqual(8);
    for (const n of ["courriel", "releve", "extrait", "talon", "avis"]) expect(b.pile.map((p) => p.nature), n).toContain(n);
    expect(b.pile.filter((p) => p.nature === "talon").length).toBeGreaterThanOrEqual(2);
    expect(b.pile.find((p) => p.nature === "courriel")!.de).toMatch(/gérante/);
    expect(new Set(b.pile.map((p) => p.code)).size).toBe(b.pile.length);
    // Chaque pièce que l'étape montre existe.
    for (const e of b.etapes) for (const p of e.pieces) expect(b.pile.map((x) => x.code), `${e.id} ${p}`).toContain(p);
  });

  it("classer la pile : chaque pièce sauf le courriel, les quatre catégories, au moins une pièce à signaler", () => {
    const e = etape("la-pile", "classement") as EtapeDeClassement;
    expect(e.elements.map((x) => x.piece).sort()).toEqual(b.pile.filter((p) => p.nature !== "courriel").map((p) => p.code).sort());
    const categories = new Set(e.elements.map((x) => x.categorie));
    expect([...categories].sort()).toEqual(e.categories.map((k) => k.code).sort());
    expect(e.elements.filter((x) => x.categorie === "a-signaler").map((x) => x.code)).toEqual(["lettre"]);
  });

  it("pointer : une ligne par opération de chaque côté, dans la bonne catégorie", () => {
    const e = etape("le-pointage", "classement") as EtapeDeClassement;
    expect(e.elements.length).toBe(releveDeMars(f).lignes.length + compteDeMars(f).lignes.length);
    const cat = (code: string) => e.elements.find((x) => x.code === code)!.categorie;
    expect([cat("r-atelier"), cat("c-atelier")]).toEqual(["ecart", "ecart"]);
    expect([cat("r-cheque-fevrier"), cat("r-loyer"), cat("c-loyer")]).toEqual(["pointee", "pointee", "pointee"]);
    expect(e.elements.filter((x) => x.categorie === "seule").map((x) => x.code).sort()).toEqual(["c-entretien", "r-annuaire", "r-comite", "r-frais", "r-publicite"]);
  });

  it("l'état à compléter : cohérent, juste avec ses propres valeurs, deux soldes rectifiés égaux", () => {
    const g = grilleDeLEtat();
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(corrigerLeTableau(g, solutionsDuTableau(g)).juste).toBe(true);
    const total = g.lignes.at(-1)!;
    expect(total.cellules.map((x) => x.valeur)).toEqual([50_490.8, 50_490.8]);
    // Une ligne sans objet se remplit d'un zéro : la présentation ne trahit pas les points.
    expect(g.lignes.find((l) => l.libelle === "Remises connues de la seule boutique")!.cellules[1]!.valeur).toBe(0);
  });

  it("les écritures : équilibrées, au plan du cours, et le compte 512 tombe sur le solde rectifié", () => {
    const e = etape("les-ecritures", "journal") as EtapeDuJournal;
    expect(e.ecritures.map((x) => x.id).sort()).toEqual(["comite", "erreur", "frais", "publicite"]);
    let banque = compteDeMars(f).fin;
    for (const x of e.ecritures) {
      const ec = enEcriture(x.ecriture);
      expect(equilibree(ec), x.id).toBe(true);
      expect(corriger(enSaisie(x.ecriture), x.ecriture).juste, x.id).toBe(true);
      for (const l of x.ecriture.lignes) expect(compteDuPlan(l.compte), `${x.id} ${l.compte}`).toBeDefined();
      banque = c(banque + ec.lignes.filter((l) => l.compte === "512").reduce((t, l) => t + l.debit - l.credit, 0));
    }
    expect(banque).toBe(rapprochementDeMars(f).compteRectifie);
    // Aucune écriture pour l'annuaire contesté.
    expect(e.ecritures.some((x) => x.ecriture.lignes.some((l) => Math.abs(l.montant - ANNUAIRE_RESILIE.abonnement) < 0.005))).toBe(false);
  });

  it("répondre à la gérante : une seule bonne option par question, jamais la plus longue, chiffrée", () => {
    const e = etape("la-reponse", "reponse") as EtapeDeReponse;
    expect(e.questions.length).toBe(3);
    for (const q of e.questions) {
      const justes = q.options.filter((o) => o.juste);
      expect(justes, q.id).toHaveLength(1);
      expect(new Set(q.options.map((o) => o.texte)).size).toBe(q.options.length);
      const plusLongue = Math.max(...q.options.filter((o) => !o.juste).map((o) => o.texte.length));
      expect(justes[0]!.texte.length, q.id).toBeLessThan(plusLongue);
    }
    expect(espacesOrdinaires(e.questions[0]!.options.find((o) => o.juste)!.texte)).toContain("50 490,80 €");
  });
});

/** Toutes les chaînes d'une valeur, sauf les codes. */
function chaines(x: unknown, sortie: string[] = []): string[] {
  if (typeof x === "string") sortie.push(x);
  else if (Array.isArray(x)) x.forEach((v) => chaines(v, sortie));
  else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) if (!["code", "id", "categorie", "piece", "pieces", "compte", "sens", "type", "nature"].includes(k)) chaines(v, sortie);
  return sortie;
}

describe("la langue du bureau", () => {
  const textes = chaines(b);
  const servis = chaines(servirLeBureau(b));

  it("se relève", () => {
    expect(textes.length).toBeGreaterThan(150);
  });

  it("ni tiret au milieu d'une phrase, ni tutoiement, ni le lexique que la maison n'emploie plus", () => {
    expect(textes.flatMap(tiretsAuMilieu)).toEqual([]);
    expect(textes.flatMap(tutoiements)).toEqual([]);
    for (const { mot, re } of LEXIQUE_INTERDIT) expect(textes.filter((t) => re.test(t)), mot).toEqual([]);
  });

  it("le signe « − » pour les négatifs, aucun nombre en lettres, aucune valeur absente, la gérante d'une SARL", () => {
    for (const t of textes) {
      expect(t, t).not.toMatch(/(^|[\s(])-\d/);
      expect(t, t).not.toMatch(/undefined|NaN|Infinity|\[object|null/);
      expect(t, t).not.toMatch(/\b(vingt|trente|quarante|cinquante|soixante|cent|mille)\b/i);
      expect(t, t).not.toMatch(/\ble gérant\b|\bdu gérant\b|\bau gérant\b/i);
      expect(t, t).not.toMatch(/évènement/i);
    }
    expect(textes.some((t) => /la gérante/i.test(t))).toBe(true);
  });

  it("des phrases courtes, et les insécables de la typographie française dans ce qui est servi", () => {
    expect([...phrasesLongues(textes)]).toEqual([]);
    expect(servis.flatMap(espacesOrdinairesFautives)).toEqual([]);
  });
});

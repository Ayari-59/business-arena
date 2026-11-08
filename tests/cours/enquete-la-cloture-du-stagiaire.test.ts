import { describe, expect, it } from "vitest";
import { bureauxDuChapitre } from "../../src/config/cours/bureaux";
import type { EtapeDeClassement, EtapeDeRectification, EtapeDEtat } from "../../src/config/cours/bureaux/types";
import { ENQUETES, enqueteParCode, enquetesDuChapitre, lienDeLEnquete } from "../../src/config/cours/enquetes";
import { LA_CLOTURE_DU_STAGIAIRE, grilleDuResultat } from "../../src/config/cours/enquetes/la-cloture-du-stagiaire";
import { cloture } from "../../src/config/cours/monde/cloture";
import { DOSSIER_DU_STAGIAIRE, ERREURS_DU_STAGIAIRE, dossierDuStagiaire, resultatDuStagiaire } from "../../src/config/cours/monde/cloture-du-stagiaire";
import { CLOTURE_DE_LA_FICHE, EXERCICE_DE_NOVA as f } from "../../src/config/cours/monde/exercice-de-nova";
import { CHAPITRES } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { servirLeBureau } from "../../src/pedagogy/cours/bureau-servi";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import { corrigerLeTableau, incoherencesDuTableau, solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { LEXIQUE_INTERDIT, espacesOrdinairesFautives, phrasesLongues, tiretsAuMilieu, tutoiements } from "../helpers/textes-du-depot";

/**
 * L'ENQUÊTE : LA CLÔTURE DU STAGIAIRE (monde/cloture-du-stagiaire.ts, enquetes/la-cloture-du-stagiaire.ts).
 * Chaque chiffre refait à la main, depuis la fiche de NOVA : les écritures justes sont celles de la
 * clôture du cours, celles du stagiaire ses erreurs ; le résultat qu'il annonce et le résultat corrigé ;
 * le dossier, le tri, la rectification et le tableau ; les textes suivent les règles de la maison.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const e = LA_CLOTURE_DU_STAGIAIRE;
const dossier = dossierDuStagiaire(f);
const de = (code: string) => dossier.find((d) => d.code === code)!;
/** Le montant d'un compte dans une écriture : son débit, ou son crédit compté en négatif. */
const auCompte = (lignes: readonly { compte: string; debit: number; credit: number }[], compte: string) => c(lignes.filter((l) => l.compte === compte).reduce((t, l) => t + l.debit - l.credit, 0));
const etape = <T>(id: string) => e.etapes.find((x) => x.id === id) as T;
const tri = etape<EtapeDeClassement>("le-tri");
const rectification = etape<EtapeDeRectification>("les-rectifications");
const resultat = etape<EtapeDEtat>("le-resultat");

describe("le dossier du stagiaire : chaque écriture à la main, face à la fiche", () => {
  it("neuf travaux sur dix, dans l'ordre de la clôture ; les intérêts du placement passés à part", () => {
    expect(DOSSIER_DU_STAGIAIRE.length).toBe(9);
    expect(dossier.map((d) => d.code)).toEqual(DOSSIER_DU_STAGIAIRE);
    expect(DOSSIER_DU_STAGIAIRE).not.toContain("interetsDuPlacement");
  });

  it("six erreurs de six natures différentes, trois écritures justes", () => {
    const fausses = dossier.filter((d) => d.erreur);
    expect(fausses.length).toBeGreaterThanOrEqual(4);
    expect(fausses.length).toBeLessThanOrEqual(6);
    expect(new Set(fausses.map((d) => d.erreur)).size).toBe(fausses.length);
    expect(dossier.filter((d) => !d.erreur).map((d) => d.code)).toEqual(["stock", "factureAEtablir", "interetsCourus"]);
    expect(Object.keys(ERREURS_DU_STAGIAIRE).sort()).toEqual(fausses.map((d) => d.code).sort());
  });

  it("le prorata oublié : 60 000 € ÷ 6 ans, une année pleine, au lieu de 355 jours sur 360", () => {
    // Mise en service le 6 janvier : 360 − 5 = 355 jours, jour de départ compris.
    expect(de("dotation").juste.montant).toBe(c((60_000 / 6) * (355 / 360)));
    expect(de("dotation").juste.montant).toBe(9_861.11);
    expect(de("dotation").stagiaire.montant).toBe(10_000);
    expect(auCompte(de("dotation").stagiaire.lignes, "6811")).toBe(10_000);
    expect(auCompte(de("dotation").stagiaire.lignes, "28154")).toBe(-10_000);
  });

  it("le stock final, juste : 600 jeux au coût moyen du mois, (1 500 × 22 + 1 500 × 23) ÷ 3 000 = 22,50 €", () => {
    expect(c(((1_500 * 22 + 1_500 * 23) / 3_000) * (1_500 + 1_500 - 1_000 - 1_400))).toBe(13_500);
    expect(auCompte(de("stock").stagiaire.lignes, "31")).toBe(13_500);
    expect(auCompte(de("stock").stagiaire.lignes, "6031")).toBe(-13_500);
    expect(de("stock").stagiaire.lignes).toEqual(de("stock").juste.lignes);
  });

  it("le mauvais compte : la facture non parvenue au 401 au lieu du 408, aux bons montants", () => {
    const s = de("factureNonParvenue").stagiaire.lignes;
    expect([auCompte(s, "601"), auCompte(s, "44586"), auCompte(s, "401"), auCompte(s, "408")]).toEqual([1_500 * 23, c(1_500 * 23 * 0.2), -c(1_500 * 23 * 1.2), 0]);
    expect(auCompte(de("factureNonParvenue").juste.lignes, "408")).toBe(-41_400);
    // Sans effet sur le résultat.
    expect(de("factureNonParvenue").stagiaire.effetSurLeResultat).toBe(de("factureNonParvenue").juste.effetSurLeResultat);
  });

  it("la mauvaise base : la créance de Sonora dépréciée sur 33 630 € TTC au lieu de 28 025 € HT, à 40 %", () => {
    // 500 enceintes à 59 €, moins 5 % de remise : 28 025 € HT, 33 630 € TTC.
    expect(c(500 * 59 * 0.95)).toBe(28_025);
    expect(de("creanceDouteuse").juste.montant).toBe(c(28_025 * 0.4));
    expect(de("creanceDouteuse").stagiaire.montant).toBe(c(33_630 * 0.4));
    expect([de("creanceDouteuse").juste.montant, de("creanceDouteuse").stagiaire.montant]).toEqual([11_210, 13_452]);
    // Le reclassement au 416 est juste chez lui.
    expect(auCompte(de("creanceDouteuse").stagiaire.lignes, "416")).toBe(33_630);
  });

  it("le mauvais montant : la provision à la demande du client, 12 000 €, au lieu du probable, 5 000 €", () => {
    expect([de("provision").juste.montant, de("provision").stagiaire.montant]).toEqual([5_000, 12_000]);
    expect([f.litige.montantProbable, f.litige.demande]).toEqual([5_000, 12_000]);
  });

  it("la mauvaise période : la prime de 6 000 € du 1er octobre, 3 mois de N retenus au lieu des 9 de N+1", () => {
    expect(de("chargeConstateeDAvance").juste.montant).toBe(c((6_000 * 9) / 12));
    expect(de("chargeConstateeDAvance").stagiaire.montant).toBe(c((6_000 * 3) / 12));
    expect(auCompte(de("chargeConstateeDAvance").stagiaire.lignes, "486")).toBe(1_500);
  });

  it("la facture à établir, juste : 200 enceintes à 59 €, 11 800 € HT et 2 360 € de TVA", () => {
    const s = de("factureAEtablir").stagiaire.lignes;
    expect([auCompte(s, "418"), auCompte(s, "701"), auCompte(s, "44587")]).toEqual([c(200 * 59 * 1.2), -200 * 59, -c(200 * 59 * 0.2)]);
    expect(s).toEqual(de("factureAEtablir").juste.lignes);
  });

  it("le sens inversé : 120 enceintes à 59 €, 7 080 €, au débit du 487 au lieu du 701", () => {
    expect(auCompte(de("produitConstateDAvance").juste.lignes, "701")).toBe(120 * 59);
    expect(auCompte(de("produitConstateDAvance").stagiaire.lignes, "701")).toBe(-120 * 59);
    expect(auCompte(de("produitConstateDAvance").stagiaire.lignes, "487")).toBe(120 * 59);
  });

  it("les intérêts courus, justes : 850 € d'intérêts à l'échéance du 3 janvier, 88 jours sur 90", () => {
    // 68 000 € restant dus × 5 % ÷ 4 = 850 € ; du 3 octobre au 31 décembre : 88 jours, jours compris.
    expect(c((68_000 * 0.05) / 4)).toBe(850);
    expect(auCompte(de("interetsCourus").stagiaire.lignes, "6611")).toBe(c((850 * 88) / 90));
    expect(de("interetsCourus").stagiaire.lignes).toEqual(de("interetsCourus").juste.lignes);
  });

  it("les écritures justes sont celles de la clôture du cours, travail par travail", () => {
    const k = cloture(f);
    for (const d of dossier) expect(d.juste.lignes, d.code).toEqual(k.travaux.find((t) => t.code === d.code)!.lignes);
  });
});

describe("le résultat : celui du stagiaire, et le juste", () => {
  const r = resultatDuStagiaire(f);

  it("le juste est celui de la clôture de la fiche : 99 967,96 €, impôt 20 742 €", () => {
    expect(r.corrige).toBe(CLOTURE_DE_LA_FICHE.resultatAvantImpot);
    expect(r.corrige).toBe(c(134_715.6 - 9_861.11 + 13_500 - 34_500 - 11_210 - 5_000 + 4_500 + 11_800 - 7_080 - 831.11 + 3_934.58));
    expect(r.impotCorrige).toBe(CLOTURE_DE_LA_FICHE.impot);
  });

  it("le stagiaire annonce 101 747,07 € : ses neuf écritures et les intérêts du placement", () => {
    const annonce = c(134_715.6 - 10_000 + 13_500 - 34_500 - 13_452 - 12_000 + 1_500 + 11_800 + 7_080 - 831.11 + 3_934.58);
    expect(annonce).toBe(101_747.07);
    expect(r.annonce).toBe(annonce);
    expect(r.aPart.montant).toBe(c((133_000 * 0.03 * 355) / 360));
    // Son impôt : 15 % jusqu'à 42 500 €, 25 % au-delà, arrondi à l'euro.
    expect(r.impotAnnonce).toBe(Math.round(42_500 * 0.15 + (101_747.07 - 42_500) * 0.25));
  });

  it("les erreurs se compensent presque : −1 779,11 €, la somme des écarts de chaque écriture", () => {
    expect(r.ecarts.map((x) => [x.code, x.ecart])).toEqual([
      ["dotation", 138.89],
      ["factureNonParvenue", 0],
      ["creanceDouteuse", 2_242],
      ["provision", 7_000],
      ["chargeConstateeDAvance", 3_000],
      ["produitConstateDAvance", -14_160],
    ]);
    expect(r.correction).toBe(c(138.89 + 0 + 2_242 + 7_000 + 3_000 - 14_160));
    expect(r.correction).toBe(-1_779.11);
    expect(c(r.annonce + r.correction)).toBe(r.corrige);
  });
});

describe("l'enquête de la clôture du stagiaire", () => {
  it("est enregistrée, réservée, reprise du chapitre « La clôture », sans compter parmi les cas dédiés ni les bureaux", () => {
    expect(ENQUETES).toContain(e);
    expect(enqueteParCode("la-cloture-du-stagiaire")).toBe(e);
    expect(enquetesDuChapitre("la-cloture")).toEqual([e]);
    expect(bureauxDuChapitre("la-cloture")).toEqual([]);
    expect(lienDeLEnquete(e)).toBe("/cours/enquete/la-cloture-du-stagiaire");
    expect(e.format).toBe("enquete");
    expect(e.libre).toBe(false);
    expect(e.reprend).toEqual(["la-cloture"]);
    expect(e.parcours).toBe(CHAPITRES.find((x) => x.code === "la-cloture")!.parcours);
    // Le palier des travaux de prudence et des régularisations, que l'enquête demande aussi.
    expect(e.palier).toBe(CHAPITRES.find((x) => x.code === "depreciations-et-provisions")!.palier);
    expect(CAS_PAR_CHAPITRE.length).toBe(204);
    expect(CAS_PAR_CHAPITRE.some((x) => (x as { code?: string }).code === e.code)).toBe(false);
    expect([e.entreprise.code, e.entreprise.nom]).toEqual([f.code, f.entreprise]);
  });

  it("le dossier : le courriel du président, la balance avant inventaire, les notes, les neuf écritures du stagiaire", () => {
    expect(e.pile.map((p) => p.nature)).toEqual(["courriel", "balance", "note", ...DOSSIER_DU_STAGIAIRE.map(() => "ecriture")]);
    expect(e.pile.find((p) => p.nature === "courriel")!.de).toMatch(/président/);
    expect(new Set(e.pile.map((p) => p.code)).size).toBe(e.pile.length);
    for (const x of e.etapes) for (const p of x.pieces) expect(e.pile.map((y) => y.code), `${x.id} ${p}`).toContain(p);
    // La balance : celle de la fiche, équilibrée.
    const balance = e.pile.find((p) => p.nature === "balance")!;
    expect(balance.comptes!.map((l) => [l.compte, l.debit, l.credit])).toEqual(f.balanceAvantInventaire.map((l) => [l.compte, l.debit, l.credit]));
    expect(c(balance.comptes!.reduce((t, l) => t + l.debit, 0))).toBe(c(balance.comptes!.reduce((t, l) => t + l.credit, 0)));
    // Chaque écriture du stagiaire, telle qu'il l'a passée.
    const ecritures = e.pile.filter((p) => p.nature === "ecriture");
    ecritures.forEach((p, i) => expect(p.comptes!.map((l) => ({ compte: l.compte, debit: l.debit, credit: l.credit })), p.code).toEqual(dossier[i]!.stagiaire.lignes));
    // Le courriel annonce le résultat du stagiaire.
    expect(espacesOrdinaires(e.pile[0]!.paragraphes!.join(" "))).toContain("101 747,07 €");
  });

  it("trier : chaque écriture du dossier, juste ou fausse, et chaque élément ouvre sa pièce", () => {
    expect(tri.type).toBe("classement");
    expect(tri.categories.map((x) => x.code)).toEqual(["juste", "fausse"]);
    expect(tri.elements.length).toBe(DOSSIER_DU_STAGIAIRE.length);
    for (const x of tri.elements) expect(e.pile.find((p) => p.code === x.piece)?.nature, x.code).toBe("ecriture");
    expect(tri.elements.filter((x) => x.categorie === "fausse").length).toBe(6);
    expect(tri.elements.filter((x) => x.categorie === "juste").length).toBe(3);
  });

  it("rectifier : les écritures fausses du tri, une raison chacune, la plus longue raison est un leurre", () => {
    expect(rectification.depuis).toEqual({ etape: "le-tri", dans: "fausse" });
    expect(rectification.ecritures.map((x) => x.id).sort()).toEqual(tri.elements.filter((x) => x.categorie === "fausse").map((x) => x.code).sort());
    const codes = rectification.raisons.map((x) => x.code);
    expect(new Set(codes).size).toBe(codes.length);
    const utilisees = rectification.ecritures.map((x) => x.raison);
    expect(new Set(utilisees).size).toBe(utilisees.length);
    for (const x of utilisees) expect(codes).toContain(x);
    expect(codes.filter((x) => !utilisees.includes(x)).length).toBeGreaterThanOrEqual(2);
    const longueur = (code: string) => rectification.raisons.find((x) => x.code === code)!.libelle.length;
    const plusLongue = Math.max(...codes.map(longueur));
    for (const x of utilisees) expect(longueur(x), x).toBeLessThan(plusLongue);
    for (const x of rectification.ecritures) expect(x.indices.length, x.id).toBeGreaterThanOrEqual(2);
  });

  it("chaque écriture juste : équilibrée, au plan du cours, aux montants du modèle ; celle du stagiaire est refusée", () => {
    const k = cloture(f);
    for (const x of rectification.ecritures) {
      const ec = enEcriture(x.ecriture);
      expect(equilibree(ec), x.id).toBe(true);
      expect(corriger(enSaisie(x.ecriture), x.ecriture).juste, x.id).toBe(true);
      for (const l of x.ecriture.lignes) expect(compteDuPlan(l.compte), `${x.id} ${l.compte}`).toBeDefined();
      const d = dossier.find((y) => y.code.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`) === x.id)!;
      expect(ec.lignes, x.id).toEqual(k.travaux.find((t) => t.code === d.code)!.lignes);
      const saisieDuStagiaire = d.stagiaire.lignes.map((l) => ({ compte: l.compte, debit: l.debit ? String(l.debit).replace(".", ",") : "", credit: l.credit ? String(l.credit).replace(".", ",") : "" }));
      expect(corriger(saisieDuStagiaire, x.ecriture).juste, x.id).toBe(false);
    }
  });

  it("le résultat corrigé : un tableau cohérent, juste avec ses propres valeurs", () => {
    const g = grilleDuResultat();
    expect(resultat.grille).toEqual(g);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(corrigerLeTableau(g, solutionsDuTableau(g)).juste).toBe(true);
    expect(g.lignes.map((l) => l.cellules[0]!.valeur)).toEqual([101_747.07, -1_779.11, 99_967.96]);
    expect(g.lignes.flatMap((l) => l.cellules).filter((x) => x.saisir).length).toBe(2);
  });
});

/** Toutes les chaînes d'une valeur, sauf les codes. */
function chaines(x: unknown, sortie: string[] = []): string[] {
  if (typeof x === "string") sortie.push(x);
  else if (Array.isArray(x)) x.forEach((v) => chaines(v, sortie));
  else if (x && typeof x === "object")
    for (const [k, v] of Object.entries(x)) if (!["code", "id", "categorie", "piece", "pieces", "compte", "sens", "type", "nature", "format", "raison", "depuis", "reprend"].includes(k)) chaines(v, sortie);
  return sortie;
}

describe("la langue de l'enquête", () => {
  const textes = chaines(e);
  const servis = chaines(servirLeBureau(e));

  it("se relève", () => {
    expect(textes.length).toBeGreaterThan(150);
  });

  it("ni tiret au milieu d'une phrase, ni tutoiement, ni le lexique que la maison n'emploie plus", () => {
    expect(textes.flatMap(tiretsAuMilieu)).toEqual([]);
    expect(textes.flatMap(tutoiements)).toEqual([]);
    for (const { mot, re } of LEXIQUE_INTERDIT) expect(textes.filter((t) => re.test(t)), mot).toEqual([]);
  });

  it("le signe « − » pour les négatifs, aucun nombre en lettres, aucune valeur absente, le président d'une SAS", () => {
    for (const t of textes) {
      expect(t, t).not.toMatch(/(^|[\s(])-\d/);
      expect(t, t).not.toMatch(/undefined|NaN|Infinity|\[object|null/);
      expect(t, t).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|vingt|trente|quarante|cinquante|soixante|cent|mille)\b/i);
      expect(t, t).not.toMatch(/\bgérante?\b/i);
      expect(t, t).not.toMatch(/évènement/i);
    }
    expect(textes.some((t) => /le président/i.test(t))).toBe(true);
  });

  it("des phrases courtes, et les insécables de la typographie française dans ce qui est servi", () => {
    expect([...phrasesLongues(textes)]).toEqual([]);
    expect(servis.flatMap(espacesOrdinairesFautives)).toEqual([]);
  });
});

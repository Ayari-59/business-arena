import { describe, expect, it } from "vitest";
import {
  LE_DOSSIER_DE_REVISION,
  SOLUTION_DU_DOSSIER,
  departDuDossier,
  grilleDuDossier,
  laboratoireDuDossier,
  revisionDuChapitre,
} from "../../src/config/cours/chapitres/le-dossier-de-revision";
import { batteries, brutDesMois, congesPayes, dossierDeRevision, garantie } from "../../src/config/cours/monde/dossier-de-revision";
import { resultatFiscal } from "../../src/config/cours/monde/finance";
import { EXERCICE_N1_DE_NOVA } from "../../src/config/cours/monde/projets-et-financement";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { LA_GARANTIE_DE_DEUX_ANS, garantieDeDeuxAns } from "../../src/config/cours/situations/par-chapitre/la-garantie-de-deux-ans";
import { THEMES } from "../../src/config/cours/themes";
import { enEcriture } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { gardeDuLaboratoire } from "./gardes-du-lycee";

/**
 * LE DOSSIER DE RÉVISION DE NOVA À LA CLÔTURE DE N+1, refait à la main. Le brut de juin à décembre
 * du réalisé de N+1 (deux opérateurs stables, le chef d'équipe, le cinquième, le remplaçant) :
 * 69 011,50 € ; le dixième, 6 901,15 €, et 42 % de cotisations, 2 898,48 €. La participation,
 * 6 000 € ; la majoration contestée, 480 € ; 500 batteries à 6 € reprises à 1,20 €, 2 400 € de
 * dépréciation ; 182 défauts livrés, la moitié à venir, 100 € chacun, 9 100 €. Le résultat révisé
 * retombe sur les 118 460 € de « L'impôt sur les sociétés ».
 */

const ch = LE_DOSSIER_DE_REVISION;
const c = (v: number) => Math.round(v * 100) / 100 + 0;

describe("le dossier de révision : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
  });

  it("est au registre, au programme de la comptabilité générale (palier 4), au thème, et cite le BTS CG P2", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][4]!);
    expect(ch.parcours).toBe("comptabilite-generale");
    expect(ch.palier).toBe(4);
    expect(ch.blocs).toEqual(["BTS CG P2 · Contrôle et production de l'information financière"]);
    expect(THEMES.find((t) => t.code === "comptabilite")!.chapitres).toContain(ch.code);
    for (const code of [...(ch.prerequis ?? []), ...(ch.ensuite ?? [])]) expect(CHAPITRES.map((x) => x.code), code).toContain(code);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    for (const i of ch.objectifs.keys()) expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const s of [ch, LA_GARANTIE_DE_DEUX_ANS]) {
      for (const e of chapitreDuCas(s, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });

  it("chaque écriture est équilibrée, et ses comptes sont au plan du cours", () => {
    for (const e of ch.etapes) {
      if (e.type !== "ecriture") continue;
      const x = enEcriture(e.ecriture(NOVA));
      expect(c(x.lignes.reduce((t, l) => t + l.debit - l.credit, 0)), e.id).toBe(0);
      for (const l of x.lignes) expect(compteDuPlan(l.compte), `${e.id} : ${l.compte}`).toBeDefined();
    }
  });
});

describe("les travaux de révision, refaits à la main", () => {
  it("le compte d'attente : 3 600 € d'acompte au 4191, 180 € de frais au 627 ; il se solde", () => {
    const acompte = etape(ch, "l-acompte-identifie", "ecriture").ecriture(NOVA).lignes;
    const frais = etape(ch, "les-frais-bancaires", "ecriture").ecriture(NOVA).lignes;
    expect(acompte.map((l) => [l.compte, l.sens, l.montant])).toEqual([["471", "debit", 3_600], ["4191", "credit", 3_600]]);
    expect(frais.map((l) => [l.compte, l.sens, l.montant])).toEqual([["627", "debit", 180], ["471", "credit", 180]]);
    expect(dossierDeRevision().soldeDuCompteDAttente).toBe(3_600 - 180);
    expect(juste(ch, "le-compte-d-attente")[0]).toMatch(/^Il est soldé/);
  });

  it("les congés payés : le dixième du brut de juin à décembre, et 42 % de cotisations", () => {
    expect(brutDesMois()[5]).toBe(c(2 * 1_912.5 + 2_100 + 1_950 + 1_900));
    const brut = c(2 * (1_912.5 * 4 + 1_950.75 * 3) + (2_100 * 4 + 2_142 * 3) + (1_950 * 4 + 1_989 * 3) + (1_900 * 4 + 1_938 * 3));
    expect(brut).toBe(69_011.5);
    const cp = congesPayes();
    expect(cp.brutDeLaPeriode).toBe(brut);
    expect(cp.dette).toBe(6_901.15);
    expect(cp.charges).toBe(c(6_901.15 * 0.42));
    expect(cp.effectif).toBe(5);
    expect(attendus(ch, "les-conges-payes")).toEqual([6_901.15, 2_898.48, 9_799.63]);
  });

  it("la participation au montant donné, sans forfait social sous 50 salariés ; la variante en paierait 1 200 €", () => {
    expect(etape(ch, "la-participation", "ecriture").ecriture(NOVA).lignes.map((l) => [l.compte, l.montant])).toEqual([["691", 6_000], ["4284", 6_000]]);
    expect(revisionDuChapitre(NOVA).forfaitSocialVariante).toBe(1_200);
    expect(juste(ch, "le-forfait-social")[0]).toMatch(/^Rien : sous 50 salariés/);
  });

  it("la majoration contestée se provisionne en 1514, et c'est la pénalité que l'impôt réintègre", () => {
    expect(etape(ch, "la-provision-pour-amende", "ecriture").ecriture(NOVA).lignes.map((l) => [l.compte, l.montant])).toEqual([["6875", 480], ["1514", 480]]);
    expect(EXERCICE_N1_DE_NOVA.reintegrations.map((r) => r.montant)).toContain(480);
    expect(juste(ch, "la-majoration-contestee")[0]).toMatch(/^Une provision pour amende/);
  });

  it("les batteries : 3 000 € de coût, 600 € de valeur actuelle, 2 400 € de dépréciation", () => {
    expect(batteries()).toMatchObject({ cout: 500 * 6, valeurActuelle: 500 * 1.2, depreciation: 2_400 });
    expect(attendus(ch, "les-batteries")).toEqual([3_000, 600, 2_400]);
  });

  it("la garantie : 26 000 × 3,5 % × 20 % = 182 défauts livrés, la moitié à venir, 9 100 €", () => {
    expect(c(26_000 * 0.035 * (1 - 0.8))).toBe(182);
    expect(garantie().provision).toBe(9_100);
    expect(attendus(ch, "la-garantie")).toEqual([182, 91, 9_100]);
  });

  it("le tri des cycles", () => {
    const t = triDe(ch, "les-cycles");
    expect(t["Le virement reçu du comité social"]).toBe("ventes");
    expect(t["Les batteries de l'ancien modèle"]).toBe("achats");
    expect(t["La majoration de TVA contestée"]).toBe("etat");
  });
});

describe("une seule NOVA : le résultat révisé est celui du chapitre de l'impôt", () => {
  it("146 419,63 € provisoires, moins 27 959,63 € de révision : 118 460 €, et l'impôt de 26 370 €", () => {
    const d = dossierDeRevision();
    expect(d.charges).toBe(c(180 + 9_799.63 + 6_000 + 480 + 2_400 + 9_100));
    expect(d.resultatProvisoire).toBe(c(118_460 + 27_959.63));
    expect(d.resultatRevise).toBe(EXERCICE_N1_DE_NOVA.resultatComptable);
    expect(d.resultatFiscal).toBe(resultatFiscal(EXERCICE_N1_DE_NOVA));
    expect(d.impot).toBe(Math.round(42_500 * 0.15 + (122_480 - 42_500) * 0.25));
  });

  it("la grille du dossier tient ses totaux, et ses cellules sont celles de la main", () => {
    const g = grilleDuDossier(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(g.lignes.map((l) => l.cellules[0]!.valeur)).toEqual([146_419.63, 180, 9_799.63, 6_000, 480, 2_400, 9_100, 27_959.63, 118_460]);
  });
});

describe("le laboratoire des estimations", () => {
  it("chaque euro de charge en plus n'économise que 25 centimes d'impôt ; la solution baisse l'impôt de 1 365 €", () => {
    const d = laboratoireDuDossier(departDuDossier());
    expect(d.resultatRevise).toBe(118_460);
    const s = laboratoireDuDossier(SOLUTION_DU_DOSSIER);
    expect(s.travaux.garantie).toBe(182 * 0.8 * 100);
    expect(c(d.impot - s.impot)).toBe(c((s.travaux.garantie - 9_100) * 0.25));
    gardeDuLaboratoire(ch, "le-laboratoire-des-estimations");
  });
});

describe("le cas dédié : la garantie de deux ans", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LA_GARANTIE_DE_DEUX_ANS);
    gardeDuCas(LA_GARANTIE_DE_DEUX_ANS, ch);
  });

  it("les trois quarts à venir : 13 650 € de provision, 4 550 € de complément, l'impôt baisse de 1 137 €", () => {
    const x = garantieDeDeuxAns(NOVA);
    expect(x.deux.provision).toBe(182 * 0.75 * 100);
    expect(x.complement).toBe(4_550);
    expect(x.apres.resultatRevise).toBe(118_460 - 4_550);
    expect(x.apres.impot).toBe(Math.round(42_500 * 0.15 + (113_910 + 3_540 + 480 - 42_500) * 0.25));
    expect(x.impotEnMoins).toBe(26_370 - 25_233);
    const montants = (id: string) => etape(chapitreDuCas(LA_GARANTIE_DE_DEUX_ANS, NOVA), id, "montants").champs(NOVA, VIDE).map((k) => k.attendu);
    expect(montants("la-provision")).toEqual([136.5, 13_650, 4_550]);
    expect(montants("l-effet")).toEqual([113_910, 25_233, 1_137]);
    const r = etape(LA_GARANTIE_DE_DEUX_ANS, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte)).toEqual(["Oui : la provision suit la garantie promise"]);
  });
});

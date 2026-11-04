import { describe, expect, it } from "vitest";
import { LA_DEMARCHE_BUDGETAIRE, demarcheDuChapitre } from "../../src/config/cours/chapitres/la-demarche-budgetaire";
import {
  ACTIONS_DE_PUBLICITE,
  DEMANDES_DES_CENTRES,
  NEGOCIATION_DE_LA_PUBLICITE,
  budgetBaseZero,
  budgetDActivite,
  budgetsParCentre,
  commandesDuMois,
  navette,
  programmeEtBudget,
  publiciteMaximale,
  reseauDesBudgets,
  slackDeLaPublicite,
} from "../../src/config/cours/monde/demarche-budgetaire";
import { NOVA_GESTION } from "../../src/config/cours/monde/nova-gestion";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { LA_PUBLICITE_LIGNE_PAR_LIGNE, publiciteLigneParLigne } from "../../src/config/cours/situations/par-chapitre/la-publicite-ligne-par-ligne";
import { missionDuChapitre } from "../../src/config/cours/jouez";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";
import { gardeDuLaboratoire } from "./gardes-du-lycee";

/**
 * LA DÉMARCHE BUDGÉTAIRE (le semestre de NOVA) : chaque chiffre refait à la main, à partir de la fiche
 * (10 859 enceintes au semestre, 59 € l'enceinte, 31 183 € de charges fixes par mois, la paie de
 * 10 650 €, le matelas de 10 000 €, le banc de 30 000 € hors taxes), de la fiche de capacité (4
 * opérateurs, 150 heures de montage par mois, un quart d'heure par enceinte), des centres (23 468,15 €
 * et 7 714,85 € par mois) et de la méthode ABC (2,60 € par commande).
 */

const ch = LA_DEMARCHE_BUDGETAIRE;
const c = (v: number) => Math.round(v * 100) / 100 + 0;

describe("la démarche budgétaire : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme du contrôle de gestion (palier 4), au thème, et cite le DCG UE11, la DSCG UE3 et le BUT GEA", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["controle-de-gestion"][4]!);
    expect(ch.parcours).toBe("controle-de-gestion");
    expect(ch.palier).toBe(4);
    expect(ch.blocs.map((b) => b.split(" · ")[0])).toEqual(["DCG UE11", "DSCG UE3", "BUT GEA"]);
    expect(THEMES.find((t) => t.code === "controle-de-gestion")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["des-ventes-aux-achats"]);
    expect(ch.ensuite).toEqual(["equilibrer-la-tresorerie", "le-cout-preetabli-et-les-budgets"]);
    for (const code of [...ch.prerequis!, ...ch.ensuite!]) expect(CHAPITRES.map((x) => x.code)).toContain(code);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    for (const i of ch.objectifs.keys()) expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true);
    expect(missionDuChapitre(ch.code, NOVA)).not.toBeNull();
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const e of chapitreDuCas(ch, NOVA).etapes) {
      if (e.type !== "choix") continue;
      const o = e.options(NOVA, VIDE);
      const bonne = o.find((k) => k.juste)!;
      expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
    }
  });
});

describe("le monde : le réseau, le programme, les budgets par centre et par activité", () => {
  it("le réseau est celui de « Des ventes aux achats », sans stock : 10 859 enceintes, 640 681 €, 238 898 € d'achats, 63 641,60 € au 30 juin", () => {
    const r = reseauDesBudgets(NOVA_GESTION);
    expect(r.ventes).toEqual({ quantite: 10_859, valeur: 10_859 * 59 });
    expect(r.production).toBe(10_859);
    expect(r.achatsHt).toBe(10_859 * 22);
    expect(r.tresorerieFin).toBe(63_641.6);
    expect(r.resultat).toBe(40_941);
  });

  it("le programme : 2 714,75 heures de montage pour 3 600 disponibles, 75,4 % ; le budget du personnel, 63 900 €", () => {
    const p = programmeEtBudget(NOVA_GESTION);
    expect(p.heuresDeMontage).toBe(10_859 * 0.25);
    expect(p.heuresDisponibles).toBe(4 * 150 * 6);
    expect(attendus(ch, "programme-et-budget")).toEqual([2_714.75, 3_600, 75.4, 6 * 10_650]);
  });

  it("les budgets par centre : 140 808,90 € et 46 289,10 €, soit six mois de charges fixes de NOVA", () => {
    const k = budgetsParCentre(NOVA_GESTION);
    expect(k.total).toBe(6 * 31_183);
    expect(attendus(ch, "les-budgets-par-centre")).toEqual([c(6 * 23_468.15), c(6 * 7_714.85), 187_098]);
  });

  it("le budget d'activité de juin : 1 832 commandes × 2,60 € = 4 763,20 €, 1 453,20 € de plus que janvier", () => {
    expect(commandesDuMois(NOVA_GESTION, 0).total).toBe(1_271);
    const a = budgetDActivite(NOVA_GESTION);
    expect([a.coutDeLInducteur, a.coutDeJanvier, a.volumeDeJanvier]).toEqual([2.6, 3_310, 1_271]);
    expect(attendus(ch, "le-budget-d-une-activite")).toEqual([1_831 + 1, c(1_832 * 2.6), c(1_832 * 2.6 - 3_310)]);
  });
});

describe("la navette : les demandes des centres face au matelas", () => {
  it("sans demandes, la navette est le budget de la fiche ; avec le banc en avril et 1 000 € de publicité, avril finit à −6 390 €", () => {
    const sans = navette(NOVA_GESTION, { moisDuBanc: 3, publicite: 0 });
    expect(sans.plusBas.nom).toBe("avril");
    expect(DEMANDES_DES_CENTRES).toEqual({ banc: { mois: 3, montantHt: 30_000 }, publicite: 1_000 });
    expect(navette(NOVA_GESTION).plusBas).toEqual({ nom: "avril", tresorerie: -6_390 });
    expect(publiciteMaximale(NOVA_GESTION, 3)).toBeNull();
  });

  it("le banc en mai : sans publicité, mai finit à 14 068 € ; chaque euro mensuel lui retire 5,20 € ; 782 € au plus (10 001,60 €), 783 € passe dessous", () => {
    const x = demarcheDuChapitre(NOVA);
    expect(navette(NOVA_GESTION, { moisDuBanc: 4, publicite: 0 }).plusBas).toEqual({ nom: "mai", tresorerie: 14_068 });
    // 5 mois de publicité payés TTC (6 € par euro), moins la TVA de 4 déclarations déjà payées (0,80 €).
    expect(x.parEuro).toBe(c(5 * 1.2 - 4 * 0.2));
    expect(x.maxEnMai).toBe(Math.floor((14_068 - 10_000) / 5.2));
    expect(x.auMax.plusBas.tresorerie).toBe(c(14_068 - 782 * 5.2));
    expect(navette(NOVA_GESTION, { moisDuBanc: 4, publicite: 783 }).tient).toBe(false);
    expect(x.enMai.plusBas.tresorerie).toBe(c(14_068 - 1_000 * 5.2));
    gardeDuCurseur(ch, "la-publicite-au-curseur", 782);
    expect(juste(ch, "predire-la-navette")).toEqual(["Pas de découvert, mais sous le matelas"]);
  });

  it("le laboratoire : avec 1 000 € de publicité, seul le banc en juin tient le matelas ; le départ (avril) ne le tient pas", () => {
    const e = gardeDuLaboratoire(ch, "le-laboratoire-de-la-navette");
    const d = e.defi(NOVA);
    const avecLaDemande = [3, 4, 5].filter((m) => d.atteint({ banc: m, publicite: 1_000 }));
    expect(avecLaDemande).toEqual([5]);
    expect(d.solution).toEqual({ banc: 5, publicite: 1_000 });
    expect(navette(NOVA_GESTION, { moisDuBanc: 5, publicite: 1_000 }).plusBas.tresorerie).toBeGreaterThanOrEqual(10_000);
  });
});

describe("la négociation et les bonnes réponses", () => {
  it("le slack : 800 € suffisent, 1 000 € demandés, 900 € alloués, 880 € dépensés, 20 € d'écart favorable pour 80 € de trop", () => {
    expect(NEGOCIATION_DE_LA_PUBLICITE.besoin * (1 + NEGOCIATION_DE_LA_PUBLICITE.majoration)).toBe(DEMANDES_DES_CENTRES.publicite);
    expect(slackDeLaPublicite()).toMatchObject({ demande: 1_000, alloue: 900, ecartFavorable: 20, auDelaDuBesoin: 80 });
    expect(attendus(ch, "le-slack")).toEqual([800, 900, 20, 80]);
  });

  it("les bonnes réponses : plan, programmes, budgets ; la direction ; servir CampusTech ; un peu au-dessus ; les objectifs ; figer l'action", () => {
    expect(juste(ch, "l-ordre-de-la-demarche")).toEqual(["Par un plan, puis des programmes, puis des budgets"]);
    expect(juste(ch, "qui-tranche")).toEqual(["La direction, après la navette"]);
    expect(juste(ch, "le-budget-d-un-processus")).toEqual(["Il chiffre ce que coûte servir CampusTech, d'un bout à l'autre"]);
    expect(juste(ch, "negocier-un-objectif")).toEqual(["Un peu au-dessus, discuté avec elle"]);
    expect(juste(ch, "communiquer-par-le-budget")).toEqual(["Les objectifs et les moyens de chacun"]);
    expect(juste(ch, "les-limites")).toEqual(["Il peut figer l'action quand tout change"]);
  });
});

describe("le cas dédié : la publicité, ligne par ligne", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LA_PUBLICITE_LIGNE_PAR_LIGNE);
    gardeDuCas(LA_PUBLICITE_LIGNE_PAR_LIGNE, ch);
  });

  it("800 € justifiés, 200 € de slack ; 782 € au plus avec le banc en mai ; 650 € accordés (annonces et salon), mai à 10 688 €", () => {
    expect(ACTIONS_DE_PUBLICITE.reduce((t, a) => t + a.parMois, 0)).toBe(NEGOCIATION_DE_LA_PUBLICITE.besoin);
    const b = budgetBaseZero(782);
    expect(b.retenues.map((a) => a.code)).toEqual(["annonces", "salon"]);
    expect(b.differees.map((a) => a.code)).toEqual(["echantillons"]);
    const n = publiciteLigneParLigne(NOVA);
    expect(n.limite).toBe(782);
    const montants = (id: string) => etape(chapitreDuCas(LA_PUBLICITE_LIGNE_PAR_LIGNE, NOVA), id, "montants").champs(NOVA, VIDE).map((x) => x.attendu);
    expect(montants("le-slack")).toEqual([800, 200, 1_200]);
    expect(montants("la-limite")).toEqual([782, c(14_068 - 782 * 5.2), c(14_068 - 800 * 5.2)]);
    expect(montants("les-actions-retenues")).toEqual([650, 150, c(14_068 - 650 * 5.2)]);
    expect(c(14_068 - 650 * 5.2)).toBe(10_688);
    const r = etape(LA_PUBLICITE_LIGNE_PAR_LIGNE, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte)[0]).toMatch(/^650\s€ par mois, le reste différé$/);
  });
});

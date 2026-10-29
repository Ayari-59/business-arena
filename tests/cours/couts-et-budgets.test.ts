import { describe, expect, it } from "vitest";
import {
  budgetDeTresorerie,
  coutCompletDuMois,
  coutCompletRationnel,
  coutsDeLaGamme,
  demandeAuPrix,
  donneesDuMois,
  imputationRationnelle,
  investissementDeLaFiche,
  meilleurPrixSansDemandeNonServie,
  moisDeDecalage,
  planSousFacteurRare,
  pointMortSurLaPeriode,
  prestationsReciproques,
  repartitionDesCentres,
  repartitionPrimaire,
  resultatSansLaReference,
  seuilDeRentabilite,
  tableauDeBord,
  trimestreDeDecision,
} from "../../src/config/cours/monde/couts-et-budgets";
import { NOVA_GESTION, type CodeDeCentre, type FicheDeGestion } from "../../src/config/cours/monde/nova-gestion";

/**
 * LE CONTRÔLE DE GESTION DU COURS (monde/couts-et-budgets.ts), REFAIT À LA MAIN SUR LA FICHE DE NOVA.
 *
 * Chaque chiffre attendu est recalculé ici, sur la fiche ou en clair, sans les fonctions du modèle ;
 * les valeurs absolues sont épinglées (un changement de la fiche se voit), chaque décomposition doit
 * retomber sur son total, la répartition réciproque doit satisfaire ses deux équations et conserver
 * les charges, et chaque mois du budget de trésorerie doit boucler.
 */

const f = NOVA_GESTION;
const c = (x: number) => Math.round(x * 100) / 100;
const CENTRES: CodeDeCentre[] = ["entretien", "administration", "approvisionnement", "production", "distribution"];
const sommeDe = (o: Record<string, number>) => c(Object.values(o).reduce((t, x) => t + x, 0));

describe("la fiche de NOVA : une seule entreprise, d'un chapitre à l'autre", () => {
  it("le mois de référence est le janvier des chapitres de comptabilité", () => {
    const m = f.moisDeReference;
    expect(m.quantite).toBe(1_270 + 320);
    expect(m.quantite).toBe(1_590);
    expect(m.prix).toBe(59);
    expect(m.coutVariable.composants + m.coutVariable.autres).toBe(38);
    expect(m.chargesFixes.loyer + m.chargesFixes.personnel + m.chargesFixes.amortissement).toBe(31_183);
    // La paie de janvier : le net versé et les cotisations font le coût du personnel.
    expect(f.semestre.paie.net + f.semestre.paie.cotisations).toBe(m.chargesFixes.personnel);
  });

  it("chaque ligne de clés fait 100 %, et un centre auxiliaire ne se cède rien", () => {
    for (const k of ["loyer", "personnel", "amortissement"] as const) {
      expect(CENTRES.reduce((t, x) => t + f.centres.primaire[k][x], 0)).toBeCloseTo(1, 12);
    }
    for (const a of ["entretien", "administration"] as const) {
      expect(CENTRES.reduce((t, x) => t + f.centres.secondaire[a][x], 0)).toBeCloseTo(1, 12);
      expect(f.centres.secondaire[a][a]).toBe(0);
    }
  });

  it("le premier trimestre de la décision est janvier, février et mars du semestre", () => {
    const [p, t] = f.semestre.clienteles;
    const mois = (k: number) => p!.quantites[k]! + t!.quantites[k]!;
    expect([0, 1, 2, 3, 4, 5].map(mois)).toEqual([1_590, 1_450, 1_738, 1_900, 2_030, 2_151]);
    expect(mois(0) + mois(1) + mois(2)).toBe(4_778);
    expect(f.decision.production).toBe(4_778);
    // Les ventes de chaque trimestre sont celles que l'arène avait jouées.
    expect((mois(0) + mois(1) + mois(2)) * 59).toBe(281_902);
    expect((mois(3) + mois(4) + mois(5)) * 59).toBe(358_779);
    // Les charges fixes du trimestre : trois mois de janvier.
    expect(f.decision.chargesFixes).toBe(3 * 31_183);
  });

  it("une seule demande de NOVA : la droite passe par les 4 778 enceintes du premier trimestre à 59 €, avec la pente des rejeux de l'arène", () => {
    // 16 755 = 4 778 + 203 × 59 : toute la demande de N a été servie (nova-capacite.ts).
    expect(f.decision.demande.aPrixNul).toBe(f.decision.production + 203 * 59);
    const droite = [53.1, 59, 64.9].map((p) => Math.floor(16_755 - 203 * p + 1e-9));
    expect(droite).toEqual([5_975, 4_778, 3_580]);
    expect([53.1, 59, 64.9].map((p) => demandeAuPrix(f, p))).toEqual(droite);
    expect(demandeAuPrix(f, 82.5)).toBe(Math.floor(16_755 - 203 * 82.5));
    expect(demandeAuPrix(f, 90)).toBe(0);
  });

  it("la gamme garde le local et l'équipe de janvier", () => {
    const g = f.gamme.communes;
    expect(g.loyer).toBe(f.moisDeReference.chargesFixes.loyer);
    expect(g.personnel).toBe(f.moisDeReference.chargesFixes.personnel);
    expect(g.usure).toBe(2 * f.moisDeReference.chargesFixes.amortissement);
    expect(g.loyer + g.personnel + g.entretien + g.usure).toBe(33_578);
  });
});

describe("le seuil de rentabilité de janvier", () => {
  const s = seuilDeRentabilite(donneesDuMois(f));

  it("le compte de résultat différentiel, et sa décomposition", () => {
    expect(s.chiffreDAffaires).toBe(1_590 * 59);
    expect(s.chargesVariables).toBe(1_590 * 38);
    expect(s.marge).toBe(93_810 - 60_420);
    expect(s.margeUnitaire).toBe(59 - 38);
    expect(s.tauxDeMarge).toBe(21 / 59);
    expect(s.resultat).toBe(33_390 - 31_183);
    expect(s.chiffreDAffaires - s.chargesVariables - s.chargesFixes).toBe(s.resultat);
    expect([s.chiffreDAffaires, s.chargesVariables, s.marge, s.resultat]).toEqual([93_810, 60_420, 33_390, 2_207]);
  });

  it("le seuil en quantité, en valeur, le point mort, la marge et l'indice de sécurité", () => {
    expect(s.seuilExact).toBe(31_183 / 21);
    expect(s.seuilQuantite).toBe(Math.ceil(31_183 / 21));
    expect(s.seuilQuantite).toBe(1_485);
    expect(s.seuilValeur).toBe(c((31_183 * 59) / 21));
    expect(s.seuilValeur).toBe(87_609.38);
    expect(s.margeDeSecurite).toBe(c(93_810 - 87_609.38));
    expect(s.margeDeSecurite).toBe(6_200.62);
    expect(s.indiceDeSecurite).toBe(6_200.62 / 93_810);
    // Le 29 janvier, si les ventes sont régulières sur les 31 jours.
    expect(s.pointMort).toBe(Math.ceil((87_609.38 / 93_810) * 31));
    expect(s.pointMort).toBe(29);
  });

  it("le levier opérationnel est la marge rapportée au résultat, l'inverse de l'indice de sécurité", () => {
    expect(s.levierOperationnel).toBe(33_390 / 2_207);
    expect(s.levierOperationnel!).toBeCloseTo(15.13, 2);
    expect(s.levierOperationnel! * (2_207 / 33_390)).toBeCloseTo(1, 12);
    expect(s.indiceDeSecurite!).toBeCloseTo(1 / s.levierOperationnel!, 3);
  });

  it("une baisse de prix de 10 %, et le défi du laboratoire : baisser le prix sans monter le seuil", () => {
    const b = seuilDeRentabilite(donneesDuMois(f, { prix: 53.1 }));
    expect(b.margeUnitaire).toBe(c(53.1 - 38));
    expect(b.seuilQuantite).toBe(Math.ceil(31_183 / 15.1));
    expect(b.seuilQuantite).toBe(2_066);
    // Un coût variable de 32,10 € rend la marge de 21 € : le seuil ne monte pas.
    expect(seuilDeRentabilite(donneesDuMois(f, { prix: 53.1, coutVariableUnitaire: 32.1 })).seuilExact).toBe(31_183 / 21);
    expect(seuilDeRentabilite(donneesDuMois(f, { prix: 53.1, coutVariableUnitaire: 32.11 })).seuilExact!).toBeGreaterThan(31_183 / 21);
    // Ou des charges fixes d'au plus 15,10 € × 31 183 ÷ 21 ≈ 22 422,06 €.
    const plafond = c((15.1 * 31_183) / 21);
    expect(plafond).toBe(22_422.06);
    expect(seuilDeRentabilite(donneesDuMois(f, { prix: 53.1, chargesFixes: plafond })).seuilExact!).toBeLessThanOrEqual(31_183 / 21);
    expect(seuilDeRentabilite(donneesDuMois(f, { prix: 53.1, chargesFixes: 22_422.07 })).seuilExact!).toBeGreaterThan(31_183 / 21);
  });

  it("le curseur des charges fixes : la marge de janvier est la plus grande charge fixe tenable", () => {
    expect(seuilDeRentabilite(donneesDuMois(f, { chargesFixes: 33_390 })).resultat).toBe(0);
    expect(seuilDeRentabilite(donneesDuMois(f, { chargesFixes: 33_391 })).resultat).toBe(-1);
    // Le loyer tenable, le reste des charges fixes ne bougeant pas.
    expect(33_390 - 10_650 - 833).toBe(21_907);
  });

  it("sans marge unitaire, pas de seuil", () => {
    const z = seuilDeRentabilite(donneesDuMois(f, { prix: 38 }));
    expect([z.seuilQuantite, z.seuilValeur, z.indiceDeSecurite, z.pointMort]).toEqual([null, null, null, null]);
  });

  it("le point mort du semestre", () => {
    const ca = [1_590, 1_450, 1_738, 1_900, 2_030, 2_151].map((q) => q * 59);
    const jours = f.semestre.mois.map((m) => m.jours);
    const seuil = c((6 * 31_183 * 59) / 21);
    expect(seuil).toBe(525_656.29);
    // Cumul à fin mai : 513 772 € ; il manque 11 884,29 € sur les 126 909 € de juin, sur 30 jours.
    expect(ca.slice(0, 5).reduce((t, x) => t + x, 0)).toBe(513_772);
    expect(pointMortSurLaPeriode(ca, jours, seuil)).toEqual({ mois: 5, jour: Math.ceil(((525_656.29 - 513_772) / 126_909) * 30) });
    expect(pointMortSurLaPeriode(ca, jours, seuil)).toEqual({ mois: 5, jour: 3 });
    expect(pointMortSurLaPeriode(ca, jours, 1e9)).toBeNull();
  });
});

describe("les centres d'analyse de janvier et les prestations réciproques", () => {
  const p = repartitionPrimaire(f);
  const r = repartitionDesCentres(f);

  it("la répartition primaire, centre par centre, conserve les 31 183 €", () => {
    expect(p.entretien).toBe(c(19_700 * 0.05 + 10_650 * 0.05 + 833 * 0.1));
    expect(p.administration).toBe(c(19_700 * 0.1 + 10_650 * 0.15 + 833 * 0.05));
    expect(p.approvisionnement).toBe(c(19_700 * 0.15 + 10_650 * 0.1 + 833 * 0.05));
    expect(p.production).toBe(c(19_700 * 0.5 + 10_650 * 0.5 + 833 * 0.75));
    expect(p.distribution).toBe(c(19_700 * 0.2 + 10_650 * 0.2 + 833 * 0.05));
    expect(p).toEqual({ entretien: 1_600.8, administration: 3_609.15, approvisionnement: 4_061.65, production: 15_799.75, distribution: 6_111.65 });
    expect(sommeDe(p)).toBe(31_183);
  });

  it("le système de deux équations, résolu à la main, et ses deux équations satisfaites", () => {
    // E = 1 600,80 + 10 % × A et A = 3 609,15 + 20 % × E : E = (1 600,80 + 0,1 × 3 609,15) ÷ (1 − 0,02).
    const E = (1_600.8 + 0.1 * 3_609.15) / (1 - 0.1 * 0.2);
    const A = 3_609.15 + 0.2 * E;
    const t = prestationsReciproques(f);
    expect(t.entretien).toBe(c(E));
    expect(t.administration).toBe(c(A));
    expect([t.entretien, t.administration]).toEqual([2_001.75, 4_009.5]);
    expect(c(1_600.8 + 0.1 * t.administration)).toBe(t.entretien);
    expect(c(3_609.15 + 0.2 * t.entretien)).toBe(t.administration);
  });

  it("chaque centre auxiliaire cède tout son total, et finit vide", () => {
    expect(r.cessions.entretien).toEqual({ entretien: 0, administration: c(2_001.75 * 0.2), approvisionnement: 0, production: c(2_001.75 * 0.6), distribution: c(2_001.75 * 0.2) });
    expect(r.cessions.administration).toEqual({ entretien: c(4_009.5 * 0.1), administration: 0, approvisionnement: c(4_009.5 * 0.2), production: c(4_009.5 * 0.4), distribution: c(4_009.5 * 0.3) });
    expect(sommeDe(r.cessions.entretien)).toBe(2_001.75);
    expect(sommeDe(r.cessions.administration)).toBe(4_009.5);
    // Ce qu'il reçoit de l'autre, plus son primaire, moins ce qu'il cède : rien.
    expect(c(1_600.8 + r.cessions.administration.entretien - 2_001.75)).toBe(0);
    expect(c(3_609.15 + r.cessions.entretien.administration - 4_009.5)).toBe(0);
  });

  it("les centres principaux, et la somme des charges conservée", () => {
    expect(r.principaux.approvisionnement).toBe(c(4_061.65 + 801.9));
    expect(r.principaux.production).toBe(c(15_799.75 + 1_201.05 + 1_603.8));
    expect(r.principaux.distribution).toBe(c(6_111.65 + 400.35 + 1_202.85));
    expect(r.principaux).toEqual({ approvisionnement: 4_863.55, production: 18_604.6, distribution: 7_714.85 });
    expect(sommeDe(r.principaux)).toBe(31_183);
    expect(r.total).toBe(31_183);
  });
});

describe("le coût complet de janvier", () => {
  const k = coutCompletDuMois(f);

  it("le coût des unités d'œuvre", () => {
    expect(k.activite).toEqual({ approvisionnement: 349.8, production: 1_590, distribution: 938.1 });
    expect(k.coutDesUnitesDOeuvre.approvisionnement).toBe(4_863.55 / 349.8);
    expect(k.coutDesUnitesDOeuvre.production).toBe(18_604.6 / 1_590);
    expect(k.coutDesUnitesDOeuvre.distribution).toBe(7_714.85 / 938.1);
    expect([13.9, 11.7, 8.22]).toEqual([k.coutDesUnitesDOeuvre.approvisionnement, k.coutDesUnitesDOeuvre.production, k.coutDesUnitesDOeuvre.distribution].map(c));
  });

  it("la chaîne des coûts retombe sur toutes les charges du mois", () => {
    expect(k.coutDAchat).toBe(c(34_980 + 4_863.55));
    expect(k.coutDeProduction).toBe(c(39_843.55 + 25_440 + 18_604.6));
    expect(k.coutDeRevient).toBe(c(83_888.15 + 7_714.85));
    expect([k.coutDAchat, k.coutDeProduction, k.coutDeRevient]).toEqual([39_843.55, 83_888.15, 91_603]);
    expect(k.coutDeRevient).toBe(60_420 + 31_183);
    expect(c(k.coutDeRevientUnitaire)).toBe(57.61);
    // Deux méthodes, un résultat : celui du compte de résultat différentiel.
    expect(k.resultat).toBe(93_810 - 91_603);
    expect(k.resultat).toBe(seuilDeRentabilite(donneesDuMois(f)).resultat);
  });

  it("au volume du nouveau client (20 % de plus), les centres ne bougent pas, le coût d'une enceinte baisse", () => {
    const n = coutCompletDuMois(f, { quantite: 1_908 });
    expect(n.centres.principaux).toEqual(k.centres.principaux);
    expect(n.coutDeRevient).toBe(c(1_908 * 38 + 31_183));
    expect(n.coutDeRevient).toBe(103_687);
    expect(c(n.coutDeRevientUnitaire)).toBe(54.34);
    expect(n.resultat).toBe(1_908 * 21 - 31_183);
    expect(c(n.coutDesUnitesDOeuvre.production)).toBe(c(18_604.6 / 1_908));
  });

  it("le curseur du coût complet figé : 57,61 € × q ne couvre 38 € × q + 31 183 € qu'à partir de 1 591 enceintes", () => {
    expect(Math.ceil(31_183 / (57.61 - 38))).toBe(1_591);
  });
});

describe("l'imputation rationnelle", () => {
  it("le coefficient, les charges imputées et la différence d'incorporation", () => {
    expect(imputationRationnelle(31_183, 1_590, 2_120)).toEqual({ coefficient: 0.75, imputees: 23_387.25, difference: 7_795.75 });
    // Une suractivité donne un boni : la différence est négative.
    expect(imputationRationnelle(10_000, 2_200, 2_000)).toEqual({ coefficient: 1.1, imputees: 11_000, difference: -1_000 });
  });

  it("janvier : un quart des charges fixes en coût de sous-activité, et le même résultat", () => {
    const r = coutCompletRationnel(f);
    expect(r.coefficient).toBe(1_590 / 2_120);
    expect(r.parCentre.approvisionnement.imputees).toBe(c(4_863.55 * 0.75));
    expect(r.parCentre.production.imputees).toBe(c(18_604.6 * 0.75));
    expect(r.parCentre.distribution.imputees).toBe(c(7_714.85 * 0.75));
    expect([r.parCentre.approvisionnement.imputees, r.parCentre.production.imputees, r.parCentre.distribution.imputees]).toEqual([3_647.66, 13_953.45, 5_786.14]);
    expect(c(3_647.66 + 13_953.45 + 5_786.14)).toBe(c(31_183 * 0.75));
    expect(r.differences).toBe(c(31_183 - 23_387.25));
    expect(r.coutDeRevient).toBe(c(60_420 + 23_387.25));
    expect(r.coutDeRevient).toBe(83_807.25);
    expect(r.resultatAvantDifferences).toBe(c(93_810 - 83_807.25));
    expect(r.resultat).toBe(c(10_002.75 - 7_795.75));
    expect(r.resultat).toBe(2_207);
  });

  it("le coût rationnel d'une enceinte ne dépend plus des ventes du mois", () => {
    const a = coutCompletRationnel(f);
    const b = coutCompletRationnel(f, { quantite: 1_908 });
    expect(b.coefficient).toBe(0.9);
    expect(c(a.coutDeRevientUnitaire)).toBe(52.71);
    expect(c(b.coutDeRevientUnitaire)).toBe(52.71);
    expect(b.resultat).toBe(1_908 * 21 - 31_183);
  });
});

describe("le coût par produit : la gamme Go, One, Studio", () => {
  const h = coutsDeLaGamme(f);
  const v = coutsDeLaGamme(f, { partAuxHeures: 0 });
  const ref = (g: typeof h, code: string) => g.parReference.find((l) => l.code === code)!;

  it("le coût direct, les heures-machine et les charges communes", () => {
    expect(h.parReference.map((l) => l.direct)).toEqual([195 * 19 + 373, 1_160 * 38 + 1_233, 217 * 70 + 393]);
    expect(h.parReference.map((l) => l.direct)).toEqual([4_078, 45_313, 15_583]);
    expect(h.heures).toBeCloseTo(195 * 0.18 + 1_160 * 0.3 + 217 * 0.5, 9);
    expect(h.heures).toBeCloseTo(491.6, 9);
    expect(h.communes).toBe(33_578);
    expect(c(h.coutDeLHeure)).toBe(c(33_578 / 491.6));
    expect(c(h.coutDeLHeure)).toBe(68.3);
    expect(h.chiffreDAffaires).toBe(6_630 + 68_440 + 27_993);
  });

  it("aux heures-machine : chaque référence porte sa part exacte, et la somme retombe sur les charges communes", () => {
    const exacte = (heures: number) => (33_578 * heures) / 491.6;
    expect(h.parReference.map((l) => l.imputees)).toEqual([exacte(35.1), exacte(348), exacte(108.5)].map(c));
    expect(h.parReference.map((l) => l.imputees)).toEqual([2_397.45, 23_769.62, 7_410.93]);
    expect(c(2_397.45 + 23_769.62 + 7_410.93)).toBe(33_578);
    expect(h.parReference.map((l) => l.resultat)).toEqual([c(6_630 - 4_078 - 2_397.45), c(68_440 - 45_313 - 23_769.62), c(27_993 - 15_583 - 7_410.93)]);
    expect(h.parReference.map((l) => l.resultat)).toEqual([154.55, -642.62, 4_999.07]);
  });

  it("au chiffre d'affaires : les résultats changent, celui de la gamme non", () => {
    const exacte = (ca: number) => (33_578 * ca) / 103_063;
    expect(v.parReference.map((l) => l.imputees)).toEqual([exacte(6_630), exacte(68_440), exacte(27_993)].map(c));
    expect(v.parReference.map((l) => l.resultat)).toEqual([391.94, 829.2, 3_289.86]);
    const gamme = 103_063 - (4_078 + 45_313 + 15_583) - 33_578;
    expect(gamme).toBe(4_511);
    expect(h.resultat).toBe(gamme);
    expect(v.resultat).toBe(gamme);
    expect(coutsDeLaGamme(f, { partAuxHeures: 0.37 }).resultat).toBe(gamme);
    expect(sommeDe(Object.fromEntries(coutsDeLaGamme(f, { partAuxHeures: 0.37 }).parReference.map((l) => [l.code, l.imputees])))).toBe(33_578);
  });

  it("la marge sur coûts spécifiques et l'abandon de NOVA One", () => {
    expect(ref(h, "one").margeSpecifique).toBe(68_440 - 45_313);
    expect(ref(v, "one").margeSpecifique).toBe(23_127);
    expect(resultatSansLaReference(h, "one")).toBe(4_511 - 23_127);
    expect(resultatSansLaReference(v, "one")).toBe(-18_616);
  });

  it("le curseur de la clé : NOVA One reste bénéficiaire jusqu'à 56 % des charges aux heures", () => {
    const limite = (23_127 - 22_297.8) / (23_769.62 - 22_297.8);
    expect(Math.floor(limite * 100)).toBe(56);
    expect(ref(coutsDeLaGamme(f, { partAuxHeures: 0.56 }), "one").resultat).toBeGreaterThanOrEqual(0);
    expect(ref(coutsDeLaGamme(f, { partAuxHeures: 0.57 }), "one").resultat).toBeLessThan(0);
  });

  it("les leviers du laboratoire : le prix et les heures de NOVA One", () => {
    const g = coutsDeLaGamme(f, { prix: { one: 60 } });
    expect(ref(g, "one").chiffreDAffaires).toBe(1_160 * 60);
    expect(g.resultat).toBe(4_511 + 1_160);
    const k = coutsDeLaGamme(f, { heuresMachineParUnite: { one: 0.25 } });
    expect(k.heures).toBeCloseTo(35.1 + 290 + 108.5, 9);
    expect(ref(k, "one").imputees).toBe(c((33_578 * 290) / 433.6));
    expect(k.resultat).toBe(4_511);
  });

  it("le seuil de la gamme, à sa composition", () => {
    const s = h.seuil;
    expect(s.chargesFixes).toBe(33_578 + 373 + 1_233 + 393);
    expect(s.marge).toBe(195 * 15 + 1_160 * 21 + 217 * 59);
    expect(s.marge).toBe(40_088);
    expect(s.seuilValeur).toBe(c((35_577 * 103_063) / 40_088));
    expect(s.seuilValeur).toBe(91_465.58);
    expect(s.resultat).toBe(40_088 - 35_577);
    expect(s.seuilParProduit.reduce((t, x) => t + x.chiffreDAffaires, 0)).toBeCloseTo(91_465.58, 1);
  });

  it("le facteur rare : servir d'abord ce qui rapporte le plus par heure-machine", () => {
    const p = planSousFacteurRare(f);
    expect(p.heuresDemandees).toBeCloseTo(600 * 0.18 + 1_500 * 0.3 + 400 * 0.5, 9);
    expect(p.plan.map((x) => x.code)).toEqual(["studio", "go", "one"]);
    expect(p.plan.map((x) => x.margeParHeure)).toEqual([59 / 0.5, 15 / 0.18, 21 / 0.3]);
    // 700 h : 200 h pour Studio, 108 h pour Go, et ce qui reste pour One, à l'unité entière.
    expect(p.plan.map((x) => x.quantite)).toEqual([400, 600, Math.floor((700 - 200 - 108) / 0.3 + 1e-9)]);
    expect(p.plan[2]!.quantite).toBe(1_306);
    expect(p.marge).toBe(400 * 59 + 600 * 15 + 1_306 * 21);
    expect(p.marge).toBe(60_026);
    const naif = planSousFacteurRare(f, { classement: "marge-par-unite" });
    expect(naif.plan.map((x) => [x.code, x.quantite])).toEqual([["studio", 400], ["one", 1_500], ["go", Math.floor(50 / 0.18)]]);
    expect(naif.marge).toBe(400 * 59 + 1_500 * 21 + 277 * 15);
    expect(p.marge - naif.marge).toBe(771);
  });
});

describe("la décision : prix, fabriquer ou acheter", () => {
  it("le trimestre au prix de 59 € : la production sert toute la demande", () => {
    const t = trimestreDeDecision(f);
    expect(t.demande).toBe(16_755 - 203 * 59);
    expect([t.ventes, t.nonServie, t.stock]).toEqual([4_778, 0, 0]);
    expect(t.marge).toBe(100_338);
    expect(t.resultat).toBe(6_789);
    expect(t.capaciteRestante).toBe(7_000 - 4_778);
  });

  it("les trois prix, à plan de production égal : le prix du trimestre donne le meilleur résultat", () => {
    const [b, m, h] = [53.1, 59, 64.9].map((prix) => trimestreDeDecision(f, { prix }));
    expect([b!.ventes, m!.ventes, h!.ventes]).toEqual([4_778, 4_778, 3_580]);
    expect([b!.nonServie, m!.nonServie, h!.nonServie]).toEqual([5_975 - 4_778, 0, 0]);
    expect(h!.stock).toBe(4_778 - 3_580);
    expect([b!.resultat, m!.resultat, h!.resultat]).toEqual([c(4_778 * 15.1 - 93_549), 6_789, c(3_580 * 26.9 - 93_549)]);
    expect([b!.resultat, m!.resultat, h!.resultat]).toEqual([-21_401.2, 6_789, 2_753]);
  });

  it("au-delà de la capacité, le sous-traitant sert le reste, à 52 € l'enceinte", () => {
    const t = trimestreDeDecision(f, { prix: 45, production: 7_000, sousTraitance: 1_000 });
    expect(t.demande).toBe(16_755 - 203 * 45);
    expect([t.fabriqueesVendues, t.sousTraitees, t.nonServie]).toEqual([7_000, 620, 0]);
    expect(t.coutVariable).toBe(7_000 * 38 + 620 * 52);
    expect(t.marge).toBe(7_000 * 7 - 620 * 7);
    expect(trimestreDeDecision(f, { prix: 45, production: 8_000, sousTraitance: 100 })).toMatchObject({ production: 7_000, sousTraitees: 100, nonServie: 520 });
    expect(trimestreDeDecision(f, { prix: 59 }).margeSousTraitee).toBe(7);
  });

  it("le défi du laboratoire : le meilleur résultat sans demande non servie, à 60,30 €", () => {
    const meilleur = meilleurPrixSansDemandeNonServie(f, { min: 40, max: 80, pas: 0.1 });
    expect(meilleur.prix).toBe(60.3);
    expect(meilleur.demande).toBe(Math.floor(16_755 - 203 * 60.3));
    expect([meilleur.production, meilleur.ventes, meilleur.nonServie]).toEqual([4_514, 4_514, 0]);
    expect(meilleur.resultat).toBe(c(4_514 * 22.3 - 93_549));
    expect(meilleur.resultat).toBe(7_113.2);
    // Les deux prix voisins font moins bien.
    expect(c(4_534 * 22.2 - 93_549)).toBeLessThan(7_113.2);
    expect(c(4_493 * 22.4 - 93_549)).toBeLessThan(7_113.2);
  });
});

describe("le budget de trésorerie du semestre", () => {
  const b = budgetDeTresorerie(f);
  const q = [1_590, 1_450, 1_738, 1_900, 2_030, 2_151];
  const part = [1_270, 1_130, 1_418, 1_580, 1_710, 1_831];

  it("le décalage d'une échéance, en mois de 30 jours", () => {
    expect(moisDeDecalage(20, 80, 30)).toBe(3);
    expect(moisDeDecalage(10, 22, 30)).toBe(1);
    expect(moisDeDecalage(10, 60, 30)).toBe(2);
    expect(moisDeDecalage(20, 40, 30)).toBe(1);
    expect(moisDeDecalage(30, 0, 30)).toBe(0);
  });

  it("les encaissements : les particuliers dans le mois, CampusTech trois mois plus tard, TTC", () => {
    expect(b.mois.map((m) => m.encaissements.particuliers)).toEqual(part.map((x) => c(x * 59 * 1.2)));
    expect(b.mois.map((m) => m.encaissements.campustech)).toEqual([0, 0, 0, 22_656, 22_656, 22_656]);
    expect(320 * 59 * 1.2).toBe(22_656);
    // Ce qui n'est pas encaissé au 30 juin : les ventes à CampusTech d'avril, mai et juin.
    expect(b.fin.creancesClients).toBe(3 * 22_656);
    expect(b.totaux.encaissements).toBe(c(b.totaux.ventesTtc - b.fin.creancesClients));
    expect(b.totaux.ventesTtc).toBe(c(10_859 * 59 * 1.2));
  });

  it("les décaissements de janvier et de mars, poste par poste", () => {
    const [jan, , mars] = b.mois;
    expect(jan!.decaissements).toEqual({ fournisseur: 0, autresCoutsVariables: c(1_590 * 16 * 1.2), publicite: 0, loyer: 19_700, salairesNets: 5_850, cotisations: 0, tva: 0, emprunt: 0, investissement: 0, total: c(30_528 + 19_700 + 5_850) });
    expect(mars!.decaissements).toEqual({
      fournisseur: c(1_450 * 22 * 1.2),
      autresCoutsVariables: c(1_738 * 16 * 1.2),
      publicite: 0,
      loyer: 19_700,
      salairesNets: 5_850,
      cotisations: 4_800,
      tva: c(1_450 * 59 * 0.2 - 1_450 * 38 * 0.2),
      emprunt: 4_000 + 80_000 * 0.05 * 0.25,
      investissement: 0,
      total: c(38_280 + 33_369.6 + 19_700 + 5_850 + 4_800 + 6_090 + 5_000),
    });
    expect(b.mois[5]!.emprunt).toEqual({ capital: 4_000, interets: 76_000 * 0.05 * 0.25 });
    expect(b.fin.capitalRestantDu).toBe(72_000);
  });

  it("la TVA du mois se paie le mois suivant ; celle de juin reste due", () => {
    expect(b.mois.map((m) => m.tva.collectee)).toEqual(q.map((x) => c(x * 59 * 0.2)));
    expect(b.mois.map((m) => m.tva.deductible)).toEqual(q.map((x) => c(x * 38 * 0.2)));
    expect(b.mois.map((m) => m.tva.solde)).toEqual(q.map((x) => c(x * 4.2)));
    expect(b.mois.map((m) => m.decaissements.tva)).toEqual([0, ...q.slice(0, 5).map((x) => c(x * 4.2))]);
    expect(b.fin.tvaDue).toBe(c(2_151 * 4.2));
    expect(c(b.mois.reduce((t, m) => t + m.decaissements.tva, 0) + b.fin.tvaDue)).toBe(c(10_859 * 4.2));
  });

  it("le fournisseur : ce qui est acheté moins ce qui reste dû", () => {
    expect(b.mois.map((m) => m.decaissements.fournisseur)).toEqual([0, ...q.slice(0, 5).map((x) => c(x * 22 * 1.2))]);
    expect(b.fin.dettesFournisseurs).toBe(c(2_151 * 22 * 1.2));
    expect(c(b.mois.reduce((t, m) => t + m.decaissements.fournisseur, 0))).toBe(c(b.totaux.achatsTtc - b.fin.dettesFournisseurs));
  });

  it("chaque mois boucle, et la trésorerie de fin de chaque mois est épinglée", () => {
    let debut = 25_000;
    for (const m of b.mois) {
      expect(m.tresorerieDebut).toBe(debut);
      const { total: enc, ...encaissements } = m.encaissements;
      const { total: dec, ...decaissements } = m.decaissements;
      expect(enc).toBe(sommeDe(encaissements));
      expect(dec).toBe(sommeDe(decaissements));
      expect(m.tresorerieFin).toBe(c(debut + enc - dec));
      debut = m.tresorerieFin;
    }
    expect(b.mois.map((m) => m.tresorerieFin)).toEqual([58_838, 31_998, 19_302.8, 33_810, 50_068, 63_641.6]);
    expect(b.tresorerieFin).toBe(c(25_000 + b.totaux.encaissements - b.totaux.decaissements));
    expect(b.plusBas).toEqual({ nom: "mars", tresorerie: 19_302.8 });
  });

  it("l'investissement d'avril met NOVA à découvert ; sa TVA revient sur la déclaration payée en mai", () => {
    const i = budgetDeTresorerie(f, { investissement: investissementDeLaFiche(f) });
    expect(i.mois[3]!.decaissements.investissement).toBe(30_000 * 1.2);
    expect(i.mois[3]!.tresorerieFin).toBe(c(33_810 - 36_000));
    expect(i.mois[3]!.tresorerieFin).toBe(-2_190);
    expect(i.mois[4]!.decaissements.tva).toBe(c(1_900 * 4.2 - 6_000));
    expect(i.tresorerieFin).toBe(c(63_641.6 - 36_000 + 6_000));
    // En mai, il ne met pas NOVA à découvert.
    expect(budgetDeTresorerie(f, { investissement: { mois: 4, montantHt: 30_000 } }).mois[4]!.tresorerieFin).toBe(c(50_068 - 36_000));
  });

  it("le curseur du délai de CampusTech : jusqu'à 160 jours, juin reste positif", () => {
    const juin = (delai: number) => budgetDeTresorerie(f, { delais: { particuliers: 0, campustech: delai } }).tresorerieFin;
    expect(juin(160)).toBe(c(63_641.6 - 2 * 22_656));
    expect(juin(170)).toBe(c(63_641.6 - 3 * 22_656));
    expect(juin(160)).toBeGreaterThanOrEqual(0);
    expect(juin(170)).toBeLessThan(0);
    // Payée comptant, CampusTech rend ses trois mois de créances.
    expect(juin(0)).toBe(c(63_641.6 + 3 * 22_656));
  });

  it("le délai du fournisseur et la hausse des ventes", () => {
    // À 60 jours, NOVA paie ses composants deux mois plus tard : juin garde ceux de mai en plus.
    expect(budgetDeTresorerie(f, { delaiFournisseur: 60 }).tresorerieFin).toBe(c(63_641.6 + 2_030 * 26.4));
    const h = budgetDeTresorerie(f, { hausseDesVentes: 0.1 });
    expect(h.mois[0]!.quantite).toBe(Math.round(1_270 * 1.1) + Math.round(320 * 1.1));
    expect(h.mois[0]!.quantite).toBe(1_397 + 352);
  });
});

describe("le tableau de bord du semestre et ses voyants", () => {
  const t = tableauDeBord(f);
  const q = [1_590, 1_450, 1_738, 1_900, 2_030, 2_151];
  const marche = [6_000, 5_600, 6_500, 7_400, 8_300, 9_200];

  it("les indicateurs de chaque mois", () => {
    expect(t.mois.map((m) => m.resultat)).toEqual(q.map((x) => x * 21 - 31_183));
    expect(t.mois.map((m) => m.resultat)).toEqual([2_207, -733, 5_315, 8_717, 11_447, 13_988]);
    expect(t.mois.map((m) => m.indiceDeSecurite)).toEqual(q.map((x) => (x * 59 - c((31_183 * x * 59) / (x * 21))) / (x * 59)));
    expect(t.mois.map((m) => m.partDeMarche)).toEqual(q.map((x, k) => x / marche[k]!));
    expect(t.mois.map((m) => m.tresorerie)).toEqual([58_838, 31_998, 19_302.8, 33_810, 50_068, 63_641.6]);
  });

  it("les voyants : février sous le seuil, la part de marché qui faiblit au printemps", () => {
    expect(t.mois.map((m) => m.voyants.resultat)).toEqual([false, true, false, false, false, false]);
    expect(t.mois.map((m) => m.voyants.indiceDeSecurite)).toEqual([false, true, false, false, false, false]);
    expect(t.mois.map((m) => m.voyants.partDeMarche)).toEqual(q.map((x, k) => x / marche[k]! < 0.25));
    expect(t.mois.map((m) => m.voyants.partDeMarche)).toEqual([false, false, false, false, true, true]);
    expect(t.mois.map((m) => m.voyants.tresorerie)).toEqual([false, false, false, false, false, false]);
  });

  it("de février à mars, le résultat monte quand la trésorerie baisse", () => {
    expect(t.mois[2]!.resultat - t.mois[1]!.resultat).toBe(5_315 + 733);
    expect(c(t.mois[2]!.tresorerie - t.mois[1]!.tresorerie)).toBe(c(19_302.8 - 31_998));
  });

  it("le semestre : aucun voyant allumé au départ", () => {
    const s = t.semestre;
    expect(s.chiffreDAffaires).toBe(10_859 * 59);
    expect(s.resultat).toBe(10_859 * 21 - 6 * 31_183);
    expect(s.resultat).toBe(40_941);
    expect(s.seuil).toBe(c((6 * 31_183 * 59) / 21));
    expect(s.partDeMarche).toBe(10_859 / 43_000);
    expect(s.voyants).toEqual({ indiceDeSecurite: false, resultat: false, tresorerie: false, partDeMarche: false });
  });

  it("le défi : allumer le voyant de trésorerie sans allumer celui du résultat", () => {
    const i = tableauDeBord(f, { investissement: investissementDeLaFiche(f) });
    // L'investissement d'avril : 500 € d'usure par mois d'avril à juin, et le découvert d'avril.
    expect(i.mois.map((m) => m.chargesFixes)).toEqual([31_183, 31_183, 31_183, 31_683, 31_683, 31_683]);
    expect(i.semestre.resultat).toBe(40_941 - 3 * 500);
    expect(i.semestre.tresoreriePlusBasse).toBe(-2_190);
    expect(i.semestre.voyants).toMatchObject({ tresorerie: true, resultat: false });
    // Ou CampusTech payée à 140 jours : le point bas tombe en mai, sous 10 000 €.
    const d = tableauDeBord(f, { delais: { particuliers: 0, campustech: 140 } });
    expect(d.semestre.tresoreriePlusBasse).toBe(c(50_068 - 2 * 22_656));
    expect(d.semestre.voyants).toMatchObject({ tresorerie: true, resultat: false });
  });

  it("un budget de publicité est une charge fixe de plus, payée TTC, dont la TVA se récupère", () => {
    const p = tableauDeBord(f, { budgetMarketing: 2_000 });
    expect(p.mois[0]!.resultat).toBe(2_207 - 2_000);
    expect(p.budget.mois[0]!.decaissements.publicite).toBe(2_400);
    expect(p.budget.mois[1]!.decaissements.tva).toBe(c(1_590 * 4.2 - 400));
  });
});

describe("la garde voit le modèle", () => {
  it("une fiche faussée change les chiffres attendus", () => {
    const faussee: FicheDeGestion = {
      ...f,
      centres: { ...f.centres, secondaire: { ...f.centres.secondaire, administration: { ...f.centres.secondaire.administration, entretien: 0.2, distribution: 0.2 } } },
      semestre: { ...f.semestre, clienteles: f.semestre.clienteles.map((x) => (x.code === "campustech" ? { ...x, delai: 40 } : x)) },
    };
    const t = prestationsReciproques(faussee);
    expect(t.entretien).toBe(c((1_600.8 + 0.2 * 3_609.15) / (1 - 0.04)));
    expect(sommeDe(repartitionDesCentres(faussee).principaux)).toBeCloseTo(31_183, 1);
    // À 40 jours, CampusTech paie le mois suivant : cinq factures rentrent dans le semestre.
    const b = budgetDeTresorerie(faussee);
    expect(b.mois.map((m) => m.encaissements.campustech)).toEqual([0, 22_656, 22_656, 22_656, 22_656, 22_656]);
    expect(b.fin.creancesClients).toBe(22_656);
  });
});

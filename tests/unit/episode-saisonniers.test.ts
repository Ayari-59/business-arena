import { describe, expect, it } from "vitest";
import {
  CHALLENGE,
  CHANCE_FOYER,
  COUT_ERREUR,
  COUT_SANS_FORMATION,
  COUT_STUDIOS,
  COUTS,
  D,
  ERREURS_PAR_SEMAINE,
  ETE_DERNIER,
  EXTRA_AGENCE,
  FACTEUR_SOIREES,
  FRAIS_AGENCE,
  HEURE_SUP,
  HEURES_SEMAINE,
  IMPREVUS,
  NB_ERREURS_SANS_FORMATION,
  O,
  OCCUPATION,
  PART_DU_SOIR,
  PERMANENTS,
  PERTE_PAR_DIXIEME,
  PLANCHER,
  RISQUE_RENTREE,
  SAISONNIERS,
  SALAIRE_SAISONNIER,
  SURCOUT_VACANCE,
  VENTE_DEBUTANT,
  VENTE_PERMANENT,
  chanceQuElifReste,
  coutSansFormation,
  hasard,
  risqueDArret,
  simuler,
} from "../../src/engine/episodes/saisonniers-de-juillet";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/saisonniers-de-juillet";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_SAISONNIERS } from "../../src/pedagogy/episodes/saisonniers-de-juillet";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les saisonniers de juillet » enseigne qu'un saisonnier rapporte
 * ce que son intégration lui permet de rapporter : mis au comptoir sans
 * formation, il coûte 680 € d'erreurs par semaine, vend cinq fois moins
 * qu'un permanent, part plus souvent, et fait rattraper ses erreurs par des
 * permanents qui s'épuisent. Former et loger avant le rush, ne pas laisser le
 * soir aux débutants, écouter avant de remplacer paient toute la saison. Ces
 * tests verrouillent les chiffres des sources et les classements qui le
 * disent.
 */

const MEILLEUR = [2, 1, 1, 1, 2, 1];
const REFLEXE = [0, 0, 3, 0, 0, 0];
const HABITUDE = [0, 0, 0, 0, 3, 3];
const JOURS = 1.5;
const objectif = (c: readonly number[], g: number) => simuler(c, g, JOURS).objectif;
const rejeu = (chemin: readonly number[], d: number) =>
  rejouerAvec(objectif, chemin, d, ETAPES[d]!.options.length);
const classement = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d)
    .sort((a, b) => b.attendu - a.attendu)
    .map((r) => r.option);
const attendu = (chemin: readonly number[]) =>
  moyenne(GRAINES_DU_BILAN.map((g) => objectif(chemin, g)));
const avec = (chemin: readonly number[], d: number, o: number) => {
  const c = [...chemin];
  c[d] = o;
  return c;
};
/** Ce qu'une option rapporte de plus qu'une autre, en moyenne sur les trente tirages. */
const ecart = (chemin: readonly number[], d: number, o: number, autre: number) =>
  attendu(avec(chemin, d, o)) - attendu(avec(chemin, d, autre));

/** Un montant tel que les sources l'écrivent : « 6 480 € », « 962,50 € ». */
const euros = (v: number, d = 0) =>
  `${v
    .toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d })
    .replace(/\s/g, " ")} €`;
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};
const option = (etape: number, k: number) => ETAPES[etape]!.options[k]!.d;

describe("les chiffres que les sources donnent au joueur", () => {
  it("le journal de l'été dernier et le chiffrage donnent 680 € d'erreurs par semaine et par saisonnier non formé", () => {
    const journal = texte(0, "journal");
    expect(journal).toContain(`les ${ETE_DERNIER.saisonniers} saisonniers`);
    expect(journal).toContain(`${ETE_DERNIER.facturation} erreurs de facturation`);
    expect(journal).toContain(`${ETE_DERNIER.tarif} erreurs de plan tarifaire`);
    expect(journal).toContain(`${ETE_DERNIER.delogement} délogements mal conduits`);
    expect(journal).toContain(`${ETE_DERNIER.permanents} erreurs en tout`);
    // Rapportées à un saisonnier et à une semaine : 6, 2 et un demi-délogement.
    expect(ERREURS_PAR_SEMAINE).toEqual({ facturation: 6, tarif: 2, delogement: 0.5 });
    const chiffrage = texte(0, "chiffrage");
    for (const c of Object.values(COUT_ERREUR)) expect(chiffrage).toContain(euros(c));
    // 6 × 45 + 2 × 110 + 0,5 × 380 : la prévision demandée en semaine 1.
    expect(coutSansFormation()).toBe(680);
    expect(EPISODE_SAISONNIERS.prevision.reel(simuler(MEILLEUR, 1))).toBe(680);
    // Un permanent fait dix fois moins d'erreurs : le plancher d'un saisonnier formé.
    const parPermanent =
      ETE_DERNIER.permanents / (PERMANENTS * ETE_DERNIER.semaines) / NB_ERREURS_SANS_FORMATION;
    expect(parPermanent).toBeCloseTo(PLANCHER, 1);
  });

  it("le saisonnier non formé coûte bien 680 € sa première semaine au comptoir, dans le modèle", () => {
    // Au comptoir dès le premier soir, sa première semaine : la part d'erreurs vaut 1.
    expect(COUT_SANS_FORMATION).toBe(680);
    const t = simuler(HABITUDE, 3);
    const permanents = PERMANENTS * COUT_SANS_FORMATION * PLANCHER;
    // Sans bruit ni imprévu ni logement, la semaine 5 coûterait huit fois 680 € plus les permanents.
    expect(t.semaines[5]!.erreurs).toBeGreaterThan(0.6 * (SAISONNIERS * 680 + permanents));
  });

  it("les ventes additionnelles de l'été dernier sont celles du modèle", () => {
    const ventes = texte(0, "ventes");
    expect(ventes).toContain(euros(VENTE_PERMANENT));
    expect(ventes).toContain(euros(VENTE_PERMANENT * VENTE_DEBUTANT, 2));
    expect(VENTE_DEBUTANT).toBe(1 / 5);
  });

  it("les options de la semaine 1 donnent les coûts du modèle", () => {
    expect(option(0, O.accueil.elearning)).toContain(euros(COUTS.elearning));
    expect(option(0, O.accueil.integration)).toContain(euros(COUTS.integration + COUTS.formateur));
    expect(COUTS.integration).toBe(SAISONNIERS * SALAIRE_SAISONNIER);
    expect(option(0, O.accueil.integration)).toContain(
      euros(SAISONNIERS * COUTS.binomePrepare * HEURE_SUP),
    );
    expect(option(0, O.accueil.binomeRush)).toContain(
      euros(SAISONNIERS * COUTS.binomeRush * HEURE_SUP),
    );
  });

  it("le logement est chiffré comme dans le modèle", () => {
    const studios = texte(1, "studios");
    expect(studios).toContain("850 €");
    expect(studios).toContain("200 €");
    expect(studios).toContain("70 €");
    expect(COUTS.studios).toBe(4 * (2 * 850 + 200));
    expect(COUTS.retenueLogement).toBe(SAISONNIERS * 2 * 70);
    const d = option(1, O.logement.studios);
    expect(d).toContain(euros(COUTS.studios));
    expect(d).toContain(euros(COUTS.retenueLogement));
    expect(d).toContain(euros(COUT_STUDIOS));
    expect(texte(1, "residence")).toContain("100 €");
    expect(option(1, O.logement.foyer)).toContain(euros(COUTS.foyer));
    // « Environ deux dossiers d'employeur sur trois. »
    expect(CHANCE_FOYER).toBeCloseTo(2 / 3, 1);
    // Les chambres côté cour : 112 € de marge par nuit, deux chambres, sept nuits, l'hôtel plein.
    expect(texte(1, "cour")).toContain(euros(COUTS.margeChambreCour));
    const t = simuler(avec(MEILLEUR, D.logement, O.logement.chambres), 1);
    const u = simuler(avec(MEILLEUR, D.logement, O.logement.annonces), 1);
    expect(t.semaines[4]!.couts - u.semaines[4]!.couts).toBeCloseTo(
      2 * 7 * OCCUPATION[4]! * COUTS.margeChambreCour,
      6,
    );
  });

  it("le soir, un permanent divise par deux les erreurs du soir : un tiers des erreurs de moins", () => {
    expect(texte(2, "audit", { erreurs: "1 000 €" })).toContain(`${PART_DU_SOIR * 100} %`);
    expect(texte(2, "lac")).toContain("baissé de moitié");
    expect(FACTEUR_SOIREES).toBeCloseTo(0.65, 6);
  });

  it("un départ, un extra, l'association : les chiffres de la semaine 7", () => {
    const vacance = texte(3, "vacance");
    expect(vacance).toContain(`${HEURES_SEMAINE} heures`);
    expect(vacance).toContain(euros(HEURE_SUP, 2));
    expect(vacance).toContain(euros(HEURES_SEMAINE * HEURE_SUP, 2));
    expect(vacance).toContain(euros(SURCOUT_VACANCE, 2));
    expect(SURCOUT_VACANCE).toBe(362.5);
    const agence = texte(3, "agence");
    expect(agence).toContain(euros(EXTRA_AGENCE));
    expect(agence).toContain(euros(SALAIRE_SAISONNIER));
    expect(agence).toContain(euros(FRAIS_AGENCE));
    expect(texte(3, "association")).toContain(euros(COUTS.deuxJoursBinome));
    expect(COUTS.deuxJoursBinome).toBe(385);
  });

  it("le challenge de L'Escale Lac, la note et la fin de saison sont ceux du modèle", () => {
    const lac = texte(4, "challengeLac");
    expect(lac).toContain(`${Math.round((CHALLENGE.volume - 1) * 100)} %`);
    expect(lac).toContain(`${Math.round((1 - CHALLENGE.prix) * 100)} % de remise`);
    // 40 % de ventes en plus à 25 % de remise : la marge ne bouge presque pas.
    expect(CHALLENGE.volume * CHALLENGE.prix).toBeCloseTo(1.05, 6);
    expect(texte(4, "note")).toContain(euros(PERTE_PAR_DIXIEME));
    expect(ETAPES[4]!.options[O.ventes.script]!.t).toContain(euros(COUTS.primeCollective));
    const fin = texte(5, "permanents");
    expect(fin).toContain(`${COUTS.heures44} heures`);
    expect(fin).toContain(euros(COUTS.heures44 * HEURE_SUP));
    // Trois étudiants sur quatre restent avec la prime ; un seul sur quatre sans rien.
    expect((1 - RISQUE_RENTREE * 0.25) ** 2).toBeCloseTo(0.75, 1);
    expect((1 - RISQUE_RENTREE) ** 2).toBeCloseTo(0.25, 6);
    expect(texte(5, "finEteDernier")).toContain(euros(COUTS.primeFinDeSaison));
  });
});

describe("le modèle de la réception", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[3]!.arrivees).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[3]!.arrivees,
      6,
    );
    expect(hasard(12)).toBe(hasard(12));
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      expect(hasard(g).imprevus.length).toBeGreaterThanOrEqual(1);
      expect(hasard(g).imprevus.length).toBeLessThanOrEqual(2);
      for (const i of hasard(g).imprevus) {
        expect(i.semaine).toBeGreaterThanOrEqual(2);
        expect(i.semaine).toBeLessThanOrEqual(11);
      }
    }
    const vus = new Set(
      GRAINES_DU_BILAN.flatMap((g) => hasard(g).imprevus.map((i) => i.imprevu.id)),
    );
    expect([...vus].sort()).toEqual(IMPREVUS.map((i) => i.id).sort());
  });

  it("l'accueil fait partir moins de saisonniers, et épargne les permanents", () => {
    const departs = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).abandons));
    const arrets = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).arret).length;
    expect(departs(MEILLEUR)).toBeLessThan(departs(HABITUDE) - 1.5);
    expect(arrets(REFLEXE)).toBeGreaterThan(arrets(MEILLEUR) + 3);
    expect(risqueDArret(0.3)).toBe(0);
    expect(risqueDArret(1)).toBeGreaterThan(0.7);
  });

  it("les indicateurs restent dans des plages réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, HABITUDE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g, JOURS);
        expect(t.noteFinale).toBeGreaterThan(8);
        expect(t.noteFinale).toBeLessThan(9.4);
        expect(t.objectif).toBeGreaterThan(-80000);
        expect(t.objectif).toBeLessThan(60000);
        for (const s of t.semaines.slice(1)) {
          expect(s!.contribution).toBeGreaterThan(-16000);
          expect(s!.contribution).toBeLessThan(8000);
        }
      }
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : la semaine d'intégration et le binôme battent de loin le comptoir dès le premier soir", () => {
    expect(classement(MEILLEUR, D.accueil)[0]).toBe(O.accueil.integration);
    expect(ecart(MEILLEUR, D.accueil, O.accueil.integration, O.accueil.comptoir)).toBeGreaterThan(
      10000,
    );
    // Le binôme en plein rush vaut mieux que rien, moins qu'une vraie intégration.
    expect(ecart(MEILLEUR, D.accueil, O.accueil.binomeRush, O.accueil.comptoir)).toBeGreaterThan(0);
  });

  it("D2 : la résidence des saisonniers est la meilleure en moyenne, les studios la plus sûre", () => {
    const r = rejeu(MEILLEUR, D.logement);
    expect(classement(MEILLEUR, D.logement)[0]).toBe(O.logement.foyer);
    const plusSure = r.reduce((x, o) => (o.p10 > x.p10 ? o : x));
    expect(plusSure.option).toBe(O.logement.studios);
    expect(r[O.logement.studios]!.attendu).toBeGreaterThan(r[O.logement.annonces]!.attendu);
    // Les chambres côté cour « gratuites » sont la pire option : la chambre de l'été se vend.
    expect(classement(MEILLEUR, D.logement).at(-1)).toBe(O.logement.chambres);
  });

  it("D3 : changer le planning publié bat le fait de le tenir, et compte double sans formation", () => {
    expect(classement(MEILLEUR, D.planning)[0]).toBe(O.planning.soirees);
    const forme = ecart(MEILLEUR, D.planning, O.planning.soirees, O.planning.tenir);
    const sansFormation = ecart(
      avec(MEILLEUR, D.accueil, O.accueil.comptoir),
      D.planning,
      O.planning.soirees,
      O.planning.tenir,
    );
    expect(forme).toBeGreaterThan(2000);
    // L'interaction : le soir sans permanent coûte bien plus quand personne n'a été formé.
    expect(sansFormation).toBeGreaterThan(2 * forme);
    // Faire rattraper par les permanents n'est pas mieux que de ne rien changer.
    expect(ecart(MEILLEUR, D.planning, O.planning.rattraper, O.planning.tenir)).toBeLessThan(0);
  });

  it("D4 : écouter Elif avant de la remplacer bat l'extra mis au comptoir", () => {
    expect(classement(MEILLEUR, D.depart)[0]).toBe(O.depart.entretien);
    expect(ecart(MEILLEUR, D.depart, O.depart.entretien, O.depart.extra)).toBeGreaterThan(2000);
    for (const cause of ["coupures", "client", "geneve"] as const) {
      expect(
        chanceQuElifReste(avec(MEILLEUR, D.depart, O.depart.entretien), cause),
      ).toBeGreaterThan(
        cause === "geneve"
          ? 0.3
          : chanceQuElifReste(avec(MEILLEUR, D.depart, O.depart.prime), cause),
      );
    }
  });

  it("D5 : l'argumentaire et la prime collective battent le challenge, qui coûte cher sans formation", () => {
    expect(classement(MEILLEUR, D.ventes)[0]).toBe(O.ventes.script);
    const forme = ecart(MEILLEUR, D.ventes, O.ventes.challenge, O.ventes.rien);
    const sansFormation = ecart(
      avec(MEILLEUR, D.accueil, O.accueil.comptoir),
      D.ventes,
      O.ventes.challenge,
      O.ventes.rien,
    );
    expect(forme).toBeLessThan(0);
    expect(sansFormation).toBeLessThan(forme - 2000);
  });

  it("D6 : la prime de fin de saison bat les heures des permanents et les extras", () => {
    const c = classement(MEILLEUR, D.fin);
    expect(c[0]).toBe(O.fin.prime);
    expect(ecart(MEILLEUR, D.fin, O.fin.prime, O.fin.repos)).toBeGreaterThan(1500);
    expect(c.at(-1)).toBe(O.fin.extras);
  });

  it("intégrer avant le rush bat nettement le rush d'abord et l'habitude", () => {
    const [methode, reflexe, habitude] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode).toBeGreaterThan(reflexe! + 30000);
    expect(methode).toBeGreaterThan(habitude! + 30000);
    expect(habitude).toBeLessThan(0);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      expect(MEILLEUR[d]).not.toBe(o);
      const m = mesurerDecision(EPISODE_SAISONNIERS, avec(MEILLEUR, d, o), d, JOURS);
      expect(m.bonne, `réflexe [${d}, ${o}]`).toBe(false);
    }
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["journal", "chiffrage"],
      ["sorties"],
      ["audit"],
      ["raisons"],
      ["parVendeur", "challengeLac"],
      ["finEteDernier"],
    ],
    jours: JOURS,
    diagnostic: "integration",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 680,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_SAISONNIERS, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a tenu le rush d'abord, propose de former avant le rush", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_SAISONNIERS.comportements(p, analyser(EPISODE_SAISONNIERS, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_SAISONNIERS.axe(c).titre).toBe("Former avant le rush, pas pendant");
  });

  it("à qui a décidé sans enquêter, propose de compter ce que coûte un saisonnier non formé", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_SAISONNIERS.comportements(p, analyser(EPISODE_SAISONNIERS, p).trimestre);
    expect(EPISODE_SAISONNIERS.axe(c).titre).toBe("Compter ce que coûte un saisonnier non formé");
  });

  it("juge la prévision au calcul près", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    const juste = EPISODE_SAISONNIERS.comportements(partie(MEILLEUR, { prevision: 690 }), t);
    const loin = EPISODE_SAISONNIERS.comportements(partie(MEILLEUR, { prevision: 300 }), t);
    expect(juste[3]!.score).toBe(1);
    expect(loin[3]!.score).toBe(0);
  });
});

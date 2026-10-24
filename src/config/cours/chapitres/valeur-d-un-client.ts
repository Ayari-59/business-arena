import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { anneeJouee, type Cas } from "../cas";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LA VALEUR D'UN CLIENT (BTS NDRC, palier 3).
 *
 * Le client qui revient : un portefeuille d'abonnés, ce qui en sort (l'attrition), ce qui y
 * entre (les nouveaux), et ce qu'un client rapporte sur toute sa durée de vie (la valeur vie
 * client), face à ce qu'il a coûté à gagner (le coût d'acquisition). Puis l'année : pourquoi
 * l'attrition monte, ce que vaut alors un client, et le portefeuille vers lequel la salle tend
 * quand recrues et départs s'équilibrent.
 *
 * Seule VOLT FITNESS vend à l'abonnement dans l'arène : les chiffres sont ceux de son
 * portefeuille, trimestre par trimestre, tel que le moteur le joue (`anneeJouee`) ; le seuil de
 * saturation et la saison de l'attrition sont ceux du scénario. Aucune hypothèse n'est ajoutée.
 */

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** Un trimestre du portefeuille, en adhérents entiers : les départs et les nouveaux se recomposent. */
export interface TrimestreDuPortefeuille {
  trimestre: number;
  ouverture: number;
  departs: number;
  gardes: number;
  nouveaux: number;
  cloture: number;
  /** Les départs rapportés au portefeuille d'ouverture, en %, au dixième. */
  attrition: number;
  /** Le portefeuille d'ouverture rapporté aux places du trimestre, en %, au dixième. */
  occupation: number;
  /** Le prix de l'abonnement trimestriel : le chiffre d'affaires rapporté aux adhérents servis. */
  prix: number;
  /** Le coefficient de saison de l'attrition (1 = neutre). */
  saison: number;
}

/**
 * Le portefeuille de l'année, et le premier trimestre lu en détail. Les adhérents gardés et le
 * portefeuille de clôture sont ceux du moteur, arrondis ; les départs et les nouveaux s'en
 * déduisent, pour que chaque ligne se recompose à l'adhérent près.
 */
export function portefeuille(c: Cas) {
  const def = scenarioByCode(c.code);
  const abonnement = def.scenario.subscription!;
  const tours = anneeJouee(c.code).partie.rounds.map((t) => t.results["joueur"]!);
  const trimestres: TrimestreDuPortefeuille[] = tours.map((r, i) => {
    const s = r.subscription!;
    const ouverture = Math.round(s.opening);
    const gardes = Math.round(s.retained);
    const cloture = Math.round(s.closing);
    const departs = ouverture - gardes;
    return {
      trimestre: i + 1,
      ouverture,
      departs,
      gardes,
      nouveaux: cloture - gardes,
      cloture,
      attrition: auDixieme((departs / ouverture) * 100),
      occupation: auDixieme(s.occupancy * 100),
      prix: auCentime(r.incomeStatement.revenue / s.closing),
      saison: abonnement.churnSeasonality?.[i] ?? 1,
    };
  });
  const t1 = trimestres[0]!;
  const r1 = tours[0]!;
  const chiffreDAffaires = auCentime(r1.incomeStatement.revenue);
  const coutsVariables = auCentime(r1.incomeStatement.cogs);
  const marketing = auCentime(r1.incomeStatement.marketingCost);
  const revenuParAdherent = auCentime(chiffreDAffaires / t1.cloture);
  const coutParAdherent = auCentime(coutsVariables / t1.cloture);
  const marge = auCentime(revenuParAdherent - coutParAdherent);
  const valeurVie = (attrition: number) => Math.round(marge / (attrition / 100));
  const cac = auCentime(marketing / t1.nouveaux);
  const vvc = valeurVie(t1.attrition);
  // L'année : la pire attrition, et le portefeuille vers lequel tendent recrues et départs.
  const pire = trimestres.reduce((a, b) => (b.attrition > a.attrition ? b : a));
  const recrues = trimestres.reduce((t, x) => t + x.nouveaux, 0);
  const departs = trimestres.reduce((t, x) => t + x.departs, 0);
  const ouvertures = trimestres.reduce((t, x) => t + x.ouverture, 0);
  const recruesParTrimestre = Math.round(recrues / trimestres.length);
  const attritionMoyenne = auDixieme((departs / ouvertures) * 100);
  const equilibre = Math.round(recruesParTrimestre / (attritionMoyenne / 100));
  return {
    trimestres,
    t1,
    t2: trimestres[1]!,
    seuilDeSaturation: auDixieme(abonnement.crowdingThreshold * 100),
    places: Math.round(r1.subscription!.opening / r1.subscription!.occupancy),
    chiffreDAffaires,
    coutsVariables,
    marketing,
    revenuParAdherent,
    coutParAdherent,
    marge,
    fidelisation: auDixieme(100 - t1.attrition),
    dureeDeVie: auDixieme(100 / t1.attrition),
    vvc,
    cac,
    vvcSurCac: auDixieme(vvc / cac),
    pire,
    vvcDuPire: valeurVie(pire.attrition),
    recrues,
    departs,
    ouvertures,
    recruesParTrimestre,
    attritionMoyenne,
    equilibre,
    /** Les deux leviers, à effort égal : un quart de recrues en plus, ou un quart d'attrition en moins. */
    equilibrePlusDeRecrues: Math.round((recruesParTrimestre * 1.25) / (attritionMoyenne / 100)),
    attritionReduite: auDixieme(attritionMoyenne * 0.75),
    equilibreMoinsDAttrition: Math.round(recruesParTrimestre / ((attritionMoyenne * 0.75) / 100)),
  };
}

const T = (n: number) => `T${n}`;
const ordinal = (n: number) => (n === 1 ? "premier" : `${n}e`);

export const VALEUR_D_UN_CLIENT: Chapitre = {
  code: "valeur-d-un-client",
  parcours: "ndrc",
  palier: 3,
  blocs: [
    "BTS NDRC Bloc 1 · Relation client et négociation-vente",
  ],
  titre: "La valeur d'un client : attrition et valeur vie",
  accroche:
    "Un abonné ne s'achète pas une fois : il se garde ou il part. Combien rapporte-t-il avant de partir, combien a-t-il coûté à gagner, et que vaut un point de fidélité ?",
  objectifs: [
    "Lire un portefeuille clients : ce qui en sort, ce qui y entre",
    "Calculer le taux d'attrition et le taux de fidélisation",
    "Calculer la marge par client sur la période",
    "Calculer la durée de vie moyenne et la valeur vie client",
    "Comparer la valeur vie client au coût d'acquisition",
    "Expliquer une hausse de l'attrition, et comparer recruter et fidéliser",
  ],
  libre: false,
  entreprises: {
    codes: ["fitness"],
    pourquoi: "ce chapitre suit un portefeuille d'abonnés, et VOLT FITNESS est l'entreprise de l'arène qui vend à l'abonnement.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un client qui revient chaque trimestre",
      notions: ["churn_rate", "customer_lifetime_value"],
      texte: (c) => {
        const p = portefeuille(c);
        return [
          `Les adhérents de ${c.entreprise} paient un abonnement de ${eur(p.t1.prix)} chaque trimestre. Le commercial ne vend pas une fois : il garde, ou il perd, un client qui paierait encore les trimestres suivants.`,
          `Au premier trimestre de l'arène, la salle ouvre avec ${qte(p.t1.ouverture)} adhérents. ${qte(p.t1.departs)} ne renouvellent pas, ${qte(p.t1.nouveaux)} s'inscrivent : le portefeuille finit à ${qte(p.t1.cloture)}.`,
        ];
      },
      tableau: (c) => {
        const p = portefeuille(c);
        return {
          titre: `Le portefeuille d'adhérents, premier trimestre`,
          colonnes: ["Adhérents"],
          lignes: [
            { libelle: "En début de trimestre", valeurs: [qte(p.t1.ouverture)] },
            { libelle: "Partis (non renouvelés)", valeurs: [`− ${qte(p.t1.departs)}`] },
            { libelle: "Gardés", valeurs: [qte(p.t1.gardes)] },
            { libelle: "Nouveaux inscrits", valeurs: [`+ ${qte(p.t1.nouveaux)}`] },
            { libelle: "En fin de trimestre", valeurs: [qte(p.t1.cloture)] },
          ],
        };
      },
      repere: () => "Taux d'attrition = départs ÷ portefeuille de début de période. Taux de fidélisation = 100 % − taux d'attrition.",
    },
    {
      id: "attrition",
      type: "montants",
      titre: "Le taux d'attrition",
      notions: ["churn_rate"],
      question: (c) => {
        const p = portefeuille(c);
        return `Calculez le taux d'attrition du premier trimestre (${qte(p.t1.departs)} départs sur ${qte(p.t1.ouverture)} adhérents), puis le taux de fidélisation, en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const p = portefeuille(c);
        return [
          { libelle: "Taux d'attrition (%)", attendu: p.t1.attrition, calcul: `${qte(p.t1.departs)} ÷ ${qte(p.t1.ouverture)} × 100 = ${pct(p.t1.attrition)}`, tolerance: 0.1 },
          { libelle: "Taux de fidélisation (%)", attendu: p.fidelisation, calcul: `100 % − ${pct(p.t1.attrition)} = ${pct(p.fidelisation)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const p = portefeuille(c);
        return [
          `Sur 100 adhérents présents en début de trimestre, ${qte(p.fidelisation)} renouvellent et ${qte(p.t1.attrition)} partent. Le taux se calcule sur le portefeuille de début de période : les nouveaux inscrits n'ont pas encore eu l'occasion de partir.`,
        ];
      },
    },
    {
      id: "marge",
      type: "montants",
      titre: "Ce que rapporte un adhérent",
      notions: ["contribution_margin"],
      question: (c) => {
        const p = portefeuille(c);
        return `Au premier trimestre, ${c.entreprise} encaisse ${eur(p.chiffreDAffaires)} de chiffre d'affaires et paie ${eur(p.coutsVariables)} de coûts variables (énergie, consommables), pour ${qte(p.t1.cloture)} adhérents servis. Calculez le revenu par adhérent, le coût variable par adhérent, puis la marge par adhérent du trimestre.`;
      },
      champs: (c) => {
        const p = portefeuille(c);
        return [
          { libelle: "Revenu par adhérent", attendu: p.revenuParAdherent, calcul: `${eur(p.chiffreDAffaires)} ÷ ${qte(p.t1.cloture)} = ${eur(p.revenuParAdherent)}` },
          { libelle: "Coût variable par adhérent", attendu: p.coutParAdherent, calcul: `${eur(p.coutsVariables)} ÷ ${qte(p.t1.cloture)} = ${eur(p.coutParAdherent)}` },
          { libelle: "Marge par adhérent", attendu: p.marge, calcul: `${eur(p.revenuParAdherent)} − ${eur(p.coutParAdherent)} = ${eur(p.marge)}` },
        ];
      },
      explication: (c) => {
        const p = portefeuille(c);
        return [`Chaque trimestre où il reste, un adhérent laisse ${eur(p.marge)} pour payer le loyer, les coachs et le reste des charges fixes. Tout l'enjeu est le nombre de trimestres où il reste.`];
      },
    },
    {
      id: "valeur-vie",
      type: "montants",
      titre: "La valeur vie client",
      notions: ["customer_lifetime_value", "churn_rate"],
      question: (c) => {
        const p = portefeuille(c);
        return `Avec ${pct(p.t1.attrition)} d'attrition par trimestre, combien de trimestres un adhérent reste-t-il en moyenne (100 ÷ taux d'attrition, au dixième) ? Avec ${eur(p.marge)} de marge par trimestre, quelle est sa valeur vie client (marge ÷ taux d'attrition, à l'euro) ?`;
      },
      champs: (c) => {
        const p = portefeuille(c);
        return [
          { libelle: "Durée de vie moyenne (trimestres)", attendu: p.dureeDeVie, calcul: `100 ÷ ${qte(p.t1.attrition)} = ${qte(p.dureeDeVie)} trimestres`, tolerance: 0.1 },
          {
            libelle: "Valeur vie client",
            attendu: p.vvc,
            calcul: `${eur(p.marge)} ÷ ${pct(p.t1.attrition)} = ${eur(p.vvc)}`,
            tolerance: Math.max(2, Math.round(p.vvc * 0.01)),
          },
        ];
      },
      explication: (c) => {
        const p = portefeuille(c);
        return [
          `Un adhérent reste en moyenne ${qte(p.dureeDeVie)} trimestres, et rapporte ${eur(p.marge)} à chacun : il vaut ${eur(p.vvc)} de marge sur toute sa vie de client. C'est ce que la salle perd, en réalité, quand un adhérent part au bout d'un trimestre.`,
          "L'arène affiche cette valeur dans les indicateurs du métier : elle suppose que la marge et l'attrition restent celles du trimestre.",
        ];
      },
    },
    {
      id: "acquisition",
      type: "montants",
      titre: "Ce qu'a coûté un nouvel adhérent",
      notions: ["customer_acquisition_cost", "customer_lifetime_value"],
      question: (c) => {
        const p = portefeuille(c);
        return `Au premier trimestre, ${c.entreprise} a dépensé ${eur(p.marketing)} de publicité et gagné ${qte(p.t1.nouveaux)} nouveaux adhérents. Calculez le coût d'acquisition d'un adhérent, puis le rapport valeur vie client ÷ coût d'acquisition, au dixième.`;
      },
      champs: (c) => {
        const p = portefeuille(c);
        return [
          { libelle: "Coût d'acquisition par adhérent", attendu: p.cac, calcul: `${eur(p.marketing)} ÷ ${qte(p.t1.nouveaux)} = ${eur(p.cac)}` },
          {
            libelle: "Valeur vie ÷ coût d'acquisition",
            attendu: p.vvcSurCac,
            calcul: `${eur(p.vvc)} ÷ ${eur(p.cac)} = ${qte(p.vvcSurCac)}`,
            tolerance: Math.max(0.1, auDixieme(p.vvcSurCac * 0.01)),
          },
        ];
      },
      explication: (c) => {
        const p = portefeuille(c);
        return [
          `Chaque euro dépensé pour gagner un adhérent en rapporte ${qte(p.vvcSurCac)} de marge sur sa vie de client. Les commerciaux retiennent souvent qu'en dessous de 3, la conquête coûte plus qu'elle ne rapporte.`,
          "Dans l'arène, seule la publicité compte dans le coût d'acquisition. Dans une vraie salle, l'offre de bienvenue, les frais d'inscription offerts et le temps passé par les commerciaux s'y ajoutent, et le rapport baisse d'autant.",
        ];
      },
    },
    {
      id: "annee",
      type: "lecture",
      titre: "Une année de portefeuille",
      notions: ["churn_rate", "seasonality"],
      texte: (c) => {
        const p = portefeuille(c);
        return [
          `Sur l'année, l'attrition de ${c.entreprise} ne reste pas à ${pct(p.t1.attrition)}. Elle monte jusqu'à ${pct(p.pire.attrition)} au ${ordinal(p.pire.trimestre)} trimestre.`,
          `En plus du prix et de la qualité du service, deux choses font partir des adhérents dans l'arène : la saison (l'été fait partir plus que le reste de l'année), et la saturation. Au-delà de ${pct(p.seuilDeSaturation)} d'occupation, la salle est bondée, les machines sont prises, et des adhérents ne renouvellent pas.`,
        ];
      },
      tableau: (c) => {
        const p = portefeuille(c);
        return {
          titre: "Le portefeuille d'adhérents, trimestre par trimestre",
          colonnes: p.trimestres.map((t) => T(t.trimestre)),
          lignes: [
            { libelle: "En début de trimestre", valeurs: p.trimestres.map((t) => qte(t.ouverture)) },
            { libelle: "Partis", valeurs: p.trimestres.map((t) => `− ${qte(t.departs)}`) },
            { libelle: "Taux d'attrition", valeurs: p.trimestres.map((t) => pct(t.attrition)) },
            { libelle: "Nouveaux inscrits", valeurs: p.trimestres.map((t) => `+ ${qte(t.nouveaux)}`) },
            { libelle: "En fin de trimestre", valeurs: p.trimestres.map((t) => qte(t.cloture)) },
            { libelle: "Occupation de la salle", valeurs: p.trimestres.map((t) => pct(t.occupation)) },
            { libelle: "Abonnement trimestriel", valeurs: p.trimestres.map((t) => eur(t.prix)) },
          ],
        };
      },
    },
    {
      id: "pourquoi",
      type: "choix",
      titre: "Pourquoi l'attrition monte",
      notions: ["churn_rate", "capacity"],
      tableau: (c) => {
        const p = portefeuille(c);
        return {
          titre: "Les deux premiers trimestres",
          colonnes: [T(1), T(2)],
          lignes: [
            { libelle: "Taux d'attrition", valeurs: [pct(p.t1.attrition), pct(p.t2.attrition)] },
            { libelle: "Occupation de la salle", valeurs: [pct(p.t1.occupation), pct(p.t2.occupation)] },
            { libelle: "Abonnement trimestriel", valeurs: [eur(p.t1.prix), eur(p.t2.prix)] },
          ],
        };
      },
      question: (c) => {
        const p = portefeuille(c);
        return `L'attrition passe de ${pct(p.t1.attrition)} au premier trimestre à ${pct(p.t2.attrition)} au deuxième. Qu'est-ce qui a fait partir les adhérents ?`;
      },
      options: (c) => {
        const p = portefeuille(c);
        const sature = p.t2.occupation > p.seuilDeSaturation;
        const plusCher = p.t2.prix > p.t1.prix + 0.5;
        const saison = p.t2.saison > 1;
        return [
          {
            texte: "La salle était trop pleine",
            juste: sature && !plusCher && !saison,
            retour: sature
              ? `Oui : la salle ouvrait le trimestre occupée à ${pct(p.t2.occupation)}, au-delà des ${pct(p.seuilDeSaturation)} où l'attente aux machines fait partir. Les inscriptions du premier trimestre ont rempli la salle, et ce remplissage s'est payé en départs.`
              : `Non : la salle était occupée à ${pct(p.t2.occupation)}, sous les ${pct(p.seuilDeSaturation)} où la saturation fait partir.`,
          },
          {
            texte: "L'abonnement a augmenté",
            juste: plusCher && !sature && !saison,
            retour: plusCher
              ? `Oui : l'abonnement est passé de ${eur(p.t1.prix)} à ${eur(p.t2.prix)}, et une partie des adhérents ne suit pas.`
              : `Non : l'abonnement est resté à ${eur(p.t2.prix)}. Le prix n'explique pas ces départs.`,
          },
          {
            texte: "C'est la saison des départs",
            juste: saison && !sature && !plusCher,
            retour: saison
              ? "Oui : ce trimestre est celui où, dans l'arène, les adhérents partent le plus, quelle que soit la salle."
              : "Non : dans l'arène, la saison des départs est l'été, au troisième trimestre. Le deuxième est un trimestre ordinaire.",
          },
        ];
      },
    },
    {
      id: "ete",
      type: "montants",
      titre: "Ce que vaut un client qui part plus vite",
      notions: ["customer_lifetime_value"],
      question: (c) => {
        const p = portefeuille(c);
        return `Au ${ordinal(p.pire.trimestre)} trimestre, l'attrition atteint ${pct(p.pire.attrition)}. À marge inchangée (${eur(p.marge)} par trimestre), que vaudrait un adhérent sur sa vie de client à ce rythme ? Et combien de moins qu'au premier trimestre ?`;
      },
      champs: (c) => {
        const p = portefeuille(c);
        return [
          { libelle: "Valeur vie client à ce rythme", attendu: p.vvcDuPire, calcul: `${eur(p.marge)} ÷ ${pct(p.pire.attrition)} = ${eur(p.vvcDuPire)}`, tolerance: Math.max(2, Math.round(p.vvcDuPire * 0.01)) },
          { libelle: "Valeur perdue par adhérent", attendu: p.vvc - p.vvcDuPire, calcul: `${eur(p.vvc)} − ${eur(p.vvcDuPire)} = ${eur(p.vvc - p.vvcDuPire)}`, tolerance: Math.max(3, Math.round(p.vvc * 0.01)) },
        ];
      },
      explication: (c) => {
        const p = portefeuille(c);
        return [
          `Le même adhérent, au même prix, ne vaut plus que ${eur(p.vvcDuPire)} au lieu de ${eur(p.vvc)}. La valeur vie client se divise quand l'attrition se multiplie : c'est pourquoi le commercial d'une entreprise d'abonnement suit son attrition avant ses inscriptions.`,
        ];
      },
    },
    {
      id: "equilibre",
      type: "montants",
      titre: "Le portefeuille d'équilibre",
      notions: ["churn_rate"],
      question: (c) => {
        const p = portefeuille(c);
        return `Sur l'année, ${c.entreprise} a gagné ${qte(p.recrues)} adhérents et en a perdu ${qte(p.departs)}, sur ${qte(p.ouvertures)} adhérents présents en début de trimestre, les quatre trimestres additionnés. Calculez les recrues par trimestre (à l'unité), l'attrition moyenne de l'année (au dixième), puis le portefeuille d'équilibre : celui où les départs égalent les recrues (recrues par trimestre ÷ attrition).`;
      },
      champs: (c) => {
        const p = portefeuille(c);
        return [
          { libelle: "Recrues par trimestre", attendu: p.recruesParTrimestre, calcul: `${qte(p.recrues)} ÷ 4 = ${qte(p.recruesParTrimestre)}`, tolerance: 1 },
          { libelle: "Attrition moyenne (%)", attendu: p.attritionMoyenne, calcul: `${qte(p.departs)} ÷ ${qte(p.ouvertures)} × 100 = ${pct(p.attritionMoyenne)}`, tolerance: 0.1 },
          { libelle: "Portefeuille d'équilibre", attendu: p.equilibre, calcul: `${qte(p.recruesParTrimestre)} ÷ ${pct(p.attritionMoyenne)} = ${qte(p.equilibre)}`, tolerance: Math.max(5, Math.round(p.equilibre * 0.01)) },
        ];
      },
      explication: (c) => {
        const p = portefeuille(c);
        const auDela = p.equilibre > p.places;
        return [
          `À ce rythme, le portefeuille tend vers ${qte(p.equilibre)} adhérents : plus il grossit, plus il perd d'adhérents chaque trimestre, jusqu'à ce que les départs égalent les recrues.`,
          auDela
            ? `Or la salle n'a que ${qte(p.places)} places. Avant d'atteindre cet équilibre, elle dépasserait ${pct(p.seuilDeSaturation)} d'occupation, et la saturation ferait monter l'attrition : recruter plus ne ferait que remplir une salle qui se vide par l'autre bout.`
            : `La salle a ${qte(p.places)} places : cet équilibre y tient, mais au-delà de ${pct(p.seuilDeSaturation)} d'occupation, la saturation ferait monter l'attrition.`,
        ];
      },
    },
    {
      id: "leviers",
      type: "choix",
      titre: "Recruter ou fidéliser",
      notions: ["churn_rate", "customer_acquisition_cost"],
      question: (c) => {
        const p = portefeuille(c);
        return `Pour grossir son portefeuille d'équilibre (${qte(p.equilibre)} adhérents), ${c.entreprise} hésite : recruter un quart d'adhérents de plus chaque trimestre, ou faire baisser l'attrition d'un quart, de ${pct(p.attritionMoyenne)} à ${pct(p.attritionReduite)}. Lequel des deux grossit le plus le portefeuille ?`;
      },
      options: (c) => {
        const p = portefeuille(c);
        const fideliser = p.equilibreMoinsDAttrition > p.equilibrePlusDeRecrues;
        const calcul = `Avec un quart de recrues en plus : ${qte(Math.round(p.recruesParTrimestre * 1.25))} ÷ ${pct(p.attritionMoyenne)} = ${qte(p.equilibrePlusDeRecrues)} adhérents. Avec un quart d'attrition en moins : ${qte(p.recruesParTrimestre)} ÷ ${pct(p.attritionReduite)} = ${qte(p.equilibreMoinsDAttrition)} adhérents.`;
        return [
          {
            texte: "Faire baisser l'attrition d'un quart",
            juste: fideliser,
            retour: `${fideliser ? "Oui" : "Non"}. ${calcul} L'attrition divise : la baisser d'un quart grossit le portefeuille d'un tiers, quand un quart de recrues en plus ne le grossit que d'un quart.`,
          },
          {
            texte: "Recruter un quart d'adhérents de plus",
            juste: !fideliser,
            retour: `${fideliser ? "Non" : "Oui"}. ${calcul} Les recrues multiplient le portefeuille par 1,25 ; une attrition réduite d'un quart le multiplie par 1 ÷ 0,75, soit un tiers de plus.`,
          },
          {
            texte: "Les deux se valent",
            juste: false,
            retour: `Non. ${calcul} Le portefeuille d'équilibre est un quotient : un quart de moins au dénominateur pèse plus qu'un quart de plus au numérateur.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["customer_lifetime_value", "churn_rate", "customer_acquisition_cost"],
      texte: (c) => {
        const p = portefeuille(c);
        return [
          `Un adhérent de ${c.entreprise} rapporte ${eur(p.marge)} de marge par trimestre, et reste ${qte(p.dureeDeVie)} trimestres en moyenne : il vaut ${eur(p.vvc)}, pour ${eur(p.cac)} de publicité dépensée pour le gagner.`,
          `Quand l'attrition monte à ${pct(p.pire.attrition)}, la valeur du même adhérent tombe à ${eur(p.vvcDuPire)}. Garder un client, c'est garder toute la suite de ses abonnements ; et dans une salle pleine, garder passe aussi par ne pas trop remplir.`,
        ];
      },
      repere: () => "Valeur vie client = marge par période ÷ taux d'attrition par période. Portefeuille d'équilibre = recrues par période ÷ taux d'attrition.",
    },
  ],
};

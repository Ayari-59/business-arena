import { arrondi2, eur, nombreAuCentieme, pct } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_RENOVATION, renovationDeLaBoutique } from "../../chapitres/renover-la-boutique";
import { PROJET_DE_RENOVATION, empruntDeLaRenovation, projetDeRenovation } from "../../monde/comptes-de-la-boutique";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « RÉNOVER LA BOUTIQUE » : UN PRÊT SUR SEPT ANS (BTS MCO, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : le projet de rénovation de MAILLE & CO
 * (monde/comptes-de-la-boutique.ts, lu par `renovationDeLaBoutique`).
 *
 * Un associé exige désormais 10 % d'un euro placé dans la boutique, et la banque propose d'étaler le prêt
 * sur 7 ans pour alléger l'annuité. L'élève recalcule la VAN au nouveau taux, l'annuité et le coût du prêt
 * sur 7 ans face au prêt sur 5 ans, cherche au curseur les ventes en plus qui gardent la VAN positive au
 * nouveau taux, puis répond.
 *
 * Les pièges : confondre une annuité plus faible et un crédit moins cher ; croire que le taux exigé ne
 * change rien à la décision.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : la valeur actuelle des flux et la VAN se donnent au centime, à
 * un centime près (à cinq centimes, avant) : chaque flux actualisé s'arrondit au centime avant la
 * somme.
 */

/** LES NOUVELLES DONNÉES (hypothèses du cours) : 10 % exigés par l'associé ; un prêt sur 7 ans à 4,9 %. */
export const TAUX_EXIGE = 0.1;
export const PRET_SUR_SEPT_ANS = { taux: 0.049, duree: 7 } as const;

/** Les bornes du curseur des articles en plus, par an. */
export const ARTICLES_DU_CURSEUR = { min: 300, max: 700 } as const;

const qte = nombreAuCentieme;

/** Les chiffres de la réponse. */
export function pretSurSeptAns(c: Pick<Cas, "code">) {
  const x = renovationDeLaBoutique(c);
  const aDix = projetDeRenovation(x.f, { tauxDActualisation: TAUX_EXIGE });
  const sept = empruntDeLaRenovation(x.p.investissement, PRET_SUR_SEPT_ANS.taux, PRET_SUR_SEPT_ANS.duree);
  let articles = ARTICLES_DU_CURSEUR.min;
  while (articles < ARTICLES_DU_CURSEUR.max && projetDeRenovation(x.f, { tauxDActualisation: TAUX_EXIGE, articlesEnPlus: articles }).van < 0) articles++;
  return { ...x, aDix, sept, cinq: x.emprunt, articlesAuSeuil: articles };
}

const tableauDuProjet = (c: Pick<Cas, "code">) => {
  const x = renovationDeLaBoutique(c);
  return {
    titre: "La rénovation : ses flux nets de trésorerie",
    colonnes: ["Flux net"],
    lignes: [
      { libelle: "Investissement, au début de l'année 1", valeurs: [eur(x.p.investissement)] },
      ...x.p.annees.map((a) => ({ libelle: `Année ${a.annee}`, valeurs: [eur(a.flux)] })),
      { libelle: `Prêt sur ${qte(x.emprunt.duree)} ans à ${pct(x.emprunt.taux * 100)}, annuité`, valeurs: [eur(x.emprunt.annuite)] },
    ],
  };
};

export const UN_PRET_SUR_SEPT_ANS: Situation = {
  code: "un-pret-sur-sept-ans",
  parcours: "mco",
  palier: 4,
  blocs: [],
  reprend: ["renover-la-boutique"],
  commanditaire: "Le gérant",
  titre: "Un prêt sur sept ans",
  accroche: "Un associé exige plus de rentabilité, et la banque propose d'étaler le prêt de la rénovation sur sept ans. Le projet tient-il, et le prêt plus long est-il moins cher ?",
  objectifs: [
    "Recalculer la VAN d'un projet à un autre taux exigé",
    "Calculer l'annuité et le coût d'un prêt, et comparer deux durées",
    "Trouver les ventes qui gardent la VAN positive",
    "Répondre au gérant sur le projet et son prêt",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_RENOVATION,
    pourquoi: "ce cas reprend le projet du chapitre, à la boutique MAILLE & CO, le seul point de vente que la simulation du cours suit d'un chapitre à l'autre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      tableau: tableauDuProjet,
      texte: () => [
        `« Un associé veut désormais ${pct(TAUX_EXIGE * 100)} de rentabilité, et non plus ${pct(PROJET_DE_RENOVATION.tauxDActualisation * 100)}. Et la banque me propose d'étaler le prêt sur ${qte(PRET_SUR_SEPT_ANS.duree)} ans, à ${pct(PRET_SUR_SEPT_ANS.taux * 100)} : l'annuité serait plus petite. La rénovation tient-elle encore, combien de ventes en plus faut-il à ce taux, et le prêt long est-il une meilleure affaire ? »`,
        "Pas de cours cette fois : les flux sont ceux du chapitre, la méthode aussi.",
      ],
      repere: () => "À rendre : la VAN au taux exigé, l'annuité et le coût des deux prêts, les ventes qui gardent la VAN positive, et votre réponse.",
    },
    {
      id: "la-van-a-dix",
      type: "montants",
      titre: "La VAN au taux exigé",
      notions: ["discounting"],
      tableau: tableauDuProjet,
      question: () => `Actualisez les flux à ${pct(TAUX_EXIGE * 100)} : calculez la valeur actuelle des flux, puis la VAN du projet.`,
      champs: (c) => {
        const x = pretSurSeptAns(c);
        const somme = arrondi2(x.aDix.van + x.aDix.investissement);
        return [
          { libelle: "Valeur actuelle des flux", attendu: somme, calcul: `${x.aDix.annees.map((a) => `${eur(a.flux)} × 1,1^−${a.annee}`).join(" + ")} = ${eur(somme)}` },
          { libelle: "Valeur actuelle nette", attendu: x.aDix.van, calcul: `${eur(somme)} − ${eur(x.aDix.investissement)} = ${eur(x.aDix.van)}` },
        ];
      },
      explication: (c) => {
        const x = pretSurSeptAns(c);
        return [`À ${pct(TAUX_EXIGE * 100)}, la VAN baisse à ${eur(x.aDix.van)}, mais reste positive : le taux qui l'annule, autour de ${pct(x.tri)}, est au-dessus de ce que l'associé exige.`];
      },
    },
    {
      id: "les-deux-prets",
      type: "montants",
      titre: "Le prêt long et le prêt court",
      notions: ["loan_schedule"],
      question: () => `Calculez l'annuité du prêt sur ${qte(PRET_SUR_SEPT_ANS.duree)} ans (capital × taux ÷ (1 − (1 + taux)^−7)), son coût total (la somme des intérêts, année par année), puis l'écart de coût avec le prêt sur 5 ans du chapitre.`,
      champs: (c) => {
        const x = pretSurSeptAns(c);
        return [
          { libelle: "Annuité sur 7 ans", attendu: x.sept.annuite, calcul: `${eur(x.sept.capital)} × 0,049 ÷ (1 − 1,049^−7) = ${eur(x.sept.annuite)}` },
          { libelle: "Coût du prêt sur 7 ans", attendu: x.sept.coutDuCredit, calcul: `la somme des intérêts du tableau : ${x.sept.lignes.map((l) => eur(l.interets)).join(" + ")} = ${eur(x.sept.coutDuCredit)}` },
          { libelle: "Coût en plus du prêt long", attendu: Math.round((x.sept.coutDuCredit - x.cinq.coutDuCredit) * 100) / 100, calcul: `${eur(x.sept.coutDuCredit)} − ${eur(x.cinq.coutDuCredit)} = ${eur(Math.round((x.sept.coutDuCredit - x.cinq.coutDuCredit) * 100) / 100)}` },
        ];
      },
      explication: (c) => {
        const x = pretSurSeptAns(c);
        return [`L'annuité baisse de ${eur(x.cinq.annuite)} à ${eur(x.sept.annuite)}, mais le crédit coûte ${eur(x.sept.coutDuCredit)} au lieu de ${eur(x.cinq.coutDuCredit)} : plus long et plus cher, il dure aussi plus que les équipements, amortis en ${qte(PROJET_DE_RENOVATION.duree)} ans.`];
      },
    },
    {
      id: "les-ventes-qu-il-faut",
      type: "curseur",
      titre: "Les ventes qu'il faut à 10 %",
      notions: ["discounting", "irr_payback"],
      question: () => `Faites varier les articles vendus en plus chaque année, de ${qte(ARTICLES_DU_CURSEUR.min)} à ${qte(ARTICLES_DU_CURSEUR.max)}, au taux de ${pct(TAUX_EXIGE * 100)}. Une droite donne la valeur actuelle des flux, l'autre l'investissement. Placez le curseur sur le plus petit nombre d'articles où la VAN reste positive ou nulle, puis validez.`,
      grandeur: () => ({ libelle: "Articles en plus, par an", unite: "articles" }),
      cible: (c) => ({ attendu: pretSurSeptAns(c).articlesAuSeuil, min: ARTICLES_DU_CURSEUR.min, max: ARTICLES_DU_CURSEUR.max }),
      zones: ["La VAN est positive", "La VAN est négative"],
      rates: () => ({
        dessous: "À ce volume, la VAN est encore négative : montez.",
        dessus: "La VAN est déjà positive avec moins d'articles : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les ventes qu'il faut",
      lecture: (c, q) => {
        const x = pretSurSeptAns(c);
        const p = projetDeRenovation(x.f, { tauxDActualisation: TAUX_EXIGE, articlesEnPlus: q });
        return [
          { libelle: "Valeur actuelle des flux", montant: Math.round((p.van + p.investissement) * 100) / 100 },
          { libelle: "Investissement", montant: p.investissement },
          { libelle: "Valeur actuelle nette", montant: p.van, fort: true },
        ];
      },
      droites: (c) => {
        const x = pretSurSeptAns(c);
        return { produit: (q) => projetDeRenovation(x.f, { tauxDActualisation: TAUX_EXIGE, articlesEnPlus: q }).van + x.p.investissement, cout: () => x.p.investissement, libelles: ["Valeur actuelle des flux", "Investissement"] };
      },
      explication: (c) => {
        const x = pretSurSeptAns(c);
        return [`À ${pct(TAUX_EXIGE * 100)}, il faut au moins ${qte(x.articlesAuSeuil)} articles en plus par an, contre ${qte(x.p.articlesEnPlus)} prévus : le projet garde une marge, plus étroite qu'à 8 %.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const x = pretSurSeptAns(c);
        return [
          { texte: `Rénover, avec le prêt sur ${qte(x.cinq.duree)} ans : le long coûte ${eur(Math.round((x.sept.coutDuCredit - x.cinq.coutDuCredit) * 100) / 100)} de plus`, juste: true, retour: `Oui. À ${pct(TAUX_EXIGE * 100)}, la VAN reste positive (${eur(x.aDix.van)}) tant que la borne vend au moins ${qte(x.articlesAuSeuil)} articles de plus par an. Le prêt sur ${qte(PRET_SUR_SEPT_ANS.duree)} ans allège l'annuité, mais coûte plus et dure plus que les équipements.` },
          { texte: `Renoncer : à ${pct(TAUX_EXIGE * 100)}, le projet ne rapporte plus assez`, juste: false, retour: `Non : la VAN à ${pct(TAUX_EXIGE * 100)} est de ${eur(x.aDix.van)}, encore positive.` },
          { texte: `Rénover, avec le prêt sur 7 ans : son annuité est la plus petite`, juste: false, retour: `Une annuité plus petite n'est pas un crédit moins cher : ${eur(x.sept.coutDuCredit)} d'intérêts contre ${eur(x.cinq.coutDuCredit)}, sur plus longtemps que la vie du rayonnage.` },
          { texte: "Rénover, et ne plus se soucier du taux exigé", juste: false, retour: "Le taux exigé fait la VAN : à un taux plus haut encore, au-delà de celui qui l'annule, le même projet détruirait de la valeur." },
        ];
      },
    },
  ],
};

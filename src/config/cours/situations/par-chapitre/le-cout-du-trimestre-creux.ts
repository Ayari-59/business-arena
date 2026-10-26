import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { accord } from "../../accords";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_SERVICE, productiviteDuService } from "../../chapitres/la-productivite-du-service";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA PRODUCTIVITÉ DU SERVICE » : LE COÛT DU PERSONNEL AU TRIMESTRE
 * CREUX (BTS MHR, palier 3).
 *
 * La direction trouve que le personnel coûte trop cher par client au trimestre le plus creux de
 * l'année. Elle se fixe un objectif : revenir au coût moyen de l'année. L'élève refait seul les
 * calculs du chapitre : le coût du personnel par couvert ou par nuitée sur l'année, ce qu'il
 * aurait fallu servir au trimestre creux, avec la même équipe, pour l'atteindre, et la
 * productivité que cela demandait ; puis il dit si c'était possible, face à la demande que ce
 * trimestre a reçue et à la capacité de service.
 *
 * Le cas est neuf par sa question : le chapitre comparait le trimestre plein et le trimestre
 * creux ; ici, l'élève part d'un objectif de coût et remonte au volume qu'il exige. Les chiffres
 * sont ceux de l'année du cours (`productiviteDuService`).
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const rang = (n: number) => (n === 1 ? "1er" : `${n}e`);
/** Le pronom qui reprend les unités : « ceux » (les couverts), « celles » (les nuitées). */
const ceux = (c: Cas) => (accord(c, "un") === "une" ? "celles" : "ceux");

export type Verdict = "possible" | "demande" | "capacite";

/** L'objectif de la direction, et ce qu'il demandait au trimestre creux. */
export function coutDuTrimestreCreux(c: Cas) {
  const p = productiviteDuService(c);
  const personnelDeLAnnee = auCentime(p.trimestres.reduce((t, x) => t + x.personnel, 0));
  const venduesDeLAnnee = p.trimestres.reduce((t, x) => t + x.vendues, 0);
  const coutDeLAnnee = auCentime(personnelDeLAnnee / venduesDeLAnnee);
  const aServir = Math.ceil(p.creux.personnel / coutDeLAnnee - 1e-9);
  const verdict: Verdict = aServir > p.capacite ? "capacite" : aServir > p.creux.demande ? "demande" : "possible";
  return {
    p,
    personnelDeLAnnee,
    venduesDeLAnnee,
    coutDeLAnnee,
    aServir,
    enPlus: aServir - p.creux.vendues,
    productiviteVisee: auDixieme(aServir / p.creux.effectif),
    verdict,
  };
}

function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const { p } = coutDuTrimestreCreux(c);
  return {
    titre: `L'année ${/^[aeiouyéèêAEIOUYÉÈ]/.test(c.entreprise) ? `d'${c.entreprise}` : `de ${c.entreprise}`} dans l'arène`,
    colonnes: p.trimestres.map((t) => `${rang(t.numero)} trimestre`),
    lignes: [
      { libelle: `${majuscule(c.unites)} ${accord(c, "demandé")}s`, valeurs: p.trimestres.map((t) => qte(t.demande)) },
      { libelle: `${majuscule(c.unites)} ${c.code === "hotel" ? "vendues" : `${accord(c, "servi")}s`}`, valeurs: p.trimestres.map((t) => qte(t.vendues)) },
      { libelle: "Effectif", valeurs: p.trimestres.map((t) => `${qte(t.effectif)} salariés`) },
      { libelle: "Coût du personnel du trimestre", valeurs: p.trimestres.map((t) => eur(t.personnel)) },
    ],
  };
}

export const LE_COUT_DU_TRIMESTRE_CREUX: Situation = {
  code: "le-cout-du-trimestre-creux",
  parcours: "mhr",
  palier: 3,
  blocs: [],
  reprend: ["la-productivite-du-service"],
  commanditaire: "La direction de l'établissement",
  titre: "Le coût du personnel au trimestre creux",
  accroche:
    "Au trimestre le plus creux, le personnel a coûté bien plus cher par client que sur l'année. La direction veut y revenir à la moyenne : combien fallait-il servir, et était-ce possible ?",
  objectifs: [
    "Calculer le coût du personnel par client sur une année",
    "Remonter d'un objectif de coût au volume qu'il exige",
    "Calculer la productivité que cet objectif demande",
    "Confronter l'objectif à la demande et à la capacité de service",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_SERVICE,
    pourquoi:
      "ce cas reprend le chapitre « La productivité du service », qui compte ce que sert le personnel d'un restaurant ou d'un hôtel.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la direction",
      tableau: tableauDeLAnnee,
      texte: (c) => {
        const k = coutDuTrimestreCreux(c);
        return [
          `« Au ${rang(k.p.creux.numero)} trimestre, notre personnel nous a coûté ${eur(k.p.creux.coutParUnite)} par ${c.unite}. Sur toute l'année, nous voudrions ne pas dépasser le coût moyen. Dites-moi ce coût moyen, combien de ${c.unites} il aurait fallu servir au ${rang(k.p.creux.numero)} trimestre, avec la même équipe, pour y revenir, et si c'était possible. »`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre. ${majuscule(k.p.vocabulaire.capacityLabel)} : ${qte(k.p.creux.capaciteDAccueil)} ${c.unites} par trimestre ; ${k.p.vocabulaire.laborLabel.charAt(0).toLowerCase()}${k.p.vocabulaire.laborLabel.slice(1)} : ${qte(k.p.creux.capaciteDeLEquipe)}.`,
        ];
      },
      repere: () => "À rendre : le coût du personnel par client sur l'année, ce qu'il fallait servir au trimestre creux pour y revenir, et votre réponse.",
    },
    {
      id: "l-annee",
      type: "montants",
      titre: "Le coût moyen de l'année",
      notions: ["productivity", "payroll"],
      question: (c) =>
        `Calculez le coût du personnel de l'année, les ${c.unites} de l'année, puis le coût du personnel par ${c.unite} sur l'année, au centime.`,
      champs: (c) => {
        const k = coutDuTrimestreCreux(c);
        return [
          {
            libelle: "Coût du personnel de l'année",
            attendu: k.personnelDeLAnnee,
            calcul: `${k.p.trimestres.map((t) => eur(t.personnel)).join(" + ")} = ${eur(k.personnelDeLAnnee)}`,
            tolerance: 1,
          },
          {
            libelle: `${majuscule(c.unites)} de l'année`,
            attendu: k.venduesDeLAnnee,
            calcul: `${k.p.trimestres.map((t) => qte(t.vendues)).join(" + ")} = ${qte(k.venduesDeLAnnee)}`,
            tolerance: 0,
          },
          {
            libelle: `Coût du personnel par ${c.unite} sur l'année`,
            attendu: k.coutDeLAnnee,
            calcul: `${eur(k.personnelDeLAnnee)} ÷ ${qte(k.venduesDeLAnnee)} = ${eur(k.coutDeLAnnee)}`,
          },
        ];
      },
      explication: (c) => {
        const k = coutDuTrimestreCreux(c);
        return [
          `Sur l'année, le personnel coûte ${eur(k.coutDeLAnnee)} par ${c.unite} ; au ${rang(k.p.creux.numero)} trimestre, ${eur(k.p.creux.coutParUnite)}.`,
        ];
      },
    },
    {
      id: "le-creux",
      type: "montants",
      titre: "Ce qu'il fallait servir au trimestre creux",
      notions: ["productivity", "fixed_costs"],
      question: (c) => {
        const k = coutDuTrimestreCreux(c);
        return `Avec la même équipe, le personnel du ${rang(k.p.creux.numero)} trimestre coûte ${eur(k.p.creux.personnel)}. Calculez les ${c.unites} qu'il fallait servir pour que ${accord(c, "chacun")} ne coûte pas plus de ${eur(k.coutDeLAnnee)} (arrondi à l'unité supérieure), les ${c.unites} en plus de ${ceux(c)} du trimestre, puis la productivité par salarié sur le trimestre que cela demandait, au dixième.`;
      },
      champs: (c) => {
        const k = coutDuTrimestreCreux(c);
        return [
          {
            libelle: `${majuscule(c.unites)} à servir au ${rang(k.p.creux.numero)} trimestre`,
            attendu: k.aServir,
            calcul: `${eur(k.p.creux.personnel)} ÷ ${eur(k.coutDeLAnnee)} = ${qte(k.aServir)}`,
            tolerance: 1,
          },
          {
            libelle: `${majuscule(c.unites)} en plus`,
            attendu: k.enPlus,
            calcul: `${qte(k.aServir)} − ${qte(k.p.creux.vendues)} = ${qte(k.enPlus)}`,
            tolerance: 1,
          },
          {
            libelle: "Productivité par salarié visée",
            attendu: k.productiviteVisee,
            calcul: `${qte(k.aServir)} ÷ ${qte(k.p.creux.effectif)} = ${qte(k.productiviteVisee)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = coutDuTrimestreCreux(c);
        return [
          `Il fallait ${qte(k.enPlus)} ${c.unites} de plus au ${rang(k.p.creux.numero)} trimestre, soit ${qte(k.productiviteVisee)} par salarié au lieu de ${qte(k.p.creux.parSalarie)}. Ce trimestre, ${qte(k.p.creux.demande)} ${c.unites} ont été ${accord(c, "demandé")}s, pour une capacité de service de ${qte(k.p.capacite)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      notions: ["productivity", "capacity"],
      question: () => "Quelle réponse rendez-vous à la direction ?",
      options: (c) => {
        const k = coutDuTrimestreCreux(c);
        const chiffres = `Il fallait servir ${qte(k.aServir)} ${c.unites} au ${rang(k.p.creux.numero)} trimestre ; ${qte(k.p.creux.demande)} ont été ${accord(c, "demandé")}s, et la capacité de service était de ${qte(k.p.capacite)}.`;
        return [
          {
            texte: "Oui, c'était possible : la demande et la capacité de service le permettaient",
            juste: k.verdict === "possible",
            retour:
              k.verdict === "possible"
                ? `Oui. ${chiffres} Il suffisait de prévoir ce que les clients demandaient : « ${k.p.vocabulaire.productionPlanLabel} » était de ${qte(k.p.creux.enVente)}.`
                : `Non. ${chiffres}`,
          },
          {
            texte: "Non : il fallait plus de clients que le trimestre creux n'en a demandé à l'établissement",
            juste: k.verdict === "demande",
            retour: k.verdict === "demande" ? `Oui. ${chiffres} Il fallait d'abord attirer des clients.` : `Non. ${chiffres}`,
          },
          {
            texte: "Non : il fallait servir plus que la capacité de service",
            juste: k.verdict === "capacite",
            retour: k.verdict === "capacite" ? `Oui. ${chiffres} Même pleine, la capacité ne suffisait pas.` : `Non. ${chiffres}`,
          },
        ];
      },
    },
  ],
};

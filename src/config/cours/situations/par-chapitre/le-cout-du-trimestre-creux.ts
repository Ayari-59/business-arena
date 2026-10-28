import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { accord } from "../../accords";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_SERVICE, productiviteDuService, type ProductiviteDuService } from "../../chapitres/la-productivite-du-service";
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
 * creux ; ici, l'élève part d'un objectif de coût et remonte au volume qu'il exige.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde), pas dans
 * l'arène : les chiffres sont ceux de l'année du service au prix de l'année
 * (`productiviteDuService`, monde/service.ts).
 *
 * LE CURSEUR ET LE CROISEMENT (demande du propriétaire, octobre 2026 : un cas aussi exigeant que son
 * chapitre) : au curseur, les clients du trimestre creux face au coût moyen de l'année ; puis l'autre
 * levier, à rebours : l'équipe la plus grande qui tenait ce coût sans un client de plus, et ce que
 * chacun de ses salariés aurait servi par jour, face au trimestre le plus chargé. La réponse croise
 * les deux : la même équipe ne le pouvait pas, une équipe à la mesure du creux le pouvait-elle ?
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const rang = (n: number) => (n === 1 ? "1er" : `${n}e`);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** Le pronom qui reprend les unités : « ceux » (les couverts), « celles » (les nuitées). */
const ceux = (p: ProductiviteDuService) => (accord(p, "un") === "une" ? "celles" : "ceux");

export type Verdict = "possible" | "equipe" | "demande" | "capacite";

/** L'objectif de la direction, et ce qu'il demandait au trimestre creux. */
export function coutDuTrimestreCreux(c: Pick<Cas, "code">) {
  const p = productiviteDuService(c);
  const personnelDeLAnnee = auCentime(p.trimestres.reduce((t, x) => t + x.personnel, 0));
  const venduesDeLAnnee = p.trimestres.reduce((t, x) => t + x.vendues, 0);
  const coutDeLAnnee = auCentime(personnelDeLAnnee / venduesDeLAnnee);
  const aServir = Math.ceil(p.creux.personnel / coutDeLAnnee - 1e-9);
  // L'autre levier : l'équipe la plus grande qui tenait le coût de l'année sans un client de plus, et
  // ce que chacun de ses salariés aurait servi par jour, face au trimestre le plus chargé.
  const equipeMax = Math.floor((coutDeLAnnee * p.creux.vendues) / p.coutDUnSalarie + 1e-9);
  const personnelReduit = auCentime(equipeMax * p.coutDUnSalarie);
  const parJourReduit = Math.round((p.creux.vendues / (equipeMax * p.jours)) * 100) / 100;
  const equipePossible = equipeMax > 0 && p.creux.vendues * p.plein.effectif <= p.plein.vendues * equipeMax;
  // « possible » ne sort pas de la simulation : le trimestre creux sert déjà toute sa demande, et
  // il lui faudrait plus pour revenir au coût de l'année. La réponse reste offerte à l'élève.
  const verdict: Verdict =
    aServir <= p.creux.demande ? "possible" : aServir > p.capacite && !equipePossible ? "capacite" : equipePossible ? "equipe" : "demande";
  return {
    p,
    personnelDeLAnnee,
    venduesDeLAnnee,
    coutDeLAnnee,
    aServir,
    enPlus: aServir - p.creux.vendues,
    productiviteVisee: auDixieme(aServir / p.creux.effectif),
    equipeMax,
    personnelReduit,
    coutReduit: auCentime(personnelReduit / p.creux.vendues),
    parJourReduit,
    equipePossible,
    /** Les bornes du curseur : des clients du trimestre creux, au millier inférieur, à la capacité. */
    curseur: { min: Math.floor(p.creux.vendues / 1000) * 1000, max: p.capacite },
    verdict,
  };
}

function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const { p } = coutDuTrimestreCreux(c);
  return {
    titre: `L'année ${dE(p.entreprise)} dans la simulation du cours`,
    colonnes: p.trimestres.map((t) => `${rang(t.numero)} trimestre`),
    lignes: [
      { libelle: `${majuscule(p.unites)} ${accord(p, "demandé")}s`, valeurs: p.trimestres.map((t) => qte(t.demande)) },
      { libelle: majuscule(p.mots.servies), valeurs: p.trimestres.map((t) => qte(t.vendues)) },
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
    "Croiser le coût du personnel et la productivité d'une équipe réduite",
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
          `« Au ${rang(k.p.creux.numero)} trimestre, notre personnel nous a coûté ${eur(k.p.creux.coutParUnite)} par ${k.p.unite}. Sur toute l'année, nous voudrions ne pas dépasser le coût moyen. Dites-moi ce coût moyen, combien de ${k.p.unites} il aurait fallu servir au ${rang(k.p.creux.numero)} trimestre, avec la même équipe, pour y revenir, et si c'était possible. »`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre, dans la simulation du cours. ${majuscule(k.p.mots.etablissement)} peut ${k.p.mots.infinitif} au plus ${qte(k.p.capacite)} ${k.p.unites} par trimestre, et garde la même équipe toute l'année.`,
        ];
      },
      repere: () =>
        "À rendre : le coût du personnel par client sur l'année, ce qu'il fallait servir au trimestre creux pour y revenir, l'équipe qui y revenait sans un client de plus, et votre réponse.",
    },
    {
      id: "l-annee",
      type: "montants",
      titre: "Le coût moyen de l'année",
      notions: ["productivity", "payroll"],
      question: (c) => {
        const k = coutDuTrimestreCreux(c);
        return `Calculez le coût du personnel de l'année, les ${k.p.unites} de l'année, puis le coût du personnel par ${k.p.unite} sur l'année, au centime.`;
      },
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
            libelle: `${majuscule(k.p.unites)} de l'année`,
            attendu: k.venduesDeLAnnee,
            calcul: `${k.p.trimestres.map((t) => qte(t.vendues)).join(" + ")} = ${qte(k.venduesDeLAnnee)}`,
            tolerance: 0,
          },
          {
            libelle: `Coût du personnel par ${k.p.unite} sur l'année`,
            attendu: k.coutDeLAnnee,
            calcul: `${eur(k.personnelDeLAnnee)} ÷ ${qte(k.venduesDeLAnnee)} = ${eur(k.coutDeLAnnee)}`,
          },
        ];
      },
      explication: (c) => {
        const k = coutDuTrimestreCreux(c);
        return [
          `Sur l'année, le personnel coûte ${eur(k.coutDeLAnnee)} par ${k.p.unite} ; au ${rang(k.p.creux.numero)} trimestre, ${eur(k.p.creux.coutParUnite)}.`,
        ];
      },
    },
    {
      id: "le-cout-moyen-au-curseur",
      type: "curseur",
      titre: "Le trimestre creux au coût moyen",
      notions: ["productivity", "fixed_costs"],
      question: (c) => {
        const k = coutDuTrimestreCreux(c);
        return `Faites varier les ${k.p.mots.servies} au ${rang(k.p.creux.numero)} trimestre, avec la même équipe. Une droite donne ce que le personnel peut coûter à ${eur(k.coutDeLAnnee)} par ${k.p.unite}, le coût moyen de l'année ; l'autre, ce qu'il coûte, ${eur(k.p.creux.personnel)}. Placez le curseur sur le moins de ${k.p.unites} qui revient au coût moyen, puis validez.`;
      },
      grandeur: (c) => {
        const k = coutDuTrimestreCreux(c);
        return { libelle: `${majuscule(k.p.mots.servies)} au trimestre creux`, unite: k.p.unites };
      },
      cible: (c) => {
        const k = coutDuTrimestreCreux(c);
        return { attendu: k.aServir, min: k.curseur.min, max: k.curseur.max };
      },
      zones: ["Au coût moyen ou moins", "Au-dessus du coût moyen"],
      rates: () => ({
        dessous: "Avec si peu de clients, chacun coûte plus que le coût moyen de l'année.",
        dessus: "Moins de clients suffiraient encore : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le nombre de clients",
      lecture: (c, n) => {
        const k = coutDuTrimestreCreux(c);
        const permis = auCentime(k.coutDeLAnnee * n);
        return [
          { libelle: "Ce que le coût moyen laisse au personnel", montant: permis },
          { libelle: "Coût du personnel du trimestre", montant: k.p.creux.personnel },
          { libelle: `Coût du personnel par ${k.p.unite}`, montant: auCentime(k.p.creux.personnel / n) },
          { libelle: "Écart avec le coût du personnel", montant: auCentime(permis - k.p.creux.personnel), fort: true },
        ];
      },
      droites: (c) => {
        const k = coutDuTrimestreCreux(c);
        return {
          produit: (n) => k.coutDeLAnnee * n,
          cout: () => k.p.creux.personnel,
          libelles: ["Ce que le coût moyen laisse au personnel", "Coût du personnel du trimestre"],
        };
      },
      explication: (c) => {
        const k = coutDuTrimestreCreux(c);
        return [
          `Avec la même équipe, il fallait ${qte(k.aServir)} ${k.p.unites} au ${rang(k.p.creux.numero)} trimestre pour revenir au coût moyen ; ${qte(k.p.creux.demande)} ont été ${accord(k.p, "demandé")}s, et la capacité était de ${qte(k.p.capacite)}.`,
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
        return `Avec la même équipe, le personnel du ${rang(k.p.creux.numero)} trimestre coûte ${eur(k.p.creux.personnel)}. Calculez les ${k.p.unites} qu'il fallait servir pour que ${accord(k.p, "chacun")} ne coûte pas plus de ${eur(k.coutDeLAnnee)} (arrondi à l'unité supérieure), les ${k.p.unites} en plus de ${ceux(k.p)} du trimestre, puis la productivité par salarié sur le trimestre que cela demandait, au dixième.`;
      },
      champs: (c) => {
        const k = coutDuTrimestreCreux(c);
        return [
          {
            libelle: `${majuscule(k.p.unites)} à servir au ${rang(k.p.creux.numero)} trimestre`,
            attendu: k.aServir,
            calcul: `${eur(k.p.creux.personnel)} ÷ ${eur(k.coutDeLAnnee)} = ${qte(k.aServir)}`,
            tolerance: 1,
          },
          {
            libelle: `${majuscule(k.p.unites)} en plus`,
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
          `Il fallait ${qte(k.enPlus)} ${k.p.unites} de plus au ${rang(k.p.creux.numero)} trimestre, soit ${qte(k.productiviteVisee)} par salarié au lieu de ${qte(k.p.creux.parSalarie)}. Ce trimestre, ${qte(k.p.creux.demande)} ${k.p.unites} ont été ${accord(k.p, "demandé")}s, pour une capacité de service de ${qte(k.p.capacite)}.`,
        ];
      },
    },
    {
      id: "l-autre-levier",
      type: "montants",
      titre: "L'autre levier : l'équipe du creux",
      notions: ["productivity", "payroll", "capacity"],
      question: (c) => {
        const k = coutDuTrimestreCreux(c);
        return `Et sans un client de plus ? Remontez du coût moyen de l'année à l'équipe la plus grande qui le tenait au ${rang(k.p.creux.numero)} trimestre, puis calculez le coût du personnel par ${k.p.unite} avec cette équipe, et les ${k.p.unites} que chacun de ses salariés aurait ${accord(k.p, "servi")}s par jour.`;
      },
      champs: (c) => {
        const k = coutDuTrimestreCreux(c);
        return [
          {
            libelle: "Salariés au plus, sans client de plus",
            attendu: k.equipeMax,
            calcul: `${eur(k.coutDeLAnnee)} × ${qte(k.p.creux.vendues)} ÷ ${eur(k.p.coutDUnSalarie)} = ${qte(Math.round(((k.coutDeLAnnee * k.p.creux.vendues) / k.p.coutDUnSalarie) * 100) / 100)}, soit ${qte(k.equipeMax)} salariés`,
            tolerance: 0,
          },
          {
            libelle: `Coût du personnel par ${k.p.unite}, équipe réduite`,
            attendu: k.coutReduit,
            calcul: `${qte(k.equipeMax)} × ${eur(k.p.coutDUnSalarie)} ÷ ${qte(k.p.creux.vendues)} = ${eur(k.coutReduit)}`,
          },
          {
            libelle: `${majuscule(k.p.unites)} par salarié et par jour, équipe réduite`,
            attendu: k.parJourReduit,
            calcul: `${qte(k.p.creux.vendues)} ÷ (${qte(k.equipeMax)} × ${qte(k.p.jours)}) = ${qte(k.parJourReduit)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const k = coutDuTrimestreCreux(c);
        return [
          `Au trimestre le plus chargé, chaque salarié a servi ${qte(k.p.plein.parSalarieEtParJour)} ${k.p.unites} par jour. ${
            k.equipePossible
              ? `Une équipe de ${qte(k.equipeMax)} en aurait servi ${qte(k.parJourReduit)} : elle pouvait tenir le creux, au coût de ${eur(k.coutReduit)} par ${k.p.unite}.`
              : `Une équipe de ${qte(k.equipeMax)} en aurait servi ${qte(k.parJourReduit)} : plus qu'au plus fort de l'année, elle ne pouvait pas tenir le creux.`
          }`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      notions: ["productivity", "capacity"],
      question: () => "Quelle réponse rendez-vous à la direction ?",
      // La bonne réponse n'est jamais la plus longue : elle ne se devine pas, quelle qu'elle soit.
      options: (c) => {
        const k = coutDuTrimestreCreux(c);
        const chiffres = `Avec la même équipe, il fallait servir ${qte(k.aServir)} ${k.p.unites} au ${rang(k.p.creux.numero)} trimestre ; ${qte(k.p.creux.demande)} ont été ${accord(k.p, "demandé")}s, et la capacité de service était de ${qte(k.p.capacite)}.`;
        const equipe = `Sans un client de plus, une équipe de ${qte(k.equipeMax)} salariés tenait le coût moyen (${eur(k.coutReduit)} par ${k.p.unite}), avec ${qte(k.parJourReduit)} ${k.p.unites} par salarié et par jour, contre ${qte(k.p.plein.parSalarieEtParJour)} au trimestre le plus chargé.`;
        const dit = (v: Verdict, oui: string) => (k.verdict === v ? `Oui. ${chiffres} ${oui}`.trim() : `Non. ${chiffres} ${equipe}`);
        return [
          { texte: "Oui : la demande et la capacité permettaient de servir assez", juste: k.verdict === "possible", retour: dit("possible", "") },
          {
            texte: "Pas avec la même équipe ; une équipe réduite y arrivait",
            juste: k.verdict === "equipe",
            retour: dit("equipe", `Il fallait d'abord attirer des clients, ou ajuster l'équipe au creux. ${equipe}`),
          },
          { texte: "Non : il fallait servir plus que la capacité ne le permet", juste: k.verdict === "capacite", retour: dit("capacite", "Même pleine, la capacité ne suffisait pas.") },
          {
            texte: "Non : il manquait des clients, et l'équipe ne pouvait pas baisser",
            juste: k.verdict === "demande",
            retour: dit("demande", "Une équipe réduite aurait dû servir plus par salarié qu'au trimestre le plus chargé."),
          },
        ];
      },
    },
  ],
};

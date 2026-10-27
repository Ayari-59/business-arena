import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../../scenarios/registry";
import { accordPluriel } from "../../accords";
import { anneeJouee, type Cas } from "../../cas";
import { ENTREPRISES_DU_DIAGNOSTIC, dE } from "../../chapitres/le-diagnostic-strategique";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE DIAGNOSTIC STRATÉGIQUE » : DES CLIENTS REPARTIS SANS ÊTRE
 * SERVIS (Stratégie et management, palier 1).
 *
 * Le diagnostic de l'année le relève partout : des clients venus acheter sont repartis sans
 * rien, faute d'une production suffisante (une faiblesse, là où la demande servie reste sous le
 * taux attendu). La directrice générale veut
 * comprendre cette faiblesse avant de décider : au trimestre où l'entreprise a perdu le plus de
 * ventes, combien cela a coûté, et ce qu'il aurait fallu, produire davantage avec ce qu'elle a,
 * ou augmenter sa capacité.
 *
 * Le cas est neuf par sa question : le chapitre range le constat, le cas cherche ce qui le
 * cause. Les chiffres sont ceux du moteur, au trimestre de l'année du cours (`anneeJouee`) où
 * les ventes manquées sont les plus nombreuses : la demande adressée à l'entreprise, ses ventes,
 * son chiffre d'affaires, sa capacité de production (la plus petite de celle de l'équipement et
 * de celle de l'équipe) et le stock qu'elle avait au début du trimestre.
 *
 * Une entreprise peut avoir déjà produit à pleine capacité ce trimestre-là : toute la demande
 * manquée était alors hors de portée, et le texte le dit (`aPleineCapacite`).
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const rang = (k: number) => (k === 1 ? "1er" : `${k}e`);

export type Verdict = "production" | "capacite";

/** Le trimestre où l'entreprise a manqué le plus de ventes, et ce qui les a fait manquer. */
export function clientsRepartis(c: Cas) {
  const { partie, depart } = anneeJouee(c.code);
  const trimestres = partie.rounds.map((t, k) => {
    const r = t.results["joueur"]!;
    const avant = k === 0 ? depart : partie.rounds[k - 1]!.companies.find((x) => x.id === "joueur")!;
    const segments = Object.values(r.market.bySegment);
    const ventes = Math.round(segments.reduce((s, v) => s + v.sold, 0));
    const manquees = Math.round(segments.reduce((s, v) => s + v.lost, 0));
    return {
      numero: k + 1,
      ventes,
      manquees,
      demande: ventes + manquees,
      chiffreDAffaires: Math.round(r.incomeStatement.revenue),
      capacite: Math.round(Math.min(r.production.machineCapacity, r.production.laborCapacity)),
      production: Math.round(r.production.produced),
      stock: Math.round(avant.finishedGoods.quantity),
      rebuts: Math.round(r.qualityCosts?.defectUnits ?? 0),
    };
  });
  const t = trimestres.reduce((m, x) => (x.manquees > m.manquees ? x : m));
  const prix = auCentime(t.chiffreDAffaires / t.ventes);
  const caManque = auCentime(t.manquees * prix);
  const offreMaximale = t.capacite + t.stock;
  const horsDePortee = Math.max(0, t.demande - offreMaximale);
  const verdict: Verdict = horsDePortee > 0 ? "capacite" : "production";
  const aPleineCapacite = t.production >= t.capacite;
  return { trimestres, t, prix, caManque, offreMaximale, horsDePortee, servisEnPlus: t.manquees - horsDePortee, aPleineCapacite, verdict };
}

export const DES_CLIENTS_REPARTIS_SANS_ETRE_SERVIS: Situation = {
  code: "des-clients-repartis-sans-etre-servis",
  parcours: "strategie",
  palier: 1,
  blocs: [],
  reprend: ["le-diagnostic-strategique"],
  commanditaire: "La directrice générale",
  titre: "Des clients repartis sans être servis",
  accroche:
    "Le diagnostic le relève : des clients venus acheter sont repartis sans rien. Au trimestre où l'entreprise en a perdu le plus, ce que cela a coûté, et ce qu'il aurait fallu.",
  objectifs: [
    "Mesurer les ventes manquées et le chiffre d'affaires perdu",
    "Comparer la demande à ce que l'entreprise pouvait offrir",
    "Distinguer un manque de production et un manque de capacité",
    "Répondre à la directrice, chiffre à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_DIAGNOSTIC,
    pourquoi:
      "ce cas reprend le diagnostic de l'année, qui lit la demande du marché en ventes, et chez VOLT FITNESS le marché se compte d'abord en abonnés gardés.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la directrice",
      texte: (c) => {
        const k = clientsRepartis(c);
        return [
          `« Notre diagnostic le dit : nous laissons repartir des clients. Au ${rang(k.t.numero)} trimestre, c'est là que nous en avons perdu le plus. Dites-moi ce que cela nous a coûté, et ce qu'il aurait fallu : produire davantage avec ce que nous avons, ou augmenter notre capacité. »`,
          "Pas de cours cette fois : les chiffres sont ceux du trimestre, tels que l'arène les a joués.",
        ];
      },
      tableau: (c) => {
        const k = clientsRepartis(c);
        return {
          titre: `Le ${rang(k.t.numero)} trimestre ${dE(c.entreprise)}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: `Demande adressée à l'entreprise (${c.unites})`, valeurs: [qte(k.t.demande)] },
            { libelle: `Ventes réalisées (${c.unites})`, valeurs: [qte(k.t.ventes)] },
            { libelle: "Chiffre d'affaires du trimestre", valeurs: [eur(k.t.chiffreDAffaires)] },
            { libelle: `Capacité de production du trimestre (${c.unites})`, valeurs: [qte(k.t.capacite)] },
            ...(k.t.stock > 0 ? [{ libelle: `Stock au début du trimestre (${c.unites})`, valeurs: [qte(k.t.stock)] }] : []),
          ],
        };
      },
      repere: () => "À rendre : les ventes manquées et ce qu'elles ont coûté, ce que l'entreprise pouvait offrir au mieux, et votre réponse.",
    },
    {
      id: "cout",
      type: "montants",
      titre: "Ce que coûtent les clients perdus",
      notions: ["stock", "revenue"],
      question: () =>
        "Calculez les ventes manquées du trimestre (la demande moins les ventes), le prix moyen du trimestre (le chiffre d'affaires sur les ventes, au centime), puis le chiffre d'affaires manqué.",
      champs: (c) => {
        const k = clientsRepartis(c);
        return [
          { libelle: "Ventes manquées du trimestre", attendu: k.t.manquees, calcul: `${qte(k.t.demande)} − ${qte(k.t.ventes)} = ${qte(k.t.manquees)}`, tolerance: 0 },
          { libelle: "Prix moyen du trimestre", attendu: k.prix, calcul: `${eur(k.t.chiffreDAffaires)} ÷ ${qte(k.t.ventes)} = ${eur(k.prix)}`, tolerance: 0.01 },
          { libelle: "Chiffre d'affaires manqué", attendu: k.caManque, calcul: `${qte(k.t.manquees)} × ${eur(k.prix)} = ${eur(k.caManque)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = clientsRepartis(c);
        return [
          `${qte(k.t.manquees)} ${c.unites} ${accordPluriel(c, "demandé")} n'ont pas été ${accordPluriel(c, "servi")} : ${eur(k.caManque)} de chiffre d'affaires perdus, au prix que l'entreprise avait elle-même fixé.`,
        ];
      },
    },
    {
      id: "capacite",
      type: "montants",
      titre: "Ce que l'entreprise pouvait offrir",
      notions: ["capacity", "stock"],
      question: (c) =>
        clientsRepartis(c).t.stock > 0
          ? "Au mieux, l'entreprise pouvait offrir sa capacité de production du trimestre et son stock du début du trimestre. Calculez cette offre maximale, puis la demande hors de portée : ce qui dépassait l'offre maximale (0 si elle suffisait)."
          : `Au mieux, l'entreprise pouvait offrir sa capacité de production du trimestre : ${
              scenarioByCode(c.code).scenario.perishable ? "ce qu'elle produit ne se garde pas d'un trimestre à l'autre" : "elle n'avait pas de stock au début du trimestre"
            }. Calculez cette offre maximale, puis la demande hors de portée : ce qui la dépassait (0 si elle suffisait).`,
      champs: (c) => {
        const k = clientsRepartis(c);
        return [
          {
            libelle: "Offre maximale du trimestre",
            attendu: k.offreMaximale,
            calcul: k.t.stock > 0 ? `${qte(k.t.capacite)} + ${qte(k.t.stock)} = ${qte(k.offreMaximale)}` : `la capacité : ${qte(k.offreMaximale)}`,
            tolerance: 0,
          },
          {
            libelle: "Demande hors de portée",
            attendu: k.horsDePortee,
            calcul: k.horsDePortee > 0 ? `${qte(k.t.demande)} − ${qte(k.offreMaximale)} = ${qte(k.horsDePortee)}` : `${qte(k.t.demande)} ne dépasse pas ${qte(k.offreMaximale)} : 0`,
            tolerance: 0,
          },
        ];
      },
      explication: (c) => {
        const k = clientsRepartis(c);
        return [
          k.aPleineCapacite
            ? `L'entreprise a déjà produit à pleine capacité, ${qte(k.t.production)} ${c.unites} : toute la demande manquée, ${qte(k.horsDePortee)} ${c.unites}, était hors de portée, et seule une capacité plus grande l'aurait servie.`
            : k.horsDePortee > 0
              ? `En produisant à pleine capacité, l'entreprise aurait servi ${qte(k.servisEnPlus)} ${c.unites} de plus ; il en restait ${qte(k.horsDePortee)} hors de portée, que seule une capacité plus grande aurait servis.`
              : `En produisant à pleine capacité, l'entreprise aurait servi toute la demande : elle a produit ${qte(k.t.production)} ${c.unites}, pour une capacité de ${qte(k.t.capacite)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice",
      notions: ["capacity"],
      question: () => "Quelle phrase envoyez-vous à la directrice ?",
      options: (c) => {
        const k = clientsRepartis(c);
        const chiffres = `${qte(k.t.demande)} ${c.unites} ${accordPluriel(c, "demandé")}, pour une offre maximale de ${qte(k.offreMaximale)}`;
        return [
          {
            texte: "Produire davantage : la capacité suffisait pour servir toute la demande",
            juste: k.verdict === "production",
            retour:
              k.verdict === "production"
                ? `Oui : ${chiffres}. L'entreprise avait de quoi servir tous ses clients ; elle n'a pas produit assez. C'est sa prévision de production qu'il faut revoir, pas son équipement.`
                : `Non : ${chiffres}. Même à pleine capacité, ${qte(k.horsDePortee)} ${c.unites} restaient hors de portée.`,
          },
          {
            texte: "Augmenter la capacité : même à plein, elle ne suffisait pas",
            juste: k.verdict === "capacite",
            retour:
              k.verdict === "capacite"
                ? k.aPleineCapacite
                  ? `Oui : ${chiffres}. L'entreprise produisait déjà à pleine capacité ; pour servir les ${qte(k.horsDePortee)} ${c.unites} qui manquaient, il faut une capacité plus grande : de l'équipement ou du personnel en plus.`
                  : `Oui : ${chiffres}. Produire à plein aurait déjà servi ${qte(k.servisEnPlus)} ${c.unites} de plus ; pour le reste, ${qte(k.horsDePortee)}, il faut une capacité plus grande : de l'équipement ou du personnel en plus.`
                : `Non : ${chiffres}. La capacité suffisait : augmenter la capacité coûterait sans servir un client de plus.`,
          },
          {
            texte: "Rien : ces clients trouvaient le prix trop élevé",
            juste: false,
            retour: `Non : ces clients voulaient acheter, au prix de l'entreprise. Ils sont repartis parce qu'il n'y avait plus rien à leur vendre : ${chiffres}.`,
          },
          {
            texte: "Baisser le prix au trimestre suivant, pour que les clients repartis reviennent acheter chez nous",
            juste: false,
            retour: "Non : ces clients acceptaient le prix. Le baisser attirerait encore plus de demande, que l'entreprise ne servirait pas davantage, et chaque vente rapporterait moins.",
          },
        ];
      },
    },
  ],
};

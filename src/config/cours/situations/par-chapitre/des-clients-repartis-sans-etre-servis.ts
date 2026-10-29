import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_DIAGNOSTIC } from "../../chapitres/le-diagnostic-strategique";
import { trimestreLePlusRefuse } from "../../monde/direction-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE DIAGNOSTIC STRATÉGIQUE » : DES CLIENTS REPARTIS SANS ÊTRE SERVIS
 * (Stratégie et management, palier 1).
 *
 * Le diagnostic de NOVA le relève : en N + 1, la ligne de montage refusera des clients, une faiblesse.
 * La directrice générale veut comprendre cette faiblesse avant de décider : au trimestre où NOVA en
 * refusera le plus, combien cela coûtera, et ce qu'il faudrait, produire davantage avec ce qu'elle
 * a, ou augmenter sa capacité.
 *
 * Le cas est neuf par sa question : le chapitre range le constat, le cas cherche ce qui le cause. Les
 * chiffres sont ceux du chapitre, dans le monde du cours (`trimestreLePlusRefuse`,
 * monde/direction-de-nova.ts) : la demande du trimestre, ce que la ligne et l'équipe peuvent monter,
 * la marge d'une enceinte.
 *
 * CE QUI A CHANGÉ. Le cas lisait le trimestre de l'arène où chaque entreprise manquait le plus de
 * ventes ; il se joue chez NOVA : à Noël de N + 1, 800 enceintes refusées, 16 800 € de marge perdue,
 * la ligne pour goulot.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const rang = (k: number) => (k === 1 ? "1er" : `${k}e`);

export type Verdict = "production" | "capacite";

/** Le trimestre où NOVA refusera le plus de clients, et ce qui les fera refuser. */
export function clientsRepartis(_c?: Cas) {
  const t = trimestreLePlusRefuse();
  const verdict: Verdict = t.goulot === "outil" ? "capacite" : "production";
  return { ...t, chiffreDAffairesPerdu: t.refusees * (t.chiffreDAffaires / t.production), verdict };
}

export const DES_CLIENTS_REPARTIS_SANS_ETRE_SERVIS: Situation = {
  code: "des-clients-repartis-sans-etre-servis",
  parcours: "strategie",
  palier: 1,
  blocs: [],
  reprend: ["le-diagnostic-strategique"],
  commanditaire: "La directrice générale",
  titre: "Des clients repartis sans être servis",
  accroche: "Le diagnostic le relève : des clients venus acheter repartiront sans rien. Au trimestre où l'entreprise en refusera le plus, ce que cela coûtera, et ce qu'il faudrait.",
  objectifs: [
    "Mesurer les ventes manquées et la marge perdue",
    "Comparer la demande à ce que l'entreprise peut offrir",
    "Distinguer un manque de production et un manque de capacité",
    "Répondre à la directrice, chiffre à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_DIAGNOSTIC,
    pourquoi: "ce cas reprend le diagnostic de NOVA, celui du chapitre, et l'atelier de son année N + 1.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la directrice",
      texte: () => {
        const k = clientsRepartis();
        return [
          `« Le diagnostic dit que nous refuserons ${qte(k.refuseesDeLAnnee)} clients en N + 1, et le ${rang(k.trimestre)} trimestre sera le pire. Avant de décider quoi que ce soit, je veux savoir ce que cela nous coûtera, et pourquoi : produisons-nous trop peu avec ce que nous avons, ou n'avons-nous pas de quoi produire plus ? » La directrice générale`,
          "Pas de cours cette fois : les chiffres sont ceux du diagnostic, et la règle du goulot, vous la connaissez.",
        ];
      },
      tableau: () => {
        const k = clientsRepartis();
        return {
          titre: `Le ${rang(k.trimestre)} trimestre de N + 1, en enceintes`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Demande prévue", valeurs: [qte(k.demande)] },
            { libelle: "Ce que la ligne peut monter", valeurs: [qte(k.capaciteOutil)] },
            { libelle: "Ce que l'équipe peut monter", valeurs: [qte(k.capaciteEquipe)] },
            { libelle: "Marge d'une enceinte", valeurs: [eur(k.margeUnitaire)] },
          ],
        };
      },
      repere: () => "À rendre : les enceintes refusées et la marge perdue, ce qui borne la production, et votre réponse.",
    },
    {
      id: "le-cout",
      type: "montants",
      titre: "Ce que coûtent les clients refusés",
      notions: ["capacity", "contribution_margin"],
      question: () => "Calculez ce que NOVA montera ce trimestre (la plus petite de la demande, de la ligne et de l'équipe), les enceintes refusées, puis la marge perdue.",
      champs: () => {
        const k = clientsRepartis();
        return [
          { libelle: "Enceintes montées", attendu: k.production, calcul: `la plus petite de ${qte(k.demande)}, ${qte(k.capaciteOutil)} et ${qte(k.capaciteEquipe)} : ${qte(k.production)}`, tolerance: 0 },
          { libelle: "Enceintes refusées", attendu: k.refusees, calcul: `${qte(k.demande)} − ${qte(k.production)} = ${qte(k.refusees)}`, tolerance: 0 },
          { libelle: "Marge perdue", attendu: k.margePerdue, calcul: `${qte(k.refusees)} × ${eur(k.margeUnitaire)} = ${eur(k.margePerdue)}`, tolerance: 1 },
        ];
      },
      explication: () => {
        const k = clientsRepartis();
        return [`Ce trimestre, ${qte(k.refusees)} clients repartiront sans enceinte : ${eur(k.margePerdue)} de marge perdue, et des clients qui iront peut-être chez un concurrent pour de bon.`];
      },
    },
    {
      id: "ce-qui-borne",
      type: "choix",
      titre: "Ce qui borne la production",
      notions: ["capacity"],
      question: () => "Qu'est-ce qui borne la production ce trimestre-là ?",
      options: () => {
        const k = clientsRepartis();
        return [
          {
            texte: "La ligne de montage",
            juste: k.goulot === "outil",
            retour: k.goulot === "outil" ? `Oui : la ligne monte ${qte(k.capaciteOutil)} enceintes, l'équipe pourrait en monter ${qte(k.jeuDeLEquipe)} de plus.` : "Non : la ligne pourrait monter davantage.",
          },
          {
            texte: "L'équipe, trop peu nombreuse pour servir tous les clients",
            juste: k.goulot === "equipe",
            retour: k.goulot === "equipe" ? "Oui : l'équipe monte moins que la ligne ne le permet." : `Non : l'équipe peut monter ${qte(k.capaciteEquipe)} enceintes, plus que la ligne.`,
          },
          {
            texte: "La demande : il n'y a pas assez de clients ce trimestre",
            juste: k.goulot === "demande",
            retour: k.goulot === "demande" ? "Oui : tous les clients sont servis." : `Non : ${qte(k.demande)} enceintes sont demandées, plus que NOVA ne peut en monter.`,
          },
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice",
      question: () => "Que répondez-vous à la directrice ?",
      options: () => {
        const k = clientsRepartis();
        return [
          {
            texte: "Il faut plus de capacité : la ligne est déjà pleine",
            juste: k.verdict === "capacite",
            retour:
              k.verdict === "capacite"
                ? `Oui : la ligne tourne à plein, ${qte(k.capaciteOutil)} enceintes ; produire mieux avec ce qu'elle a n'en sortira pas une de plus. Il faut augmenter sa capacité, ${k.machine.nom.toLowerCase()} par exemple, et l'équipe pour le tenir : l'équipe n'a que ${qte(k.jeuDeLEquipe)} enceintes de marge.`
                : "Non : la ligne pourrait monter davantage.",
          },
          {
            texte: "Il faut produire davantage avec ce que nous avons : l'équipe a encore de la marge",
            juste: k.verdict === "production",
            retour:
              k.verdict === "production"
                ? "Oui : l'outil pourrait monter davantage, c'est l'organisation qui bride."
                : `Non : l'équipe a bien ${qte(k.jeuDeLEquipe)} enceintes de marge, mais c'est la ligne qui borne : elle ne peut monter que ${qte(k.capaciteOutil)} enceintes.`,
          },
          {
            texte: "Il faut baisser les prix pour garder ces clients la prochaine fois",
            juste: false,
            retour: "Non : ces clients voulaient acheter au prix d'aujourd'hui. Baisser le prix en attirerait d'autres, que la ligne ne pourrait pas servir non plus.",
          },
        ];
      },
    },
  ],
};

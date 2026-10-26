import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { TAUX_DE_PERTE_ESTIME, creanceDouteuse } from "../../provisions";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DÉPRÉCIATIONS ET PROVISIONS » : LA CRÉANCE QUI SE DÉGRADE
 * (comptabilité générale, palier 4).
 *
 * La créance du chapitre, celle du client en redressement judiciaire, a été dépréciée au
 * 31 décembre de la perte que le mandataire laissait craindre. Un an plus tard, la
 * procédure n'est pas finie, et le mandataire revoit la perte à la hausse. Le directeur
 * financier demande ce que cela coûte de plus au résultat de l'année, et ce que vaudra la
 * créance au bilan. L'élève refait seul le chemin du chapitre : la créance hors taxes, la
 * dépréciation qu'il faut, le complément à doter et son écriture, la valeur nette de la
 * créance, puis la phrase qu'il rend.
 *
 * Le cas est neuf par sa question : le chapitre déprécie une fois, puis solde la créance ;
 * ici, une dépréciation déjà passée s'ajuste à une estimation nouvelle. La créance, sa TVA
 * et la première dépréciation sont celles du chapitre (`creanceDouteuse`).
 */

/**
 * La perte que le mandataire laisse craindre un an après l'ouverture du redressement : 70 %
 * de la créance hors taxes. Le plan de redressement n'a pas été adopté ; un créancier sans
 * garantie, payé après les salariés, l'État et les banques, n'espère plus qu'une petite part.
 */
export const TAUX_DE_PERTE_REVU = 0.7;

const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

/** Les chiffres de la réponse, calculés une fois de la créance du chapitre. */
export function creanceQuiSeDegrade(c: Cas) {
  const d = creanceDouteuse(c);
  const necessaire = auCentime(d.ht * TAUX_DE_PERTE_REVU);
  const complement = auCentime(necessaire - d.depreciation);
  return {
    ...d,
    necessaire,
    complement,
    valeurNette: auCentime(d.ttc - necessaire),
    // Les erreurs classiques : doter toute la perte, en oubliant ce qui est déjà déprécié,
    // ou calculer le complément sur la créance TVA comprise.
    toutLaPerte: necessaire,
    surLeTtc: auCentime(d.ttc * TAUX_DE_PERTE_REVU - d.ttc * TAUX_DE_PERTE_ESTIME),
  };
}

export const LA_CREANCE_QUI_SE_DEGRADE: Situation = {
  code: "la-creance-qui-se-degrade",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["depreciations-et-provisions"],
  commanditaire: "Le directeur financier",
  titre: "La créance qui se dégrade",
  accroche:
    "Un an après le redressement du client, le mandataire revoit la perte à la hausse. Le directeur financier veut savoir ce que cela coûte de plus au résultat, et ce que vaut encore la créance.",
  objectifs: [
    "Calculer une dépréciation de créance sur son montant hors taxes",
    "Ajuster une dépréciation déjà constatée à une estimation nouvelle",
    "Enregistrer le complément de dépréciation",
    "Lire la valeur nette d'une créance au bilan",
    "Rédiger une réponse chiffrée au directeur financier",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du directeur financier",
      texte: (c) => {
        const r = creanceQuiSeDegrade(c);
        return [
          `« À la dernière clôture, nous avons déprécié la créance ${r.deClient} de ${pct(TAUX_DE_PERTE_ESTIME)} de son montant hors taxes. Un an plus tard, le redressement n'a pas abouti, et le mandataire laisse maintenant craindre une perte de ${pct(TAUX_DE_PERTE_REVU)}. Combien cela coûte-t-il de plus à notre résultat de cette année, et que vaudra la créance à notre bilan ? »`,
          "Pas de cours cette fois : vous avez le dossier de la créance, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = creanceQuiSeDegrade(c);
        return {
          titre: `La créance ${r.deClient} · ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Créance douteuse au compte 416, TVA comprise", valeurs: [eur(r.ttc)] },
            { libelle: "TVA de la vente", valeurs: [pct(r.tauxTva)] },
            { libelle: "Perte probable estimée à la dernière clôture", valeurs: [pct(TAUX_DE_PERTE_ESTIME)] },
            { libelle: "Dépréciation déjà constatée au compte 491", valeurs: [eur(r.depreciation)] },
            { libelle: "Perte probable estimée aujourd'hui", valeurs: [pct(TAUX_DE_PERTE_REVU)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la dépréciation qu'il faut aujourd'hui et le complément à doter, son écriture, la valeur nette de la créance au bilan, et votre réponse.",
    },
    {
      id: "depreciation-necessaire",
      type: "montants",
      titre: "La dépréciation qu'il faut",
      notions: ["payment_terms"],
      question: () =>
        "Calculez la créance hors taxes, la dépréciation qu'appelle la nouvelle estimation, puis ce qu'il faut doter en plus de ce qui est déjà constaté.",
      champs: (c) => {
        const r = creanceQuiSeDegrade(c);
        return [
          { libelle: "Créance hors taxes", attendu: r.ht, calcul: `${eur(r.ttc)} ÷ ${(1 + r.tauxTva).toLocaleString("fr-FR")} = ${eur(r.ht)}` },
          { libelle: "Dépréciation nécessaire", attendu: r.necessaire, calcul: `${eur(r.ht)} × ${pct(TAUX_DE_PERTE_REVU)} = ${eur(r.necessaire)}` },
          { libelle: "Complément à doter", attendu: r.complement, calcul: `${eur(r.necessaire)} − ${eur(r.depreciation)} déjà constatés = ${eur(r.complement)}` },
        ];
      },
      explication: (c) => {
        const r = creanceQuiSeDegrade(c);
        return [
          `La dépréciation suit l'estimation : elle doit valoir ${eur(r.necessaire)}. Le compte 491 en porte déjà ${eur(r.depreciation)}, passés à la dernière clôture ; il ne manque que ${eur(r.complement)}. Hors taxes toujours : si la perte se confirme, l'État rendra à ${c.entreprise} la TVA de la part perdue.`,
        ];
      },
    },
    {
      id: "complement",
      type: "ecriture",
      titre: "Le complément, au journal",
      notions: ["payment_terms", "income_statement"],
      evenement: (c) => {
        const r = creanceQuiSeDegrade(c);
        return `Au 31 décembre, passez le complément de dépréciation de la créance ${r.deClient}.`;
      },
      ecriture: (c) => {
        const r = creanceQuiSeDegrade(c);
        return {
          date: "31 décembre N+1",
          libelle: `Complément de dépréciation, ${r.client}`,
          lignes: [
            {
              role: "la charge de l'année, la dotation aux dépréciations",
              compte: "6817",
              acceptes: ["681"],
              sens: "debit",
              montant: r.complement,
              indice: "le complément à doter",
            },
            { role: "la dépréciation de la créance, augmentée", compte: "491", sens: "credit", montant: r.complement, indice: "le complément à doter" },
          ],
        };
      },
      indices: () => [
        "La même écriture qu'une première dépréciation : une dotation au débit, le compte de dépréciation des clients au crédit.",
        "Le montant : pas toute la dépréciation nécessaire, seulement ce qui manque au compte 491. Au débit, les dotations aux dépréciations des actifs circulants (6817).",
      ],
      explication: (c) => {
        const r = creanceQuiSeDegrade(c);
        return [
          `L'année porte ${eur(r.complement)} de charges : la part de la perte que la dernière clôture n'avait pas vue. Pas un euro ne sort de la banque, et la créance garde sa valeur d'origine au compte 416.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "au-bilan",
      type: "montants",
      titre: "La créance au bilan",
      notions: ["payment_terms"],
      question: () =>
        "Après le complément, combien le compte 491 porte-t-il en tout ? Et pour quelle valeur nette la créance figure-t-elle au bilan ?",
      champs: (c) => {
        const r = creanceQuiSeDegrade(c);
        return [
          { libelle: "Dépréciation cumulée au compte 491", attendu: r.necessaire, calcul: `${eur(r.depreciation)} + ${eur(r.complement)} = ${eur(r.necessaire)}` },
          { libelle: "Valeur nette de la créance", attendu: r.valeurNette, calcul: `${eur(r.ttc)} − ${eur(r.necessaire)} = ${eur(r.valeurNette)}` },
        ];
      },
      explication: (c) => {
        const r = creanceQuiSeDegrade(c);
        return [
          `Au bilan, la créance ${r.deClient} ne compte plus que pour ${eur(r.valeurNette)} : ce qu'on espère encore recevoir, et la TVA que l'État rendra sur la part perdue.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur financier",
      question: () => "Quelle phrase envoyez-vous au directeur financier ?",
      options: (c) => {
        const r = creanceQuiSeDegrade(c);
        return [
          {
            texte: `Il faut ${eur(r.complement)} de dépréciation en plus cette année`,
            juste: true,
            retour: `Oui : ${eur(r.ht)} hors taxes × ${pct(TAUX_DE_PERTE_REVU)} = ${eur(r.necessaire)} de dépréciation, dont ${eur(r.depreciation)} déjà constatés. Le complément, ${eur(r.complement)}, est la seule charge de l'année ; la créance vaut ${eur(r.valeurNette)} net au bilan.`,
          },
          {
            texte: `Il faut doter ${eur(r.toutLaPerte)} cette année : toute la perte probable`,
            juste: false,
            retour: `Non : ${eur(r.depreciation)} de cette perte ont déjà été passés à la dernière clôture. Les doter une seconde fois compterait la même perte deux fois ; on ne dote que ce qui manque, ${eur(r.complement)}.`,
          },
          {
            texte: `Il faut doter ${eur(r.surLeTtc)} en plus : la perte supplémentaire, TVA comprise`,
            juste: false,
            retour: `Non : la dépréciation se calcule hors taxes. La TVA de la part perdue, l'État la rendra ; ce n'est pas une perte pour l'entreprise. Le complément est de ${eur(r.complement)}.`,
          },
          {
            texte: "Rien à passer : la créance est déjà dépréciée depuis la dernière clôture",
            juste: false,
            retour: `Non : une dépréciation suit l'estimation de chaque clôture. Le mandataire craint une perte plus lourde : il faut ${eur(r.complement)} de plus.`,
          },
        ];
      },
    },
  ],
};

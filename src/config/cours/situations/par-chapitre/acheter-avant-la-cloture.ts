import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { planDAmortissement } from "../../chapitres/immobilisations";
import { cloture } from "../../chapitres/la-cloture";
import { dateDuCours as date, moisEtJour } from "../../dates";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA CLÔTURE » : ACHETER AVANT LA CLÔTURE ? (comptabilité
 * générale, palier 3).
 *
 * Un mois avant la fin de l'année, le dirigeant pense acheter un second équipement pour
 * payer moins d'impôt : à ses yeux, le prix viendra en charges. L'élève refait seul le
 * chemin du chapitre : le résultat avant impôt après les travaux d'inventaire, l'impôt,
 * puis les mêmes calculs avec la dotation d'un mois du nouvel équipement, et la phrase
 * qu'il rend au dirigeant.
 *
 * Le cas est neuf par sa question : la clôture du chapitre ne connaît que les équipements
 * de l'arène ; ici, un achat de décembre s'y ajoute, et l'élève mesure ce qu'il change
 * vraiment à l'impôt. L'année, la dotation, le stock et le taux d'impôt sont ceux du cas
 * (`cloture`), l'équipement celui du 6 janvier (`planDAmortissement`).
 */

/**
 * Le jour de la mise en service de l'équipement acheté : le 1er décembre (le jour 335). Le
 * moment où, l'impôt de l'année se dessinant, un dirigeant pense à « acheter pour
 * déduire » : l'équipement ne servira qu'un mois dans l'exercice.
 */
export const JOUR_DE_L_ACHAT = 335;

/** L'année commerciale du prorata, celle du chapitre « Immobilisations » : douze mois de trente jours. */
const ANNEE_COMMERCIALE = 360;
const JOURS_PAR_MOIS = 30;
const MOIS_PAR_AN = 12;

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const impotSur = (resultat: number, taux: number) => (resultat > 0 ? Math.round(resultat * taux) : 0);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function acheterAvantLaCloture(c: Cas) {
  const k = cloture(c);
  const p = planDAmortissement(c);
  const { mois, jour } = moisEtJour(JOUR_DE_L_ACHAT);
  // Même règle que le chapitre « Immobilisations » : le jour de la mise en service compte.
  const jours = JOURS_PAR_MOIS - jour + 1 + (MOIS_PAR_AN - 1 - mois) * JOURS_PAR_MOIS;
  const dotation = auCentime((p.annuite * jours) / ANNEE_COMMERCIALE);
  const resultatAvec = auCentime(k.resultatAvantImpot - dotation);
  const impotAvec = impotSur(resultatAvec, k.tauxIS);
  return {
    ...k,
    designation: c.immobilisation.designation,
    compte: c.immobilisation.compte,
    prix: p.base,
    ttc: c.immobilisation.ttc,
    duree: p.duree,
    annuite: p.annuite,
    jours,
    dotationDeDecembre: dotation,
    resultatAvec,
    impotAvec,
    economie: k.impot - impotAvec,
    payeDeLImpot: k.impot > 0,
    // Les erreurs classiques : déduire tout le prix, ou une annuité entière.
    surLePrix: impotSur(p.base, k.tauxIS),
    surLAnnuite: impotSur(p.annuite, k.tauxIS),
  };
}

export const ACHETER_AVANT_LA_CLOTURE: Situation = {
  code: "acheter-avant-la-cloture",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["la-cloture"],
  commanditaire: "Le dirigeant",
  titre: "Acheter avant la clôture pour payer moins d'impôt ?",
  accroche:
    "Un mois avant la fin de l'année, le dirigeant veut acheter un équipement pour faire baisser l'impôt. Avant qu'il signe, vous chiffrez ce que l'achat change vraiment.",
  objectifs: [
    "Calculer le résultat avant impôt après les travaux d'inventaire",
    "Calculer l'impôt sur les sociétés de l'année",
    "Calculer la dotation d'un équipement acheté en fin d'année",
    "Mesurer ce qu'un achat de décembre change au résultat et à l'impôt",
    "Rédiger une réponse chiffrée au dirigeant",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du dirigeant",
      texte: (c) => {
        const r = acheterAvantLaCloture(c);
        return [
          `« Il reste un mois avant la clôture. Si j'achète un second équipement (${r.designation}, ${eur(r.prix)} hors taxes) et qu'il est en service le ${date(JOUR_DE_L_ACHAT)}, son prix vient en charges et ${c.entreprise} paiera moins d'impôt, non ? Dites-moi ce que cet achat changera à l'impôt de l'année. »`,
          "Pas de cours cette fois : vous avez la balance de l'année et le plan d'amortissement, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = acheterAvantLaCloture(c);
        const stock = r.stock
          ? [
              { libelle: `${r.stock.nature === "en-cours" ? "Travaux en cours" : "Stock de marchandises"} au 1er janvier`, valeurs: [eur(r.stock.initial)] },
              { libelle: `${r.stock.nature === "en-cours" ? "Travaux en cours" : "Stock de marchandises"} au 31 décembre, après inventaire`, valeurs: [eur(r.stock.final)] },
            ]
          : [];
        return {
          titre: `L'année au 31 décembre · ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Résultat de la balance avant inventaire", valeurs: [eur(r.resultatAvantInventaire)] },
            { libelle: "Dotation aux amortissements des équipements actuels", valeurs: [eur(r.dotation)] },
            ...stock,
            { libelle: "Impôt sur les sociétés, arrondi à l'euro ; une perte n'en paie pas", valeurs: [pct(r.tauxIS)] },
            { libelle: `Second équipement (${r.designation}), hors taxes`, valeurs: [eur(r.prix)] },
            { libelle: "Durée d'utilisation, amortissement linéaire", valeurs: [`${qte(r.duree)} ans`] },
            { libelle: "Mise en service", valeurs: [date(JOUR_DE_L_ACHAT)] },
            { libelle: "Prorata du temps", valeurs: [`mois de ${qte(JOURS_PAR_MOIS)} jours, année de ${qte(ANNEE_COMMERCIALE)}`] },
          ],
        };
      },
      repere: () =>
        "À rendre : le résultat avant impôt et l'impôt sans l'achat, la dotation du nouvel équipement et son écriture, le résultat et l'impôt avec l'achat, et votre réponse.",
    },
    {
      id: "sans-l-achat",
      type: "montants",
      titre: "L'année sans l'achat",
      notions: ["income_statement"],
      question: () =>
        "Partez de la balance : les travaux d'inventaire passés, quel est le résultat avant impôt de l'année ? Et l'impôt sur les sociétés ?",
      champs: (c) => {
        const r = acheterAvantLaCloture(c);
        const stock = r.variation !== 0 ? ` ${r.variation > 0 ? "+" : "−"} ${eur(Math.abs(r.variation))} de variation du stock` : "";
        return [
          {
            libelle: "Résultat avant impôt, sans l'achat",
            attendu: r.resultatAvantImpot,
            calcul: `${eur(r.resultatAvantInventaire)} − ${eur(r.dotation)} de dotation${stock} = ${eur(r.resultatAvantImpot)}`,
          },
          {
            libelle: "Impôt sur les sociétés, sans l'achat",
            attendu: r.impot,
            calcul: r.payeDeLImpot ? `${eur(r.resultatAvantImpot)} × ${pct(r.tauxIS)} = ${eur(r.impot)}` : "une perte : pas d'impôt, 0 €",
          },
        ];
      },
      explication: (c) => {
        const r = acheterAvantLaCloture(c);
        return [
          r.payeDeLImpot
            ? `Sans rien acheter, ${c.entreprise} gagne ${eur(r.resultatAvantImpot)} avant impôt et doit ${eur(r.impot)} à l'État. C'est ce chiffre que le dirigeant voudrait faire baisser.`
            : `Sans rien acheter, ${c.entreprise} perd ${eur(-r.resultatAvantImpot)} sur l'année : elle ne paiera pas d'impôt. Le dirigeant ne le sait pas encore.`,
        ];
      },
    },
    {
      id: "dotation-de-decembre",
      type: "montants",
      titre: "Ce que l'équipement coûte cette année",
      notions: ["depreciation"],
      question: (c) => {
        const r = acheterAvantLaCloture(c);
        return `Le prix ne vient pas en charges : l'équipement s'amortit. Calculez l'annuité d'une année pleine, les jours d'utilisation du ${date(JOUR_DE_L_ACHAT)} au 31 décembre, puis la dotation de l'année, sur ${qte(r.duree)} ans.`;
      },
      champs: (c) => {
        const r = acheterAvantLaCloture(c);
        return [
          { libelle: "Annuité d'une année pleine", attendu: r.annuite, calcul: `${eur(r.prix)} ÷ ${qte(r.duree)} ans = ${eur(r.annuite)}` },
          { libelle: "Jours d'utilisation dans l'année", attendu: r.jours, calcul: `du ${date(JOUR_DE_L_ACHAT)} au 31 décembre, en mois de ${qte(JOURS_PAR_MOIS)} jours : ${qte(r.jours)} jours` },
          { libelle: "Dotation de l'année", attendu: r.dotationDeDecembre, calcul: `${eur(r.annuite)} × ${qte(r.jours)} ÷ ${qte(ANNEE_COMMERCIALE)} = ${eur(r.dotationDeDecembre)}` },
        ];
      },
      explication: (c) => {
        const r = acheterAvantLaCloture(c);
        return [
          `Sur les ${eur(r.prix)} payés, l'année n'en porte que ${eur(r.dotationDeDecembre)} : ${qte(r.jours)} jours d'usure. Le reste entre à l'actif et se répartira sur les années où l'équipement servira à ${c.entreprise}.`,
        ];
      },
    },
    {
      id: "ecriture-de-la-dotation",
      type: "ecriture",
      titre: "La dotation, au journal",
      notions: ["depreciation"],
      evenement: (c) => {
        const r = acheterAvantLaCloture(c);
        return `L'équipement est acheté. Au 31 décembre, passez sa dotation de l'année : ${eur(r.dotationDeDecembre)}.`;
      },
      ecriture: (c) => {
        const r = acheterAvantLaCloture(c);
        return {
          date: "31 décembre",
          libelle: "Dotation aux amortissements : l'équipement de décembre",
          lignes: [
            { role: "la charge de l'année, la dotation", compte: "6811", acceptes: ["681"], sens: "debit", montant: r.dotationDeDecembre, indice: "la dotation de l'année" },
            {
              role: "l'amortissement de l'équipement",
              compte: r.compteAmortissement,
              acceptes: [`28${r.compte.slice(1, 3)}`, "281"],
              sens: "credit",
              montant: r.dotationDeDecembre,
              indice: "la dotation de l'année",
            },
          ],
        };
      },
      indices: (c) => [
        "Une charge au débit : la dotation aux amortissements.",
        `Au crédit, le compte d'amortissement de l'équipement : 28, puis le numéro de l'équipement sans le 2 (${c.immobilisation.compte}).`,
      ],
      explication: (c) => {
        const r = acheterAvantLaCloture(c);
        return [`C'est la seule charge que l'achat ajoute à l'année : ${eur(r.dotationDeDecembre)}, pas ${eur(r.prix)}.`];
      },
      vue: "resultat",
    },
    {
      id: "avec-l-achat",
      type: "montants",
      titre: "L'année avec l'achat",
      notions: ["income_statement"],
      question: () =>
        "Avec la dotation du nouvel équipement, quel est le résultat avant impôt de l'année, et l'impôt ? Combien d'impôt l'achat fait-il économiser ?",
      champs: (c) => {
        const r = acheterAvantLaCloture(c);
        return [
          {
            libelle: "Résultat avant impôt, avec l'achat",
            attendu: r.resultatAvec,
            calcul: `${eur(r.resultatAvantImpot)} − ${eur(r.dotationDeDecembre)} = ${eur(r.resultatAvec)}`,
          },
          {
            libelle: "Impôt sur les sociétés, avec l'achat",
            attendu: r.impotAvec,
            calcul: r.resultatAvec > 0 ? `${eur(r.resultatAvec)} × ${pct(r.tauxIS)} = ${eur(r.impotAvec)}` : "une perte : pas d'impôt, 0 €",
          },
          { libelle: "Impôt économisé", attendu: r.economie, calcul: `${eur(r.impot)} − ${eur(r.impotAvec)} = ${eur(r.economie)}` },
        ];
      },
      explication: (c) => {
        const r = acheterAvantLaCloture(c);
        return [
          r.payeDeLImpot
            ? `L'achat fait sortir ${eur(r.ttc)} de la banque, TVA comprise, pour ${eur(r.economie)} d'impôt en moins cette année. Un équipement s'achète parce qu'il sert à ${c.entreprise}, pas pour l'impôt.`
            : `${c.entreprise} est en perte avec ou sans l'achat : pas d'impôt à économiser. La dotation ajoute ${eur(r.dotationDeDecembre)} à la perte, qui se reportera sur les bénéfices des années suivantes.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      question: () => "Quelle phrase envoyez-vous au dirigeant ?",
      options: (c) => {
        const r = acheterAvantLaCloture(c);
        const juste = r.payeDeLImpot
          ? `L'achat ne fera baisser l'impôt que de ${eur(r.economie)} cette année`
          : "Aucun impôt cette année : l'achat n'en fera pas économiser";
        return [
          {
            texte: juste,
            juste: true,
            retour: r.payeDeLImpot
              ? `Oui : seule la dotation de ${qte(r.jours)} jours, ${eur(r.dotationDeDecembre)}, vient en charges. L'impôt passe de ${eur(r.impot)} à ${eur(r.impotAvec)}.`
              : `Oui : ${c.entreprise} perd ${eur(-r.resultatAvantImpot)} sur l'année, avant même l'achat. Il n'y a pas d'impôt à faire baisser ; la dotation, ${eur(r.dotationDeDecembre)}, ne fait qu'ajouter à la perte.`,
          },
          {
            texte: `Il fera baisser l'impôt de ${eur(r.surLePrix)} : tout son prix vient en charges cette année`,
            juste: false,
            retour: `Non : le prix d'un équipement entre à l'actif, il ne va pas en charges. Seule sa dotation, ${eur(r.dotationDeDecembre)} pour ${qte(r.jours)} jours, pèse sur le résultat de l'année.`,
          },
          {
            texte: `Il fera baisser l'impôt de ${eur(r.surLAnnuite)} : une année d'amortissement`,
            juste: false,
            retour: `Non : l'annuité de ${eur(r.annuite)} vaut pour une année pleine. Mis en service le ${date(JOUR_DE_L_ACHAT)}, l'équipement ne sert que ${qte(r.jours)} jours cette année : ${eur(r.dotationDeDecembre)} de dotation.`,
          },
        ];
      },
    },
  ],
};

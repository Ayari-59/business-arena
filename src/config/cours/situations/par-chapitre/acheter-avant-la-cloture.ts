import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_CLOTURE, clotureDeNova, dateDe } from "../../chapitres/la-cloture";
import { joursCompris, JOURS_DE_L_ANNEE, JOURS_DU_MOIS, type DateDuCours } from "../../monde/amortissement";
import { impotSurLesSocietes } from "../../monde/cloture";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA CLÔTURE » : ACHETER AVANT LA CLÔTURE ? (comptabilité générale,
 * palier 3).
 *
 * Un mois avant la clôture, le dirigeant de NOVA pense avancer en décembre l'achat de la seconde
 * ligne de montage, prévue pour la gamme de N+1, pour payer moins d'impôt : à ses yeux, le prix
 * viendra en charges. L'élève refait seul le chemin du chapitre (le résultat avant impôt après les
 * travaux d'inventaire, l'impôt au barème), puis la dotation d'un mois de la nouvelle ligne et son
 * effet, au taux marginal. Un curseur sur le prix de l'équipement, puis un calcul à rebours,
 * montrent ce qu'il faudrait acheter pour économiser l'impôt que vise le dirigeant : le mythe se
 * chiffre. La réponse demande un jugement, pas une lecture : un équipement s'achète quand il sert.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : ses
 * chiffres sont ceux de `clotureDeNova`. La seconde ligne est la même que la première (la fiche,
 * monde/exercice-de-nova.ts, EQUIPEMENT) ; seule sa date de mise en service est une hypothèse du cas.
 */

/**
 * LA MISE EN SERVICE DE LA SECONDE LIGNE, hypothèse du cas : le 1er décembre N, le moment où, l'impôt
 * de l'exercice se dessinant, un dirigeant pense à « acheter pour déduire ».
 */
export const MISE_EN_SERVICE_EN_DECEMBRE: DateDuCours = { jour: 1, mois: 12 };

/** L'économie d'impôt que vise le dirigeant, et que le curseur et le calcul à rebours cherchent : un montant rond. */
export const ECONOMIE_VISEE = 1_000;

/** La borne haute du curseur du prix, en euros hors taxes. */
export const PRIX_MAXIMAL_DU_CURSEUR = 400_000;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

/** Les chiffres de la réponse, calculés une fois de la clôture du chapitre. */
export function acheterAvantLaCloture(c: Pick<Cas, "code">) {
  const x = clotureDeNova(c);
  const f = x.f;
  const e = f.equipement;
  const b = f.impot;
  const annuite = auCentime(e.ht / e.dureeAns);
  const jours = joursCompris(MISE_EN_SERVICE_EN_DECEMBRE, f.cloture);
  const dotation = auCentime((annuite * jours) / JOURS_DE_L_ANNEE);
  const resultatAvec = auCentime(x.resultatAvantImpot - dotation);
  const impotAvec = impotSurLesSocietes(resultatAvec, b).impot;
  // Le calcul à rebours : la dotation qui ferait économiser l'impôt visé au taux marginal, l'annuité, le prix.
  const dotationVisee = auCentime(ECONOMIE_VISEE / b.tauxNormal);
  const annuiteVisee = auCentime((dotationVisee * JOURS_DE_L_ANNEE) / jours);
  const prixVise = auCentime(annuiteVisee * e.dureeAns);
  return {
    x,
    f,
    e,
    b,
    annuite,
    jours,
    dotation,
    resultatSans: x.resultatAvantImpot,
    impotSans: x.impot.impot,
    resultatAvec,
    impotAvec,
    economie: auCentime(x.impot.impot - impotAvec),
    dotationVisee,
    annuiteVisee,
    prixVise,
    // Les erreurs classiques : déduire tout le prix, une annuité entière, ou compter au taux réduit.
    surLePrix: auCentime(e.ht * b.tauxNormal),
    surLAnnuite: auCentime(annuite * b.tauxNormal),
    auTauxReduit: Math.round(dotation * b.tauxReduit),
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
    "Un mois avant la clôture, le dirigeant veut avancer l'achat de la seconde ligne pour faire baisser l'impôt. Avant qu'il signe, vous chiffrez ce que l'achat change vraiment, et ce qu'il faudrait acheter pour l'économie qu'il espère.",
  objectifs: [
    "Calculer le résultat avant impôt après les travaux d'inventaire, et l'impôt au barème",
    "Calculer la dotation d'un équipement mis en service en fin d'exercice",
    "Mesurer ce qu'un achat de décembre change au résultat et à l'impôt, au taux marginal",
    "Retrouver à rebours le prix qu'il faudrait payer pour une économie d'impôt donnée",
    "Rédiger une réponse chiffrée et argumentée au dirigeant",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_CLOTURE,
    pourquoi: "ce cas reprend « La clôture », qui se joue sur le premier exercice de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du dirigeant",
      texte: (c) => {
        const r = acheterAvantLaCloture(c);
        return [
          `« La seconde ligne de montage est prévue pour la gamme de l'an prochain : ${qte(r.e.quantite)} postes « ${r.e.designation} », ${eur(r.e.ht)} hors taxes. Si je l'achète maintenant et qu'elle est en service le ${dateDe(MISE_EN_SERVICE_EN_DECEMBRE)}, son prix vient en charges et ${r.f.entreprise} paiera beaucoup moins d'impôt cette année, non ? Dites-moi ce que cet achat changera à l'impôt, et ce qu'il faudrait acheter pour économiser ${eur(ECONOMIE_VISEE)}. »`,
          "Pas de cours cette fois : vous avez la balance et les travaux d'inventaire de l'exercice, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = acheterAvantLaCloture(c);
        const x = r.x;
        return {
          titre: `L'exercice au 31 décembre · ${r.f.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Résultat de la balance avant inventaire", valeurs: [eur(x.resultatDeLaBalance)] },
            { libelle: "Dotation aux amortissements de la première ligne", valeurs: [eur(x.dotation)] },
            { libelle: "Intérêts courus du compte à terme, à recevoir", valeurs: [eur(x.placement)] },
            { libelle: "Stock final de composants", valeurs: [eur(x.stockFinal)] },
            { libelle: "Achat de composants livré, facture non parvenue, hors taxes", valeurs: [eur(x.fnp.ht)] },
            { libelle: "Intérêts courus de l'emprunt, à payer", valeurs: [eur(x.icne.montant)] },
            { libelle: "Impôt sur les sociétés, arrondi à l'euro", valeurs: [`${pct(r.b.tauxReduit)} jusqu'à ${eur(r.b.plafondDuTauxReduit)}, ${pct(r.b.tauxNormal)} au-delà`] },
            { libelle: `Seconde ligne (${r.e.designation}), hors taxes`, valeurs: [eur(r.e.ht)] },
            { libelle: "Durée d'utilisation, amortissement linéaire", valeurs: [`${qte(r.e.dureeAns)} ans`] },
            { libelle: "Mise en service", valeurs: [dateDe(MISE_EN_SERVICE_EN_DECEMBRE)] },
            { libelle: "Prorata du temps", valeurs: [`mois de ${qte(JOURS_DU_MOIS)} jours, année de ${qte(JOURS_DE_L_ANNEE)}, jours compris`] },
          ],
        };
      },
      repere: () =>
        "À rendre : le résultat avant impôt et l'impôt sans l'achat, la dotation de la seconde ligne et son écriture, le résultat et l'impôt avec l'achat, le prix qu'il faudrait payer pour l'économie que vise le dirigeant, et votre réponse.",
    },
    {
      id: "sans-l-achat",
      type: "montants",
      titre: "L'exercice sans l'achat",
      notions: ["income_statement"],
      question: () => "Partez de la balance : les travaux d'inventaire passés, quel est le résultat avant impôt de l'exercice ? Et l'impôt sur les sociétés ?",
      champs: (c) => {
        const r = acheterAvantLaCloture(c);
        const x = r.x;
        return [
          {
            libelle: "Résultat avant impôt, sans l'achat",
            attendu: r.resultatSans,
            calcul: `${eur(x.resultatDeLaBalance)} − ${eur(x.dotation)} + ${eur(x.placement)} + ${eur(x.stockFinal)} − ${eur(x.fnp.ht)} − ${eur(x.icne.montant)} = ${eur(r.resultatSans)}`,
          },
          {
            libelle: "Impôt sur les sociétés, sans l'achat",
            attendu: r.impotSans,
            calcul: `${eur(x.impot.aTauxReduit)} + (${eur(r.resultatSans)} − ${eur(r.b.plafondDuTauxReduit)}) × ${pct(r.b.tauxNormal)} = ${eur(x.impot.exact)}, arrondi à ${eur(r.impotSans)}`,
          },
        ];
      },
      explication: (c) => {
        const r = acheterAvantLaCloture(c);
        return [
          `Sans rien acheter, ${r.f.entreprise} gagne ${eur(r.resultatSans)} avant impôt et doit ${eur(r.impotSans)} à l'État. Le stock final monte le résultat, la facture non parvenue et les intérêts courus le baissent : c'est ce chiffre que le dirigeant voudrait faire baisser.`,
        ];
      },
    },
    {
      id: "dotation-de-decembre",
      type: "montants",
      titre: "Ce que la ligne coûte cette année",
      notions: ["depreciation"],
      question: (c) => {
        const r = acheterAvantLaCloture(c);
        return `Le prix ne vient pas en charges : la ligne s'amortit, sur ${qte(r.e.dureeAns)} ans. Calculez l'annuité d'une année pleine, les jours d'utilisation du ${dateDe(MISE_EN_SERVICE_EN_DECEMBRE)} au 31 décembre, puis la dotation de l'exercice.`;
      },
      champs: (c) => {
        const r = acheterAvantLaCloture(c);
        return [
          { libelle: "Annuité d'une année pleine", attendu: r.annuite, calcul: `${eur(r.e.ht)} ÷ ${qte(r.e.dureeAns)} ans = ${eur(r.annuite)}` },
          {
            libelle: "Jours d'utilisation dans l'exercice",
            attendu: r.jours,
            calcul: `du ${dateDe(MISE_EN_SERVICE_EN_DECEMBRE)} au 31 décembre, jours compris, en mois de ${qte(JOURS_DU_MOIS)} jours : ${qte(r.jours)} jours`,
          },
          { libelle: "Dotation de l'exercice", attendu: r.dotation, calcul: `${eur(r.annuite)} × ${qte(r.jours)} ÷ ${qte(JOURS_DE_L_ANNEE)} = ${eur(r.dotation)}` },
        ];
      },
      explication: (c) => {
        const r = acheterAvantLaCloture(c);
        return [
          `Sur les ${eur(r.e.ht)} payés, l'exercice n'en porte que ${eur(r.dotation)} : ${qte(r.jours)} jours d'usure. Le reste entre à l'actif et se répartira sur les années où la ligne servira.`,
        ];
      },
    },
    {
      id: "ecriture-de-la-dotation",
      type: "ecriture",
      titre: "La dotation, au journal",
      notions: ["depreciation"],
      evenement: (c) => `La seconde ligne est achetée. Au 31 décembre, passez sa dotation de l'exercice : ${eur(acheterAvantLaCloture(c).dotation)}.`,
      ecriture: (c) => {
        const r = acheterAvantLaCloture(c);
        return {
          date: "31 décembre",
          libelle: "Dotation aux amortissements : la ligne de décembre",
          lignes: [
            { role: "la charge de l'exercice, la dotation", compte: "6811", acceptes: ["681"], sens: "debit", montant: r.dotation, indice: "la dotation de l'exercice" },
            { role: "l'amortissement de la ligne", compte: r.e.compteDAmortissement, acceptes: ["2815", "281"], sens: "credit", montant: r.dotation, indice: "la dotation de l'exercice" },
          ],
        };
      },
      indices: (c) => [
        "Une charge au débit : la dotation aux amortissements (6811).",
        `Au crédit, le compte d'amortissement de la ligne : 28, puis le numéro de l'immobilisation sans le 2 (${acheterAvantLaCloture(c).e.compte}).`,
      ],
      explication: (c) => {
        const r = acheterAvantLaCloture(c);
        return [`C'est la seule charge que l'achat ajoute à l'exercice : ${eur(r.dotation)}, pas ${eur(r.e.ht)}.`];
      },
      vue: "resultat",
    },
    {
      id: "avec-l-achat",
      type: "montants",
      titre: "L'exercice avec l'achat",
      notions: ["income_statement"],
      question: () =>
        "Avec la dotation de la seconde ligne, quel est le résultat avant impôt de l'exercice, et l'impôt ? Combien d'impôt l'achat fait-il économiser ?",
      champs: (c) => {
        const r = acheterAvantLaCloture(c);
        return [
          { libelle: "Résultat avant impôt, avec l'achat", attendu: r.resultatAvec, calcul: `${eur(r.resultatSans)} − ${eur(r.dotation)} = ${eur(r.resultatAvec)}` },
          {
            libelle: "Impôt sur les sociétés, avec l'achat",
            attendu: r.impotAvec,
            calcul: `${eur(r.x.impot.aTauxReduit)} + (${eur(r.resultatAvec)} − ${eur(r.b.plafondDuTauxReduit)}) × ${pct(r.b.tauxNormal)}, arrondi : ${eur(r.impotAvec)}`,
          },
          { libelle: "Impôt économisé", attendu: r.economie, calcul: `${eur(r.impotSans)} − ${eur(r.impotAvec)} = ${eur(r.economie)}, soit ${pct(r.b.tauxNormal)} de la dotation, à l'arrondi près` },
        ];
      },
      explication: (c) => {
        const r = acheterAvantLaCloture(c);
        return [
          `L'achat fait sortir ${eur(r.e.ttc)} de la banque, TVA comprise (la TVA se récupérera), pour ${eur(r.economie)} d'impôt en moins cette année. Le résultat de ${r.f.entreprise} est au-delà du plafond du taux réduit : chaque euro de dotation fait économiser ${pct(r.b.tauxNormal)}, son taux marginal, pas plus.`,
        ];
      },
    },
    {
      id: "le-prix-au-curseur",
      type: "curseur",
      titre: "Ce qu'il faudrait acheter",
      notions: ["depreciation", "income_statement"],
      question: (c) => {
        const r = acheterAvantLaCloture(c);
        return `Faites varier le prix hors taxes d'un équipement mis en service le ${dateDe(MISE_EN_SERVICE_EN_DECEMBRE)} et amorti sur ${qte(r.e.dureeAns)} ans. Une droite donne l'impôt que sa dotation fait économiser, au taux marginal, l'autre l'économie que vise le dirigeant. Placez le curseur sur le plus petit prix qui l'atteint, puis validez.`;
      },
      grandeur: () => ({ libelle: "Prix hors taxes de l'équipement", unite: "€" }),
      cible: (c) => {
        const r = acheterAvantLaCloture(c);
        // L'économie vaut prix ÷ durée × jours ÷ 360 × taux marginal : elle atteint l'économie visée au prix trouvé à rebours.
        return { attendu: Math.ceil(r.prixVise - 1e-6), min: 0, max: PRIX_MAXIMAL_DU_CURSEUR };
      },
      zones: ["L'économie visée est atteinte", "L'économie visée n'est pas atteinte"],
      rates: () => ({
        dessous: "À ce prix, la dotation de décembre ne fait pas encore économiser l'impôt visé.",
        dessus: "Moins cher, l'économie visée est encore atteinte : cherchez le plus petit prix.",
      }),
      montrer: "Montrer le prix",
      lecture: (c, p) => {
        const r = acheterAvantLaCloture(c);
        const dotation = auCentime((p * r.jours) / (r.e.dureeAns * JOURS_DE_L_ANNEE));
        return [
          { libelle: "Dotation de décembre", montant: dotation },
          { libelle: "Impôt économisé, au taux marginal", montant: auCentime(dotation * r.b.tauxNormal), fort: true },
          { libelle: "Ce qui sort de la banque, TVA comprise", montant: auCentime(p * (1 + r.f.tauxDeTva)) },
        ];
      },
      droites: (c) => {
        const r = acheterAvantLaCloture(c);
        return {
          produit: (p) => (p * r.jours * r.b.tauxNormal) / (r.e.dureeAns * JOURS_DE_L_ANNEE),
          cout: () => ECONOMIE_VISEE,
          libelles: ["Impôt économisé par la dotation", "Économie visée par le dirigeant"],
        };
      },
      explication: (c) => {
        const r = acheterAvantLaCloture(c);
        return [
          `Il faudrait acheter pour ${eur(r.prixVise)} hors taxes, ${eur(auCentime(r.prixVise * (1 + r.f.tauxDeTva)))} sortis de la banque, pour économiser ${eur(ECONOMIE_VISEE)} d'impôt cette année : un mois d'amortissement, au taux marginal, ne rend en impôt que le ${qte(Math.round(r.prixVise / ECONOMIE_VISEE))}e du prix.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Le prix, à rebours",
      notions: ["depreciation", "income_statement"],
      question: () =>
        "Refaites le chemin à l'envers, de l'économie d'impôt que vise le dirigeant au prix de l'équipement : la dotation qu'il faudrait, l'annuité d'une année pleine qui la donne sur un mois, puis le prix.",
      champs: (c) => {
        const r = acheterAvantLaCloture(c);
        return [
          { libelle: "Dotation de décembre nécessaire", attendu: r.dotationVisee, calcul: `${eur(ECONOMIE_VISEE)} ÷ ${pct(r.b.tauxNormal)} = ${eur(r.dotationVisee)}` },
          { libelle: "Annuité d'une année pleine", attendu: r.annuiteVisee, calcul: `${eur(r.dotationVisee)} × ${qte(JOURS_DE_L_ANNEE)} ÷ ${qte(r.jours)} = ${eur(r.annuiteVisee)}` },
          { libelle: "Prix hors taxes de l'équipement", attendu: r.prixVise, calcul: `${eur(r.annuiteVisee)} × ${qte(r.e.dureeAns)} ans = ${eur(r.prixVise)}` },
        ];
      },
      explication: (c) => {
        const r = acheterAvantLaCloture(c);
        return [
          `C'est le prix du curseur : ${eur(r.prixVise)}, plus de ${qte(Math.floor(r.prixVise / r.e.ht))} fois la seconde ligne. Un achat de fin d'exercice ne déplace presque rien : l'impôt suit la dotation, et la dotation suit le temps d'utilisation.`,
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
        return [
          {
            texte: `Seulement ${eur(r.economie)} d'impôt en moins : n'achetez pas pour l'impôt`,
            juste: true,
            retour: `Oui : seule la dotation de ${qte(r.jours)} jours, ${eur(r.dotation)}, vient en charges, et elle fait économiser ${pct(r.b.tauxNormal)} de son montant. L'impôt passe de ${eur(r.impotSans)} à ${eur(r.impotAvec)}, pour ${eur(r.e.ttc)} sortis de la banque. Il faudrait ${eur(r.prixVise)} d'équipement pour économiser ${eur(ECONOMIE_VISEE)} : la ligne s'achète quand la gamme en aura besoin.`,
          },
          {
            texte: `${eur(r.surLePrix)} d'impôt en moins : tout le prix vient en charges cette année`,
            juste: false,
            retour: `Non : le prix d'un équipement entre à l'actif, il ne va pas en charges. Seule sa dotation, ${eur(r.dotation)} pour ${qte(r.jours)} jours, pèse sur le résultat de l'exercice.`,
          },
          {
            texte: `${eur(r.surLAnnuite)} d'impôt en moins : une année entière d'amortissement`,
            juste: false,
            retour: `Non : l'annuité de ${eur(r.annuite)} vaut pour une année pleine. En service le ${dateDe(MISE_EN_SERVICE_EN_DECEMBRE)}, la ligne ne sert que ${qte(r.jours)} jours cet exercice : ${eur(r.dotation)} de dotation.`,
          },
          {
            texte: `${eur(r.auTauxReduit)} d'impôt en moins : la dotation au taux réduit de ${pct(r.b.tauxReduit)}`,
            juste: false,
            retour: `Non : le taux réduit ne porte que sur les premiers ${eur(r.b.plafondDuTauxReduit)} de résultat. ${r.f.entreprise} est bien au-delà : la dotation de décembre retire des euros imposés à ${pct(r.b.tauxNormal)}.`,
          },
        ];
      },
    },
  ],
};

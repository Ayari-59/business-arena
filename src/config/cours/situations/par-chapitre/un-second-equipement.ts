import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { planDAmortissement } from "../../chapitres/immobilisations";
import { dateDuCours as date, moisEtJour } from "../../dates";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « IMMOBILISATIONS ET AMORTISSEMENTS » : UN SECOND ÉQUIPEMENT
 * (comptabilité générale, palier 3).
 *
 * La direction veut un second équipement, identique à celui du 6 janvier, livré et
 * installé à la mi-avril. Avant de signer, elle demande ce qu'il coûtera au résultat de
 * l'année et ce qu'il vaudra dans les comptes au 31 décembre. L'élève refait seul le
 * chemin du chapitre : le coût d'entrée (le prix et les frais pour le mettre en service),
 * l'écriture d'achat, le plan de la première année au prorata du temps, la dotation du
 * 31 décembre, puis la phrase qu'il rend.
 *
 * Le cas est neuf par sa question : la date de mise en service n'est plus celle du
 * chapitre, et la livraison et l'installation, que le chapitre ne fait que classer, se
 * chiffrent. Le prix, la TVA et la durée d'utilisation sont ceux du cas (`cas.ts`).
 */

/**
 * Le jour de la mise en service : le 16 avril (le jour 106 de l'année). Une date en cours
 * de mois, à l'approche de la belle saison, pour que le prorata compte les jours du premier
 * mois comme dans le chapitre.
 */
export const JOUR_DE_MISE_EN_SERVICE = 106;

/**
 * La livraison et l'installation, facturées à part : 6 % du prix hors taxes, l'ordre de
 * grandeur d'un transport et d'un montage d'équipement professionnel.
 */
export const TAUX_DES_FRAIS_D_INSTALLATION = 0.06;

/** L'année commerciale du prorata, celle du chapitre : douze mois de trente jours. */
const ANNEE_COMMERCIALE = 360;
const JOURS_PAR_MOIS = 30;
const MOIS_PAR_AN = 12;
const FIN_D_ANNEE = 365;

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function secondEquipement(c: Cas) {
  const p = planDAmortissement(c);
  const i = c.immobilisation;
  const frais = auCentime(i.ht * TAUX_DES_FRAIS_D_INSTALLATION);
  // Le coût d'entrée : le prix et ce qu'il faut payer pour que l'équipement serve.
  const cout = auCentime(i.ht + frais);
  const tva = auCentime(cout * i.tauxTva);
  const annuite = auCentime(cout * p.taux);
  const { mois, jour } = moisEtJour(JOUR_DE_MISE_EN_SERVICE);
  // Même règle que le chapitre : le jour de la mise en service compte.
  const premierMois = JOURS_PAR_MOIS - jour + 1;
  const moisPleins = MOIS_PAR_AN - 1 - mois;
  const jours = premierMois + moisPleins * JOURS_PAR_MOIS;
  const dotation = auCentime((annuite * jours) / ANNEE_COMMERCIALE);
  // L'erreur classique : passer l'installation en charges, et n'amortir que le prix.
  const annuiteSurLePrix = auCentime(i.ht * p.taux);
  const dotationSurLePrix = auCentime((annuiteSurLePrix * jours) / ANNEE_COMMERCIALE);
  return {
    designation: i.designation,
    compte: i.compte,
    acceptes: i.acceptes,
    prix: i.ht,
    tauxTva: i.tauxTva,
    frais,
    cout,
    tva,
    ttc: auCentime(cout + tva),
    duree: p.duree,
    taux: p.taux,
    annuite,
    jour,
    // « 16 avril » : le mois de la mise en service, en toutes lettres.
    nomDuMois: date(JOUR_DE_MISE_EN_SERVICE).split(" ")[1]!,
    premierMois,
    moisPleins,
    jours,
    dotation,
    vnc: auCentime(cout - dotation),
    compteAmortissement: p.compteAmortissement,
    installationEnCharges: auCentime(frais + dotationSurLePrix),
  };
}

export const UN_SECOND_EQUIPEMENT: Situation = {
  code: "un-second-equipement",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["immobilisations"],
  commanditaire: "La direction",
  titre: "Un second équipement en avril",
  accroche:
    "La direction veut un second équipement, livré et installé à la mi-avril. Avant de signer, elle veut savoir ce qu'il coûtera au résultat de l'année et ce qu'il vaudra au bilan.",
  objectifs: [
    "Calculer le coût d'entrée d'une immobilisation, frais d'installation compris",
    "Enregistrer l'achat d'une immobilisation",
    "Calculer la première dotation au prorata du temps d'utilisation",
    "Enregistrer la dotation et lire la valeur nette comptable",
    "Rédiger une réponse chiffrée à la direction",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const r = secondEquipement(c);
        return [
          `« Nous voulons un second équipement, identique à celui du 6 janvier (${r.designation}). Le fournisseur peut le livrer et l'installer le ${date(JOUR_DE_MISE_EN_SERVICE)} ; nous le réglerons par virement le jour même. Avant de signer, je veux savoir ce qu'il coûtera à notre résultat de cette année, et ce qu'il vaudra dans nos comptes au 31 décembre. »`,
          "Pas de cours cette fois : vous avez le devis du fournisseur, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = secondEquipement(c);
        return {
          titre: `Le devis du fournisseur · ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: `${r.designation}, prix hors taxes`, valeurs: [eur(r.prix)] },
            { libelle: "Livraison et installation, facturées à part", valeurs: [`${pct(TAUX_DES_FRAIS_D_INSTALLATION)} du prix`] },
            { libelle: "TVA", valeurs: [pct(r.tauxTva)] },
            { libelle: "Mise en service", valeurs: [date(JOUR_DE_MISE_EN_SERVICE)] },
            { libelle: "Durée d'utilisation, amortissement linéaire", valeurs: [`${qte(r.duree)} ans`] },
            { libelle: "Prorata du temps", valeurs: [`mois de ${qte(JOURS_PAR_MOIS)} jours, année de ${qte(ANNEE_COMMERCIALE)}`] },
          ],
        };
      },
      repere: () =>
        "À rendre : le coût d'entrée de l'équipement, l'écriture d'achat, la dotation de l'année et la valeur nette comptable au 31 décembre, l'écriture de la dotation, et votre réponse.",
    },
    {
      id: "cout-d-entree",
      type: "montants",
      titre: "Le coût de l'équipement",
      notions: ["depreciation"],
      question: () =>
        "Que coûte l'équipement, tel qu'il entrera à l'actif ? Calculez les frais de livraison et d'installation, puis le coût d'acquisition hors taxes.",
      champs: (c) => {
        const r = secondEquipement(c);
        return [
          { libelle: "Livraison et installation, hors taxes", attendu: r.frais, calcul: `${eur(r.prix)} × ${pct(TAUX_DES_FRAIS_D_INSTALLATION)} = ${eur(r.frais)}` },
          { libelle: "Coût d'acquisition, hors taxes", attendu: r.cout, calcul: `${eur(r.prix)} + ${eur(r.frais)} = ${eur(r.cout)}` },
        ];
      },
      explication: (c) => {
        const r = secondEquipement(c);
        return [
          `Sans livraison ni installation, l'équipement ne servirait pas : ces ${eur(r.frais)} font partie de ce qu'il coûte. Il entre à l'actif pour ${eur(r.cout)}, et c'est sur ce montant qu'il s'amortira.`,
        ];
      },
    },
    {
      id: "achat",
      type: "ecriture",
      titre: "L'achat, au journal",
      notions: ["depreciation"],
      evenement: (c) => {
        const r = secondEquipement(c);
        return `Le ${date(JOUR_DE_MISE_EN_SERVICE)}, ${c.entreprise} reçoit son second équipement (${r.designation}), installé, et règle la facture par virement : ${eur(r.cout)} hors taxes, livraison et installation comprises, et ${eur(r.tva)} de TVA.`;
      },
      ecriture: (c) => {
        const r = secondEquipement(c);
        return {
          date: date(JOUR_DE_MISE_EN_SERVICE),
          libelle: `Achat : ${r.designation}, installé`,
          lignes: [
            { role: "l'équipement, à son coût d'acquisition", compte: r.compte, acceptes: r.acceptes, sens: "debit", montant: r.cout, indice: "le prix et l'installation, hors taxes" },
            { role: "la TVA déductible", compte: "44562", acceptes: ["44566"], sens: "debit", montant: r.tva, indice: "la TVA de la facture" },
            { role: "le paiement par la banque", compte: "512", sens: "credit", montant: r.ttc, indice: "le montant réglé, taxes comprises" },
          ],
        };
      },
      indices: (c) => [
        `Un équipement qui servira plusieurs années : une immobilisation, classe 2, au compte qui correspond à « ${c.immobilisation.designation} ».`,
        "L'installation ne va pas en charges : elle entre dans le coût de l'équipement, sur la même ligne. La TVA se déduit, sur immobilisations ; la banque paie le total.",
      ],
      explication: (c) => {
        const r = secondEquipement(c);
        return [`Le compte ${r.compte} reçoit ${eur(r.cout)} : la valeur brute du second équipement. Le résultat de l'année n'a pas encore bougé.`];
      },
      vue: "immobilisation",
    },
    {
      id: "premiere-dotation",
      type: "montants",
      titre: "La dotation de l'année",
      notions: ["depreciation"],
      question: (c) => {
        const r = secondEquipement(c);
        return `Bâtissez la première année du plan : le taux, l'annuité d'une année pleine, les jours d'utilisation du ${date(JOUR_DE_MISE_EN_SERVICE)} au 31 décembre, la dotation de l'année, puis la valeur nette comptable au 31 décembre. Durée d'utilisation : ${qte(r.duree)} ans.`;
      },
      champs: (c) => {
        const r = secondEquipement(c);
        return [
          { libelle: "Taux d'amortissement, en %", attendu: auCentime(r.taux * 100), calcul: `100 % ÷ ${qte(r.duree)} ans = ${pct(r.taux)}` },
          { libelle: "Annuité d'une année pleine", attendu: r.annuite, calcul: `${eur(r.cout)} ÷ ${qte(r.duree)} ans = ${eur(r.annuite)}` },
          {
            libelle: "Jours d'utilisation dans l'année",
            attendu: r.jours,
            calcul: `du ${r.jour} au ${JOURS_PAR_MOIS} ${r.nomDuMois}, ${qte(r.premierMois)} jours, puis ${qte(r.moisPleins)} mois de ${qte(JOURS_PAR_MOIS)} jours : ${qte(r.jours)} jours`,
          },
          { libelle: "Dotation de l'année", attendu: r.dotation, calcul: `${eur(r.annuite)} × ${qte(r.jours)} ÷ ${qte(ANNEE_COMMERCIALE)} = ${eur(r.dotation)}` },
          { libelle: "Valeur nette comptable au 31 décembre", attendu: r.vnc, calcul: `${eur(r.cout)} − ${eur(r.dotation)} = ${eur(r.vnc)}` },
        ];
      },
      explication: (c) => {
        const r = secondEquipement(c);
        return [
          `L'équipement ne sert que ${qte(r.jours)} jours sur ${qte(ANNEE_COMMERCIALE)} cette année : il coûte ${eur(r.dotation)} au résultat, pas une annuité pleine. Ce qui manque sera pris la dernière année du plan.`,
        ];
      },
    },
    {
      id: "dotation",
      type: "ecriture",
      titre: "La dotation du 31 décembre",
      notions: ["depreciation"],
      evenement: (c) => {
        const r = secondEquipement(c);
        return `Le 31 décembre, le comptable enregistre l'amortissement du second équipement pour l'année : ${eur(r.dotation)}.`;
      },
      ecriture: (c) => {
        const r = secondEquipement(c);
        return {
          date: date(FIN_D_ANNEE),
          libelle: "Dotation aux amortissements : le second équipement",
          lignes: [
            { role: "la charge de l'année, la dotation", compte: "6811", acceptes: ["681"], sens: "debit", montant: r.dotation, indice: "la dotation de l'année" },
            {
              role: "l'amortissement de l'équipement",
              compte: r.compteAmortissement,
              acceptes: [`28${r.compte.slice(1, 3)}`, "281"],
              sens: "credit",
              montant: r.dotation,
              indice: "la dotation de l'année",
            },
          ],
        };
      },
      indices: (c) => [
        "Au débit, une charge : les dotations aux amortissements, classe 6.",
        `Au crédit, pas le compte de l'équipement : son usure se cumule à part, au compte d'amortissement. Son numéro : 28, puis celui de l'équipement sans le 2 (${c.immobilisation.compte}).`,
      ],
      explication: (c) => {
        const r = secondEquipement(c);
        return [
          `Le compte ${r.compte} garde ${eur(r.cout)} ; le compte ${r.compteAmortissement} porte ${eur(r.dotation)}. Au bilan, le second équipement apparaît pour sa valeur nette, ${eur(r.vnc)}. Et la dotation ne sort pas d'argent : l'équipement a été payé le ${date(JOUR_DE_MISE_EN_SERVICE)}.`,
        ];
      },
      vue: "immobilisation",
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const r = secondEquipement(c);
        return [
          {
            texte: `Il coûtera ${eur(r.dotation)} cette année et vaudra ${eur(r.vnc)} au bilan`,
            juste: true,
            retour: `Oui : ${eur(r.cout)} de coût d'acquisition, installation comprise, amortis sur ${qte(r.duree)} ans, et ${qte(r.jours)} jours d'utilisation cette année : ${eur(r.dotation)} de dotation. Au 31 décembre, il vaut ${eur(r.cout)} − ${eur(r.dotation)} = ${eur(r.vnc)}.`,
          },
          {
            texte: `Il coûtera ${eur(r.annuite)} cette année : l'annuité d'une année d'utilisation`,
            juste: false,
            retour: `Non : l'annuité vaut pour une année pleine. Mis en service le ${date(JOUR_DE_MISE_EN_SERVICE)}, l'équipement ne sert que ${qte(r.jours)} jours cette année : ${eur(r.dotation)}.`,
          },
          {
            texte: `Il coûtera ${eur(r.installationEnCharges)} cette année : l'installation en charges, le prix amorti`,
            juste: false,
            retour: `Non : la livraison et l'installation, ${eur(r.frais)}, servent à mettre l'équipement en état de marche. Elles entrent dans son coût et s'amortissent avec lui : ${eur(r.dotation)} cette année.`,
          },
          {
            texte: `Il coûtera ${eur(r.cout)} cette année : ce que nous aurons payé, hors taxes`,
            juste: false,
            retour: `Non : le prix payé entre à l'actif, il ne va pas en charges. Seule la dotation, ${eur(r.dotation)}, pèse sur le résultat de l'année.`,
          },
        ];
      },
    },
  ],
};

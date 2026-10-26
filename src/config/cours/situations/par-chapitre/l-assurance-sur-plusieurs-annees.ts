import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { dateDuCours as date, moisEtJour } from "../../dates";
import { MOIS_PAR_AN, assurance } from "../../regularisations";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « RÉGULARISATIONS DE FIN D'EXERCICE » : L'ASSURANCE SUR
 * PLUSIEURS ANNÉES (comptabilité générale, palier 4).
 *
 * Le courtier propose de payer d'un coup un contrat d'assurance de deux ans, au tarif
 * d'aujourd'hui. La gérante demande ce que la prime pèsera sur le résultat de l'année, et
 * sur les suivantes. L'élève refait seul le chemin du chapitre : la prime, la part qui
 * appartient à l'année, la charge constatée d'avance et ses écritures, puis la part de
 * chaque année suivante, et la phrase qu'il rend.
 *
 * Le cas est neuf par sa question : la prime du chapitre couvre douze mois à partir du
 * 1er octobre ; celle-ci en couvre davantage, à partir d'une autre date, et la charge
 * constatée d'avance s'étend sur deux exercices suivants. La formule et sa prime par
 * trimestre sont celles de l'arène (`assurance`).
 */

/**
 * La durée du contrat : 24 mois. Le courtier propose de bloquer le tarif sur deux ans,
 * payés d'avance, la formule courante d'un contrat pluriannuel.
 */
export const DUREE_DU_CONTRAT_EN_MOIS = 24;

/**
 * Le jour où la prime est payée et le contrat commence : le 1er septembre (le jour 244), à
 * la rentrée, quand le contrat en cours arrive à son terme.
 */
export const JOUR_DU_PAIEMENT = 244;

/** Une prime de l'arène couvre un trimestre : trois mois. */
const MOIS_PAR_TRIMESTRE = 3;

const qte = (n: number) => n.toLocaleString("fr-FR");

/** Les chiffres de la réponse, calculés une fois de la formule de l'arène. */
export function assuranceSurPlusieursAnnees(c: Cas) {
  const a = assurance(c);
  const prime = auCentime((a.parTrimestre * DUREE_DU_CONTRAT_EN_MOIS) / MOIS_PAR_TRIMESTRE);
  const { mois } = moisEtJour(JOUR_DU_PAIEMENT);
  // Les mois couverts dans l'exercice : du mois du paiement à décembre.
  const moisDansLExercice = MOIS_PAR_AN - mois;
  const chargeDeLAnnee = auCentime((prime * moisDansLExercice) / DUREE_DU_CONTRAT_EN_MOIS);
  const davance = auCentime(prime - chargeDeLAnnee);
  const anneeSuivante = auCentime((prime * MOIS_PAR_AN) / DUREE_DU_CONTRAT_EN_MOIS);
  return {
    formule: a.formule,
    parTrimestre: a.parTrimestre,
    prime,
    moisDansLExercice,
    chargeDeLAnnee,
    davance,
    anneeSuivante,
    moisDeLaDerniere: DUREE_DU_CONTRAT_EN_MOIS - moisDansLExercice - MOIS_PAR_AN,
    derniere: auCentime(davance - anneeSuivante),
    // L'erreur classique : partager la prime par année de contrat, sans compter les mois.
    uneAnneeDePrime: anneeSuivante,
  };
}

export const L_ASSURANCE_SUR_PLUSIEURS_ANNEES: Situation = {
  code: "l-assurance-sur-plusieurs-annees",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["regularisations-de-fin-d-exercice"],
  commanditaire: "La gérante",
  titre: "L'assurance payée pour plusieurs années",
  accroche:
    "Le courtier propose de payer d'un coup un contrat d'assurance de plusieurs années. La gérante veut savoir ce que la prime pèsera sur le résultat de l'année, et sur les suivantes.",
  objectifs: [
    "Calculer la part d'une charge payée d'avance qui appartient à l'exercice",
    "Enregistrer le paiement et la charge constatée d'avance",
    "Répartir une charge sur les exercices qu'elle couvre",
    "Rédiger une réponse chiffrée à la gérante",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la gérante",
      texte: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return [
          `« Le courtier nous propose de payer d'un coup ${qte(DUREE_DU_CONTRAT_EN_MOIS)} mois d'assurance, formule « ${r.formule} », au tarif d'aujourd'hui. Le contrat commencerait le ${date(JOUR_DU_PAIEMENT)}, jour du prélèvement. Si je signe, combien cela pèsera-t-il sur notre résultat de cette année, et sur les années suivantes ? »`,
          "Pas de cours cette fois : vous avez la proposition du courtier, et la méthode est celle du chapitre. À vous de l'enchaîner. L'exercice se clôt le 31 décembre ; les assurances ne portent pas de TVA.",
        ];
      },
      tableau: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return {
          titre: `La proposition du courtier · ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: `Formule « ${r.formule} », prime d'un trimestre`, valeurs: [eur(r.parTrimestre)] },
            { libelle: "Durée du contrat, prime payée d'avance", valeurs: [`${qte(DUREE_DU_CONTRAT_EN_MOIS)} mois`] },
            { libelle: "Début du contrat et prélèvement de la prime", valeurs: [date(JOUR_DU_PAIEMENT)] },
            { libelle: "Clôture de l'exercice", valeurs: ["31 décembre"] },
          ],
        };
      },
      repere: () =>
        "À rendre : la prime et la part de l'année, le paiement et la charge constatée d'avance au journal, la part de chaque année suivante, et votre réponse.",
    },
    {
      id: "part-de-l-annee",
      type: "montants",
      titre: "La prime et la part de l'année",
      notions: ["income_statement"],
      question: () =>
        "Calculez la prime du contrat entier, le nombre de mois du contrat qui tombent dans l'exercice, la charge de l'année, puis la charge constatée d'avance au 31 décembre.",
      champs: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return [
          {
            libelle: "Prime du contrat",
            attendu: r.prime,
            calcul: `${eur(r.parTrimestre)} × ${qte(DUREE_DU_CONTRAT_EN_MOIS)} ÷ ${qte(MOIS_PAR_TRIMESTRE)} = ${eur(r.prime)}`,
          },
          {
            libelle: "Mois du contrat dans l'exercice",
            attendu: r.moisDansLExercice,
            calcul: `du ${date(JOUR_DU_PAIEMENT)} au 31 décembre : ${qte(r.moisDansLExercice)} mois`,
            tolerance: 0,
          },
          {
            libelle: "Charge de l'année",
            attendu: r.chargeDeLAnnee,
            calcul: `${eur(r.prime)} × ${qte(r.moisDansLExercice)} ÷ ${qte(DUREE_DU_CONTRAT_EN_MOIS)} = ${eur(r.chargeDeLAnnee)}`,
          },
          { libelle: "Charge constatée d'avance", attendu: r.davance, calcul: `${eur(r.prime)} − ${eur(r.chargeDeLAnnee)} = ${eur(r.davance)}` },
        ];
      },
      explication: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return [
          `Au 31 décembre, ${c.entreprise} n'a consommé que ${qte(r.moisDansLExercice)} mois de couverture sur ${qte(DUREE_DU_CONTRAT_EN_MOIS)}. Les ${eur(r.davance)} restants sont payés, pas encore consommés : ils appartiennent aux années suivantes.`,
        ];
      },
    },
    {
      id: "paiement",
      type: "ecriture",
      titre: "Le paiement de la prime",
      notions: ["income_statement"],
      evenement: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return `Le ${date(JOUR_DU_PAIEMENT)}, la banque prélève la prime du contrat : ${eur(r.prime)}. Passez le paiement.`;
      },
      ecriture: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return {
          date: date(JOUR_DU_PAIEMENT),
          libelle: `Prime d'assurance, formule « ${r.formule} », ${qte(DUREE_DU_CONTRAT_EN_MOIS)} mois`,
          lignes: [
            { role: "la prime d'assurance", compte: "616", sens: "debit", montant: r.prime, indice: "la prime du contrat entier" },
            { role: "le paiement", compte: "512", sens: "credit", montant: r.prime, indice: "la prime du contrat entier" },
          ],
        };
      },
      indices: () => [
        "Une charge au débit : les primes d'assurances. La banque au crédit.",
        "Pas de TVA sur une assurance : deux lignes suffisent, au compte 616 et au compte 512.",
      ],
      explication: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return [`Toute la prime est en charges, ${eur(r.prime)}, comme sur la pièce. Le 31 décembre corrigera ce qui n'appartient pas à l'année.`];
      },
      vue: "resultat",
    },
    {
      id: "charge-d-avance",
      type: "ecriture",
      titre: "La charge constatée d'avance",
      notions: ["income_statement"],
      evenement: () => "Au 31 décembre, retirez de l'année la part de la prime qui couvre les années suivantes.",
      ecriture: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return {
          date: "31 décembre",
          libelle: "Charge constatée d'avance : assurance",
          lignes: [
            { role: "la charge constatée d'avance", compte: "486", sens: "debit", montant: r.davance, indice: "la part de la prime des années suivantes" },
            { role: "la prime d'assurance, diminuée", compte: "616", sens: "credit", montant: r.davance, indice: "la part de la prime des années suivantes" },
          ],
        };
      },
      indices: () => [
        "La charge diminue : le compte 616 passe au crédit.",
        "En face, un actif : ce qui est payé et pas encore consommé, les charges constatées d'avance (486). Le montant : toute la part des années suivantes, pas seulement celle de l'an prochain.",
      ],
      explication: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return [
          `L'année ne garde que ${eur(r.chargeDeLAnnee)} d'assurance. Les ${eur(r.davance)} restent à l'actif ; le 1er janvier, l'écriture s'extournera, et chaque clôture suivante retirera à son tour ce qui ne lui appartient pas.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "annees-suivantes",
      type: "montants",
      titre: "Les années suivantes",
      notions: ["income_statement"],
      question: () =>
        "Le contrat court encore après le 31 décembre. Quelle charge d'assurance l'année suivante portera-t-elle ? Et la dernière année du contrat, combien de mois, et quelle charge ?",
      champs: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return [
          {
            libelle: "Charge de l'année suivante",
            attendu: r.anneeSuivante,
            calcul: `${eur(r.prime)} × ${qte(MOIS_PAR_AN)} ÷ ${qte(DUREE_DU_CONTRAT_EN_MOIS)} = ${eur(r.anneeSuivante)}`,
          },
          {
            libelle: "Mois du contrat dans la dernière année",
            attendu: r.moisDeLaDerniere,
            calcul: `${qte(DUREE_DU_CONTRAT_EN_MOIS)} − ${qte(r.moisDansLExercice)} − ${qte(MOIS_PAR_AN)} = ${qte(r.moisDeLaDerniere)} mois`,
            tolerance: 0,
          },
          { libelle: "Charge de la dernière année", attendu: r.derniere, calcul: `${eur(r.davance)} − ${eur(r.anneeSuivante)} = ${eur(r.derniere)}` },
        ];
      },
      explication: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return [
          `Une prime payée en une fois, une charge pour chaque exercice couvert : ${eur(r.chargeDeLAnnee)} cette année, ${eur(r.anneeSuivante)} l'année suivante, puis ${eur(r.derniere)}. Chaque année porte les mois de couverture qu'elle consomme, quelle que soit la date du prélèvement.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "Quelle phrase envoyez-vous à la gérante ?",
      options: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return [
          {
            texte: `Cette année ne portera que ${eur(r.chargeDeLAnnee)}, le reste ira à l'actif`,
            juste: true,
            retour: `Oui : ${qte(r.moisDansLExercice)} mois sur ${qte(DUREE_DU_CONTRAT_EN_MOIS)}, ${eur(r.chargeDeLAnnee)}. Les ${eur(r.davance)} restants, payés d'avance, sont une charge constatée d'avance : l'année suivante en portera ${eur(r.anneeSuivante)}, la dernière ${eur(r.derniere)}.`,
          },
          {
            texte: `Cette année portera toute la prime, ${eur(r.prime)} : elle est payée le ${date(JOUR_DU_PAIEMENT)}`,
            juste: false,
            retour: `Non : la date du paiement ne décide pas de l'année de la charge. ${c.entreprise} ne consomme cette année que ${qte(r.moisDansLExercice)} mois de couverture : ${eur(r.chargeDeLAnnee)}.`,
          },
          {
            texte: `Cette année portera ${eur(r.uneAnneeDePrime)} : la prime d'une année de contrat`,
            juste: false,
            retour: `Non : la charge se répartit au prorata des mois, pas par année de contrat. Le contrat commence le ${date(JOUR_DU_PAIEMENT)} : ${qte(r.moisDansLExercice)} mois cette année, ${eur(r.chargeDeLAnnee)}.`,
          },
          {
            texte: "Cette année ne portera rien : la prime entière est une charge constatée d'avance",
            juste: false,
            retour: `Non : le contrat couvre déjà ${qte(r.moisDansLExercice)} mois de l'exercice. Ils lui appartiennent : ${eur(r.chargeDeLAnnee)}.`,
          },
        ];
      },
    },
  ],
};

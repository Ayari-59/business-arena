import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DES_REGULARISATIONS, ficheDe, primeSouscriteLe, regularisationsDeNova } from "../../chapitres/regularisations";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « RÉGULARISATIONS DE FIN D'EXERCICE » : L'ASSURANCE SUR PLUSIEURS ANNÉES
 * (comptabilité générale, palier 4).
 *
 * Le contrat d'assurance de NOVA, souscrit le 1er octobre N pour 12 mois (la fiche du monde du cours,
 * monde/exercice-de-nova.ts), arrive à son terme. Le courtier propose de le renouveler le 1er octobre
 * N+1 pour deux ans, payés d'avance, avec une remise. La gérante demande ce que la prime pèsera sur
 * chaque exercice, et si l'offre vaut la peine. L'élève refait seul le chemin du chapitre (la prime,
 * la part de l'exercice, le paiement et la charge constatée d'avance, la part de chaque exercice
 * suivant) et le croise avec l'extourne : la charge de N+1 mêle l'ancienne prime, revenue le
 * 1er janvier, et la nouvelle. Puis un jugement : payer un an d'avance coûte les intérêts que le
 * compte à terme ne versera plus ; un curseur sur la remise montre à partir d'où elle les paie, un
 * calcul à rebours la chiffre.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours : ses chiffres viennent de la fiche
 * et de `regularisationsDeNova`. La remise du courtier est une hypothèse de l'histoire.
 */

/** La durée du contrat proposé : 24 mois, payés d'avance le jour du renouvellement. */
export const DUREE_DU_CONTRAT_EN_MOIS = 24;

/**
 * LA REMISE DU COURTIER, hypothèse du cours : 5 % sur la prime des deux ans, au tarif d'aujourd'hui,
 * l'ordre de grandeur d'un engagement pluriannuel payé comptant.
 */
export const REMISE_SUR_DEUX_ANS = 0.05;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const auCentime = (x: number) => Math.round((x + Number.EPSILON * Math.sign(x)) * 100) / 100 + 0;

/** Les chiffres de la réponse, calculés une fois de la fiche. */
export function assuranceSurPlusieursAnnees(c: Pick<Cas, "code">) {
  const x = regularisationsDeNova(c);
  const f = ficheDe(c);
  const a = f.assurance;
  const annees = DUREE_DU_CONTRAT_EN_MOIS / a.moisCouverts;
  const sansRemise = auCentime(a.prime * annees);
  const remise = auCentime(sansRemise * REMISE_SUR_DEUX_ANS);
  const prime = auCentime(sansRemise - remise);
  // Le renouvellement tombe le même jour que la souscription de N : le 1er octobre.
  const moisDansNPlus1 = primeSouscriteLe(f, a.date.mois).moisDansLExercice;
  const partDeNPlus1 = auCentime((prime * moisDansNPlus1) / DUREE_DU_CONTRAT_EN_MOIS);
  const extourne = x.prime.chargeConstateeDAvance;
  const chargeDeNPlus1 = auCentime(extourne + partDeNPlus1);
  const davance = auCentime(prime - partDeNPlus1);
  const nPlus2 = auCentime((prime * a.moisCouverts) / DUREE_DU_CONTRAT_EN_MOIS);
  const moisDeNPlus3 = DUREE_DU_CONTRAT_EN_MOIS - moisDansNPlus1 - a.moisCouverts;
  const nPlus3 = auCentime(davance - nPlus2);
  // Payer les deux ans d'un coup avance d'un an ce que la seconde année aurait coûté, remise déduite.
  const taux = f.placement.tauxAnnuel;
  const avancee = auCentime(prime - a.prime);
  const interetsPerdus = auCentime(avancee * taux);
  const gainNet = auCentime(remise - interetsPerdus);
  // La remise la plus petite qui paie l'avance : R ≥ (prime d'un an − R) × taux.
  const remiseMinimale = auCentime((a.prime * taux) / (1 + taux));
  return {
    x,
    entreprise: f.entreprise,
    primeAnnuelle: a.prime,
    sansRemise,
    remise,
    prime,
    moisDansNPlus1,
    partDeNPlus1,
    extourne,
    chargeDeNPlus1,
    davance,
    nPlus2,
    moisDeNPlus3,
    nPlus3,
    taux,
    avancee,
    interetsPerdus,
    gainNet,
    remiseMinimale,
    /** Le curseur : la plus petite remise entière, en euros, qui paie l'avance. */
    remiseDuCurseur: Math.ceil(remiseMinimale - 1e-9),
    /** L'erreur de base : les intérêts de toute la prime, comme si elle était entièrement avancée. */
    interetsDeToutLaPrime: auCentime(prime * taux),
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
    `Le courtier propose de renouveler l'assurance pour ${DUREE_DU_CONTRAT_EN_MOIS} mois, payés d'avance avec une remise. La gérante veut savoir ce que la prime pèsera sur chaque exercice, et si la remise paie vraiment l'argent avancé.`,
  objectifs: [
    "Calculer la part d'une prime pluriannuelle qui appartient à l'exercice, extourne comprise",
    "Enregistrer le paiement et la charge constatée d'avance",
    "Répartir une charge sur les exercices qu'elle couvre",
    "Juger une remise face aux intérêts que l'argent avancé ne rapporte plus",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_REGULARISATIONS,
    pourquoi: "ce cas reprend le chapitre « Régularisations de fin d'exercice », qui se joue sur l'exercice de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la gérante",
      texte: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return [
          `« Notre assurance, ${eur(r.primeAnnuelle)} payés le 1er octobre pour ${qte(r.x.f.assurance.moisCouverts)} mois, arrive à son terme. Le courtier propose de la renouveler le 1er octobre N+1 pour ${qte(DUREE_DU_CONTRAT_EN_MOIS)} mois, au tarif d'aujourd'hui, payés d'un coup, avec ${qte(REMISE_SUR_DEUX_ANS * 100)} % de remise. Si je signe, que pèsera l'assurance sur N+1 et sur les exercices suivants ? Et la remise vaut-elle l'argent que je sors un an plus tôt, alors que notre compte à terme rapporte ${qte(r.taux * 100)} % ? »`,
          "Pas de cours cette fois : vous avez la proposition du courtier, et la méthode est celle du chapitre. À vous de l'enchaîner. Chaque exercice se clôt le 31 décembre, et la charge constatée d'avance de N s'extourne le 1er janvier N+1 ; les assurances ne portent pas de TVA.",
        ];
      },
      tableau: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return {
          titre: `La proposition du courtier · ${r.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Prime d'un an, au tarif d'aujourd'hui", valeurs: [eur(r.primeAnnuelle)] },
            { libelle: "Charge constatée d'avance au 31 décembre N, extournée le 1er janvier N+1", valeurs: [eur(r.extourne)] },
            { libelle: "Durée du contrat proposé, payé d'avance", valeurs: [`${qte(DUREE_DU_CONTRAT_EN_MOIS)} mois`] },
            { libelle: "Début du contrat et prélèvement de la prime", valeurs: ["1er octobre N+1"] },
            { libelle: "Remise sur la prime du contrat entier", valeurs: [`${qte(REMISE_SUR_DEUX_ANS * 100)} %`] },
            { libelle: "Taux du compte à terme, sur un an", valeurs: [`${qte(r.taux * 100)} %`] },
          ],
        };
      },
      repere: () =>
        "À rendre : la prime et la charge de N+1, le paiement et la charge constatée d'avance au journal, la part de chaque exercice suivant, ce que l'offre rapporte une fois les intérêts perdus comptés, et votre réponse.",
    },
    {
      id: "part-de-n-plus-1",
      type: "montants",
      titre: "La prime et la charge de N+1",
      notions: ["income_statement"],
      question: () =>
        "Calculez la prime du contrat, remise déduite, le nombre de mois du contrat qui tombent dans N+1, la charge d'assurance que portera N+1, puis la charge constatée d'avance au 31 décembre N+1.",
      champs: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return [
          {
            libelle: "Prime du contrat",
            attendu: r.prime,
            calcul: `${eur(r.primeAnnuelle)} × ${qte(DUREE_DU_CONTRAT_EN_MOIS / r.x.f.assurance.moisCouverts)} = ${eur(r.sansRemise)}, moins ${qte(REMISE_SUR_DEUX_ANS * 100)} % de remise (${eur(r.remise)}) = ${eur(r.prime)}`,
          },
          { libelle: "Mois du contrat dans N+1", attendu: r.moisDansNPlus1, calcul: `du 1er octobre au 31 décembre N+1 : ${qte(r.moisDansNPlus1)} mois`, tolerance: 0 },
          {
            libelle: "Charge d'assurance de N+1",
            attendu: r.chargeDeNPlus1,
            calcul: `${eur(r.extourne)} de l'ancienne prime, revenus par l'extourne, + ${eur(r.prime)} × ${qte(r.moisDansNPlus1)} ÷ ${qte(DUREE_DU_CONTRAT_EN_MOIS)} = ${eur(r.extourne)} + ${eur(r.partDeNPlus1)} = ${eur(r.chargeDeNPlus1)}`,
          },
          { libelle: "Charge constatée d'avance au 31 décembre N+1", attendu: r.davance, calcul: `${eur(r.prime)} − ${eur(r.partDeNPlus1)} = ${eur(r.davance)}` },
        ];
      },
      explication: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return [
          `N+1 porte deux primes : les ${qte(r.x.prime.moisApres)} derniers mois de l'ancien contrat, ${eur(r.extourne)}, et les ${qte(r.moisDansNPlus1)} premiers du nouveau, ${eur(r.partDeNPlus1)}. Les ${eur(r.davance)} restants sont payés et pas encore consommés : ils appartiennent aux exercices suivants.`,
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
        return `Le 1er octobre N+1, la banque prélève la prime du nouveau contrat : ${eur(r.prime)}. Passez le paiement.`;
      },
      ecriture: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return {
          date: "1er octobre N+1",
          libelle: `Prime d'assurance, ${qte(DUREE_DU_CONTRAT_EN_MOIS)} mois`,
          lignes: [
            { role: "la prime d'assurance", compte: "616", sens: "debit", montant: r.prime, indice: "la prime du contrat entier, remise déduite" },
            { role: "le paiement", compte: "512", sens: "credit", montant: r.prime, indice: "la prime du contrat entier, remise déduite" },
          ],
        };
      },
      indices: () => [
        "Une charge au débit : les primes d'assurances. La banque au crédit.",
        "Pas de TVA sur une assurance : deux lignes suffisent, au compte 616 et au compte 512.",
      ],
      explication: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return [`Toute la prime est en charges, ${eur(r.prime)}, comme sur la pièce. Le 31 décembre N+1 corrigera ce qui n'appartient pas à l'exercice.`];
      },
    },
    {
      id: "charge-d-avance",
      type: "ecriture",
      titre: "La charge constatée d'avance",
      notions: ["income_statement", "balance_sheet"],
      evenement: () => "Au 31 décembre N+1, retirez de l'exercice la part de la nouvelle prime qui couvre les exercices suivants.",
      ecriture: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return {
          date: "31 décembre N+1",
          libelle: "Charge constatée d'avance : assurance",
          lignes: [
            { role: "la charge constatée d'avance", compte: "486", sens: "debit", montant: r.davance, indice: "la part de la prime des exercices suivants" },
            { role: "la prime d'assurance, diminuée", compte: "616", sens: "credit", montant: r.davance, indice: "la part de la prime des exercices suivants" },
          ],
        };
      },
      indices: () => [
        "La charge diminue : le compte 616 passe au crédit.",
        "En face, un actif : ce qui est payé et pas encore consommé, les charges constatées d'avance (486). Le montant : toute la part des exercices suivants, pas seulement celle de N+2.",
      ],
      explication: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return [
          `N+1 ne garde que ${eur(r.partDeNPlus1)} de la nouvelle prime. Les ${eur(r.davance)} restent à l'actif ; le 1er janvier N+2, l'écriture s'extournera, et la clôture suivante retirera à son tour ce qui ne lui appartient pas.`,
        ];
      },
    },
    {
      id: "annees-suivantes",
      type: "montants",
      titre: "Les exercices suivants",
      notions: ["income_statement"],
      question: () =>
        "Le contrat court encore après le 31 décembre N+1. Quelle charge d'assurance N+2 portera-t-il ? Et le dernier exercice du contrat, N+3, combien de mois, et quelle charge ?",
      champs: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        const n = r.x.f.assurance.moisCouverts;
        return [
          { libelle: "Charge d'assurance de N+2", attendu: r.nPlus2, calcul: `${eur(r.prime)} × ${qte(n)} ÷ ${qte(DUREE_DU_CONTRAT_EN_MOIS)} = ${eur(r.nPlus2)}` },
          {
            libelle: "Mois du contrat dans N+3",
            attendu: r.moisDeNPlus3,
            calcul: `${qte(DUREE_DU_CONTRAT_EN_MOIS)} − ${qte(r.moisDansNPlus1)} − ${qte(n)} = ${qte(r.moisDeNPlus3)} mois`,
            tolerance: 0,
          },
          { libelle: "Charge d'assurance de N+3", attendu: r.nPlus3, calcul: `${eur(r.davance)} − ${eur(r.nPlus2)} = ${eur(r.nPlus3)}` },
        ];
      },
      explication: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return [
          `Une prime payée en une fois, une charge pour chaque exercice couvert : ${eur(r.partDeNPlus1)} de la nouvelle prime en N+1, ${eur(r.nPlus2)} en N+2, puis ${eur(r.nPlus3)} en N+3. Chaque exercice porte les mois de couverture qu'il consomme, quelle que soit la date du prélèvement.`,
        ];
      },
    },
    {
      id: "la-remise-qui-paie",
      type: "curseur",
      titre: "La remise qui paie l'avance",
      notions: ["income_statement", "net_treasury"],
      question: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return `Sans l'offre, ${r.entreprise} paierait ${eur(r.primeAnnuelle)} le 1er octobre N+1, puis ${eur(r.primeAnnuelle)} un an plus tard. Avec elle, tout part le 1er octobre N+1 : la seconde année, remise déduite, est payée un an plus tôt, et ne rapporte plus les ${qte(r.taux * 100)} % du compte à terme. Faites varier la remise : à partir de combien d'euros paie-t-elle les intérêts perdus ? Placez le curseur sur la plus petite remise, puis validez.`;
      },
      grandeur: () => ({ libelle: "Remise sur le contrat entier", unite: "€" }),
      cible: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return { attendu: r.remiseDuCurseur, min: 0, max: r.remise };
      },
      zones: ["La remise paie l'avance", "Les intérêts perdus l'emportent"],
      rates: () => ({
        dessous: "À cette remise, les intérêts que le compte à terme ne versera plus coûtent davantage : il faut une remise plus forte.",
        dessus: "Une remise plus petite paie déjà les intérêts perdus : cherchez la plus petite.",
      }),
      montrer: "Montrer la remise",
      lecture: (c, remise) => {
        const r = assuranceSurPlusieursAnnees(c);
        const avancee = auCentime(r.primeAnnuelle - remise);
        const perdus = auCentime(avancee * r.taux);
        return [
          { libelle: "Somme payée un an plus tôt", montant: avancee },
          { libelle: "Intérêts que le compte à terme ne versera pas", montant: perdus },
          { libelle: "Gain net de l'offre", montant: auCentime(remise - perdus), fort: true },
        ];
      },
      droites: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return {
          produit: (remise) => remise,
          cout: (remise) => (r.primeAnnuelle - remise) * r.taux,
          libelles: ["La remise", "Les intérêts perdus sur la somme avancée"],
        };
      },
      explication: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return [
          `Dès ${eur(r.remiseDuCurseur)}, la remise paie les intérêts perdus. Le courtier en offre ${eur(r.remise)} : la somme avancée n'est que ${eur(r.avancee)}, et ses intérêts d'un an ${eur(r.interetsPerdus)}. Ce n'est pas toute la prime qui est avancée : la première année se payait le 1er octobre N+1 de toute façon.`,
        ];
      },
    },
    {
      id: "le-gain-net",
      type: "montants",
      titre: "Ce que l'offre rapporte vraiment",
      notions: ["income_statement", "net_treasury"],
      question: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return `Chiffrez ce que l'offre rapporte : la somme payée un an plus tôt, les intérêts que le compte à terme à ${qte(r.taux * 100)} % ne versera pas sur elle, le gain net de l'offre, puis, à rebours, la plus petite remise qui paierait l'avance.`;
      },
      champs: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return [
          { libelle: "Somme payée un an plus tôt", attendu: r.avancee, calcul: `${eur(r.prime)} − ${eur(r.primeAnnuelle)} de la première année = ${eur(r.avancee)}` },
          { libelle: "Intérêts que le compte à terme perd", attendu: r.interetsPerdus, calcul: `${eur(r.avancee)} × ${qte(r.taux * 100)} % = ${eur(r.interetsPerdus)}` },
          { libelle: "Gain net de l'offre", attendu: r.gainNet, calcul: `${eur(r.remise)} de remise − ${eur(r.interetsPerdus)} = ${eur(r.gainNet)}` },
          {
            libelle: "Remise la plus petite qui paie l'avance",
            attendu: r.remiseMinimale,
            calcul: `remise = (${eur(r.primeAnnuelle)} − remise) × ${qte(r.taux * 100)} %, soit remise = ${eur(auCentime(r.primeAnnuelle * r.taux))} ÷ ${qte(1 + r.taux)} = ${eur(r.remiseMinimale)}`,
            tolerance: 0.05,
          },
        ];
      },
      explication: (c) => {
        const r = assuranceSurPlusieursAnnees(c);
        return [
          `La remise, ${eur(r.remise)}, dépasse de loin les intérêts perdus, ${eur(r.interetsPerdus)} : payer d'avance rapporte ${eur(r.gainNet)}. Une remise sur un an d'avance se compare au rendement de l'argent qu'on sort, sur la seule somme avancée.`,
          `Le résultat, lui, ne voit pas cette décision dans la charge d'assurance : la remise se répartit sur les ${qte(DUREE_DU_CONTRAT_EN_MOIS)} mois avec la prime, et les intérêts perdus manquent aux produits financiers.`,
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
            texte: `Signer : ${eur(r.gainNet)} de gain net, et N+1 ne portera que ${eur(r.chargeDeNPlus1)} d'assurance`,
            juste: true,
            retour: `Oui : la remise, ${eur(r.remise)}, paie largement les ${eur(r.interetsPerdus)} d'intérêts perdus sur la somme avancée. N+1 porte ${eur(r.extourne)} de l'ancien contrat et ${eur(r.partDeNPlus1)} du nouveau ; ${eur(r.davance)} vont à l'actif, puis ${eur(r.nPlus2)} en N+2 et ${eur(r.nPlus3)} en N+3.`,
          },
          {
            texte: `Ne pas signer : la remise ne paie pas les ${eur(r.interetsDeToutLaPrime)} d'intérêts perdus sur toute la prime`,
            juste: false,
            retour: `Non : la première année se payait le 1er octobre N+1 de toute façon. Seule la seconde, remise déduite, est avancée : ${eur(r.avancee)}, qui perdent ${eur(r.interetsPerdus)} d'intérêts, moins que la remise.`,
          },
          {
            texte: `Signer : N+1 ne portera que ${eur(r.partDeNPlus1)} d'assurance, la part de la nouvelle prime`,
            juste: false,
            retour: `Non : c'est oublier l'extourne. Le 1er janvier N+1, la charge constatée d'avance de N, ${eur(r.extourne)}, revient en charge : N+1 porte ${eur(r.chargeDeNPlus1)}.`,
          },
          {
            texte: `Ne pas signer : N+1 porterait toute la prime, ${eur(r.prime)}, payée le 1er octobre`,
            juste: false,
            retour: `Non : la date du paiement ne décide pas de l'exercice de la charge. N+1 ne consomme que ${qte(r.moisDansNPlus1)} mois du nouveau contrat ; le reste est une charge constatée d'avance.`,
          },
        ];
      },
    },
  ],
};

import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DES_DOCUMENTS, GED, RECHERCHE, gainDUneRecherche, numeriserLesArchives } from "../../monde/documents-de-maille";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DOCUMENTS STRUCTURÉS » : NUMÉRISER LES ARCHIVES ? (Bac STMG, systèmes
 * d'information de gestion de terminale, palier 1).
 *
 * Le chapitre trouvait le nombre de recherches qui paie la GED ; le cas chiffre la numérisation des
 * archives de 4 ans et ce que la GED laisse chaque année, pour décider de ce qu'il faut numériser.
 * Hypothèses : monde/documents-de-maille.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const NUMERISER_LES_ARCHIVES: Situation = {
  code: "numeriser-les-archives",
  parcours: "stmg-sig",
  palier: 1,
  blocs: [],
  reprend: ["documents-structures-et-metadonnees"],
  commanditaire: "La gérante",
  titre: "Numériser les archives ?",
  accroche: "La boutique passe à la gestion électronique des documents. Faut-il numériser d'un coup toutes les archives des façonniers, ou seulement ce qui arrive désormais ?",
  objectifs: ["Chiffrer une numérisation", "Chiffrer ce que la GED laisse chaque année", "Répondre à la gérante, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DES_DOCUMENTS, pourquoi: "le cas reprend les documents des façonniers de MAILLE & CO." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la gérante",
      texte: () => {
        const k = numeriserLesArchives();
        return [
          `« Nous avons ${qte(k.documents)} factures et bons de livraison en classeurs. Les scanner et les indexer prend ${qte(k.minutesParDocument)} minute par document, à ${eur(RECHERCHE.coutHoraire)} de l'heure. Nous cherchons environ ${qte(k.recherchesParMois)} documents par mois, et la GED coûte ${eur(GED.parMois)} par mois. Je numérise tout d'un coup ? » La gérante`,
          "Pas de cours cette fois : les notions sont celles du chapitre.",
        ];
      },
      repere: () => "À rendre : le coût de la numérisation, ce que la GED laisse dans l'année, et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Ce que coûte la numérisation, ce que laisse la GED",
      question: () => "Calculez ce que coûte la numérisation des archives, le temps que les recherches font gagner dans l'année, puis ce que la GED laisse, son abonnement de l'année payé.",
      champs: () => {
        const k = numeriserLesArchives();
        return [
          { libelle: "Coût de la numérisation", attendu: k.numerisation, calcul: `${qte(k.documents)} × ${qte(k.minutesParDocument)} min × ${eur(RECHERCHE.coutHoraire)} ÷ 60 = ${eur(k.numerisation)}` },
          { libelle: "Temps gagné dans l'année", attendu: k.gainDeLAnnee, calcul: `${qte(k.recherchesParMois)} × ${eur(gainDUneRecherche())} × 12 = ${eur(k.gainDeLAnnee)}` },
          { libelle: "Ce que la GED laisse dans l'année", attendu: k.netDeLAnnee, calcul: `${eur(k.gainDeLAnnee)} − ${eur(k.ged)} = ${eur(k.netDeLAnnee)}` },
        ];
      },
      explication: () => {
        const k = numeriserLesArchives();
        return [`La GED laisse ${eur(k.netDeLAnnee)} par an ; numériser toutes les archives en coûterait ${eur(k.numerisation)}, plusieurs années de gain.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "Que répondez-vous à la gérante ?",
      options: () => [
        { texte: "Numériser ce qui arrive, et les archives à la demande", juste: true, retour: "Oui : les documents nouveaux se scannent et s'indexent à leur arrivée, pour presque rien. Une archive ne se numérise que le jour où on la cherche : on ne paie que ce qui sert." },
        { texte: "Tout numériser d'un coup, pour que les classeurs disparaissent dès cette semaine", juste: false, retour: `Non : ${eur(numeriserLesArchives().numerisation)} pour des documents qu'on ne cherchera presque jamais.` },
        { texte: "Renoncer à la GED, puisque les archives coûtent trop cher", juste: false, retour: "Non : la GED se paie sur les recherches de chaque mois, sans les archives." },
      ],
    },
  ],
};

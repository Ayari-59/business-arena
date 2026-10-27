import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { accordeA, de, qte, referencesDuMagasin } from "../../chapitres/recevoir-une-livraison";
import { REMPLIR_LE_RAYON, articleDuTrimestre, articleEnRupture, calculsDuRayon } from "../../chapitres/remplir-le-rayon";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « REMPLIR LE RAYON AVANT LA RUPTURE » : TENIR JUSQU'AU RÉASSORT (CAP
 * Équipier polyvalent du commerce, palier 1).
 *
 * Le chapitre suivait un article que la boutique n'avait pas commandé. Ici, une livraison arrive
 * pendant le même trimestre, et le responsable croit qu'elle suffira jusqu'au prochain réassort.
 * L'élève ajoute la livraison au stock, refait le rythme et les jours avant la rupture, compare
 * au délai du fournisseur, lit ce que l'arène a compté de ventes perdues, et répond.
 *
 * L'article est, au trimestre du chapitre, celui que la boutique a commandé (`planned` > 0) et
 * qui a pourtant fini en rupture (`lost` > 0) ; parmi eux, celui dont la rupture a coûté le plus.
 * HYPOTHÈSES DU COURS, dites au texte : la livraison du trimestre arrive en une fois au début du
 * trimestre, et le réassort suivant prend le délai du chapitre (`DELAI_DE_REASSORT`).
 *
 * LA RÉPONSE SE CALCULE : la livraison tient jusqu'au réassort si les jours avant la rupture
 * atteignent le délai. Dans l'année du cours, elle ne tient pas.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** L'article livré qui manque quand même, et ses calculs avec la livraison comptée. */
export function reassortAttendu(c: Cas) {
  const { trimestre } = articleEnRupture(c.code);
  const candidats = referencesDuMagasin(c.code)
    .map((a) => articleDuTrimestre(c.code, trimestre, a.code))
    .filter((x) => x.commandee > 0 && x.perdues > 0);
  if (candidats.length === 0) throw new Error(`Aucun article livré et pourtant en rupture chez ${c.code}`);
  const x = candidats.reduce((a, b) => (b.perdues * b.prix > a.perdues * a.prix ? b : a));
  const stockApres = x.stock + x.commandee;
  return { x, stockApres, ...calculsDuRayon(x, stockApres) };
}

export const TENIR_JUSQU_AU_REASSORT: Situation = {
  code: "tenir-jusqu-au-reassort",
  parcours: "cap-epc",
  palier: 1,
  blocs: [],
  reprend: [REMPLIR_LE_RAYON.code],
  commanditaire: "Le responsable du magasin",
  titre: "Tenir jusqu'au réassort",
  accroche:
    "Une livraison arrive, et le responsable pense qu'elle suffira jusqu'au réassort suivant. Ajouter, diviser, comparer au délai du fournisseur, et lui répondre.",
  objectifs: [
    "Ajouter une livraison au stock qui reste",
    "Calculer les ventes par jour et les jours avant la rupture",
    "Comparer ces jours au délai du fournisseur",
    "Chiffrer les ventes perdues, et répondre à son responsable",
  ],
  libre: false,
  entreprises: REMPLIR_LE_RAYON.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du responsable",
      texte: (c) => {
        const s = reassortAttendu(c);
        return [
          `« Au trimestre ${s.x.trimestre}, on reçoit ${qte(s.x.commandee)} ${s.x.pluriel}, en plus de ce qui reste en réserve. Le réassort suivant met ${qte(s.delai)} jours à arriver. Est-ce que ça tient jusque-là, ou est-ce que je dois commander tout de suite ? »`,
          "Pas de cours cette fois. Vous avez les chiffres de l'arène. Le cours suppose que la livraison arrive au début du trimestre, et que les clients achètent au même rythme tous les jours.",
        ];
      },
      tableau: (c) => {
        const s = reassortAttendu(c);
        return {
          titre: `${c.entreprise} · les ${s.x.pluriel} au trimestre ${s.x.trimestre}`,
          colonnes: ["Nombre"],
          lignes: [
            { libelle: `${majuscule(s.x.pluriel)} en réserve au début du trimestre`, valeurs: [qte(s.x.stock)] },
            { libelle: `${majuscule(s.x.pluriel)} ${accordeA(s.x.feminin, "livré")} au trimestre`, valeurs: [qte(s.x.commandee)] },
            { libelle: `${majuscule(s.x.pluriel)} ${accordeA(s.x.feminin, "demandé")} par les clients`, valeurs: [qte(s.x.demande)] },
            { libelle: "Jours dans le trimestre", valeurs: [qte(s.x.jours)] },
          ],
        };
      },
      repere: () => "À rendre : le stock avec la livraison, le rythme, les jours avant la rupture, les ventes perdues, et votre réponse.",
    },
    {
      id: "stock-et-rythme",
      type: "montants",
      titre: "Le stock et le rythme",
      notions: ["stock"],
      question: (c) => {
        const s = reassortAttendu(c);
        return `Calculez le stock ${de(s.x.pluriel)} une fois la livraison rangée, puis les ventes d'une journée, arrondies à l'unité.`;
      },
      champs: (c) => {
        const s = reassortAttendu(c);
        return [
          { libelle: "Stock avec la livraison", attendu: s.stockApres, calcul: `${qte(s.x.stock)} + ${qte(s.x.commandee)} = ${qte(s.stockApres)}` },
          { libelle: "Ventes par jour", attendu: s.parJour, calcul: `${qte(s.x.demande)} ÷ ${qte(s.x.jours)} = ${qte(s.parJour)}, arrondi à l'unité` },
        ];
      },
      explication: (c) => {
        const s = reassortAttendu(c);
        return [`${qte(s.stockApres)} ${s.x.pluriel} pour ${qte(s.parJour)} ventes par jour.`];
      },
    },
    {
      id: "jours",
      type: "montants",
      titre: "Les jours qui restent",
      notions: ["stock"],
      question: (c) => {
        const s = reassortAttendu(c);
        return `Combien de jours entiers le stock tiendra-t-il ? Puis, avec un réassort qui met ${qte(s.delai)} jours, combien de jours le rayon restera-t-il vide ? Écrivez 0 s'il tient.`;
      },
      champs: (c) => {
        const s = reassortAttendu(c);
        return [
          { libelle: "Jours avant la rupture", attendu: s.joursAvant, calcul: `${qte(s.stockApres)} ÷ ${qte(s.parJour)} = ${qte(s.joursAvant)} jours entiers` },
          {
            libelle: "Jours avec un rayon vide",
            attendu: s.joursSans,
            calcul: s.aTemps ? `${qte(s.joursAvant)} jours de stock, plus que ${qte(s.delai)} jours de délai : 0` : `${qte(s.delai)} − ${qte(s.joursAvant)} = ${qte(s.joursSans)}`,
          },
        ];
      },
      explication: (c) => {
        const s = reassortAttendu(c);
        return [
          s.aTemps
            ? `Le stock tient ${qte(s.joursAvant)} jours : le réassort arrive avant la rupture.`
            : `Le stock tient ${qte(s.joursAvant)} jours, le réassort en met ${qte(s.delai)} : ${qte(s.joursSans)} jours de rayon vide, même en commandant aujourd'hui.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "Ce que l'arène a compté",
      notions: ["stock", "revenue"],
      question: (c) => {
        const s = reassortAttendu(c);
        return `Dans l'arène, la boutique a vendu ${qte(s.x.vendues)} ${s.x.pluriel} au trimestre ${s.x.trimestre}, au prix de ${eur(s.x.prix)}. Calculez les articles que les clients n'ont pas trouvés, puis les ventes perdues en euros.`;
      },
      champs: (c) => {
        const s = reassortAttendu(c);
        return [
          { libelle: "Articles non trouvés", attendu: s.x.perdues, calcul: `${qte(s.x.demande)} − ${qte(s.x.vendues)} = ${qte(s.x.perdues)}` },
          { libelle: "Ventes perdues", attendu: s.ventesPerdues, calcul: `${qte(s.x.perdues)} × ${eur(s.x.prix)} = ${eur(s.ventesPerdues)}` },
        ];
      },
      explication: (c) => {
        const s = reassortAttendu(c);
        return [`Malgré la livraison, ${qte(s.x.perdues)} ${s.x.pluriel} ${accordeA(s.x.feminin, "demandé")} n'étaient plus là : ${eur(s.ventesPerdues)} de ventes perdues.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable",
      question: () => "Que répondez-vous au responsable du magasin ?",
      options: (c) => {
        const s = reassortAttendu(c);
        return [
          {
            texte: "Non, ça ne tient pas : commander aujourd'hui",
            juste: !s.aTemps,
            retour: !s.aTemps
              ? `Oui : ${qte(s.joursAvant)} jours de stock pour ${qte(s.delai)} jours de réassort. Même commandé aujourd'hui, le rayon restera vide ${qte(s.joursSans)} jours. Dans l'arène, la rupture a coûté ${eur(s.ventesPerdues)}.`
              : `Non : ${qte(s.joursAvant)} jours de stock, plus que les ${qte(s.delai)} jours du réassort. La livraison suffit.`,
          },
          {
            texte: "Oui, la livraison suffit jusqu'au réassort",
            juste: s.aTemps,
            retour: s.aTemps
              ? `Oui : ${qte(s.joursAvant)} jours de stock, plus que les ${qte(s.delai)} jours du réassort.`
              : `Non : ${qte(s.stockApres)} ÷ ${qte(s.parJour)} = ${qte(s.joursAvant)} jours seulement, pour ${qte(s.delai)} jours de réassort. Le rayon sera vide ${qte(s.joursSans)} jours.`,
          },
          {
            texte: "Impossible à dire : on le saura quand le rayon sera vide",
            juste: false,
            retour: `Non : le calcul se fait aujourd'hui, ${qte(s.stockApres)} ÷ ${qte(s.parJour)} = ${qte(s.joursAvant)} jours. Attendre le rayon vide, c'est ajouter ${qte(s.delai)} jours de réassort sans rien à vendre.`,
          },
        ];
      },
    },
  ],
};

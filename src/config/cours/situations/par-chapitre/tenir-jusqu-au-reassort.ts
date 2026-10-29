import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { accordeA, de, majuscule, qte } from "../../chapitres/recevoir-une-livraison";
import { REMPLIR_LE_RAYON, rayon } from "../../chapitres/remplir-le-rayon";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « REMPLIR LE RAYON AVANT LA RUPTURE » : TENIR JUSQU'AU RÉASSORT (CAP
 * Équipier polyvalent du commerce, palier 1).
 *
 * Le chapitre a vu le rayon des cardigans se vider avant la livraison du 12 janvier. Ici, la
 * livraison arrive, et le responsable croit qu'elle suffira jusqu'au réassort qu'il commande
 * aujourd'hui. L'élève refait le rythme et les jours avant la rupture, compare au délai du
 * façonnier, chiffre les ventes en danger, et répond.
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : le cardigan de MAILLE & CO en janvier (monde/maille-et-co.ts :
 * 240 cardigans livrés le 12, une réserve vide avant eux, 384 demandés dans le mois, le façonnier
 * à 21 jours). HYPOTHÈSES DU CAS, dites au texte : les clients achètent au même rythme tous les
 * jours, à l'unité ; le réassort est commandé le jour de la livraison. LA RÉPONSE SE CALCULE : la
 * livraison tient si ses jours de stock atteignent le délai.
 *
 * CE QUI A CHANGÉ. Le cas lisait un article de l'arène au premier trimestre. Il lit maintenant la
 * livraison du 12 janvier : 240 cardigans, 13 par jour, 18 jours de stock pour 21 jours de délai,
 * 3 jours de rayon vide et 2 925 € de ventes en danger.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");

/** La livraison du 12 janvier, ses jours de stock, et ce qu'un rayon vide mettrait en danger. */
export function reassortAttendu(c: Pick<Cas, "code">) {
  const r = rayon(c);
  return { ...r, aTemps: r.joursSansApres === 0, ventesEnDanger: Math.round(r.articlesEnDanger * r.prixHt * 100) / 100 };
}

export const TENIR_JUSQU_AU_REASSORT: Situation = {
  code: "tenir-jusqu-au-reassort",
  parcours: "cap-epc",
  palier: 1,
  blocs: [],
  reprend: [REMPLIR_LE_RAYON.code],
  commanditaire: "Le responsable du magasin",
  titre: "Tenir jusqu'au réassort",
  accroche: "Une livraison arrive, et le responsable pense qu'elle suffira jusqu'au réassort suivant. Diviser, comparer au délai du fournisseur, chiffrer, et lui répondre.",
  objectifs: ["Calculer les ventes par jour et les jours avant la rupture", "Comparer ces jours au délai du fournisseur", "Chiffrer les ventes en danger, et répondre à son responsable"],
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
          `« Ce matin, le ${s.livraison.jour} janvier, on reçoit ${qte(s.livraison.quantite)} ${s.pluriel}, et la réserve était vide. Je commande le réassort aujourd'hui : le façonnier met ${qte(s.delai)} jours. Est-ce que ça tient jusque-là ? »`,
          "Pas de cours cette fois. Le cours suppose que les clients achètent au même rythme tous les jours du mois.",
        ];
      },
      tableau: (c) => {
        const s = reassortAttendu(c);
        return {
          titre: `${c.entreprise} · les ${s.pluriel} en janvier`,
          colonnes: ["Nombre"],
          lignes: [
            { libelle: `${majuscule(s.pluriel)} ${accordeA(s.feminin, "livré")} le ${s.livraison.jour} janvier`, valeurs: [qte(s.livraison.quantite)] },
            { libelle: `${majuscule(s.pluriel)} ${accordeA(s.feminin, "demandé")} par les clients dans le mois`, valeurs: [qte(s.demande)] },
            { libelle: "Jours dans le mois", valeurs: [qte(s.jours)] },
            { libelle: "Délai du façonnier, en jours", valeurs: [qte(s.delai)] },
          ],
        };
      },
      repere: () => "À rendre : le rythme, les jours avant la rupture, les jours de rayon vide, les ventes en danger, et votre réponse.",
    },
    {
      id: "rythme",
      type: "montants",
      titre: "Le rythme",
      notions: ["stock"],
      question: (c) => {
        const s = reassortAttendu(c);
        return `Calculez les ventes ${de(s.pluriel)} d'une journée, arrondies à l'unité.`;
      },
      champs: (c) => {
        const s = reassortAttendu(c);
        return [{ libelle: "Ventes par jour", attendu: s.parJour, calcul: `${qte(s.demande)} ÷ ${qte(s.jours)} = ${(s.demande / s.jours).toLocaleString("fr-FR")}, arrondi à ${qte(s.parJour)}` }];
      },
      explication: (c) => {
        const s = reassortAttendu(c);
        return [`${qte(s.livraison.quantite)} ${s.pluriel} pour ${qte(s.parJour)} ventes par jour.`];
      },
    },
    {
      id: "jours",
      type: "montants",
      titre: "Les jours qui restent",
      notions: ["stock"],
      question: (c) => `Combien de jours entiers la livraison tiendra-t-elle ? Puis, avec un réassort qui met ${qte(reassortAttendu(c).delai)} jours, combien de jours le rayon restera-t-il vide ? Écrivez 0 s'il tient.`,
      champs: (c) => {
        const s = reassortAttendu(c);
        return [
          { libelle: "Jours avant la rupture", attendu: s.joursApres, calcul: `${qte(s.livraison.quantite)} ÷ ${qte(s.parJour)} = ${qte(s.joursApres)} jours entiers` },
          {
            libelle: "Jours avec un rayon vide",
            attendu: s.joursSansApres,
            calcul: s.aTemps ? `${qte(s.joursApres)} jours de stock, au moins les ${qte(s.delai)} jours du délai : 0` : `${qte(s.delai)} − ${qte(s.joursApres)} = ${qte(s.joursSansApres)}`,
          },
        ];
      },
      explication: (c) => {
        const s = reassortAttendu(c);
        return [
          s.aTemps
            ? `La livraison tient ${qte(s.joursApres)} jours : le réassort arrive avant la rupture.`
            : `La livraison tient ${qte(s.joursApres)} jours, le réassort en met ${qte(s.delai)} : ${qte(s.joursSansApres)} jours de rayon vide, même en commandant aujourd'hui.`,
        ];
      },
    },
    {
      id: "en-danger",
      type: "montants",
      titre: "Les ventes en danger",
      notions: ["stock", "revenue"],
      question: (c) => {
        const s = reassortAttendu(c);
        return `Pendant les jours de rayon vide, les clients continuent de demander ${qte(s.parJour)} ${s.pluriel} par jour, à ${eur(s.prixHt)} hors taxes pièce. Calculez les articles qu'ils ne trouveront pas, puis les ventes en danger en euros.`;
      },
      champs: (c) => {
        const s = reassortAttendu(c);
        return [
          { libelle: "Articles non trouvés", attendu: s.articlesEnDanger, calcul: `${qte(s.joursSansApres)} × ${qte(s.parJour)} = ${qte(s.articlesEnDanger)}` },
          { libelle: "Ventes en danger hors taxes", attendu: s.ventesEnDanger, calcul: `${qte(s.articlesEnDanger)} × ${eur(s.prixHt)} = ${eur(s.ventesEnDanger)}` },
        ];
      },
      explication: (c) => {
        const s = reassortAttendu(c);
        return [`${eur(s.ventesEnDanger)} de ventes en danger : c'est ce que coûte un réassort commandé trop tard.`];
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
            texte: "Non, ça ne tient pas : il faut un réassort plus rapide",
            juste: !s.aTemps,
            retour: !s.aTemps
              ? `Oui : ${qte(s.joursApres)} jours de stock pour ${qte(s.delai)} jours de réassort. Commandé aujourd'hui chez le façonnier, le rayon restera vide ${qte(s.joursSansApres)} jours, ${eur(s.ventesEnDanger)} de ventes en danger. Il faut un fournisseur plus rapide pour ces quelques jours, ou commander plus tôt la prochaine fois.`
              : `Non : ${qte(s.joursApres)} jours de stock, au moins les ${qte(s.delai)} jours du réassort. La livraison suffit.`,
          },
          {
            texte: "Oui, la livraison suffit jusqu'au réassort",
            juste: s.aTemps,
            retour: s.aTemps ? `Oui : ${qte(s.joursApres)} jours de stock, au moins les ${qte(s.delai)} jours du réassort.` : `Non : ${qte(s.livraison.quantite)} ÷ ${qte(s.parJour)} = ${qte(s.joursApres)} jours seulement, pour ${qte(s.delai)} jours de réassort. Le rayon sera vide ${qte(s.joursSansApres)} jours.`,
          },
          {
            texte: "Impossible à dire : on le saura quand le rayon sera vide",
            juste: false,
            retour: `Non : le calcul se fait aujourd'hui, ${qte(s.livraison.quantite)} ÷ ${qte(s.parJour)} = ${qte(s.joursApres)} jours. Attendre le rayon vide, c'est ajouter ${qte(s.delai)} jours de réassort sans rien à vendre.`,
          },
        ];
      },
    },
  ],
};

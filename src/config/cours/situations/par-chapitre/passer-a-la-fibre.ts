import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DU_RESEAU, FIBRE, LIGNE, RAPPORT, VISIO, passerALaFibre } from "../../monde/reseau-d-atlas";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « RÉSEAUX ET INFORMATIQUE EN NUAGE » : PASSER À LA FIBRE ? (Bac STMG, systèmes
 * d'information de gestion de terminale, palier 1).
 *
 * Le chapitre trouvait combien de visioconférences la ligne du bureau tient ; le cas refait le calcul
 * avec une offre fibre, et fait dire si elle répond au besoin de collaboration du cabinet. Hypothèses :
 * monde/reseau-d-atlas.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const PASSER_A_LA_FIBRE: Situation = {
  code: "passer-a-la-fibre",
  parcours: "stmg-sig",
  palier: 1,
  blocs: [],
  reprend: ["reseaux-et-informatique-en-nuage"],
  commanditaire: "La directrice",
  titre: "Passer à la fibre ?",
  accroche: "Les visioconférences se figent dès que le bureau est plein. Une offre fibre arrive dans l'immeuble : ce qu'elle change au débit, et si elle vaut son prix.",
  objectifs: ["Calculer la capacité d'une ligne et un temps d'envoi", "Comparer 2 lignes au besoin du cabinet", "Répondre à la directrice, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_RESEAU, pourquoi: "le cas reprend la ligne du bureau d'ATLAS CONSEIL." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la directrice",
      texte: () => {
        const k = passerALaFibre();
        return [
          `« Nous sommes ${qte(k.personnes)}, et la ligne ne tient que ${qte(k.visiosAujourdhui)} visioconférences. L'offre fibre envoie ${qte(FIBRE.envoiMbits)} Mbit/s, pour ${eur(FIBRE.enPlusParMois)} de plus par mois. Est-ce qu'elle règle le problème ? » La directrice`,
          "Pas de cours cette fois : les notions sont celles du chapitre, et la part de la ligne gardée pour le reste ne change pas.",
        ];
      },
      repere: () => "À rendre : les visioconférences et le temps d'envoi avec la fibre, le coût de l'année, et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Ce que change la fibre",
      question: () => `Avec la fibre, combien de visioconférences la ligne tient-elle en même temps ? En combien de secondes part un rapport de ${qte(RAPPORT.mo)} Mo ? Et que coûte la fibre de plus sur l'année ?`,
      champs: () => {
        const k = passerALaFibre();
        return [
          { libelle: "Visioconférences en même temps", attendu: k.visiosAvecLaFibre, calcul: `${qte(FIBRE.envoiMbits)} × ${qte((1 - LIGNE.partReservee) * 100)} % ÷ ${qte(VISIO.envoiMbits)} = ${qte(k.visiosAvecLaFibre)}` },
          { libelle: "Envoi du rapport (secondes)", attendu: k.rapportAvecLaFibre, tolerance: 0.1, calcul: `${qte(RAPPORT.mo)} × 8 ÷ ${qte(FIBRE.envoiMbits)} = ${qte(k.rapportAvecLaFibre)}` },
          { libelle: "Coût en plus sur l'année", attendu: k.parAn, calcul: `${eur(FIBRE.enPlusParMois)} × 12 = ${eur(k.parAn)}` },
        ];
      },
      explication: () => {
        const k = passerALaFibre();
        return [`La fibre tient ${qte(k.visiosAvecLaFibre)} visioconférences, bien plus que les ${qte(k.personnes)} personnes du cabinet, et un rapport part en ${qte(k.rapportAvecLaFibre)} secondes au lieu de ${qte(k.rapportAujourdhui)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice",
      question: () => "Que répondez-vous à la directrice ?",
      options: () => {
        const k = passerALaFibre();
        return [
          { texte: "Passer à la fibre, et garder une ligne de secours", juste: true, retour: `Oui : pour ${eur(k.parAn)} par an, tout le cabinet peut travailler à distance en même temps. Une petite ligne de secours, en 4G, évite qu'une panne arrête tout le bureau.` },
          { texte: "Garder la ligne, et demander aux consultants de ne pas faire de visioconférence en même temps", juste: false, retour: "Non : le réseau doit servir le besoin de collaboration, pas le brider." },
          { texte: "Acheter des ordinateurs plus puissants", juste: false, retour: "Non : c'est la ligne qui déborde, pas les postes." },
        ];
      },
    },
  ],
};

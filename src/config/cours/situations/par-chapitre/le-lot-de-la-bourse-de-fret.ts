import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { LE_TAUX_DE_REMPLISSAGE } from "../../chapitres/le-taux-de-remplissage";
import { ROUTE_DE_CAMPUSTECH, lotDeLaBourse } from "../../monde/production-et-logistique";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE TAUX DE REMPLISSAGE DES VÉHICULES » : LE LOT DE LA BOURSE DE FRET
 * (2de pro GATL, palier 1).
 *
 * Sur la bourse de fret, un fabricant voisin cherche un camion pour 5 palettes à livrer près de
 * CampusTech, à 35 € la palette, avec un détour de 30 km. Le responsable d'exploitation de NOVA
 * demande s'il faut le prendre dans la tournée du mois. L'élève vérifie que le lot tient dans les
 * places vides, calcule ce qu'il rapporte, ce que coûte le détour, le remplissage avec lui, et
 * répond. Les chiffres sont ceux du chapitre ; le lot est l'hypothèse du cas (LOT_DE_LA_BOURSE).
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${(Math.round(t * 10) / 10).toLocaleString("fr-FR")} %`;

export type ReponseAuLot = "accepter" | "refuser" | "pas-de-place";

/** Le cas : le lot, la place qu'il trouve, ce qu'il rapporte, et la réponse. */
export function lotDeLaBourseDeFret() {
  const k = lotDeLaBourse();
  const reponse: ReponseAuLot = !k.tient ? "pas-de-place" : k.gain > 0 ? "accepter" : "refuser";
  return { ...k, reponse };
}

export const LE_LOT_DE_LA_BOURSE_DE_FRET: Situation = {
  code: "le-lot-de-la-bourse-de-fret",
  parcours: "logistique",
  palier: 1,
  blocs: [],
  reprend: [LE_TAUX_DE_REMPLISSAGE.code],
  commanditaire: "Le responsable d'exploitation",
  titre: "Le lot de la bourse de fret",
  accroche: "Un fabricant voisin cherche de la place pour quelques palettes sur la route de CampusTech. Les prendre remplit le camion : rapportent-elles plus que le détour ?",
  objectifs: ["Vérifier qu'un chargement tient dans les places vides", "Calculer ce que rapporte une place remplie, détour compris", "Répondre au responsable d'exploitation"],
  libre: false,
  entreprises: LE_TAUX_DE_REMPLISSAGE.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du responsable d'exploitation",
      texte: () => {
        const k = lotDeLaBourseDeFret();
        return [
          `« Sur la bourse de fret, un fabricant voisin cherche un camion pour ${qte(k.palettes)} palettes, à livrer près de CampusTech. Il paie ${eur(k.prixParPalette)} la palette, et il faut faire un détour de ${qte(k.detourKm)} km. On les prend ? »`,
          "Pas de cours cette fois : la tournée est celle du chapitre.",
        ];
      },
      tableau: () => {
        const k = lotDeLaBourseDeFret();
        return {
          titre: "La tournée du mois, et le lot",
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Places du porteur (palettes)", valeurs: [qte(k.t.places)] },
            { libelle: "Palettes de CampusTech", valeurs: [qte(k.t.palettes)] },
            { libelle: "Palettes du lot", valeurs: [qte(k.palettes)] },
            { libelle: "Prix d'une palette du lot", valeurs: [eur(k.prixParPalette)] },
            { libelle: "Détour (km)", valeurs: [qte(k.detourKm)] },
            { libelle: "Gazole et péages, par kilomètre", valeurs: [eur(ROUTE_DE_CAMPUSTECH.gazoleEtPeagesParKm)] },
          ],
        };
      },
      repere: () => "À rendre : la place pour le lot, ce qu'il rapporte une fois le détour payé, et votre réponse.",
    },
    {
      id: "la-place",
      type: "montants",
      titre: "La place pour le lot",
      notions: ["capacity"],
      question: () => "Calculez les places vides de la tournée, puis le taux de remplissage avec le lot (au dixième).",
      champs: () => {
        const k = lotDeLaBourseDeFret();
        return [
          { libelle: "Places vides", attendu: k.t.vides, calcul: `${qte(k.t.places)} − ${qte(k.t.palettes)} = ${qte(k.t.vides)}`, tolerance: 0 },
          { libelle: "Taux de remplissage avec le lot (%)", attendu: Math.round(k.remplissageAvec * 10) / 10, calcul: `(${qte(k.t.palettes)} + ${qte(k.palettes)}) ÷ ${qte(k.t.places)} × 100 = ${pct(k.remplissageAvec)}`, tolerance: 0.1 },
        ];
      },
      explication: () => {
        const k = lotDeLaBourseDeFret();
        return [k.tient ? `Le lot tient dans les ${qte(k.t.vides)} places vides : le porteur partirait rempli à ${pct(k.remplissageAvec)}.` : "Le lot ne tient pas dans les places vides."];
      },
    },
    {
      id: "ce-qu-il-rapporte",
      type: "montants",
      titre: "Ce que rapporte le lot",
      notions: ["contribution_margin", "fixed_costs"],
      question: () => "Calculez ce que le fabricant paierait pour le lot, ce que coûte le détour, puis ce que le lot laisse à NOVA.",
      champs: () => {
        const k = lotDeLaBourseDeFret();
        return [
          { libelle: "Ce que paie le fabricant", attendu: k.recette, calcul: `${qte(k.palettes)} × ${eur(k.prixParPalette)} = ${eur(k.recette)}` },
          { libelle: "Ce que coûte le détour", attendu: k.detour, calcul: `${qte(k.detourKm)} × ${eur(ROUTE_DE_CAMPUSTECH.gazoleEtPeagesParKm)} = ${eur(k.detour)}` },
          { libelle: "Ce que le lot laisse", attendu: k.gain, calcul: `${eur(k.recette)} − ${eur(k.detour)} = ${eur(k.gain)}` },
        ];
      },
      explication: () => {
        const k = lotDeLaBourseDeFret();
        return [`La journée du camion et du chauffeur est déjà payée par la tournée : le lot n'ajoute que le détour. Il laisse ${eur(k.gain)} chaque fois.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable d'exploitation",
      question: () => "Que répondez-vous au responsable d'exploitation ?",
      options: () => {
        const k = lotDeLaBourseDeFret();
        return [
          { texte: "Prendre le lot", juste: k.reponse === "accepter", retour: k.reponse === "accepter" ? `Oui : il tient dans les places vides et laisse ${eur(k.gain)}, détour payé.` : "Non." },
          { texte: `Refuser : ${eur(k.prixParPalette)} la palette, c'est trop peu`, juste: k.reponse === "refuser", retour: k.reponse === "refuser" ? "Oui." : `Non : une palette de CampusTech coûte plus cher, mais la place vide, elle, est déjà payée ; le lot n'ajoute que le détour, ${eur(k.detour)}.` },
          { texte: "Refuser : le lot ne tient pas dans le camion", juste: k.reponse === "pas-de-place", retour: k.reponse === "pas-de-place" ? "Oui." : `Non : il reste ${qte(k.t.vides)} places, assez pour ${qte(k.palettes)} palettes.` },
        ];
      },
    },
  ],
};

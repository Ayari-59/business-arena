import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_DURABILITE, durabiliteDuChapitre } from "../../chapitres/les-indicateurs-de-durabilite";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES INDICATEURS DE DURABILITÉ AU TABLEAU DE BORD » : LES INDICATEURS QUE
 * DEMANDE CAMPUSTECH (contrôle de gestion, palier 4).
 *
 * CampusTech, qui publie un rapport de durabilité, demande à NOVA ses indicateurs du semestre : l'énergie
 * et les émissions par enceinte, la part des déchets valorisés, le taux de fréquence des accidents.
 * L'élève les calcule sur les totaux du semestre (`tableauDeBordDurable`, monde/tableau-de-bord-durable.ts)
 * et choisit ce qu'il envoie : le semestre entier avec ses bases, plutôt que le meilleur mois.
 */

const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
const pct = (t: number, d = 1) => `${(Math.round(t * 10 ** (d + 2)) / 10 ** d + 0).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`;
const arrondi = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d + 0;

/** Les chiffres du cas : le semestre, et le meilleur mois pour l'énergie. */
export function indicateursPourCampustech(c: Pick<Cas, "code">) {
  const x = durabiliteDuChapitre(c);
  const s = x.t.semestre;
  const meilleur = [...x.t.mois].sort((a, b) => a.valeurs.kwhParEnceinte - b.valeurs.kwhParEnceinte)[0]!;
  return { x, s, meilleur };
}

export const LES_INDICATEURS_QUE_DEMANDE_CAMPUSTECH: Situation = {
  code: "les-indicateurs-que-demande-campustech",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["les-indicateurs-de-durabilite"],
  commanditaire: "L'acheteuse de CampusTech",
  titre: "Les indicateurs que demande CampusTech",
  accroche: "CampusTech publie un rapport de durabilité et demande à NOVA ses indicateurs du semestre. Lesquels envoyer, calculés comment ?",
  objectifs: [
    "Calculer des indicateurs de durabilité sur un semestre, à partir des totaux",
    "Calculer un taux de fréquence des accidents et en donner la base",
    "Rendre une réponse fidèle, qui ne choisit pas le meilleur mois",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_DURABILITE,
    pourquoi: "ce cas reprend le chapitre « Les indicateurs de durabilité au tableau de bord », qui se calcule sur le semestre de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de CampusTech",
      texte: () => [
        "« Pour notre rapport de durabilité, nous demandons à chaque fournisseur ses indicateurs du premier semestre : l'énergie et les émissions par produit livré, la part des déchets valorisés, le taux de fréquence des accidents du travail. Merci de nous les envoyer avec leur mode de calcul. »",
        "Pas de cours cette fois : vous avez le tableau de bord durable du semestre et la méthode du chapitre.",
      ],
      tableau: (c) => {
        const { s } = indicateursPourCampustech(c);
        return {
          titre: "Les totaux du semestre · NOVA",
          colonnes: ["Janvier à juin"],
          lignes: [
            { libelle: "Enceintes vendues", valeurs: [qte(s.quantite)] },
            { libelle: "Énergie consommée", valeurs: [`${qte(s.kwh)} kWh`] },
            { libelle: "Émissions", valeurs: [`${qte(s.co2)} kg de CO2 équivalent`] },
            { libelle: "Déchets d'emballage, dont valorisés", valeurs: [`${qte(s.dechets)} kg, dont ${qte(s.valorises)} kg`] },
            { libelle: "Heures travaillées", valeurs: [`${qte(s.heuresTravaillees)} heures`] },
            { libelle: "Accidents du travail avec arrêt", valeurs: [qte(s.accidents)] },
            { libelle: "Chiffre d'affaires", valeurs: [montantEcrit(s.chiffreDAffaires)] },
          ],
        };
      },
      repere: () => "À rendre : les quatre indicateurs du semestre, et ce que vous envoyez à CampusTech.",
    },
    {
      id: "les-indicateurs-du-semestre",
      type: "montants",
      titre: "Les indicateurs du semestre",
      notions: ["csr_index"],
      question: () =>
        "Calculez sur les totaux du semestre : l'énergie par enceinte au centième, les émissions par enceinte en kg au millième, la part des déchets valorisés en pour cent au centième. Puis le taux de fréquence des accidents (accidents × 1 000 000 ÷ heures travaillées), au dixième.",
      champs: (c) => {
        const { s } = indicateursPourCampustech(c);
        return [
          { libelle: "Énergie par enceinte (kWh)", attendu: arrondi(s.kwhParEnceinte, 2), tolerance: 0.01, calcul: `${qte(s.kwh)} ÷ ${qte(s.quantite)} = ${qte(s.kwhParEnceinte, 4)} kWh` },
          { libelle: "Émissions par enceinte (kg)", attendu: arrondi(s.co2ParEnceinte, 3), tolerance: 0.001, calcul: `${qte(s.co2)} ÷ ${qte(s.quantite)} = ${qte(s.co2ParEnceinte, 4)} kg` },
          { libelle: "Part des déchets valorisés (%)", attendu: arrondi(s.partValorisee * 100, 2), tolerance: 0.01, calcul: `${qte(s.valorises)} ÷ ${qte(s.dechets)} = ${pct(s.partValorisee, 2)}` },
          { libelle: "Taux de fréquence des accidents", attendu: arrondi(s.tauxDeFrequence, 1), tolerance: 0.1, calcul: `${qte(s.accidents)} × 1 000 000 ÷ ${qte(s.heuresTravaillees)} = ${qte(s.tauxDeFrequence, 1)}` },
        ];
      },
      explication: (c) => {
        const { s } = indicateursPourCampustech(c);
        return [`Chaque intensité se calcule sur les totaux du semestre. Le taux de fréquence, ${qte(s.tauxDeFrequence, 1)}, repose sur ${qte(s.accidents)} accident en ${qte(s.heuresTravaillees)} heures : CampusTech doit le savoir pour le lire.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Ce que vous envoyez",
      notions: ["csr_index", "dashboard"],
      question: () => "Que répondez-vous à l'acheteuse de CampusTech ?",
      options: (c) => {
        const { s, meilleur } = indicateursPourCampustech(c);
        return [
          {
            texte: "Le semestre entier, avec ses bases de calcul",
            juste: true,
            retour: `Oui. ${qte(s.kwhParEnceinte)} kWh et ${qte(s.co2ParEnceinte, 3)} kg par enceinte, ${pct(s.partValorisee)} de déchets valorisés, un taux de fréquence de ${qte(s.tauxDeFrequence, 1)} pour ${qte(s.accidents)} accident en ${qte(s.heuresTravaillees)} heures. Une information de durabilité vaut par sa période, son périmètre et sa méthode, dits avec elle.`,
          },
          {
            texte: `Les chiffres de ${meilleur.nom}, le meilleur mois : ${qte(meilleur.valeurs.kwhParEnceinte)} kWh par enceinte`,
            juste: false,
            retour: `Non : CampusTech demande le semestre. Envoyer le meilleur mois, c'est embellir l'information : le semestre consomme ${qte(s.kwhParEnceinte)} kWh par enceinte.`,
          },
          {
            texte: "Tout sauf le taux de fréquence, qui donnerait une mauvaise image de NOVA",
            juste: false,
            retour: "Non : taire un indicateur gênant est une information trompeuse. Mieux vaut l'envoyer avec sa base, qui explique pourquoi il est si haut sur une petite équipe.",
          },
        ];
      },
    },
  ],
};

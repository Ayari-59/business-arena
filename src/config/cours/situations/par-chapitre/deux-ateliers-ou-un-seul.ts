import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_L_ACTION_COLLECTIVE, FONDATEUR_SEUL, deuxAteliersOuUn, seulOuOrganise } from "../../monde/action-collective-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « ORGANISER L'ACTION COLLECTIVE » : DEUX ATELIERS OU UN SEUL ?
 * (Bac STMG, management de première, palier 1).
 *
 * Avant de créer NOVA, son fondateur hésite à s'associer avec un ami artisan qui monte, comme lui, ses
 * enceintes seul. Le cas est neuf par sa question : le chapitre comparait une personne seule et un
 * opérateur ; ici, deux personnes choisissent entre rester chacune seule ou s'organiser à deux (l'une
 * monte sur un poste de série, l'autre fait les achats, la vente et les comptes des deux).
 * Hypothèses et chiffres : monde/action-collective-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const DEUX_ATELIERS_OU_UN_SEUL: Situation = {
  code: "deux-ateliers-ou-un-seul",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["organiser-l-action-collective"],
  commanditaire: "Le fondateur de NOVA",
  titre: "Deux ateliers ou un seul ?",
  accroche: "Avant NOVA, le fondateur et un ami artisan montent chacun leurs enceintes, seuls. S'associer, et se répartir le travail, leur ferait-il monter davantage ?",
  objectifs: ["Comparer ce que produisent deux personnes seules et deux personnes organisées", "Chiffrer ce que rapporte la répartition des tâches", "Répondre au fondateur, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_ACTION_COLLECTIVE,
    pourquoi: "le cas reprend l'histoire de NOVA du chapitre, son fondateur seul et le temps de montage de sa ligne.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du fondateur",
      texte: () => {
        const s = seulOuOrganise();
        return [
          `« Mon ami et moi montons chacun nos enceintes, seuls : ${qte(FONDATEUR_SEUL.heuresDeMontageParMois)} heures de montage par mois, le reste part dans les achats, la vente et les comptes. Il propose qu'on s'associe : l'un de nous monterait à plein temps sur un poste de série, ${qte(s.heuresDeMontage)} heures par mois à ${s.heuresParEnceinte.toLocaleString("fr-FR")} heure l'enceinte, et l'autre ferait les achats, la vente et les comptes des deux. Combien d'enceintes de plus par trimestre, et quelle marge en plus ? » Le fondateur`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre.",
        ];
      },
      tableau: () => {
        const s = seulOuOrganise();
        return {
          titre: "Le montage, seul ou sur un poste de série",
          colonnes: ["Seul", "Poste de série"],
          lignes: [
            { libelle: "Heures de montage par mois", valeurs: [qte(FONDATEUR_SEUL.heuresDeMontageParMois), qte(s.heuresDeMontage)] },
            { libelle: "Heure par enceinte", valeurs: [FONDATEUR_SEUL.heuresParEnceinte.toLocaleString("fr-FR"), s.heuresParEnceinte.toLocaleString("fr-FR")] },
            { libelle: "Marge par enceinte vendue", valeurs: [eur(s.marge), eur(s.marge)] },
          ],
        };
      },
      repere: () => "À rendre : les enceintes montées par trimestre chacun seul et à deux organisés, la marge en plus, et votre réponse.",
    },
    {
      id: "les-deux-facons",
      type: "montants",
      titre: "Seuls ou à deux",
      notions: ["productivity"],
      question: () => "Calculez les enceintes que les deux montent par trimestre chacun seul (à l'unité inférieure pour chacun), celles qu'ils monteraient associés, puis la marge en plus sur un trimestre.",
      champs: () => {
        const k = deuxAteliersOuUn();
        const s = seulOuOrganise();
        return [
          { libelle: "Enceintes par trimestre, chacun seul", attendu: k.separes, calcul: `2 × ${qte(s.seulParTrimestre)} = ${qte(k.separes)}`, tolerance: 0 },
          { libelle: "Enceintes par trimestre, associés", attendu: k.associes, calcul: `${qte(s.heuresDeMontage)} ÷ ${s.heuresParEnceinte.toLocaleString("fr-FR")} × 3 = ${qte(k.associes)}`, tolerance: 0 },
          { libelle: "Marge en plus sur un trimestre", attendu: k.margeEnPlus, calcul: `(${qte(k.associes)} − ${qte(k.separes)}) × ${eur(k.marge)} = ${eur(k.margeEnPlus)}`, tolerance: 1 },
        ];
      },
      explication: () => {
        const k = deuxAteliersOuUn();
        return [`À deux organisés, ils montent ${qte(k.enPlus)} enceintes de plus par trimestre : celui qui monte ne fait plus que cela, sur un poste conçu pour, et celui qui achète et vend le fait pour deux.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au fondateur",
      question: () => "Que répondez-vous au fondateur ?",
      options: () => {
        const k = deuxAteliersOuUn();
        return [
          {
            texte: `S'associer : ${qte(k.enPlus)} enceintes de plus par trimestre`,
            juste: k.enPlus > 0,
            retour:
              k.enPlus > 0
                ? `Oui : ${qte(k.associes)} enceintes au lieu de ${qte(k.separes)}, soit ${eur(k.margeEnPlus)} de marge en plus chaque trimestre. Il leur faudra un objectif commun et des règles (qui décide, comment se partage le résultat), et une société pour porter leur projet.`
                : "Non : à deux, ils ne monteraient pas davantage.",
          },
          {
            texte: "Rester chacun seul : à deux, ils ne monteraient que ce que monte un seul monteur",
            juste: k.enPlus <= 0,
            retour: k.enPlus <= 0 ? "Oui." : `Non : un seul monteur organisé, à plein temps sur un poste de série, monte ${qte(k.associes)} enceintes, plus que les ${qte(k.separes)} de deux personnes seules.`,
          },
          {
            texte: "Peu importe : à deux ou seuls, ils travaillent le même nombre d'heures",
            juste: false,
            retour: "Non : les heures sont les mêmes, mais organisées elles produisent davantage, parce que chacun se spécialise.",
          },
        ];
      },
    },
  ],
};

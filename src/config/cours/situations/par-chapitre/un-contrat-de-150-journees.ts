import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DES_LIENS_DE_TRAVAIL } from "../../chapitres/qualification-competences-et-liens-de-travail";
import { CONSULTANTS } from "../../monde/atlas-conseil";
import { CONTRAT_DE_150_JOURNEES, JOURNEES_OU_L_EMBAUCHE_SE_PAIE, JOURNEE_D_UN_INDEPENDANT } from "../../monde/liens-de-travail-d-atlas";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « QUALIFICATION, COMPÉTENCES ET NOUVEAUX LIENS DE TRAVAIL » : UN CONTRAT DE
 * 150 JOURNÉES (Bac STMG, SGN de première, palier 1).
 *
 * Un grand compte signe 150 journées réparties sur l'année N + 1 (CONTRAT_DE_150_JOURNEES). La présidente
 * hésite : un salarié de plus, ou des indépendants ? Les calculs sont ceux du chapitre (le coût d'un
 * consultant salarié, celui des journées d'indépendants, le seuil de 110 journées), sur une question
 * neuve : une hausse durable, et non plus une pointe.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export function contratDe150Journees() {
  const independants = CONTRAT_DE_150_JOURNEES * JOURNEE_D_UN_INDEPENDANT;
  const salarie = CONSULTANTS.coutAnnuel;
  return { journees: CONTRAT_DE_150_JOURNEES, independants, salarie, economie: independants - salarie, embaucher: salarie < independants };
}

export const UN_CONTRAT_DE_150_JOURNEES: Situation = {
  code: "un-contrat-de-150-journees",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["qualification-competences-et-liens-de-travail"],
  commanditaire: "La présidente du cabinet",
  titre: "Un contrat de 150 journées",
  accroche: "Un grand compte signe 150 journées sur l'année. Pour les faire, un consultant salarié de plus, ou des indépendants à la journée ?",
  objectifs: ["Chiffrer le coût de deux liens de travail", "Comparer une embauche à l'externalisation", "Répondre à la présidente, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_LIENS_DE_TRAVAIL,
    pourquoi: "le cas reprend les consultants d'ATLAS CONSEIL du chapitre, leur coût et celui d'un indépendant.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la présidente",
      texte: () => [
        `« Nous avons signé ${qte(CONTRAT_DE_150_JOURNEES)} journées avec un grand compte, réparties sur toute l'année. Je ne veux pas surcharger l'équipe actuelle. J'embauche un consultant à ${eur(CONSULTANTS.coutAnnuel)} par an, ou je confie ces journées à des indépendants, à ${eur(JOURNEE_D_UN_INDEPENDANT)} la journée ? » La présidente`,
        "Pas de cours cette fois : les calculs sont ceux du chapitre.",
      ],
      repere: () => "À rendre : le coût des deux solutions, ce que la moins chère économise, et votre réponse.",
    },
    {
      id: "les-calculs",
      type: "montants",
      titre: "Les deux coûts",
      notions: ["make_or_buy"],
      question: () => "Calculez le coût des journées confiées à des indépendants, et ce que l'embauche économise (indépendants moins salarié, négatif si elle coûte plus).",
      champs: () => {
        const k = contratDe150Journees();
        return [
          { libelle: "Coût des indépendants", attendu: k.independants, calcul: `${qte(k.journees)} × ${eur(JOURNEE_D_UN_INDEPENDANT)} = ${eur(k.independants)}` },
          { libelle: "Économie de l'embauche", attendu: k.economie, calcul: `${eur(k.independants)} − ${eur(k.salarie)} = ${eur(k.economie)}` },
        ];
      },
      explication: () => {
        const k = contratDe150Journees();
        return [`${qte(k.journees)} journées, c'est plus que les ${qte(JOURNEES_OU_L_EMBAUCHE_SE_PAIE)} à partir desquelles l'embauche coûte moins : elle économise ${eur(k.economie)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la présidente",
      question: () => "Que répondez-vous à la présidente ?",
      options: () => {
        const k = contratDe150Journees();
        return [
          {
            texte: `Embaucher : le salarié coûte ${eur(k.economie)} de moins`,
            juste: k.embaucher,
            retour: k.embaucher
              ? `Oui : l'activité est durable et au-delà du seuil. Le salarié coûte ${eur(k.salarie)}, les indépendants ${eur(k.independants)}. Et ses compétences restent au cabinet.`
              : "Non : les indépendants coûtent moins.",
          },
          {
            texte: "Les indépendants : ils ne coûtent que les journées faites, sans aucune charge pour le cabinet",
            juste: !k.embaucher,
            retour: k.embaucher ? `Non : pour ${qte(k.journees)} journées, ils coûteraient ${eur(k.independants)}, plus qu'un salarié.` : "Oui : ils coûtent moins.",
          },
          {
            texte: "Faire les journées avec l'équipe actuelle, en supprimant les jours de préparation",
            juste: false,
            retour: "Non : c'est ce qui a usé l'équipe au trimestre 4 de N, avec des arrêts et une démission. Le coût caché dépasse l'économie.",
          },
        ];
      },
    },
  ],
};

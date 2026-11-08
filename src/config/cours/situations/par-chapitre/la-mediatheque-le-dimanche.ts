import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_LA_STRATEGIE_PUBLIQUE, mediathequeLeDimanche } from "../../monde/strategie-du-haut-verdasse";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA STRATÉGIE D'UNE ORGANISATION PUBLIQUE » : LA MÉDIATHÈQUE LE DIMANCHE ?
 * (Bac STMG, management de première, palier 1).
 *
 * Les élus de la Communauté de communes du Haut-Verdasse envisagent d'ouvrir la médiathèque le dimanche
 * après-midi. Le cas est neuf par sa question : le chapitre chiffrait la piscine ; ici, l'élève chiffre
 * un service nouveau et le juge sur les principes du service public, pas sur un bénéfice. Hypothèses :
 * monde/strategie-du-haut-verdasse.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const LA_MEDIATHEQUE_LE_DIMANCHE: Situation = {
  code: "la-mediatheque-le-dimanche",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["la-strategie-d-une-organisation-publique"],
  commanditaire: "L'élue chargée de la culture",
  titre: "La médiathèque le dimanche ?",
  accroche: "Les élus envisagent d'ouvrir la médiathèque le dimanche après-midi. Que coûterait ce service, et faut-il l'ouvrir alors qu'il ne rapportera rien ?",
  objectifs: ["Chiffrer le coût d'un service public nouveau", "Juger un service public sur les principes qui le fondent", "Répondre à l'élue, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_STRATEGIE_PUBLIQUE,
    pourquoi: "le cas reprend la communauté de communes du chapitre, son budget et sa médiathèque.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de l'élue",
      texte: () => {
        const k = mediathequeLeDimanche();
        return [
          `« Beaucoup d'habitants travaillent en semaine et ne peuvent pas venir à la ${k.nom.replace(/^Médiathèque/, "médiathèque")}. Nous pourrions l'ouvrir le dimanche après-midi, ${qte(k.dimanches)} dimanches par an, avec ${qte(k.agents)} agents pendant ${qte(k.heures)} heures, à ${eur(k.coutHoraire)} de l'heure, majoration comprise. Nous attendons ${qte(k.visitesParDimanche)} visites chaque dimanche. L'entrée reste gratuite pour les jeunes, et l'abonnement ne change pas. Faut-il le faire ? » L'élue chargée de la culture`,
          "Pas de cours cette fois : les calculs et les principes sont ceux du chapitre.",
        ];
      },
      repere: () => "À rendre : le coût de l'année, le coût par visite et votre réponse.",
    },
    {
      id: "le-cout",
      type: "montants",
      titre: "Ce que coûterait le dimanche",
      question: () => "Calculez le coût de l'année (dimanches × agents × heures × coût horaire), les visites de l'année, puis le coût par visite, au centime.",
      champs: () => {
        const k = mediathequeLeDimanche();
        return [
          { libelle: "Coût de l'année", attendu: k.cout, calcul: `${qte(k.dimanches)} × ${qte(k.agents)} × ${qte(k.heures)} × ${eur(k.coutHoraire)} = ${eur(k.cout)}`, tolerance: 1 },
          { libelle: "Visites de l'année", attendu: k.visites, calcul: `${qte(k.dimanches)} × ${qte(k.visitesParDimanche)} = ${qte(k.visites)}`, tolerance: 0 },
          { libelle: "Coût par visite", attendu: k.coutParVisite, calcul: `${eur(k.cout)} ÷ ${qte(k.visites)} = ${eur(k.coutParVisite)}`, tolerance: 0.01 },
        ];
      },
      explication: () => {
        const k = mediathequeLeDimanche();
        return [`Le dimanche coûterait ${eur(k.cout)} par an, ${k.partDuBudget.toLocaleString("fr-FR")} % des dépenses de fonctionnement, pour ${qte(k.visites)} visites : ${eur(k.coutParVisite)} chacune.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à l'élue",
      question: () => "Que répondez-vous à l'élue ?",
      options: () => {
        const k = mediathequeLeDimanche();
        return [
          {
            texte: `Ouvrir : le service s'adapte aux usagers, pour ${eur(k.coutParVisite)} la visite`,
            juste: true,
            retour: `Oui : c'est l'adaptabilité du service public, ouvert à ceux qui travaillent en semaine, et l'égalité d'accès, puisque rien ne change aux tarifs. Le coût, ${eur(k.cout)}, se vote au budget ; il se suivra par la fréquentation réelle.`,
          },
          {
            texte: "Refuser : un service qui ne rapporte aucune recette nouvelle ne se justifie pas",
            juste: false,
            retour: "Non : c'est le raisonnement d'une entreprise. Un service public se juge sur le service rendu et son coût, pas sur ses recettes.",
          },
          {
            texte: "Ouvrir, mais faire payer l'entrée du dimanche à tous, jeunes compris, pour couvrir le coût",
            juste: false,
            retour: "Non : faire payer les seuls visiteurs du dimanche, jeunes compris, traiterait les usagers différemment selon le jour : contraire à l'égalité, pour une somme que le budget peut porter.",
          },
        ];
      },
    },
  ],
};

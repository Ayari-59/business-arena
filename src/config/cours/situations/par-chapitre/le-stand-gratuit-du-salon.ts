import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_L_ETHIQUE, salon } from "../../monde/ethique-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « ÉTHIQUE, TRANSPARENCE ET ÉGALITÉ » : LE STAND GRATUIT DU SALON (Bac STMG,
 * enseignement commun de terminale, palier 1).
 *
 * Le chapitre rangeait le greenwashing ; le cas en chiffre la tentation : un stand gratuit et des ventes
 * en plus, contre une allégation trompeuse. Hypothèses : monde/ethique-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const LE_STAND_GRATUIT_DU_SALON: Situation = {
  code: "le-stand-gratuit-du-salon",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["ethique-transparence-et-egalite"],
  commanditaire: "Le commercial",
  titre: "Le stand gratuit du salon",
  accroche: "Un salon offre un stand à NOVA si elle écrit « enceinte écologique » sur la Studio, dont seul le carton est recyclé. L'affaire est tentante : faut-il l'accepter ?",
  objectifs: ["Chiffrer ce qu'une pratique douteuse rapporterait", "Reconnaître le greenwashing", "Répondre au commercial, en pesant le risque"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_L_ETHIQUE, pourquoi: "le cas reprend la Studio de NOVA et sa communication." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du commercial",
      texte: () => {
        const s = salon();
        return [
          `« Le salon nous offre un stand qui vaut ${eur(s.valeurDuStand)}, si nous affichons « enceinte écologique » sur la Studio. Je pense en vendre ${qte(s.ventesAttendues)} de plus, à ${eur(s.margeParVente)} de marge chacune. Seul son carton est recyclé, mais qui ira vérifier ? » Le commercial`,
          "Pas de cours cette fois : les notions sont celles du chapitre.",
        ];
      },
      repere: () => "À rendre : ce que l'affaire rapporterait, et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Ce que l'affaire rapporterait",
      question: () => "Calculez la marge des ventes en plus, puis ce que l'affaire rapporterait en tout, le stand compris.",
      champs: () => {
        const s = salon();
        return [
          { libelle: "Marge des ventes en plus", attendu: s.marge, calcul: `${qte(s.ventesAttendues)} × ${eur(s.margeParVente)} = ${eur(s.marge)}` },
          { libelle: "Ce que l'affaire rapporterait", attendu: s.gain, calcul: `${eur(s.marge)} + ${eur(s.valeurDuStand)} = ${eur(s.gain)}` },
        ];
      },
      explication: () => [`Sur le papier, l'affaire rapporterait ${eur(salon().gain)}. Reste à savoir ce qu'elle coûterait.`],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au commercial",
      question: () => "Que répondez-vous au commercial ?",
      options: () => [
        {
          texte: "Refuser : c'est du greenwashing, et cela se paie",
          juste: true,
          retour: "Oui : l'allégation est trompeuse, donc interdite, et un client, une association ou un concurrent finit par vérifier. La réputation de NOVA y perdrait bien plus que la marge espérée. Si NOVA veut ce stand, qu'elle rende vraiment la Studio plus écologique, et le dise avec des preuves.",
        },
        {
          texte: "Accepter : une petite exagération sur un produit, tout le monde le fait",
          juste: false,
          retour: "Non : présenter un détail comme un engagement écologique trompe le client. C'est une pratique commerciale trompeuse.",
        },
        {
          texte: "Accepter, mais en écrivant la mention en tout petit sur l'emballage",
          juste: false,
          retour: "Non : la taille de la mention ne change rien. Elle reste fausse.",
        },
      ],
    },
  ],
};

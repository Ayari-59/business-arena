import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DU_DIALOGUE_SOCIAL, accordDuDimanche } from "../../monde/dialogue-social-de-l-escale";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE DIALOGUE SOCIAL » : UN ACCORD SANS DÉLÉGUÉ SYNDICAL (Bac STMG, ressources
 * humaines et communication de terminale, palier 1).
 *
 * Le chapitre trouvait la plus haute majoration du dimanche que l'enveloppe paie ; le cas la chiffre par
 * heure et sur l'année, et demande avec qui signer l'accord dans un hôtel sans délégué syndical.
 * Hypothèses et droit : monde/dialogue-social-de-l-escale.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR")} %`;

export const UN_ACCORD_SANS_DELEGUE_SYNDICAL: Situation = {
  code: "un-accord-sans-delegue-syndical",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["le-dialogue-social"],
  commanditaire: "La directrice",
  titre: "Un accord sans délégué syndical",
  accroche: "L'hôtel et l'élue du CSE se sont entendus sur une majoration des heures du dimanche. Ce qu'elle coûte, et avec qui signer un accord valable dans un hôtel sans délégué syndical.",
  objectifs: ["Chiffrer la majoration retenue", "Savoir qui peut signer un accord d'entreprise", "Répondre à la directrice, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_DIALOGUE_SOCIAL, pourquoi: "le cas reprend la négociation du dimanche à L'ESCALE." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la directrice",
      texte: () => {
        const k = accordDuDimanche();
        return [
          `« Nadia et moi sommes d'accord sur ${pct(k.taux)} de majoration des heures du dimanche, pour ${qte(k.heures)} heures dans l'année, à ${eur(k.coutHoraire)} l'heure. Combien cela fait-il par heure et sur l'année ? Et avec qui dois-je signer, puisque nous n'avons pas de délégué syndical ? » La directrice`,
          "Pas de cours cette fois : les notions sont celles du chapitre.",
        ];
      },
      repere: () => "À rendre : la majoration d'une heure, son coût sur l'année, et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Ce que coûte l'accord",
      question: () => "Calculez ce que la majoration ajoute à une heure du dimanche, puis son coût sur l'année.",
      champs: () => {
        const k = accordDuDimanche();
        return [
          { libelle: "Majoration d'une heure", attendu: k.parHeure, calcul: `${eur(k.coutHoraire)} × ${pct(k.taux)} = ${eur(k.parHeure)}` },
          { libelle: "Coût sur l'année", attendu: k.annee, calcul: `${qte(k.heures)} × ${eur(k.parHeure)} = ${eur(k.annee)}` },
        ];
      },
      explication: () => {
        const k = accordDuDimanche();
        return [`L'accord coûte ${eur(k.annee)} par an, dans l'enveloppe de ${eur(k.enveloppe)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice",
      question: () => "Avec qui la directrice peut-elle signer l'accord ?",
      options: () => [
        {
          texte: "Avec l'élue du CSE, ou un salarié mandaté par un syndicat",
          juste: true,
          retour: "Oui : entre 11 et 49 salariés, sans délégué syndical, un accord d'entreprise peut être conclu avec des élus du CSE ou avec un salarié mandaté par une organisation syndicale représentative. Écrit et déposé, il s'applique à tous les salariés de l'hôtel.",
        },
        {
          texte: "Personne : sans délégué syndical, aucun accord d'entreprise n'est possible, il faut une décision seule",
          juste: false,
          retour: "Non : la loi prévoit d'autres signataires dans les petites entreprises. Une décision seule de l'employeur reste possible, mais ce n'est pas un accord négocié.",
        },
        {
          texte: "Avec chaque salarié, un par un, par un simple courriel",
          juste: false,
          retour: "Non : un accord collectif se négocie avec des représentants, pas salarié par salarié.",
        },
      ],
    },
  ],
};

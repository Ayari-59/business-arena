import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DES_RISQUES } from "../../chapitres/les-risques-de-la-performance";
import { PART_LA_PLUS_SURE, SECOND_FOURNISSEUR, anneeDesRisques, diversifier } from "../../monde/risques-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES RISQUES DE LA PERFORMANCE » : DEUX MOIS SANS COMPOSANTS ? (Bac STMG,
 * SGN de première, palier 1).
 *
 * Un incendie dans une usine voisine fait craindre au président une rupture plus longue : deux mois
 * (MOIS_DE_LA_CRAINTE, hypothèse du cas). La diversification du chapitre, la moitié des jeux chez le
 * second fournisseur, protège-t-elle encore ? Les calculs sont ceux du chapitre (`diversifier`), sur une
 * rupture de deux mois.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");

export const MOIS_DE_LA_CRAINTE = 2;

export function deuxMoisSansComposants() {
  const seul = diversifier(0, MOIS_DE_LA_CRAINTE);
  const partage = diversifier(PART_LA_PLUS_SURE, MOIS_DE_LA_CRAINTE);
  return { seul, partage, gain: Math.round((partage.pireDesCas - seul.pireDesCas) * 100) / 100 };
}

export const DEUX_MOIS_SANS_COMPOSANTS: Situation = {
  code: "deux-mois-sans-composants",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["les-risques-de-la-performance"],
  commanditaire: "Le président",
  titre: "Deux mois sans composants ?",
  accroche: "Un incendie chez un voisin du fournisseur fait craindre une rupture plus longue. Partager les achats entre deux fournisseurs protège-t-il encore assez ?",
  objectifs: ["Chiffrer un risque de rupture plus long", "Comparer le pire des cas avec et sans second fournisseur", "Répondre au président, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_RISQUES,
    pourquoi: "le cas reprend l'année N de NOVA et le second fournisseur du chapitre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La crainte du président",
      texte: () => [
        `« Si Électro-Composants s'arrêtait ${MOIS_DE_LA_CRAINTE} mois au lieu d'un, que perdrions-nous ? Et en confiant la moitié des jeux au second fournisseur, ${eur(SECOND_FOURNISSEUR.surcoutParJeu)} plus cher le jeu, que resterait-il dans le pire des cas ? » Le président`,
        "Pas de cours cette fois : les calculs sont ceux du chapitre.",
      ],
      repere: () => "À rendre : le résultat dans le pire des cas, avec un seul fournisseur puis avec deux, et votre réponse.",
    },
    {
      id: "les-calculs",
      type: "montants",
      titre: "Le pire des cas",
      question: () => `Sur une rupture de ${MOIS_DE_LA_CRAINTE} mois, calculez le résultat d'activité dans le pire des cas avec un seul fournisseur, puis avec la moitié des jeux chez le second.`,
      champs: () => {
        const a = anneeDesRisques();
        const k = deuxMoisSansComposants();
        return [
          { libelle: "Pire des cas, un seul fournisseur", attendu: k.seul.pireDesCas, calcul: `${eur(a.resultat)} − ${eur(k.seul.perteSiUnFournisseurSArrete)} = ${eur(k.seul.pireDesCas)}` },
          { libelle: "Pire des cas, deux fournisseurs", attendu: k.partage.pireDesCas, calcul: `${eur(a.resultat)} − ${eur(k.partage.surcout)} − ${eur(k.partage.perteSiUnFournisseurSArrete)} = ${eur(k.partage.pireDesCas)}` },
        ];
      },
      explication: () => {
        const k = deuxMoisSansComposants();
        return [`Avec deux fournisseurs, le pire des cas est meilleur de ${eur(k.gain)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const k = deuxMoisSansComposants();
        const protege = k.gain > 0;
        return [
          {
            texte: `Partager protège encore : ${eur(k.gain)} de mieux dans le pire des cas`,
            juste: protege,
            retour: protege
              ? `Oui : plus la rupture possible est longue, plus la protection vaut. Le surcoût, ${eur(k.partage.surcout)}, est le même ; la perte évitée double.`
              : "Non : le partage ne protège plus.",
          },
          {
            texte: "Partager ne sert plus : au-delà d'un mois, les deux fournisseurs seraient touchés de la même façon",
            juste: !protege,
            retour: protege ? "Non : le second fournisseur n'est pas dans l'usine touchée ; il continue de livrer sa part." : "Oui : le partage ne protège plus.",
          },
          {
            texte: "Mieux vaut tout acheter au second fournisseur, puisque le premier est menacé",
            juste: false,
            retour: "Non : la dépendance changerait seulement de fournisseur, et chaque jeu coûterait plus cher. Le partage protège des deux arrêts.",
          },
        ];
      },
    },
  ],
};

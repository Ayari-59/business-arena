import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_L_OFFRE, ETUDE_DES_CLUBS, PACK_SALLE, PRIX_REDUIT, packAuPrix } from "../../monde/offre-et-modele-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « UNE OFFRE POUR UN BESOIN » : LE PACK À 390 € ? (Bac STMG, enseignement commun
 * de terminale, palier 1).
 *
 * Le chapitre chiffrait le pack à 450 € ; le cas demande s'il crée plus de valeur à 390 €, quand l'étude
 * dit que plus de clubs l'achèteraient. Hypothèses : monde/offre-et-modele-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const lePackA390 = () => ({ cher: packAuPrix(PACK_SALLE.prix, ETUDE_DES_CLUBS.interesses), reduit: packAuPrix(PRIX_REDUIT.prix, PRIX_REDUIT.interesses) });

export const LE_PACK_A_390_EUROS: Situation = {
  code: "le-pack-a-390-euros",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["une-offre-pour-un-besoin"],
  commanditaire: "Le président",
  titre: "Le pack à 390 € ?",
  accroche: "L'étude demandait aussi un prix plus bas : plus de clubs achèteraient. Le pack créerait-il plus de valeur à 390 € ?",
  objectifs: ["Estimer un marché à partir d'une étude", "Comparer la valeur ajoutée de deux prix", "Répondre au président, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_L_OFFRE, pourquoi: "le cas reprend l'étude des clubs et le pack de NOVA." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => [
        `« L'étude demandait aussi le prix de ${eur(PRIX_REDUIT.prix)} : à ce prix, ${qte(PRIX_REDUIT.interesses)} répondants sur ${qte(ETUDE_DES_CLUBS.reponses)} achèteraient, contre ${qte(ETUDE_DES_CLUBS.interesses)} à ${eur(PACK_SALLE.prix)}. Les consommations d'un pack restent de ${eur(PACK_SALLE.consommations)}. Quel prix crée le plus de valeur ? » Le président`,
        "Pas de cours cette fois : les calculs sont ceux du chapitre.",
      ],
      repere: () => "À rendre : les clubs acheteurs et la valeur ajoutée à chaque prix, et votre réponse.",
    },
    {
      id: "a-450",
      type: "montants",
      titre: `Le pack à ${eur(PACK_SALLE.prix)}`,
      question: () => `Sur les ${qte(ETUDE_DES_CLUBS.clubsDeLaZone)} clubs de la zone, calculez les clubs acheteurs à ${eur(PACK_SALLE.prix)}, puis la valeur ajoutée.`,
      champs: () => {
        const { cher } = lePackA390();
        return [
          { libelle: "Clubs acheteurs", attendu: cher.clubs, calcul: `${qte(ETUDE_DES_CLUBS.clubsDeLaZone)} × ${qte(ETUDE_DES_CLUBS.interesses)} ÷ ${qte(ETUDE_DES_CLUBS.reponses)} = ${qte(cher.clubs)}`, tolerance: 0 },
          { libelle: "Valeur ajoutée", attendu: cher.valeurAjoutee, calcul: `${qte(cher.clubs)} × (${eur(PACK_SALLE.prix)} − ${eur(PACK_SALLE.consommations)}) = ${eur(cher.valeurAjoutee)}` },
        ];
      },
      explication: () => [`À ${eur(PACK_SALLE.prix)}, le pack ajoute ${eur(lePackA390().cher.valeurAjoutee)}.`],
    },
    {
      id: "a-390",
      type: "montants",
      titre: `Le pack à ${eur(PRIX_REDUIT.prix)}`,
      question: () => `Même calcul à ${eur(PRIX_REDUIT.prix)}.`,
      champs: () => {
        const { reduit } = lePackA390();
        return [
          { libelle: "Clubs acheteurs", attendu: reduit.clubs, calcul: `${qte(ETUDE_DES_CLUBS.clubsDeLaZone)} × ${qte(PRIX_REDUIT.interesses)} ÷ ${qte(ETUDE_DES_CLUBS.reponses)} = ${qte(reduit.clubs)}`, tolerance: 0 },
          { libelle: "Valeur ajoutée", attendu: reduit.valeurAjoutee, calcul: `${qte(reduit.clubs)} × (${eur(PRIX_REDUIT.prix)} − ${eur(PACK_SALLE.consommations)}) = ${eur(reduit.valeurAjoutee)}` },
        ];
      },
      explication: () => {
        const { cher, reduit } = lePackA390();
        return [`À ${eur(PRIX_REDUIT.prix)}, le pack ajoute ${eur(reduit.valeurAjoutee)}, soit ${eur(reduit.valeurAjoutee - cher.valeurAjoutee)} de plus.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const { cher, reduit } = lePackA390();
        const plus = reduit.valeurAjoutee > cher.valeurAjoutee;
        return [
          {
            texte: plus ? `${eur(PRIX_REDUIT.prix)} : ${qte(reduit.clubs)} clubs ajoutent plus de valeur` : `${eur(PACK_SALLE.prix)} : la marge par pack compte plus`,
            juste: true,
            retour: `Oui : ${eur(reduit.valeurAjoutee)} à ${eur(PRIX_REDUIT.prix)} contre ${eur(cher.valeurAjoutee)} à ${eur(PACK_SALLE.prix)}. Le prix plus bas ouvre l'offre à plus de clubs ; c'est une estimation, que les ventes réelles confirmeront.`,
          },
          {
            texte: plus ? `${eur(PACK_SALLE.prix)}, parce qu'un prix plus haut crée toujours plus de valeur` : `${eur(PRIX_REDUIT.prix)}, parce qu'un prix plus bas crée toujours plus de valeur`,
            juste: false,
            retour: "Non : la valeur ajoutée dépend du prix et du nombre de packs vendus. Il faut les deux calculs pour trancher.",
          },
          {
            texte: "Aucun des deux : l'étude ne dit rien du prix que les clubs accepteraient",
            juste: false,
            retour: "Non : l'étude a justement posé la question des deux prix aux mêmes clubs.",
          },
        ];
      },
    },
  ],
};

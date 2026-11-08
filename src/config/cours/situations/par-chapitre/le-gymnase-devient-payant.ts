import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DES_ORGANISATIONS } from "../../chapitres/la-diversite-des-organisations";
import { HAUT_VERDASSE_HANDBALL } from "../../monde/haut-verdasse-handball";
import { excedentDuClubAuTarif, organisationsComparees } from "../../monde/organisations-comparees";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « QUI POSSÈDE, QUI DIRIGE, QUI CONTRÔLE ? » : LE GYMNASE DEVIENT PAYANT
 * (Bac STMG, SGN et management de première, palier 1).
 *
 * Pour boucler son budget, la communauté de communes envisage de louer le gymnase au club, 12 € l'heure
 * (hypothèse du cas, sous les 25 € qu'elle demande aux autres). Le trésorier du club demande ce que cela
 * changerait : l'excédent de la saison devient-il un déficit, et de combien faudrait-il monter la
 * cotisation de chaque adhérent pour le couvrir ? Les calculs sont ceux du chapitre (l'excédent du club,
 * la location au tarif horaire), sur la fiche du club.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const auCentimeSuperieur = (x: number) => Math.ceil(Math.round(x * 1e6) / 1e4) / 100;

/** Le tarif horaire que la communauté envisage (hypothèse du cas). */
export const TARIF_ENVISAGE = 12;

export function gymnasePayant() {
  const k = organisationsComparees();
  const adherents = HAUT_VERDASSE_HANDBALL.categories.reduce((n, x) => n + x.adherents, 0);
  const location = TARIF_ENVISAGE * k.club.heuresDeGymnase;
  const excedent = excedentDuClubAuTarif(TARIF_ENVISAGE);
  const deficit = Math.max(0, -excedent);
  return { location, excedent, deficit, adherents, hausseParAdherent: auCentimeSuperieur(deficit / adherents), heures: k.club.heuresDeGymnase, avant: k.club.excedent };
}

export const LE_GYMNASE_DEVIENT_PAYANT: Situation = {
  code: "le-gymnase-devient-payant",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["la-diversite-des-organisations"],
  commanditaire: "Le trésorier du club",
  titre: "Le gymnase devient payant ?",
  accroche: "La communauté de communes envisage de louer son gymnase au club de handball, qu'elle lui prêtait. Le club peut-il payer, et à quel prix pour ses adhérents ?",
  objectifs: ["Chiffrer ce que coûte au club la fin d'un soutien en nature", "Calculer la hausse de cotisation qui couvrirait le déficit", "Répondre au trésorier, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_ORGANISATIONS,
    pourquoi: "le cas reprend les budgets du club et de la communauté que le chapitre compare à NOVA.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du trésorier",
      texte: () => {
        const k = gymnasePayant();
        return [
          `« La communauté nous écrit qu'elle pourrait nous louer le gymnase ${eur(TARIF_ENVISAGE)} l'heure, pour nos ${qte(k.heures)} heures de la saison. Notre excédent est de ${eur(k.avant)}. Pouvons-nous payer ? Sinon, de combien faudrait-il monter la cotisation de chacun de nos ${qte(k.adherents)} adhérents ? » Le trésorier`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre.",
        ];
      },
      repere: () => "À rendre : la location de la saison, l'excédent ou le déficit qui en resterait, la hausse par adhérent, et votre réponse.",
    },
    {
      id: "les-calculs",
      type: "montants",
      titre: "La location et ce qu'il reste",
      question: () => "Calculez la location de la saison, ce qu'il resterait de l'excédent (négatif s'il devient un déficit), et la hausse de cotisation par adhérent qui couvrirait ce déficit, au centime supérieur.",
      champs: () => {
        const k = gymnasePayant();
        return [
          { libelle: "Location de la saison", attendu: k.location, calcul: `${qte(k.heures)} h × ${eur(TARIF_ENVISAGE)} = ${eur(k.location)}` },
          { libelle: "Excédent, gymnase loué", attendu: k.excedent, calcul: `${eur(k.avant)} − ${eur(k.location)} = ${eur(k.excedent)}` },
          { libelle: "Hausse de cotisation par adhérent", attendu: k.hausseParAdherent, calcul: `${eur(k.deficit)} ÷ ${qte(k.adherents)} = ${eur(k.hausseParAdherent)}, au centime supérieur` },
        ];
      },
      explication: () => {
        const k = gymnasePayant();
        return [`La location coûterait ${eur(k.location)}, plus que l'excédent : le club finirait la saison avec ${eur(k.excedent)}. Il suffirait de ${eur(k.hausseParAdherent)} de plus par adhérent pour l'éviter.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au trésorier",
      question: () => "Que répondez-vous au trésorier ?",
      options: () => {
        const k = gymnasePayant();
        const deficit = k.excedent < 0;
        return [
          {
            texte: `Le club serait en déficit de ${eur(k.deficit)} : ${eur(k.hausseParAdherent)} de plus par adhérent le couvre`,
            juste: deficit,
            retour: deficit
              ? `Oui : la location dépasse l'excédent de ${eur(k.deficit)}. Une petite hausse de la cotisation suffit, mais le club perd son coussin pour le matériel : c'est ce que le prêt du gymnase lui apportait.`
              : "Non : l'excédent paie la location.",
          },
          {
            texte: "Le club peut payer sans rien changer : il dégage un excédent chaque saison et le garde en réserve pour plus tard",
            juste: !deficit,
            retour: deficit ? `Non : l'excédent, ${eur(k.avant)}, est plus petit que la location, ${eur(k.location)}.` : "Oui : l'excédent paie la location.",
          },
          {
            texte: "Le club doit verser l'excédent aux adhérents avant que la communauté ne le prenne pour la location",
            juste: false,
            retour: "Non : une association ne partage jamais son excédent entre ses membres. Et la location se paie avec les recettes de la saison.",
          },
        ];
      },
    },
  ],
};

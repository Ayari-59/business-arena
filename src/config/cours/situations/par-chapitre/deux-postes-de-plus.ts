import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DU_PROCESSUS } from "../../chapitres/le-processus-et-le-pgi";
import { COUT_HORAIRE_DE_NOVA, PGI_EN_NUAGE, PGI_POUR_TOUTE_L_EQUIPE, economieDuPgi } from "../../monde/processus-de-commande";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE PROCESSUS ET LE PGI » : DEUX POSTES DE PLUS (Bac STMG, SGN de première,
 * palier 1).
 *
 * Le président veut ouvrir le PGI à 6 postes au lieu de 4. Avec les 40 commandes que NOVA traite chaque
 * mois (PGI_POUR_TOUTE_L_EQUIPE, monde/processus-de-commande.ts), le temps de ressaisie gagné paie-t-il
 * encore l'abonnement ? Les calculs sont ceux du chapitre.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const deuxPostesDePlus = () => economieDuPgi(PGI_POUR_TOUTE_L_EQUIPE.commandesParMois, PGI_POUR_TOUTE_L_EQUIPE.postes);

export const DEUX_POSTES_DE_PLUS: Situation = {
  code: "deux-postes-de-plus",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["le-processus-et-le-pgi"],
  commanditaire: "Le président",
  titre: "Deux postes de plus ?",
  accroche: "Le président veut ouvrir le PGI à toute l'équipe, l'expédition et lui-même compris. Le temps gagné paie-t-il encore l'abonnement ?",
  objectifs: ["Chiffrer le temps qu'un PGI fait gagner", "Comparer ce gain à l'abonnement", "Répondre au président, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_PROCESSUS,
    pourquoi: "le cas reprend le processus de commande de NOVA et le PGI du chapitre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => [
        `« Je voudrais que l'expédition et moi ayons aussi le PGI : ${qte(PGI_POUR_TOUTE_L_EQUIPE.postes)} postes à ${eur(PGI_EN_NUAGE.parPosteEtParMois)} par mois. Nous traitons ${qte(PGI_POUR_TOUTE_L_EQUIPE.commandesParMois)} commandes par mois. Le temps gagné paie-t-il encore l'abonnement ? » Le président`,
        "Pas de cours cette fois : les calculs sont ceux du chapitre.",
      ],
      repere: () => "À rendre : le temps de ressaisie gagné, l'abonnement à 6 postes, ce qu'il reste, et votre réponse.",
    },
    {
      id: "les-calculs",
      type: "montants",
      titre: "Le temps gagné et l'abonnement",
      question: () => `Chaque commande sans PGI demande une heure de ressaisie, à ${eur(COUT_HORAIRE_DE_NOVA)}. Calculez le temps gagné dans le mois, l'abonnement à ${qte(PGI_POUR_TOUTE_L_EQUIPE.postes)} postes, et ce que le PGI fait gagner.`,
      champs: () => {
        const k = deuxPostesDePlus();
        return [
          { libelle: "Temps de ressaisie gagné", attendu: k.temps, calcul: `${qte(k.commandes)} × 1 h × ${eur(COUT_HORAIRE_DE_NOVA)} = ${eur(k.temps)}` },
          { libelle: "Abonnement à 6 postes", attendu: k.abonnement, calcul: `${qte(k.postes)} × ${eur(PGI_EN_NUAGE.parPosteEtParMois)} = ${eur(k.abonnement)}` },
          { libelle: "Ce que le PGI fait gagner", attendu: k.gain, calcul: `${eur(k.temps)} − ${eur(k.abonnement)} = ${eur(k.gain)}` },
        ];
      },
      explication: () => {
        const k = deuxPostesDePlus();
        return [`Même à ${qte(k.postes)} postes, le temps gagné dépasse l'abonnement de ${eur(k.gain)} par mois.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const k = deuxPostesDePlus();
        const paie = k.gain > 0;
        return [
          {
            texte: `Oui : il reste ${eur(k.gain)} par mois, une fois l'abonnement payé`,
            juste: paie,
            retour: paie ? `Oui : ${eur(k.temps)} de temps gagné pour ${eur(k.abonnement)} d'abonnement. Et l'expédition voit les commandes sans attendre qu'on les lui transmette.` : "Non : l'abonnement coûte plus que le temps gagné.",
          },
          {
            texte: `Non : ${eur(k.abonnement)} par mois, c'est plus cher que les trois outils d'aujourd'hui, qui sont déjà payés`,
            juste: !paie,
            retour: paie ? `Non : les outils d'aujourd'hui coûtent en temps de ressaisie, ${eur(k.temps)} par mois.` : "Oui : le temps gagné ne paie pas l'abonnement.",
          },
          {
            texte: "Non : le PGI n'apporte rien à l'expédition, qui ne saisit aucune commande",
            juste: false,
            retour: "Non : l'expédition lit les commandes à préparer ; dans une base unique, elle les voit dès leur saisie. Et le calcul porte sur toute l'équipe.",
          },
        ];
      },
    },
  ],
};

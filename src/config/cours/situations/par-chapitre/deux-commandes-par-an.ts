import { eur, nombreAuCentieme, pct as pourcent } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_L_APPROVISIONNEMENT } from "../../chapitres/approvisionner-au-moindre-cout";
import { COUT_DE_PASSATION, POSSESSION, PRIX_DU_JEU, TARIF_DEGRESSIF, coutTotalDApprovisionnement, tableauDesTranches, type TrancheDuTarif } from "../../monde/approvisionnement-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « APPROVISIONNER AU MOINDRE COÛT » : DEUX COMMANDES PAR AN (contrôle de
 * gestion, palier 4).
 *
 * Le commercial d'Électro-Composants propose une remise de 2 % à qui commande 13 000 jeux à la fois,
 * deux commandes par an. L'élève refait le coût total d'approvisionnement de l'offre, sans cours :
 * le prix remisé, le coût de possession à ce prix, l'achat, la gestion d'un stock moyen de 6 500
 * jeux, puis la compare aux 10 commandes de 2 600 jeux que le chapitre a retenues. La remise ne paie
 * pas la possession : la réponse est de refuser.
 *
 * HYPOTHÈSE DU CAS : l'offre ajoute une tranche au tarif, 2 % de remise dès 13 000 jeux par commande
 * (OFFRE_DU_COMMERCIAL) ; le reste du tarif ne change pas.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : le coût de possession d'un jeu, un montant, se donne au
 * centime (au millième, avant) ; les quantités et les coûts en repartent.
 */

/** L'offre du commercial : 2 % de remise dès 13 000 jeux par commande. */
export const OFFRE_DU_COMMERCIAL = { des: 13_000, remise: 0.02 } as const;

/** Le tarif avec l'offre : une tranche de plus. */
export const TARIF_AVEC_L_OFFRE: readonly TrancheDuTarif[] = [...TARIF_DEGRESSIF, { des: OFFRE_DU_COMMERCIAL.des, prix: Math.round(PRIX_DU_JEU * (1 - OFFRE_DU_COMMERCIAL.remise) * 100) / 100, remise: OFFRE_DU_COMMERCIAL.remise }];

const qte = nombreAuCentieme;
const pct = (p: number) => pourcent(p * 100);

/** Les chiffres du cas. */
export function deuxCommandes(_c?: Pick<Cas, "code">) {
  const retenue = tableauDesTranches().meilleure;
  const offre = coutTotalDApprovisionnement(OFFRE_DU_COMMERCIAL.des, TARIF_AVEC_L_OFFRE);
  const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
  return { retenue, offre, ecart: auCentime(offre.totalDApprovisionnement - retenue.totalDApprovisionnement), remiseGagnee: auCentime(retenue.achat - offre.achat), gestionEnPlus: auCentime(offre.total - retenue.total) };
}

export const DEUX_COMMANDES_PAR_AN: Situation = {
  code: "deux-commandes-par-an",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["approvisionner-au-moindre-cout"],
  commanditaire: "Le commercial d'Électro-Composants",
  titre: "Deux commandes par an",
  accroche: "Électro-Composants offre 2 % de remise à qui commande 13 000 jeux à la fois. NOVA doit-elle passer à deux commandes par an ?",
  objectifs: [
    "Calculer le coût de possession d'un jeu à un prix remisé",
    "Calculer le coût total d'approvisionnement d'une offre",
    "Comparer l'offre à la politique d'achat retenue",
    "Répondre au fournisseur avec un écart chiffré",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_APPROVISIONNEMENT,
    pourquoi: "ce cas reprend le chapitre « Approvisionner au moindre coût », qui se calcule sur les jeux de composants de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "L'offre du commercial",
      texte: () => {
        const { retenue } = deuxCommandes();
        return [
          `« Commandez ${qte(OFFRE_DU_COMMERCIAL.des)} jeux à la fois, deux fois par an, et je vous fais ${pct(OFFRE_DU_COMMERCIAL.remise)} sur tout : vous ne paierez plus le jeu que ${eur(TARIF_AVEC_L_OFFRE.at(-1)!.prix)}. »`,
          `Aujourd'hui, NOVA passe ${qte(retenue.commandes)} commandes de ${qte(retenue.retenue)} jeux, à ${eur(retenue.prix)}. Pas de cours cette fois : vous avez le coût de passation et le coût de possession.`,
        ];
      },
      tableau: () => {
        const { retenue } = deuxCommandes();
        return {
          titre: "Ce que NOVA sait de ses achats de jeux",
          colonnes: ["Donnée"],
          lignes: [
            { libelle: "Jeux consommés en N + 1", valeurs: [qte(retenue.D)] },
            { libelle: "Coût de passation d'une commande", valeurs: [eur(COUT_DE_PASSATION)] },
            { libelle: "Coût de possession d'un jeu par an", valeurs: [`${pct(POSSESSION.taux)} du prix + ${eur(POSSESSION.physiqueParJeu)}`] },
            { libelle: "Politique retenue", valeurs: [`${qte(retenue.commandes)} commandes de ${qte(retenue.retenue)} jeux à ${eur(retenue.prix)}`] },
            { libelle: "Coût total d'approvisionnement retenu", valeurs: [eur(retenue.totalDApprovisionnement)] },
          ],
        };
      },
      repere: () => "À rendre : le coût total d'approvisionnement de l'offre, son écart avec la politique retenue, et votre réponse.",
    },
    {
      id: "le-cout-de-l-offre",
      type: "montants",
      titre: "Le coût de l'offre",
      notions: ["stock"],
      question: () => "Calculez, pour l'offre : le coût de possession d'un jeu par an à son prix, l'achat de l'année, la gestion du stock (passation et possession) et le coût total d'approvisionnement.",
      champs: () => {
        const { offre } = deuxCommandes();
        return [
          { libelle: "Coût de possession d'un jeu par an", attendu: offre.cs, calcul: `${pct(POSSESSION.taux)} × ${eur(offre.prix)} + ${eur(POSSESSION.physiqueParJeu)} = ${eur(offre.cs)}` },
          { libelle: "Achat de l'année", attendu: offre.achat, calcul: `${qte(offre.D)} × ${eur(offre.prix)} = ${eur(offre.achat)}` },
          { libelle: "Gestion du stock", attendu: offre.total, calcul: `${qte(offre.commandes)} × ${eur(COUT_DE_PASSATION)} + ${qte(offre.stockMoyen)} × ${eur(offre.cs)} = ${eur(offre.total)}` },
          { libelle: "Coût total d'approvisionnement", attendu: offre.totalDApprovisionnement, calcul: `${eur(offre.achat)} + ${eur(offre.total)} = ${eur(offre.totalDApprovisionnement)}` },
        ];
      },
      explication: () => {
        const { offre } = deuxCommandes();
        return [`Avec deux commandes par an, le stock moyen monte à ${qte(offre.stockMoyen)} jeux : sa possession coûte ${eur(offre.possession)} par an.`];
      },
    },
    {
      id: "face-a-la-politique-retenue",
      type: "montants",
      titre: "Face à la politique retenue",
      notions: ["stock"],
      question: () => "Calculez ce que la remise fait gagner sur l'achat de l'année, la gestion du stock qu'elle ajoute, et l'écart de coût total avec la politique retenue.",
      champs: () => {
        const x = deuxCommandes();
        return [
          { libelle: "Gagné sur l'achat", attendu: x.remiseGagnee, calcul: `${eur(x.retenue.achat)} − ${eur(x.offre.achat)} = ${eur(x.remiseGagnee)}` },
          { libelle: "Gestion du stock en plus", attendu: x.gestionEnPlus, calcul: `${eur(x.offre.total)} − ${eur(x.retenue.total)} = ${eur(x.gestionEnPlus)}` },
          { libelle: "Écart de coût total (l'offre moins la politique retenue)", attendu: x.ecart, calcul: `${eur(x.offre.totalDApprovisionnement)} − ${eur(x.retenue.totalDApprovisionnement)} = ${eur(x.ecart)}` },
        ];
      },
      explication: () => {
        const x = deuxCommandes();
        return [`La remise rapporte ${eur(x.remiseGagnee)}, mais le gros stock en coûte ${eur(x.gestionEnPlus)} : l'offre coûterait ${eur(x.ecart)} de plus par an.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au commercial",
      notions: ["stock"],
      question: () => "Que répondez-vous au commercial ?",
      options: () => {
        const x = deuxCommandes();
        return [
          { texte: `Refuser : l'offre coûte ${eur(x.ecart)} de plus par an`, juste: true, retour: `Oui. La remise de ${pct(OFFRE_DU_COMMERCIAL.remise)} porte sur tout l'achat, mais elle ne paie pas la possession d'un stock moyen de ${qte(x.offre.stockMoyen)} jeux. NOVA garde ses ${qte(x.retenue.commandes)} commandes de ${qte(x.retenue.retenue)} jeux.` },
          { texte: `Accepter : ${eur(x.remiseGagnee)} de remise sur l'achat de l'année`, juste: false, retour: `Non : la remise se voit sur la facture, la possession non. Le coût total, lui, monte de ${eur(x.ecart)}.` },
          { texte: "Accepter : deux commandes par an, c'est moins de travail de passation", juste: false, retour: `Non : la passation baisse de ${eur(x.retenue.passation - x.offre.passation)}, mais la possession monte bien plus.` },
          { texte: "Refuser : la remise ne joue pas, seul le modèle de Wilson compte", juste: false, retour: "Non : la remise compte, et beaucoup. C'est le coût total d'approvisionnement qui tranche, achat compris." },
        ];
      },
    },
  ],
};

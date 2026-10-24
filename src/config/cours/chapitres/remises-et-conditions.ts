import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { JOURS_D_ESCOMPTE, JOURS_PAR_AN, TAUX_DE_REMISE, TAUX_D_ESCOMPTE } from "../remises";
import type { Chapitre } from "../types";
import { NEGOCIATIONS, negociation } from "./negocier-le-prix";

/**
 * CHAPITRE : REMISES ET CONDITIONS, LA RENTABILITÉ D'UNE AFFAIRE (BTS NDRC, palier 2).
 *
 * Une affaire ne se juge pas à son prix catalogue : la remise consentie, l'escompte offert pour
 * un paiement rapide, le délai accordé au client, chacun prend sa part de la marge. Le chapitre
 * construit la facture d'une affaire, en calcule la marge, chiffre ce que coûte le crédit
 * accordé au client, compare l'escompte à l'emprunt, et cherche le volume qui paie une remise.
 *
 * Les chiffres sont ceux de l'arène : la commande, le prix et le délai du client que le cas
 * facture à échéance, le coût variable du mois, le taux de l'emprunt de l'entreprise. La remise
 * et l'escompte sont les conditions du chapitre « Remises et règlements » (`remises.ts`), que
 * l'arène ne négocie pas.
 */

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** L'affaire, de la facture à sa rentabilité. */
export function affaire(c: Cas) {
  const n = negociation(c);
  const v = c.venteCredit;
  const brut = auCentime(v.quantite * v.prixUnitaire);
  const remise = auCentime(brut * TAUX_DE_REMISE);
  const netCommercial = auCentime(brut - remise);
  const escompte = auCentime(netCommercial * TAUX_D_ESCOMPTE);
  const netFinancier = auCentime(netCommercial - escompte);
  const coutsVariables = auCentime(v.quantite * n.coutVariable);
  const marge = auCentime(netCommercial - coutsVariables);
  const margeSansRemise = auCentime(brut - coutsVariables);
  // Le crédit client : le net commercial attend `delai` jours, financé au taux de l'emprunt. Hors taxes : sur une
  // prestation de services ou des travaux, la TVA n'est due à l'État qu'une fois le client payé.
  const coutDuCredit = auCentime((netCommercial * c.pret.tauxAnnuel * v.delai) / JOURS_PAR_AN);
  const resultatDeLAffaire = auCentime(marge - coutDuCredit);
  // L'escompte rapporté au crédit qu'il évite : 2 % pour (délai − 10) jours d'avance, en taux annuel.
  const tauxAnnuelDeLEscompte = auDixieme((TAUX_D_ESCOMPTE / (1 - TAUX_D_ESCOMPTE)) * (JOURS_PAR_AN / (v.delai - JOURS_D_ESCOMPTE)) * 100);
  // Le volume qui paie la remise : la même marge sur coût variable qu'au prix catalogue.
  const prixRemise = auCentime(v.prixUnitaire * (1 - TAUX_DE_REMISE));
  const quantitePourLaMemeMarge = Math.ceil(margeSansRemise / (prixRemise - n.coutVariable) - 1e-9);
  return {
    client: v.client,
    quantite: v.quantite,
    prix: v.prixUnitaire,
    delai: v.delai,
    brut,
    tauxDeRemise: TAUX_DE_REMISE * 100,
    remise,
    netCommercial,
    tauxDEscompte: TAUX_D_ESCOMPTE * 100,
    joursDEscompte: JOURS_D_ESCOMPTE,
    escompte,
    netFinancier,
    coutVariable: n.coutVariable,
    coutsVariables,
    marge,
    margeSansRemise,
    margeCedee: auCentime(margeSansRemise - marge),
    partDeLaMargeCedee: auDixieme(((margeSansRemise - marge) / margeSansRemise) * 100),
    tauxDeLEmprunt: auDixieme(c.pret.tauxAnnuel * 100),
    coutDuCredit,
    resultatDeLAffaire,
    tauxAnnuelDeLEscompte,
    prixRemise,
    quantitePourLaMemeMarge,
    enPlus: quantitePourLaMemeMarge - v.quantite,
  };
}

export const REMISES_ET_CONDITIONS: Chapitre = {
  code: "remises-et-conditions",
  parcours: "ndrc",
  palier: 2,
  blocs: [
    "BTS NDRC Bloc 1 · Relation client et négociation-vente",
  ],
  titre: "Remises et conditions : la rentabilité d'une affaire",
  accroche:
    "Une remise, un escompte, un délai de paiement : chaque concession prend sa part de la marge. Ce que l'affaire rapporte vraiment, et ce qu'il faut obtenir en échange.",
  objectifs: [
    "Établir la facture d'une affaire : remise, net commercial, escompte, net financier",
    "Calculer la marge d'une affaire et la part qu'une remise en coûte",
    "Chiffrer le coût d'un délai de paiement accordé au client",
    "Comparer le coût d'un escompte à celui d'un emprunt",
    "Calculer le volume qui paie une remise",
  ],
  libre: false,
  entreprises: {
    codes: NEGOCIATIONS,
    pourquoi: "ce chapitre suit une affaire négociée avec un client professionnel, qui paie à échéance.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une affaire, et ses conditions",
      notions: ["payment_terms"],
      texte: (c) => {
        const a = affaire(c);
        return [
          `${majuscule(a.client)} commande ${qte(a.quantite)} ${c.unites} à ${c.entreprise}, au prix catalogue de ${eur(a.prix)} hors taxes. Pour signer, le commercial a accordé ${pct(a.tauxDeRemise)} de remise sur la commande, et ${pct(a.tauxDEscompte)} d'escompte si le client paie sous ${qte(a.joursDEscompte)} jours ; sinon, il paie à ${qte(a.delai)} jours.`,
          "Chaque condition prend sa part de la marge : la remise tout de suite, l'escompte si le client paie vite, le délai s'il paie tard, parce qu'il faut financer la facture en attendant.",
        ];
      },
      repere: () => "Net commercial = brut − remise. Net financier = net commercial − escompte. La TVA se calcule sur le net.",
    },
    {
      id: "facture",
      type: "montants",
      titre: "La facture de l'affaire",
      question: (c) => {
        const a = affaire(c);
        return `Établissez la facture : le montant brut (${qte(a.quantite)} × ${eur(a.prix)}), la remise de ${pct(a.tauxDeRemise)}, le net commercial, l'escompte de ${pct(a.tauxDEscompte)} s'il paie sous ${qte(a.joursDEscompte)} jours, et le net financier.`;
      },
      champs: (c) => {
        const a = affaire(c);
        return [
          { libelle: "Montant brut", attendu: a.brut, calcul: `${qte(a.quantite)} × ${eur(a.prix)} = ${eur(a.brut)}` },
          { libelle: "Remise", attendu: a.remise, calcul: `${eur(a.brut)} × ${pct(a.tauxDeRemise)} = ${eur(a.remise)}` },
          { libelle: "Net commercial", attendu: a.netCommercial, calcul: `${eur(a.brut)} − ${eur(a.remise)} = ${eur(a.netCommercial)}` },
          { libelle: "Escompte", attendu: a.escompte, calcul: `${eur(a.netCommercial)} × ${pct(a.tauxDEscompte)} = ${eur(a.escompte)}` },
          { libelle: "Net financier", attendu: a.netFinancier, calcul: `${eur(a.netCommercial)} − ${eur(a.escompte)} = ${eur(a.netFinancier)}` },
        ];
      },
      explication: (c) => {
        const a = affaire(c);
        return [
          `La remise se calcule sur le brut, l'escompte sur le net commercial : les réductions s'enchaînent, elles ne s'additionnent pas. Si le client paie vite, ${c.entreprise} encaisse ${eur(a.netFinancier)} hors taxes au lieu des ${eur(a.brut)} du prix catalogue.`,
        ];
      },
    },
    {
      id: "marge",
      type: "montants",
      titre: "Ce que la remise coûte",
      notions: ["contribution_margin"],
      question: (c) => {
        const a = affaire(c);
        return `Chaque ${c.unite} coûte ${eur(a.coutVariable)} de coûts variables. Calculez la marge sur coût variable de l'affaire au prix catalogue, puis après la remise, et la part de la marge que coûte la remise, au dixième.`;
      },
      champs: (c) => {
        const a = affaire(c);
        return [
          { libelle: "Marge au prix catalogue", attendu: a.margeSansRemise, calcul: `${eur(a.brut)} − ${qte(a.quantite)} × ${eur(a.coutVariable)} = ${eur(a.margeSansRemise)}` },
          { libelle: "Marge après remise", attendu: a.marge, calcul: `${eur(a.netCommercial)} − ${eur(a.coutsVariables)} = ${eur(a.marge)}` },
          { libelle: "Part de la marge cédée (%)", attendu: a.partDeLaMargeCedee, calcul: `${eur(a.margeCedee)} ÷ ${eur(a.margeSansRemise)} × 100 = ${pct(a.partDeLaMargeCedee)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const a = affaire(c);
        return [
          `Une remise de ${pct(a.tauxDeRemise)} du prix coûte ${pct(a.partDeLaMargeCedee)} de la marge : la remise se prend sur le prix entier, mais elle sort tout entière de la marge, puisque les coûts, eux, ne baissent pas.`,
        ];
      },
    },
    {
      id: "credit",
      type: "montants",
      titre: "Ce que coûte le délai de paiement",
      notions: ["payment_terms"],
      question: (c) => {
        const a = affaire(c);
        return `Si le client paie à ${qte(a.delai)} jours, ${c.entreprise} attend le net commercial de ${eur(a.netCommercial)} et finance cette attente au taux de son emprunt, ${pct(a.tauxDeLEmprunt)} par an. Calculez le coût du crédit accordé (sur une année de 360 jours), puis le résultat de l'affaire : la marge après remise moins ce coût.`;
      },
      champs: (c) => {
        const a = affaire(c);
        return [
          { libelle: "Coût du crédit client", attendu: a.coutDuCredit, calcul: `${eur(a.netCommercial)} × ${pct(a.tauxDeLEmprunt)} × ${qte(a.delai)} ÷ 360 = ${eur(a.coutDuCredit)}`, tolerance: 1 },
          { libelle: "Résultat de l'affaire", attendu: a.resultatDeLAffaire, calcul: `${eur(a.marge)} − ${eur(a.coutDuCredit)} = ${eur(a.resultatDeLAffaire)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const a = affaire(c);
        return [
          `Pendant ${qte(a.delai)} jours, ${c.entreprise} prête ${eur(a.netCommercial)} à son client, et ce prêt lui coûte ${eur(a.coutDuCredit)}, qu'aucune facture ne montre. La TVA, elle, n'entre pas dans le calcul : sur une prestation de services ou des travaux, elle n'est due à l'État qu'une fois le client payé.`,
        ];
      },
    },
    {
      id: "escompte",
      type: "choix",
      titre: "L'escompte ou l'emprunt",
      notions: ["payment_terms", "discounting"],
      question: (c) => {
        const a = affaire(c);
        return `Céder ${pct(a.tauxDEscompte)} pour être payé à ${qte(a.joursDEscompte)} jours au lieu de ${qte(a.delai)} revient à emprunter à ${pct(a.tauxAnnuelDeLEscompte)} par an. ${c.entreprise} emprunte à ${pct(a.tauxDeLEmprunt)}. L'escompte est-il une bonne affaire pour elle ?`;
      },
      options: (c) => {
        const a = affaire(c);
        const cher = a.tauxAnnuelDeLEscompte > a.tauxDeLEmprunt;
        return [
          {
            texte: "Non : il lui coûte plus cher que son emprunt",
            juste: cher,
            retour: cher
              ? `Oui : ${pct(a.tauxAnnuelDeLEscompte)} par an contre ${pct(a.tauxDeLEmprunt)}. L'escompte se justifie quand la trésorerie manque et que le découvert coûte plus cher, ou quand le client risque de payer en retard ; sinon, ${c.entreprise} finance moins cher son attente avec son emprunt.`
              : `Non : ${pct(a.tauxAnnuelDeLEscompte)} par an, c'est moins cher que son emprunt à ${pct(a.tauxDeLEmprunt)}.`,
          },
          {
            texte: "Oui : il lui coûte moins cher que son emprunt",
            juste: !cher,
            retour: cher
              ? `Non : ${pct(a.tauxAnnuelDeLEscompte)} par an, c'est bien plus que les ${pct(a.tauxDeLEmprunt)} de son emprunt.`
              : `Oui : ${pct(a.tauxAnnuelDeLEscompte)} par an, c'est moins que les ${pct(a.tauxDeLEmprunt)} de son emprunt.`,
          },
          {
            texte: "On ne peut pas comparer : l'un est une réduction, l'autre un crédit",
            juste: false,
            retour: `Si : l'escompte achète ${qte(a.delai - a.joursDEscompte)} jours d'avance sur l'encaissement, comme un emprunt les aurait financés. Ramené à l'année, il se compare au taux de l'emprunt.`,
          },
        ];
      },
    },
    {
      id: "contrepartie",
      type: "montants",
      titre: "La contrepartie de la remise",
      notions: ["contribution_margin", "price_floor"],
      question: (c) => {
        const a = affaire(c);
        return `En échange de la remise, le commercial veut une commande plus grosse. À ${eur(a.prixRemise)} l'unité au lieu de ${eur(a.prix)}, combien de ${c.unites} faut-il vendre à ce client pour retrouver la marge du prix catalogue (${eur(a.margeSansRemise)}) ? Arrondissez au-dessus.`;
      },
      champs: (c) => {
        const a = affaire(c);
        return [
          { libelle: "Commande qui paie la remise", attendu: a.quantitePourLaMemeMarge, calcul: `${eur(a.margeSansRemise)} ÷ (${eur(a.prixRemise)} − ${eur(a.coutVariable)}) = ${qte(a.quantitePourLaMemeMarge)} (arrondi au-dessus)`, tolerance: 1 },
          { libelle: "Unités à obtenir en plus", attendu: a.enPlus, calcul: `${qte(a.quantitePourLaMemeMarge)} − ${qte(a.quantite)} = ${qte(a.enPlus)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const a = affaire(c);
        return [
          `Une remise de ${pct(a.tauxDeRemise)} se paie par ${qte(a.enPlus)} ${c.unites} de plus sur la commande. C'est le principe de toute concession en négociation : elle s'échange contre une contrepartie (un volume, un engagement, un paiement plus rapide), elle ne se donne pas.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["payment_terms", "contribution_margin"],
      texte: (c) => {
        const a = affaire(c);
        return [
          `Sur cette affaire, la remise de ${pct(a.tauxDeRemise)} coûte ${eur(a.margeCedee)} de marge, et le délai de ${qte(a.delai)} jours ${eur(a.coutDuCredit)} de crédit : l'affaire rapporte ${eur(a.resultatDeLAffaire)}, et non les ${eur(a.margeSansRemise)} du prix catalogue.`,
          "Une condition commerciale se chiffre avant de se signer, et s'échange contre une contrepartie : un volume, un engagement, un paiement plus rapide.",
        ];
      },
      repere: () => "Coût du crédit client = montant hors taxes attendu × taux annuel × délai ÷ 360. Taux annuel de l'escompte = taux ÷ (1 − taux) × 360 ÷ jours d'avance.",
    },
  ],
};

import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_L_INVENTAIRE, ficheDe } from "../../chapitres/l-inventaire-et-la-demarque";
import { DEGAT_DES_EAUX, degatDesEaux } from "../../monde/inventaire-de-la-boutique";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'INVENTAIRE ET LA DÉMARQUE » : LE DÉGÂT DES EAUX DANS LA RÉSERVE (BTS
 * MCO, palier 3).
 *
 * Une canalisation fuit dans la réserve de MAILLE & CO. La direction veut savoir ce que l'assureur
 * remboursera, ce qui restera à la charge de la boutique, et s'il faut ajouter au contrat la garantie
 * des pertes d'exploitation. Le responsable propose de déclarer le stock perdu au prix de vente.
 * L'élève valorise le stock au coût d'achat (celui de l'inventaire), applique la franchise, chiffre la
 * marge perdue pendant la fermeture et son coût moyen sur l'année, et répond : la garantie coûte plus
 * que la perte moyenne qu'elle couvre, et une fermeture de deux jours reste à la portée de la boutique.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours : ses chiffres sont ceux de
 * `degatDesEaux` (monde/inventaire-de-la-boutique.ts), sur la fiche de la boutique.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");

const sinistreDe = (c: Pick<Cas, "code">) => degatDesEaux(ficheDe(c));

function tableauDuSinistre(c: Pick<Cas, "code">): TableauDeDonnees {
  const s = sinistreDe(c);
  return {
    titre: `${ficheDe(c).entreprise} · les articles perdus dans la réserve`,
    colonnes: ["Quantité", "Coût d'achat", "Prix HT"],
    lignes: s.lignes.map((l) => ({ libelle: l.nom, valeurs: [qte(l.quantite), eur(l.coutDAchat), eur(l.prixHt)] })),
  };
}

export const LE_DEGAT_DES_EAUX_DANS_LA_RESERVE: Situation = {
  code: "le-degat-des-eaux-dans-la-reserve",
  parcours: "mco",
  palier: 3,
  blocs: [],
  reprend: ["l-inventaire-et-la-demarque"],
  commanditaire: "La direction",
  titre: "Le dégât des eaux dans la réserve",
  accroche:
    "Une fuite a noyé une partie de la réserve. Que remboursera l'assureur, que paiera la boutique, et faut-il assurer aussi les jours de fermeture ? Le responsable veut déclarer le stock au prix de vente.",
  objectifs: [
    "Valoriser un stock sinistré à sa valeur d'inventaire",
    "Calculer une indemnité d'assurance après franchise",
    "Chiffrer une perte d'exploitation et son coût moyen sur l'année",
    "Répondre à la direction sur la couverture d'un risque",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_INVENTAIRE,
    pourquoi: "ce cas reprend le chapitre « L'inventaire et la démarque », qui se joue à la boutique du cours, MAILLE & CO, et à son stock.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      tableau: tableauDuSinistre,
      texte: (c) => {
        const s = sinistreDe(c);
        return [
          `« Lundi, une canalisation a fui dans la réserve. Les articles du tableau sont perdus, la remise en état coûtera ${eur(DEGAT_DES_EAUX.remiseEnEtat)}, et nous fermons ${qte(DEGAT_DES_EAUX.joursDeFermeture)} jours pour sécher. Notre contrat B laisse ${eur(s.franchise)} à notre charge par sinistre. »`,
          `« Que remboursera l'assureur ? Le responsable veut déclarer le stock au prix de vente. Et faut-il ajouter la garantie des pertes d'exploitation, ${eur(s.garantie)} par an, qui rembourse la marge perdue pendant une fermeture ? »`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre, à vous d'en trouver l'ordre.",
        ];
      },
      repere: () => "À rendre : le stock perdu à sa valeur d'inventaire, l'indemnité et ce qui reste à payer, la marge perdue pendant la fermeture, et votre avis sur la garantie.",
    },
    {
      id: "l-indemnite",
      type: "montants",
      titre: "Ce que l'assureur rembourse",
      notions: ["stock"],
      question: () =>
        "Valorisez le stock perdu à sa valeur d'inventaire (le coût d'achat), puis le sinistre avec la remise en état, l'indemnité du contrat B une fois la franchise retirée, et ce qui reste à la charge de la boutique.",
      champs: (c) => {
        const s = sinistreDe(c);
        return [
          { libelle: "Stock perdu au coût d'achat", attendu: s.stock, calcul: `${s.lignes.map((l) => `${qte(l.quantite)} × ${eur(l.coutDAchat)}`).join(" + ")} = ${eur(s.stock)}` },
          { libelle: "Montant du sinistre", attendu: s.sinistre, calcul: `${eur(s.stock)} + ${eur(DEGAT_DES_EAUX.remiseEnEtat)} = ${eur(s.sinistre)}` },
          { libelle: "Indemnité de l'assureur", attendu: s.indemnite, calcul: `${eur(s.sinistre)} − ${eur(s.franchise)} = ${eur(s.indemnite)}` },
          { libelle: "Reste à la charge de la boutique", attendu: s.resteAPayer, calcul: `La franchise : ${eur(s.resteAPayer)}` },
        ];
      },
      explication: (c) => {
        const s = sinistreDe(c);
        return [`L'assureur rembourse ${eur(s.indemnite)}. La boutique paie la franchise, ${eur(s.resteAPayer)} : le prix du contrat B, moins cher que le contrat A.`];
      },
    },
    {
      id: "au-prix-de-vente",
      type: "choix",
      titre: "Déclarer au prix de vente ?",
      notions: ["stock"],
      question: (c) => {
        const s = sinistreDe(c);
        return `Au prix de vente, le stock perdu vaudrait ${eur(s.auPrixDeVente)} au lieu de ${eur(s.stock)}. Le responsable veut le déclarer ainsi. Que lui répondez-vous ?`;
      },
      options: (c) => {
        const s = sinistreDe(c);
        return [
          {
            texte: "Non : l'assureur rembourse ce que le stock a coûté",
            juste: true,
            retour: `Oui. L'inventaire valorise le stock au coût d'achat : la boutique a perdu ${eur(s.stock)}, pas une marge qu'elle n'a pas encore faite. Une déclaration gonflée est une fausse déclaration, qui peut faire perdre toute l'indemnité. Elle se fait sous 5 jours ouvrés, avec les photos et les articles gardés pour l'expert.`,
          },
          {
            texte: "Oui : ces articles auraient été vendus à ce prix",
            juste: false,
            retour: `Non : rien ne dit qu'ils l'auraient été, et la marge perdue se couvre par une autre garantie. L'indemnité monterait à ${eur(s.indemniteAuPrixDeVente)} sur une base fausse.`,
          },
          {
            texte: "Oui : l'expert de l'assureur corrigera s'il le faut",
            juste: false,
            retour: "Non : la boutique répond de ce qu'elle déclare. Une valeur qu'elle sait fausse n'est pas une erreur, c'est une fraude.",
          },
        ];
      },
    },
    {
      id: "la-fermeture",
      type: "montants",
      titre: "Ce que coûtent les jours de fermeture",
      notions: ["contribution_margin", "revenue"],
      question: (c) => {
        const s = sinistreDe(c);
        return `Un mois comme janvier fait ses ventes sur ${qte(ficheDe(c).joursDuMois)} jours réguliers. Calculez le chiffre d'affaires perdu pendant les ${qte(DEGAT_DES_EAUX.joursDeFermeture)} jours de fermeture, la marge sur coût variable perdue (au taux de janvier), puis la perte moyenne de l'année : une fermeture arrive ${qte(s.fermeturesParAn)} fois par an en moyenne.`;
      },
      champs: (c) => {
        const s = sinistreDe(c);
        const f = ficheDe(c);
        const ca = f.gamme.reduce((t, r) => t + r.ventesDuMois * r.prixHt, 0);
        return [
          { libelle: "Chiffre d'affaires perdu", attendu: s.caPerdu, calcul: `${eur(ca)} ÷ ${qte(f.joursDuMois)} × ${qte(DEGAT_DES_EAUX.joursDeFermeture)} = ${eur(s.caPerdu)}` },
          { libelle: "Marge perdue", attendu: s.margePerdue, tolerance: 1, calcul: `${eur(s.caPerdu)} × ${qte(Math.round(s.tauxDeMarge * 1000) / 10)} % = ${eur(s.margePerdue)}` },
          { libelle: "Perte moyenne de l'année", attendu: s.perteMoyenneParAn, tolerance: 1, calcul: `${qte(s.fermeturesParAn)} × ${eur(s.margePerdue)} = ${eur(s.perteMoyenneParAn)}` },
        ];
      },
      explication: (c) => {
        const s = sinistreDe(c);
        return [`${qte(DEGAT_DES_EAUX.joursDeFermeture)} jours fermés font perdre ${eur(s.margePerdue)} de marge. Mais une fermeture est rare : en moyenne, ${eur(s.perteMoyenneParAn)} par an, moins que les ${eur(s.garantie)} de la garantie.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      notions: ["stock", "contribution_margin"],
      question: () => "Quelle réponse envoyez-vous à la direction ?",
      options: (c) => {
        const s = sinistreDe(c);
        const souscrire = s.garantie < s.perteMoyenneParAn;
        return [
          {
            texte: `${eur(s.indemnite)} remboursés, sans la garantie`,
            juste: !souscrire,
            retour: !souscrire
              ? `Oui : l'assureur rembourse ${eur(s.indemnite)} sur la valeur d'achat. La garantie coûterait ${eur(s.garantie)} pour ${eur(s.perteMoyenneParAn)} de pertes moyennes, et une fermeture de ${qte(DEGAT_DES_EAUX.joursDeFermeture)} jours, ${eur(s.margePerdue)}, reste supportable. On assure ce qu'on ne peut pas porter.`
              : "Non : la garantie coûte moins que la perte moyenne qu'elle couvre.",
          },
          {
            texte: `${eur(s.indemnite)} remboursés, et prendre la garantie`,
            juste: souscrire,
            retour: souscrire
              ? "Oui : la garantie coûte moins que la perte moyenne."
              : `Non : ${eur(s.garantie)} par an pour couvrir ${eur(s.perteMoyenneParAn)} de pertes moyennes. La boutique peut porter ${qte(DEGAT_DES_EAUX.joursDeFermeture)} jours de fermeture.`,
          },
          {
            texte: `${eur(s.indemniteAuPrixDeVente)} remboursés, au prix de vente`,
            juste: false,
            retour: `Non : l'assureur rembourse la valeur d'achat du stock, ${eur(s.stock)}. Déclarer au prix de vente serait une fausse déclaration.`,
          },
          {
            texte: `${eur(s.sinistre)} remboursés, le sinistre entier`,
            juste: false,
            retour: `Non : le contrat B laisse ${eur(s.franchise)} de franchise à la boutique. C'est ce qui le rend moins cher que le contrat A.`,
          },
        ];
      },
    },
  ],
};

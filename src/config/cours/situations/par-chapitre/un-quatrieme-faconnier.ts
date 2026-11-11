import { arrondi2 as auCentieme, eur, nombreAuCentieme, pct } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_FOURNISSEUR, POIDS_DE_LA_DIRIGEANTE, fournisseursDeLaBoutique } from "../../chapitres/choisir-et-negocier-le-fournisseur";
import { CRITERES, POIDS_DU_PRIX_ET_DE_LA_QUALITE, QUATRIEME_FACONNIER, notePondereeDe, seuilChezLeQuatrieme } from "../../monde/fournisseurs-de-la-boutique";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CHOISIR ET NÉGOCIER AVEC LE FOURNISSEUR » : UN QUATRIÈME FAÇONNIER (BTS
 * MCO, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : la grille des trois façonniers de MAILLE & CO
 * (monde/fournisseurs-de-la-boutique.ts) et un tricoteur italien (`QUATRIEME_FACONNIER`). Il passe en
 * tête avec les poids de l'acheteuse, mais d'un dixième, et l'atelier local reprend la tête avec les
 * poids de la dirigeante ; son seuil de revente à perte borne une fin de série ; et il conditionne une
 * remise à un prix de revente imposé, ce que la loi interdit. L'élève refait la grille, teste les
 * poids, calcule le seuil, et répond.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les notes pondérées sont des grandeurs, au centième ; la remise
 * la plus forte se donne à deux décimales, à un centième près (au dixième, avant).
 */

const qte = nombreAuCentieme;
const note = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Les chiffres de la réponse. */
export function quatriemeFaconnier(c: Pick<Cas, "code">) {
  const x = fournisseursDeLaBoutique(c);
  const q = QUATRIEME_FACONNIER;
  return {
    ...x,
    q,
    note: auCentieme(notePondereeDe(q.notes)),
    noteALaDirigeante: auCentieme(notePondereeDe(q.notes, POIDS_DE_LA_DIRIGEANTE)),
    referent: x.noteDe("faconnier"),
    atelierALaDirigeante: x.noteDe("atelier-local", POIDS_DE_LA_DIRIGEANTE),
    seuil: seuilChezLeQuatrieme(x.f),
  };
}

const tableauDeLOffre = (c: Pick<Cas, "code">) => {
  const x = quatriemeFaconnier(c);
  const [prix, paiement, livraison, minimum, reassort, qualite] = CRITERES;
  return {
    titre: `L'offre du ${x.q.nom.toLowerCase()}, notée au barème de l'acheteuse`,
    colonnes: ["Ce qu'il propose", "Note sur 5", "Poids"],
    lignes: [
      { libelle: "Prix d'achat", valeurs: [`${pct(Math.round((x.q.multiplicateur - 1) * 1000) / 10)} face au référent`, qte(x.q.notes.prix), qte(prix!.poids)] },
      { libelle: "Délai de paiement", valeurs: [`${qte(x.q.delaiDePaiement)} jours`, qte(x.q.notes.paiement), qte(paiement!.poids)] },
      { libelle: "Délai de livraison", valeurs: [`${qte(x.q.delaiDeLivraison)} jours`, qte(x.q.notes.livraison), qte(livraison!.poids)] },
      { libelle: "Minimum de commande", valeurs: [`${qte(x.q.minimumDeCommande)} articles`, qte(x.q.notes.minimum), qte(minimum!.poids)] },
      { libelle: "Réassort en saison", valeurs: ["oui", qte(x.q.notes.reassort), qte(reassort!.poids)] },
      { libelle: "Qualité", valeurs: [`${pct(x.q.tauxDeRetour * 100)} de retours`, qte(x.q.notes.qualite), qte(qualite!.poids)] },
    ],
  };
};

export const UN_QUATRIEME_FACONNIER: Situation = {
  code: "un-quatrieme-faconnier",
  parcours: "mco",
  palier: 3,
  blocs: [],
  reprend: ["choisir-et-negocier-le-fournisseur"],
  commanditaire: "La dirigeante",
  titre: "Un quatrième façonnier",
  accroche: "Un tricoteur italien passe devant le référent sur la grille de l'acheteuse, et offre 5 % de remise contre un prix de revente minimum. Faut-il le référencer ?",
  objectifs: [
    "Noter un nouveau fournisseur sur la grille pondérée, avec deux jeux de poids",
    "Calculer son seuil de revente à perte",
    "Repérer une clause interdite dans une négociation, et répondre à la dirigeante",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_FOURNISSEUR, pourquoi: "ce cas reprend la grille du chapitre, à la boutique MAILLE & CO, le seul point de vente que la simulation du cours suit d'un chapitre à l'autre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la dirigeante",
      tableau: tableauDeLOffre,
      texte: (c) => {
        const x = quatriemeFaconnier(c);
        return [
          `« Un tricoteur italien nous démarche. L'acheteuse l'a noté avec son barème. Il nous ferait même ${pct(x.q.remiseContrePrixImpose * 100)} de remise si nous promettions de ne jamais vendre le col rond sous ${eur(x.q.prixPlancherImpose)}. Faut-il le référencer à la place du façonnier de référence ? »`,
          "Pas de cours cette fois : vous avez sa fiche notée, et la méthode est celle du chapitre.",
        ];
      },
      repere: () => "À rendre : sa note pondérée avec les poids de l'acheteuse et avec ceux de la dirigeante, son seuil de revente à perte, votre avis sur la remise proposée, et votre réponse.",
    },
    {
      id: "sa-note",
      objectifs: [0],
      type: "montants",
      titre: "Sa note sur la grille",
      notions: ["margin_rates", "payment_terms"],
      tableau: tableauDeLOffre,
      question: () =>
        `Calculez sa note pondérée sur 5, au centième, avec les poids de l'acheteuse, puis avec ceux de la dirigeante (${qte(POIDS_DE_LA_DIRIGEANTE)} points pour le prix, ${qte(POIDS_DU_PRIX_ET_DE_LA_QUALITE - POIDS_DE_LA_DIRIGEANTE)} pour la qualité, les autres inchangés).`,
      champs: (c) => {
        const x = quatriemeFaconnier(c);
        const n = x.q.notes;
        return [
          { libelle: "Note avec les poids de l'acheteuse", nature: "grandeur", attendu: x.note, calcul: `(${CRITERES.map((k) => `${qte(k.poids)} × ${qte(n[k.code])}`).join(" + ")}) ÷ 100 = ${note(x.note)}` },
          {
            libelle: "Note avec les poids de la dirigeante",
            nature: "grandeur",
            attendu: x.noteALaDirigeante,
            calcul: `(${qte(POIDS_DE_LA_DIRIGEANTE)} × ${qte(n.prix)} + ${CRITERES.slice(1, 5).map((k) => `${qte(k.poids)} × ${qte(n[k.code])}`).join(" + ")} + ${qte(POIDS_DU_PRIX_ET_DE_LA_QUALITE - POIDS_DE_LA_DIRIGEANTE)} × ${qte(n.qualite)}) ÷ 100 = ${note(x.noteALaDirigeante)}`,
          },
        ];
      },
      explication: (c) => {
        const x = quatriemeFaconnier(c);
        return [
          `Avec les poids de l'acheteuse, il passe devant le référent (${note(x.note)} contre ${note(x.referent)}), d'un dixième. Avec ceux de la dirigeante, il tombe à ${note(x.noteALaDirigeante)}, derrière l'atelier local (${note(x.atelierALaDirigeante)}). Son avance tient au prix ; elle ne résiste pas à des poids qui valorisent la qualité.`,
        ];
      },
    },
    {
      id: "son-seuil",
      objectifs: [1],
      type: "montants",
      titre: "Son seuil de revente à perte",
      notions: ["price_floor"],
      question: (c) => {
        const s = quatriemeFaconnier(c).seuil;
        return `Il facturerait le pull col rond ${eur(s.prixNet)} hors taxes, net de remise, plus ${eur(s.transport)} de transport, avec ${pct(QUATRIEME_FACONNIER.ristourne * 100)} de ristourne de fin d'année et sans coopération commerciale. Calculez le seuil de revente à perte hors taxes, puis toutes taxes comprises, et la remise la plus forte sur l'étiquette de ${eur(s.r.prixTtc)}, en pourcentage à deux décimales.`;
      },
      champs: (c) => {
        const s = quatriemeFaconnier(c).seuil;
        return [
          { libelle: "Seuil hors taxes", attendu: s.seuilHt, calcul: `${eur(s.prixNet)} + ${eur(s.transport)} − ${eur(s.ristourne)} = ${eur(s.seuilHt)}` },
          { libelle: "Seuil toutes taxes comprises", attendu: s.seuilTtc, calcul: `${eur(s.seuilHt)} × 1,2 = ${eur(s.seuilTtc)}` },
          { libelle: "Remise la plus forte (%)", attendu: auCentieme(s.remiseMaximale * 100), calcul: `(${eur(s.r.prixTtc)} − ${eur(s.seuilTtc)}) ÷ ${eur(s.r.prixTtc)} × 100 = ${pct(auCentieme(s.remiseMaximale * 100))}` },
        ];
      },
      explication: (c) => {
        const x = quatriemeFaconnier(c);
        return [`Son prix de facture est plus bas, mais son seuil (${eur(x.seuil.seuilTtc)}) est plus haut que chez le référent (${eur(x.srp.seuilTtc)}) : le transport et l'absence de coopération commerciale le remontent.`];
      },
    },
    {
      id: "le-prix-impose",
      objectifs: [2],
      type: "choix",
      titre: "La remise contre un prix minimum",
      notions: ["price_floor"],
      question: (c) => {
        const x = quatriemeFaconnier(c);
        return `Il offre ${pct(x.q.remiseContrePrixImpose * 100)} de remise si la boutique ne vend jamais le col rond sous ${eur(x.q.prixPlancherImpose)}. Que vaut cette clause ?`;
      },
      options: () => [
        {
          texte: "Interdite : le prix de revente ne s'impose pas",
          juste: true,
          retour: "Oui. Le distributeur fixe librement son prix de vente ; imposer un prix minimum de revente est une pratique interdite par le code de commerce. Le fournisseur peut conseiller un prix, pas l'imposer.",
        },
        {
          texte: "Elle est permise : la remise est une contrepartie",
          juste: false,
          retour: "Non : une contrepartie ne rend pas légale une clause interdite. Le prix de revente imposé est prohibé, avec ou sans remise.",
        },
        {
          texte: "Elle est permise, mais seulement pendant les soldes",
          juste: false,
          retour: "Non : la clause est interdite en toute période ; les soldes ne changent que les règles de la revente à perte.",
        },
      ],
    },
    {
      id: "reponse",
      objectifs: [2],
      type: "choix",
      titre: "Votre réponse à la dirigeante",
      question: () => "Quelle phrase envoyez-vous à la dirigeante ?",
      options: (c) => {
        const x = quatriemeFaconnier(c);
        return [
          {
            texte: "Une commande d'essai, sans la clause de prix",
            juste: true,
            retour: `Oui. Son avance (${note(x.note)} contre ${note(x.referent)}) ne tient qu'aux poids de l'acheteuse ; sa note de qualité vient de ses clients, pas des nôtres ; et la remise contre un prix minimum est une clause interdite. Une commande d'essai de ${qte(x.q.minimumDeCommande)} articles mesure ses retours chez nous avant de décider.`,
          },
          {
            texte: "Le référencer tout de suite : il a la meilleure note",
            juste: false,
            retour: `D'un dixième, et seulement avec les poids de l'acheteuse : avec ceux de la dirigeante, il finit derrière l'atelier local (${note(x.noteALaDirigeante)} contre ${note(x.atelierALaDirigeante)}).`,
          },
          {
            texte: `Le référencer et signer la clause : ${pct(x.q.remiseContrePrixImpose * 100)} de remise de plus`,
            juste: false,
            retour: "Non : la clause de prix de revente imposé est interdite ; la signer engagerait aussi la boutique.",
          },
        ];
      },
    },
  ],
};

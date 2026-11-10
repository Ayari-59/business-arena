import { arrondi2, eur, qte } from "../../../../pedagogy/cours/deux-decimales";
import { ENTREPRISES_DES_TARIFS } from "../../chapitres/les-politiques-tarifaires";
import { L_ESCALE } from "../../monde/l-escale";
import { CONGRES_DE_JUILLET, HIVER, congresDeJuillet, trimestreAuPrix } from "../../monde/tarifs-de-l-escale";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES POLITIQUES TARIFAIRES » : LE CONGRÈS DE JUILLET (Bac STMG, mercatique
 * de terminale, palier 1).
 *
 * Un organisateur de congrès demande 1 000 nuitées en juillet, à 75 € (CONGRES_DE_JUILLET). Le directeur
 * de l'hôtel est tenté : c'est un gros volume. Mais l'été, l'hôtel est plein au prix de l'année : chaque
 * nuitée du congrès prend la place d'une nuitée vendue 88 €. L'élève refait la marge d'une nuitée, la
 * compare à celle que l'hôtel perdrait, et voit que l'hiver, où les chambres sont vides, le même congrès
 * rapporterait toute sa marge : le prix d'une nuitée dépend du moment.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les nuitées vides sont une quantité ; les marges au centime.
 */


/** Les chiffres de la réponse, calculés une fois. */
export function leCongresDeJuillet() {
  const k = congresDeJuillet();
  const hiver = trimestreAuPrix(HIVER);
  return { ...k, videsDeLHiver: hiver.vides, margeEnHiver: hiver.vides >= k.nuitees ? k.margeDuCongres : arrondi2(hiver.vides * (k.prix - L_ESCALE.coutVariableParNuitee)) };
}

export const LE_CONGRES_DE_JUILLET: Situation = {
  code: "le-congres-de-juillet",
  parcours: "stmg",
  palier: 1,
  blocs: [],
  reprend: ["les-politiques-tarifaires"],
  commanditaire: "Le directeur de l'hôtel",
  titre: "Le congrès de juillet",
  accroche: "Un organisateur de congrès veut réserver un gros volume de nuitées en juillet, à un prix négocié. Le volume est tentant ; l'hôtel est déjà plein l'été.",
  objectifs: ["Comparer la marge d'une offre négociée à celle qu'elle remplace", "Relier le prix d'une nuitée au remplissage", "Répondre au directeur, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_TARIFS,
    pourquoi: "le cas reprend l'année de L'ESCALE, du chapitre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de l'organisateur",
      texte: () => {
        const k = CONGRES_DE_JUILLET;
        const r = leCongresDeJuillet();
        return [
          `« Un organisateur de congrès veut ${qte(k.nuitees)} nuitées en juillet, à ${eur(k.prix)} la nuitée. C'est le plus gros contrat de l'année : on signe ? » Le directeur de l'hôtel`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre. Au prix de l'année, ${eur(L_ESCALE.prixDeLAnnee)}, l'été est plein, et l'hôtel refuse déjà ${qte(r.refusees)} nuitées. Une nuitée occupée coûte ${eur(L_ESCALE.coutVariableParNuitee)}.`,
        ];
      },
      repere: () => "À rendre : la marge du congrès, la marge des nuitées qu'il remplacerait, l'écart, et votre réponse.",
    },
    {
      id: "les-marges",
      type: "montants",
      titre: "Le congrès face aux nuitées qu'il remplace",
      notions: ["contribution_margin", "occupancy_revpar"],
      question: () => `L'été, chaque nuitée du congrès prend la place d'une nuitée vendue ${eur(L_ESCALE.prixDeLAnnee)}. Calculez la marge du congrès, la marge des nuitées qu'il remplacerait, puis l'écart (congrès moins nuitées remplacées).`,
      champs: () => {
        const r = leCongresDeJuillet();
        return [
          { libelle: "Marge du congrès", attendu: r.margeDuCongres, calcul: `${qte(r.nuitees)} × (${eur(r.prix)} − ${eur(L_ESCALE.coutVariableParNuitee)}) = ${eur(r.margeDuCongres)}` },
          { libelle: "Marge des nuitées remplacées", attendu: r.margePerdue, calcul: `${qte(r.remplacees)} × (${eur(L_ESCALE.prixDeLAnnee)} − ${eur(L_ESCALE.coutVariableParNuitee)}) = ${eur(r.margePerdue)}` },
          { libelle: "Écart", attendu: r.ecart, calcul: `${eur(r.margeDuCongres)} − ${eur(r.margePerdue)} = ${eur(r.ecart)}` },
        ];
      },
      explication: () => {
        const r = leCongresDeJuillet();
        return [`En juillet, le congrès ${r.ecart < 0 ? `ferait perdre ${eur(-r.ecart)} de marge` : `rapporterait ${eur(r.ecart)} de plus`} : l'hôtel vendrait autant de nuitées, mais moins cher.`];
      },
    },
    {
      id: "en-hiver",
      type: "montants",
      titre: "Et si le congrès venait l'hiver",
      notions: ["seasonality", "contribution_margin"],
      question: () => "L'hiver, des chambres restent vides au prix de l'année. Combien de nuitées sont vides l'hiver, et quelle marge le même congrès y rapporterait-il ?",
      champs: () => {
        const r = leCongresDeJuillet();
        return [
          { libelle: "Nuitées vides l'hiver", nature: "quantite", attendu: r.videsDeLHiver, calcul: `${qte(L_ESCALE.chambres * L_ESCALE.joursParTrimestre)} − ${qte(trimestreAuPrix(HIVER).vendues)} = ${qte(r.videsDeLHiver)}` },
          { libelle: "Marge du congrès en hiver", attendu: r.margeEnHiver, calcul: `${qte(Math.min(r.nuitees, r.videsDeLHiver))} × (${eur(r.prix)} − ${eur(L_ESCALE.coutVariableParNuitee)}) = ${eur(r.margeEnHiver)}` },
        ];
      },
      explication: () => {
        const r = leCongresDeJuillet();
        return [`L'hiver, le congrès remplirait des chambres vides : toute sa marge, ${eur(r.margeEnHiver)}, s'ajouterait à celle de l'hôtel. La même nuitée à ${eur(r.prix)} perd de l'argent l'été et en rapporte l'hiver.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur",
      question: () => "Quelle phrase envoyez-vous au directeur ?",
      options: () => {
        const r = leCongresDeJuillet();
        return [
          { texte: "Proposons-lui l'hiver, pas juillet", juste: r.ecart < 0, retour: `Oui : en juillet, le congrès ferait perdre ${eur(-r.ecart)}, parce que l'hôtel est déjà plein. L'hiver, au même prix, il rapporterait ${eur(r.margeEnHiver)}. L'été, il ne vaut la peine qu'au prix que paient les autres clients.` },
          { texte: `Signons : le congrès rapporte ${eur(r.margeDuCongres)} de marge`, juste: false, retour: `Non : cette marge remplacerait celle des nuitées vendues au prix de l'année, ${eur(r.margePerdue)}. L'hôtel y perdrait ${eur(-r.ecart)}.` },
          { texte: "Refusons : un prix négocié fait toujours perdre", juste: false, retour: `Non : l'hiver, le même prix rapporterait ${eur(r.margeEnHiver)}, sur des chambres vides. Un prix bas n'est mauvais que lorsqu'il prend la place d'un prix plus haut.` },
        ];
      },
    },
  ],
};

import { casDeLEntreprise } from "../cas";
import { HAUSSE_DE_LA_SECONDE_LIVRAISON, ficheDuMois, leMois, moisValorise } from "../chapitres/les-stocks";
import { auCentime } from "./amortissement";
import { valoriserLeStock } from "./stock";

/**
 * LE MONDE DU COURS : LA FICHE DE STOCK D'AVRIL DE PIXEL & CO (décision du propriétaire, novembre 2026 :
 * une activité par chapitre ; le format « bureau » ; chapitre « Les stocks »).
 *
 * Le bureau (config/cours/bureaux/la-fiche-de-stock-d-avril.ts) lit tout ici. Début mai, l'élève arrête
 * le mois d'avril de PIXEL & CO : la banque veut une situation à fin avril, le stock, le coût des ventes
 * et la marge du mois.
 *
 * CE QUI VIENT DU CHAPITRE ET DU MONDE, ET NE S'ÉCRIT DONC PAS ICI :
 *   · le stock du 1er avril : le stock final du premier trimestre, au coût moyen de la période (le cas
 *     figé, monde/cas-des-entreprises.ts, arrêté par `arrete` du chapitre) ;
 *   · le mois qui suit le trimestre (`leMois` du chapitre) : deux livraisons, la seconde au prix relevé
 *     de la hausse du fournisseur, deux séries de ventes, au prix moyen du trimestre ;
 *   · la méthode de PIXEL & CO, le coût moyen pondéré de la période, le coût arrondi au centime comme
 *     dans les énoncés (`moisValorise` du chapitre, monde/stock.ts) ;
 *   · les deux écritures d'inventaire de l'inventaire intermittent, et la TVA des achats (le cas figé).
 *
 * CE QUI EST CHOISI (hypothèses du bureau, chacune nommée ci-dessous et dite à l'élève) : une situation
 * arrêtée à la fin d'avril pour la banque, la comptabilité restant en inventaire intermittent ; la
 * lettre du fournisseur qui annonce la hausse ; une commande passée le 25 avril, livrée en mai.
 */

/** L'entreprise du bureau : PIXEL & CO, l'une des deux où le chapitre se joue. */
export const ENTREPRISE_DE_LA_FICHE = "ecommerce";

/** LA LETTRE DE HAUSSE (hypothèse du bureau) : le fournisseur l'envoie le 10 avril, la hausse vaut pour les livraisons du 15. */
export const LETTRE_DE_HAUSSE = { jour: 10, aPartirDu: 15 } as const;

/** LA COMMANDE DE MAI (hypothèse du bureau) : passée le 25 avril, pour une livraison le 5 mai, autant qu'une livraison d'avril. */
export const COMMANDE_DE_MAI = { jour: 25, livraison: 5 } as const;

/** Tout ce que le bureau lit : le stock du 1er avril, les livraisons, les ventes, la fiche, les écritures. */
export function ficheDAvril() {
  const c = casDeLEntreprise(ENTREPRISE_DE_LA_FICHE);
  const x = leMois(c);
  const a = x.a;
  const fiche = ficheDuMois(x);
  const v = moisValorise(x, "cmup-periode");
  const peps = moisValorise(x, "peps");
  const exact = valoriserLeStock(fiche, "cmup-periode");
  const tva = a.achats.tauxTva;
  const livraison = (prix: number) => {
    const ht = auCentime(x.livraison * prix);
    const t = auCentime(ht * tva);
    return { quantite: x.livraison, prix, ht, tva: t, ttc: auCentime(ht + t) };
  };
  const premiere = livraison(x.prix1);
  const seconde = livraison(x.prix2);
  const achats = auCentime(premiere.ht + seconde.ht);
  const disponible = { quantite: fiche.initial.quantite + 2 * x.livraison, valeur: auCentime(fiche.initial.valeur + achats) };
  return {
    c,
    x,
    entreprise: c.entreprise,
    fournisseur: c.achat.fournisseur,
    mois: x.nom,
    initial: fiche.initial,
    coutInitial: auCentime(fiche.initial.valeur / fiche.initial.quantite),
    premiere,
    seconde,
    hausse: HAUSSE_DE_LA_SECONDE_LIVRAISON,
    achats,
    disponible,
    vendues: 2 * x.vente,
    serie: x.vente,
    prixDeVente: a.ventes.prixUnitaire,
    ventes: x.ventesDuMois,
    coutMoyen: v.v.coutMoyenDePeriode,
    coutMoyenExact: exact.coutMoyenDePeriode,
    final: v.final,
    coutDesVentes: v.cout,
    marge: v.marge,
    variation: auCentime(fiche.initial.valeur - v.final.valeur),
    margePeps: peps.marge,
    finalPeps: peps.final.valeur,
    tauxTva: tva,
  };
}

export type FicheDAvril = ReturnType<typeof ficheDAvril>;

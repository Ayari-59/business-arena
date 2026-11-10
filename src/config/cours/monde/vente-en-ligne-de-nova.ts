import { aLUnite, arrondi2 } from "../../../pedagogy/cours/deux-decimales";
import { canauxDeDistribution, coutVariable, margeUnitaire, prixDeNova } from "./economie-et-marketing";
import { MERCATIQUE_DE_NOVA } from "./mercatique-de-nova";

/**
 * LE MONDE DU COURS : NOVA VEND EN LIGNE (le chapitre « Vendre en ligne : e-commerce, m-commerce, place
 * de marché », mercatique de terminale, question 2.3 : « Le numérique, une autre manière de penser la
 * distribution ? »).
 *
 * CE QUI VIENT DES FICHES QUI EXISTENT, relu et jamais recopié (mercatique-de-nova.ts et
 * economie-et-marketing.ts) : les ventes du premier trimestre aux particuliers, en ligne, payées à la
 * commande ; le prix de la NOVA One, son coût variable et sa marge.
 *
 * LES HYPOTHÈSES DU CHAPITRE, dites ici :
 *   · LE M-COMMERCE : 62 % des commandes du site sont passées depuis un téléphone ;
 *   · LA PLACE DE MARCHÉ : une grande plateforme en ligne propose de vendre la NOVA One à côté de
 *     milliers d'autres vendeurs. Elle prend 15 % du prix hors taxes sur chaque vente, et 400 € par
 *     trimestre d'abonnement. NOVA y attend 600 ventes par trimestre ; une partie viendrait de clients
 *     qui auraient de toute façon acheté sur le site de NOVA (la cannibalisation) ;
 *   · LE CAS « LA PLACE DE MARCHÉ NÉGOCIE » : une seconde offre, 12 % de commission et 1 200 €
 *     d'abonnement par trimestre ; NOVA estime que 30 % des ventes de la plateforme seraient prises à
 *     son site.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les commandes depuis un téléphone et les ventes prises au
 * site sont des quantités, à l'unité la plus proche ; les montants au centime.
 */

const auCentime = arrondi2;

export const PART_DU_MOBILE = 0.62;

export const PLACE_DE_MARCHE = { commission: 0.15, abonnement: 400, ventesAttendues: 600 } as const;

export const OFFRE_NEGOCIEE = { commission: 0.12, abonnement: 1_200, cannibalisation: 0.3 } as const;

export type CodeDeVenteEnLigne = "e-commerce" | "m-commerce" | "place-de-marche" | "magasin-connecte";

/** Des façons de vendre avec le numérique (hypothèse du chapitre). */
export const FACONS_DE_VENDRE_EN_LIGNE: readonly { libelle: string; code: CodeDeVenteEnLigne; pourquoi: string }[] = [
  { libelle: "Une commande passée sur le site de NOVA depuis un ordinateur", code: "e-commerce", pourquoi: "Une vente à distance, sur le site du vendeur : le commerce électronique." },
  { libelle: "Une commande passée depuis l'application, sur un téléphone", code: "m-commerce", pourquoi: "Le commerce électronique sur un mobile : le m-commerce." },
  { libelle: "La NOVA One vendue sur une plateforme, à côté d'autres vendeurs", code: "place-de-marche", pourquoi: "Une place de marché réunit de nombreux vendeurs et prend une commission sur chaque vente." },
  { libelle: "Une borne chez CampusTech pour commander une couleur absente du rayon", code: "magasin-connecte", pourquoi: "Le magasin se sert du numérique pour vendre plus : c'est un magasin connecté." },
  { libelle: "Le paiement par téléphone à la caisse de CampusTech", code: "magasin-connecte", pourquoi: "Le numérique entre dans le magasin physique : sa digitalisation." },
];

const fiche = MERCATIQUE_DE_NOVA;

/** Les ventes en ligne du premier trimestre : enceintes, chiffre d'affaires, commandes passées depuis un téléphone. */
export function ventesEnLigne() {
  const d = canauxDeDistribution(fiche).direct;
  const mobile = aLUnite(d.ventes * PART_DU_MOBILE);
  return { ventes: d.ventes, chiffreDAffaires: d.chiffreDAffaires, prix: d.prix, mobile, chiffreDuMobile: auCentime(mobile * d.prix), partDuMobile: PART_DU_MOBILE };
}

/** Une enceinte vendue sur la place de marché : la commission, et la marge qui reste. */
export function venteSurLaPlace(commission: number = PLACE_DE_MARCHE.commission) {
  const prix = prixDeNova(fiche);
  const prelevee = auCentime(prix * commission);
  return { prix, coutVariable: coutVariable(fiche), commission: prelevee, marge: auCentime(prix - prelevee - coutVariable(fiche)), margeSurLeSite: margeUnitaire(fiche) };
}

/**
 * Un trimestre sur la place de marché, quand une part `c` (de 0 à 1) de ses ventes aurait été faite sur le
 * site de toute façon : la marge des ventes nouvelles, la marge perdue sur les ventes prises au site, et ce
 * qui reste, abonnement payé.
 */
export function trimestreSurLaPlace(c: number, offre: { commission: number; abonnement: number } = PLACE_DE_MARCHE) {
  const v = venteSurLaPlace(offre.commission);
  const ventes = PLACE_DE_MARCHE.ventesAttendues;
  const prises = aLUnite(ventes * c);
  const nouvelles = ventes - prises;
  const margeDesNouvelles = auCentime(nouvelles * v.marge);
  // Une vente prise au site rapporte la marge de la place au lieu de celle du site.
  const perteSurLesPrises = auCentime(prises * (v.margeSurLeSite - v.marge));
  return { ventes, prises, nouvelles, margeDesNouvelles, perteSurLesPrises, abonnement: offre.abonnement, gain: auCentime(margeDesNouvelles - perteSurLesPrises - offre.abonnement) };
}

/** La part de ventes prises au site la plus forte, en % entier, qui laisse la place de marché rentable. */
export function cannibalisationSupportable() {
  let c = 0;
  while (c < 100 && trimestreSurLaPlace((c + 1) / 100).gain >= 0) c++;
  return c;
}

export const CANNIBALISATION_DU_LABORATOIRE = { min: 0, max: 100, pas: 1 } as const;

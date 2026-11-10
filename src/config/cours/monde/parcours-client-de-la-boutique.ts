import { arrondi2 } from "../../../pedagogy/cours/deux-decimales";
import { VISITES_DU_SITE, RETRAITS_DE_JANVIER } from "./clientele-de-la-boutique";
import { MAILLE_ET_CO } from "./maille-et-co";
import { indicateursDuMois } from "./boutique";
import { passantsDeJanvier } from "./vente-et-caisse";

/**
 * LE MONDE DU COURS : LE PARCOURS CLIENT DE MAILLE & CO (le chapitre « Le parcours client : ROPO,
 * cross-canal, omnicanal », mercatique de terminale, question 2.2 : « Le consommateur dicte-t-il les
 * choix de distribution ? »).
 *
 * CE QUI VIENT DES FICHES QUI EXISTENT, relu et jamais recopié :
 *   · maille-et-co.ts et boutique.ts : les entrées et les passages en caisse de janvier ;
 *   · clientele-de-la-boutique.ts : les visites du site de la boutique en janvier (il présente la
 *     collection et prend des commandes à retirer en boutique) et les retraits de janvier ;
 *   · vente-et-caisse.ts : la marge d'une vente à un passant.
 *
 * LES HYPOTHÈSES DU CHAPITRE, dites ici :
 *   · L'ENQUÊTE EN CAISSE : sur les passages de janvier, 282 clientes disent avoir regardé le site avant
 *     de venir (le ROPO, « research online, purchase offline ») ;
 *   · LE MODULE DE RÉSERVATION : réserver un article sur le site, l'essayer en boutique. Le prestataire
 *     le loue 250 € par mois ; 60 % des clientes qui réservent achètent à l'essayage, comme un passant.
 *     Le chapitre essaie un mois de 20 réservations ;
 *   · LE CAS « LE MODULE AUGMENTE » : le prestataire passe à 400 € par mois ; la boutique attend 18
 *     réservations par mois.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : la part des passages venus du site et le taux de
 * transformation se donnaient au dixième, ils sont à deux décimales.
 */

const auCentime = arrondi2;

export const CLIENTES_ROPO_DE_JANVIER = 282;

export const MODULE_DE_RESERVATION = { loyerParMois: 250, tauxDAchat: 0.6, reservationsDuChapitre: 20, loyerDuCas: 400, reservationsAttendues: 18 } as const;

export type CodeDeCanal = "multicanal" | "cross-canal" | "omnicanal";

/** Des façons de faire vivre ses canaux, vues à MAILLE & CO (hypothèse du chapitre). */
export const PRATIQUES_DES_CANAUX: readonly { libelle: string; canal: CodeDeCanal; pourquoi: string }[] = [
  { libelle: "Le site montre la collection, la boutique vend, sans lien entre les deux", canal: "multicanal", pourquoi: "Plusieurs canaux, mais chacun vit à part : c'est le multicanal." },
  { libelle: "Un catalogue envoyé par courrier et une boutique, chacun avec ses promotions", canal: "multicanal", pourquoi: "Les canaux coexistent sans se relayer : le client ne passe pas de l'un à l'autre." },
  { libelle: "Commander sur le site, retirer et payer en boutique", canal: "cross-canal", pourquoi: "L'achat commence sur un canal et finit sur l'autre : c'est le cross-canal." },
  { libelle: "Réserver en ligne un pull, puis l'essayer en boutique", canal: "cross-canal", pourquoi: "Le site prépare la visite en boutique : les canaux se relaient." },
  { libelle: "Un seul stock et une seule carte, vus en boutique comme en ligne", canal: "omnicanal", pourquoi: "Les canaux ne font plus qu'un pour la cliente : c'est l'omnicanal." },
  { libelle: "La vendeuse commande sur sa tablette la taille absente, livrée chez la cliente", canal: "omnicanal", pourquoi: "En boutique, la vendeuse se sert du site : la cliente ne voit qu'une seule enseigne." },
];

/** Le mois de janvier, vu par les canaux : passages, entrées, visites du site, retraits, clientes venues par le site. */
export function canauxDeJanvier() {
  const i = indicateursDuMois(MAILLE_ET_CO);
  const visites = Object.values(VISITES_DU_SITE).reduce((t, x) => t + x, 0);
  return {
    entrees: i.entrees,
    passages: i.tickets,
    visites,
    retraits: RETRAITS_DE_JANVIER,
    ropo: CLIENTES_ROPO_DE_JANVIER,
    partRopo: arrondi2((CLIENTES_ROPO_DE_JANVIER / i.tickets) * 100),
    transformationDuSite: arrondi2((RETRAITS_DE_JANVIER / visites) * 100),
  };
}

/** La marge d'une vente à un passant, et ce que rapporte en moyenne une réservation, qui ne finit pas toujours en vente. */
export function margeDUneReservation() {
  const margeDUneVente = passantsDeJanvier(MAILLE_ET_CO).margeDUneVente;
  return { margeDUneVente, tauxDAchat: MODULE_DE_RESERVATION.tauxDAchat, parReservation: auCentime(margeDUneVente * MODULE_DE_RESERVATION.tauxDAchat) };
}

/** Un mois de r réservations : la marge qu'elles rapportent, le loyer du module, et ce qui reste. */
export function moisDuModule(r: number, loyer: number = MODULE_DE_RESERVATION.loyerParMois) {
  const marge = auCentime(r * margeDUneReservation().parReservation);
  return { reservations: r, marge, loyer, gain: auCentime(marge - loyer) };
}

/** Le plus petit nombre de réservations par mois qui paie le loyer du module. */
export const reservationsQuiPaient = (loyer: number = MODULE_DE_RESERVATION.loyerParMois) => Math.ceil(loyer / margeDUneReservation().parReservation - 1e-9);

import { arrondi2 } from "../../../pedagogy/cours/deux-decimales";
import { auCentime } from "./amortissement";
import { ENTREPRISES_DE_LA_DIRECTION } from "./direction-de-nova";
import { VENTES_DES_PARTICULIERS } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LE SYSTÈME D'INFORMATION DE NOVA (enseignement spécifique de systèmes
 * d'information de gestion de terminale STMG, thème 1, question 1.1, lot F).
 *
 * CE QUI VIENT DES FICHES : les enceintes vendues en ligne aux particuliers, mois par mois
 * (nova-gestion.ts) ; le chapitre « Le processus et le PGI » (processus-de-commande.ts) a déjà posé
 * qu'aujourd'hui chaque service a son outil, et que la commande se ressaisit.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · UNE COMMANDE DU SITE, UNE ENCEINTE : un particulier commande une enceinte à la fois, et le site
 *     reçoit autant de commandes que NOVA vend d'enceintes aux particuliers ;
 *   · LES ADRESSES FAUSSES : le client tape son adresse sans aide. En janvier, 28 colis sont revenus
 *     pour une adresse fausse ou incomplète ; en juin, 40. Un colis revenu coûte 9 € (le retour, la
 *     réexpédition et l'appel au client) ;
 *   · LE CONTRÔLE À LA SAISIE : un service de complétion d'adresses, branché sur le formulaire du site,
 *     propose les adresses de la base nationale pendant que le client tape. Il coûte 45 € par mois, et
 *     le cours suppose qu'il arrête toutes ces erreurs.
 */

export const ENTREPRISES_DU_SYSTEME_D_INFORMATION = ENTREPRISES_DE_LA_DIRECTION;

export const COLIS_REVENUS = { janvier: 28, juin: 40 } as const;
export const COUT_D_UN_COLIS_REVENU = 9;
export const CONTROLE_DES_ADRESSES = { parMois: 45 } as const;

const COMMANDES_DE_JANVIER = VENTES_DES_PARTICULIERS[0];
const COMMANDES_DE_JUIN = VENTES_DES_PARTICULIERS[5];

/** Les adresses fausses de janvier : le taux d'erreur, au dixième de pour cent, et ce qu'elles coûtent. */
export function adressesDeJanvier() {
  const commandes = COMMANDES_DE_JANVIER;
  const colis = COLIS_REVENUS.janvier;
  return { commandes, colis, tauxPct: arrondi2((colis / commandes) * 100), cout: auCentime(colis * COUT_D_UN_COLIS_REVENU) };
}

/** Ce que coûtent, en un mois, les adresses fausses de n commandes, au taux de janvier. */
export const coutDesAdressesFausses = (commandes: number) => auCentime((commandes * COLIS_REVENUS.janvier * COUT_D_UN_COLIS_REVENU) / COMMANDES_DE_JANVIER);

/** Le plus petit nombre de commandes par mois où le contrôle à la saisie coûte moins que les colis revenus. */
export const commandesQuiPaientLeControle = () => Math.ceil((CONTROLE_DES_ADRESSES.parMois * COMMANDES_DE_JANVIER) / (COLIS_REVENUS.janvier * COUT_D_UN_COLIS_REVENU) - 1e-9);

/** Le cas : le contrôle des adresses, sur le mois de juin. */
export function controleDeJuin() {
  const cout = auCentime(COLIS_REVENUS.juin * COUT_D_UN_COLIS_REVENU);
  return { commandes: COMMANDES_DE_JUIN, colis: COLIS_REVENUS.juin, coutDUnColis: COUT_D_UN_COLIS_REVENU, cout, abonnement: CONTROLE_DES_ADRESSES.parMois, gain: auCentime(cout - CONTROLE_DES_ADRESSES.parMois) };
}

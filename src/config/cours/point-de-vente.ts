/**
 * LES CONDITIONS DU POINT DE VENTE : CE QUE LE COURS SUPPOSE, ET POURQUOI.
 *
 * Les chapitres du parcours BTS MCO prennent leurs chiffres dans l'arène : les prix, les
 * fournisseurs, la demande de chaque clientèle, les ventes et les ventes manquées. Ce qui
 * n'y est pas, et que le magasin a pourtant sous les yeux, est posé ici, une fois, avec sa
 * raison : un chapitre n'écrit aucune hypothèse à la main.
 *
 * Le panier moyen de la boutique repose sur l'hypothèse que l'arène affiche déjà dans ses
 * indicateurs du métier (`ARTICLES_PAR_TICKET`, `config/scenarios/sector-kpis.ts`) : le cours
 * la reprend telle quelle, pour que l'élève retrouve dans l'arène le chiffre qu'il a calculé.
 */

/**
 * L'objectif de progression du chiffre d'affaires que la direction fixe au point de vente :
 * un dixième de plus. C'est l'ordre de grandeur d'un objectif annuel ambitieux pour un
 * magasin indépendant ; le chapitre l'utilise pour comparer deux leviers (plus de clients,
 * ou un panier plus rempli), pas pour prédire ce que le magasin atteindra.
 */
export const OBJECTIF_DE_HAUSSE = 0.1;

/**
 * Les jours d'un mois, pour dater le point mort : le mois commercial de trente jours,
 * convention des calculs de délais et de point mort. Le cas étant un mois moyen de l'arène
 * (le trimestre divisé par trois), il n'a pas de calendrier à lui.
 */
export const JOURS_DU_MOIS = 30;

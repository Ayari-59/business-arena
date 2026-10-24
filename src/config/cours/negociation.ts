/**
 * LES CONDITIONS DE LA NÉGOCIATION : CE QUE LE COURS SUPPOSE, ET POURQUOI.
 *
 * Les chapitres du parcours BTS NDRC prennent leurs chiffres dans l'arène : le prix
 * catalogue, les coûts, les clientèles et leur sensibilité au prix, le trimestre rejoué à un
 * autre prix. Ce que l'arène ne joue pas, la parole du client à la table de négociation, est
 * posé ici, une fois, avec sa raison : un chapitre n'écrit aucune hypothèse à la main.
 */

/**
 * La contre-proposition du client, entre le coût variable et le coût complet de l'unité : à
 * mi-chemin. C'est le prix d'un acheteur qui connaît le métier : il sait qu'en dessous du
 * coût variable le vendeur ne signera jamais, et tente sa chance sous le coût complet. Le
 * chapitre s'en sert pour distinguer les deux planchers, pas pour dire ce qu'un client propose.
 */
export const CONTRE_PROPOSITION = 0.5;

/**
 * Les seuils de la méthode ABC, en part cumulée du chiffre d'affaires : la classe A réunit les
 * comptes qui font les premiers 80 %, la classe B ceux qui mènent à 95 %, la classe C le reste.
 * C'est la convention la plus répandue dans les manuels de BTS ; d'autres découpages existent
 * (70 et 90), et le chapitre ne dit pas qu'un portefeuille « doit » s'y conformer.
 */
export const SEUILS_ABC = { a: 80, b: 95 } as const;

/**
 * Le nombre de comptes en dessous duquel un classement en trois classes ne dit rien : avec trois
 * ou quatre lignes, la classe C n'existe pas. Le chapitre ABC ne se joue que dans les entreprises
 * dont la gamme en compte au moins autant.
 */
export const COMPTES_POUR_UN_CLASSEMENT = 8;

/**
 * Le portefeuille est dit concentré quand sa classe A réunit au plus trois comptes sur dix :
 * les « 20/80 » des manuels, avec la marge qu'appelle un ordre de grandeur. Au-delà, les
 * ventes se répartissent sur trop de comptes pour qu'un seul fasse courir un risque.
 */
export const PART_DES_COMPTES_D_UN_PORTEFEUILLE_CONCENTRE = 30;

/**
 * La part du chiffre d'affaires au-delà de laquelle un compte, à lui seul, fait courir un risque :
 * un quart des ventes. Le perdre amputerait l'activité d'un trimestre sur quatre, quelle que soit
 * la concentration du reste du portefeuille.
 */
export const PART_D_UN_COMPTE_QUI_FAIT_COURIR_UN_RISQUE = 25;

/**
 * La baisse du taux de service, en points, à partir de laquelle un trimestre qui décroche
 * s'explique par l'offre plutôt que par la demande : cinq points. En dessous, l'écart tient aux
 * arrondis et aux à-coups d'un trimestre ; au-delà, des clients venus d'eux-mêmes sont repartis
 * sans être servis.
 */
export const BAISSE_DU_SERVICE_QUI_SIGNALE_L_OFFRE = 5;

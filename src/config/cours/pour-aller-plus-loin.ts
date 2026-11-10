/**
 * LES CHAPITRES « POUR ALLER PLUS LOIN » D'UN DIPLÔME (décision du propriétaire, novembre 2026, lot C du
 * chantier STMG).
 *
 * Quatre chapitres de niveau supérieur citent des thèmes du bac STMG : « Domination par les coûts ou
 * différenciation » et « Lire la stratégie de ses concurrents » (palier 2), « La responsabilité
 * sociétale » et « Ce que rapporte l'engagement » (palier 4). Ils restent visibles en STMG, sans rien
 * changer à leur contenu, mais comme un approfondissement : la page du diplôme et sa page de couverture
 * les marquent « pour aller plus loin », et les rangent après les chapitres du niveau du lycée.
 *
 * La liste s'écrit à la main, diplôme par diplôme : un chapitre est un approfondissement pour un public,
 * pas en soi (les mêmes chapitres sont au cœur du parcours Stratégie et du DSCG). Une garde vérifie
 * qu'aucun chapitre au-dessus du palier d'un diplôme du lycée ne s'y affiche sans ce marquage
 * (tests/cours/pour-aller-plus-loin.test.ts).
 */
export const POUR_ALLER_PLUS_LOIN: Readonly<Record<string, readonly string[]>> = {
  stmg: ["couts-ou-differenciation", "lire-la-strategie-des-concurrents", "la-responsabilite-societale", "ce-que-rapporte-l-engagement"],
};

/** Le libellé du marquage, tel que les pages l'affichent. */
export const LIBELLE_POUR_ALLER_PLUS_LOIN = "pour aller plus loin";

/** Vrai si le chapitre est, pour ce diplôme, un approfondissement. */
export const pourAllerPlusLoin = (formation: string, chapitre: string): boolean => POUR_ALLER_PLUS_LOIN[formation]?.includes(chapitre) ?? false;

/** Les chapitres d'une liste, ceux du niveau du diplôme d'abord, les approfondissements ensuite, chaque groupe dans son ordre. */
export function approfondissementsALaFin<T>(formation: string, liste: readonly T[], code: (x: T) => string): T[] {
  return [...liste.filter((x) => !pourAllerPlusLoin(formation, code(x))), ...liste.filter((x) => pourAllerPlusLoin(formation, code(x)))];
}

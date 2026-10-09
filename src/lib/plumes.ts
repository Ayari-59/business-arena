import { formatEuro } from "@/lib/format";

/**
 * LES PLUMES : UNE MISE EN FORME QUI TRAVERSE LA FRONTIÈRE DU SERVEUR.
 *
 * Un compteur qui monte doit écrire chacune de ses images comme la maison
 * écrit la valeur finale — mêmes séparateurs de milliers, même signe moins
 * typographique, même unité. La façon évidente serait de lui passer la
 * fonction de mise en forme ; or l'ardoise, le rituel et la clôture sont des
 * composants de SERVEUR, et une fonction ne traverse pas la frontière vers un
 * composant client : React refuse net (« Functions cannot be passed directly
 * to Client Components »).
 *
 * Ce qui traverse, c'est un NOM. Le serveur dit quelle plume employer, le
 * client la retrouve ici. Les écrans qui sont déjà des composants clients
 * (un épisode, par exemple, dont la courbe porte son propre format) peuvent
 * continuer à passer la fonction directement.
 *
 * Les plumes ne réinventent rien : elles reprennent `lib/format`. La plume
 * signée redit la règle de `euroSigne` (components/tableau-de-bord.tsx), et une
 * garde tient les deux écritures identiques, pour qu'un montant du compteur ne
 * s'écrive jamais autrement qu'un montant posé.
 */
export const PLUMES = {
  /** « 299 484 € », « −294 € ». */
  euro: formatEuro,
  /** Un montant signé : « +12 000 € », « −294 € », « 0 € ». */
  "euro-signe": (v: number) => `${Math.round(v) > 0 ? "+" : ""}${formatEuro(v)}`,
} as const satisfies Record<string, (v: number) => string>;

export type NomDePlume = keyof typeof PLUMES;

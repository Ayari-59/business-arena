import type { ReactNode } from "react";

/**
 * UNE BANDE DE PAGE : pleine largeur, nommée, et qui peut passer à contre-jour.
 *
 * CE QUE C'EST. Le motif que onze blocs répétaient à la main : une section qui
 * va d'un bord à l'autre, et dedans un conteneur centré qui porte la largeur
 * et les marges. Le contre-jour ne vit que sur la section ; le conteneur ne
 * change pas. Une bande peut donc basculer sans que son contenu bouge.
 *
 * POURQUOI UN COMPOSANT. La classe `contre-jour` était écrite en dur dans onze
 * endroits, donc posée une fois pour toutes. Pour que l'administrateur choisisse
 * lesquelles restent, la décision doit entrer par UN point : ici. La page dit
 * « cette bande, est-elle à contre-jour ? », et c'est le composant qui sait ce
 * que cela change (la classe, le fond, les marges).
 *
 * LE NOM EST UN `data-bande`, PAS UN `id`. Plusieurs sections portent déjà un
 * `id` qui sert d'ancre ou d'étiquette (« la-boucle », « roles ») ; un second
 * identifiant sur le même nœud n'est pas possible, et casser une ancre pour
 * ranger un nom serait un mauvais échange.
 *
 * LES MARGES. Une bande claire peut ne porter qu'une marge basse : le haut lui
 * vient de la bande d'avant. Mise à contre-jour, elle est entourée de vide sur
 * ses deux côtés, et une marge basse seule la collerait au bord de son propre
 * fond. Quand le conteneur n'a pas de marge verticale symétrique, le passage
 * à contre-jour lui en donne une ; quand il en a déjà une (`py-…`), il la garde,
 * ce qui laisse intacte toute bande qui l'était avant ce composant.
 */

/** Le premier jeton de classe qui pose une marge verticale : pt-, pb-, py-, avec ou sans préfixe. */
const MARGE_VERTICALE = /^(?:[a-z0-9-]+:)*p[tby]-/;
const MARGE_SYMETRIQUE = /^(?:[a-z0-9-]+:)*py-/;

function jetons(classes: string): string[] {
  return classes.split(/\s+/).filter(Boolean);
}

/** Les classes du conteneur, une fois la bande à contre-jour. */
export function interieurADeContreJour(interieur: string): string {
  const liste = jetons(interieur);
  if (liste.some((j) => MARGE_SYMETRIQUE.test(j))) return interieur;
  return [...liste.filter((j) => !MARGE_VERTICALE.test(j)), "py-14"].join(" ");
}

export function Bande({
  id,
  contraste,
  exterieur,
  fond,
  interieur,
  interieurContraste,
  avant,
  labelledby,
  children,
}: {
  /** L'identifiant du registre (config/bandes.ts) : « accueil.hero ». */
  id: string;
  /** Décidé par la page, d'après le thème : vrai pour une bande à contre-jour. */
  contraste: boolean;
  /** Les classes de la section dans les DEUX états (bordures, position). */
  exterieur?: string;
  /** Le fond de la section quand elle n'est PAS à contre-jour. */
  fond?: string;
  /** Les classes du conteneur centré : largeur, marges. */
  interieur: string;
  /** Le conteneur tel qu'il doit être à contre-jour, si la dérivation ne convient pas. */
  interieurContraste?: string;
  /** Ce qui précède le conteneur dans la section : un décor, par exemple. */
  avant?: ReactNode;
  labelledby?: string;
  children: ReactNode;
}) {
  const section = [exterieur, contraste ? "contre-jour bg-slate-950" : fond]
    .filter(Boolean)
    .join(" ");
  const conteneur = contraste
    ? (interieurContraste ?? interieurADeContreJour(interieur))
    : interieur;
  return (
    <section
      data-bande={id}
      aria-labelledby={labelledby}
      className={section || undefined}
    >
      {avant}
      <div className={conteneur}>{children}</div>
    </section>
  );
}

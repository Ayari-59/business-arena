import { cloneElement, createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { insecables } from "@/lib/typographie";

/**
 * LES INSÉCABLES AU RENDU D'UNE PAGE OU D'UN ÉPISODE (lib/typographie.ts).
 *
 * Le texte d'une page est écrit dans son JSX, avec des espaces ordinaires. `typographie` reprend
 * l'arbre que la page rend, avant qu'il parte : chaque texte, et les quelques propriétés qui se
 * lisent (un titre, une introduction, une étiquette), passent par `insecables`. Un composant
 * fonction rencontré dans l'arbre est rendu à son tour par la même fonction (`enveloppe`, une
 * seule enveloppe par composant : son identité reste stable d'un rendu à l'autre, son état aussi).
 * Le serveur et le navigateur rendent le même arbre : l'hydratation ne voit aucune différence.
 *
 * Ce qui n'est pas du texte lu reste tel quel : le code (`code`, `pre`), les scripts et les styles,
 * la valeur d'un champ de saisie, les classes, les liens. Un composant client vu depuis une page
 * serveur n'est qu'une référence : il s'enveloppe lui-même (`avecTypographie`), comme les épisodes.
 */

const BRUTS: ReadonlySet<string> = new Set(["code", "pre", "script", "style", "textarea", "kbd", "samp"]);

/** Les propriétés qui portent un texte lu, sur une balise comme sur un composant. */
const PROPRIETES_DE_TEXTE: ReadonlySet<string> = new Set([
  "title",
  "intro",
  "label",
  "description",
  "placeholder",
  "alt",
  "aria-label",
  "aria-description",
  "texte",
  "titre",
  "sousTitre",
  "surtitre",
  "hint",
  "legende",
  "consigne",
]);

type Composant = (props: Record<string, unknown>) => ReactNode | Promise<ReactNode>;

const ENVELOPPE = Symbol.for("business-arena.typographie");
const enveloppes = new WeakMap<Composant, Composant>();

/** Le composant, son rendu passé par `typographie` ; la même enveloppe à chaque appel. */
function enveloppe(c: Composant): Composant {
  if ((c as unknown as Record<symbol, boolean>)[ENVELOPPE]) return c;
  const deja = enveloppes.get(c);
  if (deja) return deja;
  const e: Composant = (props) => {
    const rendu = c(props);
    return rendu instanceof Promise ? rendu.then(typographie) : typographie(rendu);
  };
  Object.defineProperty(e, "name", { value: c.name || "Composant" });
  (e as unknown as Record<symbol, boolean>)[ENVELOPPE] = true;
  enveloppes.set(c, e);
  return e;
}

/**
 * Un composant fonction qu'on peut appeler ici. Une classe non ; une référence de composant client
 * vue du serveur non plus : c'est une fonction marquée (`$$typeof`) qui lève si on l'appelle, le
 * composant ne s'exécute que dans le navigateur (et s'y enveloppe lui-même, `avecTypographie`).
 */
const estUnComposantFonction = (t: unknown): t is Composant =>
  typeof t === "function" &&
  (t as { $$typeof?: unknown }).$$typeof === undefined &&
  !(t as { prototype?: { isReactComponent?: unknown } }).prototype?.isReactComponent;

export function typographie(n: ReactNode): ReactNode {
  if (typeof n === "string") return insecables(n);
  if (Array.isArray(n)) return n.map(typographie);
  if (!isValidElement(n)) return n;
  if (typeof n.type === "string" && BRUTS.has(n.type)) return n;
  const props = n.props as Record<string, unknown>;
  const changes: Record<string, unknown> = {};
  let change = false;
  for (const [cle, v] of Object.entries(props)) {
    if (cle === "children" || PROPRIETES_DE_TEXTE.has(cle)) {
      if (typeof v === "string" || Array.isArray(v) || isValidElement(v)) {
        const t = typographie(v as ReactNode);
        if (t !== v) {
          changes[cle] = t;
          change = true;
        }
      }
    }
  }
  if (estUnComposantFonction(n.type)) {
    const type = enveloppe(n.type);
    if (type !== n.type) return createElement(type, { ...props, ...changes, key: n.key ?? undefined });
  }
  return change ? cloneElement(n as ReactElement, changes) : n;
}

/** Le composant, son rendu passé par `typographie` : une page, un écran d'épisode. */
export function avecTypographie<P extends object>(Composant: (props: P) => ReactNode | Promise<ReactNode>) {
  return enveloppe(Composant as unknown as Composant) as unknown as (props: P) => ReactNode | Promise<ReactNode>;
}

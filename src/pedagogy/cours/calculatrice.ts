/**
 * LA CALCULATRICE DU COURS : CE QU'ELLE CALCULE.
 *
 * Demande du propriétaire (octobre 2026) : une calculatrice simple, comme au
 * lycée, dans les chapitres et les cas pratiques. Les quatre opérations, les
 * parenthèses et le pourcentage ; la virgule décimale à la française. Ce module
 * ne fait que lire et calculer une expression : l'affichage, l'historique et le
 * report dans la case de réponse sont dans le composant.
 *
 * Le pourcentage se lit comme sur une calculatrice de lycée :
 *   · après un + ou un −, il porte sur ce qui précède : 200 + 10 % = 220 ;
 *   · ailleurs, il divise par cent : 200 × 10 % = 20, et 10 % seul = 0,1.
 */

export type Resultat = { ok: true; valeur: number } | { ok: false; erreur: string };

type Jeton =
  | { t: "nombre"; v: number }
  | { t: "op"; v: "+" | "-" | "*" | "/" }
  | { t: "(" }
  | { t: ")" }
  | { t: "%" };

/** Les signes qu'on tape ou qu'on colle : ×, ÷, le moins typographique, la virgule. */
function normaliser(texte: string): string {
  return texte
    .replace(/[×xX]/g, "*")
    .replace(/[÷:]/g, "/")
    .replace(/[−–]/g, "-")
    .replace(/\s+/g, "")
    .replace(/,/g, ".");
}

function decouper(texte: string): Jeton[] | null {
  const jetons: Jeton[] = [];
  let i = 0;
  while (i < texte.length) {
    const c = texte[i]!;
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < texte.length && /[0-9.]/.test(texte[j]!)) j++;
      const brut = texte.slice(i, j);
      if ((brut.match(/\./g) ?? []).length > 1 || brut === ".") return null;
      jetons.push({ t: "nombre", v: Number(brut) });
      i = j;
    } else if ("+-*/".includes(c)) {
      jetons.push({ t: "op", v: c as "+" | "-" | "*" | "/" });
      i++;
    } else if (c === "(" || c === ")" || c === "%") {
      jetons.push({ t: c });
      i++;
    } else return null;
  }
  return jetons;
}

/**
 * Une descente récursive, la priorité usuelle : les parenthèses, puis × et ÷,
 * puis + et −. Le moins devant un nombre ou une parenthèse est un signe.
 */
function lire(jetons: Jeton[]): number {
  let k = 0;
  const voir = () => jetons[k];
  const erreur = () => {
    throw new Error("expression");
  };

  function facteur(): number {
    const j = voir();
    if (!j) return erreur();
    if (j.t === "op" && (j.v === "-" || j.v === "+")) {
      k++;
      const f = facteur();
      return j.v === "-" ? -f : f;
    }
    let v: number;
    if (j.t === "nombre") {
      k++;
      v = j.v;
    } else if (j.t === "(") {
      k++;
      v = somme();
      if (voir()?.t !== ")") return erreur();
      k++;
    } else return erreur();
    return v;
  }

  /** Un facteur suivi d'un %, hors d'une somme : divisé par cent. */
  function facteurEnPourcentage(): number {
    const v = facteur();
    if (voir()?.t === "%") {
      k++;
      return v / 100;
    }
    return v;
  }

  function produit(): number {
    let v = facteurEnPourcentage();
    for (;;) {
      const j = voir();
      if (j?.t !== "op" || (j.v !== "*" && j.v !== "/")) return v;
      k++;
      const d = facteurEnPourcentage();
      if (j.v === "/") {
        if (d === 0) throw new Error("division");
        v = v / d;
      } else v = v * d;
    }
  }

  function somme(): number {
    let v = produit();
    for (;;) {
      const j = voir();
      if (j?.t !== "op" || (j.v !== "+" && j.v !== "-")) return v;
      k++;
      // « a + b % » : le terme lu vaut déjà b ÷ 100 ; s'il finit par % sans × ni ÷,
      // le pourcentage porte sur a, et le terme devient a × b ÷ 100.
      const debut = k;
      const b = produit();
      const seul = !jetons.slice(debut, k - 1).some((x) => x.t === "op" && (x.v === "*" || x.v === "/"));
      const pourcentage = jetons[k - 1]?.t === "%" && seul;
      const terme = pourcentage ? v * b : b;
      v = j.v === "+" ? v + terme : v - terme;
    }
  }

  const v = somme();
  if (k !== jetons.length) return erreur();
  return v;
}

/** Arrondi d'affichage : douze chiffres significatifs, ce qui efface les 0,1 + 0,2 = 0,30000000000000004. */
const propre = (x: number) => Number(x.toPrecision(12));

export function calculer(expression: string): Resultat {
  const texte = normaliser(expression);
  if (texte === "") return { ok: false, erreur: "Rien à calculer" };
  const jetons = decouper(texte);
  if (!jetons) return { ok: false, erreur: "Un nombre ou un signe mal écrit" };
  try {
    const v = lire(jetons);
    if (!Number.isFinite(v)) return { ok: false, erreur: "Résultat impossible" };
    return { ok: true, valeur: propre(v) };
  } catch (e) {
    return { ok: false, erreur: (e as Error).message === "division" ? "Division par zéro" : "Calcul incomplet" };
  }
}

/** Le résultat écrit à la française, comme dans les cases de réponse : 1234,5 (sans espace de milliers). */
export const enSaisie = (x: number) => String(propre(x)).replace(".", ",");

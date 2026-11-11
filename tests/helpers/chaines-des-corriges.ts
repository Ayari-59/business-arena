/**
 * LES CHAÎNES DE CALCUL DES CORRIGÉS, REFAITES SUR LES NOMBRES AFFICHÉS (audit pédagogique du
 * 11 novembre 2026, P0-1 et P1-1 ; c'est le script `chaines.py` de l'audit, porté ici et précisé).
 *
 * Un corrigé écrit ses calculs en clair : « 150 heures ÷ 0,13 × 3 mois = 3 600 ; 7 200 + 3 600 =
 * 10 800 ». Cet outil les relit comme l'élève, sur les nombres qu'il a sous les yeux, et refait chaque
 * égalité « a op b = c ». Il sert deux gardes :
 *
 *  · LES ÉGALITÉS DES CORRIGÉS (tests/architecture/egalites-des-corriges.test.ts) : chaque égalité tient-
 *    elle sur les nombres affichés, au dernier chiffre affiché près ? « 150 ÷ 0,13 × 3 = 3 600 » ne tient
 *    pas (3 461,54) : la donnée vaut 0,125, mais elle était écrite 0,13 ;
 *  · LES DEUX CHEMINS (tests/architecture/deux-chemins.test.ts) : l'élève qui garde tous les chiffres et
 *    n'arrondit qu'à la fin est-il accepté ? Un résultat affiché arrondi (« 1,88 ») qui revient dans un
 *    calcul suivant de la même étape y est remplacé par sa valeur exacte (le calcul qui l'a produit,
 *    refait sans arrondi) ; le résultat final, arrondi au centième à la fin, est comparé aux attendus.
 *
 * CE QUI SE LIT. Une égalité a pour membre de gauche la plus longue fin de texte qui se calcule (des
 * nombres, leurs unités « € », « % », « points », les mots qui les nomment, « × », « ÷ », « + », « − »,
 * des parenthèses), et pour membre de droite le nombre qui suit le signe « = ». Un membre de gauche qui
 * n'est pas entier (précédé d'un opérateur, d'une parenthèse fermée, d'une fonction comme « ln » ou
 * « √ », ou d'un nombre) ne se juge pas : l'outil n'a pas lu tout le calcul. Un membre de droite qui
 * continue le calcul (« = 3 500 jeux × 19,80 € = 69 300 € ») ou le réécrit (« = 84 975 € ÷ 60,40 € »)
 * est une étape de la chaîne : l'égalité suivante se juge sur lui. « ≈ » ne se juge pas.
 *
 * LES POURCENTAGES se lisent des deux façons qu'un corrigé emploie : en fraction (1 875 € × 22 % =
 * 412,50 €) ou en points (24,42 % − 26,40 % = −1,98 points ; 60 % ÷ (100 − 60 %) × 100 = 150 %). Une
 * égalité tient quand l'une des lectures tient.
 *
 * AU DERNIER CHIFFRE AFFICHÉ PRÈS. Le résultat écrit avec d décimales est juste à 0,6 unité de sa
 * dernière décimale (la moitié, plus ce qu'un résultat intermédiaire arrondi peut propager), et à une
 * unité quand le corrigé dit qu'il arrondit dans un sens (« au centime inférieur », « arrondi »,
 * « à l'unité »).
 */

export type UniteLue = "€" | "%" | "pts" | "‰" | "";

/** Ce que vaut une expression : les pourcentages lus en fraction (f) ou en points (p), affichée ou exacte (fx, px). */
interface Valeur {
  f: number;
  p: number;
  fx: number;
  px: number;
  /** L'incertitude que portent les coefficients écrits au millième ou au-delà (0,9174), propagée : en fraction et en points. */
  ef: number;
  ep: number;
  nombres: number;
  operateurs: number;
}

export interface NombreLu {
  texte: string;
  valeur: number;
  unite: UniteLue;
  decimales: number;
  debut: number;
  fin: number;
}

/** Les résultats arrondis de l'étape déjà lus, par leur texte (« 1,88 ») : leur valeur exacte, dans l'unité affichée, sans signe. */
export type Substitutions = Map<string, number>;

const ESPACES = /[    ]/g;
const MOTS_MATHEMATIQUES = /^(carré|carrés|cube|puissance|racine|exposant|ln|log|exp|sqrt|e)$/i;
const PREPOSITIONS = /^(à|a|de|des|du|d['’]|en|au|aux|sur|par|pour|avec|sans|entre|dont|soit|et|ou)$/i;
/** Les opérations dites en mots : ce qui les suit n'est qu'une partie du calcul. */
const OPERATIONS_EN_MOTS = /^(plus|moins|fois|divisé|divisés|multiplié|multipliés|retranché|ajouté)$/i;
const SENS_D_ARRONDI = /inférieur|supérieur|au-dessus|au-dessous|au dessus|au dessous|par excès|par défaut|arrondi|à l['’]unité|au centime/i;

/** Le texte d'un corrigé, ses espaces ramenés à une seule forme ; « N + 1 » devient un mot (« N+1 »). */
export function normaliserLeCorrige(t: string): string {
  return t.replace(ESPACES, " ").replace(/\bN\s*([+−-])\s*(\d+)\b/g, "N$1$2");
}

const NOMBRE = /(?:\d{1,3}(?: \d{3})+|\d+)(?:,\d+)?/y;
const MOT = /[\p{L}][\p{L}\d'’+−-]*/uy;
const PARENTHESE_DE_MOTS = /\([\p{L}\s'’,.\-]+\)/uy;
const UNITE = /\s*(€|%|‰)/y;
const POINTS = /\s+points?(?![\p{L}])/uy;

const lettre = (c: string | undefined) => c !== undefined && /\p{L}/u.test(c);
const chiffre = (c: string | undefined) => c !== undefined && c >= "0" && c <= "9";

/** Un nombre écrit à la française, lu : « 1 234,56 » donne 1234,56. */
export const lireNombreFrancais = (t: string) => Number(t.replace(/ /g, "").replace(",", "."));

/** Un analyseur d'expression sur une tranche de texte [debut, fin). */
class Lecture {
  i: number;
  /** Le premier nombre lu. */
  tete: NombreLu | null = null;
  constructor(
    private readonly s: string,
    debut: number,
    private readonly fin: number,
    private readonly subst: Substitutions,
  ) {
    this.i = debut;
  }

  private espaces(): number {
    const d = this.i;
    while (this.i < this.fin && this.s[this.i] === " ") this.i++;
    return this.i - d;
  }

  private colle(re: RegExp): string | null {
    re.lastIndex = this.i;
    const m = re.exec(this.s);
    if (!m || m.index !== this.i || this.i + m[0].length > this.fin) return null;
    return m[0];
  }

  /** L'expression qui occupe toute la tranche ; null si la tranche ne se lit pas jusqu'au bout. */
  toute(): Valeur | null {
    const v = this.expression();
    if (!v) return null;
    this.espaces();
    return this.i === this.fin ? v : null;
  }

  private expression(): Valeur | null {
    let g = this.terme(false);
    if (!g) return null;
    for (;;) {
      const avant = this.i;
      if (this.espaces() === 0) break;
      const op = this.s[this.i];
      if ((op === "+" || op === "−" || op === "-") && this.s[this.i + 1] === " ") {
        this.i++;
        this.espaces();
        const d = this.terme(true);
        if (!d) return null;
        const k = op === "+" ? 1 : -1;
        g = { f: g.f + k * d.f, p: g.p + k * d.p, fx: g.fx + k * d.fx, px: g.px + k * d.px, ef: g.ef + d.ef, ep: g.ep + d.ep, nombres: g.nombres + d.nombres, operateurs: g.operateurs + d.operateurs + 1 };
      } else {
        this.i = avant;
        break;
      }
    }
    return g;
  }

  private terme(apresOperateur: boolean): Valeur | null {
    let g = this.unaire(apresOperateur);
    if (!g) return null;
    for (;;) {
      const avant = this.i;
      this.espaces();
      const op = this.s[this.i];
      if (op === "×" || op === "÷") {
        this.i++;
        this.espaces();
        const d = this.unaire(true);
        if (!d) return null;
        const fois = op === "×";
        const de = fois ? (a: number, b: number) => a * b : (a: number, b: number) => a / b;
        // L'incertitude d'un produit ou d'un quotient, au premier ordre.
        const err = (a: number, ea: number, b: number, eb: number) => (fois ? Math.abs(a) * eb + Math.abs(b) * ea + ea * eb : (Math.abs(a) * eb + Math.abs(b) * ea) / Math.max(1e-12, b * b));
        g = {
          f: de(g.f, d.f),
          p: de(g.p, d.p),
          fx: de(g.fx, d.fx),
          px: de(g.px, d.px),
          ef: err(g.f, g.ef, d.f, d.ef),
          ep: err(g.p, g.ep, d.p, d.ep),
          nombres: g.nombres + d.nombres,
          operateurs: g.operateurs + d.operateurs + 1,
        };
      } else {
        this.i = avant;
        break;
      }
    }
    return g;
  }

  private unaire(apresOperateur: boolean): Valeur | null {
    // Des mots peuvent nommer le nombre qui suit un opérateur : « − créance 22 656 € », « − équipement hors
    // taxes 60 000 € ». Trois au plus, et pas une préposition juste avant le nombre : dans « − la valeur
    // actuelle des décaissements à 4,50 % », le nombre n'est pas ce qu'on retranche.
    if (apresOperateur) {
      const avant = this.i;
      const mots: string[] = [];
      for (;;) {
        const m = this.colle(MOT);
        if (!m || MOTS_MATHEMATIQUES.test(m)) break;
        this.i += m.length;
        mots.push(m);
        if (this.espaces() === 0) break;
      }
      if (mots.length > 0 && (!chiffre(this.s[this.i]) || mots.length > 3 || PREPOSITIONS.test(mots.at(-1)!))) this.i = avant;
    }
    const c = this.s[this.i];
    if ((c === "−" || c === "-") && (chiffre(this.s[this.i + 1]) || this.s[this.i + 1] === "(")) {
      this.i++;
      const v = this.unaire(false);
      return v && { ...v, f: -v.f, p: -v.p, fx: -v.fx, px: -v.px };
    }
    return this.primaire();
  }

  private primaire(): Valeur | null {
    const c = this.s[this.i];
    let v: Valeur;
    // Deux fonctions que les corrigés écrivent : le logarithme népérien et la racine carrée.
    const fonction = this.s.startsWith("ln(", this.i) ? "ln" : c === "√" && this.s[this.i + 1] === "(" ? "√" : null;
    if (fonction) {
      this.i += fonction === "ln" ? 2 : 1;
      const x = this.primaire();
      if (!x) return null;
      const ln = fonction === "ln";
      const f = (a: number) => (ln ? Math.log(a) : Math.sqrt(a));
      const e = (a: number, ea: number) => (ln ? ea / Math.max(1e-12, Math.abs(a)) : ea / Math.max(1e-12, 2 * Math.sqrt(Math.abs(a))));
      return { f: f(x.f), p: f(x.p), fx: f(x.fx), px: f(x.px), ef: e(x.f, x.ef), ep: e(x.p, x.ep), nombres: x.nombres, operateurs: x.operateurs + 1 };
    }
    if (c === "(") {
      this.i++;
      this.espaces();
      const dedans = this.expression();
      if (!dedans) return null;
      this.espaces();
      if (this.s[this.i] !== ")") return null;
      this.i++;
      v = dedans;
    } else if (c === "½") {
      this.i++;
      v = { f: 0.5, p: 0.5, fx: 0.5, px: 0.5, ef: 0, ep: 0, nombres: 1, operateurs: 0 };
    } else {
      const n = this.nombre();
      if (!n) return null;
      this.tete ??= n;
      const x = this.subst.get(n.texte) ?? n.valeur;
      const parCent = n.unite === "%" || n.unite === "pts" ? 100 : n.unite === "‰" ? 1000 : 1;
      // Un coefficient écrit au millième ou au-delà (un facteur d'actualisation, 0,9174) est arrondi à sa dernière décimale.
      const e = n.decimales >= 3 ? 0.5 * 10 ** -n.decimales : 0;
      v = { f: n.valeur / parCent, p: n.valeur, fx: x / parCent, px: x, ef: e / parCent, ep: e, nombres: 1, operateurs: 0 };
    }
    // Les mots qui suivent un nombre le nomment : « 150 heures », « 413 000 € HT », « (TTC) ».
    for (;;) {
      const avant = this.i;
      if (this.espaces() === 0) break;
      const m = this.colle(MOT);
      if (m && !MOTS_MATHEMATIQUES.test(m)) {
        this.i += m.length;
        continue;
      }
      const p = this.colle(PARENTHESE_DE_MOTS);
      if (p) {
        this.i += p.length;
        continue;
      }
      this.i = avant;
      break;
    }
    return v;
  }

  /** Un nombre à la française et son unité ; null si ce n'en est pas un (« 1er », « T2 »). */
  nombre(): NombreLu | null {
    const avant = this.s[this.i - 1];
    if (lettre(avant) || chiffre(avant) || avant === ",") return null;
    const m = this.colle(NOMBRE);
    if (!m) return null;
    const debut = this.i;
    this.i += m.length;
    if (lettre(this.s[this.i]) || chiffre(this.s[this.i])) return null;
    let unite: UniteLue = "";
    const u = this.colle(UNITE);
    if (u) {
      unite = u.trim() as UniteLue;
      this.i += u.length;
    } else {
      const p = this.colle(POINTS);
      if (p) {
        unite = "pts";
        this.i += p.length;
      }
    }
    return { texte: m, valeur: lireNombreFrancais(m), unite, decimales: m.includes(",") ? m.split(",")[1]!.length : 0, debut, fin: this.i };
  }
}

/** Le membre de gauche d'une égalité : la plus longue fin de `s[debut, fin)` qui se calcule. */
function membreDeGauche(s: string, debut: number, fin: number, subst: Substitutions): { valeur: Valeur; depart: number; tete: NombreLu | null } | null {
  for (let k = debut; k < fin; k++) {
    const c = s[k]!;
    const fonction = s.startsWith("ln(", k) || (c === "√" && s[k + 1] === "(");
    if (!(chiffre(c) || c === "(" || c === "−" || c === "-" || c === "½" || fonction)) continue;
    if (fonction && lettre(s[k - 1])) continue;
    const avant = s[k - 1];
    if (chiffre(avant) || avant === ",") continue;
    if (chiffre(c) && lettre(avant)) continue;
    if ((c === "−" || c === "-") && !(chiffre(s[k + 1]) || s[k + 1] === "(")) continue;
    const l = new Lecture(s, k, fin, subst);
    const v = l.toute();
    if (!v || v.nombres < 2 || v.operateurs < 1) continue;
    return { valeur: v, depart: k, tete: l.tete };
  }
  return null;
}

/**
 * Le membre de gauche est-il entier ? Non quand il est collé à ce qui le précède (« ln(1 + … »,
 * « √(2 × … »), ni quand, passés les mots qui le précèdent (« soit », « reste à provisionner »), il
 * vient après un opérateur, un nombre ou une parenthèse fermée : l'outil n'a lu que la fin du calcul.
 */
function estEntier(s: string, debut: number, k: number): boolean {
  if (k <= debut) return true;
  const colle = s[k - 1]!;
  if (colle !== " " && !/[:;,«(\[]/.test(colle)) return false;
  let j = k;
  for (;;) {
    while (j > debut && s[j - 1] === " ") j--;
    let m = j;
    while (m > debut && /[\p{L}\d'’]/u.test(s[m - 1]!)) m--;
    if (m === j || !lettre(s[m])) break;
    if (OPERATIONS_EN_MOTS.test(s.slice(m, j))) return false;
    j = m;
  }
  if (j <= debut) return true;
  const avant = s[j - 1]!;
  // Un opérateur, une parenthèse fermée, un nombre ou son unité : le calcul commençait avant.
  return !("×÷+−-^/√)€%‰".includes(avant) || chiffre(avant));
}

/** Le nombre qui ouvre le membre de droite, son signe, et si le membre continue le calcul. */
function membreDeDroite(s: string, debut: number, fin: number): { nombre: NombreLu; signe: number; continue: boolean; apres: string } | null {
  let i = debut;
  while (i < fin && s[i] === " ") i++;
  let signe = 1;
  if ((s[i] === "−" || s[i] === "-") && chiffre(s[i + 1])) {
    signe = -1;
    i++;
  } else if (s[i] === "+" && chiffre(s[i + 1])) i++;
  const lecture = new Lecture(s, i, fin, new Map());
  const n = lecture.nombre();
  if (!n) return null;
  // Le membre continue-t-il le calcul ? Des mots peut-être, puis un opérateur.
  let j = n.fin;
  for (;;) {
    let k = j;
    while (k < fin && s[k] === " ") k++;
    if (k === j) break;
    MOT.lastIndex = k;
    const m = MOT.exec(s);
    if (m && m.index === k && !MOTS_MATHEMATIQUES.test(m[0])) {
      j = k + m[0].length;
      continue;
    }
    break;
  }
  let k = j;
  while (k < fin && s[k] === " ") k++;
  const op = s[k];
  const continue_ = op === "×" || op === "÷" || ((op === "+" || op === "−" || op === "-") && s[k - 1] === " " && s[k + 1] === " ");
  return { nombre: n, signe, continue: continue_, apres: s.slice(n.fin, Math.min(fin, n.fin + 60)) };
}

/** Une égalité lue dans un corrigé. */
export interface Egalite {
  /** Le membre de gauche, tel qu'écrit. */
  gauche: string;
  /** Le résultat écrit, avec son signe, et son texte. */
  droite: number;
  droiteEcrite: string;
  decimales: number;
  /** Le membre de gauche refait sur les nombres affichés, et sans arrondi intermédiaire, dans l'unité du résultat. */
  refait: number;
  exact: number;
  /** L'égalité tient, au dernier chiffre affiché près ; l'écart qu'elle admet. */
  tient: boolean;
  tolerance: number;
}

const enPourcent = (u: UniteLue) => u === "%" || u === "pts";

/** Les lectures d'une valeur dans l'unité d'un résultat : en fraction, en points, et × 100 pour un pourcentage. */
function lectures(v: Valeur, pourcent: boolean): { affiche: number; exact: number; incertitude: number }[] {
  const l = [
    { affiche: v.f, exact: v.fx, incertitude: v.ef },
    { affiche: v.p, exact: v.px, incertitude: v.ep },
  ];
  return pourcent ? [...l, { affiche: v.f * 100, exact: v.fx * 100, incertitude: v.ef * 100 }, { affiche: v.p * 100, exact: v.px * 100, incertitude: v.ep * 100 }] : l;
}

const plusProche = (v: Valeur, cible: number, pourcent: boolean) =>
  lectures(v, pourcent).reduce((a, b) => (Math.abs(b.affiche - cible) - b.incertitude < Math.abs(a.affiche - cible) - a.incertitude ? b : a));

const relatif = (a: number, b: number) => Math.abs(a - b) / Math.max(1e-9, Math.abs(a), Math.abs(b));

/**
 * LES ÉGALITÉS D'UN CORRIGÉ, dans l'ordre, refaites sur les nombres affichés. `subst` porte les résultats
 * arrondis déjà lus dans l'étape, et en reçoit de nouveaux : il ne change que la valeur exacte.
 */
export function egalitesDuCorrige(calcul: string, subst: Substitutions = new Map()): Egalite[] {
  const s = normaliserLeCorrige(calcul);
  const signes = [...s.matchAll(/[=≈]/g)].map((m) => ({ pos: m.index!, approche: m[0] === "≈" }));
  const out: Egalite[] = [];
  // Quand un membre de droite continue ou réécrit le calcul : ce que valait le membre de gauche d'avant.
  let heritage: Valeur | null = null;
  for (let j = 0; j < signes.length; j++) {
    const debutGauche = j === 0 ? 0 : signes[j - 1]!.pos + 1;
    const finGauche = signes[j]!.pos;
    const finDroite = j + 1 < signes.length ? signes[j + 1]!.pos : s.length;
    const h = heritage;
    heritage = null;
    let g = membreDeGauche(s, debutGauche, finGauche, subst);
    if (!g) continue;
    let valeur = g.valeur;
    const toutLeMembre = s.slice(debutGauche, g.depart).trim() === "";
    if (h && toutLeMembre && g.tete) {
      const t = g.tete;
      const l = plusProche(h, t.valeur, enPourcent(t.unite));
      if (Math.abs(Math.abs(l.affiche) - t.valeur) <= 0.6 * 10 ** -t.decimales + l.incertitude + 1e-9) {
        // Il continue (« = 3 500 jeux × 19,80 € ») : sa tête est le résultat d'avant.
        if (t.decimales >= 1 || t.unite !== "") {
          subst.set(t.texte, Math.abs(l.exact));
          g = membreDeGauche(s, debutGauche, finGauche, subst) ?? g;
          valeur = g.valeur;
        }
      } else {
        // Il réécrit (« = 84 975 € ÷ 60,40 € ») : il garde la valeur exacte de ce qu'il réécrit.
        valeur = {
          ...valeur,
          fx: relatif(h.f, valeur.f) <= 0.01 ? h.fx : valeur.fx,
          px: relatif(h.p, valeur.p) <= 0.01 ? h.px : valeur.px,
        };
      }
    }
    if (!estEntier(s, debutGauche, g.depart)) continue;
    const d = membreDeDroite(s, finGauche + 1, finDroite);
    if (!d) continue;
    if (d.continue) {
      heritage = valeur;
      continue;
    }
    if (signes[j]!.approche) continue;
    const droite = d.signe * d.nombre.valeur;
    const l = plusProche(valeur, droite, enPourcent(d.nombre.unite));
    const tolerance = (SENS_D_ARRONDI.test(d.apres) ? 1 : 0.6) * 10 ** -d.nombre.decimales + l.incertitude + 1e-9;
    const tient = Math.abs(l.affiche - droite) <= tolerance;
    // Un résultat arrondi se reprend avec tous ses chiffres : celui qui a des décimales, et un montant ou un
    // taux écrit sans décimales (« 8 500 € » est 8 500,00 €). Une quantité entière s'arrondit par la méthode.
    if (tient && (d.nombre.decimales >= 1 || d.nombre.unite !== "")) subst.set(d.nombre.texte, Math.abs(l.exact));
    out.push({
      gauche: s.slice(g.depart, finGauche).trim(),
      droite,
      droiteEcrite: s.slice(d.nombre.debut, d.nombre.fin).trim(),
      decimales: d.nombre.decimales,
      refait: l.affiche,
      exact: l.exact,
      tient,
      tolerance,
    });
  }
  return out;
}

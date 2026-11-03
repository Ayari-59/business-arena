import { lireNombre, montantEcrit } from "./correcteur";

/**
 * LE TABLEAU À COMPLÉTER : UNE ÉTAPE OÙ L'ÉLÈVE REMPLIT LES CASES D'UN TABLEAU.
 *
 * Demande du propriétaire (novembre 2026) : le contrôle de gestion se fait en tableaux (le tableau
 * de répartition des charges indirectes, la fiche de stock, le tableau de passage d'un résultat à
 * l'autre) ; l'élève les remplit, comme à l'examen. Un tableau a des lignes et des colonnes ; une
 * cellule est donnée, à saisir, ou vide. Les totaux se déclarent : la colonne de total d'une ligne
 * (`colonneDeTotal`), et les lignes de total d'une colonne (`totalDe`), qui peuvent retrancher
 * des lignes (un stock final : le disponible moins les sorties).
 *
 * CE MODULE EST PUR ET SANS CORRIGÉ PROPRE : le tableau (les valeurs justes comprises) arrive du
 * serveur avec l'étape, comme les champs d'une étape de montants (chapitre-servi.ts) ; la correction
 * se fait ici, au navigateur, pour l'élève qui a droit au chapitre.
 *
 * LA CORRECTION, CELLULE PAR CELLULE. Chaque cellule à saisir est juste quand le nombre lu tombe
 * dans sa tolérance (le centime par défaut, ou celle de la cellule ou du tableau). Une cellule fausse
 * reçoit une explication, sans la réponse : vide, illisible, de signe inverse, un total qui ne fait
 * pas la somme de ce que l'élève a écrit, ou un total qui suit bien ses cellules mais dont une
 * cellule est fausse, ou l'indice de la cellule. La garde `incoherencesDuTableau` vérifie, sur
 * chaque tableau du cours, que les valeurs justes satisfont elles-mêmes tous les totaux déclarés.
 */

/** Une cellule : une valeur donnée, une valeur à saisir, ou une cellule vide (`valeur` nulle). */
export interface CelluleACompleter {
  /** La valeur juste de la cellule ; nulle : une cellule vide, sans rien à lire ni à saisir. */
  valeur: number | null;
  /** À saisir par l'élève. Absent : la valeur est donnée, écrite dans la cellule. */
  saisir?: boolean;
  /** Ce qu'une cellule donnée montre à la place de sa valeur (« 100 € d'achats », « 15 % »). */
  texte?: string;
  /** L'unité d'une valeur qui n'est pas en euros (« jeux », « UO ») : sans elle, des euros. */
  unite?: string;
  /** Comment la cellule se calcule : se lit dans la correction, une fois l'étape réussie. */
  calcul?: string;
  /** Une piste pour une cellule fausse, sans la réponse : « le prix du lot × ses quantités ». */
  indice?: string;
  /** L'écart admis, en plus ou en moins. Absent : celui du tableau, sinon le centime. */
  tolerance?: number;
  /** La cellule ne compte dans aucun total (un coût unitaire dans une ligne de total). */
  horsTotal?: boolean;
}

export interface LigneACompleter {
  libelle: string;
  cellules: readonly CelluleACompleter[];
  /**
   * La ligne est un total, colonne par colonne : les lignes `plus` s'ajoutent, les lignes `moins` se
   * retranchent (par leur indice dans le tableau). Ses cellules vides ou hors total n'en sont pas.
   */
  totalDe?: { plus: readonly number[]; moins?: readonly number[] };
  /** Une ligne de total ou de résultat, en gras. */
  fort?: boolean;
}

export interface TableauACompleter {
  titre: string;
  colonnes: readonly string[];
  lignes: readonly LigneACompleter[];
  /**
   * La colonne de total : dans chaque ligne où elle n'est ni vide ni hors total, elle fait la somme
   * des autres cellules de la ligne (vides et hors total exclues).
   */
  colonneDeTotal?: number;
  /** L'écart admis par défaut dans tout le tableau. Absent : le centime. */
  tolerance?: number;
}

/** Ce que l'élève a écrit, cellule par cellule, sous la clé `cleDeCellule`. */
export type SaisiesDuTableau = Readonly<Record<string, string>>;

export const cleDeCellule = (ligne: number, colonne: number) => `${ligne}:${colonne}`;

/** Le nom d'une cellule, pour le lecteur d'écran et les remarques : « Loyer, Entretien ». */
export const libelleDeCellule = (t: TableauACompleter, ligne: number, colonne: number) => `${t.lignes[ligne]!.libelle}, ${t.colonnes[colonne]!}`;

const toleranceDe = (t: TableauACompleter, c: CelluleACompleter) => (c.tolerance ?? t.tolerance ?? 0.01) + 1e-9;

/** Un nombre écrit à la française, le signe moins typographique. */
export function nombreEcrit(x: number, chiffres = 4): string {
  const v = Math.abs(x) < 1e-9 ? 0 : x;
  return v.toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−");
}

/** Ce qu'une cellule montre quand sa valeur est écrite : son texte, sa valeur dans son unité, ou un montant. */
export function valeurEcrite(c: CelluleACompleter): string {
  if (c.texte !== undefined && !c.saisir) return c.texte;
  if (c.valeur === null) return "";
  return c.unite ? `${nombreEcrit(c.valeur)} ${c.unite}` : montantEcrit(c.valeur).replace(/^-/, "−");
}

/** La valeur juste d'une cellule à saisir, telle qu'on la tape : « 1234,5 », « −80 ». */
export const valeurASaisir = (x: number) => String(Math.abs(x) < 1e-9 ? 0 : Math.round(x * 1e4) / 1e4).replace(".", ",").replace(/^-/, "−");

/** Les cellules à saisir, dans l'ordre de lecture (ligne par ligne). */
export function cellulesASaisir(t: TableauACompleter): { ligne: number; colonne: number; cellule: CelluleACompleter }[] {
  return t.lignes.flatMap((l, i) => l.cellules.flatMap((cellule, j) => (cellule.saisir ? [{ ligne: i, colonne: j, cellule }] : [])));
}

/** Les solutions, pour remplir le tableau quand l'élève demande la correction. */
export function solutionsDuTableau(t: TableauACompleter): Record<string, string> {
  return Object.fromEntries(cellulesASaisir(t).map(({ ligne, colonne, cellule }) => [cleDeCellule(ligne, colonne), valeurASaisir(cellule.valeur ?? 0)]));
}

/** Un total : la cellule qu'il remplit, ce qui s'y ajoute et ce qui s'en retranche, et son sens. */
export interface TotalDuTableau {
  ligne: number;
  colonne: number;
  sens: "ligne" | "colonne";
  plus: readonly [number, number][];
  moins: readonly [number, number][];
}

const compte = (c: CelluleACompleter | undefined) => c !== undefined && c.valeur !== null && !c.horsTotal;

/** Tous les totaux du tableau : ceux de la colonne de total, puis ceux des lignes de total. */
export function totauxDuTableau(t: TableauACompleter): TotalDuTableau[] {
  const totaux: TotalDuTableau[] = [];
  const k = t.colonneDeTotal;
  t.lignes.forEach((l, i) => {
    if (k !== undefined && compte(l.cellules[k])) {
      const plus = l.cellules.flatMap((c, j) => (j !== k && compte(c) ? [[i, j] as [number, number]] : []));
      totaux.push({ ligne: i, colonne: k, sens: "ligne", plus, moins: [] });
    }
    if (l.totalDe) {
      const { plus, moins = [] } = l.totalDe;
      l.cellules.forEach((c, j) => {
        if (!compte(c)) return;
        const de = (lignes: readonly number[]) => lignes.flatMap((r) => (compte(t.lignes[r]?.cellules[j]) ? [[r, j] as [number, number]] : []));
        totaux.push({ ligne: i, colonne: j, sens: "colonne", plus: de(plus), moins: de(moins) });
      });
    }
  });
  return totaux;
}

const sommeDe = (total: TotalDuTableau, valeur: (l: number, c: number) => number | null) => {
  let s = 0;
  for (const [l, c] of total.plus) {
    const v = valeur(l, c);
    if (v === null) return null;
    s += v;
  }
  for (const [l, c] of total.moins) {
    const v = valeur(l, c);
    if (v === null) return null;
    s -= v;
  }
  return s;
};

/**
 * LA GARDE DU TABLEAU : ce qu'un tableau du cours ne doit jamais être. Chaque ligne a une cellule par
 * colonne ; les libellés des lignes et des colonnes sont uniques (ils nomment les cellules) ; une
 * cellule à saisir a une valeur finie et une explication ; une cellule donnée se lit ; et les
 * valeurs justes font chaque total déclaré, dans la tolérance de sa cellule.
 */
export function incoherencesDuTableau(t: TableauACompleter): string[] {
  const fautes: string[] = [];
  if (new Set(t.colonnes).size !== t.colonnes.length) fautes.push("deux colonnes portent le même nom");
  if (new Set(t.lignes.map((l) => l.libelle)).size !== t.lignes.length) fautes.push("deux lignes portent le même nom");
  if (t.colonneDeTotal !== undefined && (t.colonneDeTotal < 0 || t.colonneDeTotal >= t.colonnes.length)) fautes.push("la colonne de total n'existe pas");
  t.lignes.forEach((l, i) => {
    if (l.cellules.length !== t.colonnes.length) fautes.push(`${l.libelle} : ${l.cellules.length} cellules pour ${t.colonnes.length} colonnes`);
    for (const r of [...(l.totalDe?.plus ?? []), ...(l.totalDe?.moins ?? [])]) {
      if (r === i || !t.lignes[r]) fautes.push(`${l.libelle} : la ligne ${r} de son total n'existe pas`);
    }
    l.cellules.forEach((c, j) => {
      const nom = `${l.libelle}, ${t.colonnes[j] ?? j}`;
      if (c.saisir && (c.valeur === null || !Number.isFinite(c.valeur))) fautes.push(`${nom} : une cellule à saisir sans valeur`);
      if (c.saisir && !c.calcul) fautes.push(`${nom} : une cellule à saisir sans son calcul`);
      if (c.valeur !== null && !Number.isFinite(c.valeur)) fautes.push(`${nom} : une valeur qui n'est pas un nombre`);
      if (!c.saisir && c.texte === "") fautes.push(`${nom} : un texte vide`);
    });
  });
  if (cellulesASaisir(t).length === 0) fautes.push("aucune cellule à saisir");
  for (const total of totauxDuTableau(t)) {
    const cellule = t.lignes[total.ligne]!.cellules[total.colonne]!;
    const somme = sommeDe(total, (l, c) => t.lignes[l]!.cellules[c]!.valeur);
    if (somme === null || Math.abs(somme - cellule.valeur!) > toleranceDe(t, cellule)) {
      fautes.push(`${libelleDeCellule(t, total.ligne, total.colonne)} : ${nombreEcrit(cellule.valeur!)} ne fait pas son total (${somme === null ? "illisible" : nombreEcrit(Math.round(somme * 100) / 100)})`);
    }
  }
  return fautes;
}

/** Ce que la correction dit d'une cellule à saisir. */
export interface CelluleCorrigee {
  ligne: number;
  colonne: number;
  juste: boolean;
  /** Ce qui ne va pas, en une phrase, sans la réponse ; nul quand la cellule est juste. */
  remarque: string | null;
}

export interface CorrectionDuTableau {
  juste: boolean;
  cellules: CelluleCorrigee[];
  /** Le nombre de cellules fausses ou vides. */
  fausses: number;
}

/** « à » devant un indice, contracté comme en français. */
const aDevant = (indice: string) =>
  indice.startsWith("le ") ? `au ${indice.slice(3)}` : indice.startsWith("les ") ? `aux ${indice.slice(4)}` : `à ${indice}`;

/**
 * Corrige le tableau, cellule par cellule. Une cellule de total fausse se lit d'abord contre ce que
 * l'élève a lui-même écrit : un total qui ne fait pas la somme de ses cellules n'est pas la même
 * erreur qu'un total juste sur une cellule fausse.
 */
export function corrigerLeTableau(t: TableauACompleter, saisies: SaisiesDuTableau): CorrectionDuTableau {
  const lu = new Map<string, number | null>();
  for (const { ligne, colonne } of cellulesASaisir(t)) {
    const x = lireNombre(saisies[cleDeCellule(ligne, colonne)] ?? "");
    lu.set(cleDeCellule(ligne, colonne), x === null || Number.isNaN(x) ? null : x);
  }
  const valeurDeLEleve = (l: number, c: number) => {
    const cellule = t.lignes[l]!.cellules[c]!;
    return cellule.saisir ? (lu.get(cleDeCellule(l, c)) ?? null) : cellule.valeur;
  };
  const totaux = totauxDuTableau(t);
  const cellules = cellulesASaisir(t).map(({ ligne, colonne, cellule }): CelluleCorrigee => {
    const brut = (saisies[cleDeCellule(ligne, colonne)] ?? "").trim();
    const attendu = cellule.valeur!;
    const tol = toleranceDe(t, cellule);
    const faux = (remarque: string): CelluleCorrigee => ({ ligne, colonne, juste: false, remarque });
    if (brut === "") return faux("la cellule est vide");
    const x = lu.get(cleDeCellule(ligne, colonne)) ?? null;
    if (x === null) return faux("ce qui est écrit ne se lit pas comme un nombre");
    if (Math.abs(x - attendu) <= tol) return { ligne, colonne, juste: true, remarque: null };
    if (Math.abs(attendu) > tol && Math.abs(x + attendu) <= tol) return faux("le nombre convient, pas son signe");
    for (const total of totaux.filter((s) => s.ligne === ligne && s.colonne === colonne)) {
      const somme = sommeDe(total, valeurDeLEleve);
      if (somme === null) continue;
      const ou = total.sens === "ligne" ? "les autres cellules de la ligne" : total.moins.length ? "les lignes que ce total reprend, moins celles qu'il retranche" : "les lignes que ce total additionne";
      if (Math.abs(x - somme) > tol) return faux(`ce total ne fait pas la somme de ce que vous avez écrit : reprenez ${ou}`);
      return faux(`ce total suit bien vos cellules, mais l'une d'elles est fausse : vérifiez ${ou}`);
    }
    return faux(cellule.indice ? `le nombre ne convient pas ; pensez ${aDevant(cellule.indice)}` : "le nombre ne convient pas");
  });
  const fausses = cellules.filter((c) => !c.juste).length;
  return { juste: fausses === 0, cellules, fausses };
}

/** Les remarques d'une correction, une phrase par cellule fausse : « Loyer, Entretien : la cellule est vide. » */
export const remarquesDuTableau = (t: TableauACompleter, c: CorrectionDuTableau) =>
  c.cellules.filter((x) => !x.juste).map((x) => `${libelleDeCellule(t, x.ligne, x.colonne)} : ${x.remarque}.`);

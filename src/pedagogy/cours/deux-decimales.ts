/**
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026).
 *
 * Ce que l'élève calcule dans un champ ou une cellule du cours est de l'une de ces natures :
 *   · un MONTANT, au centime (1 234,57 €) ;
 *   · un POURCENTAGE, à deux décimales (12,35 %) ;
 *   · une GRANDEUR, une autre mesure au centième (8,34 jours de chiffre d'affaires, 1,79 kg, 2,11 fois) ;
 *   · une QUANTITÉ, entière (des articles, des personnes, des jours, des heures, des unités) ;
 *   · un COEFFICIENT, ou un taux au dix-millième demandé comme tel (0,9568) : il garde sa précision.
 *
 * ON ARRONDIT CHAQUE LIGNE. Chaque résultat intermédiaire est arrondi à deux décimales (`arrondi2`),
 * et le corrigé suit le même chemin que l'élève sur sa copie : la ligne suivante part du nombre
 * arrondi, pas du nombre exact. La tolérance d'un montant, d'un pourcentage ou d'une grandeur est
 * d'un centième (0,01).
 *
 * L'ÉLÈVE QUI N'ARRONDIT QU'À LA FIN EST ACCEPTÉ AUSSI (décision du propriétaire, 11 novembre 2026 :
 * « accepter les deux chemins » ; audit pédagogique, P1-1). Le plus souvent, garder tous les chiffres
 * ne change le résultat que d'un centime, que la tolérance couvre. Mais un résultat arrondi repris et
 * multiplié (1,88 compte × 28 560 € au lieu de 1,875) écarte les deux chemins de plus d'un centième :
 * 45 champs refusaient alors l'élève rigoureux, jusqu'à 142,80 €. Ces champs portent l'autre chemin,
 * le calcul exact arrondi à la fin (`autreChemin`, posé par `deuxChemins`), accepté comme l'attendu ;
 * le corrigé garde le chemin ligne par ligne. La garde tests/architecture/deux-chemins.test.ts refait
 * sans arrondi intermédiaire la chaîne de calcul de chaque corrigé et vérifie que son résultat est
 * accepté. Comme l'attendu, l'autre chemin se calcule au serveur et ne part qu'avec l'étape servie.
 *
 * LA NATURE D'UN CHAMP SE DÉDUIT, SAUF QUAND ELLE SE DÉCLARE (`natureDuChamp`). Un champ dont le
 * libellé porte « (%) » ou « en % », ou une cellule en « % », est un pourcentage ; une cellule dans une
 * autre unité, une grandeur ; tout le reste, un montant. Une quantité et un coefficient se déclarent
 * toujours (`nature`) : la déduction ne choisit jamais la règle la plus lâche (le coefficient), et
 * une déduction fausse se voit, parce que la garde lit le corrigé (`fautesAuxDeuxDecimales`) : un champ
 * réputé montant dont le corrigé n'écrit pas son résultat en euros est rouge, jusqu'à ce que sa
 * nature soit dite.
 */

export type NatureDuNombre = "montant" | "pourcentage" | "grandeur" | "quantite" | "coefficient";

/**
 * Un nombre arrondi à `chiffres` décimales, la moitié loin de zéro, SANS ERREUR DE FLOTTANT : 1,005
 * donne 1,01 (1,005 × 100 vaut 100,49999… en machine, et `Math.round` en ferait 1), 2,675 donne 2,68
 * (`toFixed` en ferait 2,67), −2,675 donne −2,68. Le décalage de la virgule se fait sur l'écriture décimale du nombre (`1.2345e3`), pas par
 * une multiplication ; quinze chiffres significatifs effacent d'abord le bruit d'un calcul
 * (0,1 + 0,2 = 0,30000000000000004).
 */
export function arrondi(x: number, chiffres = 2): number {
  // Au-delà de 10¹⁵, un flottant n'a plus de centimes à arrondir.
  if (!Number.isFinite(x) || x === 0 || Math.abs(x) >= 1e15) return x + 0;
  const [mantisse, exposant] = Math.abs(Number(x.toPrecision(15))).toExponential().split("e");
  const decale = Math.round(Number(`${mantisse}e${Number(exposant) + chiffres}`));
  const resultat = Number(`${decale}e-${chiffres}`);
  return (x < 0 ? -resultat : resultat) + 0;
}

/** Au centième : un montant au centime, un pourcentage ou une grandeur à deux décimales. */
export const arrondi2 = (x: number) => arrondi(x, 2);

/** À l'unité, la moitié loin de zéro : une quantité. Pour un arrondi par excès ou par défaut, Math.ceil ou Math.floor, que le corrigé nomme. */
export const aLUnite = (x: number) => arrondi(x, 0);

// ─────────────────────────────────────────────────────────────────────────────
// CHAQUE LIGNE ARRONDIE : une ligne du corrigé, calculée sur les lignes déjà arrondies.
// ─────────────────────────────────────────────────────────────────────────────

/** Une somme (ou une différence, un terme négatif), arrondie au centième. */
export const somme2 = (...termes: readonly number[]) => arrondi2(termes.reduce((s, t) => s + t, 0));

/** Un produit, arrondi au centième : 1 875 € × 22 % = 412,50 €. Un pourcentage s'y écrit en fraction (0,22). */
export const produit2 = (...facteurs: readonly number[]) => arrondi2(facteurs.reduce((p, f) => p * f, 1));

/** Un quotient, arrondi au centième : 7 500 € ÷ 4 = 1 875 €. */
export const quotient2 = (dividende: number, diviseur: number) => arrondi2(dividende / diviseur);

/** Une part en pourcentage, à deux décimales : 21 € ÷ 38 € × 100 = 55,26 %. */
export const taux2 = (part: number, base: number) => arrondi2((part / base) * 100);

/** Un pourcentage (en points : 12,35) d'une base, au centime : 13 629 € × 60 % = 8 177,40 €. */
export const partDe2 = (base: number, pourcentage: number) => arrondi2((base * pourcentage) / 100);

/**
 * LES DEUX CHEMINS D'UN CHAMP (voir l'en-tête) : l'attendu, celui du corrigé, et le résultat de l'autre
 * chemin, arrondi à la fin, quand il tombe hors de la tolérance d'un centième. Se pose à la place de
 * l'attendu : `{ libelle, ...deuxChemins(r.stockFinal, r.stockFinalSansArrondi), calcul }`. Les deux
 * chemins confondus (dans une entreprise, pas dans une autre), le champ ne porte que l'attendu.
 */
export function deuxChemins(attendu: number, autre: number): { attendu: number; autreChemin?: number } {
  const a = arrondi2(autre);
  return Math.abs(a - attendu) > 0.01 + 1e-9 ? { attendu, autreChemin: a } : { attendu };
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ÉCRITURE DU CORRIGÉ : deux décimales pour un nombre qui n'est pas entier.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Un nombre au centième, à la française : « 1 234,57 », « 1 234,50 », « 1 234 », « −22,50 ». Un
 * nombre entier s'écrit sans décimales ; un autre, toujours avec deux (12,5 s'écrit 12,50).
 */
export function nombreAuCentieme(x: number): string {
  const v = arrondi2(x);
  const ecrit = Math.abs(v).toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });
  return v < 0 ? `−${ecrit}` : ecrit;
}

/** Un montant au centime dans un corrigé : « 1 234,57 € », « −10 € ». */
export const eur = (x: number) => `${nombreAuCentieme(x)} €`;

/** Un pourcentage, en points, à deux décimales : « 55,26 % », « 22 % ». Une fraction (0,22) se multiplie par 100 avant. */
export const pct = (points: number) => `${nombreAuCentieme(points)} %`;

/** Une quantité, entière : « 1 590 ». */
export const qte = (n: number) => {
  const ecrit = Math.abs(aLUnite(n)).toLocaleString("fr-FR");
  return n < 0 && aLUnite(n) !== 0 ? `−${ecrit}` : ecrit;
};

/**
 * UNE DONNÉE DE L'ÉNONCÉ, ÉCRITE TELLE QUE LE CALCUL LA PREND (audit pédagogique du 11 novembre 2026,
 * P0-1) : deux décimales au moins pour un nombre qui n'est pas entier (« 0,25 », « 0,50 »), et toutes
 * celles qu'il a, jusqu'au dix-millième (« 0,125 heure »). Écrite au centième, la ligne automatisée
 * du cas libre du DSCG montait une enceinte en « 0,13 heure » quand le calcul en prenait 0,125 :
 * l'élève qui suivait l'énoncé trouvait 10 661 au lieu de 10 800. Un résultat, lui, reste au centième.
 */
export function donneeTelleQuelle(x: number): string {
  const v = arrondi(x, 4);
  const ecrit = Math.abs(v).toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 4 });
  return v < 0 ? `−${ecrit}` : ecrit;
}

// ─────────────────────────────────────────────────────────────────────────────
// LA NATURE D'UN CHAMP, ET CE QUE LA RÈGLE EN DEMANDE.
// ─────────────────────────────────────────────────────────────────────────────

/** Ce que la règle lit d'un champ de calcul, ou d'une cellule à saisir (son libellé : « ligne, colonne »). */
export interface NombreACalculer {
  libelle: string;
  attendu: number;
  /** Le résultat de l'autre chemin, accepté comme l'attendu (voir l'en-tête). */
  autreChemin?: number;
  calcul?: string;
  tolerance?: number;
  nature?: NatureDuNombre;
  /** L'unité d'une cellule qui n'est pas en euros (tableau-a-completer.ts). */
  unite?: string;
}

const EN_POURCENTAGE = /\(%|\ben %/;

/** La nature d'un champ : celle qu'il déclare, sinon celle que son libellé ou son unité disent (voir l'en-tête). */
export function natureDuChamp(c: Pick<NombreACalculer, "libelle" | "nature" | "unite">): NatureDuNombre {
  if (c.nature) return c.nature;
  if (c.unite !== undefined && c.unite.trim() !== "") return c.unite.trim() === "%" ? "pourcentage" : "grandeur";
  return EN_POURCENTAGE.test(c.libelle) ? "pourcentage" : "montant";
}

const CENTIEME = 0.01;
const PRES = 1e-9;
const multipleDe = (x: number, pas: number) => Math.abs(x / pas - Math.round(x / pas)) < 1e-6;

/** Le texte d'un corrigé, ses espaces et ses signes ramenés à une seule forme, pour y chercher un nombre. */
const normalise = (t: string) => t.replace(/[\u00a0\u202f]/g, " ").replace(/-/g, "−");
const echappe = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Le corrigé écrit-il ce nombre, tel quel, suivi de son unité ? « 55,26 % » se trouve dans
 * « 21 € ÷ 38 € × 100 = 55,26 % », pas dans « 155,26 % » ni « 55,3 % ». Le signe ne compte pas : une
 * perte de 22,50 € peut s'écrire « −22,50 € » ou « une perte de 22,50 € ».
 */
export function corrigeEcrit(calcul: string, ecrit: string, unite: "€" | "%" | null): boolean {
  const n = echappe(normalise(ecrit).replace(/^−/, ""));
  const apres = unite ? ` ?${echappe(unite)}` : "(?![\\d,]|\\s\\d)";
  return new RegExp(`(?<![\\d,])(?<!\\d )${n}${apres}`).test(normalise(calcul));
}

/**
 * Ce qu'un champ ou une cellule à saisir enfreint de la règle, une phrase par faute ; vide : il la suit.
 *   · un montant, un pourcentage, une grandeur : une tolérance d'un centième, un attendu au centième, et
 *     un corrigé qui écrit le résultat à deux décimales (suivi de « € » ou de « % ») ;
 *   · une quantité : un attendu entier, une tolérance d'un centième au plus, un corrigé qui l'écrit ;
 *   · un coefficient : un attendu au dix-millième au plus, une tolérance d'un centième au plus.
 * Un attendu nul n'a pas à s'écrire dans le corrigé (« rien à doter »).
 */
export function fautesAuxDeuxDecimales(c: NombreACalculer): string[] {
  const nature = natureDuChamp(c);
  const tolerance = c.tolerance ?? CENTIEME;
  const fautes: string[] = [];
  const ecritTolerance = String(tolerance).replace(".", ",");
  if (!Number.isFinite(c.attendu)) return [`${nature} : l'attendu n'est pas un nombre`];
  if (c.autreChemin !== undefined) {
    if (nature === "quantite" || nature === "coefficient") fautes.push(`${nature} : un autre chemin n'est accepté que pour un montant, un pourcentage ou une grandeur`);
    else if (!Number.isFinite(c.autreChemin) || !multipleDe(c.autreChemin, CENTIEME)) fautes.push(`${nature} : autre chemin ${String(c.autreChemin).replace(".", ",")}, pas au centième`);
    else if (Math.abs(c.autreChemin - c.attendu) <= tolerance + PRES) fautes.push(`${nature} : l'autre chemin tombe déjà dans la tolérance de l'attendu`);
  }
  if (nature === "montant" || nature === "pourcentage" || nature === "grandeur") {
    if (Math.abs(tolerance - CENTIEME) > PRES) fautes.push(`${nature} : tolérance de ${ecritTolerance} au lieu d'un centième`);
    if (!multipleDe(c.attendu, CENTIEME)) fautes.push(`${nature} : attendu ${String(c.attendu).replace(".", ",")}, pas au centième`);
    else if (c.attendu !== 0 && c.calcul !== undefined) {
      const unite = nature === "montant" ? "€" : nature === "pourcentage" ? "%" : null;
      const ecrit = nombreAuCentieme(c.attendu);
      if (!corrigeEcrit(c.calcul, ecrit, unite)) fautes.push(`${nature} : le corrigé n'écrit pas « ${ecrit}${unite ? ` ${unite}` : ""} »`);
    }
  } else if (nature === "quantite") {
    if (tolerance > CENTIEME + PRES) fautes.push(`quantité : tolérance de ${ecritTolerance} au lieu d'un centième au plus`);
    if (!Number.isInteger(arrondi(c.attendu, 9))) fautes.push(`quantité : attendu ${String(c.attendu).replace(".", ",")}, pas entier`);
    else if (c.attendu !== 0 && c.calcul !== undefined && !corrigeEcrit(c.calcul, qte(c.attendu), null)) fautes.push(`quantité : le corrigé n'écrit pas « ${qte(c.attendu)} »`);
  } else {
    if (tolerance > CENTIEME + PRES) fautes.push(`coefficient : tolérance de ${ecritTolerance} au lieu d'un centième au plus`);
    if (!multipleDe(c.attendu, 0.0001)) fautes.push(`coefficient : attendu ${String(c.attendu).replace(".", ",")}, au-delà du dix-millième`);
  }
  return fautes;
}

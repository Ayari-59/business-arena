/**
 * LES MILLIERS LISIBLES (décision du propriétaire du 11 novembre 2026 ; audit UX du même jour, P2-1).
 *
 * Les nombres du site séparent leurs milliers par l'espace fine insécable (U+202F), celle que pose
 * `Intl` en français et que la typographie du site garde (lib/typographie.ts). Dans Barlow, la police du
 * site, elle mesure un dixième de cadratin : 1,4 px à 14 px, contre 7,9 px pour un chiffre. « 1 390 276 € »
 * se lisait « 1390276 € », dans tous les montants, surtout sur téléphone.
 *
 * Plutôt que de récrire les nombres (des milliers de textes, les tests et les empreintes avec eux), la
 * fine s'élargit À L'AFFICHAGE : une police d'un seul caractère, U+202F, à la chasse de l'espace
 * insécable ordinaire de Barlow (un cinquième de cadratin, mesuré dans Chromium : 20 pour un corps de
 * 100), se pose en tête des familles du site (`unicode-range`, globals.css). Le navigateur prend dans
 * cette police la seule fine, et tout le reste dans Barlow. Les nombres ne changent pas, ce que l'élève
 * tape non plus, ni le texte copié : seule la largeur dessinée de la fine change.
 *
 * La police est écrite ici, octet par octet (une police TrueType de deux glyphes : le « .notdef »
 * obligatoire, un rectangle, et la fine, vide), sans outil ni dépendance ; la feuille qui la porte, en
 * `data:` (la politique de sécurité permet `font-src data:`), est versionnée.
 *
 * Usage : npx tsx scripts/police-des-milliers.ts
 * Le test tests/theme/police-des-milliers.test.ts vérifie que la feuille est à jour, et que la police
 * dit bien ce qu'elle doit ; tests/e2e/cours.e2e.ts mesure la fine dans un vrai navigateur.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

/** Le nom de la famille, en tête des familles du site (globals.css). */
export const FAMILLE_DES_MILLIERS = "Espace des milliers";

/** La fine, en millièmes de cadratin : l'espace insécable ordinaire de Barlow. */
export const CHASSE_DE_LA_FINE = 200;

/** Le caractère que la police porte : l'espace fine insécable. */
export const FINE = 0x202f;

const UNITES_PAR_CADRATIN = 1000;
const MONTANTE = 800;
const DESCENDANTE = 200;

/** Le « .notdef » : un rectangle, de 50 à 450 en largeur, de 0 à 700 en hauteur, sur une chasse de 500. */
const NOTDEF = { chasse: 500, xMin: 50, yMin: 0, xMax: 450, yMax: 700 };

class Octets {
  private readonly o: number[] = [];
  u8(x: number) {
    this.o.push(x & 0xff);
    return this;
  }
  u16(x: number) {
    return this.u8(x >> 8).u8(x);
  }
  i16(x: number) {
    return this.u16(x < 0 ? x + 0x10000 : x);
  }
  u32(x: number) {
    return this.u16(Math.floor(x / 0x10000) & 0xffff).u16(x & 0xffff);
  }
  etiquette(t: string) {
    for (const c of t) this.u8(c.charCodeAt(0));
    return this;
  }
  octets(b: Uint8Array) {
    for (const x of b) this.u8(x);
    return this;
  }
  get longueur() {
    return this.o.length;
  }
  fin(): Uint8Array {
    return Uint8Array.from(this.o);
  }
}

/** La somme de contrôle d'une table : ses mots de 32 bits, complétée de zéros, modulo 2³². */
export function sommeDeControle(b: Uint8Array): number {
  let somme = 0;
  for (let i = 0; i < b.length; i += 4) {
    const mot = ((b[i] ?? 0) << 24) | ((b[i + 1] ?? 0) << 16) | ((b[i + 2] ?? 0) << 8) | (b[i + 3] ?? 0);
    somme = (somme + (mot >>> 0)) >>> 0;
  }
  return somme;
}

const utf16 = (t: string) => {
  const o = new Octets();
  for (const c of t) o.u16(c.charCodeAt(0));
  return o.fin();
};

function tables(): Record<string, Uint8Array> {
  const head = new Octets()
    .u32(0x00010000) // version
    .u32(0x00010000) // révision de la police
    .u32(0) // ajustement de la somme, posé à la fin
    .u32(0x5f0f3cf5) // nombre magique
    .u16(0x000b) // drapeaux : ligne de base à 0, approche gauche à 0, corps entiers
    .u16(UNITES_PAR_CADRATIN)
    .u32(0)
    .u32(0) // création
    .u32(0)
    .u32(0) // modification
    .i16(NOTDEF.xMin)
    .i16(NOTDEF.yMin)
    .i16(NOTDEF.xMax)
    .i16(NOTDEF.yMax)
    .u16(0) // style
    .u16(8) // plus petit corps lisible
    .i16(2) // sens
    .i16(0) // loca courte
    .i16(0)
    .fin();
  const hhea = new Octets()
    .u32(0x00010000)
    .i16(MONTANTE)
    .i16(-DESCENDANTE)
    .i16(0) // interligne
    .u16(NOTDEF.chasse) // plus grande chasse
    .i16(NOTDEF.xMin) // plus petite approche gauche
    .i16(NOTDEF.chasse - NOTDEF.xMax) // plus petite approche droite
    .i16(NOTDEF.xMax) // plus grande étendue
    .i16(1)
    .i16(0)
    .i16(0) // pente du curseur
    .i16(0)
    .i16(0)
    .i16(0)
    .i16(0) // réservés
    .i16(0) // format des métriques
    .u16(2) // nombre de métriques horizontales
    .fin();
  const maxp = new Octets()
    .u32(0x00010000)
    .u16(2) // glyphes
    .u16(4) // points
    .u16(1) // contours
    .u16(0)
    .u16(0)
    .u16(2) // zones
    .u16(0)
    .u16(0)
    .u16(0)
    .u16(0)
    .u16(0)
    .u16(0)
    .u16(0)
    .u16(0)
    .fin();
  const os2 = new Octets()
    .u16(4) // version
    .i16((NOTDEF.chasse + CHASSE_DE_LA_FINE) / 2) // chasse moyenne
    .u16(400) // graisse
    .u16(5) // largeur
    .u16(0) // permissions : installable
    .i16(650)
    .i16(600)
    .i16(0)
    .i16(75) // indice
    .i16(650)
    .i16(600)
    .i16(0)
    .i16(350) // exposant
    .i16(50)
    .i16(300) // barré
    .i16(0) // classe
    .octets(new Uint8Array(10)) // panose
    .u32(0x80000000) // plages Unicode : ponctuation générale (bit 31)
    .u32(0)
    .u32(0)
    .u32(0)
    .etiquette("NONE")
    .u16(0x0040) // régulier
    .u16(FINE)
    .u16(FINE) // premier et dernier caractères
    .i16(MONTANTE)
    .i16(-DESCENDANTE)
    .i16(0)
    .u16(MONTANTE)
    .u16(DESCENDANTE)
    .u32(1) // page de code : latin 1
    .u32(0)
    .i16(500)
    .i16(700) // hauteur d'x, des capitales
    .u16(0)
    .u16(0x20)
    .u16(0)
    .fin();
  // Le .notdef : un contour de quatre points sur la courbe, en coordonnées relatives de 16 bits.
  const glyf = new Octets()
    .i16(1)
    .i16(NOTDEF.xMin)
    .i16(NOTDEF.yMin)
    .i16(NOTDEF.xMax)
    .i16(NOTDEF.yMax)
    .u16(3) // dernier point du contour
    .u16(0) // aucune instruction
    .u8(1)
    .u8(1)
    .u8(1)
    .u8(1)
    .i16(NOTDEF.xMin)
    .i16(0)
    .i16(NOTDEF.xMax - NOTDEF.xMin)
    .i16(0)
    .i16(0)
    .i16(NOTDEF.yMax)
    .i16(0)
    .i16(-NOTDEF.yMax)
    .fin();
  const loca = new Octets()
    .u16(0)
    .u16(glyf.length / 2)
    .u16(glyf.length / 2)
    .fin();
  const hmtx = new Octets().u16(NOTDEF.chasse).i16(NOTDEF.xMin).u16(CHASSE_DE_LA_FINE).i16(0).fin();
  // Le format 4 : un segment pour la fine (glyphe 1), et le segment final obligatoire.
  const format4 = new Octets()
    .u16(4)
    .u16(32) // longueur
    .u16(0) // langue
    .u16(4) // 2 × segments
    .u16(4)
    .u16(1)
    .u16(0) // recherche
    .u16(FINE)
    .u16(0xffff) // fins
    .u16(0)
    .u16(FINE)
    .u16(0xffff) // débuts
    .u16((1 - FINE) & 0xffff)
    .u16(1) // décalages
    .u16(0)
    .u16(0)
    .fin();
  const cmap = new Octets()
    .u16(0)
    .u16(2)
    .u16(0)
    .u16(3)
    .u32(20) // Unicode, plan multilingue de base
    .u16(3)
    .u16(1)
    .u32(20) // Windows, plan multilingue de base
    .octets(format4)
    .fin();
  const noms: [number, string][] = [
    [1, FAMILLE_DES_MILLIERS],
    [2, "Regular"],
    [3, FAMILLE_DES_MILLIERS],
    [4, FAMILLE_DES_MILLIERS],
    [5, "Version 1.000"],
    [6, "EspaceDesMilliers"],
  ];
  const chaines = noms.map(([, t]) => utf16(t));
  const name = new Octets().u16(0).u16(noms.length).u16(6 + 12 * noms.length);
  let decalage = 0;
  noms.forEach(([id], i) => {
    name.u16(3).u16(1).u16(0x0409).u16(id).u16(chaines[i]!.length).u16(decalage);
    decalage += chaines[i]!.length;
  });
  for (const c of chaines) name.octets(c);
  const post = new Octets()
    .u32(0x00030000)
    .u32(0) // angle de l'italique
    .i16(-100)
    .i16(50) // soulignement
    .u32(0)
    .u32(0)
    .u32(0)
    .u32(0)
    .u32(0)
    .fin();
  return { "OS/2": os2, cmap, glyf, head, hhea, hmtx, loca, maxp, name: name.fin(), post };
}

/** La police : l'en-tête, le répertoire des tables, puis les tables, alignées sur 4 octets. */
export function policeDesMilliers(): Uint8Array {
  const t = tables();
  const etiquettes = Object.keys(t).sort();
  const n = etiquettes.length;
  const puissance = 2 ** Math.floor(Math.log2(n));
  const entete = new Octets()
    .u32(0x00010000)
    .u16(n)
    .u16(puissance * 16)
    .u16(Math.log2(puissance))
    .u16(n * 16 - puissance * 16);
  let position = 12 + 16 * n;
  const corps = new Octets();
  const repertoire = new Octets();
  let positionDeHead = 0;
  for (const e of etiquettes) {
    const table = t[e]!;
    if (e === "head") positionDeHead = position;
    repertoire.etiquette(e).u32(sommeDeControle(table)).u32(position).u32(table.length);
    corps.octets(table);
    const bourrage = (4 - (table.length % 4)) % 4;
    for (let i = 0; i < bourrage; i++) corps.u8(0);
    position += table.length + bourrage;
  }
  const police = new Octets().octets(entete.fin()).octets(repertoire.fin()).octets(corps.fin()).fin();
  // L'ajustement de la somme de toute la police, écrit dans `head`.
  const ajustement = (0xb1b0afba - sommeDeControle(police)) >>> 0;
  new DataView(police.buffer).setUint32(positionDeHead + 8, ajustement);
  return police;
}

const base64 = (b: Uint8Array) => Buffer.from(b).toString("base64");

/**
 * La feuille de la police : son `@font-face`, la seule fine, à toutes les graisses. Un texte en
 * italique prend la même (le navigateur la penche, et une espace penchée garde sa chasse).
 */
export function feuilleDeLaPoliceDesMilliers(): string {
  return `/* ---------------------------------------------------------------------------
 * La fine des milliers, à la chasse de l'espace insécable de Barlow
 * (audit UX du 11 novembre 2026, P2-1). FICHIER GÉNÉRÉ, ne pas modifier à la main.
 * Régénérer avec : npx tsx scripts/police-des-milliers.ts
 * ------------------------------------------------------------------------- */
@font-face {
  font-family: "${FAMILLE_DES_MILLIERS}";
  src: url(data:font/ttf;base64,${base64(policeDesMilliers())}) format("truetype");
  unicode-range: U+202F;
  font-weight: 100 900;
  font-display: block;
}
`;
}

export const FICHIER_DE_LA_FEUILLE = join("src", "app", "police-des-milliers.css");

if (process.argv[1]?.endsWith("police-des-milliers.ts")) {
  writeFileSync(FICHIER_DE_LA_FEUILLE, feuilleDeLaPoliceDesMilliers());
  console.log(`${FICHIER_DE_LA_FEUILLE} écrit (${policeDesMilliers().length} octets de police).`);
}

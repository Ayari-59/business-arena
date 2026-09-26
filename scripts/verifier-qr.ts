#!/usr/bin/env node
/**
 * LE QR SE DÉCODE-T-IL VRAIMENT ? — la vérification que le test ne peut pas faire.
 *
 * `tests/unit/qr.test.ts` compare le dessin à un QR de référence, au module
 * près. Mais un QR de référence ne prouve rien par lui-même : il faut bien
 * qu'une fois, quelqu'un ait vérifié qu'un appareil photo le lit. C'est ce que
 * fait ce script, et c'est la seule chose qu'il fait.
 *
 * Il repart du CHEMIN SVG produit par `src/lib/qr.ts` — pas de la matrice de la
 * bibliothèque : c'est le chemin qui part dans la page, donc c'est lui qu'il
 * faut décoder. Chaque module devient un bloc de 8×8 pixels sur fond blanc,
 * l'image est donnée à un décodeur, et le texte lu est comparé à l'adresse de
 * départ. Une transposition ligne/colonne, une zone de silence rabotée ou une
 * mise à jour de la bibliothèque se verraient ici.
 *
 * Le décodeur n'est pas une dépendance du site : il ne sert qu'ici, et
 * s'installe le temps de la vérification.
 *
 *   npm install --no-save jsqr && npm run verify:qr
 *
 * Après quoi il faut régénérer le QR de référence du test si le dessin a
 * changé — et ne le faire QUE si ce script dit « Tous décodés ».
 */

import { createRequire } from "node:module";
import { MARGE_QR, dessinerQr, type DessinQr } from "../src/lib/qr";

const require = createRequire(import.meta.url);
type Decodeur = (d: Uint8ClampedArray, l: number, h: number) => { data: string } | null;
let jsQR: Decodeur;
try {
  const mod = require("jsqr");
  jsQR = (mod.default ?? mod) as Decodeur;
} catch {
  console.error("Décodeur absent. Lancez : npm install --no-save jsqr");
  process.exit(1);
}

/** Le chemin SVG rendu en pixels, comme le ferait un appareil photo sur l'écran. */
function pixels({ cote, chemin }: DessinQr, echelle = 8) {
  const cotePx = cote * echelle;
  const data = new Uint8ClampedArray(cotePx * cotePx * 4).fill(255);
  for (const m of chemin.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) {
    const x = Number(m[1]);
    const y = Number(m[2]);
    for (let dy = 0; dy < echelle; dy += 1) {
      for (let dx = 0; dx < echelle; dx += 1) {
        const i = ((y * echelle + dy) * cotePx + x * echelle + dx) * 4;
        data[i] = 2;
        data[i + 1] = 6;
        data[i + 2] = 23;
      }
    }
  }
  return { data, cotePx };
}

const CODES = ["CBZAAT", "K7M2PR", "234567", "ZZZZZZ", "A2B3C4"];
let echecs = 0;
for (const code of CODES) {
  const url = `https://www.business-arena.fr/join?code=${code}`;
  const dessin = dessinerQr(url);
  const { data, cotePx } = pixels(dessin);
  const lu = jsQR(data, cotePx, cotePx);
  const ok = lu?.data === url;
  if (!ok) echecs += 1;
  console.log(
    `${ok ? "OK" : "KO"}  ${code}  ${dessin.cote}×${dessin.cote} modules ` +
      `(zone de silence ${MARGE_QR})  lu : ${lu ? JSON.stringify(lu.data) : "rien"}`,
  );
}
console.log(echecs === 0 ? "\nTous décodés." : `\n${echecs} échec(s).`);
process.exit(echecs === 0 ? 0 : 1);

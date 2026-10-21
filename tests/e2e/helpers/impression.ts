import type { Page } from "playwright-core";

/**
 * IMPRIMER UNE PAGE EN A4, COMME L'ENSEIGNANT.
 *
 * La page déclare son papier (`@page { size: A4 portrait; margin: 0 }`) ; le PDF se tire
 * comme le ferait « Enregistrer en PDF », feuille déclarée par la page. On compte ses
 * pages, et on mesure ce qui reste sous l'élément imprimé : une page qui tient de
 * justesse déborde à la première ligne ajoutée, et le seul décompte des pages ne le
 * voit qu'une fois trop tard.
 *
 * La mise en page se fait à la largeur de la feuille, pas à celle de la fenêtre du test.
 */

const A4_MM = { largeur: 210, hauteur: 297 };
const PX_PAR_MM = 96 / 25.4;

export interface ImpressionA4 {
  pdf: Buffer;
  /** Les pages du PDF. */
  pages: number;
  /** La hauteur de l'élément imprimé, marges de la page comprises s'il les porte. */
  hauteurMm: number;
  /** Ce qui reste de la feuille sous l'élément ; négatif, il déborde. */
  resteMm: number;
  /** La hauteur d'une ligne du texte courant de l'élément. */
  ligneMm: number;
}

export async function imprimerEnA4(p: Page, selecteur: string): Promise<ImpressionA4> {
  const fenetre = p.viewportSize();
  await p.setViewportSize({ width: Math.round(A4_MM.largeur * PX_PAR_MM), height: Math.round(A4_MM.hauteur * PX_PAR_MM) });
  await p.emulateMedia({ media: "print" });
  try {
    await p.evaluate(() => document.fonts.ready);
    const { hauteur, ligne } = await p.evaluate((s) => {
      const e = document.querySelector(s);
      if (!e) throw new Error(`${s} : introuvable`);
      return { hauteur: e.getBoundingClientRect().height, ligne: parseFloat(getComputedStyle(e).lineHeight) };
    }, selecteur);
    const pdf = await p.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
    const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    const hauteurMm = hauteur / PX_PAR_MM;
    return { pdf, pages, hauteurMm, resteMm: A4_MM.hauteur - hauteurMm, ligneMm: ligne / PX_PAR_MM };
  } finally {
    await p.emulateMedia({ media: "screen" });
    if (fenetre) await p.setViewportSize(fenetre);
  }
}

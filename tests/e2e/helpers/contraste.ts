import type { Page } from "playwright-core";

/**
 * Le rapport de contraste de chaque texte d'une page, mesuré dans le navigateur.
 *
 * Deux pièges ont failli rendre cette mesure inutile, et tous deux donnaient
 * un résultat rassurant plutôt qu'une erreur.
 *
 * Le premier : Chromium rend les couleurs dans l'espace où elles sont écrites,
 * donc « lab(1.7 1.3 -9.2) » pour celles de Tailwind et « rgb(5, 14, 28) »
 * pour celles écrites en hexadécimal. Un analyseur qui ne lit que rgb() saute
 * silencieusement la moitié des thèmes et annonce zéro défaut. On fait donc
 * convertir par le navigateur : la même couleur peinte sur blanc puis sur noir
 * livre à la fois sa valeur en sRGB et son opacité.
 *
 * Le second : un texte n'est pas posé sur le fond de son parent immédiat, qui
 * est le plus souvent transparent, mais sur l'empilement des fonds jusqu'au
 * premier opaque. Prendre le parent immédiat ferait comparer un texte à du
 * transparent, c'est-à-dire à rien.
 */
export interface MesureContraste {
  texte: string;
  ratio: number;
  /** 4,5 pour un texte courant, 3 pour un grand titre (règle WCAG AA). */
  seuil: number;
}

const DANS_LA_PAGE = () => {
  const toile = document.createElement("canvas");
  toile.width = toile.height = 1;
  const ctx = toile.getContext("2d", { willReadFrequently: true })!;
  const peindre = (couleur: string, dessous: string) => {
    ctx.globalCompositeOperation = "copy";
    ctx.fillStyle = dessous;
    ctx.fillRect(0, 0, 1, 1);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = couleur;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3) as number[];
  };

  const cache = new Map<string, { rgb: number[]; a: number } | null>();
  const resoudre = (s: string) => {
    if (cache.has(s)) return cache.get(s)!;
    let valeur: { rgb: number[]; a: number } | null = null;
    try {
      const surBlanc = peindre(s, "#fff");
      const surNoir = peindre(s, "#000");
      const a = 1 - Math.max(...surBlanc.map((v, i) => v - surNoir[i]!)) / 255;
      valeur = a <= 0.002 ? { rgb: [0, 0, 0], a: 0 } : { rgb: surNoir.map((v) => v / a), a };
    } catch {
      valeur = null;
    }
    cache.set(s, valeur);
    return valeur;
  };

  const luminance = (c: number[]) => {
    const [r, g, b] = c.map((v) => {
      const s = Math.min(255, Math.max(0, v)) / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const poser = (dessus: { rgb: number[]; a: number }, dessous: number[]) =>
    dessus.rgb.map((v, i) => v * dessus.a + dessous[i]! * (1 - dessus.a));

  const fondDe = (el: Element) => {
    const pile: { rgb: number[]; a: number }[] = [];
    let n: Element | null = el;
    while (n && n !== document.documentElement) {
      const c = resoudre(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) {
        pile.push(c);
        if (c.a >= 0.999) break;
      }
      n = n.parentElement;
    }
    const racine = resoudre(getComputedStyle(document.documentElement).backgroundColor);
    let base = racine && racine.a > 0 ? racine.rgb : [255, 255, 255];
    for (const c of pile.reverse()) base = poser(c, base);
    return base;
  };

  const mesures: { texte: string; ratio: number; seuil: number }[] = [];
  for (const el of document.querySelectorAll("body *")) {
    const texte = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent!.trim())
      .join(" ")
      .trim();
    if (texte.length < 3) continue;
    const st = getComputedStyle(el);
    if (st.visibility === "hidden" || st.display === "none" || parseFloat(st.opacity) < 0.5) continue;
    const boite = el.getBoundingClientRect();
    if (boite.width < 4 || boite.height < 4) continue;
    const couleur = resoudre(st.color);
    if (!couleur || couleur.a === 0) continue;
    const dessous = fondDe(el);
    const l1 = luminance(poser(couleur, dessous));
    const l2 = luminance(dessous);
    const taille = parseFloat(st.fontSize);
    const gras = parseInt(st.fontWeight, 10) >= 700;
    mesures.push({
      texte: texte.slice(0, 60),
      ratio: Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100,
      seuil: taille >= 24 || (taille >= 18.66 && gras) ? 3 : 4.5,
    });
  }
  return mesures;
};

/** Applique un thème puis mesure tous les textes de la page ouverte. */
export async function mesurerContraste(page: Page, theme: string): Promise<MesureContraste[]> {
  await page.evaluate((t) => {
    // Couper les transitions CSS pour que le changement de thème prenne effet
    // immédiatement. Sans cela, les éléments qui portent la classe `transition`
    // se trouvent à mi-chemin entre l'ancien et le nouveau thème au moment de
    // la mesure, et le contraste intermédiaire n'a rien à voir avec le
    // contraste réel de l'état final.
    const gel = document.createElement("style");
    gel.textContent = "*, *::before, *::after { transition-duration: 0s !important; }";
    document.head.appendChild(gel);
    document.documentElement.dataset.theme = t;
    // Forcer le recalcul des styles avec les transitions désactivées.
    void document.documentElement.offsetHeight;
    gel.remove();
  }, theme);
  await page.waitForTimeout(120);
  return page.evaluate(DANS_LA_PAGE);
}

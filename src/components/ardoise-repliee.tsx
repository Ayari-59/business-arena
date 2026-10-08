"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * La hauteur de ce qui reste collé en haut de l'écran : l'en-tête du site sur
 * grand écran, la barre de la partie sur téléphone. On la MESURE plutôt que de
 * l'écrire : la barre de la partie gagne une ligne quand le titre de l'étape
 * en prend deux, et l'en-tête passe à la ligne sur une fenêtre étroite.
 */
export function hautDesBarres(): number {
  let bas = 0;
  document.querySelectorAll<HTMLElement>("[data-barre-collante], body > header").forEach((el) => {
    const style = getComputedStyle(el);
    if (style.display === "none" || (style.position !== "sticky" && style.position !== "fixed")) {
      return;
    }
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.top <= 1) bas = Math.max(bas, r.bottom);
  });
  return Math.max(0, Math.round(bas));
}

/** La hauteur de la ligne repliée, en pixels (32, et son filet). */
export const HAUTEUR_REPLIEE = 33;

/**
 * L'ARDOISE, REPLIÉE EN UNE LIGNE DÈS QU'ON DÉFILE.
 *
 * Sur téléphone, chaque étape du tour remontait en haut de page, où l'on
 * revoyait 230 px d'en-tête et de tuiles avant le champ à remplir ; en
 * défilant, les chiffres de l'entreprise disparaissaient tout à fait. La ligne
 * repliée (CA · Rés. · Tréso. · Rang) se pose sous la barre du haut dès que
 * l'ardoise sort de l'écran, et s'efface quand elle y revient : les chiffres
 * restent sous les yeux, pour 33 px.
 *
 * Elle est POSÉE PAR-DESSUS la page (fixe), jamais dans son flux : apparaître
 * ne fait rien sauter. Elle redit l'ardoise, qui reste dans le document : un
 * lecteur d'écran n'a pas à l'entendre deux fois (`aria-hidden`).
 *
 * Elle publie aussi `--haut-collant` : la hauteur de tout ce qui colle en haut
 * (barre et ligne repliée). Une étape qu'on fait défiler jusqu'à son début s'y
 * arrête (`scroll-margin-top`), au lieu de passer dessous.
 */
export function ArdoiseRepliee({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState({ visible: false, haut: 0 });

  useEffect(() => {
    let attente = 0;
    const mesurer = () => {
      attente = 0;
      const ardoise = document.getElementById("ardoise-du-dirigeant");
      const haut = hautDesBarres();
      document.documentElement.style.setProperty(
        "--haut-collant",
        `${haut + (ardoise ? HAUTEUR_REPLIEE : 0) + 2}px`,
      );
      // Repliée dès qu'il ne reste de l'ardoise qu'une lisière : la ligne la
      // couvre, et l'on ne voit jamais deux fois les mêmes chiffres.
      const visible = ardoise
        ? ardoise.getBoundingClientRect().bottom < haut + HAUTEUR_REPLIEE + 12
        : false;
      setEtat((e) => (e.visible === visible && e.haut === haut ? e : { visible, haut }));
    };
    const planifier = () => {
      if (!attente) attente = requestAnimationFrame(mesurer);
    };
    mesurer();
    window.addEventListener("scroll", planifier, { passive: true });
    window.addEventListener("resize", planifier);
    return () => {
      if (attente) cancelAnimationFrame(attente);
      window.removeEventListener("scroll", planifier);
      window.removeEventListener("resize", planifier);
      document.documentElement.style.removeProperty("--haut-collant");
    };
  }, []);

  return (
    <div
      aria-hidden
      data-ardoise-repliee={etat.visible ? "visible" : "cachee"}
      style={{ top: etat.haut }}
      className={`ardoise fixed inset-x-0 z-30 border-b border-white/10 bg-slate-950 transition-[opacity,transform] duration-150 motion-reduce:transition-none print:hidden ${
        etat.visible ? "opacity-100" : "pointer-events-none invisible -translate-y-1 opacity-0"
      }`}
    >
      <div className="mx-auto flex h-8 max-w-[1400px] items-center px-4 sm:px-6">{children}</div>
    </div>
  );
}

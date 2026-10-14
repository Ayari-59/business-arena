"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * LES TROIS ÉCRANS D'UN TOUR, EN CARROUSEL SUR TÉLÉPHONE (lot P6).
 *
 * L'audit P2-09 (lot 3B) avait retiré le carrousel des trois écrans sur
 * téléphone pour deux défauts : les captures, à 78 % de la largeur, tombaient
 * à six pixels de texte, et le geste de côté n'était pas deviné. Le
 * téléphone ne montrait plus que le verdict. Le propriétaire veut retrouver
 * les trois écrans ; les deux défauts sont traités ici :
 *
 *   · UN ÉCRAN À LA FOIS, EN ENTIER. Chaque écran prend toute la largeur du
 *     cadre, et rien du suivant ne dépasse (« je ne veux pas que ça
 *     dépasse ») : le cadre défile de côté, cran par cran (`scroll-snap`),
 *     sans barre, et la page, elle, ne bouge pas ;
 *   · LE GESTE SE VOIT AUTREMENT : sous le cadre, deux boutons fléchés
 *     (« Écran précédent », « Écran suivant », 44 px, éteints aux
 *     extrémités), trois points cliquables et « 1 / 3 ». Le doigt glisse, le
 *     clavier fait défiler le cadre (il prend le focus) ou passe par les
 *     boutons ;
 *   · LE TEXTE DES CAPTURES SE LIT : chaque capture est recadrée sur sa zone
 *     la plus parlante (`data-recadrage`, « LES TROIS ÉCRANS SUR TÉLÉPHONE »
 *     dans globals.css), agrandie, dans un cadre 4:5.
 *
 * Au-delà de `sm`, rien ne change : les trois écrans côte à côte, sans
 * commandes.
 */
export function CarrouselDesEcrans({ titres, children }: { titres: string[]; children: ReactNode }) {
  const cadre = useRef<HTMLOListElement>(null);
  const [courant, setCourant] = useState(0);
  const total = titres.length;

  useEffect(() => {
    const el = cadre.current;
    if (!el) return;
    const lire = () => {
      const largeur = el.clientWidth;
      if (largeur > 0) setCourant(Math.max(0, Math.min(total - 1, Math.round(el.scrollLeft / largeur))));
    };
    el.addEventListener("scroll", lire, { passive: true });
    return () => el.removeEventListener("scroll", lire);
  }, [total]);

  const aller = (i: number) => {
    const el = cadre.current;
    if (!el) return;
    const cible = Math.max(0, Math.min(total - 1, i));
    const ecran = el.children[cible] as HTMLElement | undefined;
    if (!ecran) return;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: ecran.offsetLeft - el.offsetLeft, behavior: reduit ? "auto" : "smooth" });
    setCourant(cible);
  };

  const fleche =
    "grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-white/25 text-slate-100 transition hover:border-white/50 disabled:border-white/10 disabled:text-slate-400";

  return (
    <>
      <ol
        ref={cadre}
        data-carrousel-des-ecrans=""
        tabIndex={0}
        aria-label="Trois écrans d'un même tour"
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-4 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ol>
      <div data-commandes-du-carrousel="" className="mt-4 flex items-center justify-between gap-3 sm:hidden">
        <button
          type="button"
          onClick={() => aller(courant - 1)}
          disabled={courant === 0}
          aria-label="Écran précédent"
          className={fleche}
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="flex items-center gap-1">
          {titres.map((t, i) => (
            <button
              key={t}
              type="button"
              onClick={() => aller(i)}
              aria-label={`Écran ${i + 1} sur ${total} : ${t}`}
              aria-current={i === courant ? "true" : undefined}
              data-point-du-carrousel=""
              className="grid h-11 w-8 place-items-center"
            >
              <span
                aria-hidden
                className={`block h-2.5 w-2.5 rounded-full border ${
                  i === courant ? "border-slate-100 bg-slate-100" : "border-slate-400 bg-transparent"
                }`}
              />
            </button>
          ))}
          <span data-position-du-carrousel="" aria-live="polite" className="ml-2 text-sm tabular-nums text-slate-300">
            {courant + 1} / {total}
          </span>
        </div>
        <button
          type="button"
          onClick={() => aller(courant + 1)}
          disabled={courant === total - 1}
          aria-label="Écran suivant"
          className={fleche}
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </>
  );
}

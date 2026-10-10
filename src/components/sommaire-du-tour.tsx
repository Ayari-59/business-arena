"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * LE SOMMAIRE D'UN TOUR CLOS (lot P3).
 *
 * Les résultats d'un tour clos empilaient deux rangées d'onglets : Situation /
 * Décisions / Résultats, puis, dans Résultats, Synthèse / Marché / Finance.
 * Deux barres de cadres l'une sur l'autre, l'allure d'un panneau
 * d'administration. Il ne reste qu'UNE navigation d'onglets (la première) ; le
 * second niveau devient ce composant : les trois faces du tableau de bord se
 * lisent à la suite, dans la page, et un sommaire d'ancres y mène.
 *   · Sur ordinateur, le sommaire est une colonne étroite à gauche, COLLANTE :
 *     il reste sous la main pendant qu'on lit la Finance.
 *   · Sous `lg`, c'est une ligne de liens au-dessus des trois faces.
 * Aucun cadre d'onglet : des liens à l'encre. La face qu'on lit est marquée
 * (`aria-current`) par un filet à la teinte du métier, la couleur de la
 * navigation (lot 6E) : jamais l'orange.
 *
 * Quand le tableau de bord est la SEULE navigation de l'écran (la carte
 * « Résultats » du parcours sur téléphone), il garde ses onglets
 * (`DashboardTabs`) : il n'y a alors rien à superposer.
 */
export interface FaceDuTour {
  cle: string;
  titre: string;
  contenu: ReactNode;
}

export function SommaireDuTour({
  idBase,
  etiquette,
  faces,
}: {
  /** Préfixe des ancres, unique dans la page : « tour-3 ». */
  idBase: string;
  /** Le nom du sommaire pour les lecteurs d'écran : « Résultats du trimestre 3 ». */
  etiquette: string;
  faces: readonly FaceDuTour[];
}) {
  const [courante, setCourante] = useState(faces[0]?.cle ?? "");

  // La face qu'on lit : la dernière dont le titre est passé sous le haut de la
  // fenêtre. Un observateur, pas un écouteur de défilement : rien ne tourne
  // tant que rien ne bouge.
  const cles = faces.map((f) => f.cle).join(" ");
  useEffect(() => {
    const sections = cles
      .split(" ")
      .map((cle) => document.getElementById(`${idBase}-${cle}`))
      .filter((e): e is HTMLElement => e !== null);
    if (sections.length === 0 || typeof IntersectionObserver === "undefined") return;
    const visibles = new Map<string, boolean>();
    const veille = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) visibles.set(e.target.id, e.isIntersecting);
        const premiere = sections.find((s) => visibles.get(s.id));
        if (premiere) setCourante(premiere.id.slice(idBase.length + 1));
      },
      { rootMargin: "-20% 0px -55% 0px" },
    );
    for (const s of sections) veille.observe(s);
    return () => veille.disconnect();
  }, [cles, idBase]);

  return (
    <div
      data-sommaire-du-tour=""
      className="lg:grid lg:grid-cols-[8.5rem_minmax(0,1fr)] lg:items-start lg:gap-8"
    >
      <nav
        aria-label={etiquette}
        className="mb-3 lg:sticky lg:top-24 lg:mb-0 lg:self-start lg:pt-1"
      >
        <ol className="flex flex-wrap gap-x-5 gap-y-1 text-sm lg:flex-col lg:gap-y-1">
          {faces.map((f) => {
            const active = f.cle === courante;
            return (
              <li key={f.cle}>
                <a
                  href={`#${idBase}-${f.cle}`}
                  aria-current={active ? "location" : undefined}
                  onClick={() => setCourante(f.cle)}
                  className={`inline-flex min-h-8 items-center border-b-2 font-medium transition-colors pointer-coarse:min-h-11 lg:border-b-0 lg:border-l-2 lg:pl-3 ${
                    active
                      ? "border-[color:var(--metier,var(--color-slate-300))] text-slate-50"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {f.titre}
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="min-w-0 space-y-8">
        {faces.map((f) => (
          <section
            key={f.cle}
            id={`${idBase}-${f.cle}`}
            aria-labelledby={`${idBase}-${f.cle}-titre`}
            data-face-du-tour={f.cle}
            className="scroll-mt-28 space-y-3"
          >
            <h3
              id={`${idBase}-${f.cle}-titre`}
              className="text-base font-semibold text-slate-100"
            >
              {f.titre}
            </h3>
            {f.contenu}
          </section>
        ))}
      </div>
    </div>
  );
}

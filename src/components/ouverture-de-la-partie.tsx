import type { ReactNode } from "react";
import type { Sector } from "@/config/scenarios/registry";
import { PhotoDuLieu } from "@/components/illustrations/scene-d-entreprise";

/**
 * L'OUVERTURE DE LA PARTIE : LE LIEU, AVANT TOUT CHIFFRE (lot P2).
 *
 * Au premier tour, l'arène s'ouvrait sur une ardoise VIDE (« Chiffre
 * d'affaires, résultat, trésorerie et rang s'afficheront ici… ») : 130 px pour
 * dire qu'il n'y avait rien, puis la bande de marché, la barre d'étapes, et
 * seulement à 490 px du haut la photo du lieu. L'audit : « un état vide est
 * une scène ». Au tour 1, l'écran s'ouvre donc sur le lieu, en pleine largeur,
 * avec posés dessus le nom de l'entreprise, son métier, le tour et une phrase
 * de prise de poste. L'ardoise revient au tour 2, avec les premiers chiffres.
 *
 * LE TEXTE SUR LA PHOTO SE LIT PARTOUT. Un voile marine en dégradé
 * (`.voile-de-scene`, globals.css) monte du bas et de la gauche, là où le
 * texte se pose. Le contraste a été MESURÉ sur la zone la plus claire de
 * chacune des neuf photos, texte masqué, pixel le plus clair sous chaque
 * ligne : voir `tests/e2e/mise-en-scene.e2e.ts` (≥ 4,5:1 partout).
 *
 * Deux formes :
 *   · `bandeau` (ordinateur) : en tête de l'arène, au-dessus de la bande de
 *     marché et des étapes ;
 *   · `carte` (téléphone) : la première carte du briefing, en plein cadre.
 *
 * Décorative, la photo est `aria-hidden` ; le nom et le reste sont du texte.
 * Elle entre une fois, d'un léger zoom et d'un fondu (`.entree-du-lieu`,
 * coupés par « moins de mouvement »).
 */
export function OuvertureDeLaPartie({
  scenario,
  secteur,
  entreprise,
  metier,
  description,
  tour,
  phrase,
  forme = "bandeau",
  children,
}: {
  scenario: string;
  secteur: Sector;
  /** « NOVA » */
  entreprise: string;
  /** « Industrie · Niveau 3 · Pilotage » */
  metier: string;
  /** « Fabricant d'enceintes portables. » */
  description: string;
  /**
   * « Tour 1 / 6 ». Absent sur téléphone : la barre de la partie le porte
   * déjà, une fois (« L'ESCALE · Tour 1/6 »).
   */
  tour?: string;
  /** La phrase de prise de poste. */
  phrase: string;
  forme?: "bandeau" | "carte";
  /** Ce qui accompagne le nom : l'échéance du tour, le pseudo du poste. */
  children?: ReactNode;
}) {
  const carte = forme === "carte";
  return (
    <section
      aria-labelledby="ouverture-de-la-partie"
      data-ouverture-de-la-partie={forme}
      className={`ardoise relative isolate overflow-hidden bg-slate-950 text-slate-100 ${
        carte ? "" : "rounded-xl"
      }`}
    >
      <PhotoDuLieu
        scenario={scenario}
        secteur={secteur}
        petit={carte}
        prioritaire
        sizes="(min-width: 1400px) 1352px, 100vw"
        className="entree-du-lieu absolute inset-0 -z-10 h-full w-full"
      />
      <div aria-hidden className="voile-de-scene absolute inset-0 -z-10" />
      <div
        data-texte-sur-photo=""
        className={`flex flex-col justify-end ${
          carte
            ? "min-h-[24rem] px-4 pb-5 pt-32"
            : "min-h-[19rem] px-5 pb-6 pt-28 sm:min-h-[23rem] sm:px-8 sm:pb-8 lg:min-h-[26rem]"
        }`}
      >
        {tour ? (
          <p className="mb-2 font-display text-xl font-semibold leading-none tabular-nums text-slate-100 sm:text-2xl">
            {tour}
          </p>
        ) : null}
        <h2
          id="ouverture-de-la-partie"
          className={`font-bold leading-[1.05] text-slate-50 ${
            carte ? "text-4xl" : "text-4xl sm:text-5xl lg:text-6xl"
          }`}
        >
          {entreprise}
        </h2>
        {/* Le métier à l'encre claire : une teinte de métier, moyenne, ne tient
            pas 4,5:1 sur toutes les photos voilées (mesuré : 2,6 sur la baie
            vitrée d'ATLAS). La teinte est dans le trait qui le précède, et
            dans l'arête du bandeau. */}
        <p className="mt-2 flex items-center gap-2 text-base font-semibold text-slate-100 sm:text-lg">
          <span aria-hidden className="h-0.5 w-5 shrink-0 rounded-full bg-[color:var(--metier,var(--color-slate-300))]" />
          {metier}
        </p>
        <p className="mt-0.5 max-w-2xl text-base text-slate-200 sm:text-lg">{description}</p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-100 sm:text-lg">{phrase}</p>
        {children ? <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div> : null}
      </div>
    </section>
  );
}

import { bandeauDeLEssai, type TourDEssai } from "@/config/tour-d-essai";
import { Icone } from "@/components/icone";

/**
 * LE BANDEAU DU TOUR D'ESSAI, en tête de l'arène, sur tous les écrans.
 *
 * Pendant l'essai : « Tour d'essai 1/2 · ne compte pas ». L'essai fini : la vraie
 * partie attend l'animateur. La vraie partie commencée : « La vraie partie
 * commence », jusqu'à la clôture de son premier tour. Le texte vient de
 * config/tour-d-essai.ts, qui le garde par ses tests.
 */
export function BandeauDuTourDEssai({
  essai,
  tour,
  vraiTourJoue,
}: {
  essai: Omit<TourDEssai, "scenario"> | null;
  tour: number;
  vraiTourJoue: boolean;
}) {
  const bandeau = bandeauDeLEssai({ essai, tour, vraiTourJoue });
  if (!bandeau) return null;
  return (
    <aside
      role="status"
      aria-label={bandeau.titre}
      data-bandeau-d-essai={bandeau.ton}
      className="encadre-neutre rounded-xl px-4 py-3"
    >
      <p className="flex items-start gap-2 text-base font-semibold text-slate-50">
        <Icone nom={bandeau.ton === "essai" ? "recommencer" : "cible"} className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{bandeau.titre}</span>
      </p>
      <p className="mt-1 text-sm leading-relaxed text-slate-300">{bandeau.texte}</p>
    </aside>
  );
}

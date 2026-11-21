import { PodiumDesEquipes, type MarcheDuPodium } from "@/components/podium";
import { Icone } from "@/components/icone";
import { PODIUM_DE_L_ESSAI } from "@/config/tour-d-essai";

/**
 * LE PODIUM DU TOUR D'ESSAI, À L'ÉCRAN DE L'ÉLÈVE, sur ordinateur et sur téléphone.
 *
 * L'essai clos, il finit par son podium, titré pour ce qu'il est : « Podium du tour
 * d'essai · ne compte pas ». Sous le rideau, rien qu'une phrase : l'enseignant le
 * révélera, et la vue n'a reçu aucune marche. La vraie partie commencée, il se
 * retrouve sous « Revoir le tour d'essai », replié quand l'élève l'a déjà vu, ouvert
 * quand la vraie partie a commencé d'elle-même à la clôture de l'essai.
 */
export function PodiumDeLEssai({
  revele,
  marches,
  replie = null,
}: {
  revele: boolean;
  marches: readonly MarcheDuPodium[];
  /** Après la bascule : le podium se range sous « Revoir le tour d'essai », ouvert ou non. */
  replie?: { ouvert: boolean } | null;
}) {
  if (!revele) {
    return (
      <aside
        role="status"
        data-podium-de-l-essai="voile"
        className="encadre-neutre rounded-xl px-4 py-3"
      >
        <p className="flex items-start gap-2 text-base font-semibold text-slate-50">
          <Icone nom="trophee" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{PODIUM_DE_L_ESSAI.titre}</span>
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">{PODIUM_DE_L_ESSAI.rideau}</p>
      </aside>
    );
  }
  const podium = (
    <>
      <h2 className="flex items-start gap-2 text-base font-semibold text-slate-50">
        <Icone nom="trophee" className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{PODIUM_DE_L_ESSAI.titre}</span>
      </h2>
      <div className="mx-auto mt-3 max-w-md">
        <PodiumDesEquipes marches={marches} etiquette="Podium du tour d'essai" />
      </div>
    </>
  );
  if (replie) {
    return (
      <details
        data-podium-de-l-essai="revele"
        open={replie.ouvert}
        className="encadre-neutre rounded-xl px-4 py-3"
      >
        <summary className="cursor-pointer text-sm font-semibold text-slate-200">
          {PODIUM_DE_L_ESSAI.revoir}
        </summary>
        <div className="mt-3">{podium}</div>
      </details>
    );
  }
  return (
    <section data-podium-de-l-essai="revele" className="encadre-neutre rounded-xl px-4 py-3">
      {podium}
    </section>
  );
}

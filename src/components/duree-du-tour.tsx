import { compter } from "@/lib/format";
import type { DureeDuTour } from "@/config/duree-du-tour";

/**
 * CE QUE CE TOUR VA COÛTER EN TEMPS.
 *
 * L'enseignant pose une fenêtre, annonce « vous avez vingt minutes », décide
 * s'il fait un tour ou deux dans l'heure — et l'application ne lui donnait rien
 * pour trancher, alors qu'elle sait exactement ce qu'elle demande : le texte à
 * lire, les champs à remplir, la situation à analyser.
 *
 * DEUX SOURCES, ET L'ORDRE COMPTE. La médiane MESURÉE dans cette partie prime
 * toujours : c'est ce que cette classe-ci a réellement mis. L'estimation ne
 * parle que tant qu'il n'y a rien à mesurer, et elle se donne pour ce qu'elle
 * est — un calcul sur du volume de texte et un compte de champs, avec son
 * détail affiché pour qu'on puisse le contester.
 */
export function DureeDuTourAffichee({
  estimation,
  mesure,
  libelleTourMesure,
  compact = false,
}: {
  estimation: DureeDuTour;
  /** Médiane mesurée sur le dernier tour clos de cette partie, en minutes. */
  mesure: number | null;
  /** Le tour d'où vient la mesure (« Trimestre 2 »). */
  libelleTourMesure: string | null;
  /** Une phrase seule, pour une note de rubrique. */
  compact?: boolean;
}) {
  if (compact) {
    return (
      <>
        {mesure !== null ? `≈ ${mesure} min (mesuré)` : `≈ ${estimation.minutes} min (estimé)`}
      </>
    );
  }

  const postes = [
    estimation.lecture > 0 ? `${estimation.lecture} min de lecture` : null,
    estimation.saisie > 0 ? `${estimation.saisie} min de saisie` : null,
    estimation.analyse > 0 ? `${estimation.analyse} min d'analyse` : null,
    estimation.priseEnMain > 0 ? `${estimation.priseEnMain} min de prise en main` : null,
  ].filter((p): p is string => p !== null);

  return (
    <div className="rounded-lg border border-white/5 bg-slate-950 px-3 py-2.5 text-xs leading-relaxed text-slate-400">
      {mesure !== null ? (
        <>
          <p className="text-slate-200">
            <span aria-hidden>⏱️</span> Dans cette partie, un tour a pris{" "}
            <strong className="font-semibold text-slate-100">{compter(mesure, "minute")}</strong>
            {libelleTourMesure ? ` au ${libelleTourMesure.toLowerCase()}` : null}, médiane des
            équipes entre l&apos;ouverture du tour et leur validation.
          </p>
          <p className="mt-1">
            L&apos;estimation à partir du contenu en donnait {estimation.minutes} min. C&apos;est
            la mesure qui compte : elle vient de vos élèves.
          </p>
        </>
      ) : (
        <>
          <p className="text-slate-200">
            <span aria-hidden>⏱️</span> Comptez environ{" "}
            <strong className="font-semibold text-slate-100">
              {compter(estimation.minutes, "minute")}
            </strong>{" "}
            pour ce tour{postes.length > 0 ? ` : ${postes.join(", ")}` : null}.
          </p>
          {/* Une estimation qui se présente comme une mesure est pire qu'une
              absence d'estimation : elle se fait croire une fois, puis plus
              jamais. Celle-ci dit d'où elle sort. */}
          <p className="mt-1">
            Estimation calculée sur le volume de texte et le nombre de champs, pas une mesure.
            Le temps réel de vos équipes la remplacera dès qu&apos;un tour sera mesurable : le
            deuxième tour clos, ou le premier si vous posez un planning ci-dessous.
          </p>
        </>
      )}
    </div>
  );
}

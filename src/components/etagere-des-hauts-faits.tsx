import type { CaseDeLEtagere } from "@/scoring/hauts-faits";

/**
 * L'ÉTAGÈRE : ce que l'équipe a réussi depuis le début, et ce qu'elle peut
 * encore viser.
 *
 * Un haut fait se disait au tour où il arrivait, puis disparaissait avec lui —
 * une ligne verte lue une fois, dans un accordéon qu'on replie. Au sixième
 * tour, plus rien ne rappelait qu'on avait sauvé la trésorerie au deuxième.
 *
 * LES CASES VIDES COMPTENT AUTANT QUE LES PLEINES. Un haut fait qu'on ne
 * connaît pas ne se vise pas : montrer les quatre, franchis ou non, transforme
 * une récompense en objectif. C'est la seule chose de l'arène qui dise « voilà
 * ce qu'il est possible de réussir » — et elle le dit sans promettre un point,
 * parce qu'il n'y en a pas : ni score, ni monnaie, ni effet sur la partie.
 *
 * LA FORME DIT L'ÉTAT, PAS SEULEMENT LA COULEUR. L'étoile est pleine ou creuse,
 * le trait plein ou pointillé : un daltonien, une impression en noir et blanc
 * et un écran mal réglé lisent l'étagère aussi bien qu'un autre.
 */
export function EtagereDesHautsFaits({
  cases,
  /** Le nom du tour, dans la langue du scénario : « Trimestre 2 ». */
  nommerLeTour,
}: {
  cases: readonly CaseDeLEtagere[];
  nommerLeTour: (round: number) => string;
}) {
  const acquis = cases.filter((c) => c.round !== null).length;
  if (cases.length === 0) return null;

  return (
    <section aria-labelledby="etagere" className="carte px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="etagere" className="text-sm font-semibold text-slate-200">
          <span aria-hidden>★</span> Vos hauts faits
        </h2>
        <p className="text-xs tabular-nums text-slate-400">
          {acquis} sur {cases.length}
        </p>
      </div>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {cases.map(({ fait, round }) => {
          const acquise = round !== null;
          return (
            <li
              key={fait.code}
              className={`rounded-lg border px-3 py-2 ${
                acquise
                  ? "border-emerald-400/30 bg-emerald-950/20"
                  : "border-dashed border-white/15 bg-slate-950/40"
              }`}
            >
              <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span aria-hidden className={acquise ? "text-emerald-300" : "text-slate-400"}>
                  {acquise ? "★" : "☆"}
                </span>
                <span
                  className={`text-sm font-semibold ${acquise ? "text-emerald-200" : "text-slate-300"}`}
                >
                  {fait.titre}
                </span>
                {acquise ? (
                  <span className="rounded-full border border-emerald-400/25 px-2 py-0.5 text-xs text-emerald-300">
                    {nommerLeTour(round)}
                  </span>
                ) : (
                  // La MÊME pastille que le tour franchi, en pointillé : les
                  // deux états se lisent au même endroit, dans la même forme.
                  // « À viser » plutôt qu'un cadenas — rien n'est verrouillé,
                  // c'est seulement à faire.
                  <span className="rounded-full border border-dashed border-white/20 px-2 py-0.5 text-xs text-slate-400">
                    à viser
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">
                {acquise ? fait.detail : fait.viser}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

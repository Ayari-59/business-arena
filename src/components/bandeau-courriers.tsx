import { courrierParCode } from "@/config/courriers/registre";

/**
 * Le bandeau du courrier distribué.
 *
 * Constaté en production : quand l'enseignant distribuait un courrier,
 * l'annonce était rendue en bas de l'onglet Situation, après le texte de la
 * situation et le diagnostic, deux mille caractères sous le pli. L'élève qui
 * ouvre directement l'onglet Décisions décidait sans savoir que le monde
 * venait de changer.
 *
 * Ce bandeau se pose sous l'en-tête de la page, hors des onglets : expéditeur,
 * objet, effet en une ligne, destinataire. Le corps de la lettre, la
 * mini-leçon et l'ouverture de l'enveloppe restent dans l'onglet Situation, où
 * renvoie « Voir le détail ».
 *
 * Il ne montre que ce qui s'applique à l'équipe qui lit : les courriers de
 * marché, et ceux qui lui sont adressés. Un pli envoyé à une autre entreprise
 * n'est pas une consigne pour celle-ci.
 */
export interface CourrierAnnonce {
  code: string;
  teamId: string | null;
  teamName: string | null;
  isMyTeam: boolean;
}

/** Les courriers qui s'appliquent à l'équipe qui lit. */
export function courriersQuiMeConcernent(
  courriers: readonly CourrierAnnonce[],
): CourrierAnnonce[] {
  return courriers.filter((c) => c.teamId === null || c.isMyTeam);
}

export function BandeauCourriers({
  courriers,
  detailHref = "#situation",
}: {
  courriers: readonly CourrierAnnonce[];
  /** Où lire la lettre entière : l'onglet Situation, par défaut. */
  detailHref?: string;
}) {
  const visibles = courriersQuiMeConcernent(courriers);
  if (visibles.length === 0) return null;

  return (
    <aside
      role="status"
      aria-label="Courrier distribué pour ce tour"
      className="rounded-xl border border-amber-400/40 bg-amber-950/20 px-4 py-3"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
        📬 Votre enseignant vous adresse {visibles.length > 1 ? "des courriers" : "un courrier"} :
        {visibles.length > 1 ? " ils s'appliquent" : " il s'applique"} à ce tour
      </p>
      <ul className="mt-2 space-y-1.5">
        {visibles.map((courrier) => {
          const def = courrierParCode.get(courrier.code);
          const cible = courrier.teamId === null ? "Tout le marché" : "🎯 Votre entreprise";
          return (
            <li
              key={`${courrier.code}-${courrier.teamId ?? "market"}`}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm"
            >
              <span className="font-semibold text-slate-100">
                {def ? `${def.emoji} ${def.objet}` : `✉️ ${courrier.code}`}
              </span>
              {def ? <span className="text-xs text-slate-400">{def.expediteur}</span> : null}
              {def ? <span className="text-slate-300">{def.effet}</span> : null}
              <span
                className={`rounded-full border px-2 py-0.5 text-xs ${
                  courrier.isMyTeam
                    ? "border-sky-400/60 bg-sky-400/10 text-sky-300"
                    : "border-white/10 bg-white/5 text-slate-400"
                }`}
              >
                {cible}
              </span>
            </li>
          );
        })}
      </ul>
      <a
        href={detailHref}
        className="mt-2 inline-block text-xs text-amber-300 underline-offset-4 hover:underline"
      >
        Lire la lettre dans la situation
      </a>
    </aside>
  );
}

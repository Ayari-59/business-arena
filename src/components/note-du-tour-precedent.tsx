/**
 * CE QUE VOUS AVIEZ ÉCRIT AVANT DE SAVOIR.
 *
 * À chaque tour, l'équipe justifie ses choix en quelques mots. Cette note
 * partait vers l'enseignant et l'élève ne la revoyait jamais : la seule trace
 * d'un raisonnement formé AVANT le résultat se perdait au moment précis où
 * elle devenait utile.
 *
 * Elle revient donc ici, collée au constat du tour écoulé. C'est la
 * confrontation qui enseigne, pas la note : « j'avais prévu que baisser le
 * prix remplirait la salle », puis le chiffre qui dit si c'est arrivé. Le
 * texte est cité tel quel, sans jugement ni correction — l'écart se lit tout
 * seul, et le débriefing avec l'enseignant part de là.
 */
export function NoteDuTourPrecedent({
  texte,
  periode,
}: {
  /** La justification saisie au tour précédent. Rien ne s'affiche si elle est vide. */
  texte: string | null;
  /** Le tour d'où vient la note, nommé dans la langue du scénario (« Trimestre 2 »). */
  periode: string;
}) {
  const note = texte?.trim();
  if (!note) return null;
  return (
    <div className="mt-3 border-l-2 border-slate-600 pl-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        ✍️ Ce que vous aviez écrit avant de valider {periode.toLowerCase()}
      </p>
      {/*
        La citation est en italique et dans la teinte du texte courant : c'est
        la voix de l'équipe, pas celle de l'application. Elle garde ses retours
        à la ligne, parce qu'une note en trois tirets est une note en trois
        tirets.
      */}
      <blockquote className="mt-1 whitespace-pre-line text-sm italic leading-relaxed text-slate-200">
        {note}
      </blockquote>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
        Comparez avec ce qui s&apos;est passé : là où votre raisonnement tenait, gardez-le ; là où
        il s&apos;est trompé, cherchez pourquoi avant de décider ce tour-ci.
      </p>
    </div>
  );
}

import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { bouton } from "@/components/bouton";
import { phrasesDuRetour, type EtatDuRetour } from "@/lti/ags/textes";

/**
 * L'ENCART DU CARNET DE NOTES, sur la page d'un examen ouvert depuis une plateforme de
 * cours (lti/ags) : la plateforme accepte-t-elle les notes, combien sont parties, quelle
 * erreur pour les autres, et « Renvoyer les notes ». Le bouton est secondaire : le seul
 * bouton plein de l'écran reste « Publier les résultats ».
 */
export function RetourDesNotes({
  etat,
  renvoyer,
}: {
  etat: EtatDuRetour;
  renvoyer: (fd: FormData) => Promise<unknown>;
}) {
  const p = phrasesDuRetour(etat);
  return (
    <section
      aria-labelledby="retour-des-notes-titre"
      className="carte grid gap-3 p-4 sm:p-6"
      data-retour-des-notes={etat.accorde ? (etat.publie ? "publie" : "accorde") : "non-accorde"}
    >
      <h2 id="retour-des-notes-titre" className="titre-carte text-slate-100">
        {p.titre}
      </h2>
      <p className="text-sm leading-relaxed text-slate-200" data-resume-du-retour="">
        {p.resume.avant}
        {p.resume.chiffre ? <strong className="tabular-nums text-slate-50">{p.resume.chiffre}</strong> : null}
        {p.resume.apres}
      </p>
      {p.details.length > 0 ? (
        <ul className="grid gap-1 text-sm leading-relaxed text-slate-300" data-details-du-retour="">
          {p.details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      ) : null}
      {p.renvoi ? (
        <GuardedForm action={renvoyer} label="renvoi des notes à la plateforme">
          <SubmitButton pendingLabel="Renvoi…" className={bouton({ variante: "secondaire" })}>
            Renvoyer les notes
          </SubmitButton>
        </GuardedForm>
      ) : null}
    </section>
  );
}

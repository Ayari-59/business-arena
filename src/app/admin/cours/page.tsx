import { avecTypographie } from "@/components/typographie";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getStaffContext } from "@/services/admin.service";
import { attributionsPourLAdmin } from "@/services/attributions.service";
import { PARCOURS_PROPOSES_A_CHOISIR } from "@/config/cours/parcours-de-formation";
import { EnTeteAdmin } from "@/components/en-tete-admin";
import { SubmitButton } from "@/components/submit-button";
import { bouton } from "@/components/bouton";
import { attribuerALEnseignantAction, attribuerALEtablissementAction } from "./actions";

export const metadata: Metadata = { title: "Cours attribués · Administration" };

const MESSAGES: Record<string, string> = {
  etablissement: "La liste de l'établissement est enregistrée.",
  enseignant: "La liste de l'enseignant est enregistrée.",
};

/** Les cases à cocher d'une liste de parcours, avec ceux déjà attribués cochés. */
function CasesDesParcours({ coches, nom }: { coches: readonly string[]; nom: string }) {
  return (
    <fieldset className="grid gap-1 sm:grid-cols-2">
      <legend className="sr-only">Parcours attribués {nom}</legend>
      {PARCOURS_PROPOSES_A_CHOISIR.map((p) => (
        <label key={p.code} className="flex items-start gap-2 text-sm text-slate-200">
          <input type="checkbox" name="parcours" value={p.code} defaultChecked={coches.includes(p.code)} className="mt-1" />
          <span>{p.titre}</span>
        </label>
      ))}
    </fieldset>
  );
}

/**
 * LES COURS ATTRIBUÉS (décision du propriétaire, novembre 2026 ; migration 0056).
 *
 * La licence de l'établissement ouvre le cours ; ici, l'admin le RESTREINT à des parcours, pour
 * tout l'établissement ou pour un enseignant, dont la liste l'emporte. Une liste vide efface la
 * restriction. Une attribution n'ouvre jamais plus que l'offre, et les chapitres libres restent
 * ouverts à tous (la règle : services/chapitres-de-la-classe.ts).
 */
async function AdminCoursPage({ searchParams }: { searchParams: Promise<{ fait?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const context = await getStaffContext(session.userId);
  if (!context?.isPlatformAdmin) redirect("/teacher");
  const [{ fait }, etablissements] = await Promise.all([searchParams, attributionsPourLAdmin()]);
  return (
    <main id="main" className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <EnTeteAdmin titre="Cours attribués" actif="cours" />
      {fait && MESSAGES[fait] ? (
        <p role="status" className="rounded-lg encadre-gain px-4 py-2.5 text-sm">
          {MESSAGES[fait]}
        </p>
      ) : null}
      <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
        La licence de l&apos;établissement ouvre le cours. Cochez des parcours pour le restreindre à ceux-là, pour tout
        l&apos;établissement ou pour un enseignant : la liste de l&apos;enseignant l&apos;emporte. Sans case cochée, rien n&apos;est
        restreint. Une attribution n&apos;ouvre jamais plus que l&apos;offre, et les chapitres libres, un par diplôme, restent ouverts à tous.
      </p>
      {etablissements.length === 0 ? (
        <p className="text-sm text-slate-400">Aucun établissement.</p>
      ) : (
        <ul className="space-y-3">
          {etablissements.map((e) => (
            <li key={e.id} id={`etablissement-${e.id}`} className="carte scroll-mt-6 p-4" data-attributions-etablissement={e.id}>
              <details open={e.parcours.length > 0 || e.enseignants.some((x) => x.parcours.length > 0) || undefined}>
                <summary className="cursor-pointer text-sm font-semibold text-slate-100">
                  {e.nom}
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    {e.parcours.length === 0 ? "selon l'offre" : `${e.parcours.length} parcours attribué${e.parcours.length > 1 ? "s" : ""}`}
                  </span>
                </summary>
                <form action={attribuerALEtablissementAction.bind(null, e.id)} className="mt-3 grid gap-3">
                  <CasesDesParcours coches={e.parcours} nom={`à ${e.nom}`} />
                  <div>
                    <SubmitButton pendingLabel="Enregistrement…" className={bouton({ taille: "s" })}>
                      Enregistrer pour l&apos;établissement
                    </SubmitButton>
                  </div>
                </form>
                {e.enseignants.length > 0 ? (
                  <ul className="mt-4 space-y-2 border-t border-white/10 pt-3">
                    {e.enseignants.map((t) => (
                      <li key={t.id} data-attributions-enseignant={t.id}>
                        <details open={t.parcours.length > 0 || undefined}>
                          <summary className="cursor-pointer text-sm text-slate-200">
                            {t.nom} <span className="text-xs text-slate-400">{t.email}</span>
                            <span className="ml-2 text-xs text-slate-400">
                              {t.parcours.length === 0 ? "comme l'établissement" : `${t.parcours.length} parcours à lui`}
                            </span>
                          </summary>
                          <form action={attribuerALEnseignantAction.bind(null, e.id, t.id)} className="mt-2 grid gap-3">
                            <CasesDesParcours coches={t.parcours} nom={`à ${t.nom}`} />
                            <div>
                              <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire", taille: "s" })}>
                                Enregistrer pour cet enseignant
                              </SubmitButton>
                            </div>
                          </form>
                        </details>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </details>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default avecTypographie(AdminCoursPage);

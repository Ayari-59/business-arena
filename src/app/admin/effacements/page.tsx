import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getStaffContext } from "@/services/admin.service";
import { EnTeteAdmin } from "@/components/en-tete-admin";
import { SuppressionConfirmee } from "@/components/suppression-confirmee";
import { bouton } from "@/components/bouton";
import { SubmitButton } from "@/components/submit-button";
import { MOT_DE_SUPPRESSION } from "@/config/conservation";
import { chercherDesEleves, etablissementsEffacables } from "@/services/effacement.service";
import { supprimerEleveAction, supprimerEtablissementAction } from "./actions";

export const dynamic = "force-dynamic";

const FAITS: Record<string, string> = {
  etablissement: "L'établissement et ses données ont été supprimés.",
  eleve: "L'élève et ses données ont été supprimés.",
};

const jour = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

/**
 * LES EFFACEMENTS SUR DEMANDE (RGPD, droit à l'effacement).
 *
 * Un établissement qui quitte Business Arena, ou un élève (ou ses parents) qui demande
 * l'effacement, écrit à l'adresse de contact des mentions légales ; l'administrateur fait le
 * geste ici. Chaque suppression se confirme dans la page en tapant un mot, jamais par une
 * boîte du navigateur, et se note au journal de l'administration sans recopier la donnée
 * effacée. La purge automatique de chaque nuit, elle, applique les durées de
 * config/conservation.ts.
 */
export default async function EffacementsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; fait?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const context = await getStaffContext(session.userId);
  if (!context?.isPlatformAdmin) redirect("/teacher");
  const { q = "", fait } = await searchParams;
  const [etablissements, eleves] = await Promise.all([etablissementsEffacables(), chercherDesEleves(q)]);

  return (
    <main id="main" className="mx-auto max-w-5xl space-y-8 p-6">
      <EnTeteAdmin titre="Effacements sur demande" actif="effacements" />
      {fait && FAITS[fait] ? (
        <p role="status" className="text-sm text-emerald-300">
          {FAITS[fait]}
        </p>
      ) : null}

      <section className="carte grid gap-4 p-4 sm:p-6" aria-labelledby="effacer-eleve" data-effacer-eleve="">
        <h2 id="effacer-eleve" className="text-lg font-semibold text-slate-50">
          Un élève sans compte
        </h2>
        <p className="text-sm text-slate-300">
          Cherchez l&apos;élève par son pseudo, ou par le code de la partie qu&apos;il a rejointe. La suppression
          emporte son identité, ses parties à lui (solo, examen), ses notes d&apos;examen et ses rattachements ; les
          parties de classe restent à son équipe, sans lui.
        </p>
        <form method="get" role="search" className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-sm text-slate-300">
            Pseudo ou code de partie
            <input name="q" defaultValue={q} minLength={2} className="champ px-3 py-2 text-sm text-slate-100" />
          </label>
          <SubmitButton pendingLabel="Recherche…" className={bouton({ variante: "secondaire" })}>
            Chercher
          </SubmitButton>
        </form>
        {q.trim().length >= 2 ? (
          eleves.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun élève sans compte ne correspond.</p>
          ) : (
            <ul className="grid gap-3">
              {eleves.map((e) => (
                <li key={e.id} className="grid gap-2 rounded-lg border border-white/10 p-3">
                  <p className="text-sm text-slate-100">
                    <strong>{e.pseudo}</strong>, depuis le {jour(e.creeLe)}
                  </p>
                  <p className="text-sm text-slate-400">
                    {e.parties.length === 0
                      ? "Dans aucune partie de classe."
                      : e.parties
                          .map((p) => `${p.nom ?? "partie"}${p.code ? ` (${p.code})` : ""}, ${p.etablissement}`)
                          .join(" · ")}
                  </p>
                  <SuppressionConfirmee
                    action={supprimerEleveAction}
                    ouvrir="Supprimer cet élève"
                    confirmer="Supprimer définitivement l'élève"
                    mot={MOT_DE_SUPPRESSION}
                    champs={{ eleve: e.id }}
                    label="effacement d'un élève"
                  >
                    {e.pseudo} sera supprimé avec ses parties à lui et ses notes d&apos;examen. Rien ne se récupère
                    ensuite.
                  </SuppressionConfirmee>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </section>

      <section className="carte grid gap-4 p-4 sm:p-6" aria-labelledby="effacer-etablissement" data-effacer-etablissement="">
        <h2 id="effacer-etablissement" className="text-lg font-semibold text-slate-50">
          Un établissement entier
        </h2>
        <p className="text-sm text-slate-300">
          La suppression emporte ses parties, classes, examens, concours, cohortes, licences et codes
          d&apos;invitation ; les comptes de ses enseignants qui n&apos;appartiennent à aucun autre établissement ;
          les élèves sans compte qui n&apos;étaient rattachés qu&apos;à lui. Les comptes administrateurs de la
          plateforme et de démonstration restent.
        </p>
        {etablissements.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun établissement.</p>
        ) : (
          <ul className="grid gap-3">
            {etablissements.map((o) => (
              <li key={o.id} className="grid gap-2 rounded-lg border border-white/10 p-3">
                <p className="text-sm text-slate-100">{o.nom}</p>
                <SuppressionConfirmee
                  action={supprimerEtablissementAction}
                  ouvrir="Supprimer cet établissement"
                  confirmer="Supprimer définitivement l'établissement"
                  mot={MOT_DE_SUPPRESSION}
                  champs={{ organisation: o.id }}
                  label="effacement d'un établissement"
                >
                  {o.nom} sera supprimé avec toutes ses données. Rien ne se récupère ensuite.
                </SuppressionConfirmee>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

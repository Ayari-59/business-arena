import Link from "next/link";
import { redirect } from "next/navigation";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { bouton } from "@/components/bouton";
import { SITE_URL } from "@/config/site";
import { getSession } from "@/lib/session";
import { getStaffContext } from "@/services/admin.service";
import { listerCohortes, organisationsPourLesCohortes } from "@/services/cohortes.service";
import { EPISODES_DE_DEMO } from "@/config/episodes/demos";
import { episodeParCode } from "@/pedagogy/episodes/registre";
import type { LicenceState } from "@/services/licence.service";
import {
  creerCohorteAction,
  rattacherCohorteAction,
  renouvelerCleAnimateurAction,
} from "./actions";

/**
 * Ce que les membres d'une cohorte peuvent jouer, selon la licence de son organisation,
 * les épisodes qu'elle porte (nul : tous) et si elle est close.
 */
function ceQuOuvreLaCohorte(
  licence: LicenceState | null,
  episodes: readonly string[] | null,
  close: boolean,
): string {
  if (close) {
    return "Close : plus de nouveaux participants, aucun nouvel épisode ouvert par la cohorte.";
  }
  if (licence === "active" || licence === "bientot_expiree") {
    return episodes
      ? `Sous licence : les membres jouent ${episodes.length > 1 ? `les ${episodes.length} épisodes` : "l'épisode"} de la cohorte, et les démonstrations.`
      : "Sous licence : les membres jouent tous les épisodes.";
  }
  return `Sans licence en cours : les membres ne jouent que les ${EPISODES_DE_DEMO.length} démonstrations, en Découverte.`;
}

export const dynamic = "force-dynamic";

/**
 * LES COHORTES D'ÉPISODES MANAGER, DEPUIS L'ADMINISTRATION.
 *
 * Créer une cohorte demandait l'accès à la base de production, par un script.
 * Ici, l'administrateur général la crée d'un formulaire et repart avec les
 * deux liens : l'invitation pour les managers, le lien de l'animateur pour
 * lui seul. Si ce dernier a circulé, on le remplace sans toucher aux membres.
 *
 * Les enseignants sous licence créent aussi les leurs, depuis leur espace
 * (/teacher/cohortes) : la page les montre toutes, avec leur créateur, les épisodes
 * qu'elles ouvrent et leur état (close ou non).
 */
export default async function CohortesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    creee?: string;
    renouvelee?: string;
    rattachee?: string;
    erreur?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const context = await getStaffContext(session.userId);
  if (!context?.isPlatformAdmin) redirect("/teacher");
  const { creee, renouvelee, rattachee, erreur } = await searchParams;
  const [cohortes, organisations] = await Promise.all([
    listerCohortes(),
    organisationsPourLesCohortes(),
  ]);
  const choixDeLOrganisation = (defaut: string, nom = "organisation") => (
    <select
      name={nom}
      defaultValue={defaut}
      aria-label="Organisation de l'animateur"
      className="champ px-3 py-2 text-sm"
    >
      <option value="">Aucune (démonstrations seulement)</option>
      {organisations.map((o) => (
        <option key={o.id} value={o.id}>
          {o.nom}
        </option>
      ))}
    </select>
  );

  return (
    <main id="main" className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-annonce text-amber-400">
            Administration générale
          </p>
          <h1 className="text-2xl font-bold">Cohortes d&apos;épisodes manager</h1>
        </div>
        <nav className="flex flex-wrap gap-4 text-xs text-slate-400">
          <Link href="/admin" className="hover:text-slate-300">
            ← Plateforme
          </Link>
        </nav>
      </header>

      <section className="carte grid gap-3 p-5">
        <h2 className="text-lg font-bold text-slate-50">Créer une cohorte</h2>
        <p className="max-w-2xl text-sm text-slate-400">
          Un nom qui dit l&apos;entreprise, le groupe et la période : il s&apos;affiche aux managers
          sur la page d&apos;invitation. L&apos;organisation est celle de l&apos;animateur : sous
          licence, elle ouvre tous les épisodes aux membres ; sans licence, ils ne jouent que les
          démonstrations. Les licences se posent depuis la page Plateforme.
        </p>
        <GuardedForm action={creerCohorteAction} label="création d'une cohorte">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid min-w-72 flex-1 gap-1">
              <span className="text-xs uppercase tracking-wide text-slate-400">Nom</span>
              <input
                name="nom"
                required
                maxLength={120}
                placeholder="ACME · managers de proximité · automne 2026"
                className="champ px-3 py-2"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs uppercase tracking-wide text-slate-400">Organisation</span>
              {choixDeLOrganisation("")}
            </label>
            <SubmitButton pendingLabel="Création…" className={bouton({})}>
              Créer la cohorte
            </SubmitButton>
          </div>
        </GuardedForm>
        {erreur && (
          <p role="alert" className="text-sm text-red-300">
            Donnez un nom à la cohorte.
          </p>
        )}
      </section>

      {(creee || renouvelee || rattachee) && (
        <p role="status" className="text-sm text-amber-200">
          {creee
            ? `Cohorte ${creee} créée. Envoyez l'invitation aux managers, et le lien de l'animateur à lui seul.`
            : renouvelee
              ? "Nouveau lien d'animateur créé : l'ancien n'ouvre plus rien."
              : "Organisation de la cohorte enregistrée."}
        </p>
      )}

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-slate-50">
          {cohortes.length} cohorte{cohortes.length > 1 ? "s" : ""}
        </h2>
        <ul className="grid gap-3">
          {cohortes.map((c) => {
            const invitation = `${SITE_URL}/entreprises/episode/rejoindre?code=${c.code}`;
            const animation = `${SITE_URL}/entreprises/episode/animation/${c.cleAnimateur}`;
            return (
              <li
                key={c.id}
                className={`carte grid gap-2 p-4 ${creee === c.code ? "ring-1 ring-amber-400/50" : ""}`}
              >
                <p className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-semibold text-slate-50">{c.nom}</span>
                  <span className="font-mono text-xs text-slate-400">{c.code}</span>
                  <span className="text-xs text-slate-400">
                    {c.membres} membre{c.membres > 1 ? "s" : ""} · créée le{" "}
                    {c.creeeLe.toLocaleDateString("fr-FR")}
                  </span>
                </p>
                <p className="text-sm text-slate-300" data-createur-de-la-cohorte="">
                  {c.creePar
                    ? `Créée par ${c.creePar.nom || c.creePar.email} (${c.creePar.email}), depuis son espace enseignant.`
                    : "Créée par l'administration."}
                </p>
                <p className="text-sm text-slate-300" data-acces-de-la-cohorte="">
                  {c.organisation ? `${c.organisation.nom} · ` : "Aucune organisation · "}
                  {ceQuOuvreLaCohorte(c.organisation?.licence ?? null, c.episodes, !!c.closeLe)}
                </p>
                {c.episodes ? (
                  <p className="text-xs text-slate-400" data-episodes-de-la-cohorte="">
                    Épisodes :{" "}
                    {c.episodes
                      .map((code) => {
                        const ep = episodeParCode(code);
                        return ep ? `${ep.numero} · ${ep.titre}` : code;
                      })
                      .join(" ; ")}
                  </p>
                ) : null}
                <GuardedForm
                  action={rattacherCohorteAction.bind(null, c.id)}
                  label="rattachement de la cohorte"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {choixDeLOrganisation(c.organisation?.id ?? "")}
                    <SubmitButton
                      pendingLabel="Enregistrement…"
                      className="text-sm text-slate-300 underline hover:text-slate-100"
                    >
                      Rattacher
                    </SubmitButton>
                  </div>
                </GuardedForm>
                <p className="text-sm text-slate-300">
                  Invitation :{" "}
                  <span className="break-all font-mono text-xs text-slate-100">{invitation}</span>
                </p>
                <details className="text-sm" open={creee === c.code}>
                  <summary className="cursor-pointer text-slate-400 hover:text-slate-200">
                    Lien de l&apos;animateur, à ne transmettre qu&apos;à lui
                  </summary>
                  <p className="mt-1 break-all font-mono text-xs text-slate-100">{animation}</p>
                  <GuardedForm
                    action={renouvelerCleAnimateurAction.bind(null, c.id)}
                    label="renouvellement du lien d'animateur"
                    className="mt-2"
                  >
                    <SubmitButton
                      pendingLabel="Renouvellement…"
                      className="text-xs text-slate-400 underline hover:text-slate-200"
                    >
                      Remplacer ce lien (l&apos;ancien cessera de fonctionner)
                    </SubmitButton>
                  </GuardedForm>
                </details>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { bouton } from "@/components/bouton";
import { SITE_URL } from "@/config/site";
import { getSession } from "@/lib/session";
import { getStaffContext } from "@/services/admin.service";
import { listerCohortes } from "@/services/cohortes.service";
import { creerCohorteAction, renouvelerCleAnimateurAction } from "./actions";

export const dynamic = "force-dynamic";

/**
 * LES COHORTES D'ÉPISODES MANAGER, DEPUIS L'ADMINISTRATION.
 *
 * Créer une cohorte demandait l'accès à la base de production, par un script.
 * Ici, l'administrateur général la crée d'un formulaire et repart avec les
 * deux liens : l'invitation pour les managers, le lien de l'animateur pour
 * lui seul. Si ce dernier a circulé, on le remplace sans toucher aux membres.
 */
export default async function CohortesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ creee?: string; renouvelee?: string; erreur?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const context = await getStaffContext(session.userId);
  if (!context?.isPlatformAdmin) redirect("/teacher");
  const { creee, renouvelee, erreur } = await searchParams;
  const cohortes = await listerCohortes();

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
          sur la page d&apos;invitation.
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

      {(creee || renouvelee) && (
        <p role="status" className="text-sm text-amber-200">
          {creee
            ? `Cohorte ${creee} créée. Envoyez l'invitation aux managers, et le lien de l'animateur à lui seul.`
            : "Nouveau lien d'animateur créé : l'ancien n'ouvre plus rien."}
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

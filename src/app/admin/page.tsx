import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPlatformOverview, getStaffContext } from "@/services/admin.service";
import { DEMO_ACCOUNTS, isDemoSeeded } from "@/services/demo.service";
import { formatEuro } from "@/lib/format";
import {
  createEstablishmentAction,
  deactivateAdminInviteAction,
  deleteLicenceAction,
  newAdminInviteAction,
  seedDemoAction,
  setLicenceAction,
  updatePlatformConfigAction,
} from "./actions";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

/** Comment se lit un état de licence, en un mot et une couleur. */
const ETAT_LICENCE: Record<string, { libelle: string; couleur: string }> = {
  libre: { libelle: "accès libre", couleur: "text-slate-400" },
  active: { libelle: "en cours", couleur: "text-emerald-300" },
  bientot_expiree: { libelle: "à renouveler", couleur: "text-amber-300" },
  expiree: { libelle: "expirée", couleur: "text-red-300" },
  a_venir: { libelle: "à venir", couleur: "text-sky-300" },
};

function LicenceField({
  name,
  label,
  type = "text",
  placeholder,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-400/60"
      />
    </label>
  );
}

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const context = await getStaffContext(session.userId);
  if (!context?.isPlatformAdmin) redirect("/teacher");
  const overview = await getPlatformOverview(session.userId);
  const demoSeeded = await isDemoSeeded();

  return (
    <main id="main" className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Administration générale</p>
          <h1 className="text-2xl font-bold">Plateforme Business Arena</h1>
        </div>
        <nav className="flex gap-4 text-xs text-slate-500">
          <Link href="/teacher" className="hover:text-slate-300">Espace enseignant</Link>
          <Link href="/" className="hover:text-slate-300">Landing</Link>
        </nav>
      </header>

      {/* Statistiques */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Établissements", overview.stats.organizations],
            ["Utilisateurs", overview.stats.users],
            ["Parties", overview.stats.games],
            ["Concours", overview.stats.competitions],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-50">{value}</p>
          </div>
        ))}
      </section>

      {/* Réglages du jeu */}
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Réglages globaux du jeu</h2>
        <form action={updatePlatformConfigAction} className="mt-4 space-y-4">
          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              name="allowPublicPlay"
              defaultChecked={overview.config.allowPublicPlay}
              className="h-4 w-4 accent-amber-400"
            />
            Autoriser les parties solo publiques depuis la landing
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              name="allowSelfServiceTeachers"
              defaultChecked={overview.config.allowSelfServiceTeachers}
              className="h-4 w-4 accent-amber-400"
            />
            Autoriser l&apos;inscription enseignant sans code d&apos;invitation (auto-service)
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Annonce sur la landing (vide = aucune)
            </span>
            <input
              name="announcement"
              defaultValue={overview.config.announcement}
              maxLength={200}
              placeholder="Ex : maintenance dimanche 8h-9h, finale du championnat le 12 juin…"
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Adresse de contact (formulaire d&apos;orientation)
            </span>
            <input
              name="contactEmail"
              type="email"
              defaultValue={overview.config.contactEmail}
              maxLength={120}
              placeholder="Ex : contact@votre-domaine.fr"
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Par défaut <strong className="text-slate-400">contact@business-arena.fr</strong>, pour
              que la demande d&apos;information soit active sans réglage. Remplacez-la par la vôtre,
              ou videz-la pour retirer le bouton d&apos;envoi : mieux vaut pas de bouton qu&apos;un
              bouton qui n&apos;écrit à personne.
            </span>
          </label>
          <SubmitButton
            pendingLabel="Enregistrement…"
            className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
          >
            Enregistrer les réglages
          </SubmitButton>
        </form>
      </section>

      {/* Monde démo */}
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Monde de démonstration</h2>
        <p className="mt-1 text-xs text-slate-500">
          Un établissement complet pour présenter le produit : direction, enseignant, une
          partie de classe déjà jouée sur 3 tours (le tour 4, celui de la crise de trésorerie, est
          le prochain), vues pédagogiques alimentées, et un concours prêt à lancer.
        </p>
        {demoSeeded ? (
          <div className="mt-3 rounded-lg bg-slate-950 p-4 text-sm text-slate-300">
            <p className="text-emerald-400">✓ Monde démo en place</p>
            <ul className="mt-2 space-y-1 font-mono text-xs">
              <li>
                Admin établissement : {DEMO_ACCOUNTS.orgAdmin.email} / {DEMO_ACCOUNTS.password}
              </li>
              <li>
                Enseignant : {DEMO_ACCOUNTS.teacher.email} / {DEMO_ACCOUNTS.password}
              </li>
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              Ces identifiants sont aussi affichés sur la page de connexion enseignant.
            </p>
          </div>
        ) : (
          <form action={seedDemoAction} className="mt-3">
            <button className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300">
              Générer le monde démo
            </button>
          </form>
        )}
      </section>

      {/* Nouvel établissement */}
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Déployer un nouvel établissement</h2>
        <p className="mt-1 text-xs text-slate-500">
          Crée l&apos;établissement et génère un code d&apos;invitation administrateur : la
          personne qui s&apos;inscrit avec ce code devient admin de l&apos;établissement et
          peut à son tour inviter ses enseignants.
        </p>
        <form action={createEstablishmentAction} className="mt-4 flex flex-wrap gap-3">
          <input
            name="name"
            required
            maxLength={80}
            placeholder="Lycée Jean-Monnet, IUT GEA Lille…"
            className="min-w-64 flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
          />
          <SubmitButton
            pendingLabel="Création…"
            className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
          >
            Créer + code admin
          </SubmitButton>
        </form>
      </section>

      {/* Établissements */}
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-200">
          Établissements ({overview.organizations.length})
        </h2>
        <div className="space-y-3">
          {overview.organizations.map((org) => (
            <div key={org.organizationId} className="rounded-xl bg-slate-950 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-100">
                  {org.name}
                  <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-xs uppercase text-slate-500">
                    {org.kind === "public" ? "grand public" : org.kind === "school" ? "établissement" : org.kind}
                  </span>
                </p>
                <p className="text-xs text-slate-400">
                  {org.teachers} enseignant{org.teachers > 1 ? "s" : ""} · {org.members} membres ·{" "}
                  {org.games} parties
                </p>
              </div>
              {org.kind !== "public" ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500">Codes admin :</span>
                  {org.adminInvites.length === 0 ? (
                    <span className="text-slate-600">aucun</span>
                  ) : (
                    org.adminInvites.map((invite) => (
                      <span
                        key={invite.id}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono ${
                          invite.active
                            ? "border-amber-400/40 text-amber-300"
                            : "border-white/10 text-slate-600 line-through"
                        }`}
                      >
                        {invite.code}
                        {invite.active ? (
                          <form
                            action={deactivateAdminInviteAction.bind(null, invite.id, org.organizationId)}
                          >
                            <button className="text-slate-500 hover:text-red-400" title="Désactiver">
                              ✕
                            </button>
                          </form>
                        ) : null}
                      </span>
                    ))
                  )}
                  <form action={newAdminInviteAction.bind(null, org.organizationId)}>
                    <button className="rounded-full border border-white/15 px-3 py-1 text-slate-300 hover:border-amber-400/40">
                      + nouveau code
                    </button>
                  </form>
                </div>
              ) : null}

              {org.kind !== "public" ? (
                <details className="mt-3 rounded-lg border border-white/10 bg-slate-900/60 p-3">
                  <summary className="cursor-pointer text-xs text-slate-400">
                    Licence ·{" "}
                    <span className={ETAT_LICENCE[org.licence.state]?.couleur ?? "text-slate-400"}>
                      {ETAT_LICENCE[org.licence.state]?.libelle ?? org.licence.state}
                    </span>
                    {org.licence.licence
                      ? ` · ${org.licence.licence.label} · ${org.licence.teachers}${
                          org.licence.licence.maxTeachers === null
                            ? ""
                            : ` / ${org.licence.licence.maxTeachers}`
                        } enseignants`
                      : " · aucune limite en vigueur"}
                  </summary>

                  {org.licence.blocking ? (
                    <p className="mt-3 rounded-lg border border-red-400/30 bg-red-950/30 px-3 py-2 text-xs text-red-200">
                      {org.licence.blocking}
                    </p>
                  ) : null}

                  {org.licences.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-xs text-slate-400">
                      {org.licences.map((l) => (
                        <li key={l.id} className="flex flex-wrap items-center gap-2">
                          <span className="text-slate-300">{l.label}</span>
                          <span className="tabular-nums">
                            du {l.startsAt.toLocaleDateString("fr-FR")} au{" "}
                            {l.endsAt.toLocaleDateString("fr-FR")}
                          </span>
                          <span>
                            {l.maxTeachers === null ? "sans plafond" : `${l.maxTeachers} enseignants`}
                          </span>
                          {l.reference ? <span className="font-mono">{l.reference}</span> : null}
                          {l.amountCents !== null ? (
                            <span className="tabular-nums">{formatEuro(l.amountCents / 100)}</span>
                          ) : null}
                          <form action={deleteLicenceAction.bind(null, l.id)}>
                            <button className="text-slate-600 hover:text-red-400" title="Supprimer">
                              ✕
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <form
                    action={setLicenceAction.bind(null, org.organizationId)}
                    className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"
                  >
                    <LicenceField name="label" label="Intitulé" placeholder="Année scolaire 2026-2027" required />
                    <LicenceField name="startsAt" label="Début" type="date" required />
                    <LicenceField name="endsAt" label="Fin" type="date" required />
                    <LicenceField name="maxTeachers" label="Enseignants" type="number" placeholder="vide = sans plafond" />
                    <LicenceField name="reference" label="Devis / bon de commande" placeholder="BC-2026-114" />
                    <LicenceField name="amount" label="Montant €" placeholder="900" />
                    <button className="col-span-2 rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-300 sm:col-span-3">
                      Enregistrer la licence
                    </button>
                  </form>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Sans licence, l&apos;établissement reste ouvert : la limite n&apos;existe que
                    là où une vente l&apos;a définie. Une licence expirée ferme la création de
                    nouvelles parties et laisse se terminer les classes en cours.
                  </p>
                </details>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

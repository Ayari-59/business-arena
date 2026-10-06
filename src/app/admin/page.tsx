import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPlatformOverview, getStaffContext } from "@/services/admin.service";
import { DEMO_ACCOUNTS, isDemoSeeded } from "@/services/demo.service";
import { formatEuro } from "@/lib/format";
import { AI_MODELS } from "@/config/ai";
import { ANSWER_FORMATS } from "@/config/difficulty";
import { SCENARIO_CHOICES } from "@/config/scenarios/registry";
import type { PreuvesPubliees } from "@/config/preuves-dusage";
import {
  createEstablishmentAction,
  deactivateAdminInviteAction,
  newAdminInviteAction,
  seedDemoAction,
  setLicenceAction,
  updatePlatformConfigAction,
  marquerDemandeOrientationTraiteeAction,
  annulerRendezVousAction,
  deconnecterAgendaAction,
} from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { DeleteLicenceButton } from "@/components/delete-licence-button";
import { GuardedForm } from "@/components/guarded-action";
import { listerDemandesOrientation } from "@/services/orientation-request.service";
import { listerRendezVous } from "@/services/rendez-vous.service";
import { etatAgenda } from "@/services/agenda-google.service";
import { SITE_URL } from "@/config/site";
import { bouton } from "@/components/bouton";
import { mesurerLAnalyseSolo } from "@/services/mesure-analyse.service";
import { SEUIL_RENDU_TARDIF_MINUTES } from "@/pedagogy/mesure-analyse";
import { Icone } from "@/components/icone";

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
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full champ px-2 py-1.5 text-xs text-slate-100 outline-none"
      />
    </label>
  );
}

/** Ce que le retour de Google laisse dans l'adresse, traduit pour l'écran. */
const RETOURS_AGENDA: Record<string, { ton: "bon" | "mauvais"; texte: string }> = {
  connecte: { ton: "bon", texte: "Agenda connecté : la page de rendez-vous lit désormais vos disponibilités." },
  refuse: { ton: "mauvais", texte: "Connexion refusée sur l'écran Google : rien n'a changé." },
  etat_invalide: { ton: "mauvais", texte: "Retour inattendu (lien expiré ou ouvert dans un autre navigateur) : recommencez depuis ce bouton." },
  jeton_absent: { ton: "mauvais", texte: "Google n'a pas fourni de jeton durable. Retirez l'accès sur myaccount.google.com/permissions, puis recommencez." },
  client_non_configure: { ton: "mauvais", texte: "GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET manquent dans l'hébergement." },
  echec: { ton: "mauvais", texte: "L'échange avec Google a échoué ; le détail est dans les journaux de l'hébergeur." },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ agenda?: string }>;
}) {
  const { agenda: retourAgenda } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const context = await getStaffContext(session.userId);
  if (!context?.isPlatformAdmin) redirect("/teacher");
  const overview = await getPlatformOverview(session.userId);
  const demoSeeded = await isDemoSeeded();
  const demandes = await listerDemandesOrientation(50);
  const aRepondre = demandes.filter((d) => d.status === "new");
  const rendezVous = await listerRendezVous(30);
  const agenda = await etatAgenda();
  const messageAgenda = retourAgenda ? RETOURS_AGENDA[retourAgenda] : undefined;
  const aVenir = rendezVous.filter((r) => r.aVenir);
  const mesureAnalyse = await mesurerLAnalyseSolo();

  return (
    <main id="main" className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-annonce text-amber-400">Administration générale</p>
          <h1 className="text-2xl font-bold">Plateforme Business Arena</h1>
        </div>
        <nav className="flex flex-wrap gap-4 text-xs text-slate-400">
          <Link href="/admin/theme" className="hover:text-slate-300">Thème graphique</Link>
          <Link href="/admin/cohortes" className="hover:text-slate-300">Cohortes d&apos;épisodes</Link>
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
          <div key={label} className="carte p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-50">{value}</p>
          </div>
        ))}
      </section>

      {/* L'analyse (diagnostic + modèle) coûte-t-elle de la fluidité ? Par niveau, en solo. */}
      <section className="carte p-6">
        <h2 className="text-sm font-semibold text-slate-200">Analyse des situations, par niveau (solo)</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
          Situations déjà débriefées. « Rendues » : l&apos;équipe a répondu au diagnostic ; les autres ont été laissées
          de côté. Le temps est l&apos;écart d&apos;horloge entre l&apos;ouverture et le rendu : il compte les pauses,
          d&apos;où la médiane et la part des rendus de plus de {SEUIL_RENDU_TARDIF_MINUTES} minutes.
        </p>
        {mesureAnalyse.niveaux.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Aucune situation débriefée en solo pour le moment.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4 font-medium">Niveau</th>
                  <th className="pb-2 pr-4 font-medium">Situations</th>
                  <th className="pb-2 pr-4 font-medium">Rendues</th>
                  <th className="pb-2 pr-4 font-medium">Temps médian</th>
                  <th className="pb-2 pr-4 font-medium">Rendus tardifs</th>
                  <th className="pb-2 pr-4 font-medium">Indices / situation</th>
                  <th className="pb-2 font-medium">Score moyen</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {mesureAnalyse.niveaux.map((n) => (
                  <tr key={n.niveau} className="border-t border-white/5">
                    <td className="py-2 pr-4 tabular-nums">{n.niveau}</td>
                    <td className="py-2 pr-4 tabular-nums">{n.situations}</td>
                    <td className="py-2 pr-4 tabular-nums">{Math.round(n.tauxDeRendu * 100)} %</td>
                    <td className="py-2 pr-4 tabular-nums">
                      {n.medianeMinutes === null ? "—" : `${n.medianeMinutes.toFixed(1)} min`}
                    </td>
                    <td className="py-2 pr-4 tabular-nums">
                      {n.partDeRendusTardifs === null ? "—" : `${Math.round(n.partDeRendusTardifs * 100)} %`}
                    </td>
                    <td className="py-2 pr-4 tabular-nums">{n.indicesParSituation.toFixed(1)}</td>
                    <td className="py-2 tabular-nums">
                      {n.scoreMoyen === null ? "—" : `${Math.round(n.scoreMoyen * 100)} %`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Réglages du jeu */}
      <section className="carte p-6">
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
          <fieldset className="rounded-xl border border-white/10 p-4">
            <legend className="px-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              <Icone nom="ecrire" className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
              Format des réponses en partie solo
            </legend>
            <div className="space-y-2">
              {ANSWER_FORMATS.map((f) => (
                <label key={f.code} className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="soloAnswerFormat"
                    value={f.code}
                    defaultChecked={f.code === overview.config.soloAnswerFormat}
                    className="mt-0.5 h-4 w-4 accent-amber-400"
                  />
                  <span>
                    <span className="text-sm font-medium text-slate-200">{f.name}</span>
                    <span className="mt-0.5 block text-xs text-slate-400">{f.help}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              S&apos;applique aux parties solo lancées après l&apos;enregistrement ; celles en cours
              gardent leur format. Les parties de classe se règlent chez l&apos;enseignant.
            </p>
          </fieldset>
          {/* La vitrine du solo public : une entreprise complète, les autres jusqu'à un niveau. */}
          <fieldset className="rounded-xl border border-white/10 p-4">
            <legend className="px-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              <Icone nom="cible" className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
              Vitrine du solo public
            </legend>
            <label className="flex items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                name="vitrineActive"
                defaultChecked={overview.config.vitrineSolo.active}
                className="h-4 w-4 accent-amber-400"
              />
              Limiter les niveaux des entreprises autres que l&apos;entreprise vitrine
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-slate-300">
                Entreprise jouable à tous les niveaux
                <select
                  name="vitrineEntreprise"
                  defaultValue={overview.config.vitrineSolo.entrepriseOuverte}
                  className="mt-1 block w-full champ px-3 py-2 text-sm text-slate-100"
                >
                  {SCENARIO_CHOICES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.shortName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Niveau maximum des autres entreprises
                <select
                  name="vitrineNiveauMax"
                  defaultValue={String(overview.config.vitrineSolo.niveauMaxAutres)}
                  className="mt-1 block w-full champ px-3 py-2 text-sm text-slate-100"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      Niveau {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Éteinte, tout reste ouvert. Allumée, les niveaux au-delà du maximum s&apos;affichent
              « réservés aux établissements » dans le solo public, avec le lien pour prendre
              rendez-vous. Les parties de classe ne sont pas concernées.
            </p>
          </fieldset>
          {/* Les compteurs d'usage de /enseignants. Ils sont comptés dans la
              base et jamais rédigés : ce qui se règle ici, c'est ce qu'on en
              publie, pas ce qu'ils valent. */}
          <fieldset className="rounded-xl border border-white/10 p-4">
            <legend className="px-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Compteurs d&apos;usage publiés sur « Pour les enseignants »
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { name: "preuveParties", cle: "parties", libelle: "Parties jouées" },
                { name: "preuveTours", cle: "tours", libelle: "Tours résolus" },
                { name: "preuveDecisions", cle: "decisions", libelle: "Décisions prises" },
                { name: "preuveClasses", cle: "classes", libelle: "Classes créées" },
              ].map((c) => (
                <label key={c.name} className="flex items-center gap-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    name={c.name}
                    defaultChecked={
                      overview.config.preuvesPubliees[c.cle as keyof PreuvesPubliees]
                    }
                    className="h-4 w-4 accent-amber-400"
                  />
                  {c.libelle}
                </label>
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Aucune valeur n&apos;est modifiable ici : ces totaux sont comptés dans la base. Ce
              qui se règle, c&apos;est ce qui en est publié. La bande disparaît entièrement si
              aucun compteur n&apos;est retenu, et reste tue tant que le plancher de publication
              n&apos;est pas atteint.
            </p>
          </fieldset>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Annonce sur la landing (vide = aucune)
            </span>
            <input
              name="announcement"
              defaultValue={overview.config.announcement}
              maxLength={200}
              placeholder="Ex : maintenance dimanche 8h-9h, finale du championnat le 12 juin…"
              className="mt-1 w-full champ px-3 py-2 text-sm text-slate-100 outline-none"
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
              className="mt-1 w-full champ px-3 py-2 text-sm text-slate-100 outline-none"
            />
            <span className="mt-1 block text-xs text-slate-400">
              Par défaut <strong className="text-slate-400">contact@business-arena.fr</strong>, pour
              que la demande d&apos;information soit active sans réglage. Remplacez-la par la vôtre,
              ou videz-la pour retirer le bouton d&apos;envoi : mieux vaut pas de bouton qu&apos;un
              bouton qui n&apos;écrit à personne.
            </span>
          </label>

          <fieldset className="rounded-xl border border-amber-400/25 bg-amber-950/10 p-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
              Palier gratuit (freemium)
            </legend>
            <p className="mb-3 text-xs text-slate-400">
              Ce à quoi un compte <strong className="text-slate-300">sans licence active</strong> a droit.
              Une licence en cours ouvre tout. <strong className="text-slate-300">Par défaut tout est ouvert</strong> :
              resserrez ces réglages (ex. 3 tours, concours fermés) pour activer le freemium.
            </p>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Tours jouables en gratuit (vide = illimité)
              </span>
              <input
                name="freeMaxRounds"
                type="number"
                min={1}
                max={24}
                defaultValue={overview.config.freeTier.maxRounds ?? ""}
                placeholder="Ex : 3"
                className="mt-1 w-40 champ px-3 py-2 text-sm text-slate-100 outline-none"
              />
              <span className="mt-1 block text-xs text-slate-400">
                La partie gratuite se termine à ce tour, même si le scénario en prévoit plus : c&apos;est le mur « ne va pas au bout ».
              </span>
            </label>
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input type="checkbox" name="freeCompetitions" defaultChecked={overview.config.freeTier.competitions} className="h-4 w-4 accent-amber-400" />
                Concours autorisés en gratuit
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input type="checkbox" name="freeAi" defaultChecked={overview.config.freeTier.ai} className="h-4 w-4 accent-amber-400" />
                Feedback IA autorisé en gratuit
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input type="checkbox" name="freeGradebookExport" defaultChecked={overview.config.freeTier.gradebookExport} className="h-4 w-4 accent-amber-400" />
                Export du relevé de notes autorisé en gratuit
              </label>
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-sky-400/25 bg-sky-950/10 p-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-sky-300">
              Assistant IA
            </legend>
            <p className="mb-3 text-xs text-slate-400">
              Surfaces d&apos;assistance par IA. <strong className="text-slate-300">Éteintes par défaut</strong> ;
              elles restent inertes tant qu&apos;une clé <code className="text-slate-300">ANTHROPIC_API_KEY</code> n&apos;est pas
              configurée côté serveur, et le mur « Feedback IA » du palier gratuit s&apos;applique aussi.
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input type="checkbox" name="aiCoach" defaultChecked={overview.config.ai.coach} className="h-4 w-4 accent-sky-400" />
                Coach de tour (élève, solo) — un retour après chaque tour
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input type="checkbox" name="aiTutor" defaultChecked={overview.config.ai.tutor} className="h-4 w-4 accent-sky-400" />
                Tuteur conversationnel (élève) — répond aux questions en cours de partie
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input type="checkbox" name="aiTeacherReview" defaultChecked={overview.config.ai.teacherReview} className="h-4 w-4 accent-sky-400" />
                Synthèse des justifications (enseignant) — aide au débriefing
              </label>
            </div>
            <label className="mt-3 block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Modèle</span>
              <select
                name="aiModel"
                defaultValue={overview.config.ai.model}
                className="mt-1 block w-full max-w-sm champ px-3 py-2 text-sm text-slate-100 outline-none [--focus-champ:var(--color-sky-400)]"
              >
                {AI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          <SubmitButton
            pendingLabel="Enregistrement…"
            className={bouton()}
          >
            Enregistrer les réglages
          </SubmitButton>
        </form>
      </section>

      {/* Monde démo */}
      <section className="carte p-6">
        <h2 className="text-sm font-semibold text-slate-200">Monde de démonstration</h2>
        <p className="mt-1 text-xs text-slate-400">
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
            <p className="mt-2 text-xs text-slate-400">
              Ces identifiants sont aussi affichés sur la page de connexion enseignant.
            </p>
          </div>
        ) : (
          <form action={seedDemoAction} className="mt-3">
            <button className={bouton()}>
              Générer le monde démo
            </button>
          </form>
        )}
      </section>

      {/* Nouvel établissement */}
      <section className="carte p-6">
        <h2 className="text-sm font-semibold text-slate-200">Déployer un nouvel établissement</h2>
        <p className="mt-1 text-xs text-slate-400">
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
            className="min-w-64 flex-1 champ px-3 py-2 text-sm text-slate-100 outline-none"
          />
          <SubmitButton
            pendingLabel="Création…"
            className={bouton()}
          >
            Créer + code admin
          </SubmitButton>
        </form>
      </section>

      {/*
        DEMANDES DE SIMULATION. Ce que les enseignants écrivent depuis la page
        d'orientation : la demande est ici quoi qu'il arrive, le courriel de
        notification n'étant qu'une commodité (l'indicateur le dit). On répond
        par sa propre messagerie ; « Traitée » retire la demande de la pile.
      */}
      <section className="carte p-6">
        <h2 className="text-sm font-semibold text-slate-200">
          Demandes de simulation
          {aRepondre.length > 0 ? (
            <span className="ml-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-300">
              {aRepondre.length} à répondre
            </span>
          ) : null}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Envoyées depuis /orientation. Répondez depuis votre messagerie à l&apos;adresse
          indiquée, puis marquez la demande traitée.
        </p>
        {demandes.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Aucune demande pour l&apos;instant.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {demandes.map((d) => (
              <li
                key={d.id}
                className={`rounded-xl bg-slate-950 p-4 ${d.status === "handled" ? "opacity-60" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100">
                      {d.name} · <span className="font-normal text-slate-300">{d.school}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      <a href={`mailto:${d.email}`} className="text-amber-300 underline-offset-4 hover:underline">
                        {d.email}
                      </a>
                      {" · "}
                      {d.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      {" · "}
                      {d.mailSent ? "courriel de notification envoyé" : "notification non envoyée (clé d'envoi absente ou refusée)"}
                    </p>
                  </div>
                  {d.status === "handled" ? (
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                      ✓ traitée
                    </span>
                  ) : (
                    <GuardedForm action={marquerDemandeOrientationTraiteeAction} label="demande traitée">
                      <input type="hidden" name="id" value={d.id} />
                      <SubmitButton className="rounded-lg border border-amber-400/40 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-400/10">
                        Traitée
                      </SubmitButton>
                    </GuardedForm>
                  )}
                </div>
                <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs text-slate-300 sm:grid-cols-[auto_1fr]">
                  <dt className="text-slate-400">Classe</dt>
                  <dd>
                    {d.diplomeLibelle} · {d.semestreLibelle.toLowerCase()} · {d.objectifLibelle}
                  </dd>
                  <dt className="text-slate-400">Conseillé</dt>
                  <dd>
                    {d.recommandation.scenarioTitre} · niveau {d.recommandation.niveau} ·{" "}
                    {d.recommandation.tours} tours
                    {d.recommandation.atelierCode ? ` · atelier ${d.recommandation.atelierCode}` : ""}
                  </dd>
                  {d.message ? (
                    <>
                      <dt className="text-slate-400">Contexte</dt>
                      <dd className="whitespace-pre-line italic text-slate-300">« {d.message} »</dd>
                    </>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/*
        RENDEZ-VOUS TÉLÉPHONIQUES. Réservés depuis /rendez-vous sur les créneaux
        que l'agenda Google laisse libres. La réservation est ici quoi qu'il
        arrive ; l'indicateur dit si elle a aussi été posée dans l'agenda.
        Annuler libère le créneau et retire l'événement de l'agenda.
      */}
      <section className="carte p-6">
        <h2 className="text-sm font-semibold text-slate-200">
          Rendez-vous téléphoniques
          {aVenir.length > 0 ? (
            <span className="ml-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-300">
              {aVenir.length} à venir
            </span>
          ) : null}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Pris depuis /rendez-vous, sur les créneaux que l&apos;agenda Google connecté ci-dessous
          laisse libres ; les plages ouvertes se règlent dans le code (config/rendez-vous).
        </p>

        {/*
          L'AGENDA GOOGLE. Deux valeurs dans l'hébergement (le client OAuth),
          puis un clic ici : le consentement se donne dans le navigateur, le
          jeton revient chiffré en base. Rien à copier à la main.
        */}
        <div id="agenda-google" className="mt-4 rounded-xl bg-slate-950 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">Agenda Google</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {agenda.connexion?.source === "base"
                  ? `Connecté : ${agenda.connexion.compte}, depuis le ${agenda.connexion.depuis.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.`
                  : agenda.connexion?.source === "environnement"
                    ? "Connecté par un jeton posé dans l'hébergement (GOOGLE_REFRESH_TOKEN)."
                    : agenda.clientConfigure
                      ? "Non connecté : la page propose les plages ouvertes sans lire l'agenda."
                      : "Le client OAuth n'est pas configuré : posez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans l'hébergement, puis revenez ici."}
              </p>
            </div>
            {agenda.connexion?.source === "base" ? (
              <GuardedForm action={deconnecterAgendaAction} label="déconnexion de l'agenda">
                <SubmitButton className="rounded-lg border border-white/15 px-3 py-1 text-xs font-semibold text-slate-300 hover:border-white/30">
                  Déconnecter
                </SubmitButton>
              </GuardedForm>
            ) : agenda.connexion ? null : (
              <a
                href="/api/google/connect"
                aria-disabled={!agenda.clientConfigure}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                  agenda.clientConfigure
                    ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
                    : "pointer-events-none border border-white/10 text-slate-400"
                }`}
              >
                Connecter mon agenda Google
              </a>
            )}
          </div>
          {messageAgenda ? (
            <p
              role={messageAgenda.ton === "bon" ? "status" : "alert"}
              className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                messageAgenda.ton === "bon"
                  ? "border-teal-400/30 bg-teal-950/30 text-teal-200"
                  : "border-red-400/30 bg-red-950/40 text-red-300"
              }`}
            >
              {messageAgenda.texte}
            </p>
          ) : null}
          {!agenda.connexion ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Dans la console Google, le client OAuth doit être de type « Application Web » avec,
              en URI de redirection autorisée, exactement :{" "}
              <code className="rounded-md bg-slate-900 px-1 py-0.5 text-slate-300">{SITE_URL}/api/google/callback</code>
            </p>
          ) : null}
        </div>
        {rendezVous.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Aucun rendez-vous pour l&apos;instant.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {rendezVous.map((r) => (
              <li
                key={r.id}
                className={`rounded-xl bg-slate-950 p-4 ${r.aVenir ? "" : "opacity-60"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100">
                      {r.libelle}
                      {r.status === "cancelled" ? (
                        <span className="ml-2 text-xs font-normal text-slate-400">annulé</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-300">
                      {r.name} · {r.school} ·{" "}
                      <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="text-amber-300 underline-offset-4 hover:underline">
                        {r.phone}
                      </a>
                      {" · "}
                      <a href={`mailto:${r.email}`} className="text-amber-300 underline-offset-4 hover:underline">
                        {r.email}
                      </a>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {r.dansAgenda ? (
                        r.calendarLink ? (
                          <a href={r.calendarLink} className="underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
                            dans l&apos;agenda Google
                          </a>
                        ) : (
                          "dans l'agenda Google"
                        )
                      ) : (
                        "non posé dans l'agenda (agenda non configuré ou injoignable)"
                      )}
                      {" · "}
                      {r.mailSent ? "confirmation envoyée" : "confirmation non envoyée"}
                    </p>
                  </div>
                  {r.aVenir ? (
                    <GuardedForm action={annulerRendezVousAction} label="annulation du rendez-vous">
                      <input type="hidden" name="id" value={r.id} />
                      <SubmitButton className="rounded-lg border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-400/10">
                        Annuler
                      </SubmitButton>
                    </GuardedForm>
                  ) : null}
                </div>
                {r.message ? (
                  <p className="mt-2 whitespace-pre-line text-xs italic text-slate-300">« {r.message} »</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Établissements */}
      <section className="carte p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-200">
          Établissements ({overview.organizations.length})
        </h2>
        <div className="space-y-3">
          {overview.organizations.map((org) => (
            <div key={org.organizationId} className="rounded-xl bg-slate-950 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-100">
                  {org.name}
                  <span className="ml-2 rounded-md bg-slate-800 px-1.5 py-0.5 text-xs uppercase text-slate-400">
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
                  <span className="text-slate-400">Codes admin :</span>
                  {org.adminInvites.length === 0 ? (
                    <span className="text-slate-400">aucun</span>
                  ) : (
                    org.adminInvites.map((invite) => (
                      <span
                        key={invite.id}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono ${
                          invite.active
                            ? "border-amber-400/40 text-amber-300"
                            : "border-white/10 text-slate-400 line-through"
                        }`}
                      >
                        {invite.code}
                        {invite.active ? (
                          <form
                            action={deactivateAdminInviteAction.bind(null, invite.id, org.organizationId)}
                          >
                            <button className="text-slate-400 hover:text-red-400" title="Désactiver">
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
                          <DeleteLicenceButton licenceId={l.id} />
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
                    <button className={`${bouton({ taille: "s" })} col-span-2 sm:col-span-3`}>
                      Enregistrer la licence
                    </button>
                  </form>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
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

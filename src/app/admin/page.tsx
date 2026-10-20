import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPlatformOverview, getStaffContext } from "@/services/admin.service";
import { DEMO_ACCOUNTS, isDemoSeeded } from "@/services/demo.service";
import { formatEuro } from "@/lib/format";
import { AI_MODELS } from "@/config/ai";
import { ANSWER_FORMATS } from "@/config/difficulty";
import {
  ENTREPRISES,
  nomDeLEntreprise,
  nomDuNiveau,
  NIVEAUX_DE_L_ARENE,
  nomDOffre,
  OFFRES,
  parametrageEnClair,
  libellesDuDevisDe,
} from "@/config/tarifs";
import {
  euros,
  libelleDuTarif,
  MOTIFS_DE_GRATUITE,
  MOTIFS_DE_REMISE,
  nomDansLeDevis,
  offresAttribuables,
  ouvreLesEpisodes,
  parametresAreneDe,
  type Catalogue,
} from "@/config/catalogue";
import { lireLEtatDuCatalogue } from "@/services/catalogue.service";
import { parametrageDe, type OrgLicence } from "@/services/licence.service";
import { FormulaireDeLicence } from "@/components/formulaire-de-licence";
import { listerDemandesDeDevis } from "@/services/devis.service";
import type { PreuvesPubliees } from "@/config/preuves-dusage";
import {
  createEstablishmentAction,
  deactivateAdminInviteAction,
  newAdminInviteAction,
  seedDemoAction,
  setLicenceAction,
  updatePlatformConfigAction,
  marquerDemandeOrientationTraiteeAction,
  marquerDemandeDeDevisTraiteeAction,
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
import { EnTeteAdmin } from "@/components/en-tete-admin";
import { refusDeLicencePourAdresse } from "@/lib/adresse-etablie";

export const dynamic = "force-dynamic";

/** Comment se lit un état de licence, en un mot et une couleur. */
const ETAT_LICENCE: Record<string, { libelle: string; couleur: string }> = {
  libre: { libelle: "sans licence", couleur: "text-slate-400" },
  active: { libelle: "en cours", couleur: "text-emerald-300" },
  bientot_expiree: { libelle: "à renouveler", couleur: "text-amber-300" },
  expiree: { libelle: "expirée", couleur: "text-red-300" },
  a_venir: { libelle: "à venir", couleur: "text-sky-300" },
};

/**
 * Ce que couvre une licence, en clair : l'offre de l'arène et son paramétrage
 * (« [offre] Classe · NOVA · niveau 3 Pilotage »), « + » les épisodes s'ils sont inclus.
 */
function perimetre(l: OrgLicence): string {
  const p = parametrageDe(l);
  const arene = p
    ? [nomDOffre(p.offre), parametrageEnClair(p)].filter((x) => x !== "").join(" · ")
    : null;
  return [arene, l.episodes ? OFFRES.episodes.nom : null]
    .filter((x): x is string => x !== null)
    .join(" + ");
}

/** La vente d'une licence, en clair : vendue (et sa remise), offerte (et son motif), essai. */
function vente(l: OrgLicence): string {
  if (l.nature === "offerte") {
    return `offerte · ${MOTIFS_DE_GRATUITE[l.motifGratuite as keyof typeof MOTIFS_DE_GRATUITE] ?? l.motifGratuite ?? ""}`;
  }
  if (l.nature === "essai") return "essai";
  const parts = [
    l.nomDeLOffre ? `offre ${l.nomDeLOffre}` : null,
    l.prixCatalogueCents !== null && l.remise ? `catalogue ${euros(l.prixCatalogueCents)}` : null,
    l.remise
      ? `remise ${l.remise.type === "pourcentage" ? `${l.remise.valeur} %` : euros(l.remise.valeur)} (${MOTIFS_DE_REMISE[l.remise.motif as keyof typeof MOTIFS_DE_REMISE] ?? l.remise.motif})`
      : null,
  ];
  return parts.filter((x): x is string => x !== null).join(" · ");
}

/** Les offres du catalogue qu'on peut attribuer, pour la liste du formulaire de licence. */
function offresDuFormulaire(c: Catalogue) {
  return offresAttribuables(c).map((o) => {
    const p = parametresAreneDe(o);
    return {
      code: o.code,
      libelle: `${nomDansLeDevis(o)} · ${o.tarif === "prix" && o.prixCents ? `${euros(o.prixCents)} par an` : libelleDuTarif(o).toLowerCase()}`,
      prixCents: o.tarif === "prix" ? o.prixCents : null,
      entreprise: p?.entreprises === "une",
      niveau: p?.niveaux === "un",
      plafond: p?.enseignants === "devis",
      arene: p !== null,
      episodes: ouvreLesEpisodes(o),
    };
  });
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
  const devis = await listerDemandesDeDevis(50);
  const devisATraiter = devis.filter((d) => d.traiteeLe === null);
  const aRepondre = demandes.filter((d) => d.status === "new");
  const rendezVous = await listerRendezVous(30);
  const agenda = await etatAgenda();
  const messageAgenda = retourAgenda ? RETOURS_AGENDA[retourAgenda] : undefined;
  const aVenir = rendezVous.filter((r) => r.aVenir);
  const mesureAnalyse = await mesurerLAnalyseSolo();
  const { catalogue, essai } = await lireLEtatDuCatalogue();
  const offresDeLicence = offresDuFormulaire(catalogue);
  const libellesDe = (code: string) => {
    const o = catalogue.offres.find((x) => x.code === code);
    return o ? libellesDuDevisDe(o) : null;
  };

  return (
    <main id="main" className="mx-auto max-w-5xl space-y-8 p-6">
      <EnTeteAdmin titre="Plateforme Business Arena" actif="plateforme" />

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
          {/* L'inscription libre des enseignants se règle désormais avec les autres règles
              d'inscription (domaines, codes), dans /admin/inscrits. */}
          <p className="text-sm text-slate-400">
            Inscription des enseignants ({overview.config.allowSelfServiceTeachers ? "libre" : "sur code seulement"}) :{" "}
            <Link href="/admin/inscrits#reglages" className="underline underline-offset-4 hover:text-slate-300">
              réglée dans Enseignants inscrits
            </Link>
            .
          </p>
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
          {/* Les niveaux ouverts sans licence se règlent avec la Découverte, dans
              /admin/offres (migration 0041) : la règle serveur lit ce réglage. */}
          <p className="text-sm text-slate-400" data-renvoi-decouverte="">
            Niveaux ouverts sans licence (
            {overview.config.vitrineSolo.active
              ? `niveaux 1 à ${overview.config.vitrineSolo.niveauMaxAutres}`
              : "tous ouverts"}
            ) et démonstrations d&apos;épisodes :{" "}
            <Link href="/admin/offres#gratuites" className="underline underline-offset-4 hover:text-slate-300">
              réglés dans Offres et tarifs, rubrique Gratuités
            </Link>
            .
          </p>
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
              Adresse de contact (orientation, demandes de devis, rendez-vous)
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

          <fieldset className="encadre-neutre rounded-xl p-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-200">
              Assistant IA
            </legend>
            <p className="mb-3 text-xs text-slate-400">
              Surfaces d&apos;assistance par IA. <strong className="text-slate-300">Éteintes par défaut</strong> ;
              elles restent inertes tant qu&apos;une clé <code className="text-slate-300">ANTHROPIC_API_KEY</code> n&apos;est pas
              configurée côté serveur. L&apos;assistant n&apos;est pas vendu : il ne dépend d&apos;aucune licence.
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
        DEMANDES DE DEVIS. Envoyées depuis /devis (chaque carte de /tarifs y mène, l'offre
        pré-remplie). La demande est ici quoi qu'il arrive ; les indicateurs disent si la
        notification et l'accusé au demandeur sont partis. On répond par sa propre
        messagerie ; « Traitée » retire la demande de la pile.
      */}
      <section className="carte p-6" data-demandes-de-devis="">
        <h2 className="text-sm font-semibold text-slate-200">
          Demandes de devis
          {devisATraiter.length > 0 ? (
            <span className="ml-2 rounded-full pastille-etat px-2 py-0.5 text-xs text-slate-200">
              {devisATraiter.length} à traiter
            </span>
          ) : null}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Envoyées depuis /devis. Répondez par un devis écrit à l&apos;adresse indiquée, puis
          posez la licence plus bas une fois le bon de commande reçu.
        </p>
        {devis.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Aucune demande de devis pour l&apos;instant.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {devis.map((d) => (
              <li
                key={d.id}
                data-demande-de-devis={d.offre}
                className={`rounded-xl bg-slate-950 p-4 ${d.traiteeLe ? "opacity-60" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100">
                      {libellesDe(d.offre)?.offre ?? d.offre} ·{" "}
                      <span className="font-normal text-slate-300">{d.organisation}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {d.nom} · {d.fonction} ·{" "}
                      <a href={`mailto:${d.email}`} className="text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2">
                        {d.email}
                      </a>
                      {" · "}
                      {d.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {d.notificationEnvoyee ? "notification envoyée" : "notification non envoyée"} ·{" "}
                      {d.accuseEnvoye ? "accusé envoyé au demandeur" : "accusé non envoyé au demandeur"}
                    </p>
                  </div>
                  {d.traiteeLe ? (
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                      ✓ traitée
                    </span>
                  ) : (
                    <GuardedForm action={marquerDemandeDeDevisTraiteeAction} label="demande de devis traitée">
                      <input type="hidden" name="id" value={d.id} />
                      <SubmitButton className="rounded-lg bouton-filet border border-white/15 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/5">
                        Traitée
                      </SubmitButton>
                    </GuardedForm>
                  )}
                </div>
                <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs text-slate-300 sm:grid-cols-[auto_1fr]">
                  {d.identifiant ? (
                    <>
                      <dt className="text-slate-400">UAI ou SIRET</dt>
                      <dd className="font-mono">{d.identifiant}</dd>
                    </>
                  ) : null}
                  {d.effectif !== null ? (
                    <>
                      <dt className="text-slate-400">
                        {libellesDe(d.offre)?.effectif ?? "Effectif"}
                      </dt>
                      <dd>{d.effectif}</dd>
                    </>
                  ) : null}
                  {d.entreprise ? (
                    <>
                      <dt className="text-slate-400">Entreprise souhaitée</dt>
                      <dd>{nomDeLEntreprise(d.entreprise)}</dd>
                    </>
                  ) : null}
                  {d.niveau !== null ? (
                    <>
                      <dt className="text-slate-400">Niveau souhaité</dt>
                      <dd>{nomDuNiveau(d.niveau)}</dd>
                    </>
                  ) : null}
                  {d.codePromo ? (
                    <>
                      <dt className="text-slate-400">Code promo</dt>
                      <dd data-devis-code-promo={d.codePromo}>
                        <span className="font-mono">{d.codePromo}</span>
                        {d.remiseLibelle ? ` · ${d.remiseLibelle}` : ""}
                        {d.prixCatalogueCents !== null ? ` · catalogue ${euros(d.prixCatalogueCents)}` : ""}
                        {d.prixRemiseCents !== null ? (
                          <>
                            {" · "}
                            <strong className="font-semibold text-slate-100">remisé {euros(d.prixRemiseCents)}</strong>
                          </>
                        ) : (
                          " · prix remisé au devis"
                        )}
                      </dd>
                    </>
                  ) : null}
                  {d.message ? (
                    <>
                      <dt className="text-slate-400">Message</dt>
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
        DEMANDES DE SIMULATION. Ce que les enseignants écrivent depuis la page
        d'orientation : la demande est ici quoi qu'il arrive, le courriel de
        notification n'étant qu'une commodité (l'indicateur le dit). On répond
        par sa propre messagerie ; « Traitée » retire la demande de la pile.
      */}
      <section className="carte p-6">
        <h2 className="text-sm font-semibold text-slate-200">
          Demandes de simulation
          {aRepondre.length > 0 ? (
            <span className="ml-2 rounded-full pastille-etat px-2 py-0.5 text-xs text-slate-200">
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
                      <a href={`mailto:${d.email}`} className="text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2">
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
                      <SubmitButton className="rounded-lg bouton-filet border border-white/15 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/5">
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
            <span className="ml-2 rounded-full pastille-etat px-2 py-0.5 text-xs text-slate-200">
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
              className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                messageAgenda.ton === "bon"
                  ? "encadre-neutre text-slate-100"
                  : "encadre-perte text-red-300"
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
                      <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2">
                        {r.phone}
                      </a>
                      {" · "}
                      <a href={`mailto:${r.email}`} className="text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2">
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
                      <SubmitButton className="rounded-lg border border-red-400 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-white/5">
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
            <div
              key={org.organizationId}
              id={`etablissement-${org.organizationId}`}
              className="scroll-mt-6 rounded-xl bg-slate-950 p-4"
            >
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
                // Déplié d'office quand il y a quelque chose à faire : pas de licence, une
                // licence à venir, expirée, bientôt expirée ou bloquante, ou une adresse
                // à confirmer avant d'en attribuer une. Replié quand tout va bien.
                <details
                  className="mt-3 rounded-lg border border-white/10 bg-slate-900/60 p-3"
                  data-bloc-licence={org.licence.state}
                  open={
                    org.licence.state !== "active" ||
                    org.licence.blocking !== null ||
                    org.adressesAConfirmer.length > 0 ||
                    undefined
                  }
                >
                  <summary className="cursor-pointer text-xs text-slate-400">
                    Licence ·{" "}
                    <span className={ETAT_LICENCE[org.licence.state]?.couleur ?? "text-slate-400"}>
                      {ETAT_LICENCE[org.licence.state]?.libelle ?? org.licence.state}
                    </span>
                    {org.licence.licence
                      ? ` · ${org.licence.licence.label} · ${perimetre(org.licence.licence)} · ${org.licence.teachers}${
                          org.licence.licence.maxTeachers === null
                            ? ""
                            : ` / ${org.licence.licence.maxTeachers}`
                        } enseignants`
                      : " · aucune licence : solo et démonstrations seulement"}
                  </summary>

                  {org.licence.blocking ? (
                    <p className="mt-3 rounded-lg encadre-perte px-3 py-2 text-xs text-red-200">
                      {org.licence.blocking}
                    </p>
                  ) : null}

                  {org.licences.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-xs text-slate-400">
                      {org.licences.map((l) => (
                        <li key={l.id} className="flex flex-wrap items-center gap-2">
                          <span className="text-slate-300">{l.label}</span>
                          <span data-perimetre-licence="">{perimetre(l)}</span>
                          {vente(l) ? (
                            <span data-vente-licence={l.nature} className={l.nature === "vendue" ? "" : "font-semibold text-slate-200"}>
                              {vente(l)}
                            </span>
                          ) : null}
                          <span className="tabular-nums">
                            du {l.startsAt.toLocaleDateString("fr-FR")} au{" "}
                            {l.endsAt.toLocaleDateString("fr-FR")}
                          </span>
                          <span>
                            {l.maxTeachers === null
                              ? "enseignants sans plafond"
                              : `${l.maxTeachers} enseignant${l.maxTeachers > 1 ? "s" : ""}`}
                          </span>
                          {l.maxPartiesEnCours !== null ? (
                            <span>
                              {l.maxPartiesEnCours === 1
                                ? "un groupe à la fois"
                                : `${l.maxPartiesEnCours} groupes à la fois`}
                            </span>
                          ) : null}
                          {l.reference ? <span className="font-mono">{l.reference}</span> : null}
                          {l.amountCents !== null ? (
                            <span className="tabular-nums">{formatEuro(l.amountCents / 100)}</span>
                          ) : null}
                          <DeleteLicenceButton licenceId={l.id} />
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {org.adressesAConfirmer.length > 0 ? (
                    <p className="mt-3 rounded-lg encadre-perte px-3 py-2 text-xs text-red-200" data-licence-en-attente-d-adresse="">
                      {refusDeLicencePourAdresse(org.adressesAConfirmer)}
                    </p>
                  ) : (
                  <FormulaireDeLicence
                    action={setLicenceAction.bind(null, org.organizationId)}
                    offres={offresDeLicence}
                    entreprises={ENTREPRISES.map((e) => ({ code: e.code, nom: e.nom }))}
                    niveaux={NIVEAUX_DE_L_ARENE}
                    episodes={OFFRES.episodes.nom}
                    motifsDeRemise={Object.entries(MOTIFS_DE_REMISE).map(([code, libelle]) => ({ code, libelle }))}
                    motifsDeGratuite={Object.entries(MOTIFS_DE_GRATUITE).map(([code, libelle]) => ({ code, libelle }))}
                    essai={essai}
                  />
                  )}
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    L&apos;offre choisie au catalogue (<Link href="/admin/offres" className="underline underline-offset-4">Offres
                    et tarifs</Link>) pose le périmètre, les limites et le prix ; la licence en garde une
                    copie : changer le catalogue ensuite ne la change pas. Le montant facturé se calcule
                    (prix catalogue moins la remise). Une licence offerte coûte 0 € et porte son motif ;
                    l&apos;essai n&apos;apparaît que s&apos;il est activé dans les gratuités. Sans licence de
                    l&apos;arène en cours, ou licence expirée, l&apos;établissement joue en solo aux
                    niveaux gratuits : ni partie de classe ni concours ne se créent, les parties en
                    cours se poursuivent. Les épisodes manager ne s&apos;ouvrent qu&apos;avec une offre qui
                    les compose, ou la case « + {OFFRES.episodes.nom} ».
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

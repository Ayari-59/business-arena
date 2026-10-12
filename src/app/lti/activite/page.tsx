import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { lireContexte } from "@/lti/contexte";
import { lienParId, pilotageDe } from "@/lti/liens";
import { plateformeParId } from "@/lti/plateformes";
import { ouverturesDeLOrganisation } from "@/lti/acces";
import { accordeLesNotes, nomDeLaPlateforme } from "@/lti/ags/regles";
import { phraseDeLActivite } from "@/lti/ags/textes";
import { getTeacherGames } from "@/services/game.service";
import { cohortesDeLEnseignant } from "@/services/cohortes.service";
import { examensDeLEnseignant } from "@/services/examen.service";
import { getPlatformConfig } from "@/services/admin.service";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { ChoixDesEpisodes } from "@/components/choix-des-episodes";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { LIEN_TARIFS } from "@/config/vitrine-solo";
import {
  messageNiveauxReserves,
  refusDeLaClasse,
  refusDesCohortes,
  refusSansLaDemande,
  type HorsLicence,
} from "@/config/tarifs";
import { licenceDeLArene } from "@/services/acces.service";
import { estUnRefusDeCohorte, NOM_DE_COHORTE_MAX, REFUS_DE_COHORTE } from "@/config/cohortes";
import { lireLaDecouverte } from "@/services/catalogue.service";
import {
  ANSWER_FORMATS,
  DEFAULT_ANSWER_FORMAT,
  DEFAULT_QUIZ_MODE,
  DIFFICULTY_PRESETS,
  QUIZ_MODES,
} from "@/config/difficulty";
import { DEFAULT_SCENARIO_CODE, SCENARIO_CHOICES, SECTOR_LABELS } from "@/config/scenarios/registry";
import {
  creerCohorteAction,
  creerPartieAction,
  relierCohorteAction,
  relierExamenAction,
  relierPartieAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Activité de votre cours",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * L'ACTIVITÉ DU COURS, À SA PREMIÈRE OUVERTURE PAR L'ENSEIGNANT.
 *
 * L'enseignant arrive ici depuis sa plateforme (Moodle…), sans avoir rien saisi : son
 * compte vient d'être ouvert ou retrouvé. Il choisit ce que l'activité ouvre à ses
 * élèves : une partie de classe (existante, ou créée ici avec les réglages de la
 * création habituelle) ou une cohorte d'épisodes, selon la licence de son
 * établissement. Ensuite, chaque lancement le mène au pilotage.
 *
 * Tout ce qui vient de la plateforme (titre de l'activité, du cours) s'affiche par
 * React, donc échappé.
 */

const CHAMP = "mt-1 w-full champ px-3 py-2 text-sm";
const LIBELLE = "libelle text-slate-400";

function Tarifs() {
  return (
    <Link href={LIEN_TARIFS} prefetch={false} className={LIEN_A_L_ENCRE}>
      Voir les offres
    </Link>
  );
}

function Carte({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="carte grid gap-4 p-4 sm:p-6">
      <h2 className="titre-carte text-slate-100">{titre}</h2>
      {children}
    </section>
  );
}

export default async function ActiviteLtiPage({
  searchParams,
}: {
  searchParams: Promise<{ refus?: string }>;
}) {
  const { refus } = await searchParams;
  const [session, ctx] = await Promise.all([getSession(), lireContexte()]);
  const lien = ctx?.l ? await lienParId(ctx.l) : null;
  const plateforme = lien ? await plateformeParId(lien.plateformeId) : null;
  if (!session || !ctx || ctx.r !== "enseignant" || ctx.u !== session.userId || !lien || !plateforme?.actif) {
    return (
      <main id="main" className="pb-16">
        <EnTeteDePage
          surtitre="Activité de votre cours"
          titre="Ouvrez l'activité depuis votre cours"
          chapeau="Cette page s'ouvre quand vous lancez une activité Business Arena depuis votre plateforme de cours. Relancez l'activité depuis le cours."
        />
      </main>
    );
  }
  const enseignantId = session.userId;
  if (lien.cibleType && lien.configurePar === enseignantId) {
    redirect(pilotageDe(lien));
  }

  const nomDeLActivite = lien.titre ?? "Activité Business Arena";
  const chapeau = (
    <>
      « {nomDeLActivite} »{lien.contexteTitre ? <> dans le cours « {lien.contexteTitre} »</> : null}. Choisissez ce
      qu&apos;elle ouvre à vos élèves : ils y arriveront depuis le cours, sans compte ni code.
    </>
  );
  if (lien.cibleType) {
    return (
      <main id="main" className="pb-16">
        <EnTeteDePage
          surtitre="Activité de votre cours"
          titre="Cette activité est déjà reliée"
          chapeau="Un autre enseignant du cours l'a reliée à sa partie ou à sa cohorte : ses élèves y arrivent déjà. Le pilotage reste dans son espace."
        />
      </main>
    );
  }

  const [ouvertures, parties, cohortes, { vitrineSolo }, licenceDeLOrganisation, { demos }, lesExamens] = await Promise.all([
    ouverturesDeLOrganisation(plateforme.organizationId),
    getTeacherGames(enseignantId),
    cohortesDeLEnseignant(enseignantId),
    getPlatformConfig(),
    licenceDeLArene(plateforme.organizationId),
    lireLaDecouverte(),
    examensDeLEnseignant(enseignantId),
  ]);
  const examensOuverts = lesExamens.filter((e) => !e.closLe);
  // Le paramétrage de la licence (offres Classe, Programme, Campus) : le formulaire part
  // de l'entreprise et du niveau qu'elle couvre (services/acces.service.ts).
  const parametrage = licenceDeLOrganisation?.parametrage ?? null;
  const QUOI_HORS_LICENCE: readonly string[] = ["entreprise", "niveau", "enseignants", "parties"];
  const partiesOuvertes = parties.filter((g) => g.status !== "finished");
  const cohortesOuvertes = cohortes.filter((c) => !c.closeLe);

  const message = !refus
    ? null
    : refus === "introuvable"
      ? { texte: "Cette partie ou cette cohorte n'est pas l'une des vôtres, ou l'activité vient d'être reliée.", tarifs: false }
      : refus === "niveau"
        ? { texte: messageNiveauxReserves(vitrineSolo), tarifs: true }
        : refus === "classe"
          ? { texte: refusDeLaClasse(vitrineSolo), tarifs: true }
          : refus.startsWith("licence-") && parametrage && QUOI_HORS_LICENCE.includes(refus.slice("licence-".length))
            ? {
                texte: refusSansLaDemande(parametrage, refus.slice("licence-".length) as HorsLicence["quoi"]),
                tarifs: true,
              }
          : refus.startsWith("cohorte-") && estUnRefusDeCohorte(refus.slice("cohorte-".length))
            ? {
                texte: REFUS_DE_COHORTE[refus.slice("cohorte-".length) as keyof typeof REFUS_DE_COHORTE],
                tarifs: refus === "cohorte-licence",
              }
            : { texte: "La partie n'a pas pu être créée. Réessayez.", tarifs: false };

  return (
    <main id="main" className="pb-16">
      <EnTeteDePage surtitre="Activité de votre cours" titre="Que doit ouvrir cette activité ?" chapeau={chapeau} />
      <div className={`${COLONNE_DE_PAGE} space-y-6`} data-configuration-lti="">
        {message ? (
          <p role="alert" className="rounded-xl encadre-perte px-4 py-3 text-sm text-red-200">
            {message.texte} {message.tarifs ? <Tarifs /> : null}
          </p>
        ) : null}

        <p className="rounded-xl encadre-neutre px-4 py-3 text-sm leading-relaxed text-slate-200" data-retour-des-notes={accordeLesNotes(lien.agsPortees) ? "accorde" : "non-accorde"}>
          {phraseDeLActivite({
            plateforme: nomDeLaPlateforme(plateforme.nom),
            accorde: accordeLesNotes(lien.agsPortees),
            colonne: !!lien.agsLineitem,
          })}
        </p>

        {!ouvertures.partie && !ouvertures.cohorte ? (
          <p className="rounded-xl encadre-neutre px-4 py-3 text-sm text-slate-200" data-sans-licence="">
            {refusDeLaClasse(vitrineSolo)} <Tarifs />
          </p>
        ) : null}

        {ouvertures.partie ? (
          <>
            {partiesOuvertes.length > 0 ? (
              <Carte titre="Une de vos parties de classe">
                <GuardedForm action={relierPartieAction} label="relier l'activité à une partie" className="grid gap-3">
                  <ul className="grid gap-2">
                    {partiesOuvertes.map((g, i) => (
                      <li key={g.gameId}>
                        <label className="flex items-start gap-3 rounded-lg border border-white/10 px-3 py-2">
                          <input
                            type="radio"
                            name="gameId"
                            value={g.gameId}
                            defaultChecked={i === 0}
                            className="mt-1 h-4 w-4 accent-amber-400"
                          />
                          <span>
                            <span className="block text-sm font-semibold text-slate-100">
                              {g.label ?? g.scenarioShortName}
                            </span>
                            <span className="block text-sm text-slate-400">
                              {g.scenarioTitle} · code {g.joinCode}
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire" })}>
                    Relier l&apos;activité à cette partie
                  </SubmitButton>
                </GuardedForm>
              </Carte>
            ) : null}

            <Carte titre="Une nouvelle partie de classe">
              <p className="text-sm text-slate-400">
                Les réglages de la création habituelle. Les paramètres économiques détaillés se règlent depuis votre
                espace enseignant : créez-y la partie, puis reliez-la ici.
              </p>
              <GuardedForm
                action={creerPartieAction}
                label="création de partie depuis la plateforme"
                timeoutMs={30_000}
                className="grid gap-4 sm:grid-cols-3"
              >
                <label className="block sm:col-span-3">
                  <span className={LIBELLE}>Entreprise jouée</span>
                  <select
                    name="scenarioCode"
                    defaultValue={parametrage?.entreprises?.[0] ?? DEFAULT_SCENARIO_CODE}
                    className={CHAMP}
                  >
                    {SCENARIO_CHOICES.map((d) => (
                      <option key={d.code} value={d.code}>
                        {SECTOR_LABELS[d.sector]} · {d.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={LIBELLE}>Équipes (élèves)</span>
                  <select name="humanTeamsCount" defaultValue={4} className={CHAMP}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        {n} équipe{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={LIBELLE}>Concurrents bots</span>
                  <select name="botCount" defaultValue={1} className={CHAMP}>
                    {[0, 1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n} bot{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={LIBELLE}>Périodicité</span>
                  <select name="periodicity" defaultValue="quarter" className={CHAMP}>
                    <option value="month">Un mois par tour</option>
                    <option value="quarter">Un trimestre par tour</option>
                    <option value="year">Une année par tour</option>
                  </select>
                </label>
                <label className="block">
                  <span className={LIBELLE}>Tours joués</span>
                  <select name="roundsCount" defaultValue="" className={CHAMP}>
                    <option value="">Toute la partie</option>
                    {[3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} tours
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className={LIBELLE}>Niveau de difficulté</span>
                  <select name="level" defaultValue={parametrage?.niveaux?.[0] ?? 3} className={CHAMP}>
                    {DIFFICULTY_PRESETS.map((p) => (
                      <option key={p.level} value={p.level}>
                        {p.level} · {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={LIBELLE}>Questions posées</span>
                  <select name="quizMode" defaultValue={DEFAULT_QUIZ_MODE} className={CHAMP}>
                    {QUIZ_MODES.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={LIBELLE}>Format des réponses</span>
                  <select name="answerFormat" defaultValue={DEFAULT_ANSWER_FORMAT} className={CHAMP}>
                    {ANSWER_FORMATS.map((f) => (
                      <option key={f.code} value={f.code}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-start gap-3 sm:col-span-3">
                  <input type="checkbox" name="variableWorld" defaultChecked className="mt-0.5 h-4 w-4 accent-amber-400" />
                  <span className="text-sm text-slate-200">Monde variable : chaque partie diffère</span>
                </label>
                <label className="flex items-start gap-3 sm:col-span-3">
                  <input
                    type="checkbox"
                    name="investmentStories"
                    defaultChecked
                    className="mt-0.5 h-4 w-4 accent-amber-400"
                  />
                  <span className="text-sm text-slate-200">Histoires d&apos;investissement</span>
                </label>
                <SubmitButton pendingLabel="Création de la partie…" className={`${bouton()} sm:col-span-3`}>
                  Créer la partie et y relier l&apos;activité
                </SubmitButton>
              </GuardedForm>
            </Carte>
          </>
        ) : ouvertures.cohorte ? (
          <p className="text-sm text-slate-400">
            {refusDeLaClasse(vitrineSolo)} <Tarifs />
          </p>
        ) : null}

        {ouvertures.cohorte ? (
          <>
            {cohortesOuvertes.length > 0 ? (
              <Carte titre="Une de vos cohortes d'épisodes">
                <GuardedForm action={relierCohorteAction} label="relier l'activité à une cohorte" className="grid gap-3">
                  <ul className="grid gap-2">
                    {cohortesOuvertes.map((c, i) => (
                      <li key={c.id}>
                        <label className="flex items-start gap-3 rounded-lg border border-white/10 px-3 py-2">
                          <input
                            type="radio"
                            name="cohorteId"
                            value={c.id}
                            defaultChecked={i === 0}
                            className="mt-1 h-4 w-4 accent-amber-400"
                          />
                          <span>
                            <span className="block text-sm font-semibold text-slate-100">{c.nom}</span>
                            <span className="block text-sm text-slate-400">code {c.code}</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire" })}>
                    Relier l&apos;activité à cette cohorte
                  </SubmitButton>
                </GuardedForm>
              </Carte>
            ) : null}
            <Carte titre="Une nouvelle cohorte d'épisodes">
              <GuardedForm action={creerCohorteAction} label="création de cohorte depuis la plateforme" className="grid gap-4">
                <label className="grid gap-1">
                  <span className={LIBELLE}>Nom de la cohorte</span>
                  <input
                    name="nom"
                    required
                    maxLength={NOM_DE_COHORTE_MAX}
                    defaultValue={lien.contexteTitre ?? ""}
                    className="champ px-3 py-2 text-sm"
                  />
                </label>
                <ChoixDesEpisodes preselection={null} demos={demos} />
                <SubmitButton pendingLabel="Création de la cohorte…" className={bouton({ variante: "secondaire" })}>
                  Créer la cohorte et y relier l&apos;activité
                </SubmitButton>
              </GuardedForm>
            </Carte>
          </>
        ) : ouvertures.partie ? (
          <p className="text-sm text-slate-400">
            {refusDesCohortes(demos.length)} <Tarifs />
          </p>
        ) : null}

        {/* L'EXAMEN INDIVIDUEL (module de l'offre) : on relie un examen déjà créé dans
            l'espace enseignant ; ses réglages et sa grille se posent là-bas. */}
        {ouvertures.examen && examensOuverts.length > 0 ? (
          <Carte titre="Un de vos examens individuels">
            <GuardedForm action={relierExamenAction} label="relier l'activité à un examen" className="grid gap-3">
              <ul className="grid gap-2">
                {examensOuverts.map((e, i) => (
                  <li key={e.id}>
                    <label className="flex items-start gap-3 rounded-lg border border-white/10 px-3 py-2">
                      <input type="radio" name="examenId" value={e.id} defaultChecked={i === 0} className="mt-1 h-4 w-4 accent-amber-400" />
                      <span>
                        <span className="block text-sm font-semibold text-slate-100">{e.nom}</span>
                        <span className="block text-sm text-slate-400">code {e.code}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire" })}>
                Relier l&apos;activité à cet examen
              </SubmitButton>
            </GuardedForm>
          </Carte>
        ) : null}
      </div>
    </main>
  );
}

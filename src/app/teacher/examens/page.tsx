import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connexionPourLaPageDemandee } from "@/lib/connexion-requise";
import { getSession } from "@/lib/session";
import { getStaffContext } from "@/services/admin.service";
import { getTeacherOrgId } from "@/services/auth.service";
import { examenOuvert, licenceDeLArene, messageDuRefusDeLExamen } from "@/services/acces.service";
import { examensDeLEnseignant, toursDuScenario } from "@/services/examen.service";
import { DEFAULT_SCENARIO_CODE, SCENARIO_CHOICES, SECTOR_LABELS } from "@/config/scenarios/registry";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { GRILLES, GRILLE_PAR_DEFAUT } from "@/config/examen/grille";
import {
  DUREE_DE_TOUR_MAX_MINUTES,
  NOM_D_EXAMEN_MAX,
  REFUS_DE_CREATION,
  TENTATIVES_MAX,
  estUnRefusDeCreation,
} from "@/config/examen/textes";
import { TAILLE_DU_LOT } from "@/pedagogy/examen/lot";
import { LIEN_TARIFS } from "@/config/vitrine-solo";
import { compter, jourDeCreation } from "@/lib/format";
import { NavigationEnseignant, Rubrique } from "@/components/en-tete-enseignant";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { ChampNombre } from "@/components/examen/champ-nombre";
import { creerExamenAction } from "./actions";

export const metadata: Metadata = {
  title: "Mes examens",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * MES EXAMENS : L'EXAMEN INDIVIDUEL NOTÉ, FAÇON COMP-XM.
 *
 * Décision du propriétaire : « Lance l'examen individuel façon Comp-XM. » Chaque candidat
 * dirige seul son entreprise contre des concurrents pilotés ; la note, sur une grille fixe
 * et publiée, juge ses décisions rejouées sur trente marchés, pas le tirage ; le relevé
 * par compétence nourrit un dossier d'accréditation.
 *
 * LA PAGE SUIT « MES COHORTES » : la liste, puis la création derrière son bouton, ouverte
 * d'elle-même pour qui n'a encore rien créé et après un refus. SANS LE MODULE dans la
 * licence de l'établissement, la page se montre, avec son message et « Voir les offres » ;
 * la création est refusée par le serveur (services/acces.service.ts).
 */

const CHAMP = "champ mt-1 w-full px-3 py-2 text-base";
const LIBELLE = "text-sm font-semibold text-slate-200";
const AIDE = "mt-1 block text-xs text-slate-400";

export default async function MesExamensPage({
  searchParams,
}: {
  searchParams: Promise<{ refus?: string }>;
}) {
  const { refus } = await searchParams;
  const session = await getSession();
  if (!session) redirect(await connexionPourLaPageDemandee());
  const org = await getTeacherOrgId(session.userId);
  const [liste, module, licence, staff, messageDuModule] = await Promise.all([
    examensDeLEnseignant(session.userId),
    examenOuvert(org),
    org ? licenceDeLArene(org) : Promise.resolve(null),
    getStaffContext(session.userId),
    messageDuRefusDeLExamen(),
  ]);
  const isOrgAdmin = staff?.organizations.some((o) => o.role === "org_admin") ?? false;
  const raison = estUnRefusDeCreation(refus) ? refus : null;
  const ouvrir = liste.length === 0 || !!raison;
  // Le formulaire part du périmètre de la licence (entreprises et niveaux qu'elle couvre).
  const entreprises = licence?.parametrage.entreprises ?? null;
  const niveaux = licence?.parametrage.niveaux ?? null;
  const choix = SCENARIO_CHOICES.filter((d) => !entreprises || entreprises.includes(d.code));
  const presets = DIFFICULTY_PRESETS.filter((p) => !niveaux || niveaux.includes(p.level));
  const entrepriseParDefaut = choix.find((d) => d.code === DEFAULT_SCENARIO_CODE)?.code ?? choix[0]?.code ?? DEFAULT_SCENARIO_CODE;
  const toursParDefaut = toursDuScenario(entrepriseParDefaut, presets[0]?.level ?? 1);
  const toursMax = Math.max(...SCENARIO_CHOICES.map((d) => toursDuScenario(d.code, 1)));

  return (
    <main id="main" className="pb-16">
      <EnTeteDePage
        surtitre="Espace enseignant"
        titre="Mes examens"
        chapeau="Un examen individuel : chaque étudiant dirige seul son entreprise face à des concurrents pilotés par l'ordinateur. La note suit une grille fixe et publiée, et chaque candidat reçoit un relevé par compétence."
      >
        <NavigationEnseignant
          className="mt-6"
          actif="examens"
          liens={{ etablissement: isOrgAdmin, administration: staff?.isPlatformAdmin ?? false }}
        />
      </EnTeteDePage>
      <div className={`${COLONNE_DE_PAGE} space-y-8`}>
        {raison ? (
          <p role="alert" data-refus-d-examen={raison} className="rounded-xl encadre-perte px-3 py-2.5 text-sm text-slate-100 sm:px-4 sm:py-3">
            {REFUS_DE_CREATION[raison]}
            {raison === "licence" || raison === "perimetre" ? (
              <>
                {" "}
                <Link href={LIEN_TARIFS} prefetch={false} className={LIEN_A_L_ENCRE}>
                  Voir les offres
                </Link>
              </>
            ) : null}
          </p>
        ) : null}

        {!module && raison !== "licence" ? (
          <p data-examens-sans-module="" className="rounded-lg encadre-neutre px-3 py-2.5 text-sm text-slate-300 sm:px-4 sm:py-3">
            <strong className="font-semibold text-slate-100">Examen individuel.</strong> {messageDuModule}{" "}
            <Link href={LIEN_TARIFS} prefetch={false} className={LIEN_A_L_ENCRE}>
              Voir les offres
            </Link>
          </p>
        ) : null}

        <Rubrique note={liste.length > 0 ? compter(liste.length, "examen") : undefined}>Mes examens</Rubrique>

        <details id="nouvel-examen" className="group scroll-mt-24" open={ouvrir || undefined}>
          <summary className="inline-flex cursor-pointer list-none rounded-lg [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">
              <span className={bouton({ taille: "l" })}>
                <span aria-hidden>+</span> Nouvel examen
              </span>
            </span>
            <span className="hidden group-open:inline">
              <span className={bouton({ variante: "secondaire" })}>Replier le formulaire</span>
            </span>
          </summary>
          <section aria-labelledby="nouvel-examen-titre" className="carte mt-4 p-4 sm:p-7">
            <h2 id="nouvel-examen-titre" className="titre-carte text-slate-100">
              Nouvel examen
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Tous les candidats jouent la même entreprise, au même niveau. La grille choisie est copiée dans
              l&apos;examen à sa création : elle ne change plus ensuite.
            </p>
            <GuardedForm action={creerExamenAction} label="création d'un examen" className="mt-4 grid gap-5" timeoutMs={60_000}>
              <label className="grid gap-1">
                <span className={LIBELLE}>Nom de l&apos;examen</span>
                <input name="nom" required maxLength={NOM_D_EXAMEN_MAX} placeholder="Gestion L2 · examen de fin de semestre" className={CHAMP} />
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className={LIBELLE}>Entreprise</span>
                  <select name="scenarioCode" defaultValue={entrepriseParDefaut} className={CHAMP}>
                    {choix.map((d) => (
                      <option key={d.code} value={d.code}>
                        {SECTOR_LABELS[d.sector]} · {d.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className={LIBELLE}>Niveau</span>
                  <select name="niveau" defaultValue={presets[0]?.level} className={CHAMP}>
                    {presets.map((p) => (
                      <option key={p.level} value={p.level}>
                        {p.level} · {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className={LIBELLE}>Nombre de tours</span>
                  <ChampNombre name="tours" required min={1} max={toursMax} defaultValue={toursParDefaut} className={CHAMP} />
                  <span className={AIDE}>Au plus les tours de l&apos;entreprise choisie.</span>
                </label>
                <label className="grid gap-1">
                  <span className={LIBELLE}>Durée maximale d&apos;un tour (minutes)</span>
                  <ChampNombre name="dureeTourMinutes" min={1} max={DUREE_DE_TOUR_MAX_MINUTES} placeholder="Sans limite" className={CHAMP} />
                  <span className={AIDE}>Échue, le tour se clôt avec les décisions reconduites.</span>
                </label>
                <label className="grid gap-1">
                  <span className={LIBELLE}>Ouverture (heure de Paris)</span>
                  <input name="ouverture" type="datetime-local" className={CHAMP} />
                </label>
                <label className="grid gap-1">
                  <span className={LIBELLE}>Fermeture (heure de Paris)</span>
                  <input name="fermeture" type="datetime-local" className={CHAMP} />
                  <span className={AIDE}>À la fermeture, les copies en cours sont remises telles quelles.</span>
                </label>
                <label className="grid gap-1">
                  <span className={LIBELLE}>Tentatives par candidat</span>
                  <ChampNombre name="tentatives" min={1} max={TENTATIVES_MAX} defaultValue={1} required className={CHAMP} />
                  <span className={AIDE}>La dernière copie remise compte.</span>
                </label>
              </div>
              <fieldset className="grid gap-2">
                <legend className={LIBELLE}>Ce que le candidat voit</legend>
                <label className="flex items-start gap-3 text-sm text-slate-200">
                  <input type="checkbox" name="questions" className="mt-0.5 h-4 w-4 accent-amber-400" />
                  <span>
                    Poser les questions de diagnostic des situations (notées)
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm text-slate-200">
                  <input type="checkbox" name="resultatEstime" defaultChecked className="mt-0.5 h-4 w-4 accent-amber-400" />
                  <span>Montrer le « Résultat estimé » pendant la saisie</span>
                </label>
              </fieldset>
              <fieldset className="grid gap-2">
                <legend className={LIBELLE}>Le marché</legend>
                <label className="flex items-start gap-3 text-sm text-slate-200">
                  <input type="radio" name="modeGraine" value="commune" defaultChecked className="mt-0.5 h-4 w-4 accent-amber-400" />
                  <span>
                    Le même marché pour tous
                    <span className={AIDE}>Une seule graine : les parties sont identiques au départ.</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm text-slate-200">
                  <input type="radio" name="modeGraine" value="lot" className="mt-0.5 h-4 w-4 accent-amber-400" />
                  <span>
                    Un lot de {TAILLE_DU_LOT} marchés d&apos;égale difficulté
                    <span className={AIDE}>
                      Deux voisins n&apos;ont pas le même marché : copier les décisions de l&apos;autre ne sert à rien.
                    </span>
                  </span>
                </label>
                <span className={AIDE}>
                  Dans les deux cas, la note juge les décisions rejouées sur les mêmes marchés pour tous, pas le tirage.
                </span>
              </fieldset>
              <fieldset className="grid gap-2">
                <legend className={LIBELLE}>La grille de notation</legend>
                {GRILLES.map((g) => (
                  <label key={g.code} className="flex items-start gap-3 text-sm text-slate-200">
                    <input
                      type="radio"
                      name="grilleCode"
                      value={g.code}
                      defaultChecked={g.code === GRILLE_PAR_DEFAUT}
                      className="mt-0.5 h-4 w-4 accent-amber-400"
                    />
                    <span>
                      {g.nom} <span className="text-slate-400">(version {g.version})</span>
                      <span className={AIDE}>
                        {g.propos} Étalon : {g.reference.nom}.
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <SubmitButton pendingLabel="Création de l'examen…" className={bouton()}>
                Créer l&apos;examen
              </SubmitButton>
            </GuardedForm>
          </section>
        </details>

        {liste.length === 0 ? (
          <p className="rounded-lg border border-white/15 px-4 py-5 text-center text-sm text-slate-400">
            Aucun examen pour l&apos;instant. Créez le premier avec le formulaire ci-dessus : vous obtiendrez un code à donner
            à vos étudiants.
          </p>
        ) : (
          <ul className="grid gap-3" data-mes-examens="">
            {liste.map((e) => {
              const def = SCENARIO_CHOICES.find((d) => d.code === e.scenarioCode);
              return (
                <li key={e.id} data-examen={e.code} className="carte flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3 sm:px-4">
                  <Link href={`/teacher/examens/${e.id}`} className="min-w-0 flex-1 basis-56">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="block truncate text-base font-semibold text-slate-100">{e.nom}</span>
                      {e.closLe ? (
                        <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">clos</span>
                      ) : null}
                      {e.publieLe ? (
                        <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">publié</span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-slate-400">
                      {def?.shortName ?? e.scenarioCode} · niveau {e.niveau} · {compter(e.tours, "tour")} · créé {jourDeCreation(e.creeLe)}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-slate-400">
                      {compter(e.candidats, "candidat")} · {compter(e.remises, "copie remise", "copies remises")}
                    </span>
                  </Link>
                  <span className="shrink-0 text-right">
                    <span className="block text-xs text-slate-400">Code</span>
                    <span className="block font-mono text-base font-semibold text-slate-100">{e.code}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

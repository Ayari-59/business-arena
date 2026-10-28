import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connexionPourLaPageDemandee } from "@/lib/connexion-requise";
import { getSession } from "@/lib/session";
import { lienDInvitation, origineDeLaRequete } from "@/lib/origine";
import { compter } from "@/lib/format";
import { getStaffContext } from "@/services/admin.service";
import { cohorteDeLEnseignant } from "@/services/cohortes.service";
import { episodeParCode } from "@/pedagogy/episodes/registre";
import { lienDuDebrief } from "@/config/episodes/debrief";
import { NOM_DE_COHORTE_MAX } from "@/config/cohortes";
import { NavigationEnseignant, Rubrique } from "@/components/en-tete-enseignant";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { BoutonCopierLeLien } from "@/components/bouton-copier-le-lien";
import { BoutonCopierLeMessage } from "@/components/bouton-copier-le-message";
import { messageDeLaCohorte } from "@/lib/message-cahier-de-textes";
import { CodeQr } from "@/components/code-qr";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { Tiroir } from "@/components/tiroir";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { Icone } from "@/components/icone";
import {
  cloreCohorteAction,
  renommerCohorteAction,
  renouvelerCodeDeCohorteAction,
  rouvrirCohorteAction,
} from "../actions";

export const metadata: Metadata = {
  title: "Ma cohorte",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const FAITS: Record<string, string> = {
  renommee: "Nom enregistré.",
  close: "Cohorte close : elle n'accepte plus de nouveaux participants.",
  rouverte: "Cohorte rouverte : son code accueille de nouveau des participants.",
  code: "Nouveau code créé : l'ancien n'ouvre plus rien. Les participants restent dans la cohorte.",
};

const jour = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(d);

/**
 * UNE COHORTE DE L'ENSEIGNANT : LA DIFFUSER, LA SUIVRE, LA GÉRER.
 *
 * D'abord ce qu'on écrit au tableau : le CODE, en grand, son QR, le lien direct et
 * « Copier le lien », le seul bouton plein de l'écran ; l'affichage projetable du code
 * est à un lien. Puis les épisodes, chacun avec le lien de classe de sa fiche (le même
 * tirage pour tout le groupe), et les participants, suivis dans la vue de l'animateur
 * existante (`/entreprises/episode/animation`), ouverte sans recopier de clé.
 * Enfin les outils, rangés : renommer, renouveler le code, clore.
 *
 * Une cohorte qui n'est pas celle de l'enseignant connecté n'existe pas pour lui : 404.
 */
export default async function MaCohortePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ creee?: string; fait?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect(await connexionPourLaPageDemandee());
  const { id } = await params;
  const { creee, fait } = await searchParams;
  const [cohorte, staff, origine] = await Promise.all([
    cohorteDeLEnseignant(session.userId, id),
    getStaffContext(session.userId),
    origineDeLaRequete(),
  ]);
  if (!cohorte) notFound();
  const isOrgAdmin = staff?.organizations.some((o) => o.role === "org_admin") ?? false;
  const lien = lienDInvitation(origine, cohorte.code);
  const episodes = cohorte.episodes
    .map((code) => episodeParCode(code))
    .filter((e): e is NonNullable<typeof e> => !!e);
  const message = creee
    ? "Cohorte créée. Donnez le code ou le lien à vos élèves : ils la rejoignent sans compte."
    : fait && Object.hasOwn(FAITS, fait)
      ? FAITS[fait]
      : null;

  return (
    <main id="main" className="pb-16">
      <EnTeteDePage
        surtitre={
          <>
            Espace enseignant /{" "}
            <Link href="/teacher/cohortes" className="hover:underline">
              Mes cohortes
            </Link>
          </>
        }
        titre={cohorte.nom}
        chapeau={`${compter(cohorte.membres, "participant")} · ${compter(episodes.length, "épisode")} · créée le ${jour(cohorte.creeeLe)}`}
      >
        <NavigationEnseignant
          className="mt-6"
          actif="cohortes"
          liens={{ etablissement: isOrgAdmin, administration: staff?.isPlatformAdmin ?? false }}
        />
      </EnTeteDePage>
      <div className={`${COLONNE_DE_PAGE} space-y-8`}>
        {message ? (
          <p role="status" className="rounded-lg encadre-neutre px-3 py-2 text-sm text-slate-200">
            {message}
          </p>
        ) : null}
        {cohorte.closeLe ? (
          <p
            data-cohorte-close=""
            className="rounded-lg encadre-neutre px-3 py-2.5 text-sm text-slate-300"
          >
            <strong className="font-semibold text-slate-100">
              Close depuis le {jour(cohorte.closeLe)}.
            </strong>{" "}
            Son code n&apos;accueille plus de nouveaux participants et la cohorte n&apos;ouvre
            plus de nouvel épisode. Les parties commencées se terminent et restent dans la vue
            de l&apos;animateur.
          </p>
        ) : null}

        <section
          aria-labelledby="diffuser-titre"
          data-diffusion=""
          className="carte grid gap-5 p-4 sm:p-7"
        >
          <h2 id="diffuser-titre" className="titre-carte text-slate-100">
            Diffuser le code
          </h2>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="min-w-0">
              <p className="text-sm text-slate-400">Code de la cohorte</p>
              <p
                id="code-de-la-cohorte"
                className="mt-1 break-all font-mono text-[clamp(2.25rem,9vw,3.75rem)] font-bold leading-none tracking-etiquette text-slate-50"
              >
                {cohorte.code}
              </p>
            </div>
            <CodeQr
              valeur={lien}
              description={`QR code d'entrée dans la cohorte, code ${cohorte.code}`}
              className="h-28 w-28 shrink-0 rounded-md"
            />
          </div>
          <div className="grid gap-2">
            <p className="text-sm text-slate-400">Le lien direct</p>
            <p data-lien-de-la-cohorte="" className="break-all font-mono text-sm text-slate-100">
              {lien}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2">
              <BoutonCopierLeLien lien={lien} />
              <BoutonCopierLeMessage message={messageDeLaCohorte(cohorte.nom, lien, cohorte.code)} />
              <Link
                href={`/teacher/cohortes/${cohorte.id}/projection`}
                className={bouton({ variante: "lien" })}
              >
                <Icone nom="ecran" /> Projeter le code
              </Link>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            Les élèves ouvrent le lien, ou tapent le code sur la page d&apos;invitation, et
            rejoignent la cohorte sans compte. Ils notent ensuite leur code de reprise, qui
            leur rend leur profil sur un autre appareil.
          </p>
        </section>

        <Rubrique note={compter(episodes.length, "épisode")}>Les épisodes</Rubrique>
        <ul className="grid gap-2" data-episodes-de-la-cohorte="">
          {episodes.map((ep) => (
            <li key={ep.code} className="carte grid gap-1 px-3 py-2.5 sm:px-4">
              <p className="text-sm font-semibold text-slate-100">
                <span className="tabular-nums text-slate-400">{ep.numero}</span> · {ep.titre}
              </p>
              <p className="text-sm text-slate-400">
                Le lien de la classe, le même tirage pour tout le groupe, à ouvrir une fois la
                cohorte rejointe :{" "}
                <Link
                  href={lienDuDebrief(ep.code)}
                  className={`${LIEN_A_L_ENCRE} break-all font-mono`}
                >
                  {`${origine}${lienDuDebrief(ep.code)}`}
                </Link>
              </p>
            </li>
          ))}
        </ul>

        <Rubrique note={compter(cohorte.membres, "participant")}>Les participants</Rubrique>
        <p className="text-sm leading-relaxed text-slate-300">
          La vue de l&apos;animateur montre l&apos;avancement du groupe, ses compétences et la
          répartition de ses choix, sans nom ni profil individuel.{" "}
          <Link
            href={`/entreprises/episode/animation/${cohorte.cleAnimateur}`}
            className={LIEN_A_L_ENCRE}
          >
            Ouvrir la vue de l&apos;animateur
          </Link>
        </p>

        <Rubrique>Gérer la cohorte</Rubrique>
        <div className="grid gap-1">
          <Tiroir titre="Renommer la cohorte">
            <GuardedForm
              action={renommerCohorteAction.bind(null, cohorte.id)}
              label="nom de la cohorte"
              className="mt-2 flex flex-wrap items-end gap-3"
            >
              <label className="grid min-w-0 flex-1 basis-60 gap-1">
                <span className="text-sm text-slate-400">Nouveau nom</span>
                <input
                  name="nom"
                  required
                  maxLength={NOM_DE_COHORTE_MAX}
                  defaultValue={cohorte.nom}
                  className="champ w-full px-3 py-2 text-base"
                />
              </label>
              <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire" })}>
                Enregistrer le nom
              </SubmitButton>
            </GuardedForm>
          </Tiroir>
          <Tiroir titre="Renouveler le code">
            <p className="mt-2 text-sm text-slate-300">
              Si le code a circulé hors de la classe : l&apos;ancien n&apos;ouvrira plus rien,
              les participants restent dans la cohorte et gardent leurs parties.
            </p>
            <GuardedForm
              action={renouvelerCodeDeCohorteAction.bind(null, cohorte.id)}
              label="renouvellement du code de la cohorte"
              className="mt-3"
            >
              <SubmitButton pendingLabel="Renouvellement…" className={bouton({ variante: "secondaire" })}>
                Remplacer le code
              </SubmitButton>
            </GuardedForm>
          </Tiroir>
          <Tiroir titre={cohorte.closeLe ? "Rouvrir la cohorte" : "Clore la cohorte"}>
            <p className="mt-2 text-sm text-slate-300">
              {cohorte.closeLe
                ? "Son code accueillera de nouveau des participants, et ses épisodes se rouvriront à ses membres."
                : "Plus de nouveaux participants, et la cohorte n'ouvre plus de nouvel épisode à ses membres. Les parties commencées se terminent et restent gardées. Vous pourrez la rouvrir."}
            </p>
            <GuardedForm
              action={(cohorte.closeLe ? rouvrirCohorteAction : cloreCohorteAction).bind(
                null,
                cohorte.id,
              )}
              label={cohorte.closeLe ? "réouverture de la cohorte" : "clôture de la cohorte"}
              className="mt-3"
            >
              <SubmitButton
                pendingLabel="Enregistrement…"
                className={bouton({ variante: "secondaire" })}
              >
                {cohorte.closeLe ? "Rouvrir la cohorte" : "Clore la cohorte"}
              </SubmitButton>
            </GuardedForm>
          </Tiroir>
        </div>
      </div>
    </main>
  );
}

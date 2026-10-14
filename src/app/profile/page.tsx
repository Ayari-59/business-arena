import Link from "next/link";
import { getGuestUserId } from "@/lib/guest";
import { getPlayerProfile } from "@/services/profile.service";
import type { SkillAxis } from "@/config/pedagogy/concepts";
import { bouton } from "@/components/bouton";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { PastilleDeRang } from "@/components/rang";
import { partiesDe } from "@/services/episode-parties.service";
import { compter, formatDecimal } from "@/lib/format";

export const dynamic = "force-dynamic";

const AXIS_LABELS: Record<SkillAxis, string> = {
  finance: "Finance",
  marketing: "Marketing",
  production: "Production",
  analysis: "Analyse",
  strategy: "Stratégie",
  decision: "Décision",
  risk: "Risque",
};

/**
 * LE PROFIL DÉCISIONNEL DES ÉPISODES vit sur sa propre page. Celle-ci ne
 * mesure que les parties de l'arène : après un épisode, elle restait vide et
 * laissait croire que rien n'avait été retenu. Elle y renvoie donc toujours,
 * et dit combien d'épisodes l'alimentent dès qu'il y en a.
 */
function EncartProfilDecisionnel({ episodes }: { episodes: number }) {
  return (
    <section className="carte flex flex-wrap items-center justify-between gap-3 p-5">
      <p className="text-sm text-slate-300">
        {episodes > 0 ? (
          <>
            <span className="font-semibold text-slate-100">Profil décisionnel :</span>{" "}
            {compter(episodes, "épisode joué", "épisodes joués")}
          </>
        ) : (
          "Les épisodes manager ont leur propre profil, décision par décision."
        )}
      </p>
      <Link
        href="/entreprises/episode/profil"
        className="text-sm font-semibold text-amber-400 underline decoration-1 underline-offset-4"
      >
        Voir mon profil décisionnel →
      </Link>
    </section>
  );
}

/**
 * Une maîtrise est un NIVEAU, pas un écart : la barre prend le bleu donnée,
 * sa longueur dit le degré. Le rouge, l'orange et le vert en faisaient un
 * feu tricolore, et l'orange y était la couleur de l'action.
 */
const masteryTone = (_v: number) => "bg-[var(--donnee)]";

export default async function ProfilePage() {
  const userId = await getGuestUserId();
  const [profile, parties] = userId
    ? await Promise.all([getPlayerProfile(userId), partiesDe(userId)])
    : [null, []];

  if (!profile) {
    return (
      <main id="main">
        <EnTeteDePage
          surtitre="Mon profil"
          titre="Profil de compétences"
          chapeau="Votre profil se construit en jouant : lancez une première partie pour commencer à mesurer vos compétences de gestion."
        >
          <div className="mt-6">
            <Link href="/jouer" className={bouton()}>
              Jouer une partie
            </Link>
          </div>
        </EnTeteDePage>
        <div className={`${COLONNE_DE_PAGE} pb-16`}>
          <EncartProfilDecisionnel episodes={parties.length} />
        </div>
      </main>
    );
  }

  return (
    <main id="main">
      <EnTeteDePage
        surtitre="Mon profil"
        titre={<>Profil · {profile.displayName}</>}
        chapeau={
          <>
            Vos compétences évoluent à chaque situation traitée : diagnostics justes, modèles bien
            choisis et autonomie (peu d&apos;indices) font progresser la maîtrise.
          </>
        }
      />
      <div className={`${COLONNE_DE_PAGE} space-y-8 pb-16`}>
        <EncartProfilDecisionnel episodes={parties.length} />

        <section className="carte p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Compétences par axe</h2>
          {profile.skills.length === 0 ? (
            <p className="text-sm text-slate-400">
              Encore aucune mesure : traitez les situations proposées pendant vos parties.
            </p>
          ) : (
            <ul className="space-y-2">
              {profile.skills.map((s) => (
                <li key={s.axis} className="text-sm">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>{AXIS_LABELS[s.axis]}</span>
                    <span className="tabular-nums text-slate-400">{Math.round(s.value)}</span>
                  </div>
                  <div className="mt-0.5 h-1.5 rounded-full bg-slate-950">
                    <div
                      className={`h-1.5 rounded-full ${masteryTone(s.value)}`}
                      style={{ width: `${Math.max(2, Math.min(100, s.value))}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="carte p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Maîtrise des notions</h2>
          {profile.concepts.length === 0 ? (
            <p className="text-sm text-slate-400">
              Les notions rencontrées en jeu apparaîtront ici.
            </p>
          ) : (
            <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {profile.concepts.map((c) => (
                <li key={c.code} className="text-sm">
                  <div className="flex items-center justify-between text-slate-300">
                    <Link href={`/notions#${c.code}`} className="hover:text-amber-200">
                      {c.name}
                    </Link>
                    <span className="tabular-nums text-slate-400">{Math.round(c.mastery)}</span>
                  </div>
                  <div className="mt-0.5 h-1 rounded-full bg-slate-950">
                    <div
                      className={`h-1 rounded-full ${masteryTone(c.mastery)}`}
                      style={{ width: `${Math.max(2, Math.min(100, c.mastery))}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="carte p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Mes parties</h2>
          {profile.games.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune partie jouée sur ce navigateur.</p>
          ) : (
            <ul className="space-y-2">
              {profile.games.map((g) => (
                <li key={g.gameId}>
                  <Link
                    href={`/arena/${g.gameId}`}
                    className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                  >
                    <span>
                      {g.teamName}
                      <span className="ml-2 text-xs text-slate-400">
                        {g.kind === "class" ? "partie de classe" : "solo"} ·{" "}
                        {g.status === "finished"
                          ? "terminée"
                          : `tour ${g.currentRound}/${g.roundsCount}`}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 tabular-nums text-slate-400">
                      {g.bpi !== null ? `IPG ${formatDecimal(g.bpi)}` : "—"}
                      {g.rank !== null ? <PastilleDeRang rang={g.rank} /> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

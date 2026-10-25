import type { Metadata } from "next";
import Link from "next/link";
import { bouton } from "@/components/bouton";
import { SubmitButton } from "@/components/submit-button";
import { PiedDePage } from "@/components/pied-de-page";
import { ArticulationDuCours } from "@/components/articulation-du-cours";
import { OuvreLeTiroirVise } from "@/components/ouvre-le-tiroir-vise";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { CHAPITRES, PALIERS, PARCOURS, PROGRAMME } from "@/config/cours/registre";
import { dureeDuChapitre, dureeEnClair } from "@/config/cours/duree";
import { diplomesParNiveau, programmeDuDiplome } from "@/config/cours/programme";
import { THEMES, episodesDuTheme, themeDuChapitre, type Theme } from "@/config/cours/themes";
import type { Chapitre } from "@/config/cours/types";
import type { Situation } from "@/config/cours/situations";
import { episodeParCode } from "@/pedagogy/episodes/registre";
import { situationsDuTheme } from "@/pedagogy/cours/suites";
import { getGuestUserId } from "@/lib/guest";
import { classeDeLEleve } from "@/services/cours.service";
import { ENTREPRISES } from "./entreprises";
import { quitterClasseAction } from "./actions";

/** La classe de l'élève se lit à chaque ouverture : la page se rend à la demande. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Le cours par la simulation : comptabilité, gestion, commerce et ressources humaines",
  description:
    "Un cas d'entreprise simulé, guidé étape par étape : l'élève passe lui-même les écritures, répond aux questions et construit son compte de résultat et son bilan.",
  alternates: { canonical: "/cours" },
};

/**
 * LE COURS PAR LA SIMULATION (décision du propriétaire, octobre 2026).
 *
 * Chaque chapitre est un cas simulé que l'élève suit pas à pas : il passe les
 * écritures, répond, calcule, et la simulation lui montre ce que chaque opération
 * change dans les comptes de l'entreprise qu'il a choisie.
 *
 * LE THÈME D'ABORD (choix du propriétaire). La page rangeait les chapitres par
 * parcours, et un parcours mêlait une discipline et un diplôme : la carte faisait
 * cinq mille pixels, chaque palier écrivait ses titres deux fois (le programme,
 * puis les liens), et « sous licence » se répétait sur chaque lien. Elle se range
 * désormais par thème (config/cours/themes.ts), dans des tiroirs fermés à
 * l'arrivée, chaque chapitre sur une ligne avec son palier, sa durée indicative
 * et son accès, et les épisodes du thème à jouer en situation. Le diplôme est un
 * filtre : il compile le programme (config/cours/programme.ts), avec sa
 * couverture du référentiel, ses ateliers, ses chapitres et ses épisodes.
 *
 * Le premier chapitre est libre ; la suite est réservée aux établissements sous
 * licence.
 */
export default async function CoursPage({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string; diplome?: string }>;
}) {
  const pilote = CHAPITRES.find((c) => c.libre)!;
  const [{ classe: annonce, diplome }, userId] = await Promise.all([searchParams, getGuestUserId()]);
  const programme = diplome ? programmeDuDiplome(diplome) : null;
  const classe = userId ? await classeDeLEleve(userId) : null;
  const imposee = classe?.entreprise ? ENTREPRISES.find((e) => e.code === classe.entreprise) : undefined;
  return (
    <>
      <main id="main">
        <EnTeteDePage
          surtitre="Le cours par la simulation"
          titre="Comptabilité, gestion et commerce, sur un cas qui vit"
          chapeau={
            <>
              Un cas d&apos;entreprise simulé, guidé étape par étape. L&apos;élève passe lui-même les écritures,
              répond aux questions, et voit à chaque fois ce que l&apos;opération change dans les comptes. Seul ou en
              classe, dans l&apos;entreprise du jeu que vous choisissez.
            </>
          }
        />
        <div className={`${COLONNE_DE_PAGE} grid gap-12 pb-16 pt-2`}>
          {/* L'ÉLÈVE D'UNE CLASSE le lit d'abord : sa classe, son nom, et l'entreprise que
              l'enseignant a choisie pour tous, s'il en a choisi une. */}
          {classe ? (
            <section className="encadre-neutre grid gap-2 rounded-lg px-4 py-3 text-sm" data-classe-du-cours="">
              <p>
                {annonce === "rejointe" ? "Inscription enregistrée. " : ""}Vous suivez le cours avec la classe{" "}
                <strong className="font-semibold">« {classe.classe} »</strong>, sous le nom{" "}
                <strong className="font-semibold">{classe.eleve}</strong> : votre enseignant voit où vous en êtes.
                {imposee ? ` Votre enseignant a choisi l'entreprise ${imposee.nom} pour toute la classe.` : ""}
              </p>
              <form action={quitterClasseAction}>
                <SubmitButton pendingLabel="Départ…" className={bouton({ variante: "lien", taille: "s" })}>
                  Quitter la classe
                </SubmitButton>
              </form>
            </section>
          ) : (
            <p className="text-sm text-slate-400">
              {annonce === "quittee" ? "Vous avez quitté votre classe. " : ""}Votre enseignant vous a donné un code
              de classe ?{" "}
              <Link href="/cours/rejoindre" className="underline underline-offset-4 hover:text-slate-200">
                Rejoindre une classe
              </Link>
            </p>
          )}
          {/* LE PREMIER CHAPITRE, EN BANDEAU. Il prenait la moitié de l'écran avec ses
              entreprises en cartes ; il reste la porte d'entrée, mais le choix de
              l'entreprise se replie, et le catalogue arrive plus tôt. */}
          <section aria-labelledby="pilote" className="carte grid gap-4 p-5 sm:p-6">
            <div className="grid gap-1">
              <p className="text-sm font-semibold uppercase tracking-etiquette text-amber-300">
                Premier chapitre · libre d&apos;accès · {dureeEnClair(dureeDuChapitre(pilote))}
              </p>
              <h2 id="pilote" className="text-2xl font-bold text-slate-50">
                {pilote.titre}
              </h2>
              <p className="max-w-3xl text-base leading-relaxed text-slate-300">{pilote.accroche}</p>
            </div>
            <p className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <Link href={`/cours/${pilote.code}?entreprise=${ENTREPRISES[0]!.code}`} className={bouton({ taille: "m" })}>
                Commencer avec {ENTREPRISES[0]!.nom}
              </Link>
              <Link
                href={`/cours/${pilote.code}?entreprise=${ENTREPRISES[0]!.code}&classe`}
                className={bouton({ variante: "secondaire", taille: "m" })}
              >
                Projeter en classe
              </Link>
            </p>
            <details className="group">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-200 [&::-webkit-details-marker]:hidden">
                <span aria-hidden className="mr-2 inline-block text-amber-400 transition-transform group-open:rotate-90">
                  ▸
                </span>
                Choisir une autre entreprise du cas ({ENTREPRISES.length})
              </summary>
              <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                {ENTREPRISES.map((e) => (
                  <li key={e.code}>
                    <Link
                      href={`/cours/${pilote.code}?entreprise=${e.code}`}
                      style={{ borderLeftColor: `var(--secteur-${e.teinte})` }}
                      className="flex min-h-14 flex-col justify-center rounded-lg border border-l-4 border-white/10 px-3 py-2 transition hover:border-white/30"
                    >
                      <span className="font-semibold text-slate-100">{e.nom}</span>
                      <span className="text-xs text-slate-400">{e.tagline}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          </section>

          <ArticulationDuCours />
          {/* `/cours#theme-vente`, depuis la fin d'un chapitre ou le bilan d'un épisode : le tiroir s'ouvre. */}
          <OuvreLeTiroirVise />

          <section aria-labelledby="catalogue" className="grid gap-6">
            <div className="grid gap-2">
              <h2 id="catalogue" className="scroll-mt-24 text-2xl font-bold text-slate-50">
                Le catalogue par thème
              </h2>
              <p className="max-w-3xl text-base text-slate-300">
                {CHAPITRES.length} chapitres en {THEMES.length} thèmes, du lycée au DCG, et des épisodes à jouer en
                situation. Chaque chapitre dit son palier, sa durée indicative et son accès : le premier est libre, la
                suite est réservée aux établissements sous licence.
              </p>
            </div>

            {/* LE DIPLÔME, EN FILTRE. Le formulaire marche sans script : il recharge la page
                avec le diplôme dans l'adresse, et le programme se compile côté serveur. */}
            <form method="get" action="/cours#programme" className="carte flex flex-wrap items-end gap-3 p-4" data-filtre-diplome="">
              <label className="grid min-w-0 flex-1 gap-1 text-sm">
                <span className="font-semibold text-slate-100">Votre diplôme</span>
                <select
                  name="diplome"
                  defaultValue={programme?.formation.code ?? ""}
                  className="min-w-0 rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-slate-100"
                >
                  <option value="">Tous les thèmes, sans filtre</option>
                  {diplomesParNiveau().map((g) => (
                    <optgroup key={g.niveau} label={g.niveau}>
                      {g.formations.map((f) => (
                        <option key={f.code} value={f.code}>
                          {f.sigle}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <SubmitButton pendingLabel="Compilation…" className={bouton({ taille: "m" })}>
                Compiler le programme
              </SubmitButton>
            </form>

            {programme ? (
              <section
                aria-labelledby="programme-titre"
                id="programme"
                data-programme={programme.formation.code}
                className="carte grid scroll-mt-24 gap-5 border-amber-400/30 p-5 sm:p-6"
              >
                <div className="grid gap-1">
                  <p className="text-sm font-semibold uppercase tracking-etiquette text-amber-300">Votre programme</p>
                  <h3 id="programme-titre" className="text-xl font-bold text-slate-50">
                    {programme.formation.nom}
                  </h3>
                  <p className="text-sm text-slate-300" data-couverture-du-programme="">
                    {programme.couverture.lu
                      ? `${programme.couverture.travaillees} entrées sur ${programme.couverture.total} du référentiel travaillées par l'arène${
                          programme.couverture.horsDuChamp > 0
                            ? `, ${programme.couverture.horsDuChamp} hors du champ de la gestion`
                            : ""
                        }. `
                      : "Le référentiel de ce diplôme n'a pas encore été confronté à son texte. "}
                    <Link
                      href={`/parcours/${programme.formation.code}`}
                      className="text-amber-300 underline-offset-4 hover:underline"
                    >
                      Le tableau de couverture, entrée par entrée
                    </Link>
                  </p>
                </div>

                <div className="grid gap-2">
                  <h4 className="text-sm font-semibold uppercase tracking-etiquette text-slate-400">En classe</h4>
                  {programme.ateliers.length > 0 ? (
                    <ul className="grid gap-1 text-sm">
                      {programme.ateliers.map((a) => (
                        <li key={a.code}>
                          <Link
                            href={`/animations/${a.code}`}
                            className="font-medium text-slate-100 underline-offset-4 hover:text-amber-300 hover:underline"
                          >
                            {a.titre}
                          </Link>{" "}
                          <span className="text-slate-400">· atelier · {a.annee}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400">
                      Pas encore d&apos;atelier écrit pour ce diplôme : un atelier se construit sur mesure, sur les blocs
                      de son référentiel.{" "}
                      <Link
                        href={`/parcours/${programme.formation.code}`}
                        className="text-amber-300 underline-offset-4 hover:underline"
                      >
                        Ce que nous demandons et ce que nous livrons
                      </Link>
                    </p>
                  )}
                </div>

                <div className="grid gap-3">
                  <h4 className="text-sm font-semibold uppercase tracking-etiquette text-slate-400">Les chapitres</h4>
                  {programme.themes.length > 0 ? (
                    programme.themes.map(({ theme, chapitres }) => (
                      <div key={theme.code} className="grid gap-1">
                        <p className="text-sm font-semibold text-slate-200">{theme.titre}</p>
                        <ListeDeChapitres chapitres={chapitres} imposee={imposee?.code} />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">Aucun chapitre du cours ne travaille encore ce diplôme.</p>
                  )}
                </div>

                {programme.situations.length > 0 ? (
                  <div className="grid gap-2">
                    <h4 className="text-sm font-semibold uppercase tracking-etiquette text-slate-400">
                      Mises en situation
                    </h4>
                    <ListeDeSituations situations={programme.situations} imposee={imposee?.code} />
                  </div>
                ) : null}

                {programme.episodes.length > 0 ? (
                  <div className="grid gap-2">
                    <h4 className="text-sm font-semibold uppercase tracking-etiquette text-slate-400">En situation</h4>
                    <ListeDEpisodes codes={programme.episodes} />
                  </div>
                ) : null}
              </section>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              {THEMES.map((theme) => {
                const chapitres = theme.chapitres.map((code) => CHAPITRES.find((c) => c.code === code)!);
                const episodes = episodesDuTheme(theme);
                const aVenir = enPreparationDuTheme(theme);
                const situations = situationsDuTheme(theme);
                return (
                  <details
                    key={theme.code}
                    id={`theme-${theme.code}`}
                    data-theme={theme.code}
                    className="group carte scroll-mt-24 self-start transition-colors hover:border-white/25"
                  >
                    <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] gap-x-3 gap-y-1 p-4 [&::-webkit-details-marker]:hidden">
                      <span className="font-semibold text-slate-100">{theme.titre}</span>
                      <span
                        aria-hidden
                        className="row-span-2 self-center text-amber-400/80 transition-transform group-open:rotate-90"
                      >
                        ▸
                      </span>
                      <span className="text-sm text-slate-400">
                        {chapitres.length > 0
                          ? `${chapitres.length} chapitre${chapitres.length > 1 ? "s" : ""}`
                          : "Pas encore de chapitre"}
                        {situations.length > 0
                          ? ` · ${situations.length} mise${situations.length > 1 ? "s" : ""} en situation`
                          : ""}
                        {episodes.length > 0 ? ` · ${episodes.length} épisode${episodes.length > 1 ? "s" : ""} en situation` : ""}
                      </span>
                    </summary>
                    <div className="grid gap-4 border-t border-white/10 p-4">
                      <p className="text-sm leading-relaxed text-slate-300">{theme.description}</p>
                      {chapitres.length > 0 ? (
                        <ListeDeChapitres chapitres={chapitres} imposee={imposee?.code} />
                      ) : (
                        <p className="text-sm text-slate-400">
                          Ce thème se travaille aujourd&apos;hui en situation, par les épisodes ci-dessous.
                        </p>
                      )}
                      {situations.length > 0 ? (
                        <div className="grid gap-2">
                          <p className="text-xs font-semibold uppercase tracking-etiquette text-slate-400">
                            Mises en situation
                          </p>
                          <ListeDeSituations situations={situations} imposee={imposee?.code} />
                        </div>
                      ) : null}
                      {aVenir.map((v) => (
                        <p key={v.parcours} className="text-sm text-slate-400" data-a-venir="">
                          À venir : {v.nombre} chapitre{v.nombre > 1 ? "s" : ""} du parcours {v.titre}.
                        </p>
                      ))}
                      {episodes.length > 0 ? (
                        <div className="grid gap-2">
                          <p className="text-xs font-semibold uppercase tracking-etiquette text-slate-400">En situation</p>
                          <ListeDEpisodes codes={episodes} />
                        </div>
                      ) : null}
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        </div>
      </main>
      <PiedDePage />
    </>
  );
}

/** Le public d'un chapitre : celui de son parcours à ce palier, sinon celui du palier. */
function publicDuChapitre(c: Chapitre): string {
  const parcours = PARCOURS.find((p) => p.code === c.parcours);
  return parcours?.publics?.[c.palier] ?? PALIERS.find((p) => p.palier === c.palier)!.public;
}

/** Le lien d'un chapitre : dans l'entreprise imposée à la classe, ou la première où il se joue. */
function lienDuChapitre(c: Chapitre, imposee?: string): string {
  const voulue = imposee ?? ENTREPRISES[0]!.code;
  const entreprise = c.entreprises && !c.entreprises.codes.includes(voulue) ? c.entreprises.codes[0] : voulue;
  return `/cours/${c.code}?entreprise=${entreprise}`;
}

/**
 * LES CHAPITRES D'UNE LISTE, UNE LIGNE CHACUN : le palier et son public, le titre,
 * la durée, l'accès. « Sous licence » ne se répète plus sur chaque lien : un
 * cadenas le dit, et le chapitre libre se signale.
 */
function ListeDeChapitres({ chapitres, imposee }: { chapitres: readonly Chapitre[]; imposee?: string }) {
  return (
    <ol className="grid gap-2.5">
      {chapitres.map((c) => (
        <li key={c.code} data-chapitre={c.code} className="grid gap-x-3 sm:grid-cols-[4.5rem_1fr_auto] sm:items-baseline">
          <span className="text-xs tabular-nums text-slate-400">Palier {c.palier}</span>
          <span className="grid min-w-0">
            <Link
              href={lienDuChapitre(c, imposee)}
              className="font-medium text-slate-100 underline-offset-4 hover:text-amber-300 hover:underline"
            >
              {c.titre}
            </Link>
            <span className="text-xs text-slate-400">{publicDuChapitre(c)}</span>
          </span>
          <span className="whitespace-nowrap text-xs tabular-nums text-slate-400">
            {dureeEnClair(dureeDuChapitre(c))}
            {" · "}
            {c.libre ? <span className="font-semibold text-amber-300">libre</span> : "licence"}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * LES MISES EN SITUATION : la question d'un commanditaire, sans cours, sur les
 * calculs de chapitres déjà vus. La ligne dit lesquels, pour que l'enseignant la
 * place après eux.
 */
function ListeDeSituations({ situations, imposee }: { situations: readonly Situation[]; imposee?: string }) {
  return (
    <ul className="grid gap-2.5">
      {situations.map((s) => (
        <li key={s.code} data-situation-de-cours={s.code} className="grid gap-x-3 sm:grid-cols-[4.5rem_1fr_auto] sm:items-baseline">
          <span className="text-xs tabular-nums text-slate-400">Palier {s.palier}</span>
          <span className="grid min-w-0">
            <Link
              href={lienDuChapitre(s, imposee)}
              className="font-medium text-slate-100 underline-offset-4 hover:text-amber-300 hover:underline"
            >
              {s.titre}
            </Link>
            <span className="text-xs text-slate-400">
              {s.commanditaire} demande · reprend{" "}
              {s.reprend.map((c) => CHAPITRES.find((x) => x.code === c)?.titre ?? c).join(", ")}
            </span>
          </span>
          <span className="whitespace-nowrap text-xs tabular-nums text-slate-400">
            {dureeEnClair(dureeDuChapitre(s))}
            {" · "}
            {s.libre ? <span className="font-semibold text-amber-300">libre</span> : "licence"}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Les épisodes à jouer en situation, en pastilles qui mènent à l'épisode. */
function ListeDEpisodes({ codes }: { codes: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {codes.map((code) => (
        <li key={code} data-episode={code}>
          <Link
            href={`/entreprises/episode/${code}`}
            className="inline-block rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-xs text-slate-300 transition hover:border-amber-400/40 hover:text-amber-300"
          >
            {episodeParCode(code)?.titre ?? code}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * CE QUI VIENT, THÈME PAR THÈME. Un parcours qui se construit (les ressources
 * humaines du bac STMG) annonce ses chapitres à venir sous le thème de ceux qui
 * sont déjà écrits : le nombre se compte sur son programme, jamais à la main.
 */
function enPreparationDuTheme(theme: Theme): { parcours: string; titre: string; nombre: number }[] {
  return PARCOURS.filter((p) => p.enPreparation).flatMap((p) => {
    const ecrits = CHAPITRES.filter((c) => c.parcours === p.code);
    if (ecrits.length === 0 || themeDuChapitre(ecrits[0]!.code)?.code !== theme.code) return [];
    const prevus = Object.values(PROGRAMME[p.code]).reduce((n, titres) => n + (titres?.length ?? 0), 0);
    const nombre = prevus - ecrits.length;
    return nombre > 0 ? [{ parcours: p.code, titre: p.titre, nombre }] : [];
  });
}

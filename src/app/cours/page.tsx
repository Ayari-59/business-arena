import { avecTypographie } from "@/components/typographie";
import { Icone } from "@/components/icone";
import type { Metadata } from "next";
import Link from "next/link";
import { bouton } from "@/components/bouton";
import { SubmitButton } from "@/components/submit-button";
import { PiedDePage } from "@/components/pied-de-page";
import { ArticulationDuCours } from "@/components/articulation-du-cours";
import { OuvreLeTiroirVise } from "@/components/ouvre-le-tiroir-vise";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { CHAPITRES, PALIERS, PARCOURS, PROGRAMME } from "@/config/cours/registre";
import {
  PARCOURS_DE_FORMATION,
  chapitresDuParcoursDeFormation,
  parcoursQuiOuvrent,
} from "@/config/cours/parcours-de-formation";
import { dureeDuChapitre, dureeEnClair } from "@/config/cours/duree";
import { coursDuDiplome, couvertureDuCoursEnClair, rechercherChapitres, type ChapitreDuDiplome } from "@/config/cours/par-diplome";
import { LIBELLE_POUR_ALLER_PLUS_LOIN } from "@/config/cours/pour-aller-plus-loin";
import { diplomesParNiveau, programmeDuDiplome } from "@/config/cours/programme";
import { CHAPITRES_PROPOSES, PARCOURS_PROPOSES, chapitrePropose } from "@/config/formations-proposees";
import { THEMES, episodesDuTheme, themeDuChapitre, type Theme } from "@/config/cours/themes";
import type { Chapitre } from "@/config/cours/types";
import { casDuChapitre, type Situation } from "@/config/cours/situations";
import { bureauxDuChapitre, lienDuBureau } from "@/config/cours/bureaux";
import { enquetesDuChapitre, lienDeLEnquete } from "@/config/cours/enquetes";
import { lienDuScenario, scenariosDuChapitre } from "@/config/cours/scenarios";
import { coursDeLaFormation } from "@/config/couverture";
import { chapitreLibreParDefaut, essaiDuDiplome } from "@/config/cours/chapitres-libres";
import { formationDuParcours } from "@/config/cours/competences-affichees";
import { EssaiDuDiplome } from "@/components/cours/essai-du-diplome";
import { episodeParCode } from "@/pedagogy/episodes/registre";
import { casDeSyntheseDuTheme } from "@/pedagogy/cours/suites";
import { getGuestUserId } from "@/lib/guest";
import { getSession } from "@/lib/session";
import { classeDeLEleve, coursOuvert, liberationDeLEleve } from "@/services/cours.service";
import { libereALaClasse } from "@/services/chapitres-de-la-classe";
import { ENTREPRISES } from "./entreprises";
import { quitterClasseAction } from "./actions";

/** La classe de l'élève se lit à chaque ouverture : la page se rend à la demande. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Le cours par la simulation : comptabilité, gestion, commerce et ressources humaines",
  description:
    "Choisissez votre diplôme, du bac STMG au DSCG : ses chapitres dans l'ordre d'apprentissage, bloc par bloc du référentiel. Sur un cas d'entreprise simulé, l'élève passe lui-même les écritures et construit ses comptes.",
  alternates: { canonical: "/cours" },
};

/** Le nombre de chapitres de chaque diplôme, pour ses tuiles : compté une fois, au chargement. */
const CHAPITRES_PAR_DIPLOME = new Map(
  diplomesParNiveau().flatMap((g) =>
    g.formations.map((f) => [f.code, coursDeLaFormation(f.code).reduce((n, x) => n + x.chapitres.length, 0)] as const),
  ),
);

/**
 * LE COURS PAR LA SIMULATION (décision du propriétaire, octobre 2026).
 *
 * Chaque chapitre est un cas simulé que l'élève suit pas à pas : il passe les
 * écritures, répond, calcule, et la simulation lui montre ce que chaque opération
 * change dans les comptes de l'entreprise qu'il a choisie.
 *
 * LE DIPLÔME D'ABORD (chantier approuvé par le propriétaire, novembre 2026). La page
 * entrait par le thème, et le diplôme n'était qu'un filtre sous le catalogue. Elle
 * demande désormais « Votre formation ? », du bac STMG au DSCG avec les BUT, en tuiles qui
 * sont des liens (la page marche sans script) ; le diplôme choisi (`?diplome=`) montre
 * ses chapitres dans l'ordre d'apprentissage, groupés par bloc de son référentiel
 * (config/cours/par-diplome.ts), chacun avec ses objectifs repliés, sa durée, ses
 * prérequis, et un cadenas s'il est réservé POUR CE VISITEUR. Le catalogue par thème
 * (config/cours/themes.ts) reste, en lien secondaire « Parcourir par thème », et les
 * liens `/cours#theme-…` des fins de chapitre l'ouvrent toujours ; une recherche par
 * mot-clé (`?q=`) le complète. Aucune adresse ne change.
 *
 * UN CHAPITRE LIBRE PAR DIPLÔME (décision du propriétaire, novembre 2026 ;
 * config/cours/chapitres-libres.ts) : le premier de son parcours, avec son cas pratique. La vue
 * d'un diplôme le met en tête, sous son nom ; le bandeau « Pour essayer » le reprend, avec le choix
 * de l'entreprise. Sans diplôme, l'essai par défaut. La suite est réservée aux établissements sous
 * licence.
 */
async function CoursPage({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string; diplome?: string; q?: string }>;
}) {
  const [{ classe: annonce, diplome, q }, userId, session] = await Promise.all([searchParams, getGuestUserId(), getSession()]);
  const programme = diplome ? programmeDuDiplome(diplome) : null;
  const parcours = programme ? coursDuDiplome(programme.formation.code) : null;
  const parcoursDeFormation = programme ? PARCOURS_DE_FORMATION.find((p) => p.formation === programme.formation.code) : undefined;
  const classe = userId ? await classeDeLEleve(userId) : null;
  const imposee = classe?.entreprise ? ENTREPRISES.find((e) => e.code === classe.entreprise) : undefined;
  // L'ESSAI : le chapitre libre du diplôme choisi, sinon de celui de la classe de l'élève, sinon l'essai
  // par défaut (config/cours/chapitres-libres.ts). « Ma classe » commence par celui de sa classe.
  const essaiDuProgramme = programme ? essaiDuDiplome(programme.formation.code) : null;
  const essaiDeLaClasse = essaiDuDiplome(formationDuParcours(classe?.parcours));
  const essai = essaiDuProgramme ?? essaiDeLaClasse;
  const pilote = essai?.chapitre ?? chapitreLibreParDefaut();
  const aCommencer = essaiDeLaClasse?.chapitre ?? pilote;
  // Les entreprises où l'essai se joue (un chapitre peut n'en garder que certaines).
  const entreprisesDuPilote = ENTREPRISES.filter((e) => !pilote.entreprises || pilote.entreprises.codes.includes(e.code));
  const premiere = entreprisesDuPilote[0]!;
  const motCle = (q ?? "").trim().slice(0, 80);
  const lignesDuParcours = parcours?.blocs.flatMap((b) => b.chapitres) ?? [];
  const trouves = motCle ? rechercherChapitres(motCle, parcours ? lignesDuParcours.map((l) => l.chapitre) : undefined) : [];
  const ouverts = await chapitresOuverts(
    { enseignant: session?.userId ?? null, eleve: classe ? userId : null },
    [...lignesDuParcours.map((l) => l.chapitre), ...trouves],
  );
  const vueParDefaut = !programme && !motCle;
  // Le diplôme de l'essai, que les liens du chapitre libre portent aussi (config/cours/competences-affichees.ts).
  const duDiplome = essai ? `&diplome=${essai.diplome.code}` : programme ? `&diplome=${programme.formation.code}` : "";
  return (
    <>
      <main id="main">
        <EnTeteDePage
          surtitre="Le cours par la simulation"
          titre="Comptabilité, gestion et commerce, sur un cas qui vit"
          chapeau={
            <>
              Un cas d&apos;entreprise simulé, guidé étape par étape. L&apos;élève passe lui-même les écritures,
              répond aux questions, et voit à chaque fois ce que l&apos;opération change dans les comptes. Choisissez
              votre formation : ses chapitres viennent dans l&apos;ordre où ils s&apos;apprennent, bloc par bloc.
            </>
          }
        />
        <div className={`${COLONNE_DE_PAGE} grid gap-12 pb-16 pt-2`}>
          {/* L'ÉLÈVE D'UNE CLASSE le lit d'abord : sa classe, son nom, et l'entreprise que
              l'enseignant a choisie pour tous, s'il en a choisi une. */}
          {classe ? (
            // « MA CLASSE », EN TÊTE ET AVEC SON BOUTON (audit UX du 29 octobre 2026, P1-2) :
            // l'inscription se noyait dans la vitrine du cours ; l'élève lit sa classe et le
            // chapitre à commencer, avant tout ce qui s'adresse aux enseignants.
            <section className="carte grid gap-3 p-5 sm:p-6" data-classe-du-cours="" aria-labelledby="ma-classe">
              {annonce === "rejointe" ? (
                <p role="status" className="text-sm font-semibold text-emerald-300">
                  Inscription enregistrée.
                </p>
              ) : null}
              <h2 id="ma-classe" className="text-2xl font-bold text-slate-50">
                Ma classe : « {classe.classe} »
              </h2>
              <p className="text-sm text-slate-300">
                Vous suivez le cours sous le nom <strong className="font-semibold">{classe.eleve}</strong> : votre
                enseignant voit où vous en êtes.
                {imposee ? ` Votre enseignant a choisi l'entreprise ${imposee.nom} pour toute la classe.` : ""}
              </p>
              <p>
                <Link
                  href={lienDuChapitre(aCommencer, imposee?.code, essaiDeLaClasse?.diplome.code)}
                  className={bouton({ taille: "l" })}
                  data-commencer-en-classe=""
                >
                  Commencer : {aCommencer.titre}
                </Link>
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

          {/* « VOTRE FORMATION ? » : l'entrée par le diplôme, du bac STMG au DSCG. Chaque tuile est
              un lien : le parcours du diplôme se compile côté serveur, sans script. */}
          <section aria-labelledby="formation" className="grid gap-5" data-entree-par-diplome="">
            <div className="grid gap-2">
              <h2 id="formation" className="scroll-mt-24 text-2xl font-bold text-slate-50">
                Votre formation ?
              </h2>
              <p className="max-w-3xl text-base text-slate-300">
                Du bac STMG au DSCG, avec les BUT : choisissez le diplôme, et lisez ses chapitres dans l&apos;ordre où ils
                s&apos;apprennent, rangés sous les blocs de son référentiel.
              </p>
            </div>
            <div className="grid gap-4">
              {diplomesParNiveau().map((g) => (
                <div key={g.niveau} className="grid gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-etiquette text-slate-400">{g.niveau}</h3>
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {g.formations.map((f) => {
                      const nombre = CHAPITRES_PAR_DIPLOME.get(f.code) ?? 0;
                      const choisi = programme?.formation.code === f.code;
                      return (
                        <li key={f.code}>
                          <Link
                            href={`/cours?diplome=${f.code}#programme`}
                            title={f.nom}
                            data-diplome-tuile={f.code}
                            aria-current={choisi ? "page" : undefined}
                            className={`flex min-h-14 flex-col justify-center rounded-lg border px-3 py-2 transition hover:border-white/35 ${
                              choisi ? "border-slate-300 bg-white/5" : "border-white/10"
                            }`}
                          >
                            <span className="font-semibold text-slate-100">{f.sigle}</span>
                            <span className="text-xs text-slate-400">
                              {nombre > 0 ? `${nombre} chapitre${nombre > 1 ? "s" : ""}` : "Pas encore de chapitre"}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            {/* LA RECHERCHE PAR MOT-CLÉ, et le catalogue par thème en lien secondaire. Dans la
                vue d'un diplôme, la recherche reste dans ses chapitres. */}
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <form method="get" action="/cours#recherche" role="search" className="flex min-w-0 flex-1 flex-wrap items-end gap-2" data-recherche-du-cours="">
                {programme ? <input type="hidden" name="diplome" value={programme.formation.code} /> : null}
                <label className="grid min-w-0 flex-1 gap-1 text-sm">
                  <span className="font-semibold text-slate-100">
                    {programme ? `Chercher dans le ${programme.formation.sigle}` : "Chercher une notion"}
                  </span>
                  <input
                    type="search"
                    name="q"
                    defaultValue={motCle}
                    placeholder="seuil de rentabilité, TVA, paie…"
                    className="min-w-0 rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-slate-100"
                  />
                </label>
                <SubmitButton pendingLabel="Recherche…" className={bouton({ variante: "secondaire", taille: "m" })}>
                  Chercher
                </SubmitButton>
              </form>
              <Link
                href={vueParDefaut ? "#catalogue" : "/cours#catalogue"}
                className="text-sm text-slate-300 underline underline-offset-4 hover:text-slate-100"
                data-parcourir-par-theme=""
              >
                Parcourir par thème
              </Link>
            </div>
          </section>

          {motCle ? (
            <section aria-labelledby="recherche" className="grid gap-3" data-resultats-de-recherche="">
              <h2 id="recherche" className="scroll-mt-24 text-xl font-bold text-slate-50">
                « {motCle} » : {trouves.length > 0 ? `${trouves.length} chapitre${trouves.length > 1 ? "s" : ""}` : "aucun chapitre"}
                {programme ? ` dans le ${programme.formation.sigle}` : ""}
              </h2>
              {trouves.length > 0 ? (
                <ListeDeChapitres chapitres={trouves} imposee={imposee?.code} ouverts={ouverts} diplome={programme?.formation.code} />
              ) : (
                <p className="text-sm text-slate-400">
                  Essayez un autre mot, ou{" "}
                  <Link href="/cours#catalogue" className="underline underline-offset-4 hover:text-slate-200">
                    parcourez le catalogue par thème
                  </Link>
                  .
                </p>
              )}
            </section>
          ) : null}

          {programme && parcours ? (
            <section
              aria-labelledby="programme-titre"
              id="programme"
              data-programme={programme.formation.code}
              className="carte grid scroll-mt-24 gap-6 border-amber-400/30 p-5 sm:p-6"
            >
              <div className="grid gap-1">
                <p className="text-sm font-semibold uppercase tracking-etiquette text-amber-300">Votre parcours</p>
                <h2 id="programme-titre" className="text-2xl font-bold text-slate-50">
                  {programme.formation.nom}
                </h2>
                {/* L'ESSAI DU DIPLÔME, EN TÊTE (audit du 10 novembre 2026, produit P1-1) : il était au
                    bandeau « Pour essayer », sous le parcours entier, au 24e écran sur téléphone. */}
                {essaiDuProgramme ? (
                  <EssaiDuDiplome
                    essai={essaiDuProgramme}
                    lien={(c) => lienDuChapitre(c, imposee?.code, essaiDuProgramme.diplome.code)}
                    className="my-2"
                  />
                ) : null}
                {/* Ce que le cours couvre, matière par matière, comme les blocs ci-dessous le marquent ;
                    la couverture de l'arène reste au tableau de /parcours (audit du 10 novembre 2026). */}
                <p className="text-sm text-slate-300" data-couverture-du-programme="">
                  {programme.couverture.lu ? "" : "Le référentiel de ce diplôme n'a pas encore été confronté à son texte. "}
                  {couvertureDuCoursEnClair(parcours)}
                  {programme.couverture.horsDuChamp > 0
                    ? ` ${programme.couverture.horsDuChamp} ${programme.couverture.horsDuChamp > 1 ? "entrées du référentiel sont" : "entrée du référentiel est"} hors du champ de la gestion.`
                    : ""}{" "}
                  <Link
                    href={`/parcours/${programme.formation.code}`}
                    className="text-amber-300 underline-offset-4 hover:underline"
                  >
                    Le tableau de couverture, entrée par entrée
                  </Link>
                </p>
              </div>

              {/* LE PARCOURS DE FORMATION (le BUT) : il regroupe des chapitres d'autres parcours, sans
                  les dupliquer ; une classe qui le choisit les ouvre tous (config/cours/parcours-de-formation.ts). */}
              {parcoursDeFormation ? (
                <p className="text-sm text-slate-300" data-parcours-de-formation={parcoursDeFormation.code}>
                  Pour une classe : le parcours « {parcoursDeFormation.titre} » regroupe{" "}
                  {chapitresDuParcoursDeFormation(parcoursDeFormation.code).length} chapitres écrits pour d&apos;autres parcours.
                  Choisi pour la classe, il les ouvre tous, avec leurs cas pratiques.
                </p>
              ) : null}

              <div className="grid gap-5">
                <h3 className="text-sm font-semibold uppercase tracking-etiquette text-slate-400">
                  Les chapitres, dans l&apos;ordre d&apos;apprentissage
                </h3>
                {parcours.blocs.length > 0 ? (
                  parcours.blocs.map((b) => (
                    <section
                      key={b.bloc ?? "autres"}
                      data-bloc-du-diplome={b.bloc ?? "autres"}
                      aria-label={b.bloc ?? "Autres chapitres du parcours"}
                      className="grid gap-2"
                    >
                      <h4 className="text-base font-semibold text-slate-100">
                        {b.bloc ?? "Autres chapitres du parcours"}
                        {b.partie ? <span className="ml-2 text-xs font-normal text-slate-400">{b.partie}</span> : null}
                        {b.enCours ? (
                          <span
                            data-en-cours=""
                            className="ml-2 inline-block rounded-full border border-amber-400/40 px-2 py-0.5 align-middle text-xs font-medium text-amber-300"
                          >
                            en cours
                          </span>
                        ) : null}
                      </h4>
                      {b.chapitres.length === 0 ? (
                        <p data-theme-vide="" className="text-sm text-slate-400">
                          Chapitres en préparation.
                        </p>
                      ) : (
                        <>
                          {b.enCours ? (
                            <p className="text-xs text-slate-400">
                              Cette matière n&apos;est pas encore couverte en entier. D&apos;autres chapitres arriveront.
                            </p>
                          ) : null}
                          <ol className="grid gap-3">
                            {b.chapitres.map((l) => (
                              <ChapitreDuParcours key={l.chapitre.code} ligne={l} imposee={imposee?.code} ouvert={ouverts.has(l.chapitre.code)} diplome={programme.formation.code} />
                            ))}
                          </ol>
                        </>
                      )}
                    </section>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Aucun chapitre du cours ne travaille encore ce diplôme.</p>
                )}
              </div>

              <div className="grid gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-etiquette text-slate-400">En classe</h3>
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

              {programme.situations.length > 0 ? (
                <div className="grid gap-2">
                  <h3 className="text-sm font-semibold uppercase tracking-etiquette text-slate-400">Cas de synthèse</h3>
                  <ListeDeSituations situations={programme.situations} imposee={imposee?.code} diplome={programme.formation.code} />
                </div>
              ) : null}

              {programme.episodes.length > 0 ? (
                <div className="grid gap-2">
                  <h3 className="text-sm font-semibold uppercase tracking-etiquette text-slate-400">En situation</h3>
                  <ListeDEpisodes codes={programme.episodes} />
                </div>
              ) : null}
            </section>
          ) : diplome ? (
            <p className="text-sm text-slate-400" role="status">
              Ce diplôme n&apos;est pas au catalogue : choisissez-en un ci-dessus.
            </p>
          ) : null}

          {/* LE CHAPITRE LIBRE, EN BANDEAU : pour essayer, celui du diplôme choisi ou l'essai par défaut. Le choix de
              l'entreprise, parmi celles où il se joue, se replie. */}
          <section aria-labelledby="pilote" className="carte grid gap-4 p-5 sm:p-6">
            <div className="grid gap-1">
              <p className="text-sm font-semibold uppercase tracking-etiquette text-amber-300">
                Pour essayer · {essai ? `chapitre libre en ${essai.diplome.sigle}` : "chapitre libre d'accès"} · {dureeEnClair(dureeDuChapitre(pilote))}
              </p>
              <h2 id="pilote" className="text-2xl font-bold text-slate-50">
                {pilote.titre}
              </h2>
              <p className="max-w-3xl text-base leading-relaxed text-slate-300">{pilote.accroche}</p>
            </div>
            <p className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <Link href={`/cours/${pilote.code}?entreprise=${premiere.code}${duDiplome}`} className={bouton({ taille: "m" })}>
                Commencer avec {premiere.nom}
              </Link>
              {/* Projeter s'adresse à l'enseignant : l'élève d'une classe ne le voit pas. */}
              {classe ? null : (
                <Link
                  href={`/cours/${pilote.code}?entreprise=${premiere.code}&classe${duDiplome}`}
                  className={bouton({ variante: "secondaire", taille: "m" })}
                >
                  Projeter en classe
                </Link>
              )}
            </p>
            {/* Un chapitre qui ne se joue que dans une entreprise n'a pas de choix à replier. */}
            {entreprisesDuPilote.length > 1 ? (
              <details className="group">
                <summary className="cursor-pointer list-none text-sm font-semibold text-slate-200 [&::-webkit-details-marker]:hidden">
                  <span aria-hidden className="mr-2 inline-block text-amber-400 transition-transform group-open:rotate-90">
                    ▸
                  </span>
                  Choisir une autre entreprise du cas ({entreprisesDuPilote.length})
                </summary>
                <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                  {entreprisesDuPilote.map((e) => (
                    <li key={e.code}>
                      <Link
                        href={`/cours/${pilote.code}?entreprise=${e.code}${duDiplome}`}
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
            ) : null}
          </section>

          {/* L'articulation des offres s'adresse aux enseignants : pas à l'élève d'une classe. */}
          {classe ? null : <ArticulationDuCours />}
          {/* `/cours#theme-vente`, depuis la fin d'un chapitre ou le bilan d'un épisode : le tiroir s'ouvre. */}
          <OuvreLeTiroirVise />

          {/* LE CATALOGUE PAR THÈME, l'entrée secondaire (« Parcourir par thème ») : sur la page
              sans diplôme ni recherche, là où les liens `/cours#theme-…` l'attendent. */}
          {vueParDefaut ? (
          <section aria-labelledby="catalogue" className="grid gap-6">
            <div className="grid gap-2">
              <h2 id="catalogue" className="scroll-mt-24 text-2xl font-bold text-slate-50">
                Le catalogue par thème
              </h2>
              <p className="max-w-3xl text-base text-slate-300">
                {CHAPITRES_PROPOSES.length} chapitres en {THEMES.length} thèmes, du bac STMG au DSCG, et, dans l&apos;enseignement supérieur, des
                épisodes à jouer en situation. Chaque chapitre dit son palier, sa durée indicative et son accès : chaque diplôme a son chapitre
                libre, avec son cas pratique, et la suite est réservée aux établissements sous licence.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {THEMES.map((theme) => {
                // Les chapitres retirés (config/formations-proposees.ts) ne se proposent plus.
                const chapitres = theme.chapitres.map((code) => CHAPITRES.find((c) => c.code === code)!).filter(chapitrePropose);
                const episodes = episodesDuTheme(theme);
                const aVenir = enPreparationDuTheme(theme);
                const situations = casDeSyntheseDuTheme(theme);
                // Les cas pratiques du thème : le cas dédié de chaque chapitre, et les cas de synthèse.
                const cas = chapitres.filter((c) => casDuChapitre(c.code)).length + situations.length;
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
                        {cas > 0 ? ` · ${cas} cas pratique${cas > 1 ? "s" : ""}` : ""}
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
                            Cas de synthèse
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
          ) : null}
        </div>
      </main>
      <PiedDePage />
    </>
  );
}

/**
 * CE QUI EST OUVERT À CE VISITEUR, parmi les chapitres montrés : la règle d'accès du cours
 * (services/cours.service.ts, `coursOuvert`), lue une fois par ensemble de parcours qui
 * ouvrent un chapitre, et non une fois par chapitre. Un visiteur sans compte ni classe n'a
 * que les chapitres libres : rien ne se lit en base.
 */
async function chapitresOuverts(
  qui: { enseignant: string | null; eleve: string | null },
  chapitres: readonly Chapitre[],
): Promise<Set<string>> {
  const ouverts = new Set(chapitres.filter((c) => c.libre).map((c) => c.code));
  if (!qui.enseignant && !qui.eleve) return ouverts;
  // L'offre et les attributions se lisent une fois par parcours ; la libération de la classe
  // (un élève dont l'enseignant libère chapitre par chapitre) se lit une fois, puis s'applique
  // chapitre par chapitre (services/chapitres-de-la-classe.ts, `libereALaClasse`).
  const lu = new Map<string, Promise<boolean>>();
  const unePar = (cle: string, lire: () => Promise<boolean>) => {
    if (!lu.has(cle)) lu.set(cle, lire());
    return lu.get(cle)!;
  };
  const liberation = qui.eleve ? await liberationDeLEleve(qui.eleve) : null;
  await Promise.all(
    chapitres
      .filter((c) => !c.libre)
      .map(async (c) => {
        const cle = parcoursQuiOuvrent(c).join(",");
        // L'enseignant n'est pas tenu par la libération de ses classes.
        if (qui.enseignant && (await unePar(`e:${cle}`, () => coursOuvert({ enseignant: qui.enseignant }, c)))) return void ouverts.add(c.code);
        if (!qui.eleve || !(await unePar(`l:${cle}`, () => coursOuvert({ eleve: qui.eleve }, c, { sansLiberation: true })))) return;
        if (!liberation || libereALaClasse(liberation.mode, liberation.liberes, c)) ouverts.add(c.code);
      }),
  );
  return ouverts;
}

/** Le cadenas d'un chapitre réservé à ce visiteur, ou la mention d'un chapitre libre. */
function Acces({ chapitre, ouvert }: { chapitre: Chapitre; ouvert?: boolean }) {
  if (chapitre.libre) return <span className="font-semibold text-amber-300">libre</span>;
  if (ouvert === undefined) return <>licence</>;
  return ouvert ? (
    <span data-ouvert="">ouvert</span>
  ) : (
    <span data-cadenas="" title="Réservé aux établissements sous licence">
      <Icone nom="verrou" /> réservé
    </span>
  );
}

/**
 * UN CHAPITRE DU PARCOURS D'UN DIPLÔME : son rang dans l'ordre d'apprentissage, son titre,
 * son palier et son public, sa durée et son accès ; ses prérequis en une ligne, et ses
 * objectifs repliés.
 */
function ChapitreDuParcours({ ligne, imposee, ouvert, diplome }: { ligne: ChapitreDuDiplome; imposee?: string; ouvert: boolean; diplome?: string }) {
  const c = ligne.chapitre;
  return (
    <li data-chapitre={c.code} data-rang={ligne.rang} data-approfondissement={ligne.approfondissement ? "" : undefined} className="grid gap-x-3 gap-y-1 sm:grid-cols-[2rem_1fr_auto] sm:items-baseline">
      <span className="text-sm font-semibold tabular-nums text-slate-400">{ligne.rang}.</span>
      <span className="grid min-w-0 gap-0.5">
        <Link
          href={lienDuChapitre(c, imposee, diplome)}
          className="font-medium text-slate-100 underline-offset-4 hover:text-amber-300 hover:underline"
        >
          {c.titre}
        </Link>
        <span className="text-xs text-slate-400">
          Palier {c.palier} · {publicDuChapitre(c)}
          {/* Un chapitre de niveau supérieur gardé pour ce diplôme (config/cours/pour-aller-plus-loin.ts). */}
          {ligne.approfondissement ? (
            <span
              data-pour-aller-plus-loin=""
              className="ml-2 inline-block rounded-full border border-sky-400/40 px-2 py-0.5 align-middle font-medium text-sky-300"
            >
              {LIBELLE_POUR_ALLER_PLUS_LOIN}
            </span>
          ) : null}
        </span>
        {ligne.prerequis.length > 0 ? (
          <span className="text-xs text-slate-400" data-prerequis="">
            Prérequis : {ligne.prerequis.map((p) => p.titre).join(", ")}
          </span>
        ) : null}
        <CasDuChapitre chapitre={c.code} imposee={imposee} diplome={diplome} />
        <details className="group text-xs" data-objectifs="">
          <summary className="cursor-pointer list-none text-slate-300 [&::-webkit-details-marker]:hidden">
            <span aria-hidden className="mr-1 inline-block transition-transform group-open:rotate-90">
              ▸
            </span>
            Objectifs ({c.objectifs.length})
          </summary>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-300">
            {c.objectifs.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </details>
      </span>
      <span className="whitespace-nowrap text-xs tabular-nums text-slate-400">
        {dureeEnClair(ligne.duree)}
        {" · "}
        <Acces chapitre={c} ouvert={ouvert} />
      </span>
    </li>
  );
}

/** Le public d'un chapitre : celui de son parcours à ce palier, sinon celui du palier. */
function publicDuChapitre(c: Chapitre): string {
  const parcours = PARCOURS.find((p) => p.code === c.parcours);
  return parcours?.publics?.[c.palier] ?? PALIERS.find((p) => p.palier === c.palier)!.public;
}

/**
 * Le lien d'un chapitre : dans l'entreprise imposée à la classe, ou la première où il se joue. Depuis
 * la vue d'un diplôme, il porte ce diplôme (`&diplome=`) : la page du chapitre n'annonce que ses
 * compétences (config/cours/competences-affichees.ts).
 */
function lienDuChapitre(c: Chapitre, imposee?: string, diplome?: string): string {
  const voulue = imposee ?? ENTREPRISES[0]!.code;
  const entreprise = c.entreprises && !c.entreprises.codes.includes(voulue) ? c.entreprises.codes[0] : voulue;
  return `/cours/${c.code}?entreprise=${entreprise}${diplome ? `&diplome=${diplome}` : ""}`;
}

/**
 * LES CHAPITRES D'UNE LISTE, UNE LIGNE CHACUN : le palier et son public, le titre,
 * la durée, l'accès. « Sous licence » ne se répète plus sur chaque lien : un
 * cadenas le dit, et un chapitre libre se signale.
 */
function ListeDeChapitres({
  chapitres,
  imposee,
  ouverts,
  diplome,
}: {
  chapitres: readonly Chapitre[];
  imposee?: string;
  /** Ce qui est ouvert à ce visiteur ; absent (le catalogue entier), l'accès se dit « licence ». */
  ouverts?: ReadonlySet<string>;
  /** Le diplôme choisi, que les liens portent. */
  diplome?: string;
}) {
  return (
    <ol className="grid gap-2.5">
      {chapitres.map((c) => (
        <li key={c.code} data-chapitre={c.code} className="grid gap-x-3 sm:grid-cols-[4.5rem_1fr_auto] sm:items-baseline">
          <span className="text-xs tabular-nums text-slate-400">Palier {c.palier}</span>
          <span className="grid min-w-0">
            <Link
              href={lienDuChapitre(c, imposee, diplome)}
              className="font-medium text-slate-100 underline-offset-4 hover:text-amber-300 hover:underline"
            >
              {c.titre}
            </Link>
            <span className="text-xs text-slate-400">{publicDuChapitre(c)}</span>
            <CasDuChapitre chapitre={c.code} imposee={imposee} diplome={diplome} />
          </span>
          <span className="whitespace-nowrap text-xs tabular-nums text-slate-400">
            {dureeEnClair(dureeDuChapitre(c))}
            {" · "}
            <Acces chapitre={c} ouvert={ouverts ? ouverts.has(c.code) : undefined} />
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * LE CAS PRATIQUE DU CHAPITRE, sous son titre : la même notion, sans guide, sur
 * une question neuve. Chaque chapitre a le sien (garde du catalogue).
 */
function CasDuChapitre({ chapitre, imposee, diplome }: { chapitre: string; imposee?: string; diplome?: string }) {
  const cas = casDuChapitre(chapitre);
  if (!cas) return null;
  return (
    <>
      <Link
        href={lienDuChapitre(cas, imposee, diplome)}
        data-cas-du-chapitre={cas.code}
        className="text-xs text-amber-300/90 underline-offset-4 hover:text-amber-300 hover:underline"
      >
        Cas pratique : {cas.titre}
      </Link>
      {/* Les bureaux du chapitre (config/cours/bureaux) : des cas pratiques d'un genre nouveau, la pile d'un mois. */}
      {bureauxDuChapitre(chapitre).map((b) => (
        <Link
          key={b.code}
          href={lienDuBureau(b)}
          data-bureau-du-chapitre={b.code}
          className="text-xs text-amber-300/90 underline-offset-4 hover:text-amber-300 hover:underline"
        >
          Cas pratique : {b.titre}
        </Link>
      ))}
      {/* Les enquêtes du chapitre (config/cours/enquetes) : un dossier qui cache des erreurs, à trouver et à rectifier. */}
      {enquetesDuChapitre(chapitre).map((e) => (
        <Link
          key={e.code}
          href={lienDeLEnquete(e)}
          data-enquete-du-chapitre={e.code}
          className="text-xs text-amber-300/90 underline-offset-4 hover:text-amber-300 hover:underline"
        >
          Cas pratique : {e.titre}
        </Link>
      ))}
      {/* Les scénarios du chapitre (config/cours/scenarios) : des décisions à la suite, une activité à part. */}
      {scenariosDuChapitre(chapitre).map((x) => (
        <Link
          key={x.code}
          href={lienDuScenario(x)}
          data-scenario-du-chapitre={x.code}
          className="text-xs text-amber-300/90 underline-offset-4 hover:text-amber-300 hover:underline"
        >
          {x.titre}
        </Link>
      ))}
    </>
  );
}

/**
 * LES CAS DE SYNTHÈSE : la question d'un commanditaire, sans cours, sur les
 * calculs de chapitres déjà vus. La ligne dit lesquels, pour que l'enseignant la
 * place après eux.
 */
function ListeDeSituations({ situations, imposee, diplome }: { situations: readonly Situation[]; imposee?: string; diplome?: string }) {
  return (
    <ul className="grid gap-2.5">
      {situations.map((s) => (
        <li key={s.code} data-situation-de-cours={s.code} className="grid gap-x-3 sm:grid-cols-[4.5rem_1fr_auto] sm:items-baseline">
          <span className="text-xs tabular-nums text-slate-400">Palier {s.palier}</span>
          <span className="grid min-w-0">
            <Link
              href={lienDuChapitre(s, imposee, diplome)}
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
  return PARCOURS_PROPOSES.filter((p) => p.enPreparation).flatMap((p) => {
    const ecrits = CHAPITRES.filter((c) => c.parcours === p.code);
    if (ecrits.length === 0 || themeDuChapitre(ecrits[0]!.code)?.code !== theme.code) return [];
    const prevus = Object.values(PROGRAMME[p.code]).reduce((n, titres) => n + (titres?.length ?? 0), 0);
    const nombre = prevus - ecrits.length;
    return nombre > 0 ? [{ parcours: p.code, titre: p.titre, nombre }] : [];
  });
}

export default avecTypographie(CoursPage);

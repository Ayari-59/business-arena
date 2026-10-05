import type { Metadata } from "next";
import { Signe } from "@/components/signe";
import Link from "next/link";
import {
  SCENARIO_CHOICES,
  SECTOR_LABELS,
  familyOf,
  type ScenarioDefinition,
} from "@/config/scenarios/registry";
import {
  accentsDe,
  nomEntreprise as nomSeul,
  promesseEntreprise as promesse,
} from "@/config/scenarios/presentation";
import { CONCEPTS } from "@/config/pedagogy/concepts";
import { LEVIERS } from "@/config/decisions";
import { PictoSecteur } from "@/components/picto-secteur";
import { RepliableSurTelephone } from "@/components/repliable-sur-telephone";
import { bouton } from "@/components/bouton";
import { BandeFinale } from "@/components/bande-finale";
import { HaloDePage } from "@/components/halo-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { Bande } from "@/components/bande";
import { contrasteDeLaBande } from "@/config/theme-du-site";
import { getPlatformConfig } from "@/services/admin.service";

export const metadata: Metadata = {
  alternates: { canonical: "/entreprises" },
  title: `${SCENARIO_CHOICES.length} entreprises jouables`,
  description: `Un atelier, un hôtel, un bistrot, un chantier, une flotte de camions. ${SCENARIO_CHOICES.length} métiers, ${SCENARIO_CHOICES.length} contraintes, ${SCENARIO_CHOICES.length} façons de perdre de l'argent.`,
};

/**
 * LES ENTREPRISES.
 *
 * Le sélecteur de la page d'accueil réduisait autant d'économies à autant de
 * lignes d'une liste déroulante. Or ce qui distingue ces entreprises n'est pas leur
 * décor : c'est la contrainte qui décide de tout dans chaque métier. Une
 * chambre vide ce soir est perdue pour toujours ; une enceinte invendue attend
 * en réserve, mais elle a coûté sa trésorerie. Cette page montre cet écart,
 * métier par métier, et le fait tenir dans un tableau à la fin.
 *
 * Tout y est LU du registre : titres, contraintes, arbitrages, indicateurs.
 * Rien n'est recopié, donc rien ne peut mentir quand un scénario change.
 */

const NOM_DE_NOTION = new Map(CONCEPTS.map((c) => [c.code, c.name]));

/** Combien de notions une fiche montre avant de dire « et N autres ». */
const NOTIONS_MONTREES = 6;

/**
 * LES NOTIONS QU'UNE ENTREPRISE FAIT TRAVAILLER, LES PLUS MOBILISÉES D'ABORD.
 *
 * Elles ne sont écrites nulle part : chaque situation déclare les siennes, et
 * une entreprise en mobilise de quinze à trente et une selon le métier. Les
 * afficher toutes ferait un mur de trente et une pastilles où l'œil ne prend
 * rien ; n'en afficher aucune, ce qui était le cas, laisse un enseignant
 * deviner ce que la fiche fait travailler. On montre donc les plus
 * fréquentes, et on dit combien il y en a.
 *
 * L'ordre se décide sur le nombre de situations qui mobilisent la notion,
 * puis sur son code : deux notions à égalité sortent toujours dans le même
 * ordre, d'une compilation à l'autre.
 */
function notionsDe(d: ScenarioDefinition) {
  const compte = new Map<string, number>();
  for (const s of d.situations) {
    for (const code of s.conceptCodes ?? []) compte.set(code, (compte.get(code) ?? 0) + 1);
  }
  const triees = [...compte.entries()]
    .filter(([code]) => NOM_DE_NOTION.has(code))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return {
    total: triees.length,
    tetes: triees.slice(0, NOTIONS_MONTREES).map(([code]) => ({
      code,
      nom: NOM_DE_NOTION.get(code)!,
    })),
  };
}

/**
 * Les arbitrages qu'une entreprise demande, dans l'ordre du registre des
 * leviers — le prix et le volume d'abord, les budgets ensuite. Trier sur le
 * registre plutôt que sur l'ordre des situations donne la même liste pour
 * tous les métiers, ce qui rend les fiches comparables entre elles.
 */
function arbitragesDe(d: ScenarioDefinition) {
  const champs = new Set<string>();
  for (const s of d.situations) {
    for (const levier of s.decisionLevers ?? []) champs.add(levier.field);
  }
  return LEVIERS.filter((l) => champs.has(l.champ)).map((l) => l.nom);
}

/**
 * CE QU'UN ENSEIGNANT VIENT CHERCHER SUR CETTE PAGE.
 *
 * La fiche disait le métier, sa contrainte et son premier arbitrage — ce qui
 * répond à « de quoi ça parle » mais pas à « qu'est-ce que ma classe y
 * travaille ». Les trois réponses existaient dans le registre sans qu'aucune
 * soit affichée : les notions déclarées par les situations, les leviers
 * qu'elles font manœuvrer, et les indicateurs propres au métier dont un seul,
 * le premier, paraissait dans le tableau de fin de page.
 *
 * TOUT EST LU, RIEN N'EST RECOPIÉ. Une situation ajoutée à un scénario change
 * ces trois lignes sans que personne y touche, et une notion renommée l'est
 * partout à la fois.
 */
function CeQuOnYTravaille({ d }: { d: ScenarioDefinition }) {
  const notions = notionsDe(d);
  const arbitrages = arbitragesDe(d);
  return (
    <dl className="mt-4 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-[8.5rem_1fr] sm:gap-x-6 sm:gap-y-3">
      <dt className="text-xs uppercase tracking-[0.18em] text-slate-400">Notions</dt>
      <dd className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1.5 text-sm text-slate-300">
        {notions.tetes.map((n, i) => (
          <span key={n.code}>
            {/* Chaque notion a sa fiche : le lien y mène directement plutôt
                que de laisser chercher dans une page de cinquante-deux. */}
            <Link
              href={`/notions#${n.code}`}
              className="underline decoration-white/20 underline-offset-4 transition-colors hover:text-amber-200 hover:decoration-amber-400/60"
            >
              {n.nom}
            </Link>
            {i < notions.tetes.length - 1 ? <span aria-hidden> ·</span> : null}
          </span>
        ))}
        {notions.total > notions.tetes.length ? (
          <span className="text-slate-400">et {notions.total - notions.tetes.length} autres</span>
        ) : null}
      </dd>

      <dt className="text-xs uppercase tracking-[0.18em] text-slate-400">Arbitrages</dt>
      <dd className="m-0 text-sm text-slate-300">{arbitrages.join(" · ")}</dd>

      <dt className="text-xs uppercase tracking-[0.18em] text-slate-400">Indicateurs</dt>
      <dd className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1.5 text-sm text-slate-300">
        {d.kpis.map((k, i) => (
          // Ce que mesure l'indicateur reste accessible : l'infobulle pour la
          // souris, le texte caché pour une synthèse vocale.
          <span key={k.key} title={k.hint}>
            {k.label}
            <span className="sr-only"> : {k.hint}</span>
            {i < d.kpis.length - 1 ? <span aria-hidden> ·</span> : null}
          </span>
        ))}
      </dd>
    </dl>
  );
}

function Fiche({ d }: { d: ScenarioDefinition }) {
  const famille = familyOf(d.code);
  const a = accentsDe(d);
  return (
    <article
      id={d.code}
      className={`group relative scroll-mt-24 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 transition ${a.bord}`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full blur-3xl transition-opacity duration-500 ${a.halo} opacity-60 group-hover:opacity-100`}
      />
      <div className={`h-1 w-full ${a.barre}`} />
      <div className="relative p-6">
        <div className="flex flex-wrap items-center gap-3">
          {/*
            LE PICTOGRAMME PLUTÔT QUE L'EMOJI. Chaque fiche portait le sien,
            que le système dessine à sa façon : différent d'un appareil à
            l'autre, en couleurs étrangères à la maison, et brouillé au
            vidéoprojecteur. `PictoSecteur` est dessiné d'un seul trait et prend
            l'encre du thème — c'est déjà lui qui tient la bande des métiers sur
            la page d'accueil.
          */}
          <PictoSecteur secteur={d.sector} className={`h-6 w-6 ${a.texte}`} />
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${a.puce}`}
          >
            {SECTOR_LABELS[d.sector]}
          </span>
          <span className="text-xs uppercase tracking-wider text-slate-400">
            {d.situations.length} situations · {d.bots.length} concurrents
          </span>
        </div>

        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-50">{nomSeul(d)}</h2>
        <p className={`text-sm font-medium ${a.texte}`}>{promesse(d) ?? d.tagline}</p>
        <p className="mt-3 text-base leading-relaxed text-slate-400">{d.briefing}</p>
        {/*
          SUR TÉLÉPHONE, LA FICHE EST UNE CARTE : le métier, sa promesse, ses
          indicateurs, le nombre de situations, et le bouton pour jouer. Le
          reste — le contexte d'arrivée, le premier arbitrage, ce que la classe
          y travaille — s'ouvre à la demande. Toutes les fiches dépliées faisaient
          seize mille pixels de défilement. Au-delà de `sm`, la fiche est celle
          d'avant : tout est ouvert, rien ne se replie (voir RepliableSurTelephone).
        */}
        <ul aria-label="Indicateurs suivis" className="mt-3 flex flex-wrap gap-1.5 sm:hidden">
          {d.kpis.slice(0, 3).map((k) => (
            <li
              key={k.key}
              className="rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-300"
            >
              {k.label}
            </li>
          ))}
        </ul>

        <div className="flex flex-col">
          <RepliableSurTelephone
            resume="Voir le détail de l'entreprise"
            className="order-2 sm:order-none"
            resumeClassName="mt-1"
          >
            {famille ? (
              // Le même métier en un produit ou en gamme : c'est le niveau de
              // difficulté qui décide, et la fiche le dit avant qu'on ne choisisse.
              <p className="mt-3 rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2 text-base leading-relaxed text-slate-300">
                Jusqu&apos;au niveau {famille.gammeFromLevel - 1}, {famille.monoLabel} ; à partir du
                niveau {famille.gammeFromLevel}, {famille.gammeLabel}.
              </p>
            ) : null}

            {/*
              LA CARTE D'IDENTITÉ DU MÉTIER A QUITTÉ LA FICHE. Elle disait, en
              quatre cases — ce qu'on vend, ce qu'on fixe, ce que devient
              l'invendu, où est le goulot —, exactement ce que le tableau dit
              maintenant EN TÊTE de page, et mieux : côte à côte. Quatre cases
              isolées ne se comparent à rien ; une ligne de tableau se compare aux
              huit autres, et c'est bien la comparaison qui est le sujet.

              Une carte d'identité par fiche, à cent dix pixels pièce : un mètre de
              défilement rendu au lecteur.
            */}
            <p className="mt-5 text-base leading-relaxed text-slate-300">
              <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                En arrivant ·{" "}
              </span>
              {d.context}
            </p>

            <div className="mt-4 rounded-xl border border-white/10 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Le premier arbitrage
              </p>
              <p className="mt-2 text-sm font-medium text-slate-100">{d.dilemma.question}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {d.dilemma.routes.map((r) => (
                  <div
                    key={r.label}
                    className="rounded-lg border border-white/5 bg-slate-900/70 p-3"
                  >
                    <p className={`text-xs font-semibold ${a.texte}`}>{r.label}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-emerald-300/80">
                      <Signe sens="gain" /> {r.gain}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-rose-300/80">
                      <Signe sens="cout" /> {r.risque}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <CeQuOnYTravaille d={d} />
          </RepliableSurTelephone>

          <div className="order-1 mt-5 flex flex-wrap items-center gap-4 sm:order-none">
            <Link
              href={`/jouer?secteur=${d.code}`}
              className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white pointer-coarse:min-h-11 pointer-coarse:py-3"
            >
              Diriger {nomSeul(d)}
            </Link>
            <span className="text-xs text-slate-400">
              Vous jouez {d.playerTeamName}, face à {d.bots.length} concurrents
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default async function EntreprisesPage() {
  // Quelles bandes sont à contre-jour : le réglage de l'admin, ou l'état d'origine.
  const { theme } = await getPlatformConfig();
  const c = (id: string) => contrasteDeLaBande(theme, id);
  return (
    <>
      <main id="main" className="relative overflow-hidden">
        <HaloDePage />

        <Bande
          id="entreprises.accroche"
          contraste={c("entreprises.accroche")}
          interieur="mx-auto max-w-6xl px-6 py-14"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">
            {SCENARIO_CHOICES.length} métiers · {SCENARIO_CHOICES.length} contraintes
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl">
            Toutes les entreprises gagnent de l&apos;argent de la même façon.
            <br />
            <span className="text-amber-400">Aucune ne le perd pareil.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
            Une chambre vide ce soir est perdue pour toujours. Une enceinte invendue attend en
            réserve, mais elle a déjà coûté sa trésorerie. Une journée de conseil facturée à
            quatre-vingt-dix jours est un bénéfice qu&apos;on ne peut pas dépenser. Le compte de
            résultat est le même partout ; ce qui change, c&apos;est ce qui vous tue.
          </p>
          {/*
            LE MÊME PICTOGRAMME QUE LES FICHES. Cette rangée a gardé ses emblèmes
            en emoji quand les fiches sont passées au pictogramme, et le défaut
            se voyait deux fois : un emoji système au-dessus d'un dessin de la
            maison, et deux représentations du même métier sur un seul écran.
          */}
          <div className="mt-8 flex flex-wrap gap-2">
            {SCENARIO_CHOICES.map((d) => (
              <a
                key={d.code}
                href={`#${d.code}`}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition hover:brightness-125 ${accentsDe(d).puce}`}
              >
                <PictoSecteur secteur={d.sector} className="h-3.5 w-3.5" />
                {nomSeul(d)}
              </a>
            ))}
          </div>
          {/*
            LA DÉMONSTRATION POUR LES ENTREPRISES. Une phrase grise sous les
            pastilles passait inaperçue : c'est un autre public, il lui faut un
            bloc à lui et un bouton, dans le premier écran.
          */}
          <div className="mt-8 flex max-w-3xl flex-col gap-4 rounded-lg border border-amber-400/30 bg-amber-400/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">
                Nouveau · Pour les entreprises
              </p>
              <p className="mt-1.5 text-base leading-relaxed text-slate-200">
                Quarante épisodes dans la peau d&apos;un manager : une agence qui dérape, une équipe
                qui s&apos;épuise, une commande à prix cassé, un investissement à choisir, une crise
                à traverser… Jugé sur ses décisions plutôt que sur son résultat.
              </p>
            </div>
            <Link
              href="/entreprises/episode"
              className={`${bouton({ variante: "laiton", taille: "l" })} shrink-0`}
            >
              Jouer la démonstration
            </Link>
          </div>
        </Bande>

        {/*
          LE TABLEAU QUI MET TOUS LES MÉTIERS CÔTE À CÔTE — EN TÊTE, PLUS EN
          QUEUE.

          Il fermait la page, après sept mille pixels de fiches : un lecteur
          arrivé à la troisième entreprise n'avait aucun moyen de la situer, et
          celui qui atteignait le tableau n'avait plus rien à comparer, il avait
          déjà choisi. Une vue d'ensemble se lit AVANT le détail — c'est même
          tout ce qui la distingue d'un récapitulatif.

          Ce déplacement rend une place à la coupure de la page : le tableau
          prend le sol ici, à six cents pixels du haut, quand il l'aurait pris à
          six cents pixels de la bande finale s'il était resté en bas. Deux fonds
          retournés qui se rencontrent ne font pas deux blocs qui se voient, ils
          en font deux qui s'annulent.
        */}
        <Bande
          id="entreprises.differences"
          contraste={c("entreprises.differences")}
          interieur="mx-auto max-w-6xl px-6 py-14"
        >
          <h2 className="text-2xl font-bold text-slate-50">
            Ce qui change d&apos;un métier à l&apos;autre
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400">
            Même moteur, mêmes états financiers, mêmes six tours. Ce sont les quatre colonnes
            ci-dessous qui font qu&apos;une décision juste dans un métier est une faute dans un
            autre.
          </p>
          <RepliableSurTelephone resume="Afficher le tableau comparatif" className="mt-6">
            <div className="mt-3 overflow-x-auto sm:mt-0">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 pr-4 font-medium">Entreprise</th>
                    <th className="pb-2 pr-4 font-medium">Ce qu&apos;elle vend</th>
                    <th className="pb-2 pr-4 font-medium">L&apos;invendu devient</th>
                    <th className="pb-2 pr-4 font-medium">Sa contrainte physique</th>
                    <th className="pb-2 font-medium">Son indicateur roi</th>
                  </tr>
                </thead>
                <tbody>
                  {SCENARIO_CHOICES.map((d) => (
                    <tr key={d.code} className="border-t border-white/5">
                      <td className="py-2.5 pr-4">
                        <a
                          href={`#${d.code}`}
                          className={`font-medium ${accentsDe(d).texte} underline-offset-4 hover:underline`}
                        >
                          {nomSeul(d)}
                        </a>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-300">{d.vocabulary.units}</td>
                      <td className="py-2.5 pr-4 text-slate-400">
                        {d.scenario.perishable ? (
                          <span className="text-rose-300/90">
                            {d.vocabulary.leftoverLabel.toLowerCase()} · rien ne se stocke
                          </span>
                        ) : (
                          <span>du {d.vocabulary.leftoverLabel.toLowerCase()}, déjà payé</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-400">{d.vocabulary.capacityLabel}</td>
                      <td className="py-2.5 text-slate-400">{d.kpis[0]?.label ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </RepliableSurTelephone>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            Les activités périssables ne stockent rien : la capacité non vendue est perdue au
            passage du tour. C&apos;est la différence qui sépare un hôtelier d&apos;un industriel,
            et elle change tout le raisonnement sur le prix. Chaque nom mène à sa fiche, plus bas.
          </p>
        </Bande>

        <Bande
          id="entreprises.fiches"
          contraste={c("entreprises.fiches")}
          interieur="mx-auto max-w-6xl px-6 pb-16"
        >
          <div className="grid gap-6">
            {SCENARIO_CHOICES.map((d) => (
              <Fiche key={d.code} d={d} />
            ))}
          </div>
        </Bande>

        <BandeFinale
          id="entreprises.finale"
          contraste={c("entreprises.finale")}
          titre="Choisissez votre métier"
          texte="Six tours, des concurrents qui ne vous feront aucun cadeau, et une situation à traiter à chaque tour. Sans compte, sans installation."
        >
          <Link href="/jouer" className={bouton({ taille: "l" })}>
            Tester le simulateur
          </Link>
          <Link
            href="/teacher/login"
            className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/50"
          >
            Créer une partie pour ma classe
          </Link>
        </BandeFinale>
      </main>
      <PiedDePage />
    </>
  );
}

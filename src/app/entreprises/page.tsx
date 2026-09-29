import type { Metadata } from "next";
import { Signe } from "@/components/signe";
import Link from "next/link";
import { SCENARIO_CHOICES, SECTOR_LABELS, familyOf, type ScenarioDefinition } from "@/config/scenarios/registry";
import {
  accentsDe,
  emblemeDe,
  nomEntreprise as nomSeul,
  promesseEntreprise as promesse,
} from "@/config/scenarios/presentation";
import { PictoSecteur } from "@/components/picto-secteur";
import { bouton } from "@/components/bouton";
import { BandeFinale } from "@/components/bande-finale";
import { HaloDePage } from "@/components/halo-de-page";

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
        {famille ? (
          // Le même métier en un produit ou en gamme : c'est le niveau de
          // difficulté qui décide, et la fiche le dit avant qu'on ne choisisse.
          <p className="mt-3 rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2 text-base leading-relaxed text-slate-300">
            Jusqu&apos;au niveau {famille.gammeFromLevel - 1}, {famille.monoLabel} ; à partir du niveau{" "}
            {famille.gammeFromLevel}, {famille.gammeLabel}.
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
              <div key={r.label} className="rounded-lg border border-white/5 bg-slate-900/70 p-3">
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

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link
            href={`/jouer?secteur=${d.code}`}
            className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white"
          >
            Diriger {nomSeul(d)}
          </Link>
          <span className="text-xs text-slate-400">
            Vous jouez {d.playerTeamName}, face à {d.bots.length} concurrents
          </span>
        </div>
      </div>
    </article>
  );
}

export default function EntreprisesPage() {
  return (
    <main id="main" className="relative overflow-hidden">
      <HaloDePage />

      <section className="mx-auto max-w-6xl px-6 py-14">
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
        <div className="mt-8 flex flex-wrap gap-2">
          {SCENARIO_CHOICES.map((d) => (
            <a
              key={d.code}
              href={`#${d.code}`}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition hover:brightness-125 ${accentsDe(d).puce}`}
            >
              {emblemeDe(d)} {nomSeul(d)}
            </a>
          ))}
        </div>
      </section>

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
      <section className="contre-jour bg-slate-950">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-bold text-slate-50">Ce qui change d&apos;un métier à l&apos;autre</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400">
            Même moteur, mêmes états financiers, mêmes six tours. Ce sont les quatre colonnes
            ci-dessous qui font qu&apos;une décision juste dans un métier est une faute dans un
            autre.
          </p>
          <div className="mt-6 overflow-x-auto">
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
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            Les activités périssables ne stockent rien : la capacité non vendue est perdue au
            passage du tour. C&apos;est la différence qui sépare un hôtelier d&apos;un
            industriel, et elle change tout le raisonnement sur le prix. Chaque nom mène à sa
            fiche, plus bas.
          </p>
        </div>
      </section>


      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-6">
          {SCENARIO_CHOICES.map((d) => (
            <Fiche key={d.code} d={d} />
          ))}
        </div>
      </section>

      <BandeFinale
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
  );
}

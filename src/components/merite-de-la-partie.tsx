import Link from "next/link";
import { bouton } from "@/components/bouton";
import { formatEuro, ordinal } from "@/lib/format";
import { presetByLevel } from "@/config/difficulty";
import { SCENARIO_CHOICES } from "@/config/scenarios/registry";
import { messageNiveauxReserves } from "@/config/tarifs";
import { LIEN_TARIFS, niveauReserve } from "@/config/vitrine-solo";
import { getSession } from "@/lib/session";
import { unCompteSousLicence } from "@/services/acces.service";
import { getPlatformConfig } from "@/services/admin.service";
import { meriteDeLaPartie } from "@/services/merite.service";
import { CAS_DU_MERITE, type CasDuMerite, type VerdictDuMerite } from "@/pedagogy/merite/verdict";
import { PHRASE_DE_LA_REFERENCE, deLaReference } from "@/pedagogy/merite/reference";

/**
 * MÉRITE OU CHANCE : LE BILAN EN TROIS BLOCS (comme les épisodes manager).
 *
 *   1. « Vos décisions tenaient-elles ? » : le verdict de la matrice en une
 *      phrase, la place du marché joué, la fourchette des places sur les
 *      marchés possibles, la distribution des résultats (vos décisions et la
 *      décisions d'un bon gestionnaire, sous les mêmes marchés, votre partie
 *      marquée) ;
 *   2. « Ce que la partie montre » : des constats de tour, tirés des mêmes
 *      rejeux ;
 *   3. « Et ensuite » : le niveau conseillé et l'entreprise suivante, avec le
 *      lien qui ouvre /jouer réglé dessus ; un niveau fermé sans licence est
 *      montré, pas lançable, avec la phrase habituelle et les tarifs.
 *
 * Le calcul (une soixantaine de parties rejouées) ne se fait pas dans le rendu :
 * la page de la partie pose ce bloc derrière une frontière `Suspense`, et il
 * arrive quand il est prêt (`MeriteEnAttente` tient sa place). Rien de tout cela
 * ne s'affiche avant la fin de la partie : pendant le jeu, aucun tirage à venir
 * ne se devine.
 *
 * C'est un panneau d'information du cockpit (`panneau-info` : des chiffres et une distribution), pas une
 * feuille de papier : voir `config/surfaces-de-lecture.ts`. Le seul bouton plein
 * de l'écran reste « Rejouer » ; le lien de la suite est secondaire.
 */

export interface SuiteAffichee {
  niveau: number;
  nomDuNiveau: string;
  entreprise: string;
  nomDeLEntreprise: string;
  memeEntreprise: boolean;
  pourquoi: string;
  /** Le lien qui lance la suite ; nul quand le niveau est fermé à qui joue. */
  href: string | null;
  /** Le niveau fermé : la phrase habituelle des offres, et où les lire. */
  ferme: { message: string; tarifs: string } | null;
}

/** Le bloc, chargé et calculé côté serveur (derrière `Suspense`). */
export async function MeriteDeLaPartieAuBilan({
  gameId,
  userId,
}: {
  gameId: string;
  userId: string;
}) {
  const merite = await meriteDeLaPartie(gameId);
  if (merite.etat !== "verdict") return <SansVerdict message={merite.message} />;
  const v = merite.verdict;
  const [config, session] = await Promise.all([getPlatformConfig(), getSession()]);
  const licence = await unCompteSousLicence([userId, session?.userId]);
  const ferme = niveauReserve(config.vitrineSolo, v.suite.entreprise, v.suite.niveau, licence);
  const choix = SCENARIO_CHOICES.find((s) => s.code === v.suite.entreprise);
  const suite: SuiteAffichee = {
    niveau: v.suite.niveau,
    nomDuNiveau: presetByLevel.get(v.suite.niveau as 1)?.name ?? "",
    entreprise: v.suite.entreprise,
    nomDeLEntreprise: choix?.shortName ?? v.suite.entreprise,
    memeEntreprise: v.suite.memeEntreprise,
    pourquoi: v.suite.pourquoi,
    href: ferme
      ? null
      : `/jouer?secteur=${encodeURIComponent(v.suite.entreprise)}&niveau=${v.suite.niveau}`,
    ferme: ferme
      ? {
          message: messageNiveauxReserves(config.vitrineSolo),
          tarifs: LIEN_TARIFS,
        }
      : null,
  };
  return <MeriteDeLaPartieVue verdict={v} suite={suite} phrase={merite.phraseDeLaReference} />;
}

/** Ce qui tient la place pendant le calcul. */
export function MeriteEnAttente() {
  return (
    <section
      aria-busy="true"
      data-merite-en-attente=""
      className="panneau-info grid gap-2 p-4 sm:p-6"
    >
      <p className="surtitre">La part du hasard</p>
      <p role="status" className="text-base text-slate-300">
        Vos décisions sont rejouées sur d&apos;autres marchés possibles : le verdict arrive.
      </p>
    </section>
  );
}

function SansVerdict({ message }: { message: string }) {
  return (
    <section data-merite-de-la-partie="" data-sans-verdict="" className="panneau-info grid gap-2 p-4 sm:p-6">
      <p className="surtitre">La part du hasard</p>
      <p className="max-w-3xl text-base leading-relaxed text-slate-300">{message}</p>
    </section>
  );
}

const euros = (v: number) => formatEuro(Math.round(v) || 0);

/** « −20 k€ », « 0 », « 15 k€ » : une graduation compacte. */
function compact(v: number): string {
  if (Math.abs(v) < 0.5) return "0 €";
  const signe = v < 0 ? "−" : "";
  const a = Math.abs(v);
  if (a >= 1000) {
    const k = a / 1000;
    return `${signe}${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: k < 10 ? 1 : 0 }).format(k)} k€`;
  }
  return `${signe}${Math.round(a)} €`;
}

const ORDRE_DES_CAS: readonly { cas: CasDuMerite; solides: boolean; favorable: boolean }[] = [
  { cas: "merite", solides: true, favorable: true },
  { cas: "malchance", solides: true, favorable: false },
  { cas: "chance", solides: false, favorable: true },
  { cas: "lecon", solides: false, favorable: false },
];

/** La vue, sans chargement : le verdict et la suite en entrée. */
export function MeriteDeLaPartieVue({
  verdict: v,
  suite,
  phrase = PHRASE_DE_LA_REFERENCE,
}: {
  verdict: VerdictDuMerite;
  suite: SuiteAffichee;
  /** Ce que fait le bon gestionnaire de la partie (`phraseDeLaReference`) ; absent : la ligne d'avant. */
  phrase?: string;
}) {
  return (
    <section
      aria-labelledby="merite-titre"
      data-merite-de-la-partie=""
      data-cas={v.cas}
      className="panneau-info grid gap-8 p-4 sm:p-6"
    >
      <header className="grid gap-1">
        <p className="surtitre">Sur {v.n} marchés possibles</p>
        <h2 id="merite-titre" className="titre-carte text-slate-50">
          La part du hasard
        </h2>
        <p className="max-w-3xl text-base leading-relaxed text-slate-300">
          Votre partie s&apos;est jouée sur un seul marché. Vos décisions ont été rejouées telles
          quelles sur {v.n} autres, avec leurs propres clients, imprévus et concurrents, et celles{" "}
          {deLaReference} sur les mêmes. Sous un même marché, l&apos;écart entre les deux
          tient aux décisions.
        </p>
        <p data-qui-est-la-reference="" className="max-w-3xl text-sm leading-relaxed text-slate-400">
          {phrase}
        </p>
      </header>

      {/* 1. VOS DÉCISIONS TENAIENT-ELLES ? */}
      <div aria-labelledby="merite-decisions" data-bloc-du-merite="decisions" className="grid gap-4">
        <h3 id="merite-decisions" className="text-lg font-bold text-slate-50">
          Vos décisions tenaient-elles ?
        </h3>
        <p data-verdict-du-merite="" className="max-w-3xl text-lg leading-relaxed text-slate-100">
          {v.phrases.verdict}
        </p>
        <Matrice cas={v.cas} />
        <ul className="grid max-w-3xl gap-1.5 text-base leading-relaxed text-slate-300">
          <li>{v.phrases.marche}</li>
          <li data-fourchette-de-rang="">{v.phrases.rangs}</li>
          <li>{v.phrases.reference}</li>
        </ul>
        <DistributionDesMarches verdict={v} />
      </div>

      {/* 2. CE QUE LA PARTIE MONTRE */}
      <div aria-labelledby="merite-constats" data-bloc-du-merite="constats" className="grid gap-3">
        <h3 id="merite-constats" className="text-lg font-bold text-slate-50">
          Ce que la partie montre
        </h3>
        <ul className="grid max-w-3xl gap-2 text-base leading-relaxed text-slate-300">
          {v.constats.map((c) => (
            <li key={c.cle} data-constat={c.cle}>
              {c.texte}
            </li>
          ))}
        </ul>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          Ces constats se lisent tour par tour, sur les mêmes marchés rejoués : un tour réunit
          plusieurs décisions, et en isoler une demanderait de la rejouer seule.
        </p>
      </div>

      {/* 3. ET ENSUITE */}
      <div aria-labelledby="merite-ensuite" data-bloc-du-merite="ensuite" className="grid gap-3">
        <h3 id="merite-ensuite" className="text-lg font-bold text-slate-50">
          Et ensuite
        </h3>
        <p className="max-w-3xl text-base leading-relaxed text-slate-300">
          <span data-niveau-conseille={suite.niveau} className="font-semibold text-slate-50">
            Niveau conseillé : {suite.niveau} · {suite.nomDuNiveau}, avec{" "}
            {suite.memeEntreprise ? "la même entreprise" : suite.nomDeLEntreprise}.
          </span>{" "}
          {suite.pourquoi}
        </p>
        {suite.href ? (
          <div>
            <Link
              href={suite.href}
              data-lien-de-la-suite=""
              className={bouton({ variante: "secondaire", taille: "l" })}
            >
              Lancer {suite.nomDeLEntreprise} au niveau {suite.niveau}
            </Link>
          </div>
        ) : suite.ferme ? (
          <p
            data-niveau-ferme=""
            className="max-w-3xl rounded-lg encadre-neutre p-3.5 text-base leading-relaxed text-slate-200"
          >
            <span className="font-semibold text-slate-50">Niveau {suite.niveau} fermé sans licence.</span>{" "}
            {suite.ferme.message} Vous pouvez rejouer au niveau que vous venez de jouer, ou{" "}
            <Link
              href={suite.ferme.tarifs}
              prefetch={false}
              className="font-semibold text-slate-100 underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              voir les offres
            </Link>
            .
          </p>
        ) : null}
      </div>
    </section>
  );
}

/** La matrice des quatre cas, la case de la partie marquée. */
function Matrice({ cas }: { cas: CasDuMerite }) {
  return (
    <div
      role="table"
      aria-label="Vos décisions et ce marché"
      className="grid max-w-xl grid-cols-[6.5rem_repeat(2,minmax(0,1fr))] gap-1.5 text-sm sm:grid-cols-[8rem_repeat(2,minmax(0,1fr))]"
    >
      <div role="row" className="contents">
        <div role="presentation" />
        <div role="columnheader" className="self-end text-slate-400">
          marché favorable
        </div>
        <div role="columnheader" className="self-end text-slate-400">
          marché défavorable
        </div>
      </div>
      {[true, false].map((solides) => (
        <div role="row" key={String(solides)} className="contents">
          <div role="rowheader" className="self-center text-slate-400">
            {solides ? "décisions solides" : "décisions fragiles"}
          </div>
          {ORDRE_DES_CAS.filter((c) => c.solides === solides).map((c) => (
            <div
              role="cell"
              key={c.cas}
              data-case={c.cas}
              aria-current={c.cas === cas ? "true" : undefined}
              className={`rounded-md px-2.5 py-2 ${
                c.cas === cas
                  ? "ligne-moi font-semibold text-slate-50 ring-1 ring-white/30"
                  : "border border-white/5 text-slate-400"
              }`}
            >
              {CAS_DU_MERITE[c.cas].nom}
              {c.cas === cas ? <span className="sr-only"> : votre partie</span> : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * LA DISTRIBUTION DES MARCHÉS : un point par marché possible, sur l'échelle du
 * résultat net cumulé. Deux rangées, sous la même échelle : vos décisions (la
 * teinte du métier, `--metier`) et un bon gestionnaire (le neutre de
 * référence, `--donnee-2`). Les points d'une même tranche s'empilent (un
 * histogramme de points). Votre partie est marquée d'un trait et nommée ; la
 * ligne du zéro est tracée quand l'échelle la traverse.
 *
 * La grammaire est celle de la compétence `dataviz` et de la charte : des
 * jetons de la palette des données, aucune couleur écrite ; le texte à l'encre,
 * jamais à la couleur d'une série ; chaque rangée nommée en toutes lettres
 * (l'identité ne tient pas à la couleur) ; une infobulle par point ; et un
 * tableau caché pour une synthèse vocale. HTML et pourcentages plutôt qu'un
 * dessin à l'échelle : le texte garde sa taille de 390 à 1 280 px.
 */
const TRANCHES = 24;
const PAS = 12;

function DistributionDesMarches({ verdict: v }: { verdict: VerdictDuMerite }) {
  const valeurs = [
    ...v.joueur.map((m) => m.resultat),
    ...v.reference.map((m) => m.resultat),
    v.joue.resultat,
  ];
  const brutBas = Math.min(...valeurs);
  const brutHaut = Math.max(...valeurs);
  const marge = Math.max(1, (brutHaut - brutBas) * 0.04);
  const [bas, haut] = [brutBas - marge, brutHaut + marge];
  const x = (val: number) => ((val - bas) / (haut - bas)) * 100;
  const tranche = (val: number) => Math.min(TRANCHES - 1, Math.floor((x(val) / 100) * TRANCHES));
  const empiler = <T extends { resultat: number }>(xs: readonly T[]) => {
    const hauteurs = new Array<number>(TRANCHES).fill(0);
    return xs.map((m) => {
      const t = tranche(m.resultat);
      const k = hauteurs[t]!;
      hauteurs[t] = k + 1;
      return { m, t, k };
    });
  };
  const rangees = [
    {
      cle: "joueur",
      nom: "Vos décisions",
      points: empiler(v.joueur),
      teinte: "bg-[color:var(--metier,var(--donnee))]",
    },
    {
      cle: "reference",
      nom: "Un bon gestionnaire",
      points: empiler(v.reference),
      teinte: "bg-[var(--donnee-2)]",
    },
  ] as const;
  const zero = bas < 0 && haut > 0 ? x(0) : null;
  const joue = x(v.joue.resultat);
  return (
    <figure data-distribution-des-marches="" className="m-0 grid gap-3">
      <figcaption className="text-base font-semibold text-slate-100">
        Résultat cumulé de la partie, sur chacun des {v.n} marchés possibles
      </figcaption>
      <div className="grid gap-4">
        {rangees.map((r) => {
          const pile = Math.max(1, ...r.points.map((p) => p.k + 1));
          return (
            <div
              key={r.cle}
              data-rangee={r.cle}
              className="grid gap-1.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-end sm:gap-4"
            >
              <p className="flex items-center gap-2 text-sm text-slate-300">
                <span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-full ${r.teinte}`} />
                {r.nom}
              </p>
              <div
                className="relative border-b border-slate-600"
                style={{ height: `${pile * PAS + (r.cle === "joueur" ? 26 : 6)}px` }}
              >
                {zero !== null ? (
                  <span
                    aria-hidden
                    data-zero=""
                    className="absolute inset-y-0 w-px bg-slate-500"
                    style={{ left: `${zero}%` }}
                  />
                ) : null}
                {r.cle === "joueur" ? (
                  <>
                    <span
                      aria-hidden
                      data-votre-partie=""
                      className="absolute inset-y-0 w-0.5 bg-slate-100"
                      style={{ left: `${joue}%` }}
                    />
                    {/* L'étiquette est la sœur du trait, pas sa fille : posée sur
                        le trait, son fond mesuré serait le trait lui-même. */}
                    <span
                      className="absolute top-0 whitespace-nowrap text-xs font-semibold text-slate-100"
                      style={
                        joue > 60
                          ? { right: `calc(${100 - joue}% + 6px)` }
                          : { left: `calc(${joue}% + 6px)` }
                      }
                    >
                      Votre partie : {euros(v.joue.resultat)}
                    </span>
                  </>
                ) : null}
                {r.points.map(({ m, t, k }) => (
                  <span
                    key={m.graine}
                    title={`Marché ${m.graine} : ${euros(m.resultat)}, ${ordinal(m.rang)} sur ${v.sur}`}
                    className="absolute flex h-3 w-3 items-center justify-center"
                    style={{
                      left: `calc(${((t + 0.5) / TRANCHES) * 100}% - 6px)`,
                      bottom: `${2 + k * PAS}px`,
                    }}
                  >
                    <span
                      className={`block h-2.5 w-2.5 rounded-full shadow-[0_0_0_1.5px_var(--fond-du-tableau)] ${r.teinte}`}
                    />
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        <div className="grid sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
          <span className="max-sm:hidden" />
          <p className="relative h-5 text-xs tabular-nums text-slate-400">
            <span className="absolute left-0">{compact(bas)}</span>
            {zero !== null && zero > 12 && zero < 88 ? (
              <span className="absolute -translate-x-1/2" style={{ left: `${zero}%` }}>
                0 €
              </span>
            ) : null}
            <span className="absolute right-0">{compact(haut)}</span>
          </p>
        </div>
      </div>
      <table className="sr-only">
        <caption>Résultat cumulé sur chaque marché possible</caption>
        <thead>
          <tr>
            <th scope="col">Marché</th>
            <th scope="col">Vos décisions</th>
            <th scope="col">Un bon gestionnaire</th>
          </tr>
        </thead>
        <tbody>
          {v.joueur.map((m, i) => (
            <tr key={m.graine}>
              <th scope="row">{m.graine}</th>
              <td>
                {euros(m.resultat)}, {ordinal(m.rang)} sur {v.sur}
              </td>
              <td>{euros(v.reference[i]!.resultat)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

import Link from "next/link";
import { Bande } from "@/components/bande";
import { classeLigneDeRang } from "@/components/rang";
import { DIFFICULTES, type Difficulte } from "@/config/episodes/difficultes";
import { formatEuro } from "@/lib/format";
import { EPISODES, episodeParCode } from "@/pedagogy/episodes/registre";

/**
 * LE HAUT DE L'ACCUEIL, COMME LA MAQUETTE « L'ARÈNE ».
 *
 * Sous le héros marine, la maquette pose deux choses : un bandeau de quatre
 * chiffres, blanc sur un filet marine, et côte à côte une carte d'épisode et le
 * classement d'une partie. C'est le tableau des scores qu'on promet, montré
 * avant d'être expliqué.
 *
 * DES CHIFFRES VRAIS, ET DITS COMME TELS. La maquette affichait des montants
 * dessinés pour elle (« 1,84 M€ », « 2e sur 6 »). Ceux-ci viennent d'une vraie
 * partie, la même que les trois captures de la page : la constante ci-dessous
 * dit d'où, et tests/unit/capture-accueil.test.ts vérifie qu'ils restent ceux
 * que les captures montrent. Le bandeau porte son étiquette : c'est une partie
 * d'exemple, pas un relevé de la plateforme.
 */

/**
 * LA PARTIE D'EXEMPLE : NOVA, AU TOUR 3.
 *
 * La partie qui a servi aux trois captures de l'accueil (public/apercus) :
 * NOVA, niveau 3, contre deux concurrents pilotés par le moteur, SoundBox
 * (prix agressifs) et Auris (haut de gamme). Les montants sont lus dans la
 * base de cette partie, tables `round_results` (tours 2 et 3) et
 * `game_rankings` (classement à l'IPG après le tour 3), arrondis à l'euro et
 * au point d'IPG. Le chiffre d'affaires, le résultat, son écart au tour 2 et
 * le rang sont aussi lisibles sur les captures elles-mêmes, comme la
 * trésorerie et sa hausse (89 869 €, +10 123 € sur l'écran de l'arène).
 *
 * LA TRÉSORERIE ET NON LA PART DE MARCHÉ, au troisième chiffre : celle de
 * NOVA a reculé au tour 3 (13,6 % contre 18,5 %), et le propriétaire a
 * préféré un chiffre que la page montre déjà sur ses captures. Rien n'est
 * retouché pour autant : Auris gagne plus que NOVA mais la suit au
 * classement, parce que l'IPG ne se réduit pas au résultat.
 *
 * Le classement du tour 2 n'est pas conservé par la base : le bandeau ne dit
 * donc pas de combien de places NOVA a monté, il donne son IPG.
 */
export const PARTIE_D_EXEMPLE = {
  equipe: "NOVA",
  tour: 3,
  chiffreDAffaires: { tour: 319_914, precedent: 286_725 },
  resultat: { tour: 32_942, precedent: 20_965 },
  tresorerie: { tour: 89_869, precedent: 79_746 },
  classement: [
    { equipe: "NOVA", resultat: 32_942, ipg: 58 },
    { equipe: "Auris", resultat: 48_960, ipg: 56 },
    { equipe: "SoundBox", resultat: 75, ipg: 42 },
  ],
} as const;

/** L'épisode que la carte propose : le quarante-neuvième, celui de la maquette. */
export const EPISODE_DE_L_ACCUEIL = "chambres-bradees";

const P = PARTIE_D_EXEMPLE;
const RANG = P.classement.findIndex((l) => l.equipe === P.equipe) + 1;
const IPG = P.classement[RANG - 1]!.ipg;

const pourcent = (v: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(v);

/** Le rang à la française : 1re, 2e, 3e. */
function Rang({ n }: { n: number }) {
  return (
    <>
      {n}
      {/* L'exposant à la moitié du chiffre : à pleine taille, « re » montait
          au niveau du haut du « 1 » et pesait autant que lui. */}
      <sup className="text-xl">{n === 1 ? "re" : "e"}</sup>
    </>
  );
}

/** Une variation : la flèche dit le sens, la couleur le redit, le texte caché le dit à qui ne voit pas. */
function Variation({ hausse, children }: { hausse: boolean; children: React.ReactNode }) {
  return (
    <span className={`text-sm font-bold ${hausse ? "text-emerald-300" : "text-rose-300"}`}>
      <span aria-hidden>{hausse ? "▲" : "▼"}</span>
      <span className="sr-only">{hausse ? "en hausse de" : "en baisse de"}</span> {children}
    </span>
  );
}

/**
 * LE BANDEAU DES QUATRE CHIFFRES, juste sous le héros.
 *
 * Blanc, posé sur un filet marine de trois pixels : c'est `bandeau-chiffres`
 * (globals.css), la classe que la bande des chiffres de la maison porte déjà.
 * Le chiffre en condensé gras, sa variation dessous ; la case du classement
 * en ARDOISE marine, le rang dans l'or des distinctions et son libellé en
 * clair : la seule case sombre du bandeau, celle qu'on regarde. Elle a été
 * sur un voile pêche, une mise en avant trop douce pour un tableau des
 * scores.
 */
export function BandeauDeLaPartie({ contraste }: { contraste: boolean }) {
  const ca = P.chiffreDAffaires;
  const tresorerie = P.tresorerie;
  const cases: {
    libelle: string;
    valeur: React.ReactNode;
    variation: React.ReactNode;
    classe: string;
  }[] = [
    {
      libelle: "CA",
      valeur: formatEuro(ca.tour),
      variation: (
        <Variation hausse={ca.tour >= ca.precedent}>
          {pourcent(Math.abs(ca.tour / ca.precedent - 1) * 100)} %
        </Variation>
      ),
      classe: "",
    },
    {
      libelle: "Résultat",
      valeur: formatEuro(P.resultat.tour),
      variation: (
        <Variation hausse={P.resultat.tour >= P.resultat.precedent}>
          {formatEuro(Math.abs(P.resultat.tour - P.resultat.precedent))}
        </Variation>
      ),
      classe: "border-l",
    },
    {
      libelle: "Trésorerie",
      valeur: formatEuro(tresorerie.tour),
      variation: (
        <Variation hausse={tresorerie.tour >= tresorerie.precedent}>
          {formatEuro(Math.abs(tresorerie.tour - tresorerie.precedent))}
        </Variation>
      ),
      classe: "max-sm:border-t sm:border-l",
    },
    {
      libelle: "Classement",
      valeur: (
        // Le rang est une distinction, pas une action : l'or du podium.
        <span className="texte-or">
          <Rang n={RANG} />/{P.classement.length}
        </span>
      ),
      variation: <span className="text-sm font-bold text-slate-400">IPG {IPG}</span>,
      classe: "ardoise border-l max-sm:border-t bg-slate-950",
    },
  ];
  return (
    <Bande
      id="accueil.partie"
      contraste={contraste}
      fond="bandeau-chiffres"
      interieur="mx-auto max-w-6xl px-6 pb-1 pt-3"
      interieurContraste="mx-auto max-w-6xl px-6 py-10"
      labelledby="partie-d-exemple"
    >
      <p
        id="partie-d-exemple"
        className="text-xs font-semibold uppercase tracking-etiquette text-slate-400"
      >
        Partie d&apos;exemple : {P.equipe}, tour {P.tour}
      </p>
      <dl className="mt-1 grid grid-cols-2 tabular-nums sm:grid-cols-4">
        {cases.map((c) => (
          <div
            key={c.libelle}
            className={`border-[color:var(--filet-carte)] px-3 py-3 sm:px-5 ${c.classe}`}
          >
            <dt className="text-sm font-bold uppercase tracking-etiquette text-slate-400">
              {c.libelle}
            </dt>
            <dd className="mt-1">
              <span className="block font-display text-3xl font-extrabold leading-none text-slate-50 sm:text-4xl">
                {c.valeur}
              </span>
              <span className="mt-1.5 block">{c.variation}</span>
            </dd>
          </div>
        ))}
      </dl>
    </Bande>
  );
}

/**
 * L'OR, L'ARGENT ET LE BRONZE DU PODIUM, chiffre marine dans la pastille.
 *
 * Les jetons sont ceux de globals.css (`--or-distinction`, `--or-filet`,
 * `--argent`, `--bronze` et leurs filets) : l'accueil ne choisit pas ses
 * métaux, il les lit. Les valeurs de repli sont celles des jetons, pour que la
 * pastille reste un métal si la feuille ne les porte pas encore. Le chiffre
 * marine tient au moins 4,8 pour 1 sur chacun des trois (8,3 sur l'or, 11,1
 * sur l'argent, 4,9 sur le bronze).
 */
const METAL: readonly string[] = [
  "bg-[color:var(--or-distinction)] text-[color:var(--marine)] shadow-[inset_0_0_0_1.5px_var(--or-filet,#a07c00)]",
  "bg-[color:var(--argent,#d5dbe4)] text-[color:var(--marine)] shadow-[inset_0_0_0_1.5px_var(--argent-filet,#6b7a8f)]",
  "bg-[color:var(--bronze,#cd7f32)] text-[color:var(--marine)] shadow-[inset_0_0_0_1.5px_var(--bronze-filet,#a8622a)]",
];

const DIFFICULTE: Record<Difficulte, { barres: number; nom: string }> = {
  facile: { barres: 1, nom: "facile" },
  moyen: { barres: 2, nom: "moyenne" },
  difficile: { barres: 3, nom: "élevée" },
};

/**
 * UNE CARTE D'ÉPISODE ET LE CLASSEMENT DE LA PARTIE, côte à côte.
 *
 * La carte mène à un vrai épisode, et son lien couvre toute la carte ; le
 * classement n'est qu'à lire, il ne porte donc pas le filet orange des cartes
 * qui mènent quelque part. La ligne de l'équipe jouée porte le filet orange
 * plein et le fond neutre des lignes choisies (`classeLigneDeRang`, comme les
 * classements de l'arène), et le premier rang prend l'or des distinctions :
 * jamais l'action.
 */
export function EpisodeEtClassement({ contraste }: { contraste: boolean }) {
  const ep = episodeParCode(EPISODE_DE_L_ACCUEIL)!;
  const difficulte = DIFFICULTE[DIFFICULTES[ep.code] ?? "moyen"];
  return (
    <Bande
      id="accueil.episode"
      contraste={contraste}
      interieur="mx-auto max-w-6xl px-6 py-10 sm:py-14"
    >
      <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        <div>
          <article
            className="carte relative p-5 sm:p-6"
            // Le filet orange des cartes qui mènent quelque part (globals.css le
            // pose sur `a.carte`) : ici le lien est dans la carte, pas la carte.
            style={{ borderLeft: "6px solid var(--accent-plein)" }}
          >
            <p className="flex flex-wrap items-center gap-2 text-sm font-bold uppercase tracking-etiquette text-slate-200">
              <span className="rounded-md bg-[color:var(--marine)] px-2 py-0.5 text-[color:var(--bande-claire)]">
                Ép. {ep.numero}
              </span>
              {ep.domaine}
            </p>
            <h2 className="mt-2 font-display text-2xl font-extrabold not-italic normal-case leading-tight text-slate-50 sm:text-3xl">
              {ep.titre}
            </h2>
            <p className="mt-2 text-base leading-relaxed text-slate-400">{ep.resume}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <span className="flex items-center gap-3 text-sm text-slate-400">
                <span role="img" aria-label={`Difficulté ${difficulte.nom}`} className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <i
                      key={i}
                      className={`block h-1.5 w-5 rounded-md ${
                        i <= difficulte.barres ? "bg-[color:var(--accent-plein)]" : "bg-slate-700"
                      }`}
                    />
                  ))}
                </span>
                {ep.etapes.length} décisions
              </span>
              {/* Le lien s'étend à toute la carte : on clique où l'on veut. */}
              <Link
                href={`/entreprises/episode/${ep.code}`}
                className="font-display text-base font-extrabold uppercase tracking-etiquette text-amber-400 after:absolute after:inset-0 hover:text-amber-300"
              >
                Jouer l&apos;épisode
                <span aria-hidden className="ml-1.5">
                  →
                </span>
              </Link>
            </div>
          </article>
          <p className="mt-4">
            <Link
              href="/entreprises/episode"
              className="text-sm font-semibold text-slate-300 underline decoration-amber-400/50 decoration-2 underline-offset-4 transition hover:text-amber-300 hover:decoration-amber-400"
            >
              Les {EPISODES.length} épisodes
              <span aria-hidden className="ml-1.5">
                →
              </span>
            </Link>
          </p>
        </div>

        <div className="carte p-4 sm:p-5">
          <h2 className="text-base font-extrabold uppercase tracking-etiquette text-slate-50">
            Classement de la partie · tour {P.tour}
          </h2>
          <table className="mt-2 w-full border-collapse text-left tabular-nums">
            <thead>
              <tr className="text-xs uppercase tracking-etiquette text-slate-400">
                <th scope="col" className="w-9 py-1 font-semibold">
                  <span className="sr-only">Rang</span>
                </th>
                <th scope="col" className="py-1 font-semibold">
                  Équipe
                </th>
                <th scope="col" className="py-1 text-right font-semibold">
                  Résultat
                </th>
                <th scope="col" className="py-1 pl-4 text-right font-semibold">
                  IPG
                </th>
              </tr>
            </thead>
            <tbody>
              {P.classement.map((l, i) => {
                const joueur = l.equipe === P.equipe;
                return (
                  <tr
                    key={l.equipe}
                    className={`border-t border-[color:var(--filet-carte)] ${classeLigneDeRang(i + 1, joueur)}`}
                  >
                    <td className="py-2 pl-1">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full font-display text-lg font-extrabold ${
                          METAL[i] ?? "text-slate-400"
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td
                      className={`py-2 text-base ${joueur ? "font-bold text-slate-50" : "text-slate-300"}`}
                    >
                      {l.equipe}
                      {joueur ? <span className="sr-only"> (l&apos;équipe jouée)</span> : null}
                    </td>
                    <td className="py-2 text-right font-display text-lg font-bold text-slate-100">
                      {formatEuro(l.resultat)}
                    </td>
                    <td className="py-2 pl-4 pr-1 text-right font-display text-lg font-bold text-slate-100">
                      {l.ipg}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Bande>
  );
}

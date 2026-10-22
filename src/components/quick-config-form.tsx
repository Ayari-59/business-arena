"use client";

import { useState, type ReactNode } from "react";
import { sansMolette } from "@/components/sans-molette";
import {
  aDeuxEtages,
  niveauMaxPour,
  niveauxFermes,
  VITRINE_SOLO_PAR_DEFAUT,
  type VitrineSolo,
} from "@/config/vitrine-solo";
import { Icone } from "@/components/icone";
import { TuileDuLieu } from "@/components/tuile-du-lieu";
import type { Sector } from "@/config/scenarios/registry";
import type { ComparatifDesNiveaux, TableauDuNiveau } from "@/config/tableau-des-niveaux";
import { TOURS_MAX_AU_TRIMESTRE } from "@/config/scenarios/rounds";

/** Sans texte passé par la page : une marque neutre (les noms vivent dans config/tarifs.ts). */
const OFFRE_PAR_DEFAUT = { marque: "Offre payante", message: "Ces niveaux sont inclus dans les offres payantes." };

/**
 * Les champs de la configuration rapide, en version tactile : cartes de secteur,
 * curseur de niveau, tuiles de rythme. Le formulaire et son bouton restent côté
 * serveur (page d'accueil) ; ce composant n'est qu'un îlot interactif qui écrit
 * ses choix dans des `<input type="hidden">`. Les `name` et les valeurs sont
 * exactement ceux qu'attend `startGameAction` — rien ne change côté serveur.
 *
 * L'essentiel (entreprise, niveau) est visible ; le rythme et la taille du
 * marché, qui ont de bons défauts, se replient sous « Options du marché ».
 *
 * Aucune classe de texte ne descend sous 12 px (règle d'accessibilité du
 * projet) : les détails qui tenteraient d'être plus petits sont plutôt donnés
 * en légende dynamique sous la grille (secteur, entreprises).
 */

export interface QuickScenario {
  code: string;
  /**
   * Le secteur, pour son pictogramme dessiné. Il n'y a qu'une tuile par
   * famille (NOVA en un produit ou en gamme se choisit au niveau) : le dessin
   * du secteur suffit à les distinguer, là où un emoji par scénario changeait
   * d'aspect d'un appareil à l'autre.
   */
  secteur: Sector;
  /** Le nom court du scénario (« NOVA · gamme »). */
  label: string;
  /** Le secteur, en légende de la tuile. */
  sector: string;
  tagline: string;
  /** Le jeton de la teinte du métier (`teinteDuMetier`) : `data-metier` sur la carte. */
  teinte: string;
  /** La promesse du registre (« Prenez les commandes »), l'accroche de la carte. */
  promesse: string | null;
  /**
   * Les formations que l'entreprise sert (« STMG, BTS CG et DCG »), lues dans
   * le registre : une même entreprise se joue à plusieurs niveaux, et la carte
   * le dit à l'enseignant qui cherche la sienne. Null quand aucune.
   */
  sert?: string | null;
  /**
   * Un scénario à famille se joue en un produit ou en gamme selon le niveau :
   * ce que chaque variante fait jouer, et le niveau à partir duquel c'est la
   * gamme. Absent : le scénario est le même à tous les niveaux.
   */
  variante?: {
    gammeFromLevel: number;
    mono: string;
    gamme: string;
    /** La référence qui se bâtit par la R&D, et le niveau qui l'ouvre. */
    aBatir?: string;
    niveauDeLaRd?: number;
  };
}
export interface QuickLevel {
  level: number;
  name: string;
  tagline: string;
  decisions: number;
  /** Ce que le niveau confie, garde et ouvre ensuite (`config/tableau-des-niveaux`). */
  tableau?: TableauDuNiveau | null;
}

const PERIODS = [
  { value: "month", label: "Un mois", short: "Mois", hint: "délais redoutables" },
  { value: "quarter", label: "Un trimestre", short: "Trimestre", hint: "le rythme classique" },
  { value: "year", label: "Une année", short: "Année", hint: "vision long terme" },
] as const;

const COMPANIES = [
  { value: "2", hint: "duel face à un seul concurrent" },
  { value: "3", hint: "le marché classique (recommandé)" },
  { value: "4", hint: "marché disputé" },
  { value: "6", hint: "forte concurrence" },
  { value: "8", hint: "guerre de tous contre tous" },
] as const;

/**
 * Les durées proposées. Les plus longues (`auTrimestre`) ne s'offrent qu'au trimestre :
 * au mois et à l'année, une partie ne s'allonge pas (`config/scenarios/rounds.ts`).
 */
const ROUNDS: readonly { value: string; label: string; auTrimestre?: true }[] = [
  { value: "", label: "Toute la partie" },
  { value: "3", label: "3 tours" },
  { value: "4", label: "4 tours" },
  { value: "5", label: "5 tours" },
  { value: "6", label: "6 tours" },
  { value: "8", label: "8 tours", auTrimestre: true },
  { value: String(TOURS_MAX_AU_TRIMESTRE), label: `${TOURS_MAX_AU_TRIMESTRE} tours`, auTrimestre: true },
];

/**
 * L'OPTION COCHÉE D'UNE CARTE D'ENTREPRISE (lot P2) : un filet orange plein de
 * deux pixels (le bord et son anneau), sans voile. La garde
 * `orange-de-l-action` ne laisse passer ces classes que sous ce nom, sur un
 * bouton `aria-pressed`.
 */
const OPTION_COCHEE_CARTE = "border-amber-400 ring-1 ring-amber-400";

/** Le niveau où l'on commence : 3 · Pilotage. */
export const NIVEAU_PAR_DEFAUT = 3;

export function QuickConfigFields({
  scenarios,
  levels,
  defaultScenario,
  defaultLevel,
  vitrine,
  licence = false,
  liens,
  offre = OFFRE_PAR_DEFAUT,
  lancement,
  comparatif,
}: {
  /** Le comparatif des niveaux, dépliable sur ordinateur (`config/tableau-des-niveaux`). */
  comparatif?: ComparatifDesNiveaux;
  scenarios: QuickScenario[];
  levels: QuickLevel[];
  defaultScenario: string;
  /**
   * Le niveau proposé à l'ouverture (`/jouer?niveau=`), quand le bilan d'une partie en
   * conseille un. Un niveau fermé à qui joue retombe au plus haut niveau ouvert : le
   * lien ne passe pas outre la règle, que le serveur applique de toute façon.
   */
  defaultLevel?: number;
  /**
   * Les niveaux ouverts sans licence (config/vitrine-solo) : par défaut 1 à 3 pour toutes
   * les entreprises. Absente : la règle par défaut.
   */
  vitrine?: VitrineSolo;
  /** Une licence en cours couvre-t-elle qui joue ? Elle ouvre tous les niveaux. */
  licence?: boolean;
  /** Où lire ce qu'ouvrent les offres (les tarifs). */
  liens?: { tarifs: { href: string; libelle: string } };
  /**
   * Le nom de l'offre qui ouvre les niveaux fermés, et la phrase qui le dit : lus dans
   * config/tarifs.ts par la page serveur (ce composant client n'importe pas la grille).
   */
  offre?: { marque: string; message: string };
  /** Le bouton qui lance la partie, posé dans le résumé collant (un seul à l'écran). */
  lancement?: ReactNode;
}) {
  const [scenario, setScenario] = useState(defaultScenario);
  // On commence au niveau 3 · Pilotage ; les niveaux 1-2 (questions d'analyse entre deux
  // réponses, l'équipe et les créances encore gérées pour vous) sont à un ou deux crans.
  const [level, setLevel] = useState(() =>
    defaultLevel === undefined
      ? NIVEAU_PAR_DEFAUT
      : Math.max(
          1,
          Math.min(defaultLevel, niveauMaxPour(vitrine ?? VITRINE_SOLO_PAR_DEFAUT, defaultScenario, licence)),
        ),
  );
  const [period, setPeriod] = useState<string>("quarter");
  const [companies, setCompanies] = useState<string>("3");
  const [rounds, setRounds] = useState<string>("");
  const [optionsOuvertes, setOptionsOuvertes] = useState(false);
  const [comparatifOuvert, setComparatifOuvert] = useState(false);

  const regle: VitrineSolo = vitrine ?? VITRINE_SOLO_PAR_DEFAUT;
  // Le niveau le plus haut jouable avec l'entreprise choisie.
  const niveauMax = niveauMaxPour(regle, scenario, licence);
  // Une entreprise ouverte à tous les niveaux, les autres non : chaque carte dit jusqu'où
  // elle se joue. La même borne pour toutes : l'encadré sous le niveau le dit une fois.
  const parCarte = !licence && aDeuxEtages(regle);
  const minLevel = levels[0]?.level ?? 1;
  const maxLevel = levels[levels.length - 1]?.level ?? 6;
  const cur = levels.find((l) => l.level === level) ?? levels[0];
  const sec = scenarios.find((s) => s.code === scenario) ?? scenarios[0];
  const per = PERIODS.find((p) => p.value === period)!;
  const comp = COMPANIES.find((c) => c.value === companies)!;
  const round = ROUNDS.find((r) => r.value === rounds)!;

  // Le nom d'un réglage : un libellé, en casse normale (lot P1 : il était en
  // petites capitales espacées, comme tout le reste de la carte).
  const label = "libelle";
  const tile =
    "cursor-pointer rounded-lg border border-white/5 bg-slate-950 px-2 py-2.5 text-center text-slate-100 transition hover:border-white/25";
  const tileOn = "border-amber-400/70 bg-amber-400/10 text-slate-100 ring-1 ring-amber-400/30";

  return (
    <div>
      {/* Valeurs envoyées à startGameAction */}
      <input type="hidden" name="scenarioCode" value={scenario} />
      <input type="hidden" name="level" value={level} />
      <input type="hidden" name="periodicity" value={period} />
      <input type="hidden" name="companiesCount" value={companies} />
      <input type="hidden" name="roundsCount" value={rounds} />

      {/* 1 · Entreprise */}
      <p className={`mt-4 ${label}`}>Votre entreprise</p>
      {/* LES NEUF ENTREPRISES EN CARTES PHOTO (lot P2). Elles ont été neuf
          pictogrammes au trait dans des tuiles grises, alors que chacune a son
          lieu en photographie : la carte montre le lieu (la réduite, chargée à
          l'approche de l'écran), le nom de l'entreprise, son métier et sa
          promesse, celle du registre (« Prenez les commandes »).

          LOT P6 : LE NOM SUR LA PHOTO, ET LE 3 × 3 DU TÉLÉPHONE REVIENT.
          « Avant c'était une grille de 3 × 3 sur mobile… c'est plus
          esthétique » ; « les photos sans texte sont sans âme » (le
          propriétaire). Les cartes en deux colonnes du lot P2 se faisaient
          défiler sur trois écrans de téléphone. Le nom et le métier passent
          SUR la photo (`TuileDuLieu`, voile mesuré), ce qui permet, sous
          640 px, trois colonnes de tuiles 4:5 : les neuf entreprises se voient
          d'un coup d'œil, dans le premier écran après le titre de la carte
          (tests/e2e/mise-en-scene.e2e.ts). L'accroche, qui ne tient pas dans
          une tuile de 95 px, ne s'y montre pas ; sur tablette et ordinateur,
          les cartes photo du lot P2 restent (2 puis 3 colonnes), le nom sur
          la photo, l'accroche dessous.

          LES TRAITS AU MÊME NIVEAU. Le texte est ancré en bas de la tuile :
          un nom qui passe sur deux lignes dans le 3 × 3 (LA TABLE D'AUGUSTIN,
          ATLAS CONSEIL) faisait remonter son trait d'une ligne au-dessus de
          ses voisins. Sous 640 px, le nom réserve donc deux lignes
          (`min-h-[2lh]`) : trait et nom partent du même niveau sur toute la
          rangée, le métier aussi.

          LA CARTE CHOISIE se reconnaît à un filet orange plein de deux pixels
          et à une coche (la règle de « l'option cochée » : une décision, la
          charte la range avec l'action), et non plus à un fond délavé. Elle
          reste un vrai contrôle : un bouton `aria-pressed`, au clavier. */}
      <div data-grille-des-entreprises="" className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        {scenarios.map((s) => {
          const on = s.code === scenario;
          return (
            <button
              key={s.code}
              type="button"
              data-carte-entreprise={s.code}
              data-metier={s.teinte}
              onClick={() => {
                setScenario(s.code);
                // Passer à une entreprise dont le niveau choisi est réservé : on retombe au plus haut permis.
                setLevel((n) => Math.min(n, niveauMaxPour(regle, s.code, licence)));
              }}
              aria-pressed={on}
              className={`group relative flex min-w-0 flex-col overflow-hidden rounded-lg border text-left transition sm:rounded-xl ${
                on ? `${OPTION_COCHEE_CARTE} bg-slate-950` : "border-white/10 bg-slate-950 hover:border-white/30"
              }`}
            >
              <span className="relative block">
                <TuileDuLieu
                  code={s.code}
                  secteur={s.secteur}
                  nom={s.label}
                  metier={s.sector}
                  className="aspect-[4/5] sm:aspect-[3/2]"
                  classePhoto="transition-transform duration-[var(--duree-passage)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  classeTexte="px-3 pb-2.5 pt-6 sm:pb-3"
                  classeNom="text-xs max-sm:min-h-[2lh] sm:text-base"
                  classeMetier="text-xs sm:text-sm"
                />
                {on ? (
                  // La coche : l'option cochée, dite autrement que par la couleur.
                  <span
                    aria-hidden
                    data-coche=""
                    className="coche-de-l-option absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full sm:right-2 sm:top-2 sm:h-7 sm:w-7"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                ) : null}
              </span>
              {s.promesse || parCarte ? (
                // Sous la photo : l'accroche (au-delà du téléphone), et, quand une
                // entreprise est ouverte à tous les niveaux et pas les autres, jusqu'où
                // chacune se joue (partout : c'est une règle du choix, pas une décoration).
                <span
                  className={`flex flex-1 flex-col gap-0.5 sm:px-3 sm:pb-3 sm:pt-2 ${
                    parCarte ? "px-2 pb-2 pt-1.5" : "max-sm:hidden"
                  }`}
                >
                  {s.promesse ? (
                    <span className="text-sm leading-snug text-slate-400 max-sm:hidden">{s.promesse}</span>
                  ) : null}
                  {s.sert ? (
                    <span data-sert="" className="text-xs leading-snug text-slate-400 max-sm:hidden">
                      Sert : {s.sert}
                    </span>
                  ) : null}
                  {parCarte ? (
                    // Deux étages : chaque carte dit jusqu'où elle se joue.
                    <span
                      className={`self-start rounded-full px-1.5 py-0.5 text-xs leading-none sm:mt-1.5 ${
                        s.code === regle.entrepriseOuverte
                          ? "bg-white/5 font-semibold text-slate-100"
                          : "bg-white/5 text-slate-400"
                      }`}
                    >
                      {s.code === regle.entrepriseOuverte ? "Tous niveaux" : `Niveaux 1-${niveauMaxPour(regle, s.code)}`}
                    </span>
                  ) : null}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-sm leading-snug text-slate-400">
        {sec?.tagline}
        {/* Sur téléphone, la carte ne porte pas les formations : la légende de
            l'entreprise choisie les dit, à toutes les largeurs. */}
        {sec?.sert ? <span data-sert-legende=""> Sert : {sec.sert}.</span> : null}
      </p>

      {/* 2 · Niveau */}
      <div className="mt-5 flex items-baseline justify-between gap-3">
        <p className={label}>Votre niveau de défi</p>
        <span className="text-xs tabular-nums text-slate-400">
          {cur ? `≈ ${cur.decisions} décisions / tour` : ""}
        </span>
      </div>
      <p className="mt-1 text-lg font-bold text-slate-50">
        Niveau {level} · {cur?.name}
      </p>
      <input
        type="range"
        onWheel={sansMolette}
        min={minLevel}
        max={maxLevel}
        step={1}
        value={level}
        onChange={(e) => setLevel(Math.min(Number(e.target.value), niveauMax))}
        aria-label="Niveau de difficulté"
        className="curseur mt-2 accent-amber-500"
      />
      <div className="flex justify-between">
        {levels.map((l) => {
          const reserve = l.level > niveauMax;
          return (
            <button
              key={l.level}
              type="button"
              onClick={() => setLevel(Math.min(l.level, niveauMax))}
              aria-label={`Niveau ${l.level} · ${l.name}${reserve ? ` · ${offre.marque}` : ""}`}
              className={`px-1 text-xs tabular-nums ${
                l.level === level
                  ? "font-bold text-slate-50"
                  : reserve
                    ? "text-slate-400 opacity-80 hover:opacity-100"
                    : "text-slate-400 hover:text-slate-300"
              }`}
            >
              {l.level}
              {reserve ? <Icone nom="verrou" className="ml-1 h-3 w-3" /> : null}
            </button>
          );
        })}
      </div>
      {niveauMax < maxLevel ? (
        // Les niveaux fermés restent visibles (l'étendue est l'argument) et ne sont pas un
        // bouton muet : on dit lesquels, ce qui les ouvre, et où le lire.
        <div
          data-niveaux-reserves
          className="encadre-neutre mt-2 rounded-lg px-3 py-2.5 text-sm leading-snug text-slate-200"
        >
          <p>
            <Icone nom="verrou" className="mr-1.5 h-3.5 w-3.5" />
            <strong className="font-semibold text-slate-100" data-offre-des-niveaux="">
              {niveauxFermes(regle)} · {offre.marque}
            </strong>{" "}
            {offre.message}
            {aDeuxEtages(regle)
              ? ` ${scenarios.find((s) => s.code === regle.entrepriseOuverte)?.label ?? "Une entreprise"} se joue à tous les niveaux.`
              : null}
          </p>
          {liens ? (
            <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
              <a href={liens.tarifs.href} className="font-semibold text-slate-100 underline decoration-1 underline-offset-4">
                {liens.tarifs.libelle} →
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
      <p className="mt-2 min-h-[2.5em] text-sm leading-snug text-slate-300">{cur?.tagline}</p>
      {sec?.variante ? (
        // Le niveau décide de la variante jouée : on le dit à côté du curseur,
        // là où le choix se fait, avec ce que l'autre variante attend.
        <p className="encadre-neutre mt-1 rounded-lg px-3 py-2 text-sm leading-snug text-slate-200" data-variante>
          {level >= sec.variante.gammeFromLevel
            ? `À ce niveau, ${sec.label} se joue en gamme : ${sec.variante.gamme}${
                sec.variante.aBatir && sec.variante.niveauDeLaRd !== undefined
                  ? level >= sec.variante.niveauDeLaRd
                    ? `, ${sec.variante.aBatir}`
                    : `, livrée prête (${sec.variante.aBatir} au niveau ${sec.variante.niveauDeLaRd})`
                  : ""
              }. En dessous du niveau ${sec.variante.gammeFromLevel}, ${sec.variante.mono}.`
            : `À ce niveau, ${sec.label} se joue avec ${sec.variante.mono}. À partir du niveau ${sec.variante.gammeFromLevel}, ${sec.variante.gamme}.`}
        </p>
      ) : null}

      {cur?.tableau ? <TableauDuNiveauChoisi tableau={cur.tableau} /> : null}
      {comparatif ? (
        // LE COMPARATIF, SUR ORDINATEUR SEULEMENT : six colonnes ne tiennent pas
        // sur un téléphone, où le tableau du niveau choisi suffit. Un bouton et un
        // rendu conditionnel, comme les options du marché (voir plus bas).
        <div className="mt-3 max-sm:hidden" data-comparatif-des-niveaux="">
          <button
            type="button"
            onClick={() => setComparatifOuvert((o) => !o)}
            aria-expanded={comparatifOuvert}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-100 underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            Comparer les {comparatif.niveaux.length} niveaux
            <span aria-hidden className={`transition-transform ${comparatifOuvert ? "rotate-180" : ""}`}>⌄</span>
          </button>
          {comparatifOuvert ? (
            <ComparatifDesNiveauxTableau comparatif={comparatif} choisi={level} niveauMax={niveauMax} marque={offre.marque} />
          ) : null}
        </div>
      ) : null}

      {/* Options repliées.
          Volontairement un bouton + rendu conditionnel, PAS un <details> natif :
          le contenu d'un <details> fermé garde un DOM qui, sur le thème clair,
          ne reçoit pas l'inversion des variables de thème (fond resté sombre,
          texte inversé) et devenait illisible. Fermé = hors du DOM ; ouvert =
          rendu normal, contraste correct. */}
      {/* Lot P3 : un filet plein et discret ; le pointillé disait « vide », et
          ce repli n'est que rangé (règle des replis du lot 6E). */}
      <div className="mt-4 rounded-lg border border-white/15 px-3">
        <button
          type="button"
          onClick={() => setOptionsOuvertes((o) => !o)}
          aria-expanded={optionsOuvertes}
          className="flex w-full items-center gap-1.5 py-2.5 text-left text-xs font-semibold text-slate-300"
        >
          <span className="text-slate-400">⚙</span> Options du marché (rythme, entreprises, tours)
          <span className={`ml-auto transition-transform ${optionsOuvertes ? "rotate-180" : ""}`}>⌄</span>
        </button>
        {optionsOuvertes && (
        <div className="pb-3">
          <p className={`mt-1 ${label}`}>Chaque tour représente…</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  setPeriod(p.value);
                  // Une durée qui ne vaut qu'au trimestre retombe sur la partie écrite.
                  if (p.value !== "quarter" && ROUNDS.find((r) => r.value === rounds)?.auTrimestre) setRounds("");
                }}
                aria-pressed={p.value === period}
                className={`${tile} ${p.value === period ? tileOn : ""}`}
              >
                <span className="block text-sm font-medium">{p.label}</span>
                <span className="mt-0.5 block text-xs leading-tight text-slate-400">{p.hint}</span>
              </button>
            ))}
          </div>

          <p className={`mt-4 ${label}`}>Entreprises sur le marché</p>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {COMPANIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCompanies(c.value)}
                aria-pressed={c.value === companies}
                aria-label={`${c.value} entreprises : ${c.hint}`}
                className={`${tile} py-2.5 text-base font-semibold ${c.value === companies ? tileOn : ""}`}
              >
                {c.value}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">{comp.value} entreprises</span> · {comp.hint}
          </p>

          <p className={`mt-4 ${label}`}>Nombre de tours</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ROUNDS.filter((r) => !r.auTrimestre || period === "quarter").map((r) => (
              <button
                key={r.value || "all"}
                type="button"
                onClick={() => setRounds(r.value)}
                aria-pressed={r.value === rounds}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  r.value === rounds
                    ? "border-amber-400/70 bg-amber-400/10 text-slate-100 ring-1 ring-amber-400/30"
                    : "border-white/10 bg-slate-950 text-slate-300 hover:border-white/25"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* LE RÉSUMÉ COLLANT (lot P2). Le choix du niveau et le bouton de
          lancement étaient sous la ligne de flottaison : on choisissait une
          entreprise en haut de page, et rien ne disait où lancer. Le résumé
          de ce qu'on lance et LE bouton de lancement sont désormais une seule
          barre, collée au bas de l'écran tant que le formulaire est à
          l'écran (`sticky`), qui reprend sa place au pied du formulaire quand
          on y arrive. Une entreprise est toujours choisie (celle du lien, ou
          NOVA) : la barre est donc toujours là, et il n'y a jamais qu'UN
          bouton de lancement à l'écran. Elle est en ardoise : le marine de
          l'arène, sous le pouce.
          LOT P3 : ELLE S'ALIGNE SUR LA GRILLE DES ENTREPRISES. Elle sortait de
          la marge intérieure de la carte (`-mx-6`) et débordait ainsi la
          grille de part et d'autre ; elle en prend désormais les bords exacts,
          coins arrondis, et se pose au pied du formulaire dans la même marge
          que tout le reste. */}
      <div
        data-resume-de-lancement=""
        className="ardoise sticky bottom-0 z-20 mt-5 flex flex-col gap-3 rounded-xl border-t border-white/10 bg-slate-950 px-4 py-3 shadow-[0_-10px_24px_-14px_rgb(6_21_41/0.55)] sm:flex-row sm:items-center sm:justify-between sm:px-5"
      >
        <p data-vous-lancez className="min-w-0 text-sm leading-snug text-slate-300" aria-live="polite">
          <span className="block text-base font-semibold text-slate-50">
            {sec?.label} · Niveau {level} · {cur?.name}
          </span>
          <span className="block max-sm:hidden">
            {per.short} · {comp.value} entreprises · {round.label.toLowerCase()}
          </span>
        </p>
        {lancement ? <div className="shrink-0 sm:min-w-56">{lancement}</div> : null}
      </div>
    </div>
  );
}

/**
 * LE NIVEAU CHOISI, EN TROIS BLOCS : ce que le joueur décide, ce que le niveau
 * tient pour lui, et ce que le suivant ouvre. Tout est lu dans les préréglages
 * (`config/tableau-des-niveaux`) ; ce composant ne fait que poser les listes.
 */
function TableauDuNiveauChoisi({ tableau }: { tableau: TableauDuNiveau }) {
  const blocs = [
    { cle: "decidez", titre: "Vous décidez", items: tableau.decidez },
    { cle: "gere", titre: "Géré pour vous", items: tableau.gere },
    { cle: "suivant", titre: "Au niveau suivant", items: tableau.suivant },
  ] as const;
  return (
    <section
      aria-label={`Le niveau ${tableau.level} en bref`}
      data-tableau-du-niveau={tableau.level}
      className="mt-3 rounded-lg border border-white/10 px-3 py-3 sm:px-4"
    >
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {blocs.map((b) => (
          <div key={b.cle} data-bloc={b.cle} className="min-w-0">
            <h3 className="libelle text-slate-300">{b.titre}</h3>
            {b.items.length > 0 ? (
              <ul className="mt-1.5 space-y-1 text-sm leading-snug text-slate-200">
                {b.items.map((x) => (
                  <li key={x} className="flex gap-1.5">
                    <span aria-hidden className="text-slate-400">
                      {b.cle === "gere" ? "·" : b.cle === "suivant" ? "+" : "✓"}
                    </span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-sm leading-snug text-slate-400">
                {b.cle === "gere" ? "Rien : tout est entre vos mains." : "Vous êtes au niveau le plus complet."}
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 border-t border-white/10 pt-2 text-xs text-slate-400">{tableau.reperes}</p>
    </section>
  );
}

/** Le comparatif : une ligne par levier, une colonne par niveau. */
function ComparatifDesNiveauxTableau({
  comparatif,
  choisi,
  niveauMax,
  marque,
}: {
  comparatif: ComparatifDesNiveaux;
  choisi: number;
  niveauMax: number;
  marque: string;
}) {
  const marqueDe = { oui: "Oui", plafonne: "À hauteur de l'équipe", non: "Non" } as const;
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-sm" data-tableau-comparatif="">
        <caption className="sr-only">Les leviers ouverts à chaque niveau</caption>
        <thead>
          <tr className="text-left text-xs text-slate-400">
            <th scope="col" className="py-1.5 pr-3 font-medium">Levier</th>
            {comparatif.niveaux.map((n) => (
              <th
                key={n.level}
                scope="col"
                className={`px-3 py-2 text-center font-medium ${n.level === choisi ? "text-slate-50" : ""}`}
              >
                <span className="block tabular-nums">
                  {n.level}
                  {n.level > niveauMax ? (
                    <Icone nom="verrou" className="ml-1 h-3 w-3" aria-label={marque} />
                  ) : null}
                </span>
                <span className="block font-normal">{n.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparatif.lignes.map((l) => (
            <tr key={l.groupe} className="border-t border-white/5">
              <th scope="row" className="py-1.5 pr-3 text-left font-normal text-slate-200">
                {l.libelle}
              </th>
              {l.cases.map((c, i) => (
                <td
                  key={comparatif.niveaux[i]!.level}
                  className={`px-3 py-2 text-center ${comparatif.niveaux[i]!.level === choisi ? "bg-white/5" : ""}`}
                >
                  <span className="sr-only">{marqueDe[c]}</span>
                  <span aria-hidden className={c === "non" ? "text-slate-400" : "text-slate-100"}>
                    {c === "oui" ? "✓" : c === "plafonne" ? "✓*" : "·"}
                  </span>
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t border-white/5">
            <th scope="row" className="py-1.5 pr-3 text-left font-normal text-slate-200">
              Indices par situation
            </th>
            {comparatif.indices.map((n, i) => (
              <td
                key={comparatif.niveaux[i]!.level}
                className={`px-3 py-2 text-center tabular-nums text-slate-100 ${comparatif.niveaux[i]!.level === choisi ? "bg-white/5" : ""}`}
              >
                {n}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="mt-1.5 text-xs text-slate-400">
        ✓* : investissement à hauteur de votre équipe, faute d&apos;embauches à ce niveau.
      </p>
    </div>
  );
}

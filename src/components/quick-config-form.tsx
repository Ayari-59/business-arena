"use client";

import { useState, type ReactNode } from "react";
import { sansMolette } from "@/components/sans-molette";
import {
  messageNiveauxReserves,
  niveauMaxPour,
  VITRINE_SOLO_PAR_DEFAUT,
  type VitrineSolo,
} from "@/config/vitrine-solo";
import { Icone } from "@/components/icone";
import { PhotoDuLieu } from "@/components/illustrations/scene-d-entreprise";
import type { Sector } from "@/config/scenarios/registry";

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
   * Un scénario à famille se joue en un produit ou en gamme selon le niveau :
   * ce que chaque variante fait jouer, et le niveau à partir duquel c'est la
   * gamme. Absent : le scénario est le même à tous les niveaux.
   */
  variante?: { gammeFromLevel: number; mono: string; gamme: string };
}
export interface QuickLevel {
  level: number;
  name: string;
  tagline: string;
  decisions: number;
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

const ROUNDS = [
  { value: "", label: "Toute la partie" },
  { value: "3", label: "3 tours" },
  { value: "4", label: "4 tours" },
  { value: "5", label: "5 tours" },
  { value: "6", label: "6 tours" },
] as const;

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
  vitrine,
  liens,
  lancement,
}: {
  scenarios: QuickScenario[];
  levels: QuickLevel[];
  defaultScenario: string;
  /**
   * La vitrine du solo public (config/vitrine-solo) : une entreprise jouable à tous les
   * niveaux, les autres jusqu'à un niveau maximum. Absente ou éteinte : tout est ouvert.
   */
  vitrine?: VitrineSolo;
  /** Où s'adresser pour les niveaux réservés : prendre rendez-vous, ou entrer côté enseignant. */
  liens?: { contact: { href: string; libelle: string }; enseignant: { href: string; libelle: string } };
  /** Le bouton qui lance la partie, posé dans le résumé collant (un seul à l'écran). */
  lancement?: ReactNode;
}) {
  const [scenario, setScenario] = useState(defaultScenario);
  // On commence au niveau 3 · Pilotage ; les niveaux 1-2 (questions d'analyse entre deux
  // réponses, financement fermé) sont à un ou deux crans de curseur.
  const [level, setLevel] = useState(NIVEAU_PAR_DEFAUT);
  const [period, setPeriod] = useState<string>("quarter");
  const [companies, setCompanies] = useState<string>("3");
  const [rounds, setRounds] = useState<string>("");
  const [optionsOuvertes, setOptionsOuvertes] = useState(false);

  const regle: VitrineSolo = vitrine ?? VITRINE_SOLO_PAR_DEFAUT;
  // Le niveau le plus haut jouable avec l'entreprise choisie (6 quand la vitrine est éteinte).
  const niveauMax = niveauMaxPour(regle, scenario);
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
          l'approche de l'écran), le nom de l'entreprise, son métier dans sa
          teinte et sa promesse, celle du registre (« Prenez les commandes »).
          Trois colonnes sur ordinateur, deux sur tablette et téléphone.

          LA CARTE CHOISIE se reconnaît à un filet orange plein de deux pixels
          et à une coche (la règle de « l'option cochée » : une décision, la
          charte la range avec l'action), et non plus à un fond délavé. Elle
          reste un vrai contrôle : un bouton `aria-pressed`, au clavier. */}
      <div className="mt-2 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
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
                setLevel((n) => Math.min(n, niveauMaxPour(regle, s.code)));
              }}
              aria-pressed={on}
              className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition ${
                on ? `${OPTION_COCHEE_CARTE} bg-slate-950` : "border-white/10 bg-slate-950 hover:border-white/30"
              }`}
            >
              <span className="relative block overflow-hidden">
                <PhotoDuLieu
                  scenario={s.code}
                  secteur={s.secteur}
                  petit
                  className="aspect-[3/2] w-full transition-transform duration-[var(--duree-passage)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
                {on ? (
                  // La coche : l'option cochée, dite autrement que par la couleur.
                  <span
                    aria-hidden
                    data-coche=""
                    className="coche-de-l-option absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                ) : null}
              </span>
              <span className="flex flex-1 flex-col gap-0.5 px-3 pb-3 pt-2.5">
                <span className="text-sm font-semibold leading-tight text-slate-100 sm:text-base">
                  {s.label}
                </span>
                <span className="text-xs font-medium leading-tight text-[color:var(--metier,var(--color-slate-300))] sm:text-sm">
                  {s.sector}
                </span>
                {s.promesse ? (
                  <span className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">{s.promesse}</span>
                ) : null}
                {regle.active ? (
                  // Vitrine allumée : chaque carte dit jusqu'où elle se joue.
                  <span
                    className={`mt-1.5 self-start rounded-full px-1.5 py-0.5 text-xs leading-none ${
                      s.code === regle.entrepriseOuverte
                        ? "bg-white/5 font-semibold text-slate-100"
                        : "bg-white/5 text-slate-400"
                    }`}
                  >
                    {s.code === regle.entrepriseOuverte ? "Tous niveaux" : `Niveaux 1-${niveauMaxPour(regle, s.code)}`}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-sm leading-snug text-slate-400">{sec?.tagline}</p>

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
              aria-label={`Niveau ${l.level} · ${l.name}${reserve ? " · réservé aux établissements" : ""}`}
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
        // Les niveaux fermés ne sont pas un bouton muet : on dit pourquoi, ce que l'autre
        // entreprise offre, et où s'adresser.
        <div
          data-niveaux-reserves
          className="encadre-neutre mt-2 rounded-lg px-3 py-2.5 text-sm leading-snug text-slate-200"
        >
          <p>
            <Icone nom="verrou" className="mr-1.5 h-3.5 w-3.5" />
            <strong className="font-semibold text-slate-100">{messageNiveauxReserves(regle)}</strong>{" "}
            {scenarios.find((s) => s.code === regle.entrepriseOuverte)?.label ?? "L'entreprise vitrine"} se
            joue à tous les niveaux.
          </p>
          {liens ? (
            <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
              <a href={liens.contact.href} className="font-semibold text-slate-100 underline decoration-1 underline-offset-4">
                {liens.contact.libelle} →
              </a>
              <a href={liens.enseignant.href} className="font-semibold text-slate-100 underline decoration-1 underline-offset-4">
                {liens.enseignant.libelle} →
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
            ? `À ce niveau, ${sec.label} se joue en gamme : ${sec.variante.gamme}. En dessous du niveau ${sec.variante.gammeFromLevel}, ${sec.variante.mono}.`
            : `À ce niveau, ${sec.label} se joue avec ${sec.variante.mono}. À partir du niveau ${sec.variante.gammeFromLevel}, ${sec.variante.gamme}.`}
        </p>
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
                onClick={() => setPeriod(p.value)}
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
            {ROUNDS.map((r) => (
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

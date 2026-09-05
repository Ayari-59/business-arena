"use client";

import { useState } from "react";

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
  icon: string;
  label: string;
  tagline: string;
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

export function QuickConfigFields({
  scenarios,
  levels,
  defaultScenario,
}: {
  scenarios: QuickScenario[];
  levels: QuickLevel[];
  defaultScenario: string;
}) {
  const [scenario, setScenario] = useState(defaultScenario);
  const [level, setLevel] = useState(3);
  const [period, setPeriod] = useState<string>("quarter");
  const [companies, setCompanies] = useState<string>("3");
  const [rounds, setRounds] = useState<string>("");
  const [optionsOuvertes, setOptionsOuvertes] = useState(false);

  const minLevel = levels[0]?.level ?? 1;
  const maxLevel = levels[levels.length - 1]?.level ?? 6;
  const cur = levels.find((l) => l.level === level) ?? levels[0];
  const sec = scenarios.find((s) => s.code === scenario) ?? scenarios[0];
  const per = PERIODS.find((p) => p.value === period)!;
  const comp = COMPANIES.find((c) => c.value === companies)!;
  const round = ROUNDS.find((r) => r.value === rounds)!;

  const label = "text-xs font-medium uppercase tracking-wide text-slate-400";
  const tile =
    "cursor-pointer rounded-lg border border-white/10 bg-slate-950 px-2 py-2.5 text-center text-slate-100 transition hover:border-white/25";
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
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {scenarios.map((s) => {
          const on = s.code === scenario;
          return (
            <button
              key={s.code}
              type="button"
              onClick={() => setScenario(s.code)}
              aria-pressed={on}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition ${
                on
                  ? "border-amber-400 bg-amber-400/10 ring-1 ring-amber-400/40"
                  : "border-white/10 bg-slate-950 hover:-translate-y-0.5 hover:border-white/25"
              }`}
            >
              <span className="text-2xl leading-none">{s.icon}</span>
              <span className="text-xs font-semibold text-slate-100">{s.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs leading-snug text-slate-400">{sec?.tagline}</p>

      {/* 2 · Niveau */}
      <div className="mt-5 flex items-baseline justify-between gap-3">
        <p className={label}>Votre niveau de défi</p>
        <span className="text-xs tabular-nums text-slate-400">
          {cur ? `≈ ${cur.decisions} décisions / tour` : ""}
        </span>
      </div>
      <p className="mt-1 text-lg font-bold text-slate-50">
        Niveau <span className="text-amber-400">{level}</span> · {cur?.name}
      </p>
      <input
        type="range"
        min={minLevel}
        max={maxLevel}
        step={1}
        value={level}
        onChange={(e) => setLevel(Number(e.target.value))}
        aria-label="Niveau de difficulté"
        className="mt-2 w-full accent-amber-500"
      />
      <div className="flex justify-between">
        {levels.map((l) => (
          <button
            key={l.level}
            type="button"
            onClick={() => setLevel(l.level)}
            aria-label={`Niveau ${l.level} · ${l.name}`}
            className={`px-1 text-xs tabular-nums ${
              l.level === level ? "font-bold text-amber-300" : "text-slate-400 hover:text-slate-300"
            }`}
          >
            {l.level}
          </button>
        ))}
      </div>
      <p className="mt-2 min-h-[2.5em] text-[13px] leading-snug text-slate-300">{cur?.tagline}</p>

      {/* Options repliées.
          Volontairement un bouton + rendu conditionnel, PAS un <details> natif :
          le contenu d'un <details> fermé garde un DOM qui, sur le thème clair,
          ne reçoit pas l'inversion des variables de thème (fond resté sombre,
          texte inversé) et devenait illisible. Fermé = hors du DOM ; ouvert =
          rendu normal, contraste correct. */}
      <div className="mt-4 rounded-lg border border-dashed border-white/15 px-3">
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

      {/* Récap vivant */}
      <p className="mt-4 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2.5 text-[13px] text-slate-300">
        Vous lancez :{" "}
        <span className="font-semibold text-slate-100">
          {sec?.icon} {sec?.label}
        </span>{" "}
        · {per.short} · <span className="font-semibold text-slate-100">{comp.value}</span> entreprises ·{" "}
        <span className="font-semibold text-slate-100">{round.label.toLowerCase()}</span> · Niveau{" "}
        <span className="font-semibold text-slate-100">
          {level} {cur?.name}
        </span>
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DSO_SEUIL,
  JOURS_SANS_PERTE,
  PERTE_PAR_JOUR,
  cheminComplet,
  D,
  deltaAccepte,
  deltaReduit,
  deltaVexee,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type TableauDeBord,
} from "@/engine/episodes/trimestre-qui-derape";
import {
  DIAGNOSTICS,
  ETAPES,
  REPONSES_DE_DELTA,
  type Contexte,
  type Etape,
  type IdDiagnostic,
  type Message,
  type Source,
} from "@/config/episodes/trimestre-qui-derape";
import type { PartieJouee } from "@/pedagogy/episodes/bilan-du-trimestre";
import { bouton } from "@/components/bouton";
import { sansMolette } from "@/components/sans-molette";
import { TableauDeLAgence } from "./tableau-de-l-agence";
import { BilanDeLEpisode } from "./bilan-de-l-episode";
import { CourbeDuTrimestre, reperesDesDecisions } from "./courbe-du-trimestre";
import { euros, kE, nombre, taux } from "./format-episode";

/**
 * L'ÉPISODE « LE TRIMESTRE QUI DÉRAPE », JOUÉ DE BOUT EN BOUT.
 *
 * Une démonstration de la version pour les entreprises : rien n'est
 * enregistré, tout se calcule dans le navigateur. Chaque décision passe par
 * les mêmes temps qu'au bureau — le signal qui arrive, l'enquête qui coûte du
 * temps, le diagnostic, la décision, puis ses conséquences sur le tableau de
 * bord — et le bilan rejoue le trimestre pour séparer le choix du hasard.
 *
 * Le hasard se choisit dans l'adresse (`?hasard=12`) : deux personnes qui
 * jouent le même trimestre peuvent comparer leurs décisions, et les tests
 * jouent un trimestre connu.
 */

type Ecran = "intro" | "jeu" | "bilan";
type Phase = "signal" | "enquete" | "diagnostic" | "reevaluation" | "decision" | "consequence";

interface Etat {
  graine: number | null;
  ecran: Ecran;
  etape: number;
  phase: Phase;
  decisions: number[];
  consultes: string[][];
  /** Les jours d'enquête pris en semaine 1. */
  jours: number;
  diagnostic: { principal: IdDiagnostic | null; second: IdDiagnostic | "aucun" | null };
  reevaluation: { choix: "maintient" | "corrige" | null; principal: IdDiagnostic | null };
  prevision: { valeur: string; confiance: number };
  justifications: string[];
  choix: number | null;
  /** La semaine dont le tableau de bord montre la fin. */
  semaine: number;
  /** La lecture du tableau de bord juste avant la dernière décision, pour en montrer l'effet. */
  avant: TableauDeBord | null;
}

const nouvelEtat = (graine: number | null = null): Etat => ({
  graine,
  ecran: "intro",
  etape: 0,
  phase: "signal",
  decisions: [],
  consultes: ETAPES.map(() => []),
  jours: 0,
  diagnostic: { principal: null, second: null },
  reevaluation: { choix: null, principal: null },
  prevision: { valeur: "", confiance: 60 },
  justifications: [],
  choix: null,
  semaine: 0,
  avant: null,
});

/** Le hasard de l'adresse s'il y en a un, sinon un hasard neuf. */
function tirerUnHasard(): number {
  const demande = Number(new URLSearchParams(window.location.search).get("hasard"));
  if (Number.isInteger(demande) && demande > 0) return demande;
  return 1 + Math.floor(Math.random() * 9000);
}

const phasesDe = (etape: number): Phase[] =>
  etape === 0
    ? ["signal", "enquete", "diagnostic", "decision"]
    : etape === 1
      ? ["signal", "reevaluation", "enquete", "decision"]
      : ["signal", "decision"];

const NOMS_DES_PHASES: Record<Phase, string> = {
  signal: "Signal",
  enquete: "Enquête",
  diagnostic: "Diagnostic",
  reevaluation: "Réévaluation",
  decision: "Décision",
  consequence: "Conséquence",
};

/** « Remise de 5 % » devient « remise de 5 % » ; « Karim », plus loin dans la phrase, reste Karim. */
const enMinuscule = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

const previsionValide = (v: string) => {
  const n = Number(v.replace(",", "."));
  return v.trim() !== "" && Number.isFinite(n) && n >= 0 && n <= 100;
};

/* ------------------------------------------------------------------------- */

function Boite({ messages }: { messages: readonly Message[] }) {
  return (
    <ul className="carte divide-y divide-white/10 overflow-hidden p-0">
      {messages.map((m) => (
        <li
          key={m.de + m.texte}
          className={`grid gap-1 border-l-2 px-4 py-3.5 ${
            m.alerte ? "border-l-amber-400 bg-amber-400/5" : "border-l-transparent"
          }`}
        >
          <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-sm">
            <strong className="font-semibold text-slate-50">{m.de}</strong>
            <span className="text-slate-400">{m.role}</span>
            {m.heure && <time className="ml-auto tabular-nums text-slate-400">{m.heure}</time>}
          </p>
          <p className="max-w-2xl text-base leading-relaxed text-slate-200">{m.texte}</p>
        </li>
      ))}
    </ul>
  );
}

function CarteSource({
  source,
  ctx,
  vue,
  impossible,
  onConsulter,
}: {
  source: Source;
  ctx: Contexte;
  vue: boolean;
  impossible: boolean;
  onConsulter: () => void;
}) {
  return (
    <li className="carte overflow-hidden p-0">
      <button
        type="button"
        onClick={onConsulter}
        disabled={vue || impossible}
        aria-expanded={vue}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left transition enabled:hover:bg-white/5 disabled:cursor-default"
      >
        <span
          className={`font-semibold ${impossible && !vue ? "text-slate-400" : "text-slate-100"}`}
        >
          {source.titre}
        </span>
        <span
          className={`whitespace-nowrap text-sm tabular-nums ${vue ? "font-semibold text-emerald-300" : "text-slate-400"}`}
        >
          {vue
            ? "consulté"
            : impossible
              ? "plus le temps"
              : `${nombre(source.cout)} jour${source.cout > 1 ? "s" : ""}`}
        </span>
      </button>
      {vue && (
        <p className="max-w-2xl px-4 pb-4 text-base leading-relaxed text-slate-300">
          {typeof source.resultat === "function" ? source.resultat(ctx) : source.resultat}
        </p>
      )}
    </li>
  );
}

function Choix({
  nom,
  valeur,
  options,
  onChoisir,
  grande = false,
}: {
  nom: string;
  valeur: string | null;
  options: readonly { id: string; t: string; d?: string }[];
  onChoisir: (id: string) => void;
  grande?: boolean;
}) {
  return (
    <div className="grid gap-2">
      {options.map((o) => (
        <label
          key={o.id}
          className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-white/5 bg-slate-950 px-4 py-3 transition hover:border-white/25 has-[:checked]:border-amber-400 has-[:checked]:bg-amber-400/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-amber-400"
        >
          <input
            type="radio"
            name={nom}
            value={o.id}
            checked={valeur === o.id}
            onChange={() => onChoisir(o.id)}
            className="mt-1 shrink-0 accent-amber-400"
          />
          <span className="grid gap-0.5">
            <span className={grande ? "font-semibold text-slate-50" : "text-slate-100"}>{o.t}</span>
            {o.d && <span className="text-sm text-slate-400">{o.d}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}

function Suite({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={bouton({ taille: "l" })}
      >
        {children}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

export function EpisodeTrimestre() {
  const [s, setS] = useState<Etat>(() => nouvelEtat());
  // La partie terminée juste avant : le bilan suivant la met en regard.
  const [precedente, setPrecedente] = useState<PartieJouee | null>(null);
  const scene = useRef<HTMLDivElement>(null);
  const maj = (f: (e: Etat) => Partial<Etat>) => setS((e) => ({ ...e, ...f(e) }));

  // Chaque nouvel écran se lit depuis son haut : sur téléphone, le bouton
  // qu'on vient de toucher est en bas de l'écran précédent.
  const repere = `${s.ecran}-${s.etape}-${s.phase}`;
  useEffect(() => {
    const el = scene.current;
    if (!el || el.getBoundingClientRect().top >= 0) return;
    const doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "start", behavior: doux ? "smooth" : "auto" });
  }, [repere]);

  const graine = s.graine ?? 1;
  const tableau = useMemo(
    () => tableauDeBord(s.decisions, graine, s.jours, s.semaine),
    [s.decisions, graine, s.jours, s.semaine],
  );

  const commencer = (g: number | null) =>
    setS({ ...nouvelEtat(g ?? tirerUnHasard()), ecran: "jeu" });
  const suivante = () =>
    maj((e) => {
      const ps = phasesDe(e.etape);
      return { phase: ps[ps.indexOf(e.phase) + 1]! };
    });

  const consulter = (src: Source) =>
    maj((e) => {
      if (e.consultes[e.etape]!.includes(src.id)) return {};
      const consultes = e.consultes.map((c, i) => (i === e.etape ? [...c, src.id] : c));
      return { consultes, jours: e.etape === 0 ? e.jours + src.cout : e.jours };
    });

  const valider = () =>
    maj((e) => ({
      avant: tableau,
      decisions: [...e.decisions.slice(0, e.etape), e.choix!],
      semaine: ETAPES[e.etape]!.jusqua,
      phase: "consequence",
    }));

  const etapeSuivante = () =>
    maj((e) =>
      e.etape === ETAPES.length - 1
        ? { ecran: "bilan", avant: null }
        : { etape: e.etape + 1, phase: "signal", choix: null, avant: null },
    );

  const partieJouee: PartieJouee | null = useMemo(() => {
    if (s.ecran !== "bilan" || !s.diagnostic.principal || s.reevaluation.choix == null) return null;
    return {
      graine,
      chemin: cheminComplet(s.decisions),
      consultes: s.consultes,
      jours: s.jours,
      diagnostic: s.diagnostic.principal,
      reevaluation: { choix: s.reevaluation.choix, principal: s.reevaluation.principal },
      prevision: Number(s.prevision.valeur.replace(",", ".")),
      confiance: s.prevision.confiance,
    };
  }, [s, graine]);

  const etape = ETAPES[s.etape]!;
  const moment =
    s.ecran === "intro"
      ? "Avant de commencer"
      : s.ecran === "bilan"
        ? "Fin du trimestre"
        : etape.moment;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          <Link href="/entreprises" className="hover:text-slate-300">
            Entreprises
          </Link>{" "}
          / Épisode manager
        </p>
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-slate-400">
          Démonstration · données fictives
        </span>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm tabular-nums text-slate-400">{moment}</span>
          <ol className="flex gap-1.5" aria-label={`Avancement : ${ETAPES.length} décisions`}>
            {ETAPES.map((e, i) => {
              const fait = i < s.decisions.length;
              const enCours = !fait && i === s.etape && s.ecran === "jeu";
              return (
                <li
                  key={e.moment}
                  aria-label={`Décision ${i + 1}${fait ? ", prise" : enCours ? ", en cours" : ""}`}
                  className={`h-1.5 w-5 rounded-full ${
                    fait ? "bg-amber-400" : enCours ? "bg-amber-400/45" : "bg-slate-700"
                  }`}
                />
              );
            })}
          </ol>
          {s.ecran !== "intro" && (
            <button
              type="button"
              onClick={() => setS(nouvelEtat())}
              className="min-h-11 text-sm text-slate-400 underline underline-offset-4 hover:text-slate-200"
            >
              Recommencer
            </button>
          )}
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <aside
          className="lg:sticky lg:top-24 lg:order-last"
          aria-label="Tableau de bord de l'agence"
        >
          <TableauDeLAgence semaine={s.semaine} t={tableau} avant={s.avant} />
        </aside>

        <div ref={scene} className="grid min-w-0 scroll-mt-24 gap-5" aria-live="polite">
          {s.ecran === "intro" && <Intro onCommencer={() => commencer(null)} />}

          {s.ecran === "jeu" && (
            <>
              <header>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-300">
                  Décision {s.etape + 1} sur {ETAPES.length} · {etape.moment}
                </p>
                <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-slate-50 sm:text-4xl">
                  {etape.titre}
                </h1>
                <Fil etape={s.etape} phase={s.phase} />
              </header>
              <Scene
                s={s}
                etape={etape}
                tableau={tableau}
                maj={maj}
                suivante={suivante}
                consulter={consulter}
                valider={valider}
                etapeSuivante={etapeSuivante}
              />
            </>
          )}

          {s.ecran === "bilan" && partieJouee && (
            <BilanDeLEpisode
              partie={partieJouee}
              precedente={precedente}
              onAutreHasard={() => {
                setPrecedente(partieJouee);
                commencer(1 + Math.floor(Math.random() * 9000));
              }}
              onMemeHasard={() => {
                setPrecedente(partieJouee);
                commencer(graine);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Fil({ etape, phase }: { etape: number; phase: Phase }) {
  const ps = [...phasesDe(etape), "consequence" as const];
  const k = ps.indexOf(phase);
  return (
    <ol className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-400">
      {ps.map((p, j) => (
        <li
          key={p}
          aria-current={j === k ? "step" : undefined}
          className={`flex items-center gap-1.5 ${j === k ? "font-semibold text-slate-50" : ""}`}
        >
          <span
            aria-hidden="true"
            className={`inline-grid size-5 place-items-center rounded-full border text-xs ${
              j === k
                ? "border-amber-400 bg-amber-400 text-slate-950"
                : j < k
                  ? "border-white/15 bg-slate-800"
                  : "border-white/15"
            }`}
          >
            {j < k ? "✓" : j + 1}
          </span>
          {NOMS_DES_PHASES[p]}
        </li>
      ))}
    </ol>
  );
}

function Intro({ onCommencer }: { onCommencer: () => void }) {
  return (
    <section className="carte grid gap-5 p-5 sm:p-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-300">
          Épisode 1 · Pilotage commercial et marge
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl">
          Le trimestre qui dérape
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
          Vous êtes Claire Morel, cheffe de l&apos;agence de Lyon d&apos;Arvel Distribution,
          fournisseur des artisans du bâtiment. Votre équipe : sept commerciaux, une assistante, une
          administratrice des ventes.
        </p>
      </div>
      <div className="grid gap-3 border-y border-white/10 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Votre mandat pour le trimestre
        </h2>
        <ul className="grid gap-x-6 gap-y-2 text-slate-200 sm:grid-cols-2">
          <li>
            <strong className="font-display text-lg text-slate-50">1 200 k€</strong> de chiffre
            d&apos;affaires
          </li>
          <li>
            <strong className="font-display text-lg text-slate-50">30 %</strong> de marge brute au
            moins
          </li>
          <li>
            <strong className="font-display text-lg text-slate-50">40 k€</strong> de budget de
            remises
          </li>
          <li>
            Un délai de paiement des clients sous{" "}
            <strong className="font-display text-lg text-slate-50">{DSO_SEUIL} jours</strong>
          </li>
        </ul>
        <p className="max-w-2xl text-slate-300">
          Votre direction juge le trimestre sur la marge brute dégagée, moins le coût d&apos;un
          délai de paiement trop long.
        </p>
      </div>
      <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
        Six décisions, une vingtaine de minutes. Les chiffres bougent avec vos choix ; à la fin, le
        bilan rejoue chacune de vos décisions sous trente tirages du même hasard. Démonstration :
        rien de ce que vous saisissez n&apos;est enregistré.
      </p>
      <Suite onClick={onCommencer}>Commencer l&apos;épisode</Suite>
    </section>
  );
}

/* ------------------------------------------------------------------------- */

function Scene({
  s,
  etape,
  tableau,
  maj,
  suivante,
  consulter,
  valider,
  etapeSuivante,
}: {
  s: Etat;
  etape: Etape;
  tableau: TableauDeBord;
  maj: (f: (e: Etat) => Partial<Etat>) => void;
  suivante: () => void;
  consulter: (src: Source) => void;
  valider: () => void;
  etapeSuivante: () => void;
}) {
  const graine = s.graine ?? 1;
  const i = s.etape;
  const ecart = tableau.cible - tableau.ca;
  const contexte: Contexte = {
    transfo4: taux(tableau.transfo),
    marge: tableau.marge == null ? "—" : taux(tableau.marge),
    dso: nombre(tableau.dso, 0),
    ecart,
    ecartTxt: kE(ecart),
    reaffecte: s.decisions[D.karim] === 1,
  };

  if (s.phase === "signal") {
    const ensuite = phasesDe(i)[1];
    return (
      <>
        <Boite messages={etape.messages(contexte)} />
        <Suite onClick={suivante}>
          {ensuite === "decision" ? "Décider" : ensuite === "enquete" ? "Enquêter" : "Continuer"}
        </Suite>
      </>
    );
  }

  if (s.phase === "enquete") {
    const compte = i === 0 && etape.budget != null;
    const reste = compte ? etape.budget! - s.jours : 0;
    const perdu = Math.max(0, s.jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
    return (
      <>
        {compte ? (
          <div className="grid gap-2.5">
            <p className="max-w-2xl text-base leading-relaxed text-slate-200">
              <strong className="text-slate-50">
                Il vous reste {nombre(reste)} jour{reste > 1 ? "s" : ""} avant le point de vendredi.
              </strong>{" "}
              Chaque vérification prend du temps, et au-delà de deux jours d&apos;enquête, des
              affaires se signent ailleurs.
            </p>
            <div className="grid max-w-md grid-cols-10 gap-1" aria-hidden="true">
              {Array.from({ length: 10 }, (_, k) => (
                <span
                  key={k}
                  className={`h-2 rounded-sm border ${
                    k < s.jours * 2
                      ? k >= JOURS_SANS_PERTE * 2
                        ? "border-rose-400 bg-rose-400"
                        : "border-amber-400 bg-amber-400"
                      : "border-white/10 bg-slate-800"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-base text-slate-200">
            Que vérifiez-vous avant de décider ? Rien n&apos;est obligatoire.
          </p>
        )}
        <ul className="grid gap-2">
          {etape.sources.map((src) => {
            const vue = s.consultes[i]!.includes(src.id);
            return (
              <CarteSource
                key={src.id}
                source={src}
                ctx={contexte}
                vue={vue}
                impossible={compte && !vue && src.cout > reste + 1e-9}
                onConsulter={() => consulter(src)}
              />
            );
          })}
        </ul>
        {perdu > 0 && (
          <Boite
            messages={[
              {
                de: "Thomas Petit",
                role: "Commercial, secteur Centre",
                alerte: true,
                texte: `Pendant ce temps, l'affaire Cozzi (${euros(perdu)}) s'est signée chez Brico-Pro Rhône.`,
              },
            ]}
          />
        )}
        <Suite onClick={suivante}>{i === 0 ? "Poser mon diagnostic" : "Décider"}</Suite>
      </>
    );
  }

  if (s.phase === "diagnostic") {
    const d = s.diagnostic;
    return (
      <>
        <fieldset className="grid gap-2">
          <legend className="mb-2 font-semibold text-slate-50">
            Quel est le problème principal ?
          </legend>
          <Choix
            nom="principal"
            valeur={d.principal}
            options={DIAGNOSTICS}
            onChoisir={(id) =>
              maj((e) => ({
                diagnostic: {
                  principal: id as IdDiagnostic,
                  second: e.diagnostic.second === id ? null : e.diagnostic.second,
                },
              }))
            }
          />
        </fieldset>
        <fieldset className="grid gap-2">
          <legend className="mb-2 font-semibold text-slate-50">
            Un second problème ?{" "}
            <span className="ml-1 text-sm font-normal text-slate-400">facultatif</span>
          </legend>
          <Choix
            nom="second"
            valeur={d.second}
            options={[
              { id: "aucun", t: "Aucun autre" },
              ...DIAGNOSTICS.filter((x) => x.id !== d.principal),
            ]}
            onChoisir={(id) =>
              maj((e) => ({
                diagnostic: { ...e.diagnostic, second: id as IdDiagnostic | "aucun" },
              }))
            }
          />
        </fieldset>
        <Suite onClick={suivante} disabled={!d.principal}>
          Décider
        </Suite>
      </>
    );
  }

  if (s.phase === "reevaluation") {
    const avant = DIAGNOSTICS.find((x) => x.id === s.diagnostic.principal);
    const r = s.reevaluation;
    return (
      <>
        <p className="max-w-2xl text-base leading-relaxed text-slate-200">
          En semaine 1, vous avez retenu comme problème principal :{" "}
          <strong className="text-slate-50">« {avant?.t} »</strong>. Avec ce que vous savez
          maintenant, le maintenez-vous ?
        </p>
        <fieldset>
          <legend className="sr-only">Votre diagnostic de la semaine 1</legend>
          <Choix
            nom="reevaluation"
            valeur={r.choix}
            options={[
              { id: "maintient", t: "Je le maintiens" },
              { id: "corrige", t: "Je le corrige" },
            ]}
            onChoisir={(id) =>
              maj((e) => ({
                reevaluation: { ...e.reevaluation, choix: id as "maintient" | "corrige" },
              }))
            }
          />
        </fieldset>
        {r.choix === "corrige" && (
          <fieldset className="grid gap-2">
            <legend className="mb-2 font-semibold text-slate-50">
              Le problème principal, selon vous maintenant
            </legend>
            <Choix
              nom="reprincipal"
              valeur={r.principal}
              options={DIAGNOSTICS.filter((x) => x.id !== s.diagnostic.principal)}
              onChoisir={(id) =>
                maj((e) => ({ reevaluation: { ...e.reevaluation, principal: id as IdDiagnostic } }))
              }
            />
          </fieldset>
        )}
        <Suite
          onClick={suivante}
          disabled={!(r.choix === "maintient" || (r.choix === "corrige" && r.principal))}
        >
          Continuer
        </Suite>
      </>
    );
  }

  if (s.phase === "decision") {
    const avecSources = i >= 2 && etape.sources.length > 0;
    const previsionOk = !etape.prevision || previsionValide(s.prevision.valeur);
    return (
      <>
        {avecSources && (
          <>
            <p className="text-base text-slate-200">Avant de décider, vous pouvez vérifier :</p>
            <ul className="grid gap-2">
              {etape.sources.map((src) => (
                <CarteSource
                  key={src.id}
                  source={src}
                  ctx={contexte}
                  vue={s.consultes[i]!.includes(src.id)}
                  impossible={false}
                  onConsulter={() => consulter(src)}
                />
              ))}
            </ul>
          </>
        )}
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-lg font-semibold text-slate-50">{etape.question}</legend>
          <Choix
            nom="option"
            grande
            valeur={s.choix == null ? null : String(s.choix)}
            options={etape.options.map((o, k) => ({ id: String(k), t: o.t, d: o.d }))}
            onChoisir={(id) => maj(() => ({ choix: Number(id) }))}
          />
        </fieldset>
        <label className="grid gap-1.5">
          <span className="font-semibold text-slate-50">
            Pourquoi ce choix ?{" "}
            <span className="ml-1 text-sm font-normal text-slate-400">une phrase, facultatif</span>
          </span>
          <textarea
            rows={2}
            value={s.justifications[i] ?? ""}
            onChange={(ev) => {
              const v = ev.target.value;
              maj((e) => {
                const j = [...e.justifications];
                j[i] = v;
                return { justifications: j };
              });
            }}
            placeholder="Ce que vous attendez de cette décision"
            className="champ w-full px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-400"
          />
        </label>
        {etape.prevision && (
          <div className="carte grid gap-4 p-4 sm:grid-cols-2 sm:items-end">
            <label className="grid gap-1.5">
              <span className="font-semibold text-slate-50">
                Votre prévision : la transformation des devis en semaine 4
              </span>
              <span className="flex max-w-40 items-center gap-2">
                <input
                  type="number"
                  onWheel={sansMolette}
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.5}
                  value={s.prevision.valeur}
                  placeholder="34"
                  onChange={(ev) => {
                    const v = ev.target.value;
                    maj((e) => ({ prevision: { ...e.prevision, valeur: v } }));
                  }}
                  className="champ w-full px-3 py-2 text-base tabular-nums text-slate-100"
                />
                <span className="text-slate-300">%</span>
              </span>
            </label>
            <label className="grid gap-1.5">
              <span className="font-semibold text-slate-50">
                Votre confiance :{" "}
                <output className="tabular-nums">{s.prevision.confiance} %</output>
              </span>
              <input
                type="range"
                onWheel={sansMolette}
                min={10}
                max={100}
                step={10}
                value={s.prevision.confiance}
                onChange={(ev) => {
                  const v = Number(ev.target.value);
                  maj((e) => ({ prevision: { ...e.prevision, confiance: v } }));
                }}
                className="w-full accent-amber-400"
              />
            </label>
          </div>
        )}
        <Suite onClick={valider} disabled={s.choix == null || !previsionOk}>
          Valider la décision
        </Suite>
      </>
    );
  }

  // Conséquence
  const de = i === 0 ? 1 : ETAPES[i - 1]!.jusqua + 1;
  const t = simuler(cheminComplet(s.decisions), graine, s.jours);
  const semaines = t.semaines.slice(de, etape.jusqua + 1) as Semaine[];
  const ca = semaines.reduce((x, w) => x + w.ca, 0);
  const marge = semaines.reduce((x, w) => x + w.marge, 0);
  const choix = s.decisions[i]!;
  let reactions = etape.reactions[choix] ?? [];
  if (i === D.delta && choix === 1) {
    reactions = [
      {
        de: "Achats, Groupe Delta",
        role: "Grand compte",
        alerte: deltaVexee(graine),
        texte: deltaAccepte(graine)
          ? REPONSES_DE_DELTA.accepte
          : deltaVexee(graine)
            ? REPONSES_DE_DELTA.vexee
            : REPONSES_DE_DELTA.refuseContreProposition,
      },
    ];
  }
  if (i === D.delta && choix === 2) {
    reactions = [
      {
        de: "Achats, Groupe Delta",
        role: "Grand compte",
        texte: deltaReduit(graine) ? REPONSES_DE_DELTA.reduit : REPONSES_DE_DELTA.maintient,
      },
    ];
  }
  // Ce qui est arrivé pendant ces semaines : l'arrêt de Julie, qui découle de
  // décisions prises, et les imprévus, qui n'en découlent pas. Les seconds sont
  // posés à part, sous un titre qui le dit.
  const arrive = evenements(cheminComplet(s.decisions), graine, de, etape.jusqua);
  if (arrive.arret) {
    reactions = [
      ...reactions,
      {
        de: "Ressources humaines",
        role: "Siège",
        heure: "sem. 8",
        alerte: true,
        texte:
          "Julie Roux est en arrêt de travail pour quatre semaines. Ses clients n'ont plus d'interlocuteur jusqu'à la semaine 11.",
      },
    ];
  }
  const imprevus: Message[] = arrive.imprevus.map(({ imprevu, semaine }) => ({
    de: imprevu.de,
    role: imprevu.role,
    heure: `sem. ${semaine}`,
    texte: imprevu.texte,
  }));
  const derniere = i === ETAPES.length - 1;
  return (
    <>
      <p className="max-w-2xl text-base leading-relaxed text-slate-200">
        <strong className="text-slate-50">
          Semaines {de} à {etape.jusqua}.
        </strong>{" "}
        Vous avez choisi : {enMinuscule(etape.options[choix]!.t)}.
      </p>
      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          ["Chiffre d'affaires", kE(ca)],
          ["Marge brute", taux(marge / ca)],
          [`Transformation, sem. ${etape.jusqua}`, taux(t.semaines[etape.jusqua]!.transfo)],
        ].map(([nom, valeur]) => (
          <div key={nom} className="carte min-w-0 px-3 py-2.5 sm:px-4 sm:py-3">
            <dt className="text-sm text-slate-400">{nom}</dt>
            <dd className="font-display text-lg font-semibold tabular-nums text-slate-50 sm:text-xl">
              {valeur}
            </dd>
          </div>
        ))}
      </dl>
      <CourbeDuTrimestre
        semaines={t.semaines}
        jouees={etape.jusqua}
        surbrillance={[de, etape.jusqua]}
        reperes={reperesDesDecisions(i + 1)}
        imprevus={hasard(graine).imprevus.map((x) => ({
          semaine: x.semaine,
          titre: x.imprevu.titre,
        }))}
      />
      <Boite messages={reactions} />
      {imprevus.length > 0 && (
        <section aria-labelledby="imprevus-titre" className="grid gap-2">
          <h2
            id="imprevus-titre"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400"
          >
            Pendant ce temps, sans rapport avec vos décisions
          </h2>
          <Boite messages={imprevus} />
        </section>
      )}
      <Suite onClick={etapeSuivante}>{derniere ? "Voir le bilan" : "Continuer"}</Suite>
    </>
  );
}

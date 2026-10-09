"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type {
  Contexte,
  Episode,
  Etape,
  Lecture,
  Message,
  PartieJouee,
  Resultat,
  Source,
} from "@/config/episodes/types";
import { episodeParCode } from "@/pedagogy/episodes/registre";
import { bouton } from "@/components/bouton";
import { sansMolette } from "@/components/sans-molette";
import { LigneDuTableau, TableauDeBord } from "./tableau-de-bord";
import { hautDesBarres } from "@/components/ardoise-repliee";
import { VerdictDuMarche, type SensDUnEcart } from "@/components/verdict-du-marche";
import { BilanDeLEpisode } from "./bilan-de-l-episode";
import { CourbeDesSemaines, reperesDesDecisions } from "./courbe-des-semaines";
import { nombre } from "@/config/episodes/format";
import {
  NIVEAUX,
  NIVEAU_PAR_DEFAUT,
  REPERES,
  budgetDEnquete,
  niveauParCode,
  sourcesProposees,
  verificationPossible,
  type CodeNiveau,
  type TempsDeDecision,
} from "@/config/episodes/niveaux";
import { effetDuChoix } from "@/pedagogy/episodes/retour-immediat";

/**
 * UN ÉPISODE MANAGER, JOUÉ DE BOUT EN BOUT.
 *
 * Une démonstration de la version pour les entreprises : tout se calcule dans
 * le navigateur, et seuls les faits de la partie terminée sont gardés, pour
 * le profil décisionnel (aucun texte saisi). Chaque décision passe par
 * les mêmes temps qu'au bureau — le signal qui arrive, l'enquête qui coûte du
 * temps, le diagnostic, la décision, puis ses conséquences sur le tableau de
 * bord — et le bilan rejoue le trimestre pour séparer le choix du hasard.
 *
 * Le hasard se choisit dans l'adresse (`?hasard=12`) : deux personnes qui
 * jouent le même trimestre peuvent comparer leurs décisions, et les tests
 * jouent un trimestre connu. Le niveau aussi (`?niveau=expert`) : il change ce
 * que le manager sait et voit, jamais le trimestre ni le jugement du bilan.
 *
 * Le composant ne connaît aucun épisode : il lit celui qu'on lui nomme dans
 * le registre, et tout ce qui est propre au métier vient de sa définition.
 */

type Ecran = "intro" | "jeu" | "bilan";
type Phase = "signal" | "enquete" | "diagnostic" | "reevaluation" | "decision" | "consequence";

interface Etat {
  graine: number | null;
  /** Tirée au début de la partie : le serveur ne la garde qu'une fois, même si le bilan se recharge. */
  cle: string | null;
  /** Le niveau choisi ; `null` tant que la personne n'a rien choisi. */
  niveau: CodeNiveau | null;
  ecran: Ecran;
  etape: number;
  phase: Phase;
  decisions: number[];
  consultes: string[][];
  /** Les jours d'enquête pris en semaine 1. */
  jours: number;
  diagnostic: { principal: string | null; second: string | null };
  reevaluation: { choix: "maintient" | "corrige" | null; principal: string | null };
  prevision: { valeur: string; confiance: number };
  justifications: string[];
  choix: number | null;
  /** La semaine dont le tableau de bord montre la fin. */
  semaine: number;
  /** La lecture du tableau de bord juste avant la dernière décision, pour en montrer l'effet. */
  avant: Lecture | null;
}

const nouvelEtat = (
  ep: Episode,
  graine: number | null = null,
  niveau: CodeNiveau | null = null,
  cle: string | null = null,
): Etat => ({
  graine,
  cle,
  niveau,
  ecran: "intro",
  etape: 0,
  phase: "signal",
  decisions: [],
  consultes: ep.etapes.map(() => []),
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

/** Une clé de partie : un identifiant aléatoire, même hors d'un contexte sécurisé. */
function nouvelleCle(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const o = crypto.getRandomValues(new Uint8Array(16));
  o[6] = (o[6]! & 0x0f) | 0x40;
  o[8] = (o[8]! & 0x3f) | 0x80;
  const h = [...o].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Le niveau demandé dans l'adresse, s'il existe. */
function niveauDeLAdresse(): CodeNiveau | null {
  const demande = new URLSearchParams(window.location.search).get("niveau");
  return NIVEAUX.some((n) => n.code === demande) ? (demande as CodeNiveau) : null;
}

/** L'adresse ne change pas pendant la partie : rien à écouter. */
const sansAbonnement = () => () => {};

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

const previsionValide = (ep: Episode, v: string) => {
  const n = Number(v.replace(",", "."));
  return v.trim() !== "" && Number.isFinite(n) && n >= ep.prevision.min && n <= ep.prevision.max;
};

/* ------------------------------------------------------------------------- */

function Boite({ messages }: { messages: readonly Message[] }) {
  return (
    <ul className="carte divide-y divide-white/10 overflow-hidden p-0">
      {messages.map((m) => (
        <li
          key={m.de + m.texte}
          className={`grid gap-1 border-l-2 px-4 py-3.5 ${
            // Un message d'alerte : le filet rouge franc sur le voile neutre
            // (il était orange, la couleur de l'action).
            m.alerte ? "voile-neutre border-l-red-400" : "border-l-transparent"
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

/** Un repère de méthode, au niveau Découverte. */
function Repere({ temps }: { temps: TempsDeDecision }) {
  return (
    <p className="encadre-neutre max-w-2xl rounded-lg px-4 py-3 text-sm leading-relaxed text-slate-200">
      <strong className="font-semibold text-slate-100">Repère · </strong>
      {REPERES[temps]}
    </p>
  );
}

function CarteSource({
  source,
  ctx,
  vue,
  impossible,
  pourquoi = "plus le temps",
  onConsulter,
}: {
  source: Source;
  ctx: Contexte;
  vue: boolean;
  impossible: boolean;
  /** Ce qu'on affiche quand la vérification n'est plus possible. */
  pourquoi?: string;
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
          className={`whitespace-nowrap text-sm tabular-nums ${vue ? "font-semibold text-slate-200" : "text-slate-400"}`}
        >
          {vue
            ? "consulté"
            : impossible
              ? pourquoi
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

export function EpisodeJoue({ code }: { code: string }) {
  const ep = episodeParCode(code)!;
  const [s, setS] = useState<Etat>(() => nouvelEtat(ep));
  // Le niveau de l'adresse ne se lit que dans le navigateur ; au rendu serveur,
  // c'est le niveau par défaut.
  const demande = useSyncExternalStore(sansAbonnement, niveauDeLAdresse, () => null);
  const choisi: CodeNiveau = s.niveau ?? demande ?? NIVEAU_PAR_DEFAUT;
  const niveau = niveauParCode(choisi);
  // La partie terminée juste avant : le bilan suivant la met en regard.
  const [precedente, setPrecedente] = useState<PartieJouee | null>(null);
  const scene = useRef<HTMLDivElement>(null);
  const maj = (f: (e: Etat) => Partial<Etat>) => setS((e) => ({ ...e, ...f(e) }));

  // Chaque nouvel écran se lit depuis son haut : sur téléphone, le bouton
  // qu'on vient de toucher est en bas de l'écran précédent. Le seuil est la
  // marge de défilement de la scène, pas le bord de la fenêtre : l'en-tête
  // collant couvre le haut de page, et un titre posé juste dessous en
  // dépassait de quelques pixels sans que rien ne remonte — c'est ce qui
  // arrivait après « Commencer l'épisode ».
  const repere = `${s.ecran}-${s.etape}-${s.phase}`;
  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    const marge = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    if (el.getBoundingClientRect().top >= marge) return;
    const doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "start", behavior: doux ? "smooth" : "auto" });
  }, [repere]);

  const graine = s.graine ?? 1;
  const tableau = useMemo(
    () => ep.lire(s.decisions, graine, s.jours, s.semaine),
    [ep, s.decisions, graine, s.jours, s.semaine],
  );

  const commencer = (g: number | null) =>
    setS((e) => ({
      ...nouvelEtat(ep, g ?? tirerUnHasard(), e.niveau ?? choisi, nouvelleCle()),
      ecran: "jeu",
    }));
  const suivante = () =>
    maj((e) => {
      const ps = phasesDe(e.etape);
      return { phase: ps[ps.indexOf(e.phase) + 1]! };
    });

  const consulter = (src: Source) =>
    maj((e) => {
      if (e.consultes[e.etape]!.includes(src.id)) return {};
      if (!verificationPossible(niveauParCode(e.niveau), e.etape, e.consultes[e.etape]!.length)) {
        return {};
      }
      const consultes = e.consultes.map((c, i) => (i === e.etape ? [...c, src.id] : c));
      return { consultes, jours: e.etape === 0 ? e.jours + src.cout : e.jours };
    });

  const valider = () =>
    maj((e) => ({
      avant: tableau,
      decisions: [...e.decisions.slice(0, e.etape), e.choix!],
      semaine: ep.etapes[e.etape]!.jusqua,
      phase: "consequence",
    }));

  const etapeSuivante = () =>
    maj((e) =>
      e.etape === ep.etapes.length - 1
        ? { ecran: "bilan", avant: null }
        : { etape: e.etape + 1, phase: "signal", choix: null, avant: null },
    );

  const partieJouee: PartieJouee | null = useMemo(() => {
    if (s.ecran !== "bilan" || !s.diagnostic.principal || s.reevaluation.choix == null) return null;
    return {
      graine,
      chemin: ep.neutre.map((n, i) => s.decisions[i] ?? n),
      consultes: s.consultes,
      jours: s.jours,
      diagnostic: s.diagnostic.principal,
      reevaluation: { choix: s.reevaluation.choix, principal: s.reevaluation.principal },
      prevision: Number(s.prevision.valeur.replace(",", ".")),
      confiance: s.prevision.confiance,
      niveau: choisi,
    };
  }, [ep, s, graine, choisi]);

  const etape = ep.etapes[s.etape]!;
  // L'EN-TÊTE SUIT L'ÉTAPE AFFICHÉE. À la conséquence, le tableau de bord dit
  // « fin de semaine 2 » : l'en-tête disait encore « Semaine 1 · lundi », le
  // moment de la décision qu'on vient de prendre.
  const consequence = s.ecran === "jeu" && s.phase === "consequence";
  const moment =
    s.ecran === "intro"
      ? "Avant de commencer"
      : s.ecran === "bilan"
        ? "Fin du trimestre"
        : consequence
          ? `Fin de semaine ${etape.jusqua}`
          : etape.moment;

  // Où coller la ligne du tableau de bord sur téléphone : sous l'en-tête du
  // site, dont la hauteur se mesure (elle change avec la largeur).
  const [haut, setHaut] = useState(0);
  useEffect(() => {
    const mesurer = () => setHaut(hautDesBarres());
    mesurer();
    window.addEventListener("resize", mesurer);
    window.addEventListener("scroll", mesurer, { passive: true });
    return () => {
      window.removeEventListener("resize", mesurer);
      window.removeEventListener("scroll", mesurer);
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <p className="text-xs uppercase tracking-annonce text-slate-400">
          <Link href="/entreprises/episode" className="hover:text-slate-300">
            Épisodes manager
          </Link>{" "}
          / {ep.numero}
        </p>
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-slate-400">
          Démonstration · données fictives
        </span>
        {s.ecran !== "intro" && (
          <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
            Niveau {niveau.nom}
          </span>
        )}
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm tabular-nums text-slate-400">{moment}</span>
          <ol className="flex gap-1.5" aria-label={`Avancement : ${ep.etapes.length} décisions`}>
            {ep.etapes.map((e, i) => {
              const fait = i < s.decisions.length;
              const enCours = !fait && i === s.etape && s.ecran === "jeu";
              return (
                <li
                  key={e.moment}
                  aria-label={`Décision ${i + 1}${fait ? ", prise" : enCours ? ", en cours" : ""}`}
                  className={`h-1.5 w-5 rounded-full ${
                    // L'avancement est un état : l'encre, pas l'orange de l'action.
                    fait ? "bg-slate-200" : enCours ? "bg-slate-500" : "bg-slate-700"
                  }`}
                />
              );
            })}
          </ol>
          {s.ecran !== "intro" && (
            <button
              type="button"
              onClick={() => setS((e) => nouvelEtat(ep, null, e.niveau))}
              className="min-h-11 text-sm text-slate-400 underline underline-offset-4 hover:text-slate-200"
            >
              Recommencer
            </button>
          )}
        </div>
      </div>

      {/* Sur téléphone, le tableau de bord tient en une ligne collée sous
          l'en-tête, et le récit passe en premier. */}
      <LigneDuTableau
        nom={ep.nomDuTableau}
        indicateurs={ep.indicateurs}
        semaine={s.semaine}
        lecture={tableau}
        avant={s.avant}
        haut={haut}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <aside
          className="max-lg:hidden lg:sticky lg:top-24 lg:order-last"
          aria-label={`Tableau de bord : ${ep.nomDuTableau.toLowerCase()}`}
        >
          <TableauDeBord
            nom={ep.nomDuTableau}
            indicateurs={ep.indicateurs}
            semaine={s.semaine}
            lecture={tableau}
            avant={s.avant}
          />
        </aside>

        <div ref={scene} className="grid min-w-0 scroll-mt-24 gap-5" aria-live="polite">
          {s.ecran === "intro" && (
            <Intro
              ep={ep}
              niveau={choisi}
              onNiveau={(n) => maj(() => ({ niveau: n }))}
              onCommencer={() => commencer(null)}
            />
          )}

          {s.ecran === "jeu" && (
            <>
              <header>
                <p className="text-sm font-semibold uppercase tracking-etiquette text-amber-300">
                  Décision {s.etape + 1} sur {ep.etapes.length} · {moment}
                </p>
                <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-slate-50 sm:text-4xl">
                  {etape.titre}
                </h1>
                <Fil etape={s.etape} phase={s.phase} />
              </header>
              <Scene
                ep={ep}
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
              ep={ep}
              partie={partieJouee}
              cle={s.cle}
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
                ? "border-slate-200 bg-slate-200 text-slate-900"
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

function Intro({
  ep,
  niveau,
  onNiveau,
  onCommencer,
}: {
  ep: Episode;
  niveau: CodeNiveau;
  onNiveau: (n: CodeNiveau) => void;
  onCommencer: () => void;
}) {
  return (
    <section className="carte grid gap-5 p-5 sm:p-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-etiquette text-amber-300">
          Épisode {ep.numero} · {ep.domaine}
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl">
          {ep.titre}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">{ep.persona}</p>
      </div>
      <div className="grid gap-3 border-y border-white/10 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-etiquette text-slate-400">
          Votre mandat pour le trimestre
        </h2>
        <ul className="grid gap-x-6 gap-y-2 text-slate-200 sm:grid-cols-2">
          {ep.mandat.map((m) => (
            <li key={m.texte}>
              <strong className="font-display text-lg text-slate-50">{m.fort}</strong> {m.texte}
            </li>
          ))}
        </ul>
        <p className="max-w-2xl text-slate-300">{ep.jugement}</p>
      </div>
      <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
        {ep.etapes.length} décisions, {ep.duree}. Les chiffres bougent avec vos choix ; à la fin, le
        bilan rejoue chacune de vos décisions sous trente tirages du même hasard. À la fin, vos
        choix sont gardés sur cet appareil pour votre profil décisionnel, sans votre nom ni aucun
        texte saisi ; vous pouvez les effacer depuis le profil.
      </p>
      <fieldset className="grid gap-2">
        <legend className="mb-1 font-semibold text-slate-50">Niveau</legend>
        <p className="mb-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Le niveau change ce que vous savez et voyez, pas le trimestre : le bilan juge vos
          décisions de la même façon à tous les niveaux.
        </p>
        <Choix
          nom="niveau"
          valeur={niveau}
          options={NIVEAUX.map((n) => ({ id: n.code, t: n.nom, d: n.resume }))}
          onChoisir={(id) => onNiveau(id as CodeNiveau)}
        />
      </fieldset>
      <Suite onClick={onCommencer}>Commencer l&apos;épisode</Suite>
    </section>
  );
}

/* ------------------------------------------------------------------------- */

function Scene({
  ep,
  s,
  etape,
  tableau,
  maj,
  suivante,
  consulter,
  valider,
  etapeSuivante,
}: {
  ep: Episode;
  s: Etat;
  etape: Etape;
  tableau: Lecture;
  maj: (f: (e: Etat) => Partial<Etat>) => void;
  suivante: () => void;
  consulter: (src: Source) => void;
  valider: () => void;
  etapeSuivante: () => void;
}) {
  const graine = s.graine ?? 1;
  const i = s.etape;
  const contexte: Contexte = ep.contexte(tableau, s.decisions);
  const niveau = niveauParCode(s.niveau);
  const sources = sourcesProposees(niveau, etape);
  const vues = s.consultes[i]!;
  const encore = verificationPossible(niveau, i, vues.length);
  const repere = (temps: TempsDeDecision) => niveau.reperes && <Repere temps={temps} />;

  if (s.phase === "signal") {
    const ensuite = phasesDe(i)[1];
    return (
      <>
        {repere("signal")}
        <Boite messages={etape.messages(contexte)} />
        <Suite onClick={suivante}>
          {ensuite === "decision" ? "Décider" : ensuite === "enquete" ? "Enquêter" : "Continuer"}
        </Suite>
      </>
    );
  }

  if (s.phase === "enquete") {
    const budget = budgetDEnquete(niveau, ep, etape);
    const compte = i === 0 && budget != null;
    const reste = compte ? budget! - s.jours : 0;
    const perte = ep.enquete.perte(s.jours);
    const echeance = ep.enquete.echeance ?? "le point de vendredi";
    return (
      <>
        {repere("enquete")}
        {compte ? (
          <div className="grid gap-2.5">
            <p className="max-w-2xl text-base leading-relaxed text-slate-200">
              <strong className="text-slate-50">
                Il vous reste {nombre(reste)} jour{reste > 1 ? "s" : ""} avant {echeance}.
              </strong>{" "}
              {ep.enquete.consigne}
            </p>
            <div
              className="grid max-w-md gap-1"
              style={{ gridTemplateColumns: `repeat(${Math.round(budget! * 2)}, minmax(0, 1fr))` }}
              aria-hidden="true"
            >
              {Array.from({ length: Math.round(budget! * 2) }, (_, k) => (
                <span
                  key={k}
                  className={`h-2 rounded-md border ${
                    k < s.jours * 2
                      ? k >= ep.enquete.joursSansPerte * 2
                        ? "border-red-400 bg-red-400"
                        : "border-[var(--donnee)] bg-[var(--donnee)]"
                      : "border-white/10 bg-slate-800"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-base text-slate-200">
            Que vérifiez-vous avant de décider ? Rien n&apos;est obligatoire.
            {niveau.verificationsParDecision === 1 &&
              " Vous n'avez le temps que d'une vérification."}
          </p>
        )}
        <ul className="grid gap-2">
          {sources.map((src) => {
            const vue = vues.includes(src.id);
            return (
              <CarteSource
                key={src.id}
                source={src}
                ctx={contexte}
                vue={vue}
                impossible={!vue && ((compte && src.cout > reste + 1e-9) || !encore)}
                pourquoi={compte ? "plus le temps" : "une seule vérification"}
                onConsulter={() => consulter(src)}
              />
            );
          })}
        </ul>
        {perte && <Boite messages={[perte]} />}
        <Suite onClick={suivante}>{i === 0 ? "Poser mon diagnostic" : "Décider"}</Suite>
      </>
    );
  }

  if (s.phase === "diagnostic") {
    const d = s.diagnostic;
    return (
      <>
        {repere("diagnostic")}
        <fieldset className="grid gap-2">
          <legend className="mb-2 font-semibold text-slate-50">
            Quel est le problème principal ?
          </legend>
          <Choix
            nom="principal"
            valeur={d.principal}
            options={ep.diagnostics}
            onChoisir={(id) =>
              maj((e) => ({
                diagnostic: {
                  principal: id,
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
              ...ep.diagnostics.filter((x) => x.id !== d.principal),
            ]}
            onChoisir={(id) =>
              maj((e) => ({
                diagnostic: { ...e.diagnostic, second: id },
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
    const avant = ep.diagnostics.find((x) => x.id === s.diagnostic.principal);
    const r = s.reevaluation;
    return (
      <>
        {repere("reevaluation")}
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
              options={ep.diagnostics.filter((x) => x.id !== s.diagnostic.principal)}
              onChoisir={(id) =>
                maj((e) => ({ reevaluation: { ...e.reevaluation, principal: id } }))
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
    const avecSources = i >= 2 && sources.length > 0;
    const previsionOk = !etape.prevision || previsionValide(ep, s.prevision.valeur);
    return (
      <>
        {repere("decision")}
        {avecSources && (
          <>
            <p className="text-base text-slate-200">
              Avant de décider, vous pouvez vérifier
              {niveau.verificationsParDecision === 1 ? " une chose :" : " :"}
            </p>
            <ul className="grid gap-2">
              {sources.map((src) => {
                const vue = vues.includes(src.id);
                return (
                  <CarteSource
                    key={src.id}
                    source={src}
                    ctx={contexte}
                    vue={vue}
                    impossible={!vue && !encore}
                    pourquoi="une seule vérification"
                    onConsulter={() => consulter(src)}
                  />
                );
              })}
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
            className="champ champ-facultatif w-full px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-400"
          />
        </label>
        {etape.prevision && (
          <div className="carte grid gap-4 p-4 sm:grid-cols-2 sm:items-end">
            <label className="grid gap-1.5">
              <span className="font-semibold text-slate-50">
                Votre prévision : {ep.prevision.libelle}
              </span>
              <span className="flex max-w-40 items-center gap-2">
                <input
                  type="number"
                  onWheel={sansMolette}
                  inputMode="decimal"
                  min={ep.prevision.min}
                  max={ep.prevision.max}
                  step={ep.prevision.step}
                  value={s.prevision.valeur}
                  placeholder={ep.prevision.placeholder}
                  onChange={(ev) => {
                    const v = ev.target.value;
                    maj((e) => ({ prevision: { ...e.prevision, valeur: v } }));
                  }}
                  className="champ w-full px-3 py-2 text-base tabular-nums text-slate-100"
                />
                <span className="text-slate-300">{ep.prevision.unite}</span>
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
  const de = i === 0 ? 1 : ep.etapes[i - 1]!.jusqua + 1;
  const chemin = ep.neutre.map((n, k) => s.decisions[k] ?? n);
  const t = ep.simuler(chemin, graine, s.jours);
  const choix = s.decisions[i]!;
  // Ce qui est arrivé pendant ces semaines : les suites de décisions prises,
  // et les imprévus, qui n'en découlent pas. Les seconds sont posés à part,
  // sous un titre qui le dit.
  const arrive = ep.evenements(chemin, graine, de, etape.jusqua);
  // En Expert, les imprévus arrivent avec le reste : à chacun de faire la part
  // de la chance et de ses choix.
  const reactions: Message[] = [
    ...(ep.reactions(i, choix, graine) ?? etape.reactions[choix] ?? []),
    ...arrive.lies,
    ...(niveau.imprevusSignales ? [] : arrive.imprevus),
  ];
  const effet = niveau.retourImmediat ? effetDuChoix(ep, s.decisions, i, graine, s.jours) : null;
  const kE = ep.bilan.formatObjectif;
  const derniere = i === ep.etapes.length - 1;
  const verdict = verdictDesSemaines(ep, t.semaines, de, etape.jusqua);
  return (
    <>
      {/*
        LA CONSÉQUENCE, DANS LA GRAMMAIRE DU « MARCHÉ RÉPOND ». Une bande marine
        en tête de l'écran : le chiffre clé des semaines jouées (celui de la
        courbe du trimestre), son écart à la cible que l'épisode déclare (le
        budget, l'objectif), et ce qu'on a choisi. Les cartes de l'indicateur,
        juste dessous, ne disaient pas qu'on était sous le budget.
      */}
      <section
        aria-label="Conséquence de votre décision"
        className="ardoise rounded-xl bg-slate-950 px-4 py-4 text-slate-100 sm:px-6 sm:py-5"
      >
        <VerdictDuMarche
          forme="bande"
          surtitre={`${ep.nomDuTableau} · conséquence`}
          titre={`Semaines ${de} à ${etape.jusqua} · le verdict`}
          chiffre={{
            libelle: verdict.libelle,
            valeur: verdict.valeur,
            sens: null,
            ...(verdict.nombre === null ? {} : { nombre: verdict.nombre, ecrire: verdict.ecrire }),
          }}
          ecart={verdict.ecart}
          phrase={`Vous avez choisi : ${enMinuscule(etape.options[choix]!.t)}.`}
        />
      </section>
      {niveau.retourImmediat && (
        <p className="encadre-neutre max-w-2xl rounded-lg px-4 py-3 text-sm leading-relaxed text-slate-200">
          <strong className="font-semibold text-slate-100">Retour immédiat · </strong>
          {effet
            ? `Sur ce trimestre-ci, ce choix ${effet.ecart >= 0 ? "rapporte" : "coûte"} ${kE(
                Math.abs(effet.ecart),
              )} par rapport à « ${enMinuscule(etape.options[effet.reference]!.t)} ». C'est un seul tirage du hasard : le bilan dira ce que ce choix vaut en moyenne.`
            : "Vous avez choisi de ne rien changer : le trimestre suit son cours. Le bilan dira si c'était le bon choix."}
        </p>
      )}
      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        {ep.recap(t, de, etape.jusqua).map(([nom, valeur]) => (
          <div key={nom} className="carte min-w-0 px-3 py-2.5 sm:px-4 sm:py-3">
            <dt className="text-sm text-slate-400">{nom}</dt>
            <dd className="font-display text-lg font-semibold tabular-nums text-slate-50 sm:text-xl">
              {valeur}
            </dd>
          </div>
        ))}
      </dl>
      <CourbeDesSemaines
        courbe={ep.courbe}
        semaines={t.semaines}
        jouees={etape.jusqua}
        surbrillance={[de, etape.jusqua]}
        reperes={reperesDesDecisions(ep, i + 1)}
        imprevus={niveau.imprevusSignales ? ep.imprevus(graine) : []}
      />
      <Boite messages={reactions} />
      {niveau.imprevusSignales && arrive.imprevus.length > 0 && (
        <section aria-labelledby="imprevus-titre" className="grid gap-2">
          <h2
            id="imprevus-titre"
            className="text-xs font-semibold uppercase tracking-etiquette text-slate-400"
          >
            Pendant ce temps, sans rapport avec vos décisions
          </h2>
          <Boite messages={arrive.imprevus} />
        </section>
      )}
      <Suite onClick={etapeSuivante}>{derniere ? "Voir le bilan" : "Continuer"}</Suite>
    </>
  );
}

/**
 * LE CHIFFRE CLÉ DES SEMAINES JOUÉES, ET SON ÉCART À LA CIBLE.
 *
 * Tout vient de la définition de l'épisode, rien n'est inventé : la grandeur
 * est celle de sa courbe (`courbe.cle`), moyennée sur les semaines que la
 * décision a couvertes ; la cible est la cadence que la courbe trace déjà
 * (`courbe.cible`, nommée par `courbe.libelleCible` : un budget, un objectif,
 * un plafond). Le sens de l'écart (bon ou mauvais) est celui de l'indicateur
 * du tableau de bord qui suit la même grandeur ; quand aucun ne la suit,
 * l'écart reste écrit avec son signe, à l'encre, sans vert ni rouge.
 */
function verdictDesSemaines(
  ep: Episode,
  semaines: Resultat["semaines"],
  de: number,
  a: number,
): {
  libelle: string;
  valeur: string;
  /** Le nombre derrière la valeur, pour qu'elle MONTE au lieu de s'imprimer. */
  nombre: number | null;
  ecrire: (n: number) => string;
  ecart: {
    valeur: string;
    mention: string;
    sens: SensDUnEcart;
    nombre: number;
    ecrire: (n: number) => string;
  } | null;
} {
  const { courbe } = ep;
  const valeurs = semaines
    .slice(de, a + 1)
    .map((w) => w?.[courbe.cle])
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const nom = courbe.titre.replace(/,?\s*semaine par semaine\s*$/i, "");
  const periode = de === a ? `semaine ${de}` : `moyenne des semaines ${de} à ${a}`;
  if (valeurs.length === 0)
    return {
      libelle: `${nom} · ${periode}`,
      valeur: "—",
      nombre: null,
      ecrire: courbe.format,
      ecart: null,
    };
  const moyenne = valeurs.reduce((x, v) => x + v, 0) / valeurs.length;
  const indicateur = ep.indicateurs.find((ind) => ind.cle === courbe.cle);
  const d = moyenne - courbe.cible;
  const formatEcart = indicateur?.formatEcart ?? courbe.format;
  // La même plume pour la valeur finale et pour chaque image du compteur :
  // l'écart s'écrit signé, et le zéro de départ n'invente pas de signe.
  const ecrireEcart = (n: number) =>
    `${n > 1e-9 ? "+" : n < -1e-9 ? "−" : ""}${formatEcart(Math.abs(n))}`;
  const ecart =
    Math.abs(d) < 1e-9 || formatEcart(Math.abs(d)) === formatEcart(0)
      ? null
      : {
          valeur: ecrireEcart(d),
          mention: `face à la cible (${courbe.libelleCible})`,
          sens: indicateur
            ? ((indicateur.sensBon * d > 0 ? "gain" : "perte") as SensDUnEcart)
            : null,
          nombre: d,
          ecrire: ecrireEcart,
        };
  return {
    libelle: `${nom} · ${periode}`,
    valeur: courbe.format(moyenne),
    nombre: moyenne,
    ecrire: courbe.format,
    ecart,
  };
}
